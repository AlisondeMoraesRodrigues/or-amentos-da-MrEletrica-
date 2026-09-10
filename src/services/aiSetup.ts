import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { criarProvedorEdge, setAIProvider, type ContextoDescricao } from './aiService'

/**
 * Registra o provedor de IA "de verdade" quando o Supabase está configurado.
 *
 * O provedor `edge` chama a Edge Function `gerar-descricao`. Se ela ainda não
 * foi publicada (ou não tem a chave da IA), o próprio provedor cai no modo
 * "regras" — então é seguro registrar sempre.
 *
 * Importado uma vez em `src/main.tsx`.
 */
if (isSupabaseConfigured) {
  setAIProvider(
    criarProvedorEdge((ctx: ContextoDescricao) =>
      supabase.functions.invoke('gerar-descricao', { body: ctx }),
    ),
  )
}
