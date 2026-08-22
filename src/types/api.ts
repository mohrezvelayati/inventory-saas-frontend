export type PermissionCode =
  | 'manage_catalog'
  | 'view_inventory'
  | 'manage_inventory'
  | 'create_sale'
  | 'view_sales'
  | 'manage_customers'
  | 'manage_wanted'
  | 'view_dashboard'
  | 'manage_members'

export type Store = { id: number; name: string }

export type Membership = {
  id: number
  role: 'manager' | 'seller' | 'admin'
  store: Store
  permissions: PermissionCode[]
}

export type CurrentUser = {
  id: number
  username: string
  full_name: string
  phone_number: string
  membership: Membership | null
}

export type AuthTokens = { access: string; refresh: string }

export type PaginatedResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type ProductVariant = {
  id: number
  size: string
  purchase_price: string
  sale_price: string
  current_stock: number
}

export type Product = {
  id: number
  name: string
  description: string
  categories: number[]
  variants: ProductVariant[]
  created_at: string
  updated_at: string
}

export type Category = {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export type ApiValidationError = Record<string, string[] | string>

export type SaleItem = {
  id: number
  variant: number
  product_name: string
  size: string
  quantity: number
  unit_price: string
  discount: string
  final_price: string
}

export type Sale = {
  id: number
  customer: number | null
  channel: 'store' | 'instagram' | 'website' | 'referral' | 'other'
  payment_method: 'cash' | 'card' | 'online'
  status: 'draft' | 'completed' | 'cancelled'
  total_amount: string
  items: SaleItem[]
  created_at: string
}

export type WantedProduct = {
  id: number
  product: number | null
  product_name: string
  product_name_display: string | null
  brand: string
  size: string
  wanted_count: number
  created_at: string
}

export type Dashboard = {
  sales: { orders_count: number; revenue: string; discount: string }
  inventory: { total_variants: number; total_stock: number }
  low_stock: { product_name: string; size: string; current_stock: number }[]
  products: { product_name: string; sold_count: number }[]
  wanted: { product_name: string; size: string; wanted_count: number }[]
}

export type Customer = {
  id: number
  full_name: string
  phone_number: string
  created_at: string
  updated_at: string
}

export type InventoryItem = {
  id: number
  product_name: string
  size: string
  current_stock: number
}

export type InventoryMovement = {
  id: number
  variant: number
  quantity: number
  movement_type: 'purchase' | 'adjustment' | 'sale'
  note: string
  created_at: string
}

export type StoreMember = {
  id: number
  store: number
  user: number
  username: string
  user_full_name: string
  role: 'manager' | 'seller' | 'admin'
  created_at: string
  updated_at: string
}
