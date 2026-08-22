import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Box, Grid2X2, LoaderCircle, PackageX, Plus, RotateCcw, SlidersHorizontal, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, FilterButton, Pagination, SearchBox, StatusBadge } from '../components/UI'
import { createProductWithVariant, getAllCategories, getProducts } from '../features/products/productApi'
import { ApiError } from '../lib/api'
import type { Product } from '../types/api'

function formatPrice(value?: string) {
  if (!value) return 'بدون قیمت'
  return `${Number(value).toLocaleString('fa-IR')} تومان`
}

function getProductStatus(product: Product) {
  const stock = product.variants.reduce((sum, variant) => sum + variant.current_stock, 0)
  if (stock === 0) return { label: 'ناموجود', tone: 'danger' }
  if (stock <= 2) return { label: 'کم‌موجود', tone: 'warning' }
  return { label: 'موجود', tone: 'success' }
}

export function ProductsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [stockStatus, setStockStatus] = useState('')
  const [ordering, setOrdering] = useState('')
  const [isCreateOpen, setCreateOpen] = useState(false)
  const { data: categories } = useQuery({ queryKey: ['categories', 'product-filters'], queryFn: getAllCategories })
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['products', search, page, categoryId, stockStatus, ordering],
    queryFn: () => getProducts({ search, page, categoryId, stockStatus, ordering }),
  })
  const products = useMemo(() => data?.results ?? [], [data?.results])
  const totals = useMemo(() => products.reduce((result, product) => {
    const stock = product.variants.reduce((sum, variant) => sum + variant.current_stock, 0)
    if (stock === 0) result.out += 1
    else if (stock <= 2) result.low += 1
    return result
  }, { low: 0, out: 0 }), [products])

  return (
    <div className="page list-page">
      <SearchBox placeholder="جستجو در محصولات..." value={search} onChange={(value) => { setSearch(value); setPage(1) }} />
      <div className="filters"><FilterButton icon={Grid2X2} active={Boolean(categoryId)} onClick={() => setFiltersOpen((value) => !value)}>دسته‌بندی</FilterButton><FilterButton icon={SlidersHorizontal} active={Boolean(stockStatus)} onClick={() => setFiltersOpen((value) => !value)}>وضعیت موجودی</FilterButton><FilterButton icon={SlidersHorizontal} active={Boolean(ordering)} onClick={() => setFiltersOpen((value) => !value)}>مرتب‌سازی</FilterButton></div>
      {filtersOpen && <section className="filter-panel card"><label>دسته‌بندی<select value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setPage(1) }}><option value="">همه دسته‌بندی‌ها</option>{categories?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>وضعیت موجودی<select value={stockStatus} onChange={(event) => { setStockStatus(event.target.value); setPage(1) }}><option value="">همه وضعیت‌ها</option><option value="in_stock">موجود</option><option value="low_stock">کم‌موجود</option><option value="out_of_stock">ناموجود</option></select></label><label>مرتب‌سازی<select value={ordering} onChange={(event) => { setOrdering(event.target.value); setPage(1) }}><option value="">قدیمی‌ترین</option><option value="-created">جدیدترین</option><option value="name">نام: الف تا ی</option><option value="-name">نام: ی تا الف</option></select></label><button className="filter-reset" type="button" onClick={() => { setCategoryId(''); setStockStatus(''); setOrdering(''); setPage(1) }}><RotateCcw /> پاک‌کردن فیلترها</button></section>}
      <button className="primary-button" onClick={() => setCreateOpen(true)}><Plus /> افزودن محصول جدید</button>
      <div className="summary-card card three-columns">
        <div><Box /><strong>{data?.count ?? '—'}</strong><span>کل محصولات</span></div>
        <div><SlidersHorizontal className="orange" /><strong>{totals.low}</strong><span>کم‌موجود این صفحه</span></div>
        <div><PackageX className="red" /><strong>{totals.out}</strong><span>ناموجود این صفحه</span></div>
      </div>
      <div className="entity-list">
        {isPending && <div className="loading-state"><LoaderCircle className="spin" /><span>در حال دریافت محصولات...</span></div>}
        {isError && <div className="error-state"><PackageX /><strong>دریافت محصولات ناموفق بود</strong><span>{(error as Error).message}</span></div>}
        {!isPending && !isError && (products.length ? products.map((product) => {
          const status = getProductStatus(product)
          return (
            <Link className="entity-card card entity-link" to={`/products/${product.id}`} key={product.id}>
              <span className="product-visual">👟</span>
              <div className="entity-main"><strong>{product.name}</strong><span>{product.description || 'بدون توضیحات'}</span><b>{formatPrice(product.variants[0]?.sale_price)}</b></div>
              <div className="entity-side"><StatusBadge tone={status.tone}>{status.label}</StatusBadge><span>{product.variants.length} سایز</span></div>
              <ArrowLeft className="chevron" />
            </Link>
          )
        }) : <EmptyState search={search || 'محصولات'} />)}
      </div>
      <Pagination page={page} count={data?.count ?? 0} onChange={setPage} />
      {isCreateOpen && <CreateProductModal onClose={() => setCreateOpen(false)} />}
    </div>
  )
}

function CreateProductModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const { data: categories } = useQuery({ queryKey: ['categories', 'product-picker'], queryFn: getAllCategories })
  const [form, setForm] = useState({ name: '', description: '', category: '', size: '', purchase_price: '', sale_price: '' })
  const [error, setError] = useState('')
  const mutation = useMutation({
    mutationFn: createProductWithVariant,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      onClose()
    },
    onError: (mutationError) => setError(mutationError instanceof ApiError ? mutationError.message : 'ثبت محصول ناموفق بود.'),
  })

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!form.name || !form.size || !form.purchase_price || !form.sale_price) { setError('فیلدهای ضروری را کامل کنید.'); return }
    mutation.mutate({
      name: form.name,
      description: form.description,
      categories: form.category ? [Number(form.category)] : [],
      size: form.size,
      purchase_price: form.purchase_price,
      sale_price: form.sale_price,
    })
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="create-product-title">
        <header><div><h2 id="create-product-title">افزودن محصول</h2><p>اطلاعات محصول و اولین سایز آن را وارد کنید.</p></div><button onClick={onClose} aria-label="بستن"><X /></button></header>
        <form className="modal-form" onSubmit={submit}>
          <label>نام محصول *<input value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="مثلاً Nike Air Force 1" autoFocus /></label>
          <label>توضیحات<input value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="توضیح کوتاه محصول" /></label>
          <label>دسته‌بندی<select value={form.category} onChange={(event) => update('category', event.target.value)}><option value="">بدون دسته‌بندی</option>{categories?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <div className="form-row"><label>سایز *<input value={form.size} onChange={(event) => update('size', event.target.value)} placeholder="۴۲" /></label><label>قیمت خرید *<input type="number" value={form.purchase_price} onChange={(event) => update('purchase_price', event.target.value)} placeholder="۰" /></label></div>
          <label>قیمت فروش (تومان) *<input type="number" value={form.sale_price} onChange={(event) => update('sale_price', event.target.value)} placeholder="۰" /></label>
          {error && <p className="form-alert">{error}</p>}
          <button className="primary-button" disabled={mutation.isPending}>{mutation.isPending ? <LoaderCircle className="spin" /> : <Plus />} ثبت محصول</button>
        </form>
      </section>
    </div>
  )
}
