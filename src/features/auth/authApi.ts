import { apiRequest, tokenStore } from '../../lib/api'
import type { AuthTokens, CurrentUser, Store } from '../../types/api'

export type RegisterInput = {
  username: string
  full_name: string
  phone_number: string
  password: string
}

export async function login(username: string, password: string) {
  const tokens = await apiRequest<AuthTokens>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }, false)
  tokenStore.set(tokens)
  return getCurrentUser()
}

export async function loginDemo() {
  const tokens = await apiRequest<AuthTokens>('/auth/demo/', {
    method: 'POST',
  }, false)
  tokenStore.set(tokens)
  return getCurrentUser()
}

export function register(input: RegisterInput) {
  return apiRequest<CurrentUser>('/users/register/', {
    method: 'POST',
    body: JSON.stringify(input),
  }, false)
}

export function getCurrentUser() {
  return apiRequest<CurrentUser>('/users/me/')
}

export function updateCurrentUser(input: { username: string; full_name: string; phone_number: string }) {
  return apiRequest<CurrentUser>('/users/me/', {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function createStore(name: string) {
  return apiRequest<Store>('/stores/', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function logout() {
  const refresh = tokenStore.get()?.refresh
  if (!refresh) return
  await apiRequest<void>('/auth/logout/', {
    method: 'POST',
    body: JSON.stringify({ refresh }),
  }, false)
}

export function changePassword(current_password: string, new_password: string) {
  return apiRequest<void>('/auth/password/change/', {
    method: 'POST',
    body: JSON.stringify({ current_password, new_password }),
  })
}

export function requestPasswordReset(phone_number: string) {
  return apiRequest<{ detail: string }>('/auth/password-reset/request/', {
    method: 'POST',
    body: JSON.stringify({ phone_number }),
  }, false)
}

export function confirmPasswordReset(phone_number: string, code: string, new_password: string) {
  return apiRequest<void>('/auth/password-reset/confirm/', {
    method: 'POST',
    body: JSON.stringify({ phone_number, code, new_password }),
  }, false)
}
