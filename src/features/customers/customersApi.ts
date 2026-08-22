import { apiRequest } from '../../lib/api'
import type { Customer, PaginatedResponse } from '../../types/api'

export function getCustomers() {
  return apiRequest<PaginatedResponse<Customer>>('/customers/')
}

export function createCustomer(input: { full_name: string; phone_number: string }) {
  return apiRequest<Customer>('/customers/', { method: 'POST', body: JSON.stringify(input) })
}

export function deleteCustomer(id: number) {
  return apiRequest<void>(`/customers/${id}/`, { method: 'DELETE' })
}
