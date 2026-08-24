import { apiRequest } from '../../lib/api'
import { getAllResults } from '../../lib/pagination'
import type { Category, PaginatedResponse, Product, ProductVariant } from '../../types/api'

export type ProductListFilters = {
  search?: string
  page?: number
  categoryId?: string
  size?: string
  stockStatus?: string
  ordering?: string
}

export function getProducts({ search = '', page = 1, categoryId = '', size = '', stockStatus = '', ordering = '' }: ProductListFilters = {}) {
  const params = new URLSearchParams({ page: String(page) })
  if (search) params.set('search', search)
  if (categoryId) params.set('category_id', categoryId)
  if (size) params.set('size', size)
  if (stockStatus) params.set('stock_status', stockStatus)
  if (ordering) params.set('ordering', ordering)
  return apiRequest<PaginatedResponse<Product>>(`/catalog/products/?${params}`)
}

export function getProduct(id: number) {
  return apiRequest<Product>(`/catalog/products/${id}/`)
}

export function updateProduct(id: number, input: { name: string; description: string; categories: number[] }) {
  return apiRequest<Product>(`/catalog/products/${id}/`, { method: 'PATCH', body: JSON.stringify(input) })
}

export function deleteProduct(id: number) {
  return apiRequest<void>(`/catalog/products/${id}/`, { method: 'DELETE' })
}

export function createVariant(productId: number, input: { size: string; purchase_price: string; sale_price: string }) {
  return apiRequest<ProductVariant>(`/catalog/product/${productId}/variants/`, { method: 'POST', body: JSON.stringify(input) })
}

export function updateVariant(id: number, input: { size?: string; purchase_price?: string; sale_price?: string }) {
  return apiRequest<ProductVariant>(`/catalog/variants/${id}/`, { method: 'PATCH', body: JSON.stringify(input) })
}

export function deleteVariant(id: number) {
  return apiRequest<void>(`/catalog/variants/${id}/`, { method: 'DELETE' })
}

export function getCategories(page = 1) {
  return apiRequest<PaginatedResponse<Category>>(`/catalog/categories/?page=${page}`)
}

export function getAllCategories() {
  return getAllResults<Category>('/catalog/categories/')
}

export function getAllProducts() {
  return getAllResults<Product>('/catalog/products/')
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
