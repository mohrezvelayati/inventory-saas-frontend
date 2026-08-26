import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { tokenStore } from '../../lib/api'
import type { CurrentUser } from '../../types/api'
import { getCurrentUser, login as loginRequest, logout as logoutRequest } from './authApi'
import { AuthContext } from './auth-context'
import type { AuthStatus } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() => tokenStore.get() ? 'loading' : 'anonymous')

  const logout = useCallback(async () => {
    try { await logoutRequest() } catch { /* Local logout must always complete. */ }
    finally {
      tokenStore.clear()
      setUser(null)
      setStatus('anonymous')
    }
  }, [])

  const refreshUser = useCallback(async () => {
    const currentUser = await getCurrentUser()
    setUser(currentUser)
    setStatus('authenticated')
    return currentUser
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const currentUser = await loginRequest(username, password)
    setUser(currentUser)
    setStatus('authenticated')
    return currentUser
  }, [])

  useEffect(() => {
    // Auth bootstrap intentionally synchronizes persisted tokens with server state.
    // oxlint-disable-next-line react/set-state-in-effect
    if (tokenStore.get()) refreshUser().catch(logout)
  }, [logout, refreshUser])

  useEffect(() => {
    window.addEventListener('auth:expired', logout)
    return () => window.removeEventListener('auth:expired', logout)
  }, [logout])

  const value = useMemo(
    () => ({ user, status, login, logout, refreshUser }),
    [user, status, login, logout, refreshUser],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
