import type { ConfiguracaoRow, FormaCobranca, ServicoStatus, TipoHora } from '@/types/database'

type Tone = 'gray' | 'blue' | 'green' | 'red' | 'yellow'

export const SERVICO_STATUS_META: Record<ServicoStatus, { label: string; tone: Tone }> = {
  aberto: { label: 'Aberto', tone: 'gray' },
  em_andamento: { label: 'Em andamento', tone: 'blue' },
  concluido: { label: 'Concluído', tone: 'green' },
  cancelado: { label: 'Cancelado', tone: 'red' },
}

export const SERVICO_STATUS_ORDEM: ServicoStatus[] = [
  'aberto',
  'em_andamento',
  'concluido',
  'cancelado',
]

export const TIPO_HORA_META: Record<
  TipoHora,
  { label: string; campoConfig: keyof ConfiguracaoRow }
> = {
  tecnica: { label: 'Técnica', campoConfig: 'valor_hora_tecnica' },
  auxiliar: { label: 'Auxiliar', campoConfig: 'valor_hora_auxiliar' },
  emergencia: { label: 'Emergência', campoConfig: 'valor_hora_emergencia' },
  noturna: { label: 'Noturna', campoConfig: 'valor_hora_noturna' },
}

export const TIPO_HORA_ORDEM: TipoHora[] = ['tecnica', 'auxiliar', 'emergencia', 'noturna']

/** Formas de cobrança da mão de obra (CP25). `unidade` rotula o campo de quantidade. */
export const FORMA_COBRANCA_META: Record<
  FormaCobranca,
  { label: string; unidade: string; unidadeCurta: string }
> = {
  hora: { label: 'Por hora', unidade: 'Horas', unidadeCurta: 'h' },
  diaria: { label: 'Por diária', unidade: 'Diárias', unidadeCurta: 'diária(s)' },
  fechado: { label: 'Valor fechado', unidade: '', unidadeCurta: '' },
}

export const FORMA_COBRANCA_ORDEM: FormaCobranca[] = ['hora', 'diaria', 'fechado']

/** Valor/hora da configuração para o tipo de hora informado. */
export function valorHoraDaConfig(config: ConfiguracaoRow, tipo: TipoHora): number {
  const valor = config[TIPO_HORA_META[tipo].campoConfig]
  return typeof valor === 'number' ? valor : 0
}
