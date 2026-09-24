import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, CheckCircle2, LoaderCircle, Mail, Save, ShieldCheck, Store, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { changePassword, updateCurrentUser } from '../features/auth/authApi'
import { useAuth } from '../features/auth/useAuth'
import { getCurrentStore, updateCurrentStore } from '../features/stores/storeApi'
import type { Store as StoreType } from '../types/api'

function SettingsHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="subpage-heading"><Link to="/more" aria-label="بازگشت"><ArrowRight /></Link><div><h2>{title}</h2><p>{subtitle}</p></div></div>
}

export function ProfileSettingsPage() {
  const { user, refreshUser, logout } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: user?.username ?? '', full_name: user?.full_name ?? '', phone_number: user?.phone_number ?? '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [passwords, setPasswords] = useState({ current: '', next: '' })
  const mutation = useMutation({
    mutationFn: updateCurrentUser,
    onSuccess: async () => {
      await refreshUser()
      setError('')
      setMessage('اطلاعات پروفایل با موفقیت ذخیره شد.')
    },
    onError: (mutationError) => { setMessage(''); setError((mutationError as Error).message) },
  })
  const passwordMutation = useMutation({
    mutationFn: () => changePassword(passwords.current, passwords.next),
    onSuccess: async () => {
      setPasswords({ current: '', next: '' })
      await logout()
      navigate('/login', { replace: true, state: { message: 'رمز عبور تغییر کرد؛ دوباره وارد شوید.' } })
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
    <form className="detail-form card" onSubmit={(event) => { event.preventDefault(); setMessage(''); setError(''); passwordMutation.mutate() }}>
      <h3>تغییر رمز عبور</h3>
      <label>رمز فعلی<input type="password" autoComplete="current-password" value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} required /></label>
      <label>رمز جدید<input type="password" autoComplete="new-password" minLength={8} value={passwords.next} onChange={(event) => setPasswords({ ...passwords, next: event.target.value })} required /></label>
      <button className="primary-button" disabled={passwordMutation.isPending}>{passwordMutation.isPending ? <LoaderCircle className="spin" /> : <ShieldCheck />} تغییر رمز عبور</button>
    </form>
  </div>
}

export function StoreSettingsPage() {
  const { user } = useAuth()
  const { data: store, isPending, isError, error } = useQuery({
    queryKey: ['current-store', user?.membership?.store.id],
    queryFn: getCurrentStore,
  })

  if (isPending) return <div className="loading-state home-loading"><LoaderCircle className="spin" /><span>در حال دریافت تنظیمات فروشگاه...</span></div>
  if (isError || !store) return <div className="error-state home-loading"><Store /><strong>تنظیمات فروشگاه دریافت نشد</strong><span>{(error as Error)?.message}</span></div>

  return <StoreSettingsForm store={store} />
}

function StoreSettingsForm({ store }: { store: StoreType }) {
  const { user, refreshUser } = useAuth()
  const queryClient = useQueryClient()
  const [name, setName] = useState(store.name)
  const [notificationEmail, setNotificationEmail] = useState(store.notification_email)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const mutation = useMutation({
    mutationFn: updateCurrentStore,
    onSuccess: async (updatedStore) => {
      queryClient.setQueryData(['current-store', store.id], updatedStore)
      await refreshUser()
      setError('')
      setMessage('تنظیمات فروشگاه با موفقیت ذخیره شد.')
    },
    onError: (mutationError) => { setMessage(''); setError((mutationError as Error).message) },
  })

  return <div className="page settings-page">
    <SettingsHeading title="تنظیمات فروشگاه" subtitle="اطلاعات اصلی فروشگاه و سطح دسترسی خود را ببینید." />
    <section className="settings-hero store-settings-hero card"><span><Store /></span><div><strong>{store.name}</strong><small>شناسه فروشگاه: {store.id.toLocaleString('fa-IR')}</small></div></section>
    <form className="detail-form card" noValidate onSubmit={(event) => {
      event.preventDefault()
      setMessage('')
      setError('')
      const normalizedName = name.trim()
      const normalizedEmail = notificationEmail.trim()
      if (!normalizedName) { setError('نام فروشگاه ضروری است.'); return }
      if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) { setError('یک ایمیل معتبر وارد کنید.'); return }
      mutation.mutate({ name: normalizedName, notification_email: normalizedEmail })
    }}>
      <h3>اطلاعات فروشگاه</h3>
      <label>نام فروشگاه<input value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label htmlFor="notification-email">ایمیل دریافت اعلان‌ها<input id="notification-email" dir="ltr" type="email" autoComplete="email" placeholder="owner@example.com" value={notificationEmail} onChange={(event) => setNotificationEmail(event.target.value)} /></label>
      <small className="setting-help">برای غیرفعال‌کردن اعلان ایمیلی، این فیلد را خالی بگذارید.</small>
      <div className="readonly-setting notification-setting-note"><Mail /><span><strong>اعلان تکمیل فروش</strong><small>بعد از تکمیل هر فروش، خلاصهٔ آن به این ایمیل ارسال می‌شود.</small></span></div>
      <div className="readonly-setting"><ShieldCheck /><span><strong>نقش شما</strong><small>{user?.membership?.role === 'manager' ? 'مدیر فروشگاه' : user?.membership?.role === 'admin' ? 'ادمین' : 'فروشنده'}</small></span></div>
      {error && <p className="form-alert">{error}</p>}
      {message && <p className="form-success"><CheckCircle2 />{message}</p>}
      <button className="primary-button" disabled={mutation.isPending}>{mutation.isPending ? <LoaderCircle className="spin" /> : <Save />} ذخیره تنظیمات</button>
    </form>
  </div>
}
