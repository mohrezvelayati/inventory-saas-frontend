import { apiRequest } from '../../lib/api'
import type { Category, PaginatedResponse, Product, ProductVariant } from '../../types/api'

export function getProducts(search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
  return apiRequest<PaginatedResponse<Product>>(`/catalog/products/${query}`)
}

export function getCategories() {
  return apiRequest<PaginatedResponse<Category>>('/catalog/categories/')
}

export function createCategory(name: string) {
  return apiRequest<Category>('/catalog/categories/', { method: 'POST', body: JSON.stringify({ name }) })
}

export function deleteCategory(id: number) {
  return apiRequest<void>(`/catalog/categories/${id}/`, { method: 'DELETE' })
}

export type CreateProductInput = {
  name: string
  description: string
  categories: number[]
  size: string
  purchase_price: string
  sale_price: string
}

export async function createProductWithVariant(input: CreateProductInput) {
  const product = await apiRequest<Product>('/catalog/products/', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      description: input.description,
      categories: input.categories,
    }),
  })

  try {
    const variant = await apiRequest<ProductVariant>(`/catalog/product/${product.id}/variants/`, {
      method: 'POST',
      body: JSON.stringify({
        size: input.size,
        purchase_price: input.purchase_price,
        sale_price: input.sale_price,
      }),
    })
    return { ...product, variants: [variant] }
  } catch (error) {
    await apiRequest(`/catalog/products/${product.id}/`, { method: 'DELETE' }).catch(() => undefined)
    throw error
  }
}
