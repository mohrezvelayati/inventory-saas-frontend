import { apiRequest } from '../../lib/api'
import { getAllResults } from '../../lib/pagination'
import type { Customer, PaginatedResponse } from '../../types/api'

export type CustomerListFilters = {
  search?: string
  page?: number
  gender?: string
  ageMin?: number | ''
  ageMax?: number | ''
}

export function getCustomers({ search = '', page = 1, gender = '', ageMin = '', ageMax = '' }: CustomerListFilters = {}) {
  const params = new URLSearchParams({ page: String(page) })
  if (search) params.set('search', search)
  if (gender) params.set('gender', gender)
  if (ageMin !== '') params.set('age_min', String(ageMin))
  if (ageMax !== '') params.set('age_max', String(ageMax))
  return apiRequest<PaginatedResponse<Customer>>(`/customers/?${params}`)
}

export function getAllCustomers() {
  return getAllResults<Customer>('/customers/')
}

export type CustomerInput = {
  full_name: string
  phone_number: string
  gender: Customer['gender']
  age?: number | null
}

export function createCustomer(input: CustomerInput) {
  return apiRequest<Customer>('/customers/', { method: 'POST', body: JSON.stringify(input) })
}

export function updateCustomer(id: number, input: Partial<CustomerInput>) {
  return apiRequest<Customer>(`/customers/${id}/`, { method: 'PATCH', body: JSON.stringify(input) })
}

export function deleteCustomer(id: number) {
  return apiRequest<void>(`/customers/${id}/`, { method: 'DELETE' })
}
