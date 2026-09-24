import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Ban, Box, CheckCircle2, LoaderCircle, PackagePlus, Save, ShoppingBag, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { StatusBadge } from '../components/UI'
import { createVariant, deleteProduct, deleteVariant, getProduct, updateProduct, updateProductSalePrice } from '../features/products/productApi'
import { useAuth } from '../features/auth/useAuth'
import { ApiError } from '../lib/api'
import { cancelSale, deleteDraftSale, getSale } from '../features/sales/salesApi'
import type { Product, Sale, UpdateProductSalePriceInput } from '../types/api'

function DetailLoading() { return <div className="loading-state home-loading"><LoaderCircle className="spin" /></div> }

export function ProductDetailPage() {
  const id = Number(useParams().productId)
  const [priceMessage, setPriceMessage] = useState('')
  const { data, isPending, isError } = useQuery({ queryKey: ['product', id], queryFn: () => getProduct(id), enabled: Number.isFinite(id) })
  if (isPending) return <DetailLoading />
  if (isError || !data) return <div className="error-state home-loading"><Box /><strong>محصول پیدا نشد</strong></div>
  return <ProductEditor key={data.updated_at} product={data} priceMessage={priceMessage} onPriceUpdated={() => setPriceMessage('قیمت فروش تمام سایزها با موفقیت تغییر کرد.')} />
}

function ProductEditor({ product, priceMessage, onPriceUpdated }: { product: Product; priceMessage: string; onPriceUpdated: () => void }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [form, setForm] = useState({ name: product.name, description: product.description || '' })
  const [variant, setVariant] = useState({ size: '', purchase_price: '', sale_price: '' })
  const [priceModalOpen, setPriceModalOpen] = useState(false)
  const [error, setError] = useState('')
  const canManageCatalog = user?.membership?.permissions.includes('manage_catalog') ?? false
  const refresh = async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ['product', product.id] }), queryClient.invalidateQueries({ queryKey: ['products'] })]) }
  const updateMutation = useMutation({ mutationFn: () => updateProduct(product.id, { ...form, categories: product.categories }), onSuccess: refresh, onError: (mutationError) => setError((mutationError as Error).message) })
  const variantMutation = useMutation({ mutationFn: () => createVariant(product.id, variant), onSuccess: async () => { await refresh(); setVariant({ size: '', purchase_price: '', sale_price: '' }) }, onError: (mutationError) => setError((mutationError as Error).message) })
  const deleteVariantMutation = useMutation({ mutationFn: deleteVariant, onSuccess: refresh, onError: (mutationError) => setError((mutationError as Error).message) })
  const deleteMutation = useMutation({ mutationFn: () => deleteProduct(product.id), onSuccess: () => navigate('/products', { replace: true }), onError: (mutationError) => setError((mutationError as Error).message) })

  return <div className="page detail-page">
    <div className="subpage-heading"><Link to="/products"><ArrowRight /></Link><div><h2>جزئیات محصول</h2><p>ویرایش اطلاعات و مدیریت سایزها</p></div></div>
    <section className="detail-hero card"><span className="product-visual large">👟</span><div><h2>{product.name}</h2><p>{product.variants.length.toLocaleString('fa-IR')} سایز · موجودی {product.variants.reduce((sum, item) => sum + item.current_stock, 0).toLocaleString('fa-IR')}</p></div></section>
    {priceMessage && <p className="form-success"><CheckCircle2 />{priceMessage}</p>}
    <section className="detail-form card"><h3>اطلاعات محصول</h3><label>نام محصول<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>توضیحات<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><button className="secondary-button" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}><Save /> ذخیره تغییرات</button></section>
    <section className="variant-section"><h3>سایزها</h3>{canManageCatalog && product.variants.length > 0 && <button className="secondary-button" onClick={() => setPriceModalOpen(true)}><Save /> تغییر قیمت همه سایزها</button>}{product.variants.map((item) => <article className="variant-row card" key={item.id}><span><strong>سایز {item.size}</strong><small>موجودی {item.current_stock.toLocaleString('fa-IR')}</small></span><span><strong>{Number(item.sale_price).toLocaleString('fa-IR')}</strong><small>تومان</small></span><button onClick={() => window.confirm('این سایز حذف شود؟') && deleteVariantMutation.mutate(item.id)}><Trash2 /></button></article>)}</section>
    <section className="detail-form card"><h3>افزودن سایز</h3><div className="form-row"><label>سایز<input value={variant.size} onChange={(event) => setVariant({ ...variant, size: event.target.value })} /></label><label>قیمت خرید<input type="number" value={variant.purchase_price} onChange={(event) => setVariant({ ...variant, purchase_price: event.target.value })} /></label></div><label>قیمت فروش<input type="number" value={variant.sale_price} onChange={(event) => setVariant({ ...variant, sale_price: event.target.value })} /></label><button className="secondary-button" onClick={() => { if (!variant.size || !variant.purchase_price || !variant.sale_price) { setError('اطلاعات سایز را کامل کنید.'); return } variantMutation.mutate() }}><PackagePlus /> افزودن سایز</button></section>
    {error && <p className="form-alert">{error}</p>}
    <button className="danger-button" onClick={() => window.confirm('محصول و تمام سایزهای آن حذف شوند؟') && deleteMutation.mutate()}><Trash2 /> حذف محصول</button>
    {priceModalOpen && <BulkSalePriceModal product={product} onClose={() => setPriceModalOpen(false)} onSuccess={onPriceUpdated} />}
  </div>
}

