import { formatNumber } from '@/utils/format'

/**
 * Camada modular de IA — descrição profissional do serviço (Checkpoint 12).
 *
 * Objetivo (regra 10): NÃO prender o sistema a um fornecedor e NÃO exigir
 * serviço pago por padrão.
 *
 * - Provedor padrão `regras`: monta a descrição localmente, a partir das
 *   anotações do técnico + contexto do serviço (materiais, horas, técnicos).
 * - Para usar IA de verdade (Anthropic, OpenAI, …) crie um provedor e registre:
 *
 *     import { setAIProvider } from '@/services/aiService'
 *     setAIProvider({
 *       nome: 'anthropic',
 *       async gerarDescricaoServico(ctx) {
 *         // chamar uma Edge Function que fala com a API (a chave NUNCA no front)
 *       },
 *     })
 */

export interface MaterialContexto {
  nome: string
  quantidade: number
  unidade: string
}

export interface ContextoDescricao {
  /** O que o técnico escreveu com as próprias palavras. */
  textoLivre: string
  materiais?: MaterialContexto[]
  quantidadeTecnicos?: number
  horasTrabalhadas?: number
  quantidadeAjudantes?: number
  horasAjudantes?: number
  clienteNome?: string | null
}

export interface AIProvider {
  readonly nome: string
  gerarDescricaoServico(ctx: ContextoDescricao): Promise<string>
}

// --- Provedor padrão: montagem por regras (sem API) -----------------------

function formatarParagrafo(texto: string): string {
  let t = texto.trim().replace(/\s+/g, ' ')
  if (!t) return ''
  // primeira letra maiúscula
  t = t.charAt(0).toUpperCase() + t.slice(1)
  // primeira letra de cada frase após ". "
  t = t.replace(/([.!?]\s+)([a-zà-ú])/g, (_, sep: string, letra: string) => sep + letra.toUpperCase())
  if (!/[.!?]$/.test(t)) t += '.'
  return t
}

function listarMateriais(materiais: MaterialContexto[]): string {
  return materiais
    .map((m) => `${formatNumber(m.quantidade, 3)} ${m.unidade} de ${m.nome}`)
    .join('; ')
}

const provedorRegras: AIProvider = {
  nome: 'regras',
  async gerarDescricaoServico(ctx: ContextoDescricao): Promise<string> {
    const partes: string[] = []

    const paragrafo = formatarParagrafo(ctx.textoLivre)
    if (paragrafo) partes.push(paragrafo)

    if (ctx.materiais && ctx.materiais.length > 0) {
      partes.push(`Materiais aplicados: ${listarMateriais(ctx.materiais)}.`)
    }

    if (ctx.quantidadeTecnicos && ctx.horasTrabalhadas) {
      const tec = ctx.quantidadeTecnicos === 1 ? '1 técnico' : `${ctx.quantidadeTecnicos} técnicos`
      const partesEquipe = [`${tec}, ${formatNumber(ctx.horasTrabalhadas)} h de trabalho`]
      if (ctx.quantidadeAjudantes && ctx.horasAjudantes) {
        const aju =
          ctx.quantidadeAjudantes === 1 ? '1 ajudante' : `${ctx.quantidadeAjudantes} ajudantes`
        partesEquipe.push(`${aju}, ${formatNumber(ctx.horasAjudantes)} h`)
      }
      partes.push(`Mão de obra: ${partesEquipe.join('; ')}.`)
    }

    return partes.join('\n\n')
  },
}

let provider: AIProvider = provedorRegras

export function setAIProvider(p: AIProvider): void {
  provider = p
}

// --- Provedor "edge": chama a Edge Function `gerar-descricao` ---------------
//
// A Edge Function fala com uma IA de verdade (ex.: Google Gemini, faixa
// gratuita) — a chave da API fica só no servidor (secret do Supabase), nunca
// no front. Se a função não estiver publicada ou falhar, cai no provedor
// `regras` automaticamente, sem quebrar a tela.
//
// Publicar: veja supabase/functions/gerar-descricao/README.md

export function criarProvedorEdge(
  invoke: (ctx: ContextoDescricao) => Promise<{ data: unknown; error: unknown }>,
): AIProvider {
  return {
    nome: 'edge',
    async gerarDescricaoServico(ctx: ContextoDescricao): Promise<string> {
      try {
        const { data, error } = await invoke(ctx)
        if (error) throw error
        const texto = (data as { descricao?: string } | null)?.descricao
        if (texto && texto.trim()) return texto.trim()
      } catch {
        /* silencioso — usa o fallback abaixo */
      }
      return provedorRegras.gerarDescricaoServico(ctx)
    },
  }
}

export const AIService = {
  get provider(): string {
    return provider.nome
  },
  /** true quando um provedor de IA real está configurado. */
  usaIA(): boolean {
    return provider.nome !== 'regras'
  },
  gerarDescricaoServico(ctx: ContextoDescricao): Promise<string> {
    return provider.gerarDescricaoServico(ctx)
  },
}
