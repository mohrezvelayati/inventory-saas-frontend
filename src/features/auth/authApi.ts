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

export function register(input: RegisterInput) {
  return apiRequest<CurrentUser>('/users/register/', {
    method: 'POST',
    body: JSON.stringify(input),
  }, false)
}

export function getCurrentUser() {
  return apiRequest<CurrentUser>('/users/me/')
}

export function createStore(name: string) {
  return apiRequest<Store>('/stores/', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}
