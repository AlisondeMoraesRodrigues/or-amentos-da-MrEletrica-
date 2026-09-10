import { isSupabaseConfigured } from '@/lib/supabase'

/** Aviso exibido enquanto o Supabase não está configurado (modo demonstração). */
export function DemoBanner() {
  if (isSupabaseConfigured) return null
  return (
    <div className="mb-4 rounded-xl border border-energy-400/50 bg-energy-400/10 px-3 py-2 text-xs text-ink-800">
      <strong>Modo demonstração.</strong> Configure o Supabase no arquivo{' '}
      <code className="rounded bg-white px-1">.env</code> para habilitar login e dados reais.
    </div>
  )
}
