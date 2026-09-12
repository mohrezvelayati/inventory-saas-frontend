import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppShell } from '../components/AppShell'
import { AuthContext, type AuthContextValue } from '../features/auth/auth-context'
import { getDashboard } from '../features/dashboard/dashboardApi'
import type { CurrentUser } from '../types/api'
import { LoginPage } from './AuthPages'

vi.mock('../features/dashboard/dashboardApi', () => ({ getDashboard: vi.fn() }))

const demoUser: CurrentUser = {
  id: 1,
  username: 'portfolio_demo',
  full_name: 'مدیر فروشگاه دمو',
  phone_number: '09000000001',
  is_demo: true,
  membership: {
    id: 1,
    role: 'manager',
    store: { id: 1, name: 'فروشگاه دمو انبارینو' },
    permissions: ['view_dashboard'],
  },
}

const makeAuth = (overrides: Partial<AuthContextValue> = {}): AuthContextValue => ({
  user: null,
  status: 'anonymous',
  login: vi.fn(),
  loginDemo: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(),
  ...overrides,
})

describe('public demo experience', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getDashboard).mockResolvedValue({
      sales: { orders_count: 0, revenue: '0', discount: '0' },
      inventory: { total_variants: 0, total_stock: 0 },
      low_stock: [],
      products: [],
      wanted: [],
    })
  })

  it('logs in through the demo button without credentials', async () => {
    const loginDemo = vi.fn().mockResolvedValue(demoUser)
    const auth = makeAuth({ loginDemo })

    render(
      <AuthContext.Provider value={auth}>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<div>داشبورد دمو</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'ورود به نسخهٔ نمایشی' }))

    await waitFor(() => expect(loginDemo).toHaveBeenCalledOnce())
    expect(await screen.findByText('داشبورد دمو')).toBeInTheDocument()
  })

  it('shows the shared-account warning only for the demo user', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={makeAuth({ user: demoUser, status: 'authenticated' })}>
          <MemoryRouter initialEntries={['/']}>
            <Routes><Route element={<AppShell />}><Route index element={<div>Home</div>} /></Route></Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>,
    )

    expect(screen.getByText('نسخهٔ نمایشی عمومی')).toBeInTheDocument()

    rerender(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={makeAuth({ user: { ...demoUser, is_demo: false }, status: 'authenticated' })}>
          <MemoryRouter initialEntries={['/']}>
            <Routes><Route element={<AppShell />}><Route index element={<div>Home</div>} /></Route></Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>,
    )

    expect(screen.queryByText('نسخهٔ نمایشی عمومی')).not.toBeInTheDocument()
  })
})
