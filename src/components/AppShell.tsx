import { useQuery } from '@tanstack/react-query'
import {
  Bell,
  Box,
  Home,
  Menu,
  MessageCircleMore,
  MoreHorizontal,
  ShoppingBag,
} from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { getDashboard } from '../features/dashboard/dashboardApi'
import type { PermissionCode } from '../types/api'
import type { LucideIcon } from 'lucide-react'
import { MobileSidebar } from './MobileSidebar'

type Tab = {
  to: string
  label: string
  icon: LucideIcon
  permissions?: PermissionCode[]
  badge?: number
}
const tabs: Tab[] = [
  { to: '/', label: 'خانه', icon: Home, permissions: ['view_dashboard'] as PermissionCode[] },
  { to: '/products', label: 'محصولات', icon: Box, permissions: ['manage_catalog'] as PermissionCode[] },
  { to: '/sales', label: 'فروش‌ها', icon: ShoppingBag, permissions: ['view_sales', 'create_sale'] as PermissionCode[] },
    { to: '/requests', label: 'درخواست‌ها', icon: MessageCircleMore, permissions: ['manage_wanted'] as PermissionCode[] },
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
  '/profile': 'پروفایل کاربری',
  '/settings/store': 'تنظیمات فروشگاه',
    '/reports': 'گزارش‌ها',
  '/notifications': 'هشدارها',
}

import { useState } from 'react'

export function AppShell() {
  const { pathname } = useLocation()
  const { user } = useAuth()
    const isHome = pathname === '/'
  const [menuOpen, setMenuOpen] = useState(false)
  const [dismissed, setDismissed] = useState(0)
  const { data: dashboard } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard, retry: false })
  const alertCount = (dashboard?.low_stock.length ?? 0) + (dashboard?.wanted.length ?? 0)
  const unreadCount = Math.max(0, alertCount - dismissed)
  const showBellBadge = unreadCount > 0 && pathname !== '/notifications'

  return (
    <div className="app-shell" dir="rtl">
      <header className={`topbar ${isHome ? 'topbar--home' : ''}`}>
        {isHome ? (
          <div className="welcome">
            <span className="avatar">{user?.full_name?.trim().charAt(0) || user?.username.charAt(0)}</span>
            <div>
              <strong>سلام {user?.full_name || user?.username}</strong>
              {/* <span>به پنل فروشگاه خوش آمدید 👋</span> */}
            </div>
          </div>
        ) : (
          <button className={`icon-button ${menuOpen ? 'active' : ''}`} aria-label="باز کردن منو" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>
            <Menu size={24} />
          </button>
        )}
        {!isHome && <h1>{titles[pathname] ?? (pathname.startsWith('/products/') ? 'جزئیات محصول' : pathname.startsWith('/sales/') ? 'جزئیات فروش' : 'فروشگاه')}</h1>}
                <Link to="/notifications" className="notification-button" aria-label="اعلام‌ها" onClick={() => setDismissed(alertCount)}>
          <Bell size={25} />
          {showBellBadge && <span>{(unreadCount > 99 ? '99+' : unreadCount.toLocaleString('fa-IR'))}</span>}
        </Link>
      </header>

      <main className="page-content">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="منوی اصلی">
        {tabs.filter((tab) => !tab.permissions || tab.permissions.some((permission) => user?.membership?.permissions.includes(permission))).map(({ to, label, icon: Icon, badge }) => (
          <NavLink key={to} to={to} end={to === '/'} onClick={() => setMenuOpen(false)}>
            <span className="nav-icon-wrap">
              <Icon size={22} strokeWidth={1.9} />
              {badge && <small>{badge}</small>}
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <MobileSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  )
}
