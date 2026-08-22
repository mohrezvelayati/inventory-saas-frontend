import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CalendarDays, CheckCircle2, LoaderCircle, Plus, ShoppingBag, Store } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, FilterButton, SearchBox, StatusBadge } from '../components/UI'
import { getSales } from '../features/sales/salesApi'
import type { Sale } from '../types/api'

const statusMeta: Record<Sale['status'], { label: string; tone: string }> = {
  completed: { label: 'تکمیل‌شده', tone: 'success' },
  draft: { label: 'پیش‌نویس', tone: 'neutral' },
  cancelled: { label: 'لغو شده', tone: 'danger' },
}
const channelLabels: Record<Sale['channel'], string> = { store: 'حضوری', instagram: 'اینستاگرام', website: 'وب‌سایت', referral: 'معرفی', other: 'سایر' }

export function SalesPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const { data, isPending, isError, error } = useQuery({ queryKey: ['sales', status], queryFn: () => getSales(status) })
  const sales = useMemo(() => (data?.results ?? []).filter((item) => `${item.id} ${item.customer ?? ''}`.includes(search)), [data?.results, search])
  const completed = data?.results.filter((item) => item.status === 'completed') ?? []
  const drafts = data?.results.filter((item) => item.status === 'draft') ?? []
  const revenue = completed.reduce((sum, item) => sum + Number(item.total_amount), 0)

  return (
    <div className="page list-page">
      <SearchBox placeholder="جستجو با شماره فروش..." value={search} onChange={setSearch} />
      <div className="filters"><FilterButton icon={CheckCircle2}>وضعیت</FilterButton><FilterButton icon={CalendarDays}>بازه زمانی</FilterButton><FilterButton icon={Store}>کانال فروش</FilterButton></div>
      <div className="status-tabs">
        {[{ value: '', label: 'همه' }, { value: 'completed', label: 'تکمیل‌شده' }, { value: 'draft', label: 'پیش‌نویس' }, { value: 'cancelled', label: 'لغوشده' }].map((item) => <button key={item.value} className={status === item.value ? 'active' : ''} onClick={() => setStatus(item.value)}>{item.label}</button>)}
      </div>
      <Link className="primary-button primary-link" to="/sales/new"><Plus /> ثبت فروش جدید</Link>
      <div className="summary-card card three-columns">
        <div><ShoppingBag /><strong>{revenue.toLocaleString('fa-IR')}</strong><span>فروش این صفحه</span></div>
        <div><CheckCircle2 className="green" /><strong>{completed.length.toLocaleString('fa-IR')}</strong><span>تکمیل‌شده</span></div>
        <div><CalendarDays className="orange" /><strong>{drafts.length.toLocaleString('fa-IR')}</strong><span>پیش‌نویس‌ها</span></div>
      </div>
      <div className="entity-list">
        {isPending && <div className="loading-state"><LoaderCircle className="spin" /><span>در حال دریافت فروش‌ها...</span></div>}
        {isError && <div className="error-state"><ShoppingBag /><strong>دریافت فروش‌ها ناموفق بود</strong><span>{(error as Error).message}</span></div>}
        {!isPending && !isError && (sales.length ? sales.map((sale) => {
          const meta = statusMeta[sale.status]
          return (
            <Link className="entity-card sale-card card entity-link" to={`/sales/${sale.id}`} key={sale.id}>
              <span className="soft-icon"><ShoppingBag /></span>
              <div className="entity-main"><strong>فروش #{sale.id.toLocaleString('fa-IR')}</strong><span>{new Date(sale.created_at).toLocaleString('fa-IR')}</span><small>کانال: {channelLabels[sale.channel]}</small></div>
              <div className="entity-side"><b>{Number(sale.total_amount).toLocaleString('fa-IR')}</b><span>تومان</span><StatusBadge tone={meta.tone}>{meta.label}</StatusBadge><small>{sale.items.length.toLocaleString('fa-IR')} قلم کالا</small></div>
              <ArrowLeft className="chevron" />
            </Link>
          )
        }) : <EmptyState search={search || 'فروش‌ها'} />)}
      </div>
      <Link className="floating-button" aria-label="ثبت فروش" to="/sales/new"><Plus /></Link>
    </div>
  )
}
