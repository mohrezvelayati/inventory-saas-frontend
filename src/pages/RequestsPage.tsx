import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Box, CalendarDays, Clock3, LoaderCircle, MessageCircleMore, Plus, TrendingUp, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState, FilterButton, SearchBox, StatusBadge } from '../components/UI'
import { getProducts } from '../features/products/productApi'
import { createWantedProduct, getWantedProducts } from '../features/wanted/wantedApi'
import { ApiError } from '../lib/api'

export function RequestsPage() {
  const [search, setSearch] = useState('')
  const [isCreateOpen, setCreateOpen] = useState(false)
  const { data, isPending, isError, error } = useQuery({ queryKey: ['wanted'], queryFn: getWantedProducts })
  const requests = useMemo(() => (data?.results ?? []).filter((item) => `${item.product_name} ${item.brand}`.toLowerCase().includes(search.toLowerCase())), [data?.results, search])
  const total = data?.results.reduce((sum, item) => sum + item.wanted_count, 0) ?? 0
  const popular = data?.results.filter((item) => item.wanted_count >= 5).length ?? 0

  return (
    <div className="page list-page">
      <SearchBox placeholder="جستجو در درخواست‌ها..." value={search} onChange={setSearch} />
      <div className="filters"><FilterButton icon={MessageCircleMore}>تعداد درخواست</FilterButton><FilterButton icon={CalendarDays}>بازه زمانی</FilterButton><FilterButton icon={Box}>محصول</FilterButton></div>
      <button className="primary-button" onClick={() => setCreateOpen(true)}><Plus /> ثبت درخواست جدید</button>
      <div className="summary-card card three-columns">
        <div><Box /><strong>{data?.count ?? '—'}</strong><span>کالاهای درخواستی</span></div>
        <div><Clock3 className="orange" /><strong>{total.toLocaleString('fa-IR')}</strong><span>مجموع تقاضا</span></div>
        <div><TrendingUp /><strong>{popular.toLocaleString('fa-IR')}</strong><span>محبوب‌ترین‌ها</span></div>
      </div>
      <div className="entity-list">
        {isPending && <div className="loading-state"><LoaderCircle className="spin" /><span>در حال دریافت درخواست‌ها...</span></div>}
        {isError && <div className="error-state"><MessageCircleMore /><strong>دریافت درخواست‌ها ناموفق بود</strong><span>{(error as Error).message}</span></div>}
        {!isPending && !isError && (requests.length ? requests.map((request) => {
          const isPopular = request.wanted_count >= 5
          return (
            <article className={`entity-card request-card card ${isPopular ? 'featured' : ''}`} key={request.id}>
              <span className="product-visual">👟</span>
              <div className="entity-main"><strong>{request.product_name_display || request.product_name}</strong><span>{request.brand || 'بدون برند'} · سایز {request.size}</span><small>{new Date(request.created_at).toLocaleDateString('fa-IR')}</small></div>
              <div className="entity-side"><StatusBadge tone={isPopular ? 'purple' : 'info'}>{isPopular ? 'محبوب' : 'ثبت‌شده'}</StatusBadge><b>{request.wanted_count.toLocaleString('fa-IR')} درخواست</b></div>
              <ArrowLeft className="chevron" />
            </article>
          )
        }) : <EmptyState search={search || 'درخواست‌ها'} />)}
      </div>
      {isCreateOpen && <CreateWantedModal onClose={() => setCreateOpen(false)} />}
    </div>
  )
}

function CreateWantedModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const { data: products } = useQuery({ queryKey: ['products', 'wanted-picker'], queryFn: () => getProducts() })
  const [form, setForm] = useState({ product: '', product_name: '', brand: '', size: '' })
  const [error, setError] = useState('')
  const mutation = useMutation({
    mutationFn: createWantedProduct,
    onSuccess: async () => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: ['wanted'] }), queryClient.invalidateQueries({ queryKey: ['dashboard'] })])
      onClose()
    },
    onError: (mutationError) => setError(mutationError instanceof ApiError ? mutationError.message : 'ثبت درخواست ناموفق بود.'),
  })
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const selectProduct = (value: string) => {
    const selected = products?.results.find((item) => item.id === Number(value))
    setForm((current) => ({ ...current, product: value, product_name: selected?.name ?? current.product_name }))
  }
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.product_name || !form.size) { setError('نام محصول و سایز ضروری هستند.'); return }
    mutation.mutate({ product: form.product ? Number(form.product) : null, product_name: form.product_name, brand: form.brand, size: form.size })
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="create-wanted-title">
        <header><div><h2 id="create-wanted-title">ثبت درخواست جدید</h2><p>تقاضای مشتری برای کالای ناموجود را ثبت کنید.</p></div><button onClick={onClose} aria-label="بستن"><X /></button></header>
        <form className="modal-form" onSubmit={submit}>
          <label>محصول موجود در کاتالوگ (اختیاری)<select value={form.product} onChange={(event) => selectProduct(event.target.value)}><option value="">محصول خارج از کاتالوگ</option>{products?.results.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
          <label>نام محصول *<input value={form.product_name} onChange={(event) => update('product_name', event.target.value)} placeholder="مثلاً Nike Dunk Low" /></label>
          <div className="form-row"><label>برند<input value={form.brand} onChange={(event) => update('brand', event.target.value)} placeholder="Nike" /></label><label>سایز *<input value={form.size} onChange={(event) => update('size', event.target.value)} placeholder="۴۲" /></label></div>
          {error && <p className="form-alert">{error}</p>}
          <button className="primary-button" disabled={mutation.isPending}>{mutation.isPending ? <LoaderCircle className="spin" /> : <Plus />} ثبت درخواست</button>
        </form>
      </section>
    </div>
  )
}
