import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Boxes, FolderPlus, LoaderCircle, PackagePlus, Plus, Search, Trash2, UserPlus, UsersRound, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SearchBox, StatusBadge } from '../components/UI'
import { createCustomer, deleteCustomer, getCustomers } from '../features/customers/customersApi'
import { createInventoryMovement, getInventory } from '../features/inventory/inventoryApi'
import { createCategory, deleteCategory, getCategories } from '../features/products/productApi'
import { deleteMember, getMembers, inviteMember, updateMemberRole } from '../features/stores/membersApi'
import type { StoreMember } from '../types/api'

function PageHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="subpage-heading"><Link to="/more" aria-label="بازگشت"><ArrowRight /></Link><div><h2>{title}</h2><p>{subtitle}</p></div></div>
}

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal-sheet" role="dialog" aria-modal="true"><header><div><h2>{title}</h2><p>{subtitle}</p></div><button onClick={onClose}><X /></button></header>{children}</section></div>
}

export function CustomersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone_number: '' })
  const [error, setError] = useState('')
  const { data, isPending } = useQuery({ queryKey: ['customers'], queryFn: getCustomers })
  const customers = useMemo(() => (data?.results ?? []).filter((item) => `${item.full_name} ${item.phone_number}`.includes(search)), [data?.results, search])
  const createMutation = useMutation({ mutationFn: createCustomer, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['customers'] }); setOpen(false); setForm({ full_name: '', phone_number: '' }) }, onError: (mutationError) => setError((mutationError as Error).message) })
  const deleteMutation = useMutation({ mutationFn: deleteCustomer, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }) })

  return <div className="page operation-page">
    <PageHeading title="مشتریان" subtitle="مدیریت اطلاعات تماس و سوابق مشتریان" />
    <SearchBox placeholder="جستجو با نام یا شماره تلفن..." value={search} onChange={setSearch} />
    <button className="primary-button" onClick={() => setOpen(true)}><UserPlus /> افزودن مشتری</button>
    <div className="operation-summary card"><UsersRound /><div><strong>{data?.count ?? '—'}</strong><span>مشتری ثبت‌شده</span></div></div>
    <div className="simple-list">{isPending ? <div className="loading-state"><LoaderCircle className="spin" /></div> : customers.map((customer) => <article className="simple-row card" key={customer.id}><span className="initial-avatar">{customer.full_name.charAt(0)}</span><div><strong>{customer.full_name}</strong><small>{customer.phone_number}</small></div><button className="row-delete" onClick={() => window.confirm('این مشتری حذف شود؟') && deleteMutation.mutate(customer.id)}><Trash2 /></button></article>)}</div>
    {open && <Modal title="مشتری جدید" subtitle="نام و شماره تماس مشتری را ثبت کنید." onClose={() => setOpen(false)}><form className="modal-form" onSubmit={(event) => { event.preventDefault(); setError(''); if (!form.full_name || !form.phone_number) { setError('هر دو فیلد ضروری هستند.'); return } createMutation.mutate(form) }}><label>نام و نام خانوادگی *<input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} autoFocus /></label><label>شماره تلفن *<input value={form.phone_number} onChange={(event) => setForm({ ...form, phone_number: event.target.value })} inputMode="tel" /></label>{error && <p className="form-alert">{error}</p>}<button className="primary-button" disabled={createMutation.isPending}>{createMutation.isPending ? <LoaderCircle className="spin" /> : <UserPlus />} ثبت مشتری</button></form></Modal>}
  </div>
}

