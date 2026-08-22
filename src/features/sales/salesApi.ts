import { apiRequest } from '../../lib/api'
import type { PaginatedResponse, Sale, SaleItem } from '../../types/api'

export type SaleListFilters = {
  status?: string
  search?: string
  page?: number
  channel?: string
  dateFrom?: string
  dateTo?: string
}

export function getSales({ status = '', search = '', page = 1, channel = '', dateFrom = '', dateTo = '' }: SaleListFilters = {}) {
  const params = new URLSearchParams({ page: String(page) })
  if (status) params.set('status', status)
  if (search) params.set('search', search)
  if (channel) params.set('channel', channel)
  if (dateFrom) params.set('date_from', dateFrom)
  if (dateTo) params.set('date_to', dateTo)
  return apiRequest<PaginatedResponse<Sale>>(`/sales/?${params}`)
}

export function getSale(id: number) {
  return apiRequest<Sale>(`/sales/${id}/`)
}

export function cancelSale(id: number) {
  return apiRequest<{ message: string }>(`/sales/${id}/cancel/`, { method: 'POST' })
}

export function createDraftSale(input: { customer: number | null; channel: Sale['channel']; payment_method: Sale['payment_method'] }) {
  return apiRequest<Sale>('/sales/create/', { method: 'POST', body: JSON.stringify(input) })
}

export function addSaleItem(saleId: number, input: { variant: number; quantity: number; discount: number }) {
  return apiRequest<SaleItem>(`/sales/${saleId}/items/`, { method: 'POST', body: JSON.stringify(input) })
}

export function completeSale(saleId: number) {
  return apiRequest<{ message: string }>(`/sales/${saleId}/complete/`, { method: 'POST' })
}

export function deleteDraftSale(saleId: number) {
  return apiRequest<void>(`/sales/${saleId}/`, { method: 'DELETE' })
}
