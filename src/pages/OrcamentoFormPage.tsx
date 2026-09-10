import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Loading } from '@/components/ui/Loading'
import { TextField } from '@/components/ui/TextField'
import { TextAreaField } from '@/components/ui/TextAreaField'
import { SelectField } from '@/components/ui/SelectField'
import { useAsync } from '@/hooks/useAsync'
import { listClientes } from '@/services/clientesService'
import { getServico, listServicos } from '@/services/servicosService'
import { listMateriais } from '@/services/materiaisService'
import {
  createOrcamento,
  getOrcamento,
  proximoNumeroOrcamento,
  updateOrcamento,
  type NovoOrcamento,
} from '@/services/orcamentosService'
import { ORCAMENTO_STATUS_META, ORCAMENTO_STATUS_ORDEM } from '@/config/orcamento'
import { FORMA_COBRANCA_META, FORMA_COBRANCA_ORDEM } from '@/config/servico'
import { calcularTotalOrcamento } from '@/utils/orcamento'
import { calcularLucro } from '@/utils/lucro'
import { formatCurrency, formatNumber } from '@/utils/format'
import type { FormaCobranca, OrcamentoStatus } from '@/types/database'

type Campos = {
  cliente_id: string
  servico_id: string
  numero: string
  status: OrcamentoStatus
  validade_data: string
  garantia: string
  forma_pagamento: string
  observacoes: string
  valor_materiais: string
  valor_margem_materiais: string
  mo_forma_cobranca: FormaCobranca
  valor_mao_de_obra: string
  mo_qtd_tecnicos: string
  mo_horas_tecnicos: string
  mo_valor_hora_tecnico: string
  mo_qtd_ajudantes: string
  mo_horas_ajudantes: string
  mo_valor_hora_ajudante: string
  valor_deslocamento: string
  outros_custos: string
}

const VAZIO: Campos = {
  cliente_id: '',
  servico_id: '',
  numero: '',
  status: 'rascunho',
  validade_data: '',
  garantia: '',
  forma_pagamento: '',
  observacoes: '',
  valor_materiais: '',
  valor_margem_materiais: '',
  mo_forma_cobranca: 'hora',
  valor_mao_de_obra: '',
  mo_qtd_tecnicos: '',
  mo_horas_tecnicos: '',
  mo_valor_hora_tecnico: '',
  mo_qtd_ajudantes: '',
  mo_horas_ajudantes: '',
  mo_valor_hora_ajudante: '',
  valor_deslocamento: '',
  outros_custos: '',
}

