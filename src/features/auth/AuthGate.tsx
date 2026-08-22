import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from './useAuth'
import type { PermissionCode } from '../../types/api'

export function AuthGate({ children, requireStore = true }: { children: ReactNode; requireStore?: boolean }) {
  const { user, status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <div className="auth-loading"><LoaderCircle className="spin" /><span>در حال بارگذاری...</span></div>
  }
  if (status === 'anonymous') return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (requireStore && !user?.membership) return <Navigate to="/onboarding/store" replace />
  if (!requireStore && user?.membership) return <Navigate to="/" replace />
  return children
}

export function GuestGate({ children }: { children: ReactNode }) {
  const { user, status } = useAuth()
  if (status === 'loading') return <div className="auth-loading"><LoaderCircle className="spin" /></div>
  if (user) return <Navigate to={user.membership ? '/' : '/onboarding/store'} replace />
  return children
}

export function PermissionGate({ children, anyOf }: { children: ReactNode; anyOf: PermissionCode[] }) {
  const { user } = useAuth()
  const allowed = anyOf.some((permission) => user?.membership?.permissions.includes(permission))
  if (!allowed) return <div className="forbidden-state"><span>۴۰۳</span><strong>به این بخش دسترسی ندارید</strong><p>مدیر فروشگاه می‌تواند دسترسی لازم را برای حساب شما فعال کند.</p></div>
  return children
}
