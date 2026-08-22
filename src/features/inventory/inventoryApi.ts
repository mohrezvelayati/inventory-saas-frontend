import { apiRequest } from '../../lib/api'
import type { InventoryItem, InventoryMovement, InventoryMovementHistory, PaginatedResponse } from '../../types/api'

export function getInventory() {
  return apiRequest<PaginatedResponse<InventoryItem>>('/inventory/')
}

export function createInventoryMovement(input: { variant: number; quantity: number; movement_type: 'purchase' | 'adjustment'; note: string }) {
  return apiRequest<InventoryMovement>('/inventory/movements/create/', { method: 'POST', body: JSON.stringify(input) })
}

export function getInventoryHistory(type = '', page = 1) {
  const params = new URLSearchParams({ page: String(page) })
  if (type) params.set('type', type)
  return apiRequest<PaginatedResponse<InventoryMovementHistory>>(`/inventory/movements/history/?${params}`)
}
