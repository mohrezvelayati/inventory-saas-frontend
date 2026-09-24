import { apiRequest } from '../../lib/api'
import type { Store } from '../../types/api'

export type UpdateCurrentStoreInput = Pick<Store, 'name' | 'notification_email'>

export function getCurrentStore() {
  return apiRequest<Store>('/stores/current/')
}

export function updateCurrentStore(input: UpdateCurrentStoreInput) {
  return apiRequest<Store>('/stores/current/', {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}
