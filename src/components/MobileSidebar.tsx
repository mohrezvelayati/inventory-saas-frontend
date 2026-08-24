import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  Box,
  Grid2X2,
  Home,
  LogOut,
  MessageCircleMore,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  User,
  UsersRound,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../features/auth/useAuth'
import type { PermissionCode } from '../types/api'

type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  permissions?: PermissionCode[]
  role?: 'manager'
}

const navItems: NavItem[] = [
  { to: '/', label: 'خانه', icon: Home, permissions: ['view_dashboard'] },
  { to: '/products', label: 'محصولات', icon: Box, permissions: ['manage_catalog'] },
  { to: '/sales', label: 'فروش\u200cها', icon: ShoppingBag, permissions: ['view_sales', 'create_sale'] },
  { to: '/requests', label: 'درخواست\u200cها', icon: MessageCircleMore, permissions: ['manage_wanted'] },
  { to: '/customers', label: 'مشتریان', icon: UsersRound, permissions: ['manage_customers'] },
  { to: '/inventory', label: 'موجودی', icon: Store, permissions: ['view_inventory', 'manage_inventory'] },
  { to: '/categories', label: 'دسته\u200cبندی\u200cها', icon: Grid2X2, permissions: ['manage_catalog'] },
  { to: '/reports', label: 'گزارش\u200cها', icon: BarChart3, permissions: ['view_dashboard'] },
  { to: '/members', label: 'کاربران و نقش\u200cها', icon: ShieldCheck, permissions: ['manage_members'] },
  { to: '/settings/store', label: 'تنظیمات فروشگاه', icon: Settings, role: 'manager' },
  { to: '/profile', label: 'حساب کاربری', icon: User },
]

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout } = useAuth()
  const permissions = user?.membership?.permissions ?? []
  const allowed = (perms?: PermissionCode[]) => !perms || perms.every((permission) => permissions.includes(permission))
  const allowedRole = (item: NavItem) => !item.role || user?.membership?.role === item.role

  return (
    <>
      <div className={`mobile-sidebar-backdrop ${open ? 'open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`mobile-sidebar ${open ? 'open' : ''}`} aria-label="منو">
        <div className="sidebar-header">
          <button className="sidebar-close" type="button" onClick={onClose} aria-label="بستن منو"><X size={20} /></button>
          <div className="sidebar-user">
            <span className="sidebar-avatar">{user?.full_name?.trim().charAt(0) || user?.username.charAt(0)}</span>
            <div><strong>{user?.full_name || user?.username}</strong><small>{user?.membership?.store.name}</small></div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.filter((item) => allowed(item.permissions) && allowedRole(item)).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className="sidebar-nav-item" onClick={onClose}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button className="sidebar-logout" type="button" onClick={logout}><LogOut size={16} />خروج از حساب کاربری</button>
      </aside>
    </>
  )
}
