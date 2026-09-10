import { PdfDoc, type EmpresaPdf } from './pdfDoc'
import { totalMateriaisCobrado } from '@/utils/orcamento'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'
import type { ClienteRow, MaterialRow, OrcamentoRow, ServicoRow } from '@/types/database'

export interface PixPdf {
  copiaECola: string
  qrDataUrl: string | null
}

export interface DadosOrcamentoPdf {
  orcamento: OrcamentoRow
  empresa: EmpresaPdf
  cliente: ClienteRow | null
  servico: ServicoRow | null
  materiais: MaterialRow[]
  pix?: PixPdf | null
}

function paresCliente(c: ClienteRow | null): [string, string][] {
  if (!c) return [['Nome', '—']]
  const pares: [string, string][] = [['Nome', c.nome]]
  if (c.cpf || c.cnpj) pares.push(['CPF / CNPJ', c.cpf ?? c.cnpj ?? ''])
  if (c.whatsapp || c.telefone) pares.push(['Telefone', c.whatsapp ?? c.telefone ?? ''])
  if (c.endereco) pares.push(['Endereço', [c.endereco, c.cidade].filter(Boolean).join(' - ')])
  return pares
}

export async function montarOrcamentoPdf(d: DadosOrcamentoPdf): Promise<PdfDoc> {
  const o = d.orcamento
  const pdf = await PdfDoc.criar()
  await pdf.cabecalho(`Orçamento ${o.numero}`, d.empresa)

  pdf.secao('Cliente')
  pdf.linhas(paresCliente(d.cliente))

  pdf.secao('Dados do orçamento')
  pdf.linhas([
    ['Número', o.numero],
    ['Data', formatDate(o.created_at)],
    ...(o.validade_data ? ([['Validade', formatDate(o.validade_data)]] as [string, string][]) : []),
  ])

  if (d.servico?.descricao) {
    pdf.secao('Descrição do serviço')
    pdf.paragrafo(d.servico.descricao)
  }

  if (d.materiais.length > 0) {
    pdf.secao('Materiais')
    pdf.tabela(
      [
        { titulo: 'Item', largura: 82 },
        { titulo: 'Qtd', largura: 25, alinhar: 'right' },
        { titulo: 'Unit.', largura: 28, alinhar: 'right' },
        { titulo: 'Total', largura: 45, alinhar: 'right' },
      ],
      d.materiais.map((m) => [
        m.nome,
        `${formatNumber(m.quantidade, 3)} ${m.unidade}`,
        formatCurrency(m.valor_cobrado),
        formatCurrency(m.valor_cobrado * m.quantidade),
      ]),
    )
  }

  pdf.secao('Composição do valor')
  const materiaisCobrado = totalMateriaisCobrado({
    valorMateriais: o.valor_materiais,
    valorMargemMateriais: o.valor_margem_materiais,
  })
  const temEquipe = o.mo_qtd_tecnicos > 0 || o.mo_qtd_ajudantes > 0
  const un = o.mo_forma_cobranca === 'diaria' ? 'd' : 'h'
  const linhasMaoDeObra: [string, string][] = temEquipe
    ? [
        [
          `Mão de obra — técnicos (${o.mo_qtd_tecnicos} × ${formatNumber(o.mo_horas_tecnicos)}${un} × ${formatCurrency(o.mo_valor_hora_tecnico)})`,
          formatCurrency(o.mo_qtd_tecnicos * o.mo_horas_tecnicos * o.mo_valor_hora_tecnico),
        ],
        ...(o.mo_qtd_ajudantes > 0
          ? ([
              [
                `Mão de obra — ajudantes (${o.mo_qtd_ajudantes} × ${formatNumber(o.mo_horas_ajudantes)}${un} × ${formatCurrency(o.mo_valor_hora_ajudante)})`,
                formatCurrency(o.mo_qtd_ajudantes * o.mo_horas_ajudantes * o.mo_valor_hora_ajudante),
              ],
            ] as [string, string][])
          : []),
      ]
    : [
        [
          o.mo_forma_cobranca === 'fechado' ? 'Mão de obra (valor fechado)' : 'Mão de obra',
          formatCurrency(o.valor_mao_de_obra),
        ],
      ]
  pdf.linhas([
    ['Materiais', formatCurrency(materiaisCobrado)],
    ...linhasMaoDeObra,
    ...(o.valor_deslocamento > 0
      ? ([['Deslocamento', formatCurrency(o.valor_deslocamento)]] as [string, string][])
      : []),
    ...(o.outros_custos > 0
      ? ([['Outros custos', formatCurrency(o.outros_custos)]] as [string, string][])
      : []),
  ])
  pdf.total('VALOR TOTAL', formatCurrency(o.valor_total))

  if (o.forma_pagamento) {
    pdf.secao('Forma de pagamento')
    pdf.paragrafo(o.forma_pagamento)
  }

  if (d.pix?.copiaECola) {
    pdf.secao('Pagamento via PIX')
    if (d.pix.qrDataUrl) pdf.qr(d.pix.qrDataUrl)
    pdf.paragrafo(`PIX copia e cola:\n${d.pix.copiaECola}`)
  }

  if (o.garantia) {
    pdf.secao('Garantia')
    pdf.paragrafo(o.garantia)
  }

  if (o.observacoes) {
    pdf.secao('Observações')
    pdf.paragrafo(o.observacoes)
  }

  pdf.rodape(`${d.empresa.nome} — Orçamento ${o.numero}`)
  return pdf
}
