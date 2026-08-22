import { useMutation } from '@tanstack/react-query'
import { ArrowRight, CheckCircle2, LoaderCircle, Save, ShieldCheck, Store, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { updateCurrentUser } from '../features/auth/authApi'
import { useAuth } from '../features/auth/useAuth'
import { updateCurrentStore } from '../features/stores/storeApi'

function SettingsHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="subpage-heading"><Link to="/more" aria-label="بازگشت"><ArrowRight /></Link><div><h2>{title}</h2><p>{subtitle}</p></div></div>
}

export function ProfileSettingsPage() {
  const { user, refreshUser } = useAuth()
  const [form, setForm] = useState({ username: user?.username ?? '', full_name: user?.full_name ?? '', phone_number: user?.phone_number ?? '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const mutation = useMutation({
    mutationFn: updateCurrentUser,
    onSuccess: async () => {
      await refreshUser()
      setError('')
      setMessage('اطلاعات پروفایل با موفقیت ذخیره شد.')
    },
    onError: (mutationError) => { setMessage(''); setError((mutationError as Error).message) },
  })

  return <div className="page settings-page">
    <SettingsHeading title="پروفایل کاربری" subtitle="اطلاعات شخصی و راه ارتباطی خود را ویرایش کنید." />
    <section className="settings-hero card"><span><UserRound /></span><div><strong>{user?.full_name || user?.username}</strong><small>نام کاربری: @{user?.username}</small></div></section>
    <form className="detail-form card" onSubmit={(event) => { event.preventDefault(); setMessage(''); setError(''); if (!form.username.trim() || !form.full_name.trim() || !form.phone_number.trim()) { setError('همه فیلدها ضروری هستند.'); return } mutation.mutate(form) }}>
      <h3>اطلاعات حساب</h3>
      <label>نام و نام خانوادگی<input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} /></label>
      <label>نام کاربری<input dir="ltr" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></label>
      <label>شماره تلفن<input dir="ltr" inputMode="tel" value={form.phone_number} onChange={(event) => setForm({ ...form, phone_number: event.target.value })} /></label>
      {error && <p className="form-alert">{error}</p>}
      {message && <p className="form-success"><CheckCircle2 />{message}</p>}
      <button className="primary-button" disabled={mutation.isPending}>{mutation.isPending ? <LoaderCircle className="spin" /> : <Save />} ذخیره تغییرات</button>
    </form>
  </div>
}

export function StoreSettingsPage() {
  const { user, refreshUser } = useAuth()
  const [name, setName] = useState(user?.membership?.store.name ?? '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const mutation = useMutation({
    mutationFn: updateCurrentStore,
    onSuccess: async () => {
      await refreshUser()
      setError('')
      setMessage('تنظیمات فروشگاه با موفقیت ذخیره شد.')
    },
    onError: (mutationError) => { setMessage(''); setError((mutationError as Error).message) },
  })

  return <div className="page settings-page">
    <SettingsHeading title="تنظیمات فروشگاه" subtitle="اطلاعات اصلی فروشگاه و سطح دسترسی خود را ببینید." />
    <section className="settings-hero store-settings-hero card"><span><Store /></span><div><strong>{user?.membership?.store.name}</strong><small>شناسه فروشگاه: {user?.membership?.store.id.toLocaleString('fa-IR')}</small></div></section>
    <form className="detail-form card" onSubmit={(event) => { event.preventDefault(); setMessage(''); setError(''); if (!name.trim()) { setError('نام فروشگاه ضروری است.'); return } mutation.mutate(name.trim()) }}>
      <h3>اطلاعات فروشگاه</h3>
      <label>نام فروشگاه<input value={name} onChange={(event) => setName(event.target.value)} /></label>
      <div className="readonly-setting"><ShieldCheck /><span><strong>نقش شما</strong><small>{user?.membership?.role === 'manager' ? 'مدیر فروشگاه' : user?.membership?.role === 'admin' ? 'ادمین' : 'فروشنده'}</small></span></div>
      {error && <p className="form-alert">{error}</p>}
      {message && <p className="form-success"><CheckCircle2 />{message}</p>}
      <button className="primary-button" disabled={mutation.isPending}>{mutation.isPending ? <LoaderCircle className="spin" /> : <Save />} ذخیره تنظیمات</button>
    </form>
  </div>
}
