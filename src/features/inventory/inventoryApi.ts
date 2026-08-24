import { apiRequest } from '../../lib/api'
import { getAllResults } from '../../lib/pagination'
import { createVariant } from '../products/productApi'
import type { InventoryItem, InventoryMovement, InventoryMovementHistory, PaginatedResponse, ProductVariant } from '../../types/api'

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

export type InventoryEntryInput = {
  productId: number
  variantId?: number
  newVariant?: {
    size: string
    purchase_price: string
    sale_price: string
  }
  quantity: number
  movement_type: 'purchase' | 'adjustment'
  note: string
}

export class MovementFailedAfterVariantCreationError extends Error {
  variant: ProductVariant

  constructor(variant: ProductVariant, cause: unknown) {
    super(cause instanceof Error ? cause.message : 'ثبت موجودی ناموفق بود.')
    this.name = 'MovementFailedAfterVariantCreationError'
    this.variant = variant
  }
}

export async function createInventoryEntry(input: InventoryEntryInput) {
  let variantId = input.variantId
  let createdVariant: ProductVariant | undefined

  if (input.newVariant) {
    createdVariant = await createVariant(input.productId, input.newVariant)
    variantId = createdVariant.id
  }

  if (!variantId) throw new Error('یک سایز را انتخاب کنید.')

  try {
    const movement = await createInventoryMovement({
      variant: variantId,
      quantity: input.quantity,
      movement_type: input.movement_type,
      note: input.note,
    })
    return { movement, variant: createdVariant }
  } catch (error) {
    if (createdVariant) throw new MovementFailedAfterVariantCreationError(createdVariant, error)
    throw error
  }
}

export function getInventoryHistory(type = '', page = 1) {
  const params = new URLSearchParams({ page: String(page) })
  if (type) params.set('type', type)
  return apiRequest<PaginatedResponse<InventoryMovementHistory>>(`/inventory/movements/history/?${params}`)
}
