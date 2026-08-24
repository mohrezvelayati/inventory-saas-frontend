import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { InventoryMovementModal } from './InventoryMovementModal'
import type { Product } from '../../types/api'

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

function renderModal(canCreateVariant: boolean) {
  return render(<QueryClientProvider client={new QueryClient()}><InventoryMovementModal products={products} canCreateVariant={canCreateVariant} onClose={vi.fn()} /></QueryClientProvider>)
}

describe('InventoryMovementModal', () => {
  it('shows products with no variants and hides new-size creation without catalog permission', () => {
    renderModal(false)

    fireEvent.change(screen.getByLabelText('محصول *'), { target: { value: '1' } })

    expect(screen.getByRole('option', { name: 'Jordan 1 Celadon' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'افزودن سایز جدید' })).not.toBeInTheDocument()
    expect(screen.getByText(/مجوز ساخت سایز جدید را ندارد/)).toBeInTheDocument()
  })

  it('suggests prices from the variant with the greatest id when creating a new size', () => {
    renderModal(true)

    fireEvent.change(screen.getByLabelText('محصول *'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('سایز *'), { target: { value: 'new' } })

    expect(screen.getByLabelText('قیمت خرید *')).toHaveValue(1100)
    expect(screen.getByLabelText('قیمت فروش *')).toHaveValue(1700)
  })
})
