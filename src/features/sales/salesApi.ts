import { apiRequest } from '../../lib/api'
import type { Customer, PaginatedResponse, Sale, SaleItem } from '../../types/api'

export function getSales(status = '') {
  const query = status ? `?status=${status}` : ''
  return apiRequest<PaginatedResponse<Sale>>(`/sales/${query}`)
}

export function getCustomers() {
  return apiRequest<PaginatedResponse<Customer>>('/customers/')
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
