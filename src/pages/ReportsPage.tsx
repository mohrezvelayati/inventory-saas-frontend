import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ArrowRight, BarChart3, Boxes, CircleDollarSign, LoaderCircle, PackageX, ReceiptText, ShoppingBag, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getReports } from '../features/dashboard/dashboardApi'
import type { Sale } from '../types/api'

const channelLabels: Record<Sale['channel'], string> = { store: 'حضوری', instagram: 'اینستاگرام', website: 'وب‌سایت', referral: 'معرفی', other: 'سایر' }
const money = (value: string | number) => Number(value).toLocaleString('fa-IR')
const isoDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
const getPresetRange = (days: number) => {
  const end = new Date()
  const start = new Date(end)
  start.setDate(end.getDate() - days + 1)
  return { dateFrom: isoDate(start), dateTo: isoDate(end) }
}

export function ReportsPage() {
  const initialRange = getPresetRange(30)
  const [dateFrom, setDateFrom] = useState(initialRange.dateFrom)
  const [dateTo, setDateTo] = useState(initialRange.dateTo)
  const [preset, setPreset] = useState(30)
  const { data, isPending, isError, error } = useQuery({ queryKey: ['reports', dateFrom, dateTo], queryFn: () => getReports(dateFrom, dateTo) })

  const applyPreset = (days: number) => {
    const range = getPresetRange(days)
    setPreset(days)
    setDateFrom(range.dateFrom)
    setDateTo(range.dateTo)
  }

  if (isPending) return <div className="loading-state home-loading"><LoaderCircle className="spin" /><span>در حال محاسبه گزارش...</span></div>
  if (isError || !data) return <div className="error-state home-loading"><AlertTriangle /><strong>گزارش دریافت نشد</strong><span>{(error as Error).message}</span></div>

  const maxDailyRevenue = Math.max(...data.daily.map((item) => Number(item.revenue)), 1)
  const maxChannelRevenue = Math.max(...data.channels.map((item) => Number(item.revenue)), 1)
  const profitMargin = Number(data.sales.revenue) > 0 ? Math.round(Number(data.sales.gross_profit) / Number(data.sales.revenue) * 100) : 0

  return <div className="page reports-page">
    <div className="subpage-heading"><Link to="/more" aria-label="بازگشت"><ArrowRight /></Link><div><h2>گزارش‌ها</h2><p>تحلیل فروش، سود و وضعیت موجودی فروشگاه</p></div></div>

    <section className="report-range card">
      <div className="report-presets">{[{ days: 1, label: 'امروز' }, { days: 7, label: '۷ روز' }, { days: 30, label: '۳۰ روز' }, { days: 90, label: '۹۰ روز' }].map((item) => <button key={item.days} className={preset === item.days ? 'active' : ''} onClick={() => applyPreset(item.days)}>{item.label}</button>)}</div>
      <div className="filter-date-row"><label>از تاریخ<input type="date" value={dateFrom} max={dateTo} onChange={(event) => { setPreset(0); setDateFrom(event.target.value) }} /></label><label>تا تاریخ<input type="date" value={dateTo} min={dateFrom} onChange={(event) => { setPreset(0); setDateTo(event.target.value) }} /></label></div>
    </section>

    <section className="report-metrics">
      <article className="card"><CircleDollarSign /><span>درآمد</span><strong>{money(data.sales.revenue)}</strong><small>تومان</small></article>
      <article className="card"><TrendingUp /><span>سود</span><strong>{money(data.sales.gross_profit)}</strong><small>{profitMargin.toLocaleString('fa-IR')}٪ حاشیه سود</small></article>
      <article className="card"><ShoppingBag /><span>سفارش‌ها</span><strong>{data.sales.orders_count.toLocaleString('fa-IR')}</strong><small>{money(data.sales.average_order)} میانگین</small></article>
      <article className="card"><ReceiptText /><span>تخفیف</span><strong>{money(data.sales.discount)}</strong><small>{money(data.sales.cost)} بهای خرید</small></article>
    </section>

    <section className="report-section card">
      <header><div><BarChart3 /><span><strong>روند فروش روزانه</strong><small>{new Date(data.period.date_from).toLocaleDateString('fa-IR')} تا {new Date(data.period.date_to).toLocaleDateString('fa-IR')}</small></span></div></header>
      <div className="report-chart" aria-label="نمودار فروش روزانه">{data.daily.map((item) => <div className="report-bar-column" key={item.date} title={`${new Date(item.date).toLocaleDateString('fa-IR')}: ${money(item.revenue)} تومان`}><span>{item.orders_count ? item.orders_count.toLocaleString('fa-IR') : ''}</span><i style={{ height: `${Math.max(Number(item.revenue) / maxDailyRevenue * 100, 3)}%` }} /><small>{new Date(item.date).toLocaleDateString('fa-IR', { day: 'numeric', month: 'numeric' })}</small></div>)}</div>
    </section>

    <section className="report-section card">
      <header><div><ShoppingBag /><span><strong>کانال‌های فروش</strong><small>سهم هر کانال از درآمد بازه</small></span></div></header>
      <div className="channel-report">{data.channels.map((item) => <div key={item.channel}><span><strong>{channelLabels[item.channel]}</strong><small>{item.orders_count.toLocaleString('fa-IR')} سفارش · {money(item.revenue)} تومان</small></span><div><i style={{ width: `${Number(item.revenue) / maxChannelRevenue * 100}%` }} /></div></div>)}</div>
    </section>

    <section className="report-section card">
      <header><div><Boxes /><span><strong>وضعیت موجودی</strong><small>ارزش فعلی کالاهای انبار</small></span></div></header>
      <div className="inventory-report-grid"><div><span>تعداد موجودی</span><strong>{data.inventory.total_stock.toLocaleString('fa-IR')}</strong><small>{data.inventory.total_variants.toLocaleString('fa-IR')} سایز</small></div><div><span>ارزش خرید</span><strong>{money(data.inventory.purchase_value)}</strong><small>تومان</small></div><div><span>ارزش فروش</span><strong>{money(data.inventory.retail_value)}</strong><small>تومان</small></div><div><span>هشدار موجودی</span><strong>{(data.inventory.low_stock_count + data.inventory.out_of_stock_count).toLocaleString('fa-IR')}</strong><small>{data.inventory.out_of_stock_count.toLocaleString('fa-IR')} ناموجود</small></div></div>
    </section>

    <section className="report-section card">
      <header><div><PackageX /><span><strong>محصولات پرفروش</strong><small>بر اساس تعداد فروش در بازه انتخابی</small></span></div></header>
      <div className="report-product-list">{data.products.length ? data.products.map((product, index) => <div key={product.product_name}><b>{(index + 1).toLocaleString('fa-IR')}</b><span><strong>{product.product_name}</strong><small>{product.sold_count.toLocaleString('fa-IR')} عدد فروخته‌شده</small></span><em>{money(product.revenue)} تومان</em></div>) : <p>در این بازه فروشی ثبت نشده است.</p>}</div>
    </section>
  </div>
}
