import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { authService, type AuthUser, type SignUpResult } from '@/services/authService'

export interface AuthContextValue {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  isDemo: boolean
  signIn: (email: string, password: string, remember: boolean) => Promise<void>
  signUp: (nome: string, email: string, password: string) => Promise<SignUpResult>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    authService
      .getInitial()
      .then(({ user, session }) => {
        if (!active) return
        setUser(user)
        setSession(session)
        setLoading(false)
      })
      .catch(() => {
        if (active) setLoading(false)
      })

    const unsubscribe = authService.onChange((nextUser, nextSession) => {
      if (!active) return
      setUser(nextUser)
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const signIn = useCallback(
    async (email: string, password: string, remember: boolean) => {
      const nextUser = await authService.signIn(email, password, remember)
      setUser(nextUser)
    },
    [],
  )

  const signOut = useCallback(async () => {
    await authService.signOut()
    setUser(null)
    setSession(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      isDemo: authService.isDemo,
      signIn,
      signUp: authService.signUp,
      signOut,
      resetPassword: authService.resetPassword,
      updatePassword: authService.updatePassword,
    }),
    [user, session, loading, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
