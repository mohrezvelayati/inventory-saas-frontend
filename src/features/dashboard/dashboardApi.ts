import { apiRequest } from '../../lib/api'
import type { Dashboard, ReportData } from '../../types/api'

export function getDashboard() {
  return apiRequest<Dashboard>('/dashboard/')
}

export function getReports(dateFrom: string, dateTo: string) {
  const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo })
  return apiRequest<ReportData>(`/dashboard/reports/?${params}`)
}
