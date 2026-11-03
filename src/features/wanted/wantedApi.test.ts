import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createWantedProduct, getWantedCustomerRequests } from './wantedApi'

describe('wanted API contracts', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('creates a customer-linked wanted request', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 4 }), { status: 201 }),
    )

    await createWantedProduct({
      customer: 12,
      product: null,
      product_name: 'Nike Dunk Low',
      brand: 'Nike',
      size: '42',
    })

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/wanted/')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST' })
    expect(fetchMock.mock.calls[0][1]?.body).toBe(JSON.stringify({
      customer: 12,
      product: null,
      product_name: 'Nike Dunk Low',
      brand: 'Nike',
      size: '42',
    }))
  })

  it('loads a paginated customer request history', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ count: 0, next: null, previous: null, results: [] }), { status: 200 }),
    )

    await getWantedCustomerRequests(4, 2)

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/wanted/4/requests/?page=2')
  })
})
