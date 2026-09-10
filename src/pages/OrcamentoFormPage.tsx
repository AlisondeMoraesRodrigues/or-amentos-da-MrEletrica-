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
import { calcularTotalOrcamento } from '@/utils/orcamento'
import { formatCurrency } from '@/utils/format'
import type { OrcamentoStatus } from '@/types/database'

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
  valor_mao_de_obra: string
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
  valor_mao_de_obra: '',
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
          valor_mao_de_obra: String(o.valor_mao_de_obra ?? ''),
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
        valor_mao_de_obra: String(servico.valor_mao_de_obra),
        valor_deslocamento: servico.taxa_deslocamento ? String(servico.taxa_deslocamento) : '',
        outros_custos: servico.outros_custos ? String(servico.outros_custos) : '',
      }))
    } catch (err) {
      setErroGeral(err instanceof Error ? err.message : 'Não foi possível puxar os valores.')
    } finally {
      setPuxando(false)
    }
  }

  const componentes = {
    valorMateriais: num(campos.valor_materiais),
    valorMargemMateriais: num(campos.valor_margem_materiais),
    valorMaoDeObra: num(campos.valor_mao_de_obra),
    valorDeslocamento: num(campos.valor_deslocamento),
    outrosCustos: num(campos.outros_custos),
  }
  const total = calcularTotalOrcamento(componentes)

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
      valor_mao_de_obra: num(campos.valor_mao_de_obra),
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
            {valorField('Mão de obra R$', 'valor_mao_de_obra')}
            {valorField('Deslocamento R$', 'valor_deslocamento')}
            {valorField('Outros custos R$', 'outros_custos')}
          </div>
          <div className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800">
            Materiais {formatCurrency(componentes.valorMateriais)} + Margem{' '}
            {formatCurrency(componentes.valorMargemMateriais)} + Mão de obra{' '}
            {formatCurrency(componentes.valorMaoDeObra)} + Deslocamento{' '}
            {formatCurrency(componentes.valorDeslocamento)} + Outros{' '}
            {formatCurrency(componentes.outrosCustos)} ={' '}
            <span className="font-bold">{formatCurrency(total)}</span>
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
