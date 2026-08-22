import { apiRequest } from '../../lib/api'
import type { Dashboard } from '../../types/api'

export function getDashboard() {
  return apiRequest<Dashboard>('/dashboard/')
}
