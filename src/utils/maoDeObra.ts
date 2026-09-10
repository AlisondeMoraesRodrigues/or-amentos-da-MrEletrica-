import type { ConfiguracaoRow, ServicoRow, TipoHora } from '@/types/database'
import { valorHoraDaConfig } from '@/config/servico'

/**
 * Cálculo de mão de obra (Checkpoint 06).
 *
 *   valor da mão de obra = quantidade de técnicos × horas trabalhadas × valor da hora
 *
 * O valor da hora é:
 *   1. o valor informado no serviço, quando maior que zero (sobrescrita manual); ou
 *   2. o valor da configuração para o tipo de hora
 *      (técnica / auxiliar / emergência / noturna).
 */

export interface EntradaMaoDeObra {
  quantidadeTecnicos: number
  horasTrabalhadas: number
  tipoHora: TipoHora
  /** Sobrescrita manual do valor/hora. Ignorado quando <= 0. */
  valorHoraInformado?: number | null
}

export interface ResultadoMaoDeObra {
  quantidadeTecnicos: number
  horasTrabalhadas: number
  tipoHora: TipoHora
  /** Valor da hora efetivamente aplicado. */
  valorHora: number
  origemValorHora: 'informado' | 'configuracao'
  valorMaoDeObra: number
}

function arredondar(valor: number): number {
  return Math.round((Number.isFinite(valor) ? valor : 0) * 100) / 100
}

export function calcularMaoDeObra(
  entrada: EntradaMaoDeObra,
  config: ConfiguracaoRow,
): ResultadoMaoDeObra {
  const quantidadeTecnicos = Math.max(0, Math.round(entrada.quantidadeTecnicos || 0))
  const horasTrabalhadas = Math.max(0, entrada.horasTrabalhadas || 0)

  const informado = entrada.valorHoraInformado ?? 0
  const usaInformado = informado > 0
  const valorHora = usaInformado
    ? informado
    : valorHoraDaConfig(config, entrada.tipoHora)

  return {
    quantidadeTecnicos,
    horasTrabalhadas,
    tipoHora: entrada.tipoHora,
    valorHora: arredondar(valorHora),
    origemValorHora: usaInformado ? 'informado' : 'configuracao',
    valorMaoDeObra: arredondar(quantidadeTecnicos * horasTrabalhadas * valorHora),
  }
}

/** Recalcula a mão de obra de um serviço já salvo, a partir das configurações atuais. */
export function recalcularMaoDeObraDoServico(
  servico: Pick<
    ServicoRow,
    'quantidade_tecnicos' | 'horas_trabalhadas' | 'tipo_hora' | 'valor_hora_aplicado'
  >,
  config: ConfiguracaoRow,
): ResultadoMaoDeObra {
  return calcularMaoDeObra(
    {
      quantidadeTecnicos: servico.quantidade_tecnicos,
      horasTrabalhadas: servico.horas_trabalhadas,
      tipoHora: servico.tipo_hora,
      valorHoraInformado: servico.valor_hora_aplicado,
    },
    config,
  )
}
