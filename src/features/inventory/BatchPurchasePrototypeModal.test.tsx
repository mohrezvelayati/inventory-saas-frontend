import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Product } from '../../types/api'
import { BatchPurchasePrototypeModal, type BatchPurchasePrototypePayload } from './BatchPurchasePrototypeModal'

const products: Product[] = [
  {
    id: 1,
    name: 'Jordan 1 Celadon',
    description: '',
    categories: [],
    created_at: '',
    updated_at: '',
    variants: [],
  },
  {
    id: 2,
    name: 'Air Max',
    description: '',
    categories: [],
    created_at: '',
    updated_at: '',
    variants: [
      { id: 4, size: '40', purchase_price: '900', sale_price: '1400', current_stock: 1 },
      { id: 7, size: '41', purchase_price: '1100', sale_price: '1700', current_stock: 2 },
    ],
  },
]

function renderModal(onPrototypeSubmit?: (payload: BatchPurchasePrototypePayload) => Promise<BatchPurchasePrototypePayload>) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <BatchPurchasePrototypeModal products={products} onClose={vi.fn()} onPrototypeSubmit={onPrototypeSubmit} />
    </QueryClientProvider>,
  )
}

function selectAirMax() {
  fireEvent.change(screen.getByLabelText('محصول *'), { target: { value: '2' } })
}

describe('BatchPurchasePrototypeModal', () => {
  it('keeps submit disabled without selection and identifies existing and new sizes', () => {
    renderModal()

    expect(screen.getByRole('button', { name: 'ثبت همه' })).toBeDisabled()
    selectAirMax()

    expect(within(screen.getByRole('button', { name: 'افزایش سایز 40' })).getByText(/موجودی فعلی/)).toBeInTheDocument()
    expect(within(screen.getByRole('button', { name: 'افزایش سایز 42' })).getByText('جدید')).toBeInTheDocument()
  })

  it('increments with repeated clicks, decrements, removes, and clears selections', () => {
    renderModal()
    selectAirMax()

    const size40 = screen.getByRole('button', { name: 'افزایش سایز 40' })
    fireEvent.click(size40)
    fireEvent.click(size40)
    fireEvent.click(size40)
    let selected40 = screen.getByLabelText('انتخاب سایز 40')
    expect(within(selected40).getByText('۳')).toBeInTheDocument()

    fireEvent.click(within(selected40).getByRole('button', { name: 'کم‌کردن تعداد سایز 40' }))
    selected40 = screen.getByLabelText('انتخاب سایز 40')
    expect(within(selected40).getByText('۲')).toBeInTheDocument()
    fireEvent.click(within(selected40).getByRole('button', { name: 'حذف سایز 40' }))
    expect(screen.queryByLabelText('انتخاب سایز 40')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'افزایش سایز 41' }))
    fireEvent.click(screen.getByRole('button', { name: 'پاک‌کردن همه' }))
    expect(screen.queryByLabelText('انتخاب سایز 41')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ثبت همه' })).toBeDisabled()
  })

  it('shows suggested shared prices only while a new size is selected', () => {
    renderModal()
    selectAirMax()

    expect(screen.queryByLabelText('قیمت خرید مشترک *')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'افزایش سایز 40' }))
    expect(screen.queryByLabelText('قیمت خرید مشترک *')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'افزایش سایز 42' }))
    expect(screen.getByLabelText('قیمت خرید مشترک *')).toHaveValue(1100)
    expect(screen.getByLabelText('قیمت فروش مشترک *')).toHaveValue(1700)

    fireEvent.click(screen.getByRole('button', { name: 'حذف سایز 42' }))
    expect(screen.queryByLabelText('قیمت خرید مشترک *')).not.toBeInTheDocument()
  })

  it('builds the future API payload in a mock mutation and shows success', async () => {
    const submitPrototype = vi.fn(async (payload: BatchPurchasePrototypePayload) => payload)
    renderModal(submitPrototype)
    selectAirMax()

    fireEvent.click(screen.getByRole('button', { name: 'افزایش سایز 40' }))
    fireEvent.click(screen.getByRole('button', { name: 'افزایش سایز 40' }))
    fireEvent.click(screen.getByRole('button', { name: 'افزایش سایز 42' }))
    fireEvent.change(screen.getByLabelText('قیمت خرید مشترک *'), { target: { value: '4000000' } })
    fireEvent.change(screen.getByLabelText('قیمت فروش مشترک *'), { target: { value: '5800000' } })
    fireEvent.change(screen.getByLabelText('یادداشت'), { target: { value: 'محموله جدید' } })
    fireEvent.click(screen.getByRole('button', { name: 'ثبت همه' }))

    await waitFor(() => expect(submitPrototype).toHaveBeenCalledWith({
      product: 2,
      purchase_price: 4000000,
      sale_price: 5800000,
      note: 'محموله جدید',
      items: [
        { size: '40', quantity: 2 },
        { size: '42', quantity: 1 },
      ],
    }))
    expect(await screen.findByText(/هیچ درخواستی به سرور ارسال نشد/)).toBeInTheDocument()
  })
})
