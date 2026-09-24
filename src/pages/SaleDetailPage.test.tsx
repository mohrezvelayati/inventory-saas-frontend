import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSale } from '../features/sales/salesApi'
import type { Sale } from '../types/api'
import { SaleDetailPage } from './DetailPages'

vi.mock('../features/sales/salesApi', async (importOriginal) => ({
  ...await importOriginal<typeof import('../features/sales/salesApi')>(),
  getSale: vi.fn(),
}))

const completedSale: Sale = {
  id: 12,
  customer: null,
  channel: 'store',
  payment_method: 'card',
  status: 'completed',
  total_amount: '5800000',
  items: [],
  created_at: '2026-09-24T08:00:00Z',
  completed_at: '2026-09-24T08:15:00Z',
}

function renderPage(sale: Sale) {
  vi.mocked(getSale).mockResolvedValue(sale)
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={['/sales/12']}>
        <Routes><Route path="/sales/:saleId" element={<SaleDetailPage />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('SaleDetailPage completion time', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows completed_at for a completed sale', async () => {
    renderPage(completedSale)

    expect(await screen.findByText('زمان تکمیل فروش')).toBeInTheDocument()
    expect(screen.getByText(new Date(completedSale.completed_at!).toLocaleString('fa-IR'))).toBeInTheDocument()
  })

  it('does not show completion time for a draft sale', async () => {
    renderPage({ ...completedSale, status: 'draft', completed_at: null })

    await screen.findByText('پیش‌نویس')
    expect(screen.queryByText('زمان تکمیل فروش')).not.toBeInTheDocument()
  })
})
