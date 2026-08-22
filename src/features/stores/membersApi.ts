import { apiRequest } from '../../lib/api'
import type { MemberPermission, PaginatedResponse, StoreMember, StorePermission } from '../../types/api'

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

export function getPermissionCatalog() {
  return apiRequest<PaginatedResponse<StorePermission>>('/stores/permissions/')
}

export function getMemberPermissions(memberId: number) {
  return apiRequest<PaginatedResponse<MemberPermission>>(`/stores/members/${memberId}/permissions/`)
}

export function grantMemberPermission(memberId: number, permission: number) {
  return apiRequest<MemberPermission>(`/stores/members/${memberId}/permissions/`, { method: 'POST', body: JSON.stringify({ permission }) })
}

export function revokeMemberPermission(memberId: number, membershipPermissionId: number) {
  return apiRequest<void>(`/stores/members/${memberId}/permissions/${membershipPermissionId}/`, { method: 'DELETE' })
}
