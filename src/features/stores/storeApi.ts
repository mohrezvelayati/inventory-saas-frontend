import { apiRequest } from '../../lib/api'
import type { Store } from '../../types/api'

export function getCurrentStore() {
  return apiRequest<Store>('/stores/current/')
}

export function updateCurrentStore(name: string) {
  return apiRequest<Store>('/stores/current/', {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
}
