import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Projeto Supabase de produção. A chave "anon" é PÚBLICA por design (fica visível
// no bundle do site de qualquer forma; a segurança vem das políticas RLS do banco).
// Por isso pode ficar no código. NUNCA coloque aqui a chave "service_role".
// As variáveis de ambiente, quando definidas, têm prioridade sobre estes valores.
const FALLBACK_SUPABASE_URL = 'https://fuwsmbzrhxyolhvznglp.supabase.co'
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1d3NtYnpyaHh5b2xodnpuZ2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NzkzNTQsImV4cCI6MjEwNDQ1NTM1NH0.DbQXcgvzCNEJwTBgvyAfAtdesozT9Fqg6j7tZTO9LDU'

const url = import.meta.env.VITE_SUPABASE_URL?.trim() || FALLBACK_SUPABASE_URL
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || FALLBACK_SUPABASE_ANON_KEY

/**
 * Indica se as variáveis de ambiente do Supabase estão configuradas.
 * Enquanto false, o app funciona em "modo demonstração" com dados fictícios.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  // Aviso apenas em desenvolvimento - não quebra a aplicação.
  console.warn(
    '[MR ORÇAMENTOS] Supabase não configurado. Defina VITE_SUPABASE_URL e ' +
      'VITE_SUPABASE_ANON_KEY no arquivo .env para habilitar autenticação e banco de dados.',
  )
}

// ---------------------------------------------------------------------------
// "Manter conectado": quando marcado, a sessão fica em localStorage (persiste
// após fechar o navegador). Quando desmarcado, vai para sessionStorage (some ao
// fechar o navegador). A preferência é gravada ANTES do signIn.
// ---------------------------------------------------------------------------
const REMEMBER_KEY = 'mr-auth-remember'

export function setRememberPreference(remember: boolean): void {
  try {
    window.localStorage.setItem(REMEMBER_KEY, remember ? 'local' : 'session')
  } catch {
    /* storage indisponível - ignora */
  }
}

function activeStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(REMEMBER_KEY) === 'session'
      ? window.sessionStorage
      : window.localStorage
  } catch {
    return null
  }
}

const switchingStorage = {
  getItem: (key: string): string | null => {
    try {
      return activeStorage()?.getItem(key) ?? null
    } catch {
      return null
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      activeStorage()?.setItem(key, value)
    } catch {
      /* ignora */
    }
  },
  removeItem: (key: string): void => {
    try {
      window.localStorage.removeItem(key)
      window.sessionStorage.removeItem(key)
    } catch {
      /* ignora */
    }
  },
}

/**
 * Cliente Supabase compartilhado.
 * Usa valores placeholder quando não configurado para evitar erro de import;
 * chamadas reais só devem ocorrer quando isSupabaseConfigured === true.
 */
export const supabase: SupabaseClient = createClient(
  url ?? 'https://placeholder.supabase.co',
  anonKey ?? 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: switchingStorage,
    },
  },
)
