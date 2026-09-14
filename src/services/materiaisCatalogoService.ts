import type {
  MaterialCatalogoRow,
  MaterialCompraRow,
  MaterialUnidade,
  PrecoReferencia,
} from '@/types/database'
import { asRow, asRowOrNull, asRows, currentUserId, supabase, toDbError, usingDatabase } from './db'
import { demoInsert, demoList, demoPatch } from './demoCrud'
import { demoId, nowIso } from './demoStore'
import { encontrarOuCriarLoja } from './lojasService'

/**
 * Catálogo de materiais com histórico de preços (Checkpoint 27).
 *
 * Cada compra confirmada (vinda de uma nota lida ou digitada) alimenta:
 *   - `materiais_catalogo` — 1 linha por produto (identificado por SKU da loja,
 *     ou por nome quando não há SKU), com os agregados (último/maior/menor/média).
 *   - `materiais_compras` — 1 linha por compra, histórico nunca é apagado.
 */

const KEY_CATALOGO = 'materiais_catalogo'
const KEY_COMPRAS = 'materiais_compras'
const SEED_CATALOGO: MaterialCatalogoRow[] = []
const SEED_COMPRAS: MaterialCompraRow[] = []

export interface RegistrarCompraInput {
  nome: string
  codigo?: string | null
  sku?: string | null
  marca?: string | null
  unidade: MaterialUnidade
  lojaNome?: string | null
  quantidade: number
  valorUnitario: number
  dataCompra?: string | null
  notaFiscalId?: string | null
  servicoId?: string | null
}

export interface RegistrarCompraResultado {
  catalogo: MaterialCatalogoRow
  compra: MaterialCompraRow
}

function r2(n: number): number {
  return Math.round((Number.isFinite(n) ? n : 0) * 100) / 100
}

export async function listCatalogo(): Promise<MaterialCatalogoRow[]> {
  if (!usingDatabase) return demoList(KEY_CATALOGO, SEED_CATALOGO)
  try {
    const { data, error } = await supabase.from('materiais_catalogo').select('*').order('nome')
    if (error) throw error
    return asRows<MaterialCatalogoRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível carregar o catálogo de materiais.')
  }
}

export async function listHistoricoCompras(catalogoId: string): Promise<MaterialCompraRow[]> {
  if (!usingDatabase) {
    return demoList(KEY_COMPRAS, SEED_COMPRAS)
      .filter((c) => c.material_catalogo_id === catalogoId)
      .sort((a, b) => b.data_compra.localeCompare(a.data_compra))
  }
  try {
    const { data, error } = await supabase
      .from('materiais_compras')
      .select('*')
      .eq('material_catalogo_id', catalogoId)
      .order('data_compra', { ascending: false })
    if (error) throw error
    return asRows<MaterialCompraRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível carregar o histórico de preços.')
  }
}

/** Procura no catálogo um produto já cadastrado (por SKU, senão por nome). */
export async function buscarNoCatalogo(
  sku: string | null | undefined,
  nome: string,
): Promise<MaterialCatalogoRow | null> {
  const skuLimpo = sku?.trim()
  if (!usingDatabase) {
    const todos = demoList(KEY_CATALOGO, SEED_CATALOGO)
    if (skuLimpo) {
      const porSku = todos.find((c) => c.sku && c.sku.trim() === skuLimpo)
      if (porSku) return porSku
    }
    return todos.find((c) => c.nome.trim().toLowerCase() === nome.trim().toLowerCase()) ?? null
  }
  try {
    if (skuLimpo) {
      const { data, error } = await supabase
        .from('materiais_catalogo')
        .select('*')
        .eq('sku', skuLimpo)
        .maybeSingle()
      if (error) throw error
      const achado = asRowOrNull<MaterialCatalogoRow>(data)
      if (achado) return achado
    }
    const { data, error } = await supabase
      .from('materiais_catalogo')
      .select('*')
      .ilike('nome', nome.trim())
      .maybeSingle()
    if (error) throw error
    return asRowOrNull<MaterialCatalogoRow>(data)
  } catch (err) {
    throw toDbError(err, 'Não foi possível consultar o catálogo.')
  }
}

/** Calcula o preço de venda de referência a partir do histórico do catálogo. */
export function precoReferencia(
  catalogo: MaterialCatalogoRow | null,
  modo: PrecoReferencia,
  personalizado?: number | null,
): number {
  if (modo === 'personalizado') return personalizado ?? catalogo?.ultimo_preco ?? 0
  if (!catalogo) return 0
  switch (modo) {
    case 'ultimo':
      return catalogo.ultimo_preco
    case 'menor':
      return catalogo.menor_preco
    case 'medio':
      return catalogo.preco_medio
    case 'maior':
    default:
      return catalogo.maior_preco
  }
}

/**
 * Registra uma compra: cria/atualiza o produto no catálogo e grava a compra
 * no histórico de preços. Nunca apaga compras anteriores.
 */
