import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest, tokenStore } from './api'

describe('apiRequest', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('refreshes an expired access token and retries the request', async () => {
    tokenStore.set({ access: 'expired-access', refresh: 'valid-refresh' })
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ access: 'fresh-access' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 7 }), { status: 200 }))

    await expect(apiRequest<{ id: number }>('/resource/')).resolves.toEqual({ id: 7 })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/auth/token/refresh/')
    const retryHeaders = (fetchMock.mock.calls[2][1] as RequestInit).headers as Headers
    expect(retryHeaders.get('Authorization')).toBe('Bearer fresh-access')
    expect(tokenStore.get()?.access).toBe('fresh-access')
  })

  it('returns a Persian connection error when fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('offline'))
    await expect(apiRequest('/resource/')).rejects.toThrow('ارتباط با سرور برقرار نشد')
  })

  it('does not set Content-Type manually for FormData bodies', async () => {
    const formData = new FormData()
    formData.append('image', new File(['image'], 'shoe.png', { type: 'image/png' }))
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ id: 7 }), { status: 200 }))

    await apiRequest('/resource/', { method: 'POST', body: formData })

    const request = fetchMock.mock.calls[0][1] as RequestInit
    expect(request.body).toBe(formData)
    expect((request.headers as Headers).has('Content-Type')).toBe(false)
  })
})
