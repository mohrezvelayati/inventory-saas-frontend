import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getReports } from './dashboardApi'

describe('reports API', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('sends the selected date range', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ period: {}, sales: {}, daily: [], channels: [], products: [], inventory: {} }), { status: 200 }),
    )

    await getReports('2026-08-01', '2026-08-22')

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/dashboard/reports/?date_from=2026-08-01&date_to=2026-08-22')
  })
})
