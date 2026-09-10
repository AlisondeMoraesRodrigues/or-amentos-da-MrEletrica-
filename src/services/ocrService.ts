import type { MaterialUnidade } from '@/types/database'
import { UNIDADE_ORDEM } from '@/config/material'

/**
 * Camada modular de OCR / leitura de notas fiscais e cupons (Checkpoint 10).
 *
 * Objetivo: NÃO prender o sistema a um único fornecedor.
 *
 * - `interpretarTextoNota(texto)` — interpretação do texto (independente de fornecedor).
 * - `OCRService` — quando um provedor sabe converter imagem → texto, ele é usado;
 *   caso contrário o usuário informa o texto manualmente.
 *
 * Para habilitar OCR de imagem no futuro (ex.: Tesseract.js no navegador ou uma
 * Edge Function chamando Google Vision / OCR.space), basta:
 *
 *   import { setOCRProvider } from '@/services/ocrService'
 *   setOCRProvider({
 *     nome: 'meu-provedor',
 *     async extrairTexto(arquivo) { ... devolve o texto ... },
 *   })
 */

export interface ItemNotaExtraido {
  nome: string
  quantidade: number
  unidade: MaterialUnidade
  valorUnitario: number
  valorTotal: number
}

export interface ResultadoLeituraNota {
  itens: ItemNotaExtraido[]
  textoBruto: string
  totalNota?: number
}

export interface OCRProvider {
  readonly nome: string
  /** Converte a imagem/arquivo em texto. Ausente = o usuário informa o texto. */
  extrairTexto?(arquivo: Blob): Promise<string>
}

/** Provedor padrão: sem OCR de imagem (o usuário digita/cola o texto da nota). */
const provedorManual: OCRProvider = { nome: 'manual' }

let provider: OCRProvider = provedorManual

export function setOCRProvider(p: OCRProvider): void {
  provider = p
}

// ---------------------------------------------------------------------------
// Interpretação do texto da nota
// ---------------------------------------------------------------------------

const RE_MOEDA = /-?\d{1,3}(?:\.\d{3})*,\d{2}|-?\d+,\d{2}|-?\d+\.\d{2}/g
const UNIDADES_ALT = [...UNIDADE_ORDEM, 'und', 'unid', 'pc', 'peca', 'peça', 'metros', 'metro']
  .sort((a, b) => b.length - a.length)
  .join('|')
const RE_QTD_UNID = new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(${UNIDADES_ALT})\\b`, 'i')
const LINHAS_IGNORAR =
  /\b(total|subtotal|troco|dinheiro|cart[aã]o|pix|desconto|acr[eé]scimo|cnpj|cpf|cupom|fiscal|sat|nfc-?e|data|hora|valor\s+pago|forma\s+de\s+pagamento|itens?)\b/i

function paraNumero(txt: string): number {
  const limpo = txt.trim().replace(/\./g, '').replace(',', '.')
  const n = Number.parseFloat(limpo)
  return Number.isFinite(n) ? n : 0
}

function normalizarUnidade(txt: string): MaterialUnidade {
  const u = txt.toLowerCase()
  if (u.startsWith('un') || u === 'und' || u === 'unid') return 'un'
  if (u.startsWith('p')) return 'pc'
  if (u === 'm2') return 'm2'
  if (u.startsWith('metro') || u === 'm') return 'm'
  if (u === 'kg') return 'kg'
  if (u === 'cx') return 'cx'
  if (u === 'rl') return 'rl'
  if (u === 'l') return 'l'
  if (u === 'h') return 'h'
  return (UNIDADE_ORDEM as readonly string[]).includes(u) ? (u as MaterialUnidade) : 'un'
}

/**
 * Extrai itens de um texto livre de nota/cupom. É best-effort: a tela de
 * confirmação sempre permite editar, adicionar e remover itens.
 */
export function interpretarTextoNota(texto: string): ResultadoLeituraNota {
  const linhas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const itens: ItemNotaExtraido[] = []
  let totalNota: number | undefined

  for (const linha of linhas) {
    const moedas = linha.match(RE_MOEDA)?.map(paraNumero) ?? []

    if (/\b(valor\s+total|total\s+(da\s+)?nota|total\s+r\$)\b/i.test(linha) && moedas.length) {
      totalNota = moedas[moedas.length - 1]
      continue
    }
    if (LINHAS_IGNORAR.test(linha) && itens.length === 0) continue
    if (moedas.length === 0) continue

    const mQtd = linha.match(RE_QTD_UNID)
    const quantidade = mQtd ? paraNumero(mQtd[1]) : 1
    const unidade = mQtd ? normalizarUnidade(mQtd[2]) : 'un'

    const valorTotal = moedas[moedas.length - 1]
    let valorUnitario = moedas.length >= 2 ? moedas[moedas.length - 2] : 0
    if (!valorUnitario && quantidade > 0) valorUnitario = Math.round((valorTotal / quantidade) * 100) / 100

    // nome = texto antes da quantidade (ou antes do primeiro número)
    let nome = linha
    if (mQtd) nome = linha.slice(0, linha.indexOf(mQtd[0]))
    else nome = linha.replace(RE_MOEDA, '')
    nome = nome.replace(/[\s.\-x*|R$]+$/i, '').replace(/^\d+\s+/, '').trim()

    if (!nome || valorTotal <= 0) continue
    itens.push({ nome, quantidade: quantidade || 1, unidade, valorUnitario, valorTotal })
  }

  return { itens, textoBruto: texto, totalNota }
}

export const OCRService = {
  get provider(): string {
    return provider.nome
  },
  /** true quando o provedor atual sabe converter imagem em texto. */
  podeLerImagem(): boolean {
    return typeof provider.extrairTexto === 'function'
  },
  async lerImagem(arquivo: Blob): Promise<string> {
    if (!provider.extrairTexto) {
      throw new Error('Nenhum provedor de OCR configurado. Informe o texto da nota manualmente.')
    }
    return provider.extrairTexto(arquivo)
  },
  interpretar(texto: string): ResultadoLeituraNota {
    return interpretarTextoNota(texto)
  },
}
