import { apiRequest } from '../../lib/api'
import type { InventoryItem, InventoryMovement, PaginatedResponse } from '../../types/api'

export function getInventory() {
  return apiRequest<PaginatedResponse<InventoryItem>>('/inventory/')
}

export function createInventoryMovement(input: { variant: number; quantity: number; movement_type: 'purchase' | 'adjustment'; note: string }) {
  return apiRequest<InventoryMovement>('/inventory/movements/create/', { method: 'POST', body: JSON.stringify(input) })
}
