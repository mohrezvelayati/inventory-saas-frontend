import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDownUp, ArrowRight, Boxes, Check, Clock3, Copy, FolderPlus, History, Link2, LoaderCircle, PackagePlus, Pencil, Plus, RefreshCw, RotateCcw, Search, Settings2, SlidersHorizontal, Trash2, UserPlus, UsersRound, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Pagination, SearchBox, StatusBadge, FilterButton } from '../components/UI'
import { createCustomer, type CustomerInput, deleteCustomer, getCustomers, updateCustomer } from '../features/customers/customersApi'
import { createInventoryMovement, getAllInventory, getInventory, getInventoryHistory } from '../features/inventory/inventoryApi'
import { createCategory, deleteCategory, getCategories } from '../features/products/productApi'
import { deleteMember, getMemberPermissions, getMembers, getPermissionCatalog, grantMemberPermission, revokeMemberPermission, updateMemberRole } from '../features/stores/membersApi'
import { buildInvitationLink, copyText, createInvitation, getInvitations, revokeInvitation } from '../features/stores/invitationsApi'
import type { Customer, InvitationRole, StoreInvitation, StoreMember } from '../types/api'

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
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [gender, setGender] = useState('')
  const [ageMin, setAgeMin] = useState<number | ''>('')
  const [ageMax, setAgeMax] = useState<number | ''>('')
  const [open, setOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [form, setForm] = useState({ full_name: '', phone_number: '', gender: 'male' as Customer['gender'], age: '' })
  const [error, setError] = useState('')
  const { data, isPending } = useQuery({ queryKey: ['customers', search, page, gender, ageMin, ageMax], queryFn: () => getCustomers({ search, page, gender, ageMin, ageMax }) })
  const customers = data?.results ?? []
  const createMutation = useMutation({ mutationFn: createCustomer, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['customers'] }); setOpen(false); setForm({ full_name: '', phone_number: '', gender: 'male', age: '' }) }, onError: (mutationError) => setError((mutationError as Error).message) })
  const deleteMutation = useMutation({ mutationFn: deleteCustomer, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }) })

  return <div className="page operation-page">
    <PageHeading title="مشتریان" subtitle="مدیریت اطلاعات تماس و سوابق مشتریان" />
    <SearchBox placeholder="جستجو با نام یا شماره تلفن..." value={search} onChange={(value) => { setSearch(value); setPage(1) }} />
    <div className="filters filters--wide"><FilterButton icon={SlidersHorizontal} active={Boolean(gender || ageMin || ageMax)} onClick={() => setFiltersOpen((value) => !value)}>فیلتر مشتریان</FilterButton></div>
    {filtersOpen && <section className="filter-panel card"><label>جنسیت<select value={gender} onChange={(event) => { setGender(event.target.value); setPage(1) }}><option value="">همه جنسیت‌ها</option><option value="male">آقا</option><option value="female">خانم</option></select></label><div className="filter-date-row"><label>حداقل سن<input type="number" min="0" max="150" value={ageMin} onChange={(event) => { const value = event.target.value === '' ? '' : Number(event.target.value); setAgeMin(value); setPage(1) }} placeholder="هر سن" /></label><label>حداکثر سن<input type="number" min="0" max="150" value={ageMax} onChange={(event) => { const value = event.target.value === '' ? '' : Number(event.target.value); setAgeMax(value); setPage(1) }} placeholder="هر سن" /></label></div><button className="filter-reset" type="button" onClick={() => { setGender(''); setAgeMin(''); setAgeMax(''); setPage(1) }}><RotateCcw /> پاک‌کردن فیلترها</button></section>}
    <button className="primary-button" onClick={() => setOpen(true)}><UserPlus /> افزودن مشتری</button>
    <div className="operation-summary card"><UsersRound /><div><strong>{data?.count ?? '—'}</strong><span>مشتری ثبت‌شده</span></div></div>
    <div className="simple-list">{isPending ? <div className="loading-state"><LoaderCircle className="spin" /></div> : customers.map((customer) => <article className="simple-row card" key={customer.id}><span className="initial-avatar">{customer.full_name.charAt(0)}</span><div><strong>{customer.full_name}</strong><small>{customer.phone_number}</small><small>{customer.gender === 'female' ? 'خانم' : 'آقا'}{customer.age ? ` · ${customer.age} سال` : ''}</small><small>{customer.total_items_purchased.toLocaleString('fa-IR')} قلم خرید</small></div><div className="row-actions"><button className="row-edit" onClick={() => setEditingCustomer(customer)} aria-label="ویرایش مشتری"><Pencil /></button><button className="row-delete" onClick={() => window.confirm('این مشتری حذف شود؟') && deleteMutation.mutate(customer.id)} aria-label="حذف مشتری"><Trash2 /></button></div></article>)}</div>
    <Pagination page={page} count={data?.count ?? 0} onChange={setPage} />
    {open && <Modal title="مشتری جدید" subtitle="نام و شماره تماس مشتری را ثبت کنید." onClose={() => setOpen(false)}><form className="modal-form" onSubmit={(event) => { event.preventDefault(); setError(''); if (!form.full_name || !form.phone_number) { setError('هر دو فیلد ضروری هستند.'); return } createMutation.mutate({ ...form, age: form.age ? Number(form.age) : null }) }}><label>نام و نام خانوادگی *<input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} autoFocus /></label><label>شماره تلفن *<input value={form.phone_number} onChange={(event) => setForm({ ...form, phone_number: event.target.value })} inputMode="tel" /></label><div className="form-row"><label>جنسیت<select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value as Customer['gender'] })}><option value="male">آقا</option><option value="female">خانم</option></select></label><label>سن<input type="number" min="0" max="150" value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} placeholder="اختیاری" /></label></div>{error && <p className="form-alert">{error}</p>}<button className="primary-button" disabled={createMutation.isPending}>{createMutation.isPending ? <LoaderCircle className="spin" /> : <UserPlus />} ثبت مشتری</button></form></Modal>}
    {editingCustomer && <CustomerEditModal customer={editingCustomer} onClose={() => setEditingCustomer(null)} />}
  </div>
}

function CustomerEditModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ full_name: customer.full_name, phone_number: customer.phone_number, gender: customer.gender, age: customer.age ? String(customer.age) : '' })
  const [error, setError] = useState('')
  const mutation = useMutation({ mutationFn: (input: CustomerInput) => updateCustomer(customer.id, input), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['customers'] }); onClose() }, onError: (mutationError) => setError((mutationError as Error).message) })
  return <Modal title="ویرایش مشتری" subtitle="نام و شماره تماس مشتری را اصلاح کنید." onClose={onClose}><form className="modal-form" onSubmit={(event) => { event.preventDefault(); setError(''); if (!form.full_name.trim() || !form.phone_number.trim()) { setError('هر دو فیلد ضروری هستند.'); return } mutation.mutate({ ...form, age: form.age ? Number(form.age) : null }) }}><label>نام و نام خانوادگی *<input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} autoFocus /></label><label>شماره تلفن *<input value={form.phone_number} onChange={(event) => setForm({ ...form, phone_number: event.target.value })} inputMode="tel" /></label><div className="form-row"><label>جنسیت<select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value as Customer['gender'] })}><option value="male">آقا</option><option value="female">خانم</option></select></label><label>سن<input type="number" min="0" max="150" value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} placeholder="اختیاری" /></label></div>{error && <p className="form-alert">{error}</p>}<button className="primary-button" disabled={mutation.isPending}>{mutation.isPending ? <LoaderCircle className="spin" /> : <Pencil />} ذخیره تغییرات</button></form></Modal>
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
  const [form, setForm] = useState<{ phone_number: string; role: InvitationRole }>({ phone_number: '', role: 'seller' })
  const [createdInvitation, setCreatedInvitation] = useState<StoreInvitation | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [permissionMember, setPermissionMember] = useState<StoreMember | null>(null)
  const { data, isPending } = useQuery({ queryKey: ['members', page], queryFn: () => getMembers(page) })
  const { data: invitations, isPending: invitationsPending } = useQuery({ queryKey: ['invitations'], queryFn: getInvitations })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['members'] })
  const inviteMutation = useMutation({ mutationFn: createInvitation, onSuccess: async (invitation) => { await queryClient.invalidateQueries({ queryKey: ['invitations'] }); setError(''); setCopied(false); setCreatedInvitation(invitation); setOpen(true) }, onError: (mutationError) => setError((mutationError as Error).message) })
  const revokeMutation = useMutation({ mutationFn: revokeInvitation, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invitations'] }), onError: (mutationError) => setError((mutationError as Error).message) })
  const roleMutation = useMutation({ mutationFn: updateMemberRole, onSuccess: refresh, onError: (mutationError) => setError((mutationError as Error).message) })
  const deleteMutation = useMutation({ mutationFn: deleteMember, onSuccess: refresh, onError: (mutationError) => setError((mutationError as Error).message) })
  const roleLabel: Record<StoreMember['role'], string> = { manager: 'مدیر', admin: 'ادمین', seller: 'فروشنده' }
  const invitationLink = createdInvitation?.token ? buildInvitationLink(createdInvitation.token) : ''

  const closeInvitationModal = () => {
    setOpen(false)
    setCreatedInvitation(null)
    setCopied(false)
    setForm({ phone_number: '', role: 'seller' })
  }

  const copyInvitationLink = async () => {
    if (!invitationLink) return
    try {
      await copyText(invitationLink)
      setCopied(true)
    } catch {
      setError('کپی خودکار انجام نشد؛ لینک را به‌صورت دستی کپی کنید.')
    }
  }

  return <div className="page operation-page">
    <PageHeading title="کاربران و نقش‌ها" subtitle="دعوت کارکنان و مدیریت نقش آن‌ها" />
    <button className="primary-button" onClick={() => setOpen(true)}><UserPlus /> دعوت عضو جدید</button>
    {error && <p className="form-alert">{error}</p>}
    <div className="operation-summary card"><UsersRound /><div><strong>{data?.count ?? '—'}</strong><span>عضو فروشگاه</span></div></div>
    <div className="simple-list">{isPending ? <div className="loading-state"><LoaderCircle className="spin" /></div> : data?.results.map((member) => <article className="member-row card" key={member.id}><span className="initial-avatar">{(member.user_full_name || member.username).charAt(0)}</span><div><strong>{member.user_full_name || member.username}</strong><small>@{member.username}</small></div><select value={member.role} disabled={member.role === 'manager'} onChange={(event) => roleMutation.mutate({ id: member.id, role: event.target.value as StoreMember['role'] })}><option value="manager">مدیر</option><option value="admin">ادمین</option><option value="seller">فروشنده</option></select><StatusBadge tone={member.role === 'manager' ? 'purple' : 'info'}>{roleLabel[member.role]}</StatusBadge>{member.role !== 'manager' ? <div className="member-actions"><button className="permission-button" onClick={() => setPermissionMember(member)} aria-label="مدیریت دسترسی‌ها"><Settings2 /></button><button className="row-delete" onClick={() => window.confirm('دسترسی این عضو حذف شود؟') && deleteMutation.mutate(member.id)}><Trash2 /></button></div> : <span />}</article>)}</div>
    <Pagination page={page} count={data?.count ?? 0} onChange={setPage} />
    <section className="pending-invitations">
      <div className="section-heading"><h3 className="section-title">دعوت‌های در انتظار</h3><span>{invitations?.length.toLocaleString('fa-IR') ?? '—'}</span></div>
      {invitationsPending ? <div className="loading-state"><LoaderCircle className="spin" /></div> : invitations?.length ? <div className="simple-list">{invitations.map((invitation) => <article className="invitation-row card" key={invitation.id}><span className="activity-icon purple"><Clock3 /></span><div><strong>{invitation.phone_number}</strong><small>{roleLabel[invitation.role]} · انقضا {new Date(invitation.expires_at).toLocaleDateString('fa-IR')}</small></div><button className="permission-button" aria-label="ساخت مجدد دعوت" disabled={inviteMutation.isPending} onClick={() => inviteMutation.mutate({ phone_number: invitation.phone_number, role: invitation.role })}><RefreshCw /></button><button className="row-delete" aria-label="لغو دعوت" disabled={revokeMutation.isPending} onClick={() => window.confirm('این دعوت لغو شود؟') && revokeMutation.mutate(invitation.id)}><Trash2 /></button></article>)}</div> : <p className="muted-empty">دعوتی در انتظار پذیرش نیست.</p>}
    </section>
    {open && <Modal title={createdInvitation ? 'لینک دعوت آماده است' : 'دعوت عضو'} subtitle={createdInvitation ? 'لینک را برای عضو جدید در واتساپ یا تلگرام بفرستید.' : 'شماره تلفن و نقش عضو جدید را مشخص کنید.'} onClose={closeInvitationModal}>{createdInvitation ? <div className="invitation-result"><Link2 /><strong>لینک دعوت ساخته شد</strong><div className="invitation-link" dir="ltr"><input value={invitationLink} readOnly aria-label="لینک دعوت" /><button onClick={copyInvitationLink}>{copied ? <Check /> : <Copy />}{copied ? 'کپی شد' : 'کپی'}</button></div><small>این لینک فقط یک‌بار قابل استفاده و تا ۷ روز معتبر است.</small><button className="primary-button" onClick={closeInvitationModal}>تمام</button></div> : <form className="modal-form" onSubmit={(event) => { event.preventDefault(); setError(''); if (!/^\d{11}$/.test(form.phone_number)) { setError('شماره تلفن ۱۱ رقمی معتبر وارد کنید.'); return } inviteMutation.mutate(form) }}><label>شماره تلفن *<input dir="ltr" inputMode="tel" value={form.phone_number} onChange={(event) => setForm({ ...form, phone_number: event.target.value })} placeholder="09123456789" autoFocus /></label><label>نقش<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as InvitationRole })}><option value="seller">فروشنده</option><option value="admin">ادمین</option></select></label>{error && <p className="form-alert">{error}</p>}<button className="primary-button" disabled={inviteMutation.isPending}>{inviteMutation.isPending ? <LoaderCircle className="spin" /> : <UserPlus />} ساخت لینک دعوت</button></form>}</Modal>}
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