function getSalePriceError(error: unknown) {
  if (error instanceof ApiError && error.data && 'sale_price' in error.data) {
    const fieldError = error.data.sale_price
    if (Array.isArray(fieldError)) return fieldError[0]
    if (typeof fieldError === 'string') return fieldError
  }
  return error instanceof Error ? error.message : 'تغییر قیمت ناموفق بود.'
}

function BulkSalePriceModal({ product, onClose, onSuccess }: { product: Product; onClose: () => void; onSuccess: () => void }) {
  const queryClient = useQueryClient()
  const [salePrice, setSalePrice] = useState('')
  const [error, setError] = useState('')
  const mutation = useMutation({
    mutationFn: (input: UpdateProductSalePriceInput) => updateProductSalePrice(product.id, input),
    onSuccess: async (updatedProduct) => {
      onClose()
      onSuccess()
      queryClient.setQueryData(['product', product.id], updatedProduct)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['product', product.id] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
      ])
    },
    onError: (mutationError) => setError(getSalePriceError(mutationError)),
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!salePrice.trim()) {
      setError('قیمت فروش جدید را وارد کنید.')
      return
    }
    const numericPrice = Number(salePrice)
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setError('قیمت فروش نمی‌تواند منفی باشد.')
      return
    }
    mutation.mutate({ sale_price: numericPrice })
  }

  const close = () => {
    if (!mutation.isPending) onClose()
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}>
    <section className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="bulk-price-title">
      <header><div><h2 id="bulk-price-title">تغییر قیمت همه سایزها</h2><p>قیمت فروش تمام {product.variants.length.toLocaleString('fa-IR')} سایز «{product.name}» تغییر می‌کند؛ قیمت خرید بدون تغییر می‌ماند.</p></div><button type="button" onClick={close} disabled={mutation.isPending} aria-label="بستن"><X /></button></header>
      <form className="modal-form" onSubmit={submit} noValidate>
        <label>قیمت فروش جدید (تومان) *<input type="number" min="0" step="1" inputMode="numeric" value={salePrice} onChange={(event) => setSalePrice(event.target.value)} autoFocus /></label>
        {error && <p className="form-alert">{error}</p>}
        <button className="primary-button" disabled={mutation.isPending}>{mutation.isPending ? <LoaderCircle className="spin" /> : <Save />} اعمال قیمت برای همه سایزها</button>
      </form>
    </section>
  </div>
}

const saleStatus: Record<Sale['status'], { label: string; tone: string }> = { completed: { label: 'تکمیل‌شده', tone: 'success' }, draft: { label: 'پیش‌نویس', tone: 'neutral' }, cancelled: { label: 'لغو شده', tone: 'danger' } }

export function SaleDetailPage() {
  const id = Number(useParams().saleId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: sale, isPending, isError } = useQuery({ queryKey: ['sale', id], queryFn: () => getSale(id), enabled: Number.isFinite(id) })
  const refresh = async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ['sale', id] }), queryClient.invalidateQueries({ queryKey: ['sales'] }), queryClient.invalidateQueries({ queryKey: ['dashboard'] }), queryClient.invalidateQueries({ queryKey: ['products'] })]) }
  const cancelMutation = useMutation({ mutationFn: () => cancelSale(id), onSuccess: refresh })
  const deleteMutation = useMutation({ mutationFn: () => deleteDraftSale(id), onSuccess: () => navigate('/sales', { replace: true }) })
  if (isPending) return <DetailLoading />
  if (isError || !sale) return <div className="error-state home-loading"><ShoppingBag /><strong>فروش پیدا نشد</strong></div>
  const meta = saleStatus[sale.status]

  return <div className="page detail-page">
    <div className="subpage-heading"><Link to="/sales"><ArrowRight /></Link><div><h2>فروش #{sale.id.toLocaleString('fa-IR')}</h2><p>{new Date(sale.created_at).toLocaleString('fa-IR')}</p></div></div>
    <section className="sale-total card"><ShoppingBag /><div><span>مبلغ نهایی</span><strong>{Number(sale.total_amount).toLocaleString('fa-IR')} <small>تومان</small></strong></div><StatusBadge tone={meta.tone}>{meta.label}</StatusBadge></section>
    <section className="invoice-items"><h3>اقلام فاکتور</h3>{sale.items.map((item) => <article className="invoice-row card" key={item.id}><span className="product-visual compact">👟</span><div><strong>{item.product_name}</strong><small>سایز {item.size} · تعداد {item.quantity.toLocaleString('fa-IR')}</small></div><span><strong>{Number(item.final_price).toLocaleString('fa-IR')}</strong><small>تومان</small></span></article>)}</section>
    <section className="sale-meta card"><div><span>کانال فروش</span><strong>{sale.channel}</strong></div><div><span>روش پرداخت</span><strong>{sale.payment_method}</strong></div><div><span>مشتری</span><strong>{sale.customer ? `#${sale.customer.toLocaleString('fa-IR')}` : 'بدون مشتری'}</strong></div></section>
    {sale.status === 'completed' && sale.completed_at && <section className="sale-completed-at card"><CheckCircle2 /><span><small>زمان تکمیل فروش</small><strong>{new Date(sale.completed_at).toLocaleString('fa-IR')}</strong></span></section>}
    {sale.status === 'completed' && <button className="danger-button" onClick={() => window.confirm('فروش لغو و موجودی کالاها بازگردانده شود؟') && cancelMutation.mutate()}><Ban /> لغو فروش و بازگردانی موجودی</button>}
    {sale.status === 'draft' && <button className="danger-button" onClick={() => window.confirm('پیش‌نویس حذف شود؟') && deleteMutation.mutate()}><Trash2 /> حذف پیش‌نویس</button>}
  </div>
}
