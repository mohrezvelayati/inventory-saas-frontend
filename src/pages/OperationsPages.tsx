import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDownUp, ArrowRight, Boxes, FolderPlus, History, LoaderCircle, PackagePlus, Plus, Search, Settings2, Trash2, UserPlus, UsersRound, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Pagination, SearchBox, StatusBadge } from '../components/UI'
import { createCustomer, deleteCustomer, getCustomers } from '../features/customers/customersApi'
import { createInventoryMovement, getAllInventory, getInventory, getInventoryHistory } from '../features/inventory/inventoryApi'
import { createCategory, deleteCategory, getCategories } from '../features/products/productApi'
import { deleteMember, getMemberPermissions, getMembers, getPermissionCatalog, grantMemberPermission, inviteMember, revokeMemberPermission, updateMemberRole } from '../features/stores/membersApi'
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
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone_number: '' })
  const [error, setError] = useState('')
  const { data, isPending } = useQuery({ queryKey: ['customers', search, page], queryFn: () => getCustomers(search, page) })
  const customers = data?.results ?? []
  const createMutation = useMutation({ mutationFn: createCustomer, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['customers'] }); setOpen(false); setForm({ full_name: '', phone_number: '' }) }, onError: (mutationError) => setError((mutationError as Error).message) })
  const deleteMutation = useMutation({ mutationFn: deleteCustomer, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }) })

  return <div className="page operation-page">
    <PageHeading title="مشتریان" subtitle="مدیریت اطلاعات تماس و سوابق مشتریان" />
    <SearchBox placeholder="جستجو با نام یا شماره تلفن..." value={search} onChange={(value) => { setSearch(value); setPage(1) }} />
    <button className="primary-button" onClick={() => setOpen(true)}><UserPlus /> افزودن مشتری</button>
    <div className="operation-summary card"><UsersRound /><div><strong>{data?.count ?? '—'}</strong><span>مشتری ثبت‌شده</span></div></div>
    <div className="simple-list">{isPending ? <div className="loading-state"><LoaderCircle className="spin" /></div> : customers.map((customer) => <article className="simple-row card" key={customer.id}><span className="initial-avatar">{customer.full_name.charAt(0)}</span><div><strong>{customer.full_name}</strong><small>{customer.phone_number}</small></div><button className="row-delete" onClick={() => window.confirm('این مشتری حذف شود؟') && deleteMutation.mutate(customer.id)}><Trash2 /></button></article>)}</div>
    <Pagination page={page} count={data?.count ?? 0} onChange={setPage} />
    {open && <Modal title="مشتری جدید" subtitle="نام و شماره تماس مشتری را ثبت کنید." onClose={() => setOpen(false)}><form className="modal-form" onSubmit={(event) => { event.preventDefault(); setError(''); if (!form.full_name || !form.phone_number) { setError('هر دو فیلد ضروری هستند.'); return } createMutation.mutate(form) }}><label>نام و نام خانوادگی *<input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} autoFocus /></label><label>شماره تلفن *<input value={form.phone_number} onChange={(event) => setForm({ ...form, phone_number: event.target.value })} inputMode="tel" /></label>{error && <p className="form-alert">{error}</p>}<button className="primary-button" disabled={createMutation.isPending}>{createMutation.isPending ? <LoaderCircle className="spin" /> : <UserPlus />} ثبت مشتری</button></form></Modal>}
  </div>
}

