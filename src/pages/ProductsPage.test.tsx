import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAllInventory } from '../features/inventory/inventoryApi'
import { createProduct, getAllCategories, getProducts } from '../features/products/productApi'
import { ApiError } from '../lib/api'
import type { Product } from '../types/api'
import { ProductsPage } from './ProductsPage'

vi.mock('../features/products/productApi', () => ({
  createProduct: vi.fn(),
  getAllCategories: vi.fn(),
  getProducts: vi.fn(),
}))

vi.mock('../features/inventory/inventoryApi', () => ({
  getAllInventory: vi.fn(),
}))

const products: Product[] = [
  {
    id: 1,
    name: 'Jordan Image',
    description: '',
    image: 'https://api.example.com/media/products/jordan.png',
    categories: [],
    variants: [],
    created_at: '',
    updated_at: '',
  },
  {
    id: 2,
    name: 'Jordan Fallback',
    description: '',
    image: null,
    categories: [],
    variants: [],
    created_at: '',
    updated_at: '',
  },
]

function renderPage() {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
      <MemoryRouter><ProductsPage /></MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ProductsPage product images', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getProducts).mockResolvedValue({ count: products.length, next: null, previous: null, results: products })
    vi.mocked(getAllCategories).mockResolvedValue([])
    vi.mocked(getAllInventory).mockResolvedValue([])
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:product-preview') })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
  })

  it('shows a product image and keeps the emoji fallback for products without one', async () => {
    renderPage()

    expect(await screen.findByRole('img', { name: 'تصویر Jordan Image' })).toHaveAttribute('src', products[0].image)
    expect(screen.getByRole('img', { name: 'تصویر پیش‌فرض Jordan Fallback' })).toBeInTheDocument()
    expect(screen.queryByText('👟')).not.toBeInTheDocument()
  })

  it('previews and clears a selected image and rejects files over 5 MB', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /افزودن محصول جدید/ }))
    await screen.findByRole('dialog', { name: 'افزودن محصول' })
    const input = screen.getByLabelText(/^تصویر محصول/)
    const image = new File(['image'], 'shoe.png', { type: 'image/png' })

    fireEvent.change(input, { target: { files: [image] } })

    expect(screen.getByRole('img', { name: 'پیش‌نمایش تصویر محصول' })).toHaveAttribute('src', 'blob:product-preview')
    fireEvent.click(screen.getByRole('button', { name: /پاک‌کردن تصویر/ }))
    expect(screen.queryByRole('img', { name: 'پیش‌نمایش تصویر محصول' })).not.toBeInTheDocument()
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:product-preview'))

    const oversizedImage = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' })
    fireEvent.change(input, { target: { files: [oversizedImage] } })

    expect(screen.getByText('حجم تصویر نباید بیشتر از ۵ مگابایت باشد.')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'پیش‌نمایش تصویر محصول' })).not.toBeInTheDocument()
  })

  it('shows the backend image field error while creating a product', async () => {
    vi.mocked(createProduct).mockRejectedValue(new ApiError(400, { image: ['تصویر معتبر نیست.'] }))
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /افزودن محصول جدید/ }))
    fireEvent.change(screen.getByLabelText('نام محصول *'), { target: { value: 'Jordan' } })
    fireEvent.click(screen.getByRole('button', { name: /ثبت محصول/ }))

    expect(await screen.findByText('تصویر معتبر نیست.')).toBeInTheDocument()
    await waitFor(() => expect(createProduct).toHaveBeenCalled())
  })
})