export function InventoryPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ variant: '', quantity: '', movement_type: 'purchase' as 'purchase' | 'adjustment', note: '' })
  const [error, setError] = useState('')
  const { data, isPending } = useQuery({ queryKey: ['inventory'], queryFn: getInventory })
  const items = useMemo(() => (data?.results ?? []).filter((item) => `${item.product_name} ${item.size}`.toLowerCase().includes(search.toLowerCase())), [data?.results, search])
  const totalStock = data?.results.reduce((sum, item) => sum + item.current_stock, 0) ?? 0
  const mutation = useMutation({ mutationFn: createInventoryMovement, onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ['inventory'] }), queryClient.invalidateQueries({ queryKey: ['products'] }), queryClient.invalidateQueries({ queryKey: ['dashboard'] })]); setOpen(false) }, onError: (mutationError) => setError((mutationError as Error).message) })

  return <div className="page operation-page">
    <PageHeading title="موجودی" subtitle="مشاهده موجودی و ثبت ورود یا اصلاح کالا" />
    <SearchBox placeholder="جستجو در موجودی..." value={search} onChange={setSearch} />
    <button className="primary-button" onClick={() => setOpen(true)}><PackagePlus /> ثبت تغییر موجودی</button>
    <div className="operation-summary card"><Boxes /><div><strong>{totalStock.toLocaleString('fa-IR')}</strong><span>موجودی در {data?.count ?? '—'} سایز</span></div></div>
    <div className="simple-list">{isPending ? <div className="loading-state"><LoaderCircle className="spin" /></div> : items.map((item) => <article className="simple-row card" key={item.id}><span className="product-visual compact">📦</span><div><strong>{item.product_name}</strong><small>سایز {item.size}</small></div><StatusBadge tone={item.current_stock === 0 ? 'danger' : item.current_stock <= 2 ? 'warning' : 'success'}>{item.current_stock.toLocaleString('fa-IR')} عدد</StatusBadge></article>)}</div>
    {open && <Modal title="تغییر موجودی" subtitle="ورود خرید یا اصلاح موجودی را ثبت کنید." onClose={() => setOpen(false)}><form className="modal-form" onSubmit={(event) => { event.preventDefault(); setError(''); if (!form.variant || !form.quantity || Number(form.quantity) === 0) { setError('کالا و تعداد معتبر ضروری هستند.'); return } mutation.mutate({ variant: Number(form.variant), quantity: Number(form.quantity), movement_type: form.movement_type, note: form.note }) }}><label>کالا و سایز *<select value={form.variant} onChange={(event) => setForm({ ...form, variant: event.target.value })}><option value="">انتخاب کنید</option>{data?.results.map((item) => <option key={item.id} value={item.id}>{item.product_name} — سایز {item.size}</option>)}</select></label><div className="form-row"><label>نوع حرکت<select value={form.movement_type} onChange={(event) => setForm({ ...form, movement_type: event.target.value as 'purchase' | 'adjustment' })}><option value="purchase">ورود خرید</option><option value="adjustment">اصلاح موجودی</option></select></label><label>تعداد *<input type="number" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} placeholder={form.movement_type === 'adjustment' ? 'مثبت یا منفی' : 'مثبت'} /></label></div><label>یادداشت<input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></label>{error && <p className="form-alert">{error}</p>}<button className="primary-button" disabled={mutation.isPending}>{mutation.isPending ? <LoaderCircle className="spin" /> : <PackagePlus />} ثبت موجودی</button></form></Modal>}
  </div>
}

export function CategoriesPage() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const { data, isPending } = useQuery({ queryKey: ['categories'], queryFn: getCategories })
  const createMutation = useMutation({ mutationFn: createCategory, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['categories'] }); setName('') }, onError: (mutationError) => setError((mutationError as Error).message) })
  const deleteMutation = useMutation({ mutationFn: deleteCategory, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }) })

  return <div className="page operation-page">
    <PageHeading title="دسته‌بندی‌ها" subtitle="گروه‌بندی محصولات فروشگاه" />
    <form className="inline-create card" onSubmit={(event) => { event.preventDefault(); setError(''); if (!name.trim()) { setError('نام دسته‌بندی را وارد کنید.'); return } createMutation.mutate(name) }}><FolderPlus /><input value={name} onChange={(event) => setName(event.target.value)} placeholder="نام دسته‌بندی جدید" /><button disabled={createMutation.isPending}><Plus /></button></form>
    {error && <p className="form-alert">{error}</p>}
    <div className="operation-summary card"><Search /><div><strong>{data?.count ?? '—'}</strong><span>دسته‌بندی فعال</span></div></div>
    <div className="simple-list">{isPending ? <div className="loading-state"><LoaderCircle className="spin" /></div> : data?.results.map((category) => <article className="simple-row card" key={category.id}><span className="activity-icon purple"><FolderPlus /></span><div><strong>{category.name}</strong><small>ساخته‌شده در {new Date(category.created_at).toLocaleDateString('fa-IR')}</small></div><button className="row-delete" onClick={() => window.confirm('این دسته‌بندی حذف شود؟') && deleteMutation.mutate(category.id)}><Trash2 /></button></article>)}</div>
  </div>
}

