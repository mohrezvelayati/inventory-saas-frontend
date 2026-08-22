import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Box,
  MessageCircleMore,
  PackagePlus,
  ShoppingCart,
  Store,
  LoaderCircle,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { getDashboard } from '../features/dashboard/dashboardApi'

const money = (value?: string) => value ? Number(value).toLocaleString('fa-IR') : '۰'

export function HomePage() {
  const { user } = useAuth()
  const storeName = user?.membership?.store.name ?? 'فروشگاه شما'
  const { data: dashboard, isPending, isError } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard })

  if (isPending) return <div className="loading-state home-loading"><LoaderCircle className="spin" /><span>در حال آماده‌سازی داشبورد...</span></div>
  if (isError || !dashboard) return <div className="error-state home-loading"><AlertTriangle /><strong>داشبورد دریافت نشد</strong><span>اتصال بک‌اند و دسترسی view_dashboard را بررسی کنید.</span></div>
  return (
    <div className="page home-page">
      <section className="store-hero card">
        <div className="store-identity">
          <span className="soft-icon"><Store /></span>
          <div><h2>{storeName}</h2><p>شناسه: {user?.membership?.store.id.toLocaleString('fa-IR')}</p></div>
        </div>
        <div className="store-illustration" aria-hidden="true">🏪</div>
        <div className="hero-metrics">
          <div><BarChart3 /><span>فروش امروز</span><strong>{money(dashboard.sales.revenue)}</strong><small>{dashboard.sales.orders_count.toLocaleString('fa-IR')} سفارش</small></div>
          <div><Box /><span>موجودی کل</span><strong>{dashboard.inventory.total_stock.toLocaleString('fa-IR')}</strong><small>{dashboard.inventory.total_variants.toLocaleString('fa-IR')} تنوع محصول</small></div>
        </div>
      </section>

      <section>
        <h3 className="section-title">دسترسی سریع</h3>
        <div className="quick-actions">
          <Link to="/sales" className="quick-action quick-action--primary"><ShoppingCart /><span>ثبت فروش</span></Link>
          <Link to="/products" className="quick-action"><PackagePlus /><span>افزودن محصول</span></Link>
          <Link to="/more" className="quick-action"><Box /><span>افزودن موجودی</span></Link>
          <Link to="/requests" className="quick-action"><MessageCircleMore /><span>ثبت درخواست</span></Link>
        </div>
      </section>

      <section>
        <h3 className="section-title">وضعیت امروز</h3>
        <div className="today-grid">
          <article className="stat-card"><ShoppingCart className="purple" /><span>سفارش امروز</span><strong>{dashboard.sales.orders_count.toLocaleString('fa-IR')}</strong><small>{money(dashboard.sales.discount)} تخفیف</small></article>
          <article className="stat-card"><AlertTriangle className="orange" /><span>کم‌موجود</span><strong>{dashboard.low_stock.length.toLocaleString('fa-IR')}</strong><small>محصول</small></article>
          <article className="stat-card"><MessageCircleMore className="orange" /><span>درخواست‌ها</span><strong>{dashboard.wanted.reduce((sum,item) => sum + item.wanted_count, 0).toLocaleString('fa-IR')}</strong><small>تقاضای ثبت‌شده</small></article>
          <article className="stat-card"><Box className="green" /><span>موجودی کل</span><strong>{dashboard.inventory.total_stock.toLocaleString('fa-IR')}</strong><small>{dashboard.inventory.total_variants.toLocaleString('fa-IR')} سایز</small></article>
        </div>
      </section>

      <section>
        <h3 className="section-title">هشدارها و فعالیت‌های اخیر</h3>
        <div className="activity-list card">
          {dashboard.low_stock.slice(0, 2).map((item) => <div key={`${item.product_name}-${item.size}`}><span className="activity-icon danger"><AlertTriangle /></span><p><strong>محصول کم‌موجود</strong><small>{item.product_name} سایز {item.size} فقط {item.current_stock.toLocaleString('fa-IR')} عدد موجود است.</small></p><time>اکنون</time></div>)}
          {dashboard.wanted.slice(0, 1).map((item) => <div key={`${item.product_name}-${item.size}`}><span className="activity-icon purple"><MessageCircleMore /></span><p><strong>تقاضای پرتکرار</strong><small>{item.product_name} سایز {item.size}، {item.wanted_count.toLocaleString('fa-IR')} درخواست دارد.</small></p><time>اکنون</time></div>)}
          <Link to="/sales" className="all-link">مشاهده همه فعالیت‌ها <ArrowLeft size={16} /></Link>
        </div>
      </section>

      <section>
        <div className="section-heading"><h3 className="section-title">پرفروش‌ها</h3><Link to="/products">مشاهده همه</Link></div>
        <div className="top-products">
          {dashboard.products.slice(0, 4).map((product) => (
            <article key={product.product_name}><span className="product-visual">👟</span><b>{product.product_name}</b><small>{product.sold_count.toLocaleString('fa-IR')} فروش</small><strong>محصول پرفروش</strong></article>
          ))}
        </div>
      </section>
    </div>
  )
}
