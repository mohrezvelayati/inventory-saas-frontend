import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../lib/api'
import type { BatchPurchaseResponse, Product } from '../../types/api'
import { BatchPurchaseModal } from './BatchPurchaseModal'
import { createBatchPurchase } from './inventoryApi'

vi.mock('./inventoryApi', async (importOriginal) => ({
  ...await importOriginal<typeof import('./inventoryApi')>(),
  createBatchPurchase: vi.fn(),
}))

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

const response: BatchPurchaseResponse = {
  product: 2,
  items: [
    { movement: 10, variant: 4, size: '40', quantity: 2, current_stock: 3 },
    { movement: 11, variant: 8, size: '42', quantity: 1, current_stock: 1 },
  ],
}

function renderModal(onSuccess = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <BatchPurchaseModal products={products} onClose={vi.fn()} onSuccess={onSuccess} />
    </QueryClientProvider>,
  )
  return { queryClient, onSuccess }
}

function selectAirMax() {
  fireEvent.change(screen.getByLabelText('محصول *'), { target: { value: '2' } })
}

describe('BatchPurchaseModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createBatchPurchase).mockResolvedValue(response)
  })

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

  it('submits the API payload and invalidates all affected queries', async () => {
    const { queryClient, onSuccess } = renderModal()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    selectAirMax()

    fireEvent.click(screen.getByRole('button', { name: 'افزایش سایز 40' }))
    fireEvent.click(screen.getByRole('button', { name: 'افزایش سایز 40' }))
    fireEvent.click(screen.getByRole('button', { name: 'افزایش سایز 42' }))
    fireEvent.change(screen.getByLabelText('قیمت خرید مشترک *'), { target: { value: '4000000' } })
    fireEvent.change(screen.getByLabelText('قیمت فروش مشترک *'), { target: { value: '5800000' } })
    fireEvent.change(screen.getByLabelText('یادداشت'), { target: { value: 'محموله جدید' } })
    fireEvent.click(screen.getByRole('button', { name: 'ثبت همه' }))

    await waitFor(() => expect(createBatchPurchase).toHaveBeenCalledWith({
      product: 2,
      purchase_price: 4000000,
      sale_price: 5800000,
      note: 'محموله جدید',
      items: [
        { size: '40', quantity: 2 },
        { size: '42', quantity: 1 },
      ],
    }))
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(response))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['inventory'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['inventory-history'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['products'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['product', 2] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['dashboard'] })
  })

  it('omits shared prices for existing sizes and displays backend errors', async () => {
    vi.mocked(createBatchPurchase).mockRejectedValueOnce(new ApiError(400, { items: ['Each size may appear only once.'] }))
    const { onSuccess } = renderModal()
    selectAirMax()

    fireEvent.click(screen.getByRole('button', { name: 'افزایش سایز 40' }))
    fireEvent.click(screen.getByRole('button', { name: 'ثبت همه' }))

    await waitFor(() => expect(createBatchPurchase).toHaveBeenCalledWith({
      product: 2,
      note: '',
      items: [{ size: '40', quantity: 1 }],
    }))
    expect(await screen.findByText('Each size may appear only once.')).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'ورود گروهی خرید' })).toBeInTheDocument()
  })
})
