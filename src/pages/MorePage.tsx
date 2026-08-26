import { ArrowLeft, BarChart3, Boxes, Grid2X2, Headphones, LogOut, Pencil, Settings, ShieldCheck, Store, UsersRound } from 'lucide-react'
import { useAuth } from '../features/auth/useAuth'
import { Link } from 'react-router-dom'
import type { PermissionCode } from '../types/api'

const menuItems: { title: string; subtitle: string; icon: typeof UsersRound; tone: string; to: string; permissions?: PermissionCode[] }[] = [
  { title: 'مشتریان', subtitle: 'مدیریت لیست مشتریان و سوابق خرید', icon: UsersRound, tone: 'green', to: '/customers', permissions: ['manage_customers'] },
  { title: 'گزارش‌ها', subtitle: 'مشاهده آمار فروش، موجودی و روندها', icon: BarChart3, tone: 'purple', to: '/reports', permissions: ['view_dashboard'] },
  { title: 'موجودی', subtitle: 'مشاهده و ثبت تغییرات موجودی', icon: Boxes, tone: 'purple', to: '/inventory', permissions: ['view_inventory', 'manage_inventory'] },
  { title: 'دسته‌بندی‌ها', subtitle: 'مدیریت دسته‌بندی محصولات', icon: Grid2X2, tone: 'purple', to: '/categories', permissions: ['manage_catalog'] },
  { title: 'کاربران و نقش‌ها', subtitle: 'مدیریت کارکنان و دسترسی‌ها', icon: ShieldCheck, tone: 'blue', to: '/members', permissions: ['manage_members'] },
  { title: 'تنظیمات فروشگاه', subtitle: 'ویرایش اطلاعات فروشگاه', icon: Settings, tone: 'orange', to: '/settings/store' },
  { title: 'پشتیبانی', subtitle: 'راهنما و ارتباط با تیم پشتیبانی', icon: Headphones, tone: 'purple', to: '/more' },
]

export function MorePage() {
  const { user, logout } = useAuth()
  const permissions = user?.membership?.permissions ?? []
  const canAccess = (required?: PermissionCode[]) => !required || required.some((permission) => permissions.includes(permission))
  const canAccessInventory = canAccess(['view_inventory', 'manage_inventory'])
  return (
    <div className="page more-page">
      <section className="profile-card card">
        <span className="profile-avatar">{user?.full_name?.trim().charAt(0) || user?.username.charAt(0)}</span>
                <div><h2>{user?.full_name || user?.username}</h2><strong>{user?.membership?.store.name}</strong><Link className="profile-edit-link" to="/profile" aria-label="ویرایش پروفایل"><Pencil size={14} /></Link></div>
        <span className="store-illustration small">🏪</span>
      </section>
      <h3 className="section-title">دسترسی‌های سریع</h3>
      <div className="more-shortcuts card"><Link to="/customers"><UsersRound />مشتریان</Link><Link to="/reports"><BarChart3 />گزارش‌ها</Link>{canAccessInventory && <Link to="/inventory"><Boxes />موجودی</Link>}</div>
      <div className="settings-list card">
        {menuItems.filter((item) => canAccess(item.permissions) && (item.to !== '/settings/store' || user?.membership?.role === 'manager')).map(({ title, subtitle, icon: Icon, tone, to }) => (
          <Link key={title} to={to}><span className={`activity-icon ${tone}`}><Icon /></span><span><strong>{title}</strong><small>{subtitle}</small></span><ArrowLeft /></Link>
        ))}
      </div>
      <button className="logout-button" onClick={logout}><LogOut /> خروج از حساب کاربری</button>
      <div className="store-version"><Store size={18} /> {user?.membership?.store.name} · نسخه ۱.۰</div>
    </div>
  )
}
