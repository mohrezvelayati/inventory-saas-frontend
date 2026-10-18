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
          created_at: '2026-10-18T10:00:00Z',
        },
        {
          id: 19,
          customer: null,
          customer_name: null,
          customer_phone_number: null,
          created_by: null,
          created_by_name: null,
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

  it('shows current and legacy customer history safely', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'تاریخچه مشتریان' }))

    expect(await screen.findByText('علی رضایی')).toBeInTheDocument()
    expect(screen.getByText('09121234567')).toBeInTheDocument()
    expect(screen.getByText('ثبت‌کننده: مدیر فروشگاه')).toBeInTheDocument()
    expect(screen.getByText('مشتری حذف‌شده یا نامشخص')).toBeInTheDocument()
    expect(screen.getByText('شماره تماس در دسترس نیست')).toBeInTheDocument()
    expect(getWantedCustomerRequests).toHaveBeenCalledWith(4, 1)
  })
})
