import { beforeEach, describe, expect, it, vi } from 'vitest'
import { updateCurrentUser } from './auth/authApi'
import { updateCustomer } from './customers/customersApi'
import { updateCurrentStore } from './stores/storeApi'
import { deleteWantedProduct, updateWantedProduct } from './wanted/wantedApi'

describe('settings and edit API contracts', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('patches the current user and current store', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 1 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 2, name: 'Store' }), { status: 200 }))

    await updateCurrentUser({ username: 'user', full_name: 'User Name', phone_number: '0912' })
    await updateCurrentStore('Store')

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/users/me/')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'PATCH' })
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/stores/current/')
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'PATCH' })
  })

  it('patches customers and updates or deletes wanted products', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 3 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 4 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    await updateCustomer(3, { full_name: 'Customer', phone_number: '0912' })
    await updateWantedProduct(4, { product: null, product_name: 'Shoe', brand: 'Brand', size: '42' })
    await deleteWantedProduct(4)

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/customers/3/')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'PATCH' })
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/wanted/4/')
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'PATCH' })
    expect(fetchMock.mock.calls[2][1]).toMatchObject({ method: 'DELETE' })
  })
})