export function InventoryPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ variant: '', quantity: '', movement_type: 'purchase' as 'purchase' | 'adjustment', note: '' })
  const [error, setError] = useState('')
  const { data, isPending } = useQuery({ queryKey: ['inventory', search, page], queryFn: () => getInventory(search, page) })
  const { data: inventoryChoices } = useQuery({ queryKey: ['inventory', 'movement-picker'], queryFn: getAllInventory })
  const items = data?.results ?? []
  const totalStock = data?.results.reduce((sum, item) => sum + item.current_stock, 0) ?? 0
  const mutation = useMutation({ mutationFn: createInventoryMovement, onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ['inventory'] }), queryClient.invalidateQueries({ queryKey: ['products'] }), queryClient.invalidateQueries({ queryKey: ['dashboard'] })]); setOpen(false) }, onError: (mutationError) => setError((mutationError as Error).message) })

  return <div className="page operation-page">
    <PageHeading title="موجودی" subtitle="مشاهده موجودی و ثبت ورود یا اصلاح کالا" />
    <SearchBox placeholder="جستجو در موجودی..." value={search} onChange={(value) => { setSearch(value); setPage(1) }} />
    <button className="primary-button" onClick={() => setOpen(true)}><PackagePlus /> ثبت تغییر موجودی</button>
    <Link className="secondary-button secondary-link" to="/inventory/history"><History /> تاریخچه حرکات موجودی</Link>
    <div className="operation-summary card"><Boxes /><div><strong>{totalStock.toLocaleString('fa-IR')}</strong><span>موجودی این صفحه از {data?.count ?? '—'} سایز</span></div></div>
    <div className="simple-list">{isPending ? <div className="loading-state"><LoaderCircle className="spin" /></div> : items.map((item) => <article className="simple-row card" key={item.id}><span className="product-visual compact">📦</span><div><strong>{item.product_name}</strong><small>سایز {item.size}</small></div><StatusBadge tone={item.current_stock === 0 ? 'danger' : item.current_stock <= 2 ? 'warning' : 'success'}>{item.current_stock.toLocaleString('fa-IR')} عدد</StatusBadge></article>)}</div>
    <Pagination page={page} count={data?.count ?? 0} onChange={setPage} />
    {open && <Modal title="تغییر موجودی" subtitle="ورود خرید یا اصلاح موجودی را ثبت کنید." onClose={() => setOpen(false)}><form className="modal-form" onSubmit={(event) => { event.preventDefault(); setError(''); if (!form.variant || !form.quantity || Number(form.quantity) === 0) { setError('کالا و تعداد معتبر ضروری هستند.'); return } mutation.mutate({ variant: Number(form.variant), quantity: Number(form.quantity), movement_type: form.movement_type, note: form.note }) }}><label>کالا و سایز *<select value={form.variant} onChange={(event) => setForm({ ...form, variant: event.target.value })}><option value="">انتخاب کنید</option>{inventoryChoices?.map((item) => <option key={item.id} value={item.id}>{item.product_name} — سایز {item.size}</option>)}</select></label><div className="form-row"><label>نوع حرکت<select value={form.movement_type} onChange={(event) => setForm({ ...form, movement_type: event.target.value as 'purchase' | 'adjustment' })}><option value="purchase">ورود خرید</option><option value="adjustment">اصلاح موجودی</option></select></label><label>تعداد *<input type="number" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} placeholder={form.movement_type === 'adjustment' ? 'مثبت یا منفی' : 'مثبت'} /></label></div><label>یادداشت<input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></label>{error && <p className="form-alert">{error}</p>}<button className="primary-button" disabled={mutation.isPending}>{mutation.isPending ? <LoaderCircle className="spin" /> : <PackagePlus />} ثبت موجودی</button></form></Modal>}
  </div>
}

