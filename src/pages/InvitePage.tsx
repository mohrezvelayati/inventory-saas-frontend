import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle2, LoaderCircle, LockKeyhole, LogIn, Phone, ShieldCheck, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { acceptInvitation, previewInvitation, registerWithInvitation } from '../features/stores/invitationsApi'
import { useAuth } from '../features/auth/useAuth'
import { ApiError } from '../lib/api'
import { AuthLayout, Field } from './AuthPages'

const invitationRegistrationSchema = z.object({
  full_name: z.string().min(3, 'نام و نام خانوادگی را کامل وارد کنید'),
  username: z.string().min(3, 'نام کاربری باید حداقل ۳ کاراکتر باشد'),
  password: z.string().min(8, 'رمز عبور باید حداقل ۸ کاراکتر باشد'),
})

type InvitationRegistrationFields = z.infer<typeof invitationRegistrationSchema>

const invitationMessages: Record<string, string> = {
  invalid: 'این لینک دعوت معتبر نیست.',
  expired: 'اعتبار این لینک دعوت به پایان رسیده است.',
  revoked: 'این دعوت توسط مدیر فروشگاه لغو شده است.',
  used: 'این لینک دعوت قبلاً استفاده شده است.',
  phone_mismatch: 'شماره تلفن حساب شما با شماره ثبت‌شده در دعوت یکسان نیست.',
  already_member: 'این حساب در حال حاضر عضو یک فروشگاه است.',
  account_exists: 'برای این شماره قبلاً حساب ساخته شده است؛ لطفاً وارد حساب خود شوید.',
}

function invitationErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const code = error.data && 'code' in error.data && typeof error.data.code === 'string' ? error.data.code : undefined
    if (code && invitationMessages[code]) return invitationMessages[code]
  }
  return error instanceof Error ? error.message : 'عملیات دعوت انجام نشد.'
}

export function InvitePage() {
  const { token = '' } = useParams()
  const { user, status, refreshUser } = useAuth()
  const navigate = useNavigate()
  const acceptanceStarted = useRef(false)
  const [serverError, setServerError] = useState('')
  const preview = useQuery({
    queryKey: ['invitation-preview', token],
    queryFn: () => previewInvitation(token),
    enabled: Boolean(token),
    retry: false,
  })
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<InvitationRegistrationFields>({
    resolver: zodResolver(invitationRegistrationSchema),
  })

  useEffect(() => {
    if (status !== 'authenticated' || !preview.data || acceptanceStarted.current) return
    acceptanceStarted.current = true
    if (user?.membership) return
    acceptInvitation(token)
      .then(refreshUser)
      .then(() => navigate('/', { replace: true }))
      .catch((error) => setServerError(invitationErrorMessage(error)))
  }, [navigate, preview.data, refreshUser, status, token, user?.membership])

  const submit = handleSubmit(async (fields) => {
    setServerError('')
    try {
      await registerWithInvitation(token, fields)
      await refreshUser()
      navigate('/', { replace: true })
    } catch (error) {
      setServerError(invitationErrorMessage(error))
    }
  })

  if (preview.isPending || status === 'loading') {
    return <div className="auth-loading"><LoaderCircle className="spin" /><span>در حال بررسی دعوت...</span></div>
  }

  if (preview.isError) {
    return <AuthLayout title="دعوت در دسترس نیست" subtitle={invitationErrorMessage(preview.error)}><div className="invite-unavailable"><ShieldCheck /><p>از مدیر فروشگاه بخواهید یک لینک دعوت جدید برای شما بسازد.</p><Link to="/login">بازگشت به ورود</Link></div></AuthLayout>
  }

  const roleLabel = preview.data?.role === 'admin' ? 'ادمین' : 'فروشنده'
  const invitePath = `/invite/${token}`

  const acceptanceError = user?.membership ? invitationMessages.already_member : serverError

  return <AuthLayout title={`دعوت به ${preview.data?.store_name}`} subtitle={`شما با نقش ${roleLabel} به این فروشگاه دعوت شده‌اید.`}>
    <section className="invite-summary">
      <ShieldCheck />
      <div><strong>{roleLabel}</strong><small>شماره دعوت: {preview.data?.masked_phone_number}</small><small>معتبر تا {new Date(preview.data!.expires_at).toLocaleDateString('fa-IR')}</small></div>
    </section>
    {status === 'authenticated' ? <div className="invite-accepting">{acceptanceError ? <p className="form-alert">{acceptanceError}</p> : <><LoaderCircle className="spin" /><span>در حال افزودن شما به فروشگاه...</span></>}</div> : <>
      <form className="auth-form" onSubmit={submit}>
        <Field icon={Phone} value={preview.data?.masked_phone_number ?? ''} readOnly aria-label="شماره تلفن دعوت" />
        <Field icon={UserRound} placeholder="نام و نام خانوادگی" autoComplete="name" error={errors.full_name?.message} {...register('full_name')} />
        <Field icon={UserRound} placeholder="نام کاربری" autoComplete="username" error={errors.username?.message} {...register('username')} />
        <Field icon={LockKeyhole} type="password" placeholder="رمز عبور (حداقل ۸ کاراکتر)" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
        {serverError && <p className="form-alert">{serverError}</p>}
        <button className="auth-submit" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle className="spin" /> : <><CheckCircle2 /> ساخت حساب و پذیرش دعوت <ArrowLeft /></>}</button>
      </form>
      <p className="auth-switch invite-login"><LogIn /> قبلاً حساب دارید؟ <Link to={`/login?next=${encodeURIComponent(invitePath)}`}>وارد شوید</Link></p>
    </>}
  </AuthLayout>
}
