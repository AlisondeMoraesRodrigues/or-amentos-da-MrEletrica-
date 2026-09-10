import { DbError } from './db'
import { getOrcamento } from './orcamentosService'
import { getServico } from './servicosService'
import { getCliente } from './clientesService'
import { listMateriais } from './materiaisService'
import { getConfiguracao } from './configuracoesService'
import { createDocumento } from './documentosService'
import { montarOrcamentoPdf } from './pdf/orcamentoPdf'
import {
  montarOrdemServicoPdf,
  montarRelatorioTecnicoPdf,
  montarReciboPdf,
} from './pdf/documentosPdf'
import { empresaDaConfig } from './pdf/empresaPdf'
import { montarPixOrcamento } from './pixService'
import { getFotoDataUrls } from './fotosServicoHelper'
import type { DocumentoTipo } from '@/types/database'

export interface PdfGerado {
  blob: Blob
  nomeArquivo: string
}

async function registrar(
  tipo: DocumentoTipo,
  titulo: string,
  vinculo: { cliente_id?: string | null; servico_id?: string | null; orcamento_id?: string | null },
) {
  await createDocumento({
    tipo,
    titulo,
    cliente_id: vinculo.cliente_id ?? null,
    servico_id: vinculo.servico_id ?? null,
    orcamento_id: vinculo.orcamento_id ?? null,
  }).catch(() => undefined)
}

/** Gera o PDF do orçamento, registra em `documentos` e devolve o blob. */
export async function gerarPdfOrcamento(orcamentoId: string): Promise<PdfGerado> {
  const orcamento = await getOrcamento(orcamentoId)
  if (!orcamento) throw new DbError('Orçamento não encontrado.')

  const [config, cliente, servico] = await Promise.all([
    getConfiguracao(),
    orcamento.cliente_id ? getCliente(orcamento.cliente_id) : Promise.resolve(null),
    orcamento.servico_id ? getServico(orcamento.servico_id) : Promise.resolve(null),
  ])
  const materiais = servico ? await listMateriais({ servicoId: servico.id }) : []
  const pix = await montarPixOrcamento(config, orcamento.valor_total, orcamento.numero)

  const pdf = await montarOrcamentoPdf({
    orcamento,
    empresa: empresaDaConfig(config),
    cliente,
    servico,
    materiais,
    pix,
  })

  const nomeArquivo = `Orcamento-${orcamento.numero}.pdf`
  const blob = pdf.blob()
  await registrar('orcamento', `Orçamento ${orcamento.numero}`, {
    cliente_id: orcamento.cliente_id,
    servico_id: orcamento.servico_id,
    orcamento_id: orcamento.id,
  })
  return { blob, nomeArquivo }
}

async function dadosServico(servicoId: string) {
  const servico = await getServico(servicoId)
  if (!servico) throw new DbError('Serviço não encontrado.')
  const [config, cliente, materiais] = await Promise.all([
    getConfiguracao(),
    servico.cliente_id ? getCliente(servico.cliente_id) : Promise.resolve(null),
    listMateriais({ servicoId }),
  ])
  return { servico, empresa: empresaDaConfig(config), cliente, materiais }
}

function slug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'documento'
}

export async function gerarPdfOrdemServico(servicoId: string): Promise<PdfGerado> {
  const d = await dadosServico(servicoId)
  const pdf = await montarOrdemServicoPdf(d)
  await registrar('ordem_servico', `Ordem de serviço — ${d.cliente?.nome ?? 'serviço'}`, {
    cliente_id: d.servico.cliente_id,
    servico_id: d.servico.id,
  })
  return { blob: pdf.blob(), nomeArquivo: `Ordem-Servico-${slug(d.cliente?.nome ?? d.servico.id)}.pdf` }
}

export async function gerarPdfRelatorioTecnico(servicoId: string): Promise<PdfGerado> {
  const d = await dadosServico(servicoId)
  const fotos = await getFotoDataUrls(servicoId)
  const pdf = await montarRelatorioTecnicoPdf({ ...d, fotos })
  await registrar('relatorio_tecnico', `Relatório técnico — ${d.cliente?.nome ?? 'serviço'}`, {
    cliente_id: d.servico.cliente_id,
    servico_id: d.servico.id,
  })
  return { blob: pdf.blob(), nomeArquivo: `Relatorio-Tecnico-${slug(d.cliente?.nome ?? d.servico.id)}.pdf` }
}

export interface DadosRecibo {
  clienteNome: string
  clienteId?: string | null
  valor: number
  referencia: string
  data: string
  formaPagamento?: string | null
  orcamentoId?: string | null
  servicoId?: string | null
}

export async function gerarPdfRecibo(dados: DadosRecibo): Promise<PdfGerado> {
  const config = await getConfiguracao()
  const pdf = await montarReciboPdf({
    empresa: empresaDaConfig(config),
    clienteNome: dados.clienteNome,
    valor: dados.valor,
    referencia: dados.referencia,
    data: dados.data,
    formaPagamento: dados.formaPagamento,
  })
  await registrar('recibo', `Recibo — ${dados.clienteNome}`, {
    cliente_id: dados.clienteId ?? null,
    orcamento_id: dados.orcamentoId ?? null,
    servico_id: dados.servicoId ?? null,
  })
  return { blob: pdf.blob(), nomeArquivo: `Recibo-${slug(dados.clienteNome)}.pdf` }
}
