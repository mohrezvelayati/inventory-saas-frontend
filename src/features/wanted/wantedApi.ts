import { apiRequest } from '../../lib/api'
import type { PaginatedResponse, WantedProduct } from '../../types/api'

export function getWantedProducts(page = 1) {
  return apiRequest<PaginatedResponse<WantedProduct>>(`/wanted/?page=${page}`)
}

export type CreateWantedInput = {
  product?: number | null
  product_name: string
  brand: string
  size: string
}

export function createWantedProduct(input: CreateWantedInput) {
  return apiRequest<WantedProduct>('/wanted/', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
