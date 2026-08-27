import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../features/auth/auth-context'
import { getProduct, updateProductSalePrice } from '../features/products/productApi'
import { ApiError } from '../lib/api'
import type { PermissionCode, Product } from '../types/api'
import { ProductDetailPage } from './DetailPages'

vi.mock('../features/products/productApi', async (importOriginal) => ({
  ...await importOriginal<typeof import('../features/products/productApi')>(),
  getProduct: vi.fn(),
  updateProductSalePrice: vi.fn(),
}))

const product: Product = {
  id: 7,
  name: 'Jordan 1 Celadon',
  description: '',
  categories: [],
  created_at: '2026-08-27T10:00:00Z',
  updated_at: '2026-08-27T10:00:00Z',
  variants: [
    { id: 40, size: '40', purchase_price: '4000000', sale_price: '5200000', current_stock: 2 },
    { id: 41, size: '41', purchase_price: '4100000', sale_price: '5300000', current_stock: 1 },
  ],
}

function renderDetail(permissions: PermissionCode[], value: Product = product) {
  vi.mocked(getProduct).mockResolvedValue(value)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const auth: AuthContextValue = {
    status: 'authenticated',
    user: {
      id: 1,
      username: 'manager',
      full_name: 'مدیر',
      phone_number: '09123456789',
      membership: { id: 1, role: 'manager', permissions, store: { id: 1, name: 'فروشگاه تست' } },
    },
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
  }

  render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={auth}>
        <MemoryRouter initialEntries={['/products/7']}>
          <Routes><Route path="/products/:productId" element={<ProductDetailPage />} /></Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
  return queryClient
}

describe('ProductDetailPage bulk sale-price update', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the bulk-price button for manage_catalog', async () => {
    renderDetail(['manage_catalog'])

    expect(await screen.findByRole('button', { name: /تغییر قیمت همه سایزها/ })).toBeInTheDocument()
  })

  it('does not show the bulk-price button without manage_catalog', async () => {
    renderDetail([])

    await screen.findByText('Jordan 1 Celadon')
    expect(screen.queryByRole('button', { name: /تغییر قیمت همه سایزها/ })).not.toBeInTheDocument()
  })

  it('does not show the bulk-price button for a product without variants', async () => {
    renderDetail(['manage_catalog'], { ...product, variants: [] })

    await screen.findByText('Jordan 1 Celadon')
    expect(screen.queryByRole('button', { name: /تغییر قیمت همه سایزها/ })).not.toBeInTheDocument()
  })

  it('submits one price, prevents duplicate submission, and shows success', async () => {
    const updatedProduct: Product = {
      ...product,
      updated_at: '2026-08-27T11:00:00Z',
      variants: product.variants.map((variant) => ({ ...variant, sale_price: '5800000' })),
    }
    let resolveUpdate!: (value: Product) => void
    vi.mocked(updateProductSalePrice).mockImplementation(() => new Promise((resolve) => { resolveUpdate = resolve }))
    vi.mocked(getProduct).mockResolvedValueOnce(product).mockResolvedValue(updatedProduct)
    const queryClient = renderDetail(['manage_catalog'])
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    fireEvent.click(await screen.findByRole('button', { name: /تغییر قیمت همه سایزها/ }))
    fireEvent.change(screen.getByLabelText('قیمت فروش جدید (تومان) *'), { target: { value: '5800000' } })
    const submitButton = screen.getByRole('button', { name: /اعمال قیمت برای همه سایزها/ })
    fireEvent.click(submitButton)

    await waitFor(() => expect(updateProductSalePrice).toHaveBeenCalledWith(7, { sale_price: 5800000 }))
    expect(submitButton).toBeDisabled()
    await act(async () => resolveUpdate(updatedProduct))

    expect(await screen.findByText('قیمت فروش تمام سایزها با موفقیت تغییر کرد.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['product', 7] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['products'] })
    })
  })

  it('validates empty and negative prices and displays a backend field error', async () => {
    vi.mocked(updateProductSalePrice).mockRejectedValue(new ApiError(400, { sale_price: ['این قیمت از سمت سرور پذیرفته نشد.'] }))
    renderDetail(['manage_catalog'])

    fireEvent.click(await screen.findByRole('button', { name: /تغییر قیمت همه سایزها/ }))
    const input = screen.getByLabelText('قیمت فروش جدید (تومان) *')
    const submitButton = screen.getByRole('button', { name: /اعمال قیمت برای همه سایزها/ })

    fireEvent.click(submitButton)
    expect(screen.getByText('قیمت فروش جدید را وارد کنید.')).toBeInTheDocument()
    fireEvent.change(input, { target: { value: '-1' } })
    fireEvent.click(submitButton)
    expect(screen.getByText('قیمت فروش نمی‌تواند منفی باشد.')).toBeInTheDocument()
    expect(updateProductSalePrice).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: '5800000' } })
    fireEvent.click(submitButton)
    expect(await screen.findByText('این قیمت از سمت سرور پذیرفته نشد.')).toBeInTheDocument()
  })
})
