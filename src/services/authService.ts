import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, setRememberPreference, supabase } from '@/lib/supabase'
import { AuthError, translateAuthError } from '@/utils/authErrors'
import { clearDemoData } from './demoStore'

export interface AuthUser {
  id: string
  email: string | null
  nome: string | null
}

export interface SignUpResult {
  needsEmailConfirmation: boolean
}

/** Credenciais do MODO DEMONSTRAÇÃO (apenas quando o Supabase não está configurado). */
export const DEMO_EMAIL = 'demo@mreletrica.com.br'
export const DEMO_PASSWORD = '123456'

const DEMO_STORAGE_KEY = 'mr-demo-session'
const DEMO_USER: AuthUser = {
  id: 'demo-user',
  email: DEMO_EMAIL,
  nome: 'Usuário Demonstração',
}

export const isDemoMode = !isSupabaseConfigured

// --- helpers -----------------------------------------------------------------

function mapUser(user: User | null): AuthUser | null {
  if (!user) return null
  const meta = user.user_metadata ?? {}
  const nome =
    (typeof meta.nome === 'string' && meta.nome) ||
    (typeof meta.full_name === 'string' && meta.full_name) ||
    null
  return { id: user.id, email: user.email ?? null, nome }
}

function readDemoUser(): AuthUser | null {
  try {
    return window.localStorage.getItem(DEMO_STORAGE_KEY) ? DEMO_USER : null
  } catch {
    return null
  }
}

function writeDemoUser(): void {
  try {
    window.localStorage.setItem(DEMO_STORAGE_KEY, '1')
  } catch {
    /* ignora */
  }
}

function clearDemoUser(): void {
  try {
    window.localStorage.removeItem(DEMO_STORAGE_KEY)
  } catch {
    /* ignora */
  }
}

// --- API pública -----------------------------------------------------------

export const authService = {
  isDemo: isDemoMode,

  /** Estado inicial ao carregar o app. */
  async getInitial(): Promise<{ user: AuthUser | null; session: Session | null }> {
    if (isDemoMode) {
      return { user: readDemoUser(), session: null }
    }
    const { data } = await supabase.auth.getSession()
    return { user: mapUser(data.session?.user ?? null), session: data.session }
  },

  /** Ouve mudanças de sessão. Retorna função para cancelar a inscrição. */
  onChange(callback: (user: AuthUser | null, session: Session | null) => void): () => void {
    if (isDemoMode) {
      const handler = (e: StorageEvent) => {
        if (e.key === DEMO_STORAGE_KEY) callback(readDemoUser(), null)
      }
      window.addEventListener('storage', handler)
      return () => window.removeEventListener('storage', handler)
    }
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(mapUser(session?.user ?? null), session)
    })
    return () => data.subscription.unsubscribe()
  },

  async signIn(email: string, password: string, remember: boolean): Promise<AuthUser> {
    if (isDemoMode) {
      const ok =
        email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD
      if (!ok) {
        throw new AuthError(
          'E-mail ou senha incorretos. No modo demonstração use ' +
            `${DEMO_EMAIL} / ${DEMO_PASSWORD}.`,
        )
      }
      writeDemoUser()
      return DEMO_USER
    }

    setRememberPreference(remember)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return mapUser(data.user) as AuthUser
    } catch (err) {
      throw translateAuthError(err)
    }
  },

  async signUp(nome: string, email: string, password: string): Promise<SignUpResult> {
    if (isDemoMode) {
      throw new AuthError(
        'Criação de conta indisponível no modo demonstração. Configure o Supabase para cadastrar usuários.',
      )
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nome, full_name: nome },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      })
      if (error) throw error
      return { needsEmailConfirmation: !data.session }
    } catch (err) {
      throw translateAuthError(err)
    }
  },

  async signOut(): Promise<void> {
    if (isDemoMode) {
      clearDemoUser()
      clearDemoData()
      return
    }
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (err) {
      throw translateAuthError(err)
    }
  },

  /** Envia e-mail de recuperação. Nunca revela se o e-mail existe. */
  async resetPassword(email: string): Promise<void> {
    if (isDemoMode) return
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
    } catch (err) {
      throw translateAuthError(err)
    }
  },

  async updatePassword(newPassword: string): Promise<void> {
    if (isDemoMode) {
      throw new AuthError('Redefinição de senha indisponível no modo demonstração.')
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
    } catch (err) {
      throw translateAuthError(err)
    }
  },
}