export function InventoryHistoryPage() {
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const { data, isPending, isError, error } = useQuery({ queryKey: ['inventory-history', type, page], queryFn: () => getInventoryHistory(type, page) })
  const typeLabel: Record<string, { label: string; tone: string }> = { purchase: { label: 'خرید', tone: 'success' }, adjustment: { label: 'اصلاح', tone: 'warning' }, sale: { label: 'فروش', tone: 'purple' } }
  return <div className="page operation-page">
    <div className="subpage-heading"><Link to="/inventory"><ArrowRight /></Link><div><h2>تاریخچه موجودی</h2><p>ردیابی تمام ورودها، اصلاح‌ها و خروج فروش</p></div></div>
    <div className="status-tabs">{[{ value: '', label: 'همه' }, { value: 'purchase', label: 'خرید' }, { value: 'adjustment', label: 'اصلاح' }, { value: 'sale', label: 'فروش' }].map((item) => <button className={type === item.value ? 'active' : ''} key={item.value} onClick={() => { setType(item.value); setPage(1) }}>{item.label}</button>)}</div>
    <div className="operation-summary card"><ArrowDownUp /><div><strong>{data?.count ?? '—'}</strong><span>حرکت ثبت‌شده</span></div></div>
    <div className="simple-list">{isPending && <div className="loading-state"><LoaderCircle className="spin" /></div>}{isError && <div className="error-state"><History /><strong>تاریخچه دریافت نشد</strong><span>{(error as Error).message}</span></div>}{data?.results.map((movement) => { const meta = typeLabel[movement.movement_type]; return <article className="movement-row card" key={movement.id}><span className={`movement-quantity ${movement.quantity > 0 ? 'in' : 'out'}`}>{movement.quantity > 0 ? '+' : ''}{movement.quantity.toLocaleString('fa-IR')}</span><div><strong>{movement.product_name}</strong><small>سایز {movement.variant_size} · {movement.created_by_username || 'سیستم'}</small><small>{new Date(movement.created_at).toLocaleString('fa-IR')}</small></div><StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>{movement.note && <p>{movement.note}</p>}</article> })}</div>
    <Pagination page={page} count={data?.count ?? 0} onChange={setPage} />
  </div>
}

export function CategoriesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const { data, isPending } = useQuery({ queryKey: ['categories', page], queryFn: () => getCategories(page) })
  const createMutation = useMutation({ mutationFn: createCategory, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['categories'] }); setName('') }, onError: (mutationError) => setError((mutationError as Error).message) })
  const deleteMutation = useMutation({ mutationFn: deleteCategory, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }) })

  return <div className="page operation-page">
    <PageHeading title="دسته‌بندی‌ها" subtitle="گروه‌بندی محصولات فروشگاه" />
    <form className="inline-create card" onSubmit={(event) => { event.preventDefault(); setError(''); if (!name.trim()) { setError('نام دسته‌بندی را وارد کنید.'); return } createMutation.mutate(name) }}><FolderPlus /><input value={name} onChange={(event) => setName(event.target.value)} placeholder="نام دسته‌بندی جدید" /><button disabled={createMutation.isPending}><Plus /></button></form>
    {error && <p className="form-alert">{error}</p>}
    <div className="operation-summary card"><Search /><div><strong>{data?.count ?? '—'}</strong><span>دسته‌بندی فعال</span></div></div>
    <div className="simple-list">{isPending ? <div className="loading-state"><LoaderCircle className="spin" /></div> : data?.results.map((category) => <article className="simple-row card" key={category.id}><span className="activity-icon purple"><FolderPlus /></span><div><strong>{category.name}</strong><small>ساخته‌شده در {new Date(category.created_at).toLocaleDateString('fa-IR')}</small></div><button className="row-delete" onClick={() => window.confirm('این دسته‌بندی حذف شود؟') && deleteMutation.mutate(category.id)}><Trash2 /></button></article>)}</div>
    <Pagination page={page} count={data?.count ?? 0} onChange={setPage} />
  </div>
}

