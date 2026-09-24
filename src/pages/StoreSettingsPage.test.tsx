import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../features/auth/auth-context'
import { getCurrentStore, updateCurrentStore } from '../features/stores/storeApi'
import { ApiError } from '../lib/api'
import type { CurrentUser, Store } from '../types/api'
import { StoreSettingsPage } from './SettingsPages'

vi.mock('../features/stores/storeApi', () => ({
  getCurrentStore: vi.fn(),
  updateCurrentStore: vi.fn(),
}))

const currentUser: CurrentUser = {
  id: 1,
  username: 'manager',
  full_name: 'مدیر',
  phone_number: '09123456789',
  is_demo: false,
  membership: {
    id: 1,
    role: 'manager',
    permissions: ['manage_members'],
    store: { id: 7, name: 'فروشگاه تست' },
  },
}

const store: Store = {
  id: 7,
  name: 'فروشگاه تست',
  notification_email: 'owner@example.com',
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const auth: AuthContextValue = {
    user: currentUser,
    status: 'authenticated',
    login: vi.fn(),
    loginDemo: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn().mockResolvedValue(currentUser),
  }
  render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={auth}>
        <MemoryRouter><StoreSettingsPage /></MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
  return auth
}

describe('StoreSettingsPage notification email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCurrentStore).mockResolvedValue(store)
  })

  it('loads and displays the current notification email', async () => {
    renderPage()

    expect(await screen.findByDisplayValue('owner@example.com')).toBeInTheDocument()
    expect(screen.getByText('بعد از تکمیل هر فروش، خلاصهٔ آن به این ایمیل ارسال می‌شود.')).toBeInTheDocument()
  })

  it('allows clearing the email to disable notifications', async () => {
    vi.mocked(updateCurrentStore).mockResolvedValue({ ...store, notification_email: '' })
    renderPage()
    const emailInput = await screen.findByLabelText('ایمیل دریافت اعلان‌ها')

    fireEvent.change(emailInput, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /ذخیره تنظیمات/ }))

    await waitFor(() => expect(vi.mocked(updateCurrentStore).mock.calls[0][0]).toEqual({ name: 'فروشگاه تست', notification_email: '' }))
  })

  it('keeps loading and success states correct while saving', async () => {
    let resolveUpdate!: (value: Store) => void
    vi.mocked(updateCurrentStore).mockImplementation(() => new Promise((resolve) => { resolveUpdate = resolve }))
    const auth = renderPage()
    const button = await screen.findByRole('button', { name: /ذخیره تنظیمات/ })

    fireEvent.click(button)
    await waitFor(() => expect(updateCurrentStore).toHaveBeenCalledOnce())
    expect(button).toBeDisabled()

    await act(async () => resolveUpdate(store))
    expect(await screen.findByText('تنظیمات فروشگاه با موفقیت ذخیره شد.')).toBeInTheDocument()
    expect(auth.refreshUser).toHaveBeenCalledOnce()
  })

  it('rejects an invalid email locally and displays backend field errors', async () => {
    renderPage()
    const emailInput = await screen.findByLabelText('ایمیل دریافت اعلان‌ها')
    const button = screen.getByRole('button', { name: /ذخیره تنظیمات/ })

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(button)
    expect(screen.getByText('یک ایمیل معتبر وارد کنید.')).toBeInTheDocument()
    expect(updateCurrentStore).not.toHaveBeenCalled()

    vi.mocked(updateCurrentStore).mockRejectedValueOnce(new ApiError(400, { notification_email: ['این ایمیل از سمت سرور پذیرفته نشد.'] }))
    fireEvent.change(emailInput, { target: { value: 'valid@example.com' } })
    fireEvent.click(button)
    expect(await screen.findByText('این ایمیل از سمت سرور پذیرفته نشد.')).toBeInTheDocument()
  })
})
