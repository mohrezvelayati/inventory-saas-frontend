import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAllResults } from './pagination'

describe('getAllResults', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('loads every API page and preserves result order', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ count: 3, next: '/page/2', previous: null, results: [{ id: 1 }, { id: 2 }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ count: 3, next: null, previous: '/page/1', results: [{ id: 3 }] }), { status: 200 }))

    await expect(getAllResults<{ id: number }>('/items/')).resolves.toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/v1/items/?page=1', expect.any(Object))
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/v1/items/?page=2', expect.any(Object))
  })
})
