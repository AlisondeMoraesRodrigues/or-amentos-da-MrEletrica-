import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Loading } from '@/components/ui/Loading'
import { TextField } from '@/components/ui/TextField'
import { SelectField } from '@/components/ui/SelectField'
import { useAsync } from '@/hooks/useAsync'
import {
  createMaterial,
  getMaterial,
  updateMaterial,
  type NovoMaterial,
} from '@/services/materiaisService'
import { getConfiguracao } from '@/services/configuracoesService'
import { MARGEM_PADRAO, MARGENS_PRESET, UNIDADE_LABEL, UNIDADE_ORDEM } from '@/config/material'
import { aplicarMargem, margemImplicita, valorDaMargem } from '@/utils/margem'
import { formatCurrency, formatNumber } from '@/utils/format'
import type { MaterialUnidade } from '@/types/database'

type Campos = {
  nome: string
  quantidade: string
  unidade: MaterialUnidade
  valor_custo: string
  margem: string
  valor_cobrado: string
}

function num(valor: string): number {
  const n = Number.parseFloat(valor.replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

const PRESETS: readonly number[] = MARGENS_PRESET

export default function MaterialFormPage() {
  const { id: servicoId = '', materialId } = useParams<{ id: string; materialId?: string }>()
  const editando = Boolean(materialId)
  const navigate = useNavigate()
  const voltar = `/servicos/${servicoId}`

  const { data: config, loading: carregandoConfig } = useAsync(() => getConfiguracao(), [])
  const margemPadrao = config?.margem_padrao_materiais ?? MARGEM_PADRAO

  const [campos, setCampos] = useState<Campos>(() => ({
    nome: '',
    quantidade: '1',
    unidade: 'un',
    valor_custo: '',
    margem: String(MARGEM_PADRAO),
    valor_cobrado: '',
  }))
  const [cobradoManual, setCobradoManual] = useState(false)
  const [margemOutra, setMargemOutra] = useState(false)
  const [carregando, setCarregando] = useState(editando)
  const [inicializado, setInicializado] = useState(editando)
  const [erroCarga, setErroCarga] = useState('')
  const [erros, setErros] = useState<Partial<Record<keyof Campos, string>>>({})
  const [erroGeral, setErroGeral] = useState('')
  const [salvando, setSalvando] = useState(false)

  // Ao criar: usa a margem padrão da configuração assim que ela carrega.
  useEffect(() => {
    if (!materialId && config && !inicializado) {
      setCampos((c) => ({ ...c, margem: String(margemPadrao) }))
      setMargemOutra(!PRESETS.includes(margemPadrao))
      setInicializado(true)
    }
  }, [materialId, config, inicializado, margemPadrao])

  useEffect(() => {
    if (!materialId) return
    let ativo = true
    setCarregando(true)
    getMaterial(materialId)
      .then((m) => {
        if (!ativo) return
        if (!m) {
          setErroCarga('Material não encontrado.')
          return
        }
        const cobradoCalculado = aplicarMargem(m.valor_custo, m.margem_percentual)
        const manual = Math.abs(cobradoCalculado - m.valor_cobrado) > 0.005
        setCampos({
          nome: m.nome,
          quantidade: String(m.quantidade),
          unidade: m.unidade,
          valor_custo: m.valor_custo ? String(m.valor_custo) : '',
          margem: String(m.margem_percentual),
          valor_cobrado: manual && m.valor_cobrado ? String(m.valor_cobrado) : '',
        })
        setCobradoManual(manual)
        setMargemOutra(!PRESETS.includes(m.margem_percentual))
      })
      .catch((e: unknown) =>
        setErroCarga(e instanceof Error ? e.message : 'Não foi possível carregar o material.'),
      )
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [materialId])

  function set<K extends keyof Campos>(chave: K, valor: Campos[K]) {
    setCampos((c) => ({ ...c, [chave]: valor }))
  }

  const custoUnit = num(campos.valor_custo)
  const qtd = num(campos.quantidade)
  const margemSelecionada = num(campos.margem)

  const cobradoUnit = cobradoManual
    ? num(campos.valor_cobrado)
    : aplicarMargem(custoUnit, margemSelecionada)
  const margemEfetiva = cobradoManual
    ? margemImplicita(custoUnit, cobradoUnit)
    : margemSelecionada

  const resumo = useMemo(
    () => ({
      custoTotal: custoUnit * qtd,
      cobradoTotal: cobradoUnit * qtd,
      valorMargemTotal: (cobradoUnit - custoUnit) * qtd,
    }),
    [custoUnit, cobradoUnit, qtd],
  )

  const cobradoFieldValue = cobradoManual
    ? campos.valor_cobrado
    : custoUnit > 0
      ? formatNumber(cobradoUnit)
      : ''

  function escolherMargem(valor: number) {
    setMargemOutra(false)
    setCobradoManual(false)
    set('margem', String(valor))
  }

  function validar(): boolean {
    const next: Partial<Record<keyof Campos, string>> = {}
    if (!campos.nome.trim()) next.nome = 'Informe o nome do material.'
    if (num(campos.quantidade) <= 0) next.quantidade = 'Quantidade deve ser maior que zero.'
    setErros(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErroGeral('')
    if (!validar()) return

    const payload: NovoMaterial = {
      servico_id: servicoId || null,
      nome: campos.nome.trim(),
      quantidade: qtd,
      unidade: campos.unidade,
      valor_custo: custoUnit,
      margem_percentual: margemEfetiva,
      valor_cobrado: cobradoUnit,
    }

    setSalvando(true)
    try {
      if (materialId) await updateMaterial(materialId, payload)
      else await createMaterial(payload)
      navigate(voltar, { replace: true })
    } catch (err) {
      setErroGeral(err instanceof Error ? err.message : 'Não foi possível salvar o material.')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando || carregandoConfig) return <Loading label="Carregando material…" />

  if (erroCarga) {
    return (
      <div className="space-y-4">
        <PageHeader title="Material" />
        <Alert tone="error">{erroCarga}</Alert>
        <Button variant="ghost" onClick={() => navigate(voltar)}>
          Voltar para o serviço
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={editando ? 'Editar material' : 'Novo material'}
        subtitle="Material do serviço"
      />

      {erroGeral && <Alert tone="error">{erroGeral}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Card className="space-y-3">
          <TextField
            label="Nome do material *"
            name="nome"
            value={campos.nome}
            onChange={(e) => set('nome', e.target.value)}
            error={erros.nome}
            placeholder="Ex.: Disjuntor bipolar 40A"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Quantidade"
              name="quantidade"
              type="number"
              min={0}
              step="0.001"
              inputMode="decimal"
              value={campos.quantidade}
              onChange={(e) => set('quantidade', e.target.value)}
              error={erros.quantidade}
            />
            <SelectField
              label="Unidade"
              name="unidade"
              value={campos.unidade}
              onChange={(e) => set('unidade', e.target.value as MaterialUnidade)}
            >
              {UNIDADE_ORDEM.map((u) => (
                <option key={u} value={u}>
                  {UNIDADE_LABEL[u]} ({u})
                </option>
              ))}
            </SelectField>
          </div>
          <TextField
            label="Valor de custo (R$ / unidade)"
            name="valor_custo"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={campos.valor_custo}
            onChange={(e) => set('valor_custo', e.target.value)}
          />
        </Card>

        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Margem</h2>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => escolherMargem(p)}
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  !margemOutra && !cobradoManual && margemSelecionada === p
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200'
                }`}
              >
                {p}%
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setMargemOutra(true)
                setCobradoManual(false)
              }}
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                margemOutra ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'
              }`}
            >
              Outra
            </button>
          </div>

          {margemOutra && (
            <TextField
              label="Margem personalizada (%)"
              name="margem"
              type="number"
              min={0}
              step="1"
              inputMode="decimal"
              value={campos.margem}
              onChange={(e) => {
                setCobradoManual(false)
                set('margem', e.target.value)
              }}
            />
          )}

          <TextField
            label="Valor cobrado (R$ / unidade)"
            name="valor_cobrado"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={cobradoFieldValue}
            onChange={(e) => {
              setCobradoManual(true)
              set('valor_cobrado', e.target.value)
            }}
          />
          {cobradoManual ? (
            <p className="text-xs text-slate-400">
              Valor definido manualmente (margem ≈ {formatNumber(margemEfetiva, 1)}%).{' '}
              <button
                type="button"
                onClick={() => setCobradoManual(false)}
                className="font-semibold text-brand-600 underline"
              >
                Recalcular pela margem
              </button>
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Calculado: custo + {formatNumber(margemSelecionada, 1)}% de margem.
              {editando ? '' : ` Padrão da empresa: ${formatNumber(margemPadrao, 1)}%.`}
            </p>
          )}
        </Card>

        <Card className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">
              Custo ({formatNumber(qtd)} × {formatCurrency(custoUnit)})
            </span>
            <span className="font-medium">{formatCurrency(resumo.custoTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">
              Margem ({formatNumber(margemEfetiva, 1)}%)
            </span>
            <span className="font-medium">
              {formatCurrency(valorDaMargem(custoUnit, margemEfetiva) * qtd)}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-1 text-base font-bold text-ink-900">
            <span>Valor cobrado</span>
            <span>{formatCurrency(resumo.cobradoTotal)}</span>
          </div>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={() => navigate(voltar)}
            disabled={salvando}
          >
            Cancelar
          </Button>
          <Button type="submit" fullWidth disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar material'}
          </Button>
        </div>
      </form>
    </div>
  )
}