export async function registrarCompra(
  input: RegistrarCompraInput,
): Promise<RegistrarCompraResultado> {
  const userId = await currentUserId()
  const dataCompra = input.dataCompra || nowIso().slice(0, 10)
  const lojaId = input.lojaNome?.trim()
    ? (await encontrarOuCriarLoja(input.lojaNome.trim())).id
    : null

  let catalogo = await buscarNoCatalogo(input.sku, input.nome)

  if (!usingDatabase) {
    const ts = nowIso()
    if (!catalogo) {
      catalogo = demoInsert(KEY_CATALOGO, SEED_CATALOGO, {
        id: demoId(),
        user_id: userId,
        nome: input.nome,
        codigo: input.codigo ?? null,
        sku: input.sku ?? null,
        marca: input.marca ?? null,
        unidade: input.unidade,
        loja_id: lojaId,
        ultimo_preco: 0,
        maior_preco: 0,
        menor_preco: 0,
        preco_medio: 0,
        ultima_compra_em: null,
        created_at: ts,
        updated_at: ts,
      })
    }
    const compra = demoInsert(KEY_COMPRAS, SEED_COMPRAS, {
      id: demoId(),
      user_id: userId,
      material_catalogo_id: catalogo.id,
      nota_fiscal_id: input.notaFiscalId ?? null,
      servico_id: input.servicoId ?? null,
      quantidade: input.quantidade,
      valor_unitario: input.valorUnitario,
      valor_total: r2(input.quantidade * input.valorUnitario),
      data_compra: dataCompra,
      created_at: ts,
    })
    const catalogoAtualizado = recalcularAgregados(
      catalogo,
      demoList(KEY_COMPRAS, SEED_COMPRAS).filter((c) => c.material_catalogo_id === catalogo!.id),
    )
    const salvo = demoPatch<MaterialCatalogoRow>(KEY_CATALOGO, SEED_CATALOGO, catalogo.id, {
      ...catalogoAtualizado,
      codigo: input.codigo ?? catalogo.codigo,
      sku: input.sku ?? catalogo.sku,
      marca: input.marca ?? catalogo.marca,
    })
    return { catalogo: salvo, compra }
  }

  try {
    if (!catalogo) {
      const { data, error } = await supabase
        .from('materiais_catalogo')
        .insert({
          user_id: userId,
          nome: input.nome,
          codigo: input.codigo ?? null,
          sku: input.sku ?? null,
          marca: input.marca ?? null,
          unidade: input.unidade,
          loja_id: lojaId,
        })
        .select()
        .single()
      if (error) throw error
      catalogo = asRow<MaterialCatalogoRow>(data)
    }

    const { data: compraData, error: compraError } = await supabase
      .from('materiais_compras')
      .insert({
        user_id: userId,
        material_catalogo_id: catalogo.id,
        nota_fiscal_id: input.notaFiscalId ?? null,
        servico_id: input.servicoId ?? null,
        quantidade: input.quantidade,
        valor_unitario: input.valorUnitario,
        valor_total: r2(input.quantidade * input.valorUnitario),
        data_compra: dataCompra,
      })
      .select()
      .single()
    if (compraError) throw compraError
    const compra = asRow<MaterialCompraRow>(compraData)

    const historico = await listHistoricoCompras(catalogo.id)
    const agregados = recalcularAgregados(catalogo, historico)
    const { data: catalogoData, error: updError } = await supabase
      .from('materiais_catalogo')
      .update({
        ...agregados,
        codigo: input.codigo ?? catalogo.codigo,
        sku: input.sku ?? catalogo.sku,
        marca: input.marca ?? catalogo.marca,
      })
      .eq('id', catalogo.id)
      .select()
      .single()
    if (updError) throw updError

    return { catalogo: asRow<MaterialCatalogoRow>(catalogoData), compra }
  } catch (err) {
    throw toDbError(err, 'Não foi possível registrar a compra do material.')
  }
}

function recalcularAgregados(
  catalogoAtual: MaterialCatalogoRow,
  historico: MaterialCompraRow[],
): Pick<
  MaterialCatalogoRow,
  'ultimo_preco' | 'maior_preco' | 'menor_preco' | 'preco_medio' | 'ultima_compra_em'
> {
  if (historico.length === 0) {
    return {
      ultimo_preco: catalogoAtual.ultimo_preco,
      maior_preco: catalogoAtual.maior_preco,
      menor_preco: catalogoAtual.menor_preco,
      preco_medio: catalogoAtual.preco_medio,
      ultima_compra_em: catalogoAtual.ultima_compra_em,
    }
  }
  const ordenado = [...historico].sort(
    (a, b) => b.data_compra.localeCompare(a.data_compra) || b.created_at.localeCompare(a.created_at),
  )
  const valores = historico.map((c) => c.valor_unitario)
  return {
    ultimo_preco: ordenado[0].valor_unitario,
    maior_preco: r2(Math.max(...valores)),
    menor_preco: r2(Math.min(...valores)),
    preco_medio: r2(valores.reduce((s, v) => s + v, 0) / valores.length),
    ultima_compra_em: ordenado[0].data_compra,
  }
}
