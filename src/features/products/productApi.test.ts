import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createProduct, createVariant, updateProduct, updateProductSalePrice, updateVariant } from './productApi'

describe('catalog update API contracts', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('patches the bulk product sale-price endpoint with the expected body', async () => {
    const product = { id: 7, name: 'Jordan', description: '', image: null, categories: [], variants: [] }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify(product), { status: 200 }))

    const result = await updateProductSalePrice(7, { sale_price: 5800000 })

    expect(result).toEqual(product)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/catalog/products/7/prices/')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'PATCH' })
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ sale_price: 5800000 })
  })

  it('keeps the individual variant update endpoint available', async () => {
    const variant = { id: 41, size: '41', without_size: false, purchase_price: '4000000', sale_price: '5800000', current_stock: 2 }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify(variant), { status: 200 }))

    await updateVariant(41, { sale_price: '5800000' })

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/catalog/variants/41/')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'PATCH' })
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ sale_price: '5800000' })
  })

  it('creates a sizeless variant with the backend flag and no size field', async () => {
    const variant = { id: 42, size: null, without_size: true, purchase_price: '500000', sale_price: '800000', current_stock: 0 }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify(variant), { status: 201 }))

    const result = await createVariant(7, { without_size: true, purchase_price: '500000', sale_price: '800000' })

    expect(result).toEqual(variant)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/catalog/product/7/variants/')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST' })
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ without_size: true, purchase_price: '500000', sale_price: '800000' })
  })

  it('creates a product with its image and repeated category FormData fields', async () => {
    const product = { id: 7, name: 'Jordan', description: 'Celadon', image: '/media/products/shoe.png', categories: [2, 5], variants: [] }
    const image = new File(['image'], 'shoe.png', { type: 'image/png' })
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify(product), { status: 201 }))

    const result = await createProduct({ name: 'Jordan', description: 'Celadon', categories: [2, 5], image })

    expect(result).toEqual(product)
    const request = fetchMock.mock.calls[0][1] as RequestInit
    expect(request.method).toBe('POST')
    expect(request.body).toBeInstanceOf(FormData)
    const body = request.body as FormData
    expect(body.get('name')).toBe('Jordan')
    expect(body.get('description')).toBe('Celadon')
    expect(body.getAll('categories')).toEqual(['2', '5'])
    expect(body.get('image')).toBe(image)
  })

  it('clears an existing product image with a JSON image null patch', async () => {
    const product = { id: 7, name: 'Jordan', description: '', image: null, categories: [2], variants: [] }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify(product), { status: 200 }))

    await updateProduct(7, { name: 'Jordan', description: '', categories: [2], image: null })

    const request = fetchMock.mock.calls[0][1] as RequestInit
    expect(request.method).toBe('PATCH')
    expect(JSON.parse(String(request.body))).toEqual({ name: 'Jordan', description: '', categories: [2], image: null })
    expect((request.headers as Headers).get('Content-Type')).toBe('application/json')
  })
})
