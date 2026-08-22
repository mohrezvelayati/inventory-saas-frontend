import { ArrowLeft, BarChart3, Boxes, Grid2X2, Headphones, LogOut, Settings, ShieldCheck, Store, UsersRound } from 'lucide-react'
import { useAuth } from '../features/auth/useAuth'
import { Link } from 'react-router-dom'

const menuItems = [
  { title: 'مشتریان', subtitle: 'مدیریت لیست مشتریان و سوابق خرید', icon: UsersRound, tone: 'green', to: '/customers' },
  { title: 'گزارش‌ها', subtitle: 'مشاهده آمار فروش، موجودی و روندها', icon: BarChart3, tone: 'purple', to: '/' },
  { title: 'موجودی', subtitle: 'ثبت ورود و اصلاح موجودی', icon: Boxes, tone: 'purple', to: '/inventory' },
  { title: 'دسته‌بندی‌ها', subtitle: 'مدیریت دسته‌بندی محصولات', icon: Grid2X2, tone: 'purple', to: '/categories' },
  { title: 'کاربران و نقش‌ها', subtitle: 'مدیریت کارکنان و دسترسی‌ها', icon: ShieldCheck, tone: 'blue', to: '/members' },
  { title: 'تنظیمات', subtitle: 'تنظیمات فروشگاه و حساب کاربری', icon: Settings, tone: 'orange', to: '/more' },
  { title: 'پشتیبانی', subtitle: 'راهنما و ارتباط با تیم پشتیبانی', icon: Headphones, tone: 'purple', to: '/more' },
]

export function MorePage() {
  const { user, logout } = useAuth()
  return (
    <div className="page more-page">
      <section className="profile-card card">
        <span className="profile-avatar">{user?.full_name?.trim().charAt(0) || user?.username.charAt(0)}</span>
        <div><h2>{user?.full_name || user?.username}</h2><strong>{user?.membership?.store.name}</strong><button>مشاهده و ویرایش پروفایل فروشگاه</button></div>
        <span className="store-illustration small">🏪</span>
      </section>
      <h3 className="section-title">دسترسی‌های سریع</h3>
      <div className="more-shortcuts card"><Link to="/customers"><UsersRound />مشتریان</Link><Link to="/"><BarChart3 />گزارش‌ها</Link><Link to="/inventory"><Boxes />موجودی</Link></div>
      <div className="settings-list card">
        {menuItems.map(({ title, subtitle, icon: Icon, tone, to }) => (
          <Link key={title} to={to}><span className={`activity-icon ${tone}`}><Icon /></span><span><strong>{title}</strong><small>{subtitle}</small></span><ArrowLeft /></Link>
        ))}
      </div>
      <button className="logout-button" onClick={logout}><LogOut /> خروج از حساب کاربری</button>
      <div className="store-version"><Store size={18} /> {user?.membership?.store.name} · نسخه ۱.۰</div>
    </div>
  )
}
