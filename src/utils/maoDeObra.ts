import type { ConfiguracaoRow, ServicoRow, TipoHora } from '@/types/database'
import { valorHoraDaConfig } from '@/config/servico'

/**
 * Cálculo de mão de obra (Checkpoint 06 / ampliado no Checkpoint 24).
 *
 * A equipe pode ter TÉCNICOS e AJUDANTES, cada grupo com suas horas e seu
 * valor de hora:
 *
 *   valor da mão de obra =
 *       (nº de técnicos  × horas dos técnicos  × valor/hora do técnico)
 *     + (nº de ajudantes × horas dos ajudantes × valor/hora do ajudante)
 *
 * Valor da hora do TÉCNICO:
 *   1. valor informado no serviço, quando > 0 (sobrescrita manual); ou
 *   2. valor da configuração para o tipo de hora
 *      (técnica / auxiliar / emergência / noturna).
 *
 * Valor da hora do AJUDANTE:
 *   1. valor informado no serviço, quando > 0; ou
 *   2. configuracoes.valor_hora_auxiliar.
 */

export type OrigemValorHora = 'informado' | 'configuracao'

export interface EntradaGrupo {
  quantidade: number
  horas: number
  /** Sobrescrita manual do valor/hora. Ignorado quando <= 0. */
  valorHoraInformado?: number | null
}

export interface EntradaMaoDeObra {
  /** Grupo dos técnicos. `tipoHora` define a hora usada da configuração. */
  tecnicos: EntradaGrupo & { tipoHora: TipoHora }
  /** Grupo dos ajudantes. Usa `configuracoes.valor_hora_auxiliar` por padrão. */
  ajudantes?: EntradaGrupo
}

export interface ResultadoGrupo {
  quantidade: number
  horas: number
  valorHora: number
  origemValorHora: OrigemValorHora
  subtotal: number
}

export interface ResultadoMaoDeObra {
  tecnicos: ResultadoGrupo
  ajudantes: ResultadoGrupo
  valorMaoDeObra: number

  // --- compatibilidade com o código anterior (grupo dos técnicos) ---------
  quantidadeTecnicos: number
  horasTrabalhadas: number
  tipoHora: TipoHora
  valorHora: number
  origemValorHora: OrigemValorHora
}

function arredondar(valor: number): number {
  return Math.round((Number.isFinite(valor) ? valor : 0) * 100) / 100
}

function calcularGrupo(
  entrada: EntradaGrupo,
  valorHoraConfig: number,
  arredondarQuantidade: boolean,
): ResultadoGrupo {
  const quantidadeBruta = Math.max(0, entrada.quantidade || 0)
  const quantidade = arredondarQuantidade ? Math.round(quantidadeBruta) : quantidadeBruta
  const horas = Math.max(0, entrada.horas || 0)

  const informado = entrada.valorHoraInformado ?? 0
  const usaInformado = informado > 0
  const valorHora = usaInformado ? informado : valorHoraConfig

  return {
    quantidade,
    horas,
    valorHora: arredondar(valorHora),
    origemValorHora: usaInformado ? 'informado' : 'configuracao',
    subtotal: arredondar(quantidade * horas * valorHora),
  }
}

export function calcularMaoDeObra(
  entrada: EntradaMaoDeObra,
  config: ConfiguracaoRow,
): ResultadoMaoDeObra {
  const tecnicos = calcularGrupo(
    entrada.tecnicos,
    valorHoraDaConfig(config, entrada.tecnicos.tipoHora),
    true,
  )
  const ajudantes = calcularGrupo(
    entrada.ajudantes ?? { quantidade: 0, horas: 0 },
    typeof config.valor_hora_auxiliar === 'number' ? config.valor_hora_auxiliar : 0,
    true,
  )

  return {
    tecnicos,
    ajudantes,
    valorMaoDeObra: arredondar(tecnicos.subtotal + ajudantes.subtotal),

    quantidadeTecnicos: tecnicos.quantidade,
    horasTrabalhadas: tecnicos.horas,
    tipoHora: entrada.tecnicos.tipoHora,
    valorHora: tecnicos.valorHora,
    origemValorHora: tecnicos.origemValorHora,
  }
}

/** Recalcula a mão de obra de um serviço já salvo, a partir das configurações atuais. */
export function recalcularMaoDeObraDoServico(
  servico: Pick<
    ServicoRow,
    | 'quantidade_tecnicos'
    | 'horas_trabalhadas'
    | 'tipo_hora'
    | 'valor_hora_aplicado'
    | 'quantidade_ajudantes'
    | 'horas_ajudantes'
    | 'valor_hora_ajudante'
  >,
  config: ConfiguracaoRow,
): ResultadoMaoDeObra {
  return calcularMaoDeObra(
    {
      tecnicos: {
        quantidade: servico.quantidade_tecnicos,
        horas: servico.horas_trabalhadas,
        tipoHora: servico.tipo_hora,
        valorHoraInformado: servico.valor_hora_aplicado,
      },
      ajudantes: {
        quantidade: servico.quantidade_ajudantes,
        horas: servico.horas_ajudantes,
        valorHoraInformado: servico.valor_hora_ajudante,
      },
    },
    config,
  )
}
