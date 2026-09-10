import type { OrcamentoStatus } from '@/types/database'

type Tone = 'gray' | 'blue' | 'green' | 'red' | 'yellow'

export const ORCAMENTO_STATUS_META: Record<OrcamentoStatus, { label: string; tone: Tone }> = {
  rascunho: { label: 'Rascunho', tone: 'gray' },
  enviado: { label: 'Enviado', tone: 'blue' },
  aprovado: { label: 'Aprovado', tone: 'green' },
  reprovado: { label: 'Reprovado', tone: 'red' },
  cancelado: { label: 'Cancelado', tone: 'gray' },
}

export const ORCAMENTO_STATUS_ORDEM: OrcamentoStatus[] = [
  'rascunho',
  'enviado',
  'aprovado',
  'reprovado',
  'cancelado',
]
