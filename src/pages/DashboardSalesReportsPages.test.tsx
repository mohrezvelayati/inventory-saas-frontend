import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../features/auth/auth-context'
import { getDashboard, getReports } from '../features/dashboard/dashboardApi'
import { getAllCustomers } from '../features/customers/customersApi'
import { getAllProducts } from '../features/products/productApi'
import { getSales } from '../features/sales/salesApi'
import type { Sale } from '../types/api'
import { HomePage } from './HomePage'
import { ReportsPage } from './ReportsPage'
import { SaleCreatePage } from './SaleCreatePage'
import { SalesPage } from './SalesPage'

vi.mock('../features/dashboard/dashboardApi', () => ({ getDashboard: vi.fn(), getReports: vi.fn() }))
vi.mock('../features/customers/customersApi', async (importOriginal) => ({ ...await importOriginal<typeof import('../features/customers/customersApi')>(), getAllCustomers: vi.fn() }))
vi.mock('../features/products/productApi', async (importOriginal) => ({ ...await importOriginal<typeof import('../features/products/productApi')>(), getAllProducts: vi.fn() }))
vi.mock('../features/sales/salesApi', async (importOriginal) => ({ ...await importOriginal<typeof import('../features/sales/salesApi')>(), getSales: vi.fn() }))

const dashboard = {
  sales: { orders_count: 2, revenue: '5000', discount: '200' },
  inventory: { total_variants: 3, total_stock: 9 },
  low_stock: [],
  products: [],
  wanted: [],
}

const report = {
  period: { date_from: '2026-08-27', date_to: '2026-08-27' },
  sales: { orders_count: 2, revenue: '5000', discount: '200', cost: '3000', gross_profit: '2000', average_order: '2500' },
  daily: [{ date: '2026-08-27', orders_count: 2, revenue: '5000' }],
  channels: [],
  products: [],
  inventory: { total_variants: 3, total_stock: 9, low_stock_count: 0, out_of_stock_count: 0, purchase_value: '3000', retail_value: '5000' },
}

const completedSale: Sale = {
  id: 12,
  sale_number: 3,
  customer: null,
  customer_name: null,
  channel: 'store',
  payment_method: 'card',
  status: 'completed',
  total_amount: '5800000',
  items: [],
  created_at: '2026-09-24T08:00:00Z',
  completed_at: '2026-09-24T08:15:00Z',
}

const draftSale: Sale = {
  ...completedSale,
  id: 13,
  sale_number: null,
  status: 'draft',
  completed_at: null,
}

function renderPage(page: React.ReactNode, withAuth = false) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const content = <QueryClientProvider client={queryClient}><MemoryRouter>{page}</MemoryRouter></QueryClientProvider>
  if (!withAuth) return render(content)
  const auth: AuthContextValue = {
    status: 'authenticated',
    user: {
      id: 1,
      username: 'manager',
      full_name: 'مدیر',
      phone_number: '09123456789',
      is_demo: false,
      membership: { id: 1, role: 'manager', permissions: ['view_dashboard'], store: { id: 1, name: 'فروشگاه تست' } },
    },
    login: vi.fn(),
    loginDemo: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
  }
  return render(<AuthContext.Provider value={auth}>{content}</AuthContext.Provider>)
}

describe('dashboard, sales, and reports UI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getDashboard).mockResolvedValue(dashboard)
    vi.mocked(getReports).mockResolvedValue(report)
    vi.mocked(getSales).mockResolvedValue({ count: 0, next: null, previous: null, results: [] })
    vi.mocked(getAllProducts).mockResolvedValue([])
    vi.mocked(getAllCustomers).mockResolvedValue([])
  })

  it('puts customer first in quick access, removes inventory, and shows today profit', async () => {
    renderPage(<HomePage />, true)

    expect(await screen.findByText('سود امروز')).toBeInTheDocument()
    expect(screen.getByText('۲٬۰۰۰')).toBeInTheDocument()
    const quickActions = screen.getByText('دسترسی سریع').nextElementSibling as HTMLElement
    const links = within(quickActions).getAllByRole('link')
    expect(links[0]).toHaveTextContent('افزودن مشتری')
    expect(links[0]).toHaveAttribute('href', '/customers')
    expect(within(quickActions).queryByText('افزودن موجودی')).not.toBeInTheDocument()
    expect(within(quickActions).getByRole('link', { name: /ثبت فروش/ })).not.toHaveClass('quick-action--primary')
  })

  it('removes the floating plus button from the sales list', async () => {
    renderPage(<SalesPage />)

    await screen.findByText(/فروش‌ها/)
    expect(screen.queryByLabelText('ثبت فروش')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ثبت فروش جدید/ })).toBeInTheDocument()
  })

  it('shows store sale numbers while keeping internal ids in links', async () => {
    vi.mocked(getSales).mockResolvedValueOnce({ count: 2, next: null, previous: null, results: [completedSale, draftSale] })
    renderPage(<SalesPage />)

    const completedLink = await screen.findByRole('link', { name: /فروش #۳/ })
    expect(completedLink).toHaveAttribute('href', '/sales/12')
    expect(screen.queryByText('فروش #۱۲')).not.toBeInTheDocument()
    expect(screen.getByText('پیش‌نویس فروش')).toBeInTheDocument()
  })

  it('adds a today report preset and labels gross profit as profit', async () => {
    renderPage(<ReportsPage />)

    const todayButton = await screen.findByRole('button', { name: 'امروز' })
    todayButton.click()

    await waitFor(() => {
      const [dateFrom, dateTo] = vi.mocked(getReports).mock.calls.at(-1) ?? []
      expect(dateFrom).toBe(dateTo)
    })
    expect(await screen.findByText('سود')).toBeInTheDocument()
    expect(screen.queryByText('سود ناخالص')).not.toBeInTheDocument()
  })

  it('places add-to-invoice after customer information and before invoice items', async () => {
    renderPage(<SaleCreatePage />)

    const customerDetails = await screen.findByText('اطلاعات مشتری')
    const addToInvoice = await screen.findByRole('button', { name: /افزودن به فاکتور/ })
    const invoiceItems = screen.getByText(/اقلام فاکتور/)
    expect(customerDetails.compareDocumentPosition(addToInvoice) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(addToInvoice.compareDocumentPosition(invoiceItems) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.queryByText('اطلاعات فروش')).not.toBeInTheDocument()
  })
})
