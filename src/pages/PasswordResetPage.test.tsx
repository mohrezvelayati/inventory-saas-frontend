import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../features/auth/auth-context'
import { confirmPasswordReset, requestPasswordReset } from '../features/auth/authApi'
import { ApiError } from '../lib/api'
import { ForgotPasswordPage, LoginPage } from './AuthPages'

vi.mock('../features/auth/authApi', () => ({
  confirmPasswordReset: vi.fn(),
  createStore: vi.fn(),
  register: vi.fn(),
  requestPasswordReset: vi.fn(),
}))

const auth: AuthContextValue = {
  user: null,
  status: 'anonymous',
  login: vi.fn(),
  loginDemo: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(),
}

function LoginDestination() {
  const location = useLocation()
  return <div>{location.state?.message ?? 'صفحه ورود'}</div>
}

function renderResetPage() {
  return render(
    <MemoryRouter initialEntries={['/forgot-password']}>
      <Routes>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/login" element={<LoginDestination />} />
      </Routes>
    </MemoryRouter>,
  )
}

async function reachConfirmationStep() {
  vi.mocked(requestPasswordReset).mockResolvedValue({ detail: 'accepted' })
  renderResetPage()
  fireEvent.change(screen.getByPlaceholderText('شماره تلفن'), { target: { value: '09121112222' } })
  fireEvent.click(screen.getByRole('button', { name: 'ارسال کد بازیابی' }))
  await screen.findByPlaceholderText('کد ۶ رقمی')
}

describe('password reset flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('VITE_PASSWORD_RESET_ENABLED', '')
  })

  afterEach(() => vi.unstubAllEnvs())

  it('shows the reset link on login by default', () => {
    render(
      <AuthContext.Provider value={auth}>
        <MemoryRouter><LoginPage /></MemoryRouter>
      </AuthContext.Provider>,
    )

    expect(screen.getByRole('link', { name: 'رمز عبور را فراموش کرده‌اید؟' })).toHaveAttribute('href', '/forgot-password')
  })

  it('validates the phone number before requesting a reset code', async () => {
    renderResetPage()
    fireEvent.change(screen.getByPlaceholderText('شماره تلفن'), { target: { value: '1234' } })
    fireEvent.click(screen.getByRole('button', { name: 'ارسال کد بازیابی' }))

    expect(await screen.findByText('شماره تلفن باید با ۰۹ شروع شود و ۱۱ رقم باشد')).toBeInTheDocument()
    expect(requestPasswordReset).not.toHaveBeenCalled()
  })

  it('requests a code, prevents duplicate submission, and locks the phone number', async () => {
    let resolveRequest: ((value: { detail: string }) => void) | undefined
    vi.mocked(requestPasswordReset).mockReturnValue(new Promise((resolve) => { resolveRequest = resolve }))
    renderResetPage()
    const phoneInput = screen.getByPlaceholderText('شماره تلفن')
    fireEvent.change(phoneInput, { target: { value: '09121112222' } })
    fireEvent.click(screen.getByRole('button', { name: 'ارسال کد بازیابی' }))

    await waitFor(() => expect(requestPasswordReset).toHaveBeenCalledWith('09121112222'))
    expect(screen.getByRole('button')).toBeDisabled()
    resolveRequest?.({ detail: 'accepted' })

    expect(await screen.findByText('اگر حسابی با این شماره وجود داشته باشد، کد بازیابی ارسال می‌شود.')).toBeInTheDocument()
    expect(phoneInput).toHaveAttribute('readonly')
    expect(screen.getByRole('button', { name: 'ویرایش شماره تلفن' })).toBeInTheDocument()
  })

  it('validates matching passwords and confirms the reset', async () => {
    await reachConfirmationStep()
    fireEvent.change(screen.getByPlaceholderText('کد ۶ رقمی'), { target: { value: '123456' } })
    fireEvent.change(screen.getByPlaceholderText('رمز عبور جدید'), { target: { value: 'new-strong-pass' } })
    fireEvent.change(screen.getByPlaceholderText('تکرار رمز عبور جدید'), { target: { value: 'different-pass' } })
    fireEvent.click(screen.getByRole('button', { name: 'تغییر رمز عبور' }))

    expect(await screen.findByText('تکرار رمز عبور با رمز جدید یکسان نیست')).toBeInTheDocument()
    expect(confirmPasswordReset).not.toHaveBeenCalled()

    fireEvent.change(screen.getByPlaceholderText('تکرار رمز عبور جدید'), { target: { value: 'new-strong-pass' } })
    vi.mocked(confirmPasswordReset).mockResolvedValue(undefined)
    fireEvent.click(screen.getByRole('button', { name: 'تغییر رمز عبور' }))

    await waitFor(() => expect(confirmPasswordReset).toHaveBeenCalledWith('09121112222', '123456', 'new-strong-pass'))
    expect(await screen.findByText('رمز عبور تغییر کرد؛ اکنون وارد شوید.')).toBeInTheDocument()
  })

  it('shows rate-limit, invalid-code, and password field errors from the backend', async () => {
    vi.mocked(requestPasswordReset).mockRejectedValueOnce(new ApiError(429, { code: 'rate_limited' }))
    renderResetPage()
    fireEvent.change(screen.getByPlaceholderText('شماره تلفن'), { target: { value: '09121112222' } })
    fireEvent.click(screen.getByRole('button', { name: 'ارسال کد بازیابی' }))
    expect(await screen.findByText('تعداد درخواست‌ها بیش از حد مجاز است؛ کمی بعد دوباره تلاش کنید.')).toBeInTheDocument()

    vi.mocked(requestPasswordReset).mockResolvedValueOnce({ detail: 'accepted' })
    fireEvent.click(screen.getByRole('button', { name: 'ارسال کد بازیابی' }))
    await screen.findByPlaceholderText('کد ۶ رقمی')
    fireEvent.change(screen.getByPlaceholderText('کد ۶ رقمی'), { target: { value: '123456' } })
    fireEvent.change(screen.getByPlaceholderText('رمز عبور جدید'), { target: { value: 'new-strong-pass' } })
    fireEvent.change(screen.getByPlaceholderText('تکرار رمز عبور جدید'), { target: { value: 'new-strong-pass' } })

    vi.mocked(confirmPasswordReset).mockRejectedValueOnce(new ApiError(400, { code: 'invalid_or_expired' }))
    fireEvent.click(screen.getByRole('button', { name: 'تغییر رمز عبور' }))
    expect(await screen.findByText('کد واردشده نادرست یا منقضی شده است؛ دوباره کد دریافت کنید.')).toBeInTheDocument()

    vi.mocked(confirmPasswordReset).mockRejectedValueOnce(new ApiError(400, { new_password: ['این رمز عبور بیش از حد رایج است.'] }))
    fireEvent.click(screen.getByRole('button', { name: 'تغییر رمز عبور' }))
    expect(await screen.findByText('این رمز عبور بیش از حد رایج است.')).toBeInTheDocument()
  })

  it('redirects to login while the feature is disabled', async () => {
    vi.stubEnv('VITE_PASSWORD_RESET_ENABLED', 'false')
    renderResetPage()
    expect(await screen.findByText('صفحه ورود')).toBeInTheDocument()
  })
})