function num(v: string): number {
  const n = Number.parseFloat(v.replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

function limpar(v: string): string | null {
  const t = v.trim()
  return t === '' ? null : t
}

function r2(n: number): number {
  return Math.round(n * 100) / 100
}

export default function OrcamentoFormPage() {
  const { id } = useParams<{ id: string }>()
  const editando = Boolean(id)
  const navigate = useNavigate()

  const { data: apoio, loading: carregandoApoio } = useAsync(async () => {
    const [clientes, servicos] = await Promise.all([listClientes(), listServicos()])
    return { clientes, servicos }
  }, [])

  const [campos, setCampos] = useState<Campos>(VAZIO)
  const [carregando, setCarregando] = useState(editando)
  const [inicializou, setInicializou] = useState(editando)
  const [erroCarga, setErroCarga] = useState('')
  const [erros, setErros] = useState<Partial<Record<keyof Campos, string>>>({})
  const [erroGeral, setErroGeral] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [puxando, setPuxando] = useState(false)

  useEffect(() => {
    if (editando || inicializou) return
    proximoNumeroOrcamento()
      .then((n) => setCampos((c) => ({ ...c, numero: n })))
      .catch(() => undefined)
      .finally(() => setInicializou(true))
  }, [editando, inicializou])

  useEffect(() => {
    if (!id) return
    let ativo = true
    setCarregando(true)
    getOrcamento(id)
      .then((o) => {
        if (!ativo) return
        if (!o) {
          setErroCarga('Orçamento não encontrado.')
          return
        }
        setCampos({
          cliente_id: o.cliente_id ?? '',
          servico_id: o.servico_id ?? '',
          numero: o.numero,
          status: o.status,
          validade_data: o.validade_data ?? '',
          garantia: o.garantia ?? '',
          forma_pagamento: o.forma_pagamento ?? '',
          observacoes: o.observacoes ?? '',
          valor_materiais: String(o.valor_materiais ?? ''),
          valor_margem_materiais: String(o.valor_margem_materiais ?? ''),
          mo_forma_cobranca: o.mo_forma_cobranca ?? 'hora',
          valor_mao_de_obra: String(o.valor_mao_de_obra ?? ''),
          mo_qtd_tecnicos: o.mo_qtd_tecnicos ? String(o.mo_qtd_tecnicos) : '',
          mo_horas_tecnicos: o.mo_horas_tecnicos ? String(o.mo_horas_tecnicos) : '',
          mo_valor_hora_tecnico: o.mo_valor_hora_tecnico ? String(o.mo_valor_hora_tecnico) : '',
          mo_qtd_ajudantes: o.mo_qtd_ajudantes ? String(o.mo_qtd_ajudantes) : '',
          mo_horas_ajudantes: o.mo_horas_ajudantes ? String(o.mo_horas_ajudantes) : '',
          mo_valor_hora_ajudante: o.mo_valor_hora_ajudante ? String(o.mo_valor_hora_ajudante) : '',
          valor_deslocamento: o.valor_deslocamento ? String(o.valor_deslocamento) : '',
          outros_custos: o.outros_custos ? String(o.outros_custos) : '',
        })
      })
      .catch((e: unknown) =>
        setErroCarga(e instanceof Error ? e.message : 'Não foi possível carregar o orçamento.'),
      )
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [id])

  function set<K extends keyof Campos>(chave: K, valor: Campos[K]) {
    setCampos((c) => ({ ...c, [chave]: valor }))
  }

  async function puxarDoServico() {
    if (!campos.servico_id) return
    setPuxando(true)
    setErroGeral('')
    try {
      const [servico, materiais] = await Promise.all([
        getServico(campos.servico_id),
        listMateriais({ servicoId: campos.servico_id }),
      ])
      if (!servico) throw new Error('Serviço não encontrado.')
      const custo = r2(materiais.reduce((s, m) => s + m.valor_custo * m.quantidade, 0))
      const cobrado = r2(materiais.reduce((s, m) => s + m.valor_cobrado * m.quantidade, 0))
      setCampos((c) => ({
        ...c,
        cliente_id: c.cliente_id || servico.cliente_id || '',
        valor_materiais: String(custo),
        valor_margem_materiais: String(r2(cobrado - custo)),
        mo_forma_cobranca: servico.forma_cobranca ?? 'hora',
        valor_mao_de_obra: String(servico.valor_mao_de_obra),
        mo_qtd_tecnicos: servico.quantidade_tecnicos ? String(servico.quantidade_tecnicos) : '',
        mo_horas_tecnicos: servico.horas_trabalhadas ? String(servico.horas_trabalhadas) : '',
        mo_valor_hora_tecnico: servico.valor_hora_aplicado ? String(servico.valor_hora_aplicado) : '',
        mo_qtd_ajudantes: servico.quantidade_ajudantes ? String(servico.quantidade_ajudantes) : '',
        mo_horas_ajudantes: servico.horas_ajudantes ? String(servico.horas_ajudantes) : '',
        mo_valor_hora_ajudante: servico.valor_hora_ajudante ? String(servico.valor_hora_ajudante) : '',
        valor_deslocamento: servico.taxa_deslocamento ? String(servico.taxa_deslocamento) : '',
        outros_custos: servico.outros_custos ? String(servico.outros_custos) : '',
      }))
    } catch (err) {
      setErroGeral(err instanceof Error ? err.message : 'Não foi possível puxar os valores.')
    } finally {
      setPuxando(false)
    }
  }

  const formaMeta = FORMA_COBRANCA_META[campos.mo_forma_cobranca]
  const fechado = campos.mo_forma_cobranca === 'fechado'

  const moTecnicos = r2(
    num(campos.mo_qtd_tecnicos) * num(campos.mo_horas_tecnicos) * num(campos.mo_valor_hora_tecnico),
  )
  const moAjudantes = r2(
    num(campos.mo_qtd_ajudantes) * num(campos.mo_horas_ajudantes) * num(campos.mo_valor_hora_ajudante),
  )
  const temDetalheMaoDeObra = !fechado && (moTecnicos > 0 || moAjudantes > 0)
  const valorMaoDeObra = temDetalheMaoDeObra
    ? r2(moTecnicos + moAjudantes)
    : num(campos.valor_mao_de_obra)

  const componentes = {
    valorMateriais: num(campos.valor_materiais),
    valorMargemMateriais: num(campos.valor_margem_materiais),
    valorMaoDeObra,
    valorDeslocamento: num(campos.valor_deslocamento),
    outrosCustos: num(campos.outros_custos),
  }
  const total = calcularTotalOrcamento(componentes)

  // Lucro do orçamento: tudo menos o preço de custo dos materiais.
  const lucro = calcularLucro({
    maoDeObraCobrada: valorMaoDeObra,
    materiaisCobrado: r2(num(campos.valor_materiais) + num(campos.valor_margem_materiais)),
    materiaisCusto: num(campos.valor_materiais),
    deslocamento: num(campos.valor_deslocamento),
    outrosCustos: num(campos.outros_custos),
  })

  function validar(): boolean {
    const next: Partial<Record<keyof Campos, string>> = {}
    if (!campos.numero.trim()) next.numero = 'Informe o número do orçamento.'
    setErros(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErroGeral('')
    if (!validar()) return

    const payload: NovoOrcamento = {
      numero: campos.numero.trim(),
      cliente_id: campos.cliente_id || null,
      servico_id: campos.servico_id || null,
      status: campos.status,
      valor_materiais: num(campos.valor_materiais),
      valor_margem_materiais: num(campos.valor_margem_materiais),
      mo_forma_cobranca: campos.mo_forma_cobranca,
      valor_mao_de_obra: valorMaoDeObra,
      mo_qtd_tecnicos: temDetalheMaoDeObra ? num(campos.mo_qtd_tecnicos) : 0,
      mo_horas_tecnicos: temDetalheMaoDeObra ? num(campos.mo_horas_tecnicos) : 0,
      mo_valor_hora_tecnico: temDetalheMaoDeObra ? num(campos.mo_valor_hora_tecnico) : 0,
      mo_qtd_ajudantes: temDetalheMaoDeObra ? num(campos.mo_qtd_ajudantes) : 0,
      mo_horas_ajudantes: temDetalheMaoDeObra ? num(campos.mo_horas_ajudantes) : 0,
      mo_valor_hora_ajudante: temDetalheMaoDeObra ? num(campos.mo_valor_hora_ajudante) : 0,
      valor_deslocamento: num(campos.valor_deslocamento),
      outros_custos: num(campos.outros_custos),
      valor_total: total,
      validade_data: campos.validade_data || null,
      garantia: limpar(campos.garantia),
      forma_pagamento: limpar(campos.forma_pagamento),
      observacoes: limpar(campos.observacoes),
    }

    setSalvando(true)
    try {
      const salvo = id ? await updateOrcamento(id, payload) : await createOrcamento(payload)
      navigate(`/orcamentos/${salvo.id}`, { replace: true })
    } catch (err) {
      setErroGeral(err instanceof Error ? err.message : 'Não foi possível salvar o orçamento.')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando || carregandoApoio) return <Loading label="Carregando…" />

  if (erroCarga) {
    return (
      <div className="space-y-4">
        <PageHeader title="Orçamento" />
        <Alert tone="error">{erroCarga}</Alert>
        <Button variant="ghost" onClick={() => navigate('/orcamentos')}>
          Voltar
        </Button>
      </div>
    )
  }

  const clientes = apoio?.clientes ?? []
  const servicos = apoio?.servicos ?? []
  const nomeCliente = new Map(clientes.map((c) => [c.id, c.nome]))

  const valorField = (label: string, chave: keyof Campos) => (
    <TextField
      label={label}
      name={chave}
      type="number"
      min={0}
      step="0.01"
      inputMode="decimal"
      value={campos[chave]}
      onChange={(e) => set(chave, e.target.value)}
    />
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title={editando ? 'Editar orçamento' : 'Novo orçamento'}
        subtitle={campos.numero}
      />

      {erroGeral && <Alert tone="error">{erroGeral}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Card className="space-y-3">
          <SelectField
            label="Cliente"
            name="cliente_id"
            value={campos.cliente_id}
            onChange={(e) => set('cliente_id', e.target.value)}
          >
            <option value="">— Sem cliente —</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Serviço (opcional)"
            name="servico_id"
            value={campos.servico_id}
            onChange={(e) => set('servico_id', e.target.value)}
          >
            <option value="">— Sem serviço —</option>
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>
                {(s.cliente_id ? `${nomeCliente.get(s.cliente_id) ?? '—'} — ` : '') +
                  (s.descricao || 'Serviço').slice(0, 60)}
              </option>
            ))}
          </SelectField>
          {campos.servico_id && (
            <Button type="button" variant="ghost" onClick={puxarDoServico} disabled={puxando}>
              {puxando ? 'Puxando…' : 'Puxar valores do serviço'}
            </Button>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Número *"
              name="numero"
              value={campos.numero}
              onChange={(e) => set('numero', e.target.value)}
              error={erros.numero}
            />
            <SelectField
              label="Status"
              name="status"
              value={campos.status}
              onChange={(e) => set('status', e.target.value as OrcamentoStatus)}
            >
              {ORCAMENTO_STATUS_ORDEM.map((s) => (
                <option key={s} value={s}>
                  {ORCAMENTO_STATUS_META[s].label}
                </option>
              ))}
            </SelectField>
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Valores</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {valorField('Materiais (custo) R$', 'valor_materiais')}
            {valorField('Margem de materiais R$', 'valor_margem_materiais')}
            {valorField('Deslocamento R$', 'valor_deslocamento')}
            {valorField('Outros custos R$', 'outros_custos')}
          </div>

          <div className="space-y-3 rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Mão de obra
            </p>
            <div className="grid grid-cols-3 gap-2">
              {FORMA_COBRANCA_ORDEM.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => set('mo_forma_cobranca', f)}
                  className={`rounded-lg px-2 py-2 text-sm font-semibold ${
                    campos.mo_forma_cobranca === f
                      ? 'bg-brand-600 text-white'
                      : 'bg-white text-slate-600 ring-1 ring-slate-200'
                  }`}
                >
                  {FORMA_COBRANCA_META[f].label}
                </button>
              ))}
            </div>

            {fechado ? (
              <TextField
                label="Mão de obra — valor total R$"
                name="valor_mao_de_obra"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={campos.valor_mao_de_obra}
                onChange={(e) => set('valor_mao_de_obra', e.target.value)}
              />
            ) : (
              <>
                <p className="text-xs text-slate-400">
                  Preencha o detalhe por equipe <span className="font-medium">ou</span> só o
                  valor total. Use “Puxar valores do serviço” para trazer tudo pronto.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {valorField('Técnicos (qtd)', 'mo_qtd_tecnicos')}
                  {valorField(`${formaMeta.unidade} técnicos`, 'mo_horas_tecnicos')}
                  {valorField(
                    campos.mo_forma_cobranca === 'diaria' ? 'R$/diária técnico' : 'R$/h técnico',
                    'mo_valor_hora_tecnico',
                  )}
                  {valorField('Ajudantes (qtd)', 'mo_qtd_ajudantes')}
                  {valorField(`${formaMeta.unidade} ajudantes`, 'mo_horas_ajudantes')}
                  {valorField(
                    campos.mo_forma_cobranca === 'diaria' ? 'R$/diária ajudante' : 'R$/h ajudante',
                    'mo_valor_hora_ajudante',
                  )}
                </div>
                {temDetalheMaoDeObra ? (
                  <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
                    Técnicos {formatCurrency(moTecnicos)}
                    {moAjudantes > 0 && <> + Ajudantes {formatCurrency(moAjudantes)}</>} ={' '}
                    <span className="font-bold">Mão de obra {formatCurrency(valorMaoDeObra)}</span>
                  </p>
                ) : (
                  <TextField
                    label="Mão de obra — valor total R$"
                    name="valor_mao_de_obra"
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    value={campos.valor_mao_de_obra}
                    onChange={(e) => set('valor_mao_de_obra', e.target.value)}
                  />
                )}
              </>
            )}
          </div>

          <div className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800">
            Materiais {formatCurrency(componentes.valorMateriais)} + Margem{' '}
            {formatCurrency(componentes.valorMargemMateriais)} + Mão de obra{' '}
            {formatCurrency(componentes.valorMaoDeObra)} + Deslocamento{' '}
            {formatCurrency(componentes.valorDeslocamento)} + Outros{' '}
            {formatCurrency(componentes.outrosCustos)} ={' '}
            <span className="font-bold">{formatCurrency(total)}</span>
          </div>

          <div className="space-y-1 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            <div className="flex justify-between">
              <span>Receita (total do orçamento)</span>
              <span className="font-medium">{formatCurrency(lucro.receita)}</span>
            </div>
            <div className="flex justify-between">
              <span>Custo dos materiais</span>
              <span className="font-medium">− {formatCurrency(lucro.custo)}</span>
            </div>
            <div className="flex justify-between border-t border-emerald-200 pt-1 font-bold">
              <span>Lucro ({formatNumber(lucro.margemPct, 1)}%)</span>
              <span>{formatCurrency(lucro.lucro)}</span>
            </div>
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Condições</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Validade"
              name="validade_data"
              type="date"
              value={campos.validade_data}
              onChange={(e) => set('validade_data', e.target.value)}
            />
            <TextField
              label="Forma de pagamento"
              name="forma_pagamento"
              value={campos.forma_pagamento}
              onChange={(e) => set('forma_pagamento', e.target.value)}
              placeholder="Ex.: PIX ou cartão em até 3x"
            />
          </div>
          <TextAreaField
            label="Garantia"
            name="garantia"
            value={campos.garantia}
            onChange={(e) => set('garantia', e.target.value)}
            placeholder="Ex.: 90 dias para serviços e materiais aplicados."
          />
          <TextAreaField
            label="Observações"
            name="observacoes"
            value={campos.observacoes}
            onChange={(e) => set('observacoes', e.target.value)}
          />
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={() => navigate(id ? `/orcamentos/${id}` : '/orcamentos')}
            disabled={salvando}
          >
            Cancelar
          </Button>
          <Button type="submit" fullWidth disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar orçamento'}
          </Button>
        </div>

        {clientes.length === 0 && (
          <p className="text-center text-xs text-slate-400">
            Dica: cadastre um{' '}
            <Link to="/clientes/novo" className="font-semibold text-brand-600 underline">
              cliente
            </Link>{' '}
            para vincular ao orçamento.
          </p>
        )}
      </form>
    </div>
  )
}
