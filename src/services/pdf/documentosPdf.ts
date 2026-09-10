import { PdfDoc, type EmpresaPdf } from './pdfDoc'
import { TIPO_HORA_META } from '@/config/servico'
import { CATEGORIA_LABEL } from '@/services/fotosServicoService'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'
import type {
  ClienteRow,
  FotoServicoRow,
  MaterialRow,
  ServicoRow,
} from '@/types/database'

function paresCliente(c: ClienteRow | null): [string, string][] {
  if (!c) return [['Nome', '—']]
  const p: [string, string][] = [['Nome', c.nome]]
  if (c.cpf || c.cnpj) p.push(['CPF / CNPJ', c.cpf ?? c.cnpj ?? ''])
  if (c.whatsapp || c.telefone) p.push(['Telefone', c.whatsapp ?? c.telefone ?? ''])
  if (c.endereco) p.push(['Endereço', [c.endereco, c.cidade].filter(Boolean).join(' - ')])
  return p
}

function tabelaMateriais(pdf: PdfDoc, materiais: MaterialRow[]) {
  if (materiais.length === 0) return
  pdf.secao('Materiais')
  pdf.tabela(
    [
      { titulo: 'Item', largura: 90 },
      { titulo: 'Qtd', largura: 30, alinhar: 'right' },
      { titulo: 'Valor', largura: 40, alinhar: 'right' },
    ],
    materiais.map((m) => [
      m.nome,
      `${formatNumber(m.quantidade, 3)} ${m.unidade}`,
      formatCurrency(m.valor_cobrado * m.quantidade),
    ]),
  )
}

// --- Ordem de serviço ---------------------------------------------------
export interface DadosServicoPdf {
  empresa: EmpresaPdf
  servico: ServicoRow
  cliente: ClienteRow | null
  materiais: MaterialRow[]
}

export async function montarOrdemServicoPdf(d: DadosServicoPdf): Promise<PdfDoc> {
  const s = d.servico
  const pdf = await PdfDoc.criar()
  await pdf.cabecalho('Ordem de Serviço', d.empresa)

  pdf.secao('Cliente')
  pdf.linhas(paresCliente(d.cliente))

  pdf.secao('Serviço')
  pdf.linhas([
    ['Data', formatDate(s.data_servico ?? s.created_at)],
    ['Técnicos', String(s.quantidade_tecnicos)],
    ['Horas', `${formatNumber(s.horas_trabalhadas)} h`],
    ['Tipo de hora', TIPO_HORA_META[s.tipo_hora].label],
  ])
  pdf.espaco(1)
  pdf.paragrafo(s.descricao || '-')

  tabelaMateriais(pdf, d.materiais)

  pdf.secao('Valores')
  const materiaisTotal = d.materiais.reduce((t, m) => t + m.valor_cobrado * m.quantidade, 0)
  pdf.linhas([
    ['Mão de obra', formatCurrency(s.valor_mao_de_obra)],
    ...(materiaisTotal > 0 ? ([['Materiais', formatCurrency(materiaisTotal)]] as [string, string][]) : []),
    ...(s.taxa_deslocamento > 0
      ? ([['Deslocamento', formatCurrency(s.taxa_deslocamento)]] as [string, string][])
      : []),
    ...(s.outros_custos > 0
      ? ([['Outros custos', formatCurrency(s.outros_custos)]] as [string, string][])
      : []),
  ])
  pdf.total(
    'TOTAL',
    formatCurrency(s.valor_mao_de_obra + materiaisTotal + s.taxa_deslocamento + s.outros_custos),
  )

  pdf.espaco(14)
  pdf.linhas([
    ['Assinatura do técnico', '____________________________________'],
    ['Assinatura do cliente', '____________________________________'],
  ])

  pdf.rodape(`${d.empresa.nome} — Ordem de Serviço`)
  return pdf
}

// --- Relatório técnico ------------------------------------------------
export interface DadosRelatorioPdf extends DadosServicoPdf {
  fotos: { row: FotoServicoRow; dataUrl: string }[]
  conclusao?: string
}

export async function montarRelatorioTecnicoPdf(d: DadosRelatorioPdf): Promise<PdfDoc> {
  const s = d.servico
  const pdf = await PdfDoc.criar()
  await pdf.cabecalho('Relatório Técnico', d.empresa)

  pdf.secao('Cliente')
  pdf.linhas(paresCliente(d.cliente))

  pdf.secao('Descrição / atividades realizadas')
  pdf.paragrafo(s.descricao || '-')
  if (s.descricao_livre) {
    pdf.espaco(1)
    pdf.paragrafo(`Anotações: ${s.descricao_livre}`)
  }

  tabelaMateriais(pdf, d.materiais)

  for (const cat of ['antes', 'durante', 'depois'] as const) {
    const doCat = d.fotos.filter((f) => f.row.categoria === cat)
    if (doCat.length === 0) continue
    pdf.secao(`Fotos — ${CATEGORIA_LABEL[cat]}`)
    pdf.grade(doCat.map((f) => f.dataUrl))
  }

  pdf.secao('Conclusão')
  pdf.paragrafo(
    d.conclusao ||
      'Serviço executado e testado. Instalação em funcionamento normal no momento da entrega.',
  )

  pdf.espaco(12)
  pdf.linhas([['Responsável técnico', '____________________________________']])

  pdf.rodape(`${d.empresa.nome} — Relatório Técnico`)
  return pdf
}

// --- Recibo -----------------------------------------------------------
export interface DadosReciboPdf {
  empresa: EmpresaPdf
  clienteNome: string
  valor: number
  referencia: string
  data: string
  formaPagamento?: string | null
}

const UNIDADES_EXT = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove']

function valorPorExtensoSimples(valor: number): string {
  const reais = Math.floor(valor)
  const centavos = Math.round((valor - reais) * 100)
  const parte = reais <= 9 ? UNIDADES_EXT[reais] : String(reais)
  const c = centavos > 0 ? ` e ${centavos} centavos` : ''
  return `${parte} ${reais === 1 ? 'real' : 'reais'}${c}`
}

export async function montarReciboPdf(d: DadosReciboPdf): Promise<PdfDoc> {
  const pdf = await PdfDoc.criar()
  await pdf.cabecalho('Recibo', d.empresa)

  pdf.total('VALOR', formatCurrency(d.valor))
  pdf.espaco(4)

  pdf.paragrafo(
    `Recebi(emos) de ${d.clienteNome} a importância de ${formatCurrency(d.valor)} ` +
      `(${valorPorExtensoSimples(d.valor)}), referente a ${d.referencia}.`,
  )
  pdf.espaco(2)
  pdf.linhas([
    ['Data', formatDate(d.data)],
    ...(d.formaPagamento ? ([['Forma de pagamento', d.formaPagamento]] as [string, string][]) : []),
  ])

  pdf.espaco(16)
  pdf.linhas([['Assinatura', '____________________________________']])
  pdf.paragrafo(d.empresa.nome + (d.empresa.cnpj ? ` — CNPJ ${d.empresa.cnpj}` : ''))

  pdf.rodape(`${d.empresa.nome} — Recibo`)
  return pdf
}
