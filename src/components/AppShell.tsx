import {
  Bell,
  Box,
  Home,
  Menu,
  MessageCircleMore,
  MoreHorizontal,
  ShoppingBag,
} from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import type { PermissionCode } from '../types/api'

const tabs = [
  { to: '/', label: 'خانه', icon: Home, permissions: ['view_dashboard'] as PermissionCode[] },
  { to: '/products', label: 'محصولات', icon: Box, permissions: ['manage_catalog'] as PermissionCode[] },
  { to: '/sales', label: 'فروش‌ها', icon: ShoppingBag, permissions: ['view_sales', 'create_sale'] as PermissionCode[] },
  { to: '/requests', label: 'درخواست‌ها', icon: MessageCircleMore, badge: 3, permissions: ['manage_wanted'] as PermissionCode[] },
  { to: '/more', label: 'بیشتر', icon: MoreHorizontal },
]

const titles: Record<string, string> = {
  '/products': 'محصولات',
  '/sales': 'فروش‌ها',
  '/sales/new': 'ثبت فروش',
  '/requests': 'درخواست‌ها',
  '/more': 'بیشتر',
  '/customers': 'مشتریان',
  '/inventory': 'موجودی',
  '/inventory/history': 'تاریخچه موجودی',
  '/categories': 'دسته‌بندی‌ها',
  '/members': 'کاربران و نقش‌ها',
}

export function AppShell() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const isHome = pathname === '/'

  return (
    <div className="app-shell" dir="rtl">
      <header className={`topbar ${isHome ? 'topbar--home' : ''}`}>
        {isHome ? (
          <div className="welcome">
            <span className="avatar">{user?.full_name?.trim().charAt(0) || user?.username.charAt(0)}</span>
            <div>
              <strong>سلام {user?.full_name || user?.username}</strong>
              <span>به پنل فروشگاه خوش آمدید 👋</span>
            </div>
          </div>
        ) : (
          <button className="icon-button" aria-label="باز کردن منو">
            <Menu size={24} />
          </button>
        )}
        {!isHome && <h1>{titles[pathname] ?? (pathname.startsWith('/products/') ? 'جزئیات محصول' : pathname.startsWith('/sales/') ? 'جزئیات فروش' : 'فروشگاه')}</h1>}
        <button className="notification-button" aria-label="اعلان‌ها">
          <Bell size={25} />
          <span>3</span>
        </button>
      </header>

      <main className="page-content">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="منوی اصلی">
        {tabs.filter((tab) => !tab.permissions || tab.permissions.some((permission) => user?.membership?.permissions.includes(permission))).map(({ to, label, icon: Icon, badge }) => (
          <NavLink key={to} to={to} end={to === '/'}>
            <span className="nav-icon-wrap">
              <Icon size={22} strokeWidth={1.9} />
              {badge && <small>{badge}</small>}
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
