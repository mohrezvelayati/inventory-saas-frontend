import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LoaderCircle, Minus, PackagePlus, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { MoneyInWords } from '../../components/UI'
import { ApiError } from '../../lib/api'
import type { BatchPurchaseInput, BatchPurchaseResponse, Product } from '../../types/api'
import { createBatchPurchase } from './inventoryApi'
import { SIZE_GROUPS, type SizeGroupId } from './sizeGroups'

const SIZELESS_KEY = '__without_size__'
type PurchaseMode = SizeGroupId | 'sizeless'

type Props = {
  products: Product[]
  onClose: () => void
  onSuccess: (response: BatchPurchaseResponse) => void
}

function firstErrorMessage(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    for (const item of value) {
      const message = firstErrorMessage(item)
      if (message) return message
    }
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) {
      const message = firstErrorMessage(item)
      if (message) return message
    }
  }
  return null
}

function getBatchPurchaseError(error: unknown) {
  if (error instanceof ApiError) {
    return firstErrorMessage(error.data) ?? error.message
  }
  return error instanceof Error ? error.message : 'ثبت گروهی موجودی ناموفق بود.'
}

export function BatchPurchaseModal({ products, onClose, onSuccess }: Props) {
  const queryClient = useQueryClient()
  const [productId, setProductId] = useState('')
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode | ''>('')
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [purchasePrice, setPurchasePrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const selectedProduct = products.find((product) => product.id === Number(productId))
  const readySizes = SIZE_GROUPS.find((group) => group.id === purchaseMode)?.sizes ?? []
  const sizelessVariant = selectedProduct?.variants.find((variant) => variant.without_size)
  const hasSizedVariants = selectedProduct?.variants.some((variant) => !variant.without_size) ?? false
  const hasSizelessVariant = Boolean(sizelessVariant)
  const variantsBySize = new Map((selectedProduct?.variants ?? []).filter((variant) => variant.size !== null).map((variant) => [variant.size as string, variant]))
  const selectedItems: BatchPurchaseInput['items'] = purchaseMode === 'sizeless'
    ? (quantities[SIZELESS_KEY] ?? 0) > 0
      ? [{ without_size: true, quantity: quantities[SIZELESS_KEY] }]
      : []
    : readySizes.filter((size) => (quantities[size] ?? 0) > 0).map((size) => ({ size, quantity: quantities[size] }))
  const hasNewVariant = selectedItems.some((item) => item.without_size ? !sizelessVariant : !variantsBySize.has(item.size))

  const mutation = useMutation({
    mutationFn: (payload: BatchPurchaseInput) => createBatchPurchase(payload),
    onSuccess: async (response) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['inventory'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory-history'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['product', response.product] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
      onSuccess(response)
    },
    onError: (mutationError) => setError(getBatchPurchaseError(mutationError)),
  })

  const chooseProduct = (value: string) => {
    const product = products.find((item) => item.id === Number(value))
    const latestVariant = [...(product?.variants ?? [])].sort((a, b) => b.id - a.id)[0]
    setProductId(value)
    setPurchaseMode('')
    setQuantities({})
    setPurchasePrice(latestVariant?.purchase_price ?? '')
    setSalePrice(latestVariant?.sale_price ?? '')
    setNote('')
    setError('')
    mutation.reset()
  }

  const choosePurchaseMode = (value: PurchaseMode) => {
    setPurchaseMode(value)
    setQuantities({})
    setError('')
    mutation.reset()
  }

  const changeQuantity = (size: string, change: number) => {
    mutation.reset()
    setError('')
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
    setError('')
    setQuantities((current) => {
      const next = { ...current }
      delete next[size]
      return next
    })
  }

  const clearAll = () => {
    mutation.reset()
    setError('')
    setQuantities({})
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!selectedProduct || selectedItems.length === 0) return
    const numericPurchasePrice = Number(purchasePrice)
    const numericSalePrice = Number(salePrice)
    if (hasNewVariant && (!purchasePrice || !salePrice || !Number.isFinite(numericPurchasePrice) || !Number.isFinite(numericSalePrice) || numericPurchasePrice < 0 || numericSalePrice < 0)) {
      setError('برای مورد جدید، قیمت خرید و فروش معتبر وارد کنید.')
      return
    }
    const input: BatchPurchaseInput = {
      product: selectedProduct.id,
      note: note.trim(),
      items: selectedItems,
    }
    if (hasNewVariant) {
      input.purchase_price = numericPurchasePrice
      input.sale_price = numericSalePrice
    }
    mutation.mutate(input)
  }

  const totalQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !mutation.isPending && onClose()}>
      <section className="modal-sheet batch-purchase-modal" role="dialog" aria-modal="true" aria-labelledby="batch-purchase-title">
        <header><div><h2 id="batch-purchase-title">ورود گروهی خرید</h2><p>محصول را انتخاب کنید و تعداد هر سایز یا محصول بدون سایز را مشخص کنید.</p></div><button type="button" onClick={onClose} disabled={mutation.isPending} aria-label="بستن"><X /></button></header>
        <form className="modal-form" onSubmit={submit} noValidate>
          <label>محصول *<select value={productId} onChange={(event) => chooseProduct(event.target.value)} autoFocus><option value="">انتخاب محصول</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>

          {selectedProduct && <section className="batch-size-group-section" aria-label="دسته‌بندی سایز">
            <strong>دسته‌بندی محصول *</strong>
            <div className="batch-size-group-tabs">{SIZE_GROUPS.map((group) => <button type="button" className={purchaseMode === group.id ? 'active' : ''} key={group.id} onClick={() => choosePurchaseMode(group.id)} aria-pressed={purchaseMode === group.id} aria-label={`انتخاب دسته ${group.label}`} disabled={hasSizelessVariant}>{group.label}</button>)}<button type="button" className={purchaseMode === 'sizeless' ? 'active' : ''} onClick={() => choosePurchaseMode('sizeless')} aria-pressed={purchaseMode === 'sizeless'} aria-label="انتخاب محصول بدون سایز" disabled={hasSizedVariants}>بدون سایز</button></div>
            {!purchaseMode && <small>{hasSizelessVariant ? 'این محصول بدون سایز است.' : hasSizedVariants ? 'این محصول سایزبندی‌شده است.' : 'دسته‌بندی محصول را انتخاب کنید.'}</small>}
          </section>}

          {selectedProduct && purchaseMode && purchaseMode !== 'sizeless' && <section className="batch-size-section" aria-label="سایزهای آماده">
            <div className="batch-size-grid">{readySizes.map((size) => {
              const variant = variantsBySize.get(size)
              const quantity = quantities[size] ?? 0
              return <button type="button" className={`batch-size-button ${quantity > 0 ? 'selected' : ''}`} key={size} onClick={() => changeQuantity(size, 1)} aria-label={`افزایش سایز ${size}`}>
                <strong>{size}</strong>
                <small>{variant ? `موجودی فعلی ${variant.current_stock.toLocaleString('fa-IR')}` : 'جدید'}</small>
                {quantity > 0 && <span>{quantity.toLocaleString('fa-IR')}</span>}
              </button>
            })}</div>
          </section>}

          {selectedProduct && purchaseMode === 'sizeless' && <section className="batch-size-section" aria-label="محصول بدون سایز"><button type="button" className={`batch-size-button ${quantities[SIZELESS_KEY] > 0 ? 'selected' : ''}`} onClick={() => changeQuantity(SIZELESS_KEY, 1)} aria-label="افزایش تعداد محصول بدون سایز"><strong>بدون سایز</strong><small>{sizelessVariant ? `موجودی فعلی ${sizelessVariant.current_stock.toLocaleString('fa-IR')}` : 'جدید'}</small>{quantities[SIZELESS_KEY] > 0 && <span>{quantities[SIZELESS_KEY].toLocaleString('fa-IR')}</span>}</button></section>}

          {selectedItems.length > 0 && <section className="batch-selection" aria-label="سایزهای انتخاب‌شده">
            <header><strong>{selectedItems.length.toLocaleString('fa-IR')} مورد · {totalQuantity.toLocaleString('fa-IR')} عدد</strong><button type="button" onClick={clearAll}>پاک‌کردن همه</button></header>
            {selectedItems.map((item) => { const key = item.without_size ? SIZELESS_KEY : item.size; const label = item.without_size ? 'بدون سایز' : `سایز ${item.size}`; const isExisting = item.without_size ? Boolean(sizelessVariant) : variantsBySize.has(item.size); return <div className="batch-selection-row" key={key} aria-label={`انتخاب ${label}`}>
              <span><strong>{label}</strong><small>{isExisting ? 'مورد موجود' : 'مورد جدید'}</small></span>
              <div className="batch-quantity-control">
                <button type="button" onClick={() => changeQuantity(key, -1)} aria-label={`کم‌کردن تعداد ${label}`}><Minus /></button>
                <b>{item.quantity.toLocaleString('fa-IR')}</b>
                <button type="button" onClick={() => changeQuantity(key, 1)} aria-label={`افزایش تعداد ${label}`}><Plus /></button>
              </div>
              <button type="button" className="batch-remove" onClick={() => removeSize(key)} aria-label={`حذف ${label}`}><Trash2 /></button>
            </div>})}
          </section>}

          {hasNewVariant && <div className="form-row"><label>قیمت خرید مشترک *<input aria-label="قیمت خرید مشترک *" type="number" min="0" value={purchasePrice} onChange={(event) => { mutation.reset(); setError(''); setPurchasePrice(event.target.value) }} /><MoneyInWords value={purchasePrice} /></label><label>قیمت فروش مشترک *<input aria-label="قیمت فروش مشترک *" type="number" min="0" value={salePrice} onChange={(event) => { mutation.reset(); setError(''); setSalePrice(event.target.value) }} /><MoneyInWords value={salePrice} /></label></div>}
          <label>یادداشت<input value={note} onChange={(event) => { mutation.reset(); setError(''); setNote(event.target.value) }} placeholder="مثلاً محموله جدید" /></label>
          {error && <p className="form-alert">{error}</p>}
          <button className="primary-button" disabled={selectedItems.length === 0 || mutation.isPending}>{mutation.isPending ? <LoaderCircle className="spin" /> : <PackagePlus />} ثبت همه</button>
        </form>
      </section>
    </div>
  )
}