export function MembersPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<{ invite_username: string; role: StoreMember['role'] }>({ invite_username: '', role: 'seller' })
  const [error, setError] = useState('')
  const { data, isPending } = useQuery({ queryKey: ['members'], queryFn: getMembers })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['members'] })
  const inviteMutation = useMutation({ mutationFn: inviteMember, onSuccess: async () => { await refresh(); setOpen(false); setForm({ invite_username: '', role: 'seller' }) }, onError: (mutationError) => setError((mutationError as Error).message) })
  const roleMutation = useMutation({ mutationFn: updateMemberRole, onSuccess: refresh, onError: (mutationError) => setError((mutationError as Error).message) })
  const deleteMutation = useMutation({ mutationFn: deleteMember, onSuccess: refresh, onError: (mutationError) => setError((mutationError as Error).message) })
  const roleLabel: Record<StoreMember['role'], string> = { manager: 'مدیر', admin: 'ادمین', seller: 'فروشنده' }

  return <div className="page operation-page">
    <PageHeading title="کاربران و نقش‌ها" subtitle="دعوت کارکنان و مدیریت نقش آن‌ها" />
    <button className="primary-button" onClick={() => setOpen(true)}><UserPlus /> دعوت عضو جدید</button>
    {error && <p className="form-alert">{error}</p>}
    <div className="operation-summary card"><UsersRound /><div><strong>{data?.count ?? '—'}</strong><span>عضو فروشگاه</span></div></div>
    <div className="simple-list">{isPending ? <div className="loading-state"><LoaderCircle className="spin" /></div> : data?.results.map((member) => <article className="member-row card" key={member.id}><span className="initial-avatar">{(member.user_full_name || member.username).charAt(0)}</span><div><strong>{member.user_full_name || member.username}</strong><small>@{member.username}</small></div><select value={member.role} disabled={member.role === 'manager'} onChange={(event) => roleMutation.mutate({ id: member.id, role: event.target.value as StoreMember['role'] })}><option value="manager">مدیر</option><option value="admin">ادمین</option><option value="seller">فروشنده</option></select><StatusBadge tone={member.role === 'manager' ? 'purple' : 'info'}>{roleLabel[member.role]}</StatusBadge>{member.role !== 'manager' && <button className="row-delete" onClick={() => window.confirm('دسترسی این عضو حذف شود؟') && deleteMutation.mutate(member.id)}><Trash2 /></button>}</article>)}</div>
    {open && <Modal title="دعوت عضو" subtitle="کاربر باید قبلاً حساب کاربری ساخته باشد." onClose={() => setOpen(false)}><form className="modal-form" onSubmit={(event) => { event.preventDefault(); setError(''); if (!form.invite_username) { setError('نام کاربری را وارد کنید.'); return } inviteMutation.mutate(form) }}><label>نام کاربری *<input value={form.invite_username} onChange={(event) => setForm({ ...form, invite_username: event.target.value })} placeholder="username" autoFocus /></label><label>نقش<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as StoreMember['role'] })}><option value="seller">فروشنده</option><option value="admin">ادمین</option></select></label>{error && <p className="form-alert">{error}</p>}<button className="primary-button" disabled={inviteMutation.isPending}>{inviteMutation.isPending ? <LoaderCircle className="spin" /> : <UserPlus />} ارسال دعوت</button></form></Modal>}
  </div>
}
