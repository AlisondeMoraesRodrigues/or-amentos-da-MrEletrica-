import type { MaterialUnidade } from '@/types/database'

export const UNIDADE_LABEL: Record<MaterialUnidade, string> = {
  un: 'Unidade',
  m: 'Metro',
  m2: 'Metro²',
  kg: 'Quilo',
  cx: 'Caixa',
  rl: 'Rolo',
  pc: 'Peça',
  l: 'Litro',
  h: 'Hora',
}

export const UNIDADE_ORDEM: MaterialUnidade[] = ['un', 'm', 'm2', 'kg', 'cx', 'rl', 'pc', 'l', 'h']

/** Margem padrão sobre materiais (fallback quando não há configuração). */
export const MARGEM_PADRAO = 20

/** Opções rápidas de margem. */
export const MARGENS_PRESET = [0, 10, 20, 30, 40] as const
