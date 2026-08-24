import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCustomers } from './customers/customersApi'
import { getProducts } from './products/productApi'
import { getSales } from './sales/salesApi'
import { getWantedProducts } from './wanted/wantedApi'

const emptyPage = { count: 0, next: null, previous: null, results: [] }

describe('list filter API contracts', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('serializes product filters', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(emptyPage), { status: 200 }))
    await getProducts({ search: 'shoe', page: 2, categoryId: '4', size: '40', stockStatus: 'low_stock', ordering: '-created' })
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/catalog/products/?page=2&search=shoe&category_id=4&size=40&stock_status=low_stock&ordering=-created')
  })

  it('serializes sale channel and date filters', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(emptyPage), { status: 200 }))
    await getSales({ status: 'completed', channel: 'instagram', dateFrom: '2026-08-01', dateTo: '2026-08-22' })
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/sales/?page=1&status=completed&channel=instagram&date_from=2026-08-01&date_to=2026-08-22')
  })

  it('serializes wanted-product filters', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(emptyPage), { status: 200 }))
    await getWantedProducts({ minCount: '5', productId: '9', dateFrom: '2026-08-01' })
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/wanted/?page=1&min_count=5&product_id=9&date_from=2026-08-01')
  })

  it('serializes customer gender and age range filters', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(emptyPage), { status: 200 }))
    await getCustomers({ search: 'ali', page: 2, gender: 'female', ageMin: 25, ageMax: 35 })
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/customers/?page=2&search=ali&gender=female&age_min=25&age_max=35')
  })
})
