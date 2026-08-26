import { apiRequest, tokenStore } from '../../lib/api'
import type { AuthTokens, InvitationPreview, InvitationRole, StoreInvitation } from '../../types/api'

export function getInvitations() {
  return apiRequest<StoreInvitation[]>('/stores/invitations/')
}

export function createInvitation(input: { phone_number: string; role: InvitationRole }) {
  return apiRequest<StoreInvitation>('/stores/invitations/', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function revokeInvitation(id: number) {
  return apiRequest<void>(`/stores/invitations/${id}/`, { method: 'DELETE' })
}

export function previewInvitation(token: string) {
  return apiRequest<InvitationPreview>(`/stores/invitations/preview/${token}/`, {}, false)
}

export async function registerWithInvitation(token: string, input: { username: string; full_name: string; password: string }) {
  const tokens = await apiRequest<AuthTokens>(`/stores/invitations/${token}/register/`, {
    method: 'POST',
    body: JSON.stringify(input),
  }, false)
  tokenStore.set(tokens)
  return tokens
}

export function acceptInvitation(token: string) {
  return apiRequest(`/stores/invitations/${token}/accept/`, { method: 'POST' })
}

export function buildInvitationLink(token: string, origin = window.location.origin) {
  return `${origin}/invite/${token}`
}

export function copyText(value: string, clipboard: Pick<Clipboard, 'writeText'> = navigator.clipboard) {
  return clipboard.writeText(value)
}
