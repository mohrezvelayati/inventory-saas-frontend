import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../features/auth/auth-context'
import { getInventory } from '../features/inventory/inventoryApi'
import { getAllProducts } from '../features/products/productApi'
import type { PermissionCode, Product } from '../types/api'
import { InventoryPage } from './OperationsPages'

vi.mock('../features/inventory/inventoryApi', async (importOriginal) => ({
  ...await importOriginal<typeof import('../features/inventory/inventoryApi')>(),
  getInventory: vi.fn(),
}))
vi.mock('../features/products/productApi', async (importOriginal) => ({
  ...await importOriginal<typeof import('../features/products/productApi')>(),
  getAllProducts: vi.fn(),
}))

const products: Product[] = [{
  id: 2,
  name: 'Air Max',
  description: '',
  categories: [],
  created_at: '',
  updated_at: '',
  variants: [{ id: 4, size: '40', purchase_price: '900', sale_price: '1400', current_stock: 1 }],
}]

function renderPage(permissions: PermissionCode[]) {
  const auth: AuthContextValue = {
    status: 'authenticated',
    user: {
      id: 1,
      username: 'manager',
      full_name: 'مدیر',
      phone_number: '09123456789',
      membership: { id: 1, role: 'manager', permissions, store: { id: 1, name: 'فروشگاه تست' } },
    },
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
  }
  return render(
    <AuthContext.Provider value={auth}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter><InventoryPage /></MemoryRouter>
      </QueryClientProvider>
    </AuthContext.Provider>,
  )
}

describe('InventoryPage batch purchase prototype access', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getInventory).mockResolvedValue({ count: 0, next: null, previous: null, results: [] })
    vi.mocked(getAllProducts).mockResolvedValue(products)
  })

  it('shows the batch button only with both permissions and keeps the single-size modal working', async () => {
    renderPage(['manage_inventory', 'manage_catalog'])

    const singleButton = await screen.findByRole('button', { name: /ثبت تغییر موجودی/ })
    expect(screen.getByRole('button', { name: /ورود گروهی خرید/ })).toBeInTheDocument()

    fireEvent.click(singleButton)
    expect(await screen.findByRole('dialog', { name: 'تغییر موجودی' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'بستن' }))

    fireEvent.click(screen.getByRole('button', { name: /ورود گروهی خرید/ }))
    expect(await screen.findByRole('dialog', { name: 'ورود گروهی خرید' })).toBeInTheDocument()
  })

  it.each<PermissionCode[][]>([
    [['manage_inventory']],
    [['manage_catalog']],
  ])('hides the batch button when one permission is missing: %s', async (permissions) => {
    renderPage(permissions)

    await screen.findByText('موجودی')
    expect(screen.queryByRole('button', { name: /ورود گروهی خرید/ })).not.toBeInTheDocument()
  })

  it('keeps the existing single-size action for manage_inventory without manage_catalog', async () => {
    renderPage(['manage_inventory'])

    fireEvent.click(await screen.findByRole('button', { name: /ثبت تغییر موجودی/ }))
    expect(await screen.findByRole('dialog', { name: 'تغییر موجودی' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'افزودن سایز جدید' })).not.toBeInTheDocument()
  })
})