export function MembersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<{ invite_username: string; role: StoreMember['role'] }>({ invite_username: '', role: 'seller' })
  const [error, setError] = useState('')
  const [permissionMember, setPermissionMember] = useState<StoreMember | null>(null)
  const { data, isPending } = useQuery({ queryKey: ['members', page], queryFn: () => getMembers(page) })
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
    <div className="simple-list">{isPending ? <div className="loading-state"><LoaderCircle className="spin" /></div> : data?.results.map((member) => <article className="member-row card" key={member.id}><span className="initial-avatar">{(member.user_full_name || member.username).charAt(0)}</span><div><strong>{member.user_full_name || member.username}</strong><small>@{member.username}</small></div><select value={member.role} disabled={member.role === 'manager'} onChange={(event) => roleMutation.mutate({ id: member.id, role: event.target.value as StoreMember['role'] })}><option value="manager">مدیر</option><option value="admin">ادمین</option><option value="seller">فروشنده</option></select><StatusBadge tone={member.role === 'manager' ? 'purple' : 'info'}>{roleLabel[member.role]}</StatusBadge>{member.role !== 'manager' ? <div className="member-actions"><button className="permission-button" onClick={() => setPermissionMember(member)} aria-label="مدیریت دسترسی‌ها"><Settings2 /></button><button className="row-delete" onClick={() => window.confirm('دسترسی این عضو حذف شود؟') && deleteMutation.mutate(member.id)}><Trash2 /></button></div> : <span />}</article>)}</div>
    <Pagination page={page} count={data?.count ?? 0} onChange={setPage} />
    {open && <Modal title="دعوت عضو" subtitle="کاربر باید قبلاً حساب کاربری ساخته باشد." onClose={() => setOpen(false)}><form className="modal-form" onSubmit={(event) => { event.preventDefault(); setError(''); if (!form.invite_username) { setError('نام کاربری را وارد کنید.'); return } inviteMutation.mutate(form) }}><label>نام کاربری *<input value={form.invite_username} onChange={(event) => setForm({ ...form, invite_username: event.target.value })} placeholder="username" autoFocus /></label><label>نقش<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as StoreMember['role'] })}><option value="seller">فروشنده</option><option value="admin">ادمین</option></select></label>{error && <p className="form-alert">{error}</p>}<button className="primary-button" disabled={inviteMutation.isPending}>{inviteMutation.isPending ? <LoaderCircle className="spin" /> : <UserPlus />} ارسال دعوت</button></form></Modal>}
    {permissionMember && <MemberPermissionsModal member={permissionMember} onClose={() => setPermissionMember(null)} />}
  </div>
}

function MemberPermissionsModal({ member, onClose }: { member: StoreMember; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const { data: catalog, isPending: catalogPending } = useQuery({ queryKey: ['permission-catalog'], queryFn: getPermissionCatalog })
  const { data: assigned, isPending: assignedPending } = useQuery({ queryKey: ['member-permissions', member.id], queryFn: () => getMemberPermissions(member.id) })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['member-permissions', member.id] })
  const grantMutation = useMutation({ mutationFn: (permissionId: number) => grantMemberPermission(member.id, permissionId), onSuccess: refresh, onError: (mutationError) => setError((mutationError as Error).message) })
  const revokeMutation = useMutation({ mutationFn: (membershipPermissionId: number) => revokeMemberPermission(member.id, membershipPermissionId), onSuccess: refresh, onError: (mutationError) => setError((mutationError as Error).message) })
  const busy = grantMutation.isPending || revokeMutation.isPending
  return <Modal title={`دسترسی‌های ${member.user_full_name || member.username}`} subtitle="هر قابلیت را متناسب با مسئولیت این عضو فعال کنید." onClose={onClose}>
    <div className="permission-list">{catalogPending || assignedPending ? <div className="mini-loading"><LoaderCircle className="spin" /></div> : catalog?.results.map((permission) => { const current = assigned?.results.find((item) => item.permission === permission.id); return <label key={permission.id}><span><strong>{permission.name}</strong><small>{permission.code}</small></span><input type="checkbox" checked={Boolean(current)} disabled={busy} onChange={() => current ? revokeMutation.mutate(current.id) : grantMutation.mutate(permission.id)} /></label> })}</div>
    {error && <p className="form-alert">{error}</p>}
    <button className="primary-button" onClick={onClose}>تمام</button>
  </Modal>
}
