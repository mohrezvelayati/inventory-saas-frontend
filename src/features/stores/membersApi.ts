import { apiRequest } from '../../lib/api'
import type { PaginatedResponse, StoreMember } from '../../types/api'

export function getMembers() {
  return apiRequest<PaginatedResponse<StoreMember>>('/stores/members/')
}

export function inviteMember(input: { invite_username: string; role: StoreMember['role'] }) {
  return apiRequest<StoreMember>('/stores/members/', { method: 'POST', body: JSON.stringify(input) })
}

export function updateMemberRole(input: { id: number; role: StoreMember['role'] }) {
  return apiRequest<StoreMember>(`/stores/members/${input.id}/`, { method: 'PATCH', body: JSON.stringify({ role: input.role }) })
}

export function deleteMember(id: number) {
  return apiRequest<void>(`/stores/members/${id}/`, { method: 'DELETE' })
}
