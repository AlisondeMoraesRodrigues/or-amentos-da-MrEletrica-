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
      partes.push(`Mão de obra: ${tec}, ${formatNumber(ctx.horasTrabalhadas)} h de trabalho.`)
    }

    return partes.join('\n\n')
  },
}

let provider: AIProvider = provedorRegras

export function setAIProvider(p: AIProvider): void {
  provider = p
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
