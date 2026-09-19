import { beforeEach, describe, expect, it, vi } from 'vitest'
import { changePassword, confirmPasswordReset, loginDemo, logout, requestPasswordReset } from './authApi'
import { tokenStore } from '../../lib/api'

describe('authentication security API', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('sends the refresh token to the logout endpoint', async () => {
    tokenStore.set({ access: 'access-token', refresh: 'refresh-token' })
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 204 }),
    )

    await logout()

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/auth/logout/')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST' })
    expect(fetchMock.mock.calls[0][1]?.body).toBe(JSON.stringify({ refresh: 'refresh-token' }))
  })

  it('starts a demo session and loads the marked current user', async () => {
    const currentUser = {
      id: 1,
      username: 'portfolio_demo',
      full_name: 'مدیر فروشگاه دمو',
      phone_number: '09000000001',
      is_demo: true,
      membership: null,
    }
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ access: 'demo-access', refresh: 'demo-refresh' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(currentUser), { status: 200 }))

    await expect(loginDemo()).resolves.toEqual(currentUser)

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/auth/demo/')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST' })
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/users/me/')
    expect(tokenStore.get()).toEqual({ access: 'demo-access', refresh: 'demo-refresh' })
  })

  it('uses the password change and reset contracts', async () => {
    tokenStore.set({ access: 'access-token', refresh: 'refresh-token' })
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: 'accepted' }), { status: 202 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    await changePassword('current-pass', 'new-strong-pass')
    await requestPasswordReset('09121112222')
    await confirmPasswordReset('09121112222', '123456', 'new-strong-pass')

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/api/v1/auth/password/change/',
      '/api/v1/auth/password-reset/request/',
      '/api/v1/auth/password-reset/confirm/',
    ])
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ phone_number: '09121112222' }),
    })
    expect(fetchMock.mock.calls[2][1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({
        phone_number: '09121112222',
        code: '123456',
        new_password: 'new-strong-pass',
      }),
    })
  })
})
