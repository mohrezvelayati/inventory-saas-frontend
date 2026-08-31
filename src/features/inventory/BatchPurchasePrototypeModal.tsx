import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, LoaderCircle, Minus, PackagePlus, Plus, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Product } from '../../types/api'

const READY_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'] as const

export type BatchPurchasePrototypePayload = {
  product: number
  purchase_price: number
  sale_price: number
  note: string
  items: { size: string; quantity: number }[]
}

type Props = {
  products: Product[]
  onClose: () => void
  onPrototypeSubmit?: (payload: BatchPurchasePrototypePayload) => Promise<BatchPurchasePrototypePayload> | BatchPurchasePrototypePayload
}

export function BatchPurchasePrototypeModal({ products, onClose, onPrototypeSubmit }: Props) {
  const [productId, setProductId] = useState('')
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [purchasePrice, setPurchasePrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const selectedProduct = products.find((product) => product.id === Number(productId))
  const variantsBySize = useMemo(
    () => new Map((selectedProduct?.variants ?? []).map((variant) => [variant.size, variant])),
    [selectedProduct],
  )
  const selectedItems = READY_SIZES
    .filter((size) => (quantities[size] ?? 0) > 0)
    .map((size) => ({ size, quantity: quantities[size] }))
  const hasNewSize = selectedItems.some((item) => !variantsBySize.has(item.size))

  const mutation = useMutation({
    mutationFn: async (payload: BatchPurchasePrototypePayload) => onPrototypeSubmit
      ? await onPrototypeSubmit(payload)
      : payload,
  })

  const chooseProduct = (value: string) => {
    const product = products.find((item) => item.id === Number(value))
    const latestVariant = [...(product?.variants ?? [])].sort((a, b) => b.id - a.id)[0]
    setProductId(value)
    setQuantities({})
    setPurchasePrice(latestVariant?.purchase_price ?? '')
    setSalePrice(latestVariant?.sale_price ?? '')
    setNote('')
    setError('')
    mutation.reset()
  }

  const changeQuantity = (size: string, change: number) => {
    mutation.reset()
    setQuantities((current) => {
      const quantity = Math.max(0, (current[size] ?? 0) + change)
      if (quantity === 0) {
        const next = { ...current }
        delete next[size]
        return next
      }
      return { ...current, [size]: quantity }
    })
  }

  const removeSize = (size: string) => {
    mutation.reset()
    setQuantities((current) => {
      const next = { ...current }
      delete next[size]
      return next
    })
  }

  const clearAll = () => {
    mutation.reset()
    setQuantities({})
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!selectedProduct || selectedItems.length === 0) return
    const numericPurchasePrice = Number(purchasePrice)
    const numericSalePrice = Number(salePrice)
    if (hasNewSize && (!purchasePrice || !salePrice || numericPurchasePrice < 0 || numericSalePrice < 0)) {
      setError('برای سایزهای جدید، قیمت خرید و فروش معتبر وارد کنید.')
      return
    }
    mutation.mutate({
      product: selectedProduct.id,
      purchase_price: numericPurchasePrice,
      sale_price: numericSalePrice,
      note: note.trim(),
      items: selectedItems,
    })
  }

  const totalQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-sheet batch-purchase-modal" role="dialog" aria-modal="true" aria-labelledby="batch-purchase-title">
        <header><div><h2 id="batch-purchase-title">ورود گروهی خرید</h2><p>محصول را انتخاب کنید و برای هر سایز، تعداد ورودی را مشخص کنید.</p></div><button type="button" onClick={onClose} aria-label="بستن"><X /></button></header>
        <form className="modal-form" onSubmit={submit} noValidate>
          <label>محصول *<select value={productId} onChange={(event) => chooseProduct(event.target.value)} autoFocus><option value="">انتخاب محصول</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>

          {selectedProduct && <section className="batch-size-section" aria-label="سایزهای آماده">
            <div className="batch-size-grid">{READY_SIZES.map((size) => {
              const variant = variantsBySize.get(size)
              const quantity = quantities[size] ?? 0
              return <button type="button" className={`batch-size-button ${quantity > 0 ? 'selected' : ''}`} key={size} onClick={() => changeQuantity(size, 1)} aria-label={`افزایش سایز ${size}`}>
                <strong>{size}</strong>
                <small>{variant ? `موجودی فعلی ${variant.current_stock.toLocaleString('fa-IR')}` : 'جدید'}</small>
                {quantity > 0 && <span>{quantity.toLocaleString('fa-IR')}</span>}
              </button>
            })}</div>
          </section>}

          {selectedItems.length > 0 && <section className="batch-selection" aria-label="سایزهای انتخاب‌شده">
            <header><strong>{selectedItems.length.toLocaleString('fa-IR')} سایز · {totalQuantity.toLocaleString('fa-IR')} عدد</strong><button type="button" onClick={clearAll}>پاک‌کردن همه</button></header>
            {selectedItems.map((item) => <div className="batch-selection-row" key={item.size} aria-label={`انتخاب سایز ${item.size}`}>
              <span><strong>سایز {item.size}</strong><small>{variantsBySize.has(item.size) ? 'سایز موجود' : 'سایز جدید'}</small></span>
              <div className="batch-quantity-control">
                <button type="button" onClick={() => changeQuantity(item.size, -1)} aria-label={`کم‌کردن تعداد سایز ${item.size}`}><Minus /></button>
                <b>{item.quantity.toLocaleString('fa-IR')}</b>
                <button type="button" onClick={() => changeQuantity(item.size, 1)} aria-label={`افزایش تعداد سایز ${item.size}`}><Plus /></button>
              </div>
              <button type="button" className="batch-remove" onClick={() => removeSize(item.size)} aria-label={`حذف سایز ${item.size}`}><Trash2 /></button>
            </div>)}
          </section>}

          {hasNewSize && <div className="form-row"><label>قیمت خرید مشترک *<input type="number" min="0" value={purchasePrice} onChange={(event) => { mutation.reset(); setPurchasePrice(event.target.value) }} /></label><label>قیمت فروش مشترک *<input type="number" min="0" value={salePrice} onChange={(event) => { mutation.reset(); setSalePrice(event.target.value) }} /></label></div>}
          <label>یادداشت<input value={note} onChange={(event) => { mutation.reset(); setNote(event.target.value) }} placeholder="مثلاً محموله جدید" /></label>
          {error && <p className="form-alert">{error}</p>}
          {mutation.isSuccess && <p className="form-success"><CheckCircle2 /> نمونه ثبت گروهی آماده شد؛ هیچ درخواستی به سرور ارسال نشد.</p>}
          <button className="primary-button" disabled={selectedItems.length === 0 || mutation.isPending}>{mutation.isPending ? <LoaderCircle className="spin" /> : <PackagePlus />} ثبت همه</button>
        </form>
      </section>
    </div>
  )
}
