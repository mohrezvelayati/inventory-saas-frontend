import type { PaginatedResponse } from '../types/api'
import { apiRequest } from './api'

export async function getAllResults<T>(path: string) {
  const results: T[] = []
  let page = 1
  let hasNext = true

  while (hasNext) {
    const separator = path.includes('?') ? '&' : '?'
    const response = await apiRequest<PaginatedResponse<T>>(`${path}${separator}page=${page}`)
    results.push(...response.results)
    hasNext = Boolean(response.next)
    page += 1
  }

  return results
}
