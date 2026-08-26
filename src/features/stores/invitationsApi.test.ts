import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildInvitationLink, copyText, createInvitation, getInvitations, previewInvitation, registerWithInvitation, revokeInvitation } from './invitationsApi'
import { tokenStore } from '../../lib/api'

describe('store invitation API', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('uses the manager invitation endpoints', async () => {
    const invitation = { id: 7, phone_number: '09123456789', role: 'seller', status: 'pending', expires_at: '2026-08-29', created_at: '2026-08-22', token: 'raw-token' }
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify(invitation), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([invitation]), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    await createInvitation({ phone_number: invitation.phone_number, role: 'seller' })
    await getInvitations()
    await revokeInvitation(7)

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/stores/invitations/')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST' })
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/stores/invitations/')
    expect(fetchMock.mock.calls[2][0]).toBe('/api/v1/stores/invitations/7/')
    expect(fetchMock.mock.calls[2][1]).toMatchObject({ method: 'DELETE' })
  })

  it('previews and registers from a token, then stores returned JWTs', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ store_name: 'Store', role: 'seller', masked_phone_number: '0912***6789', expires_at: '2026-08-29' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ access: 'access-token', refresh: 'refresh-token' }), { status: 201 }))

    await previewInvitation('invite-token')
    await registerWithInvitation('invite-token', { username: 'seller', full_name: 'Seller', password: 'password123' })

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/stores/invitations/preview/invite-token/')
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/stores/invitations/invite-token/register/')
    expect(tokenStore.get()).toEqual({ access: 'access-token', refresh: 'refresh-token' })
  })

  it('builds and copies a frontend invitation link', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    const link = buildInvitationLink('abc_123', 'https://inventory.example')

    await copyText(link, { writeText })

    expect(link).toBe('https://inventory.example/invite/abc_123')
    expect(writeText).toHaveBeenCalledWith(link)
  })
})
