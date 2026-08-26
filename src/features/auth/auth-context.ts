import { createContext } from 'react'
import type { CurrentUser } from '../../types/api'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export type AuthContextValue = {
  user: CurrentUser | null
  status: AuthStatus
  login: (username: string, password: string) => Promise<CurrentUser>
  logout: () => Promise<void>
  refreshUser: () => Promise<CurrentUser>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
