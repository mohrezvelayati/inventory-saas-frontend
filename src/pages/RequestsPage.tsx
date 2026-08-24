import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Box, Clock3, LoaderCircle, MessageCircleMore, Pencil, Plus, RotateCcw, SlidersHorizontal, Trash2, TrendingUp, X } from 'lucide-react'
import { useState } from 'react'
import { EmptyState, FilterButton, Pagination, SearchBox, StatusBadge } from '../components/UI'
import { getAllProducts } from '../features/products/productApi'
import { createWantedProduct, deleteWantedProduct, getWantedProducts, updateWantedProduct } from '../features/wanted/wantedApi'
import { ApiError } from '../lib/api'
import type { WantedProduct } from '../types/api'

export function RequestsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [minCount, setMinCount] = useState('')
  const [productId, setProductId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<WantedProduct | null>(null)
  const [page, setPage] = useState(1)
  const { data: products } = useQuery({ queryKey: ['products', 'wanted-picker'], queryFn: getAllProducts })
  const { data, isPending, isError, error } = useQuery({ queryKey: ['wanted', search, page, minCount, productId, dateFrom, dateTo], queryFn: () => getWantedProducts({ search, page, minCount, productId, dateFrom, dateTo }) })
  const requests = data?.results ?? []
  const total = data?.results.reduce((sum, item) => sum + item.wanted_count, 0) ?? 0
  const popular = data?.results.filter((item) => item.wanted_count >= 5).length ?? 0
  const deleteMutation = useMutation({ mutationFn: deleteWantedProduct, onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ['wanted'] }), queryClient.invalidateQueries({ queryKey: ['dashboard'] })]) } })

  return (
    <div className="page list-page">
      <SearchBox placeholder="جستجو در درخواست‌ها..." value={search} onChange={(value) => { setSearch(value); setPage(1) }} />
      <div className="filters filters--wide"><FilterButton icon={SlidersHorizontal} active={Boolean(minCount || productId || dateFrom || dateTo)} onClick={() => setFiltersOpen((value) => !value)}>فیلتر درخواست‌ها</FilterButton></div>
      {filtersOpen && <section className="filter-panel card"><label>حداقل تعداد درخواست<select value={minCount} onChange={(event) => { setMinCount(event.target.value); setPage(1) }}><option value="">بدون محدودیت</option><option value="2">۲ درخواست و بیشتر</option><option value="3">۳ درخواست و بیشتر</option><option value="5">۵ درخواست و بیشتر</option><option value="10">۱۰ درخواست و بیشتر</option></select></label><label>محصول<select value={productId} onChange={(event) => { setProductId(event.target.value); setPage(1) }}><option value="">همه محصولات</option>{products?.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label><div className="filter-date-row"><label>از تاریخ<input type="date" value={dateFrom} onChange={(event) => { const value = event.target.value; setDateFrom(value); if (dateTo && dateTo < value) setDateTo(''); setPage(1) }} /></label><label>تا تاریخ<input type="date" min={dateFrom} value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(1) }} /></label></div><button className="filter-reset" type="button" onClick={() => { setMinCount(''); setProductId(''); setDateFrom(''); setDateTo(''); setPage(1) }}><RotateCcw /> پاک‌کردن فیلترها</button></section>}
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
              <div className="entity-side"><StatusBadge tone={isPopular ? 'purple' : 'info'}>{isPopular ? 'محبوب' : 'ثبت‌شده'}</StatusBadge><b>{request.wanted_count.toLocaleString('fa-IR')} درخواست</b><div className="request-actions"><button className="row-edit" onClick={() => setEditingRequest(request)} aria-label="ویرایش درخواست"><Pencil /></button><button className="row-delete" onClick={() => window.confirm('این درخواست کالا حذف شود؟') && deleteMutation.mutate(request.id)} aria-label="حذف درخواست"><Trash2 /></button></div></div>
              <ArrowLeft className="chevron" />
            </article>
          )
        }) : <EmptyState search={search || 'درخواست‌ها'} />)}
      </div>
      <Pagination page={page} count={data?.count ?? 0} onChange={setPage} />
      {isCreateOpen && <CreateWantedModal onClose={() => setCreateOpen(false)} />}
      {editingRequest && <EditWantedModal request={editingRequest} onClose={() => setEditingRequest(null)} />}
    </div>
  )
}

function EditWantedModal({ request, onClose }: { request: WantedProduct; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { data: products } = useQuery({ queryKey: ['products', 'wanted-picker'], queryFn: getAllProducts })
  const [form, setForm] = useState({ product: request.product?.toString() ?? '', product_name: request.product_name, brand: request.brand, size: request.size })
  const [error, setError] = useState('')
  const mutation = useMutation({
    mutationFn: () => updateWantedProduct(request.id, { product: form.product ? Number(form.product) : null, product_name: form.product_name, brand: form.brand, size: form.size }),
    onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ['wanted'] }), queryClient.invalidateQueries({ queryKey: ['dashboard'] })]); onClose() },
    onError: (mutationError) => setError((mutationError as Error).message),
  })
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const selectProduct = (value: string) => { const selected = products?.find((item) => item.id === Number(value)); setForm((current) => ({ ...current, product: value, product_name: selected?.name ?? current.product_name })) }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="edit-wanted-title"><header><div><h2 id="edit-wanted-title">ویرایش درخواست</h2><p>اطلاعات کالای درخواستی را اصلاح کنید.</p></div><button onClick={onClose} aria-label="بستن"><X /></button></header><form className="modal-form" onSubmit={(event) => { event.preventDefault(); setError(''); if (!form.product_name.trim() || !form.size.trim()) { setError('نام محصول و سایز ضروری هستند.'); return } mutation.mutate() }}><label>محصول موجود در کاتالوگ (اختیاری)<select value={form.product} onChange={(event) => selectProduct(event.target.value)}><option value="">محصول خارج از کاتالوگ</option>{products?.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label><label>نام محصول *<input value={form.product_name} onChange={(event) => update('product_name', event.target.value)} /></label><div className="form-row"><label>برند<input value={form.brand} onChange={(event) => update('brand', event.target.value)} /></label><label>سایز *<input value={form.size} onChange={(event) => update('size', event.target.value)} /></label></div>{error && <p className="form-alert">{error}</p>}<button className="primary-button" disabled={mutation.isPending}>{mutation.isPending ? <LoaderCircle className="spin" /> : <Pencil />} ذخیره تغییرات</button></form></section></div>
}

function CreateWantedModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const { data: products } = useQuery({ queryKey: ['products', 'wanted-picker'], queryFn: getAllProducts })
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
    const selected = products?.find((item) => item.id === Number(value))
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
          <label>محصول موجود در کاتالوگ (اختیاری)<select value={form.product} onChange={(event) => selectProduct(event.target.value)}><option value="">محصول خارج از کاتالوگ</option>{products?.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
          <label>نام محصول *<input value={form.product_name} onChange={(event) => update('product_name', event.target.value)} placeholder="مثلاً Nike Dunk Low" /></label>
          <div className="form-row"><label>برند<input value={form.brand} onChange={(event) => update('brand', event.target.value)} placeholder="Nike" /></label><label>سایز *<input value={form.size} onChange={(event) => update('size', event.target.value)} placeholder="۴۲" /></label></div>
          {error && <p className="form-alert">{error}</p>}
          <button className="primary-button" disabled={mutation.isPending}>{mutation.isPending ? <LoaderCircle className="spin" /> : <Plus />} ثبت درخواست</button>
        </form>
      </section>
    </div>
  )
}
