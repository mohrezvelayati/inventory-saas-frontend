import type { ApiValidationError, AuthTokens } from '../types/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
const TOKEN_KEY = 'inventory.auth.tokens'

export class ApiError extends Error {
  status: number
  data: ApiValidationError | { detail?: string; code?: string } | null

  constructor(status: number, data: ApiError['data']) {
    super(getErrorMessage(data) || `خطای ارتباط با سرور (${status})`)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

function getErrorMessage(data: ApiError['data']) {
  if (!data) return ''
  if ('detail' in data && typeof data.detail === 'string') return data.detail
  const firstValue = Object.values(data)[0]
  return Array.isArray(firstValue) ? firstValue[0] : firstValue
}

export const tokenStore = {
  get(): AuthTokens | null {
    const raw = sessionStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    try { return JSON.parse(raw) as AuthTokens } catch { return null }
  },
  set(tokens: AuthTokens) { sessionStorage.setItem(TOKEN_KEY, JSON.stringify(tokens)) },
  clear() { sessionStorage.removeItem(TOKEN_KEY) },
}

let refreshPromise: Promise<string> | null = null

async function refreshAccessToken() {
  const refresh = tokenStore.get()?.refresh
  if (!refresh) throw new Error('No refresh token')

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Refresh failed')
        const data = await response.json() as { access: string; refresh?: string }
        tokenStore.set({ access: data.access, refresh: data.refresh ?? refresh })
        return data.access
      })
      .finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  allowRefresh = true,
): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const access = tokenStore.get()?.access
  if (access) headers.set('Authorization', `Bearer ${access}`)

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  } catch {
    throw new ApiError(0, { detail: 'ارتباط با سرور برقرار نشد. از روشن بودن بک‌اند مطمئن شوید.' })
  }

  if (response.status === 401 && allowRefresh && tokenStore.get()?.refresh) {
    try {
      const nextAccess = await refreshAccessToken()
      headers.set('Authorization', `Bearer ${nextAccess}`)
      response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
    } catch {
      tokenStore.clear()
      window.dispatchEvent(new Event('auth:expired'))
    }
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null) as ApiError['data']
    throw new ApiError(response.status, data)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
