import { apiRequest } from '../../lib/api'
import { getAllResults } from '../../lib/pagination'
import type { Customer, PaginatedResponse } from '../../types/api'

export function getCustomers(search = '', page = 1) {
  const params = new URLSearchParams({ page: String(page) })
  if (search) params.set('search', search)
  return apiRequest<PaginatedResponse<Customer>>(`/customers/?${params}`)
}

export function getAllCustomers() {
  return getAllResults<Customer>('/customers/')
}

export function createCustomer(input: { full_name: string; phone_number: string }) {
  return apiRequest<Customer>('/customers/', { method: 'POST', body: JSON.stringify(input) })
}

export function updateCustomer(id: number, input: { full_name: string; phone_number: string }) {
  return apiRequest<Customer>(`/customers/${id}/`, { method: 'PATCH', body: JSON.stringify(input) })
}

export function deleteCustomer(id: number) {
  return apiRequest<void>(`/customers/${id}/`, { method: 'DELETE' })
}
