import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAllCustomers } from '../features/customers/customersApi'
import { getAllProducts } from '../features/products/productApi'
import { createWantedProduct, deleteWantedProduct, getWantedCustomerRequests, getWantedProducts, updateWantedProduct } from '../features/wanted/wantedApi'
import type { Customer, Product, WantedProduct } from '../types/api'
import { RequestsPage } from './RequestsPage'

vi.mock('../features/customers/customersApi', () => ({ getAllCustomers: vi.fn() }))
vi.mock('../features/products/productApi', () => ({ getAllProducts: vi.fn() }))
vi.mock('../features/wanted/wantedApi', () => ({
  createWantedProduct: vi.fn(),
  deleteWantedProduct: vi.fn(),
  getWantedCustomerRequests: vi.fn(),
  getWantedProducts: vi.fn(),
  updateWantedProduct: vi.fn(),
}))

const product: Product = {
  id: 7,
  name: 'Nike Dunk Low',
  description: '',
  image: 'https://api.example.com/media/products/nike.png',
  categories: [],
  variants: [],
  created_at: '2026-10-18T08:00:00Z',
  updated_at: '2026-10-18T08:00:00Z',
}

const customer: Customer = {
  id: 12,
  full_name: 'علی رضایی',
  phone_number: '09121234567',
  gender: 'male',
  age: null,
  total_items_purchased: 0,
  created_at: '2026-10-18T08:00:00Z',
  updated_at: '2026-10-18T08:00:00Z',
}

const wanted: WantedProduct = {
  id: 4,
  product: 7,
  product_name: 'Nike Dunk Low',
  product_name_display: 'Nike Dunk Low',
  brand: 'Nike',
  size: '42',
  wanted_count: 2,
  cover_image: 'https://api.example.com/media/wanted/nike-cover.png',
  created_at: '2026-10-18T08:00:00Z',
}

const page = { count: 1, next: null, previous: null, results: [wanted] }

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter><RequestsPage /></MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('RequestsPage customer-linked wanted flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAllProducts).mockResolvedValue([product])
    vi.mocked(getAllCustomers).mockResolvedValue([customer])
    vi.mocked(getWantedProducts).mockResolvedValue(page)
    vi.mocked(createWantedProduct).mockResolvedValue(wanted)
    vi.mocked(deleteWantedProduct).mockResolvedValue(undefined)
    vi.mocked(updateWantedProduct).mockResolvedValue(wanted)
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:wanted-preview') })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
    vi.mocked(getWantedCustomerRequests).mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: [
        {
          id: 20,
          customer: 12,
          customer_name: 'علی رضایی',
          customer_phone_number: '09121234567',
          created_by: 1,
          created_by_name: 'مدیر فروشگاه',
          image: 'https://api.example.com/media/wanted/nike.png',
          created_at: '2026-10-18T10:00:00Z',
        },
        {
          id: 19,
          customer: null,
          customer_name: null,
          customer_phone_number: null,
          created_by: null,
          created_by_name: null,
          image: null,
          created_at: '2026-10-17T10:00:00Z',
        },
      ],
    })
  })

  it('requires a customer and sends its id when creating a request', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'ثبت درخواست جدید' }))

    fireEvent.change(await screen.findByLabelText('نام محصول *'), { target: { value: 'Nike Dunk Low' } })
    fireEvent.change(screen.getByLabelText('سایز *'), { target: { value: '42' } })
    fireEvent.click(screen.getByRole('button', { name: 'ثبت درخواست' }))
    expect(screen.getByText('انتخاب مشتری ضروری است.')).toBeInTheDocument()
    expect(createWantedProduct).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('مشتری *'), { target: { value: '12' } })
    fireEvent.change(screen.getByLabelText('برند'), { target: { value: 'Nike' } })
    fireEvent.click(screen.getByRole('button', { name: 'ثبت درخواست' }))

    await waitFor(() => expect(vi.mocked(createWantedProduct).mock.calls[0][0]).toEqual({
      customer: 12,
      product: null,
      product_name: 'Nike Dunk Low',
      brand: 'Nike',
      size: '42',
    }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('prefers the wanted cover image on a wanted card', async () => {
    renderPage()

    expect(await screen.findByRole('img', { name: 'تصویر Nike Dunk Low' })).toHaveAttribute('src', wanted.cover_image)
    expect(screen.queryByText('👟')).not.toBeInTheDocument()
  })

  it('falls back to the linked catalog product image without a wanted cover', async () => {
    vi.mocked(getWantedProducts).mockResolvedValueOnce({ ...page, results: [{ ...wanted, cover_image: null }] })
    renderPage()

    expect(await screen.findByRole('img', { name: 'تصویر Nike Dunk Low' })).toHaveAttribute('src', product.image)
  })

  it('shows current and legacy customer history safely', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'تاریخچه مشتریان' }))

    expect(await screen.findByText('علی رضایی')).toBeInTheDocument()
    expect(screen.getByText('09121234567')).toBeInTheDocument()
    expect(screen.getByText('ثبت‌کننده: مدیر فروشگاه')).toBeInTheDocument()
    expect(screen.getByText('مشتری حذف‌شده یا نامشخص')).toBeInTheDocument()
    expect(screen.getByText('شماره تماس در دسترس نیست')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'عکس مرجع Nike Dunk Low' })).toHaveAttribute('loading', 'lazy')
    expect(screen.getByRole('link', { name: 'مشاهده عکس مرجع Nike Dunk Low' })).toHaveAttribute('target', '_blank')
    expect(screen.getByLabelText('بدون عکس مرجع')).toBeInTheDocument()
    expect(getWantedCustomerRequests).toHaveBeenCalledWith(4, 1)
  })

  it('previews and clears a wanted image and rejects files over 5 MB', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'ثبت درخواست جدید' }))
    const input = screen.getByLabelText(/^عکس مرجع کالا/)
    const image = new File(['image'], 'wanted-shoe.png', { type: 'image/png' })

    fireEvent.change(input, { target: { files: [image] } })
    expect(screen.getByRole('img', { name: 'پیش‌نمایش عکس مرجع کالا' })).toHaveAttribute('src', 'blob:wanted-preview')
    fireEvent.click(screen.getByRole('button', { name: /حذف عکس انتخاب‌شده/ }))
    expect(screen.queryByRole('img', { name: 'پیش‌نمایش عکس مرجع کالا' })).not.toBeInTheDocument()
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:wanted-preview'))

    const oversizedImage = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' })
    fireEvent.change(input, { target: { files: [oversizedImage] } })
    expect(screen.getByText('حجم تصویر نباید بیشتر از ۵ مگابایت باشد.')).toBeInTheDocument()
  })
})
