import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LoaderCircle, PackagePlus, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Product, ProductVariant } from '../../types/api'
import { createInventoryEntry, MovementFailedAfterVariantCreationError, type InventoryEntryInput } from './inventoryApi'

const NEW_VARIANT = 'new'

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
  const [error, setError] = useState('')
  const [preservedVariant, setPreservedVariant] = useState<ProductVariant | null>(null)
  const selectedProduct = products.find((product) => product.id === Number(form.product))
  const variants = useMemo(() => {
    const items = selectedProduct?.variants ?? []
    if (!preservedVariant || items.some((variant) => variant.id === preservedVariant.id)) return items
    return [...items, preservedVariant]
  }, [preservedVariant, selectedProduct])

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
        setError(`سایز ${mutationError.variant.size} ساخته شد، اما موجودی ثبت نشد. سایز حفظ شده است؛ دوباره «ثبت موجودی» را بزنید.`)
        return
      }
      setError((mutationError as Error).message)
    },
  })

  const chooseProduct = (productId: string) => {
    setPreservedVariant(null)
    setError('')
    setForm({ ...initialForm, product: productId })
  }

  const chooseVariant = (value: string) => {
    if (value !== NEW_VARIANT) {
      setForm((current) => ({ ...current, variant: value }))
      return
    }
    const latestVariant = [...(selectedProduct?.variants ?? [])].sort((a, b) => b.id - a.id)[0]
    setForm((current) => ({
      ...current,
      variant: NEW_VARIANT,
      size: '',
      purchase_price: latestVariant?.purchase_price ?? '',
      sale_price: latestVariant?.sale_price ?? '',
    }))
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    const quantity = Number(form.quantity)
    if (!form.product || !form.variant || !form.quantity || quantity === 0) {
      setError('محصول، سایز و تعداد معتبر ضروری هستند.')
      return
    }
    if (form.variant === NEW_VARIANT && (!form.size.trim() || !form.purchase_price || !form.sale_price)) {
      setError('سایز و قیمت‌های خرید و فروش را کامل کنید.')
      return
    }

    const input: InventoryEntryInput = {
      productId: Number(form.product),
      variantId: form.variant === NEW_VARIANT ? undefined : Number(form.variant),
      newVariant: form.variant === NEW_VARIANT ? {
        size: form.size.trim(),
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
        <header><div><h2 id="inventory-movement-title">تغییر موجودی</h2><p>ابتدا محصول و سپس سایز موجود یا سایز جدید را انتخاب کنید.</p></div><button onClick={onClose} aria-label="بستن"><X /></button></header>
        <form className="modal-form" onSubmit={submit}>
          <label>محصول *<select value={form.product} onChange={(event) => chooseProduct(event.target.value)} autoFocus><option value="">انتخاب محصول</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
          <label>سایز *<select value={form.variant} disabled={!selectedProduct} onChange={(event) => chooseVariant(event.target.value)}><option value="">انتخاب سایز</option>{variants.map((variant) => <option key={variant.id} value={variant.id}>سایز {variant.size} — موجودی {variant.current_stock.toLocaleString('fa-IR')}</option>)}{canCreateVariant && selectedProduct && <option value={NEW_VARIANT}>افزودن سایز جدید</option>}</select></label>
          {selectedProduct && !canCreateVariant && variants.length === 0 && <p className="form-alert">این محصول هنوز سایزی ندارد و حساب شما مجوز ساخت سایز جدید را ندارد.</p>}
          {form.variant === NEW_VARIANT && <><label>سایز جدید *<input value={form.size} onChange={(event) => setForm({ ...form, size: event.target.value })} placeholder="مثلاً ۴۰" /></label><div className="form-row"><label>قیمت خرید *<input type="number" min="0" value={form.purchase_price} onChange={(event) => setForm({ ...form, purchase_price: event.target.value })} /></label><label>قیمت فروش *<input type="number" min="0" value={form.sale_price} onChange={(event) => setForm({ ...form, sale_price: event.target.value })} /></label></div></>}
          <div className="form-row"><label>نوع حرکت<select value={form.movement_type} onChange={(event) => setForm({ ...form, movement_type: event.target.value as 'purchase' | 'adjustment' })}><option value="purchase">ورود خرید</option><option value="adjustment">اصلاح موجودی</option></select></label><label>تعداد *<input type="number" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} placeholder={form.movement_type === 'adjustment' ? 'مثبت یا منفی' : 'مثبت'} /></label></div>
          <label>یادداشت<input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></label>
          {error && <p className="form-alert">{error}</p>}
          <button className="primary-button" disabled={mutation.isPending}>{mutation.isPending ? <LoaderCircle className="spin" /> : <PackagePlus />} ثبت موجودی</button>
        </form>
      </section>
    </div>
  )
}
