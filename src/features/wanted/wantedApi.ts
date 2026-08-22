import { apiRequest } from '../../lib/api'
import type { PaginatedResponse, WantedProduct } from '../../types/api'

export type WantedListFilters = {
  search?: string
  page?: number
  minCount?: string
  productId?: string
  dateFrom?: string
  dateTo?: string
}

export function getWantedProducts({ search = '', page = 1, minCount = '', productId = '', dateFrom = '', dateTo = '' }: WantedListFilters = {}) {
  const params = new URLSearchParams({ page: String(page) })
  if (search) params.set('search', search)
  if (minCount) params.set('min_count', minCount)
  if (productId) params.set('product_id', productId)
  if (dateFrom) params.set('date_from', dateFrom)
  if (dateTo) params.set('date_to', dateTo)
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
