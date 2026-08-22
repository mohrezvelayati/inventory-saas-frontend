import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, LoaderCircle, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getProducts } from '../features/products/productApi'
import { addSaleItem, completeSale, createDraftSale, deleteDraftSale, getCustomers } from '../features/sales/salesApi'
import type { ProductVariant, Sale } from '../types/api'

type CartItem = { variant: ProductVariant; productName: string; quantity: number; discount: number }

export function SaleCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: products, isPending: productsPending } = useQuery({ queryKey: ['products', 'sale-picker'], queryFn: () => getProducts() })
  const { data: customers } = useQuery({ queryKey: ['customers'], queryFn: getCustomers, retry: false })
  const [cart, setCart] = useState<CartItem[]>([])
  const [selection, setSelection] = useState({ product: '', variant: '', quantity: 1 })
  const [customer, setCustomer] = useState('')
  const [channel, setChannel] = useState<Sale['channel']>('store')
  const [payment, setPayment] = useState<Sale['payment_method']>('card')
  const [error, setError] = useState('')
  const selectedProduct = products?.results.find((product) => product.id === Number(selection.product))
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + Number(item.variant.sale_price) * item.quantity - item.discount, 0), [cart])

  const addToCart = () => {
    const variant = selectedProduct?.variants.find((item) => item.id === Number(selection.variant))
    if (!selectedProduct || !variant) { setError('محصول و سایز را انتخاب کنید.'); return }
    if (selection.quantity > variant.current_stock) { setError('تعداد انتخاب‌شده بیشتر از موجودی است.'); return }
    setError('')
    setCart((current) => {
      const existing = current.find((item) => item.variant.id === variant.id)
      if (existing) return current.map((item) => item.variant.id === variant.id ? { ...item, quantity: item.quantity + selection.quantity } : item)
      return [...current, { variant, productName: selectedProduct.name, quantity: selection.quantity, discount: 0 }]
    })
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (!cart.length) throw new Error('حداقل یک کالا به فاکتور اضافه کنید.')
      const draft = await createDraftSale({ customer: customer ? Number(customer) : null, channel, payment_method: payment })
      try {
        for (const item of cart) await addSaleItem(draft.id, { variant: item.variant.id, quantity: item.quantity, discount: item.discount })
        return await completeSale(draft.id)
      } catch (submitError) {
        await deleteDraftSale(draft.id).catch(() => undefined)
        throw submitError
      }
    },
    onSuccess: async () => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: ['sales'] }), queryClient.invalidateQueries({ queryKey: ['dashboard'] }), queryClient.invalidateQueries({ queryKey: ['products'] })])
      navigate('/sales', { replace: true })
    },
    onError: (submitError) => setError((submitError as Error).message),
  })

  return (
    <div className="page sale-create-page">
      <div className="subpage-heading"><Link to="/sales" aria-label="بازگشت"><ArrowRight /></Link><div><h2>ثبت فروش جدید</h2><p>کالاهای فاکتور و اطلاعات پرداخت را وارد کنید.</p></div></div>
      <section className="sale-builder card">
        <h3>افزودن کالا</h3>
        {productsPending ? <div className="mini-loading"><LoaderCircle className="spin" /></div> : <>
          <label>محصول<select value={selection.product} onChange={(event) => setSelection({ product: event.target.value, variant: '', quantity: 1 })}><option value="">انتخاب محصول</option>{products?.results.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
          <div className="form-row"><label>سایز<select value={selection.variant} onChange={(event) => setSelection((current) => ({ ...current, variant: event.target.value }))}><option value="">انتخاب سایز</option>{selectedProduct?.variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.size} — موجودی {variant.current_stock.toLocaleString('fa-IR')}</option>)}</select></label><label>تعداد<input type="number" min="1" value={selection.quantity} onChange={(event) => setSelection((current) => ({ ...current, quantity: Math.max(1, Number(event.target.value)) }))} /></label></div>
          <button className="secondary-button" onClick={addToCart}><Plus /> افزودن به فاکتور</button>
        </>}
      </section>

      <section className="cart-section">
        <h3>اقلام فاکتور <span>{cart.length.toLocaleString('fa-IR')}</span></h3>
        {cart.length === 0 ? <div className="empty-cart card"><ShoppingBag /><span>هنوز کالایی اضافه نشده است.</span></div> : cart.map((item) => (
          <article className="cart-item card" key={item.variant.id}>
            <span className="product-visual">👟</span><div><strong>{item.productName}</strong><small>سایز {item.variant.size} · {Number(item.variant.sale_price).toLocaleString('fa-IR')} تومان</small><label>تخفیف<input type="number" min="0" value={item.discount} onChange={(event) => setCart((current) => current.map((cartItem) => cartItem.variant.id === item.variant.id ? { ...cartItem, discount: Number(event.target.value) } : cartItem))} /></label></div>
            <div className="quantity-control"><button onClick={() => setCart((current) => current.map((cartItem) => cartItem.variant.id === item.variant.id ? { ...cartItem, quantity: Math.max(1, cartItem.quantity - 1) } : cartItem))}><Minus /></button><b>{item.quantity.toLocaleString('fa-IR')}</b><button onClick={() => setCart((current) => current.map((cartItem) => cartItem.variant.id === item.variant.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem))}><Plus /></button><button className="remove" onClick={() => setCart((current) => current.filter((cartItem) => cartItem.variant.id !== item.variant.id))}><Trash2 /></button></div>
          </article>
        ))}
      </section>

      <section className="sale-details card">
        <h3>اطلاعات فروش</h3>
        <label>مشتری (اختیاری)<select value={customer} onChange={(event) => setCustomer(event.target.value)}><option value="">بدون مشتری</option>{customers?.results.map((item) => <option key={item.id} value={item.id}>{item.full_name} — {item.phone_number}</option>)}</select></label>
        <div className="form-row"><label>کانال فروش<select value={channel} onChange={(event) => setChannel(event.target.value as Sale['channel'])}><option value="store">حضوری</option><option value="instagram">اینستاگرام</option><option value="website">وب‌سایت</option><option value="referral">معرفی</option><option value="other">سایر</option></select></label><label>روش پرداخت<select value={payment} onChange={(event) => setPayment(event.target.value as Sale['payment_method'])}><option value="card">کارت پوز</option><option value="cash">نقد</option><option value="online">آنلاین</option></select></label></div>
      </section>
      {error && <p className="form-alert">{error}</p>}
      <div className="checkout-bar"><div><span>مبلغ نهایی</span><strong>{subtotal.toLocaleString('fa-IR')} <small>تومان</small></strong></div><button onClick={() => mutation.mutate()} disabled={mutation.isPending}>{mutation.isPending ? <LoaderCircle className="spin" /> : <ShoppingBag />} تکمیل فروش</button></div>
    </div>
  )
}
