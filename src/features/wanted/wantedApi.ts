import { apiRequest } from '../../lib/api'
import type { PaginatedResponse, WantedProduct } from '../../types/api'

export function getWantedProducts(search = '', page = 1) {
  const params = new URLSearchParams({ page: String(page) })
  if (search) params.set('search', search)
  return apiRequest<PaginatedResponse<WantedProduct>>(`/wanted/?${params}`)
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
