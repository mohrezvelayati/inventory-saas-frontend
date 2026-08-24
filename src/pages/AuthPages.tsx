import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Eye, EyeOff, LoaderCircle, LockKeyhole, Phone, Store, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { ApiError } from '../lib/api'
import { getSafeNextPath } from '../lib/navigation'
import { createStore, register as registerRequest } from '../features/auth/authApi'
import { useAuth } from '../features/auth/useAuth'

const loginSchema = z.object({
  username: z.string().min(1, 'نام کاربری را وارد کنید'),
  password: z.string().min(1, 'رمز عبور را وارد کنید'),
})

const registerSchema = z.object({
  full_name: z.string().min(3, 'نام و نام خانوادگی را کامل وارد کنید'),
  phone_number: z.string().min(10, 'شماره تلفن معتبر وارد کنید'),
  username: z.string().min(3, 'نام کاربری باید حداقل ۳ کاراکتر باشد'),
  password: z.string().min(8, 'رمز عبور باید حداقل ۸ کاراکتر باشد'),
})

const storeSchema = z.object({ name: z.string().min(2, 'نام فروشگاه را وارد کنید') })

type LoginFields = z.infer<typeof loginSchema>
type RegisterFields = z.infer<typeof registerSchema>
type StoreFields = z.infer<typeof storeSchema>

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="auth-page" dir="rtl">
      <div className="auth-brand"><span><Store /></span><div><strong>انبارینو</strong><small>مدیریت هوشمند فروشگاه</small></div></div>
      <section className="auth-card">
        <header><h1>{title}</h1><p>{subtitle}</p></header>
        {children}
      </section>
      <small className="auth-footer">مدیریت فروش، موجودی و مشتریان در یک‌جا</small>
    </main>
  )
}

export function Field({ icon: Icon, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon: typeof UserRound; error?: string }) {
  return (
    <label className={`form-field ${error ? 'form-field--error' : ''}`}>
      <span className="field-control"><Icon /><input {...props} /></span>
      {error && <small>{error}</small>}
    </label>
  )
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [searchParams] = useSearchParams()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFields>({ resolver: zodResolver(loginSchema) })

  const submit = handleSubmit(async (fields) => {
    setServerError('')
    try {
      const user = await login(fields.username, fields.password)
      const nextPath = getSafeNextPath(searchParams.get('next'))
      navigate(nextPath ?? (user.membership ? '/' : '/onboarding/store'), { replace: true })
    } catch (error) {
      setServerError(error instanceof ApiError && error.status === 401 ? 'نام کاربری یا رمز عبور صحیح نیست.' : (error as Error).message)
    }
  })

  return (
    <AuthLayout title="خوش آمدید" subtitle="برای ورود به پنل اطلاعات حساب خود را وارد کنید.">
      <form className="auth-form" onSubmit={submit}>
        <Field icon={UserRound} placeholder="نام کاربری" autoComplete="username" error={errors.username?.message} {...register('username')} />
        <div className="password-wrap">
          <Field icon={LockKeyhole} type={showPassword ? 'text' : 'password'} placeholder="رمز عبور" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
          <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="نمایش رمز عبور">{showPassword ? <EyeOff /> : <Eye />}</button>
        </div>
        {serverError && <p className="form-alert">{serverError}</p>}
        <button className="auth-submit" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle className="spin" /> : <>ورود به پنل <ArrowLeft /></>}</button>
      </form>
      <p className="auth-switch">حساب کاربری ندارید؟ <Link to="/register">ثبت‌نام کنید</Link></p>
    </AuthLayout>
  )
}

export function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFields>({ resolver: zodResolver(registerSchema) })

  const submit = handleSubmit(async (fields) => {
    setServerError('')
    try {
      await registerRequest(fields)
      await login(fields.username, fields.password)
      navigate('/onboarding/store', { replace: true })
    } catch (error) { setServerError((error as Error).message) }
  })

  return (
    <AuthLayout title="ساخت حساب کاربری" subtitle="در چند قدم کوتاه فروشگاه خود را راه‌اندازی کنید.">
      <form className="auth-form" onSubmit={submit}>
        <Field icon={UserRound} placeholder="نام و نام خانوادگی" autoComplete="name" error={errors.full_name?.message} {...register('full_name')} />
        <Field icon={Phone} placeholder="شماره تلفن" inputMode="tel" autoComplete="tel" error={errors.phone_number?.message} {...register('phone_number')} />
        <Field icon={UserRound} placeholder="نام کاربری" autoComplete="username" error={errors.username?.message} {...register('username')} />
        <Field icon={LockKeyhole} type="password" placeholder="رمز عبور (حداقل ۸ کاراکتر)" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
        {serverError && <p className="form-alert">{serverError}</p>}
        <button className="auth-submit" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle className="spin" /> : <>ساخت حساب <ArrowLeft /></>}</button>
      </form>
      <p className="auth-switch">قبلاً ثبت‌نام کرده‌اید؟ <Link to="/login">وارد شوید</Link></p>
    </AuthLayout>
  )
}

export function StoreSetupPage() {
  const { refreshUser, logout } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<StoreFields>({ resolver: zodResolver(storeSchema) })

  const submit = handleSubmit(async ({ name }) => {
    setServerError('')
    try {
      await createStore(name)
      await refreshUser()
      navigate('/', { replace: true })
    } catch (error) { setServerError((error as Error).message) }
  })

  return (
    <AuthLayout title="فروشگاهت را بساز" subtitle="این نام در بالای پنل و گزارش‌ها نمایش داده می‌شود.">
      <div className="onboarding-icon"><Store /></div>
      <form className="auth-form" onSubmit={submit}>
        <Field icon={Store} placeholder="مثلاً کتونی لند" autoFocus error={errors.name?.message} {...register('name')} />
        {serverError && <p className="form-alert">{serverError}</p>}
        <button className="auth-submit" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle className="spin" /> : <>ساخت فروشگاه و ورود <ArrowLeft /></>}</button>
      </form>
      <button className="text-button" onClick={logout}>خروج از این حساب</button>
    </AuthLayout>
  )
}
