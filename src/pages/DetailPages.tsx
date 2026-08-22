import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Ban, Box, LoaderCircle, PackagePlus, Save, ShoppingBag, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { StatusBadge } from '../components/UI'
import { createVariant, deleteProduct, deleteVariant, getProduct, updateProduct } from '../features/products/productApi'
import { cancelSale, deleteDraftSale, getSale } from '../features/sales/salesApi'
import type { Product, Sale } from '../types/api'

function DetailLoading() { return <div className="loading-state home-loading"><LoaderCircle className="spin" /></div> }

export function ProductDetailPage() {
  const id = Number(useParams().productId)
  const { data, isPending, isError } = useQuery({ queryKey: ['product', id], queryFn: () => getProduct(id), enabled: Number.isFinite(id) })
  if (isPending) return <DetailLoading />
  if (isError || !data) return <div className="error-state home-loading"><Box /><strong>محصول پیدا نشد</strong></div>
  return <ProductEditor key={data.updated_at} product={data} />
}

function ProductEditor({ product }: { product: Product }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ name: product.name, description: product.description || '' })
  const [variant, setVariant] = useState({ size: '', purchase_price: '', sale_price: '' })
  const [error, setError] = useState('')
  const refresh = async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ['product', product.id] }), queryClient.invalidateQueries({ queryKey: ['products'] })]) }
  const updateMutation = useMutation({ mutationFn: () => updateProduct(product.id, { ...form, categories: product.categories }), onSuccess: refresh, onError: (mutationError) => setError((mutationError as Error).message) })
  const variantMutation = useMutation({ mutationFn: () => createVariant(product.id, variant), onSuccess: async () => { await refresh(); setVariant({ size: '', purchase_price: '', sale_price: '' }) }, onError: (mutationError) => setError((mutationError as Error).message) })
  const deleteVariantMutation = useMutation({ mutationFn: deleteVariant, onSuccess: refresh, onError: (mutationError) => setError((mutationError as Error).message) })
  const deleteMutation = useMutation({ mutationFn: () => deleteProduct(product.id), onSuccess: () => navigate('/products', { replace: true }), onError: (mutationError) => setError((mutationError as Error).message) })

  return <div className="page detail-page">
    <div className="subpage-heading"><Link to="/products"><ArrowRight /></Link><div><h2>جزئیات محصول</h2><p>ویرایش اطلاعات و مدیریت سایزها</p></div></div>
    <section className="detail-hero card"><span className="product-visual large">👟</span><div><h2>{product.name}</h2><p>{product.variants.length.toLocaleString('fa-IR')} سایز · موجودی {product.variants.reduce((sum, item) => sum + item.current_stock, 0).toLocaleString('fa-IR')}</p></div></section>
    <section className="detail-form card"><h3>اطلاعات محصول</h3><label>نام محصول<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>توضیحات<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><button className="secondary-button" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}><Save /> ذخیره تغییرات</button></section>
    <section className="variant-section"><h3>سایزها</h3>{product.variants.map((item) => <article className="variant-row card" key={item.id}><span><strong>سایز {item.size}</strong><small>موجودی {item.current_stock.toLocaleString('fa-IR')}</small></span><span><strong>{Number(item.sale_price).toLocaleString('fa-IR')}</strong><small>تومان</small></span><button onClick={() => window.confirm('این سایز حذف شود؟') && deleteVariantMutation.mutate(item.id)}><Trash2 /></button></article>)}</section>
    <section className="detail-form card"><h3>افزودن سایز</h3><div className="form-row"><label>سایز<input value={variant.size} onChange={(event) => setVariant({ ...variant, size: event.target.value })} /></label><label>قیمت خرید<input type="number" value={variant.purchase_price} onChange={(event) => setVariant({ ...variant, purchase_price: event.target.value })} /></label></div><label>قیمت فروش<input type="number" value={variant.sale_price} onChange={(event) => setVariant({ ...variant, sale_price: event.target.value })} /></label><button className="secondary-button" onClick={() => { if (!variant.size || !variant.purchase_price || !variant.sale_price) { setError('اطلاعات سایز را کامل کنید.'); return } variantMutation.mutate() }}><PackagePlus /> افزودن سایز</button></section>
    {error && <p className="form-alert">{error}</p>}
    <button className="danger-button" onClick={() => window.confirm('محصول و تمام سایزهای آن حذف شوند؟') && deleteMutation.mutate()}><Trash2 /> حذف محصول</button>
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
    {sale.status === 'completed' && <button className="danger-button" onClick={() => window.confirm('فروش لغو و موجودی کالاها بازگردانده شود؟') && cancelMutation.mutate()}><Ban /> لغو فروش و بازگردانی موجودی</button>}
    {sale.status === 'draft' && <button className="danger-button" onClick={() => window.confirm('پیش‌نویس حذف شود؟') && deleteMutation.mutate()}><Trash2 /> حذف پیش‌نویس</button>}
  </div>
}
