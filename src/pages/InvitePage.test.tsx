import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext } from '../features/auth/auth-context'
import type { AuthContextValue } from '../features/auth/auth-context'
import { ApiError } from '../lib/api'
import { InvitePage } from './InvitePage'
import { acceptInvitation, previewInvitation, registerWithInvitation } from '../features/stores/invitationsApi'

vi.mock('../features/stores/invitationsApi', async (importOriginal) => {
  const original = await importOriginal<typeof import('../features/stores/invitationsApi')>()
  return {
    ...original,
    previewInvitation: vi.fn(),
    registerWithInvitation: vi.fn(),
    acceptInvitation: vi.fn(),
  }
})

const preview = {
  store_name: 'کفش آریا',
  role: 'seller' as const,
  masked_phone_number: '0912***6789',
  expires_at: '2026-08-29T12:00:00Z',
}

function renderPage(authOverrides: Partial<AuthContextValue> = {}) {
  const auth: AuthContextValue = {
    user: null,
    status: 'anonymous',
    login: vi.fn(),
    loginDemo: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    ...authOverrides,
  }
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={auth}>
        <MemoryRouter initialEntries={['/invite/test-token']}>
          <Routes>
            <Route path="/invite/:token" element={<InvitePage />} />
            <Route path="/" element={<div>داشبورد</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
  return auth
}

describe('InvitePage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows valid invite details and an existing-account login link', async () => {
    vi.mocked(previewInvitation).mockResolvedValue(preview)
    renderPage()

    expect(await screen.findByText('دعوت به کفش آریا')).toBeInTheDocument()
    expect(screen.getByDisplayValue('0912***6789')).toHaveAttribute('readonly')
    expect(screen.getByRole('link', { name: 'وارد شوید' })).toHaveAttribute('href', '/login?next=%2Finvite%2Ftest-token')
  })

  it('shows a terminal message for an expired invitation', async () => {
    vi.mocked(previewInvitation).mockRejectedValue(new ApiError(400, { detail: 'expired', code: 'expired' }))
    renderPage()

    expect(await screen.findByText('دعوت در دسترس نیست')).toBeInTheDocument()
    expect(screen.getByText('اعتبار این لینک دعوت به پایان رسیده است.')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('نام کاربری')).not.toBeInTheDocument()
  })

  it('registers a new invitee, refreshes auth, and opens the dashboard', async () => {
    vi.mocked(previewInvitation).mockResolvedValue(preview)
    vi.mocked(registerWithInvitation).mockResolvedValue({ access: 'a', refresh: 'r' })
    const auth = renderPage({ refreshUser: vi.fn().mockResolvedValue({}) })

    await screen.findByText('دعوت به کفش آریا')
    fireEvent.change(screen.getByPlaceholderText('نام و نام خانوادگی'), { target: { value: 'فروشنده تست' } })
    fireEvent.change(screen.getByPlaceholderText('نام کاربری'), { target: { value: 'test-seller' } })
    fireEvent.change(screen.getByPlaceholderText('رمز عبور (حداقل ۸ کاراکتر)'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /ساخت حساب و پذیرش دعوت/ }))

    await waitFor(() => expect(registerWithInvitation).toHaveBeenCalledWith('test-token', {
      full_name: 'فروشنده تست',
      username: 'test-seller',
      password: 'password123',
    }))
    expect(auth.refreshUser).toHaveBeenCalled()
    expect(await screen.findByText('داشبورد')).toBeInTheDocument()
  })

  it('accepts the invitation automatically for a logged-in matching account', async () => {
    vi.mocked(previewInvitation).mockResolvedValue(preview)
    vi.mocked(acceptInvitation).mockResolvedValue({})
    const auth = renderPage({
      status: 'authenticated',
      user: { id: 9, username: 'seller', full_name: 'Seller', phone_number: '09123456789', is_demo: false, membership: null },
      refreshUser: vi.fn().mockResolvedValue({}),
    })

    await waitFor(() => expect(acceptInvitation).toHaveBeenCalledWith('test-token'))
    expect(auth.refreshUser).toHaveBeenCalled()
    expect(await screen.findByText('داشبورد')).toBeInTheDocument()
  })
})
