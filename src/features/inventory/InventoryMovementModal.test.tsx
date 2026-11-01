import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InventoryMovementModal } from './InventoryMovementModal'
import type { Product } from '../../types/api'
import { createInventoryEntry } from './inventoryApi'

vi.mock('./inventoryApi', async (importOriginal) => ({
  ...await importOriginal<typeof import('./inventoryApi')>(),
  createInventoryEntry: vi.fn(),
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
      { id: 4, size: '40', without_size: false, purchase_price: '900', sale_price: '1400', current_stock: 1 },
      { id: 7, size: '41', without_size: false, purchase_price: '1100', sale_price: '1700', current_stock: 2 },
    ],
  },
  {
    id: 3,
    name: 'کمربند چرمی',
    description: '',
    categories: [],
    created_at: '',
    updated_at: '',
    variants: [
      { id: 8, size: null, without_size: true, purchase_price: '500', sale_price: '800', current_stock: 4 },
    ],
  },
]

function renderModal(canCreateVariant: boolean) {
  return render(<QueryClientProvider client={new QueryClient()}><InventoryMovementModal products={products} canCreateVariant={canCreateVariant} onClose={vi.fn()} /></QueryClientProvider>)
}

describe('InventoryMovementModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createInventoryEntry).mockResolvedValue({ movement: { id: 1, variant: 1, quantity: 1, movement_type: 'purchase', note: '', created_at: '' }, variant: undefined })
  })

  it('shows products with no variants and hides new-size creation without catalog permission', () => {
    renderModal(false)

    fireEvent.change(screen.getByLabelText('محصول *'), { target: { value: '1' } })

    expect(screen.getByRole('option', { name: 'Jordan 1 Celadon' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'افزودن سایز جدید' })).not.toBeInTheDocument()
    expect(screen.getByText(/مجوز ساخت آن را ندارد/)).toBeInTheDocument()
  })

  it('suggests prices from the variant with the greatest id when creating a new size', () => {
    renderModal(true)

    fireEvent.change(screen.getByLabelText('محصول *'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('سایز / نوع موجودی *'), { target: { value: 'new' } })
    fireEvent.click(screen.getByRole('button', { name: 'کتونی' }))
    expect(screen.getByRole('button', { name: 'سایز 40 از قبل موجود است' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'انتخاب سایز 42' }))

    expect(screen.getByLabelText('قیمت خرید *')).toHaveValue(1100)
    expect(screen.getByLabelText('قیمت فروش *')).toHaveValue(1700)
    expect(screen.getByText('یک هزار و صد تومان')).toBeInTheDocument()
    expect(screen.getByText('یک هزار و هفتصد تومان')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('قیمت خرید *'), { target: { value: '1000000' } })
    expect(screen.getByText('یک میلیون تومان')).toBeInTheDocument()
  })

  it('creates a sizeless variant and sends the correct inventory entry payload', async () => {
    renderModal(true)

    fireEvent.change(screen.getByLabelText('محصول *'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('سایز / نوع موجودی *'), { target: { value: 'new-sizeless' } })
    fireEvent.change(screen.getByLabelText('قیمت خرید *'), { target: { value: '500000' } })
    fireEvent.change(screen.getByLabelText('قیمت فروش *'), { target: { value: '800000' } })
    fireEvent.change(screen.getByLabelText('تعداد *'), { target: { value: '3' } })
    fireEvent.change(screen.getByLabelText('یادداشت'), { target: { value: 'خرید اولیه' } })
    fireEvent.click(screen.getByRole('button', { name: /ثبت موجودی/ }))

    await waitFor(() => expect(vi.mocked(createInventoryEntry).mock.calls[0]?.[0]).toEqual({
      productId: 1,
      variantId: undefined,
      newVariant: { without_size: true, purchase_price: '500000', sale_price: '800000' },
      quantity: 3,
      movement_type: 'purchase',
      note: 'خرید اولیه',
    }))
  })

  it('shows and uses an existing sizeless variant without offering a sized variant', () => {
    renderModal(true)

    fireEvent.change(screen.getByLabelText('محصول *'), { target: { value: '3' } })

    expect(screen.getByRole('option', { name: 'بدون سایز — موجودی ۴' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'افزودن سایز جدید' })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'ثبت محصول بدون سایز' })).not.toBeInTheDocument()
  })
})
