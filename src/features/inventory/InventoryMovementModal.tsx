import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LoaderCircle, PackagePlus, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { MoneyInWords } from '../../components/UI'
import { variantSizeLabel } from '../../lib/variant'
import type { Product, ProductVariant } from '../../types/api'
import { createInventoryEntry, MovementFailedAfterVariantCreationError, type InventoryEntryInput } from './inventoryApi'
import { SIZE_GROUPS, type SizeGroupId } from './sizeGroups'

const NEW_VARIANT = 'new'
const NEW_SIZELESS_VARIANT = 'new-sizeless'
type SizeChoice = SizeGroupId | 'custom' | ''

type Props = {
  products: Product[]
  canCreateVariant: boolean
  onClose: () => void
}

const initialForm = {
  product: '',
  variant: '',
  size: '',
  purchase_price: '',
  sale_price: '',
  quantity: '',
  movement_type: 'purchase' as 'purchase' | 'adjustment',
  note: '',
}

export function InventoryMovementModal({ products, canCreateVariant, onClose }: Props) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(initialForm)
  const [sizeChoice, setSizeChoice] = useState<SizeChoice>('')
  const [error, setError] = useState('')
  const [preservedVariant, setPreservedVariant] = useState<ProductVariant | null>(null)
  const selectedProduct = products.find((product) => product.id === Number(form.product))
  const variants = useMemo(() => {
    const items = selectedProduct?.variants ?? []
    if (!preservedVariant || items.some((variant) => variant.id === preservedVariant.id)) return items
    return [...items, preservedVariant]
  }, [preservedVariant, selectedProduct])
  const hasSizelessVariant = variants.some((variant) => variant.without_size)
  const readySizes = SIZE_GROUPS.find((group) => group.id === sizeChoice)?.sizes ?? []
  const existingSizes = useMemo(() => new Set(variants.flatMap((variant) => variant.size === null ? [] : [variant.size])), [variants])
  const creatingVariant = form.variant === NEW_VARIANT || form.variant === NEW_SIZELESS_VARIANT

  const mutation = useMutation({
    mutationFn: createInventoryEntry,
    onSuccess: async () => {
      const productId = Number(form.product)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['inventory'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['product', productId] }),
      ])
      onClose()
    },
    onError: (mutationError) => {
      if (mutationError instanceof MovementFailedAfterVariantCreationError) {
        setPreservedVariant(mutationError.variant)
        setForm((current) => ({ ...current, variant: String(mutationError.variant.id) }))
        setError(`${variantSizeLabel(mutationError.variant.size)} ساخته شد، اما موجودی ثبت نشد. مورد ساخته‌شده حفظ شده است؛ دوباره «ثبت موجودی» را بزنید.`)
        return
      }
      setError((mutationError as Error).message)
    },
  })

  const chooseProduct = (productId: string) => {
    setPreservedVariant(null)
    setSizeChoice('')
    setError('')
    setForm({ ...initialForm, product: productId })
  }

  const chooseVariant = (value: string) => {
    setSizeChoice('')
    if (value !== NEW_VARIANT && value !== NEW_SIZELESS_VARIANT) {
      setForm((current) => ({ ...current, variant: value }))
      return
    }
    const latestVariant = [...(selectedProduct?.variants ?? [])].sort((a, b) => b.id - a.id)[0]
    setForm((current) => ({
      ...current,
      variant: value,
      size: '',
      purchase_price: latestVariant?.purchase_price ?? '',
      sale_price: latestVariant?.sale_price ?? '',
    }))
  }

  const chooseSizeChoice = (value: SizeChoice) => {
    setSizeChoice(value)
    setForm((current) => ({ ...current, size: '' }))
    setError('')
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    const quantity = Number(form.quantity)
    if (!form.product || !form.variant || !form.quantity || quantity === 0) {
      setError('محصول، نوع موجودی و تعداد معتبر ضروری هستند.')
      return
    }
    if (form.variant === NEW_VARIANT && !form.size.trim()) {
      setError('برای محصول سایزبندی‌شده یک سایز انتخاب کنید.')
      return
    }
    if (creatingVariant && (!form.purchase_price || !form.sale_price)) {
      setError('قیمت‌های خرید و فروش را کامل کنید.')
      return
    }

    const input: InventoryEntryInput = {
      productId: Number(form.product),
      variantId: creatingVariant ? undefined : Number(form.variant),
      newVariant: creatingVariant ? {
        ...(form.variant === NEW_SIZELESS_VARIANT ? { without_size: true } : { size: form.size.trim() }),
        purchase_price: form.purchase_price,
        sale_price: form.sale_price,
      } : undefined,
      quantity,
      movement_type: form.movement_type,
      note: form.note,
    }
    mutation.mutate(input)
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="inventory-movement-title">
        <header><div><h2 id="inventory-movement-title">تغییر موجودی</h2><p>محصول و سپس سایز موجود، سایز جدید یا حالت بدون سایز را انتخاب کنید.</p></div><button onClick={onClose} aria-label="بستن"><X /></button></header>
        <form className="modal-form" onSubmit={submit}>
          <label>محصول *<select value={form.product} onChange={(event) => chooseProduct(event.target.value)} autoFocus><option value="">انتخاب محصول</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
          <label>سایز / نوع موجودی *<select value={form.variant} disabled={!selectedProduct} onChange={(event) => chooseVariant(event.target.value)}><option value="">انتخاب مورد</option>{variants.map((variant) => <option key={variant.id} value={variant.id}>{variantSizeLabel(variant.size)} — موجودی {variant.current_stock.toLocaleString('fa-IR')}</option>)}{canCreateVariant && selectedProduct && !hasSizelessVariant && <option value={NEW_VARIANT}>افزودن سایز جدید</option>}{canCreateVariant && selectedProduct && variants.length === 0 && <option value={NEW_SIZELESS_VARIANT}>ثبت محصول بدون سایز</option>}</select></label>
          {selectedProduct && !canCreateVariant && variants.length === 0 && <p className="form-alert">این محصول هنوز نوع موجودی ندارد و حساب شما مجوز ساخت آن را ندارد.</p>}
          {form.variant === NEW_VARIANT && <section className="batch-size-group-section" aria-label="انتخاب سایز جدید"><strong>دسته‌بندی سایز *</strong><div className="batch-size-group-tabs">{SIZE_GROUPS.map((group) => <button type="button" className={sizeChoice === group.id ? 'active' : ''} key={group.id} onClick={() => chooseSizeChoice(group.id)} aria-pressed={sizeChoice === group.id}>{group.label}</button>)}<button type="button" className={sizeChoice === 'custom' ? 'active' : ''} onClick={() => chooseSizeChoice('custom')} aria-pressed={sizeChoice === 'custom'}>سایز دیگر</button></div>{!sizeChoice && <small>گروه سایز را انتخاب کنید.</small>}</section>}
          {form.variant === NEW_VARIANT && sizeChoice && sizeChoice !== 'custom' && <section className="batch-size-section" aria-label="سایزهای آماده"><div className="batch-size-grid">{readySizes.map((size) => { const exists = existingSizes.has(size); return <button type="button" className={`batch-size-button ${form.size === size ? 'selected' : ''}`} key={size} onClick={() => setForm((current) => ({ ...current, size }))} disabled={exists} aria-label={exists ? `سایز ${size} از قبل موجود است` : `انتخاب سایز ${size}`}><strong>{size}</strong><small>{exists ? 'موجود' : 'جدید'}</small></button> })}</div></section>}
          {form.variant === NEW_VARIANT && sizeChoice === 'custom' && <label>سایز دیگر *<input value={form.size} onChange={(event) => setForm({ ...form, size: event.target.value })} placeholder="مثلاً ۴۶" /></label>}
          {creatingVariant && (form.variant === NEW_SIZELESS_VARIANT || Boolean(form.size)) && <div className="form-row"><label>قیمت خرید *<input aria-label="قیمت خرید *" type="number" min="0" value={form.purchase_price} onChange={(event) => setForm({ ...form, purchase_price: event.target.value })} /><MoneyInWords value={form.purchase_price} /></label><label>قیمت فروش *<input aria-label="قیمت فروش *" type="number" min="0" value={form.sale_price} onChange={(event) => setForm({ ...form, sale_price: event.target.value })} /><MoneyInWords value={form.sale_price} /></label></div>}
          <div className="form-row"><label>نوع حرکت<select value={form.movement_type} onChange={(event) => setForm({ ...form, movement_type: event.target.value as 'purchase' | 'adjustment' })}><option value="purchase">ورود خرید</option><option value="adjustment">اصلاح موجودی</option></select></label><label>تعداد *<input type="number" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} placeholder={form.movement_type === 'adjustment' ? 'مثبت یا منفی' : 'مثبت'} /></label></div>
          <label>یادداشت<input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></label>
          {error && <p className="form-alert">{error}</p>}
          <button className="primary-button" disabled={mutation.isPending}>{mutation.isPending ? <LoaderCircle className="spin" /> : <PackagePlus />} ثبت موجودی</button>
        </form>
      </section>
    </div>
  )
}
