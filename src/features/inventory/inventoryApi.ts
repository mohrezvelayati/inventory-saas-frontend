import { apiRequest } from '../../lib/api'
import { getAllResults } from '../../lib/pagination'
import type { InventoryItem, InventoryMovement, InventoryMovementHistory, PaginatedResponse } from '../../types/api'

export function getInventory(search = '', page = 1) {
  const params = new URLSearchParams({ page: String(page) })
  if (search) params.set('search', search)
  return apiRequest<PaginatedResponse<InventoryItem>>(`/inventory/?${params}`)
}

export function getAllInventory() {
  return getAllResults<InventoryItem>('/inventory/')
}

export function createInventoryMovement(input: { variant: number; quantity: number; movement_type: 'purchase' | 'adjustment'; note: string }) {
  return apiRequest<InventoryMovement>('/inventory/movements/create/', { method: 'POST', body: JSON.stringify(input) })
}

export function getInventoryHistory(type = '', page = 1) {
  const params = new URLSearchParams({ page: String(page) })
  if (type) params.set('type', type)
  return apiRequest<PaginatedResponse<InventoryMovementHistory>>(`/inventory/movements/history/?${params}`)
}
