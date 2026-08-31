import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createBatchPurchase, createInventoryEntry, MovementFailedAfterVariantCreationError } from './inventoryApi'
import { createProduct } from '../products/productApi'

describe('product and inventory creation workflow', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('creates a product without creating a variant', async () => {
    const product = { id: 1, name: 'Jordan 1 Celadon', description: '', categories: [], variants: [] }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify(product), { status: 201 }))

    const result = await createProduct({ name: product.name, description: '', categories: [] })

    expect(result.variants).toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/catalog/products/')
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ name: product.name, description: '', categories: [] })
  })

  it('posts the batch purchase contract to the real endpoint', async () => {
    const response = {
      product: 12,
      items: [{ movement: 9, variant: 40, size: '40', quantity: 2, current_stock: 5 }],
    }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 201 }))
    const input = {
      product: 12,
      purchase_price: 4000000,
      sale_price: 5800000,
      note: 'محموله جدید',
      items: [{ size: '40', quantity: 2 }],
    }

    const result = await createBatchPurchase(input)

    expect(result).toEqual(response)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/inventory/purchases/batch/')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST' })
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual(input)
  })

  it('creates a new size before recording its first inventory movement', async () => {
    const variant = { id: 40, size: '40', purchase_price: '1000', sale_price: '1500', current_stock: 0 }
    const movement = { id: 9, variant: 40, quantity: 5, movement_type: 'purchase', note: '' }
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify(variant), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(movement), { status: 201 }))

    await createInventoryEntry({ productId: 1, newVariant: { size: '40', purchase_price: '1000', sale_price: '1500' }, quantity: 5, movement_type: 'purchase', note: '' })

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/catalog/product/1/variants/')
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/inventory/movements/create/')
  })

  it('records inventory for an existing size without creating another variant', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ id: 10 }), { status: 201 }))

    await createInventoryEntry({ productId: 1, variantId: 41, quantity: 2, movement_type: 'adjustment', note: 'counted' })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/inventory/movements/create/')
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).variant).toBe(41)
  })

  it('preserves a created zero-stock variant and allows movement-only retry', async () => {
    const variant = { id: 42, size: '42', purchase_price: '1000', sale_price: '1500', current_stock: 0 }
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify(variant), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: 'movement failed' }), { status: 400 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 11 }), { status: 201 }))

    let preservedVariantId = 0
    try {
      await createInventoryEntry({ productId: 1, newVariant: { size: '42', purchase_price: '1000', sale_price: '1500' }, quantity: 3, movement_type: 'purchase', note: '' })
    } catch (error) {
      expect(error).toBeInstanceOf(MovementFailedAfterVariantCreationError)
      preservedVariantId = (error as MovementFailedAfterVariantCreationError).variant.id
    }

    await createInventoryEntry({ productId: 1, variantId: preservedVariantId, quantity: 3, movement_type: 'purchase', note: '' })

    expect(preservedVariantId).toBe(42)
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[2][0]).toBe('/api/v1/inventory/movements/create/')
  })
})
