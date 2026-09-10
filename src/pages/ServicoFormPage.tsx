import { useEffect, useMemo, useState, type FormEvent } from 'react'
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
import { getConfiguracao } from '@/services/configuracoesService'
import { createServico, getServico, updateServico, type NovoServico } from '@/services/servicosService'
import {
  SERVICO_STATUS_META,
  SERVICO_STATUS_ORDEM,
  TIPO_HORA_META,
  TIPO_HORA_ORDEM,
  valorHoraDaConfig,
} from '@/config/servico'
import { calcularMaoDeObra } from '@/utils/maoDeObra'
import { AIService } from '@/services/aiService'
import { formatCurrency } from '@/utils/format'
import type { ServicoStatus, TipoHora } from '@/types/database'

type Campos = {
  cliente_id: string
  descricao: string
  descricao_livre: string
  data_servico: string
  quantidade_tecnicos: string
  horas_trabalhadas: string
  tipo_hora: TipoHora
  valor_hora_aplicado: string
  quantidade_ajudantes: string
  horas_ajudantes: string
  valor_hora_ajudante: string
  taxa_deslocamento: string
  outros_custos: string
  status: ServicoStatus
}

const HOJE = new Date().toISOString().slice(0, 10)

const VAZIO: Campos = {
  cliente_id: '',
  descricao: '',
  descricao_livre: '',
  data_servico: HOJE,
  quantidade_tecnicos: '1',
  horas_trabalhadas: '',
  tipo_hora: 'tecnica',
  valor_hora_aplicado: '',
  quantidade_ajudantes: '0',
  horas_ajudantes: '',
  valor_hora_ajudante: '',
  taxa_deslocamento: '',
  outros_custos: '',
  status: 'aberto',
}

function num(valor: string): number {
  const n = Number.parseFloat(valor.replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

function limpar(valor: string): string | null {
  const v = valor.trim()
  return v === '' ? null : v
}

export default function ServicoFormPage() {
  const { id } = useParams<{ id: string }>()
  const editando = Boolean(id)
  const navigate = useNavigate()

  const { data: apoio, loading: carregandoApoio } = useAsync(
    async () => {
      const [clientes, config] = await Promise.all([listClientes(), getConfiguracao()])
      return { clientes, config }
    },
    [],
  )

  const [campos, setCampos] = useState<Campos>(VAZIO)
  const [carregando, setCarregando] = useState(editando)
  const [erroCarga, setErroCarga] = useState('')
  const [erros, setErros] = useState<Partial<Record<keyof Campos, string>>>({})
  const [erroGeral, setErroGeral] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [gerandoDescricao, setGerandoDescricao] = useState(false)

  useEffect(() => {
    if (!id) return
    let ativo = true
    setCarregando(true)
    getServico(id)
      .then((s) => {
        if (!ativo) return
        if (!s) {
          setErroCarga('Serviço não encontrado.')
          return
        }
        setCampos({
          cliente_id: s.cliente_id ?? '',
          descricao: s.descricao ?? '',
          descricao_livre: s.descricao_livre ?? '',
          data_servico: s.data_servico ?? '',
          quantidade_tecnicos: String(s.quantidade_tecnicos ?? 1),
          horas_trabalhadas: String(s.horas_trabalhadas ?? ''),
          tipo_hora: s.tipo_hora,
          valor_hora_aplicado: s.valor_hora_aplicado ? String(s.valor_hora_aplicado) : '',
          quantidade_ajudantes: String(s.quantidade_ajudantes ?? 0),
          horas_ajudantes: s.horas_ajudantes ? String(s.horas_ajudantes) : '',
          valor_hora_ajudante: s.valor_hora_ajudante ? String(s.valor_hora_ajudante) : '',
          taxa_deslocamento: s.taxa_deslocamento ? String(s.taxa_deslocamento) : '',
          outros_custos: s.outros_custos ? String(s.outros_custos) : '',
          status: s.status,
        })
      })
      .catch((e: unknown) =>
        setErroCarga(e instanceof Error ? e.message : 'Não foi possível carregar o serviço.'),
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

  const resultado = useMemo(() => {
    if (!apoio) return null
    return calcularMaoDeObra(
      {
        tecnicos: {
          quantidade: num(campos.quantidade_tecnicos),
          horas: num(campos.horas_trabalhadas),
          tipoHora: campos.tipo_hora,
          valorHoraInformado:
            campos.valor_hora_aplicado.trim() === '' ? null : num(campos.valor_hora_aplicado),
        },
        ajudantes: {
          quantidade: num(campos.quantidade_ajudantes),
          horas: num(campos.horas_ajudantes),
          valorHoraInformado:
            campos.valor_hora_ajudante.trim() === '' ? null : num(campos.valor_hora_ajudante),
        },
      },
      apoio.config,
    )
  }, [
    apoio,
    campos.quantidade_tecnicos,
    campos.horas_trabalhadas,
    campos.tipo_hora,
    campos.valor_hora_aplicado,
    campos.quantidade_ajudantes,
    campos.horas_ajudantes,
    campos.valor_hora_ajudante,
  ])

  const valorHoraConfig = apoio ? valorHoraDaConfig(apoio.config, campos.tipo_hora) : 0
  const valorHoraAjudanteConfig =
    apoio && typeof apoio.config.valor_hora_auxiliar === 'number'
      ? apoio.config.valor_hora_auxiliar
      : 0

  async function gerarDescricao() {
    if (!campos.descricao_livre.trim()) return
    setGerandoDescricao(true)
    setErroGeral('')
    try {
      const texto = await AIService.gerarDescricaoServico({
        textoLivre: campos.descricao_livre,
        quantidadeTecnicos: num(campos.quantidade_tecnicos) || undefined,
        horasTrabalhadas: num(campos.horas_trabalhadas) || undefined,
        quantidadeAjudantes: num(campos.quantidade_ajudantes) || undefined,
        horasAjudantes: num(campos.horas_ajudantes) || undefined,
      })
      if (texto) set('descricao', texto)
    } catch (err) {
      setErroGeral(err instanceof Error ? err.message : 'Não foi possível gerar a descrição.')
    } finally {
      setGerandoDescricao(false)
    }
  }

  function validar(): boolean {
    const next: Partial<Record<keyof Campos, string>> = {}
    if (!campos.descricao.trim()) next.descricao = 'Descreva o serviço.'
    if (num(campos.quantidade_tecnicos) < 1) next.quantidade_tecnicos = 'Mínimo 1 técnico.'
    if (num(campos.horas_trabalhadas) < 0) next.horas_trabalhadas = 'Valor inválido.'
    if (num(campos.quantidade_ajudantes) < 0) next.quantidade_ajudantes = 'Valor inválido.'
    if (num(campos.horas_ajudantes) < 0) next.horas_ajudantes = 'Valor inválido.'
    setErros(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErroGeral('')
    if (!validar() || !resultado) return

    const payload: NovoServico = {
      cliente_id: campos.cliente_id || null,
      descricao: campos.descricao.trim(),
      descricao_livre: limpar(campos.descricao_livre),
      data_servico: campos.data_servico || null,
      quantidade_tecnicos: resultado.tecnicos.quantidade || 1,
      horas_trabalhadas: resultado.tecnicos.horas,
      tipo_hora: campos.tipo_hora,
      valor_hora_aplicado: resultado.tecnicos.valorHora,
      quantidade_ajudantes: resultado.ajudantes.quantidade,
      horas_ajudantes: resultado.ajudantes.horas,
      valor_hora_ajudante: resultado.ajudantes.valorHora,
      valor_mao_de_obra: resultado.valorMaoDeObra,
      taxa_deslocamento: num(campos.taxa_deslocamento),
      outros_custos: num(campos.outros_custos),
      status: campos.status,
    }

    setSalvando(true)
    try {
      const salvo = id ? await updateServico(id, payload) : await createServico(payload)
      navigate(`/servicos/${salvo.id}`, { replace: true })
    } catch (err) {
      setErroGeral(err instanceof Error ? err.message : 'Não foi possível salvar o serviço.')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando || carregandoApoio) return <Loading label="Carregando…" />

  if (erroCarga) {
    return (
      <div className="space-y-4">
        <PageHeader title="Editar serviço" />
        <Alert tone="error">{erroCarga}</Alert>
        <Button variant="ghost" onClick={() => navigate('/servicos')}>
          Voltar para serviços
        </Button>
      </div>
    )
  }

  const clientes = apoio?.clientes ?? []

  return (
    <div className="space-y-4">
      <PageHeader
        title={editando ? 'Editar serviço' : 'Novo serviço'}
        subtitle={editando ? campos.descricao : 'Registre o serviço realizado'}
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
          {clientes.length === 0 && (
            <p className="text-xs text-slate-400">
              Nenhum cliente cadastrado.{' '}
              <Link to="/clientes/novo" className="font-semibold text-brand-600 underline">
                Cadastrar cliente
              </Link>
            </p>
          )}

          <TextAreaField
            label="Descrição do serviço *"
            name="descricao"
            value={campos.descricao}
            onChange={(e) => set('descricao', e.target.value)}
            error={erros.descricao}
            placeholder="Ex.: Troca de 3 disjuntores e revisão do quadro de distribuição."
          />
          <TextAreaField
            label="Anotações / descrição livre (opcional)"
            name="descricao_livre"
            value={campos.descricao_livre}
            onChange={(e) => set('descricao_livre', e.target.value)}
            placeholder="Escreva com suas palavras. Ex.: troquei 3 disjuntores e revisei o quadro, 4 horas de trabalho."
          />
          <button
            type="button"
            onClick={gerarDescricao}
            disabled={gerandoDescricao || !campos.descricao_livre.trim()}
            className="text-xs font-semibold text-brand-600 underline disabled:opacity-50"
          >
            {gerandoDescricao ? 'Gerando…' : '✨ Gerar descrição a partir das anotações'}
          </button>

          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Data do serviço"
              name="data_servico"
              type="date"
              value={campos.data_servico}
              onChange={(e) => set('data_servico', e.target.value)}
            />
            <SelectField
              label="Status"
              name="status"
              value={campos.status}
              onChange={(e) => set('status', e.target.value as ServicoStatus)}
            >
              {SERVICO_STATUS_ORDEM.map((s) => (
                <option key={s} value={s}>
                  {SERVICO_STATUS_META[s].label}
                </option>
              ))}
            </SelectField>
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Mão de obra</h2>

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Técnicos</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Quantidade de técnicos"
              name="quantidade_tecnicos"
              type="number"
              min={1}
              inputMode="numeric"
              value={campos.quantidade_tecnicos}
              onChange={(e) => set('quantidade_tecnicos', e.target.value)}
              error={erros.quantidade_tecnicos}
            />
            <TextField
              label="Horas dos técnicos"
              name="horas_trabalhadas"
              type="number"
              min={0}
              step="0.5"
              inputMode="decimal"
              value={campos.horas_trabalhadas}
              onChange={(e) => set('horas_trabalhadas', e.target.value)}
              error={erros.horas_trabalhadas}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              label="Tipo de hora"
              name="tipo_hora"
              value={campos.tipo_hora}
              onChange={(e) => set('tipo_hora', e.target.value as TipoHora)}
            >
              {TIPO_HORA_ORDEM.map((t) => (
                <option key={t} value={t}>
                  {TIPO_HORA_META[t].label}
                </option>
              ))}
            </SelectField>
            <div>
              <TextField
                label="Valor da hora do técnico (R$) — opcional"
                name="valor_hora_aplicado"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={campos.valor_hora_aplicado}
                onChange={(e) => set('valor_hora_aplicado', e.target.value)}
                placeholder={valorHoraConfig ? formatCurrency(valorHoraConfig) : '0,00'}
              />
              <p className="mt-1 text-xs text-slate-400">
                Vazio = usa a configuração ({TIPO_HORA_META[campos.tipo_hora].label}:{' '}
                {formatCurrency(valorHoraConfig)}).
              </p>
            </div>
          </div>

          <p className="border-t border-slate-100 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Ajudantes <span className="lowercase text-slate-300">(deixe 0 se trabalhou sozinho)</span>
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Quantidade de ajudantes"
              name="quantidade_ajudantes"
              type="number"
              min={0}
              inputMode="numeric"
              value={campos.quantidade_ajudantes}
              onChange={(e) => set('quantidade_ajudantes', e.target.value)}
              error={erros.quantidade_ajudantes}
            />
            <TextField
              label="Horas dos ajudantes"
              name="horas_ajudantes"
              type="number"
              min={0}
              step="0.5"
              inputMode="decimal"
              value={campos.horas_ajudantes}
              onChange={(e) => set('horas_ajudantes', e.target.value)}
              error={erros.horas_ajudantes}
            />
          </div>
          <div>
            <TextField
              label="Valor da hora do ajudante (R$) — opcional"
              name="valor_hora_ajudante"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={campos.valor_hora_ajudante}
              onChange={(e) => set('valor_hora_ajudante', e.target.value)}
              placeholder={valorHoraAjudanteConfig ? formatCurrency(valorHoraAjudanteConfig) : '0,00'}
            />
            <p className="mt-1 text-xs text-slate-400">
              Vazio = usa a configuração (Auxiliar: {formatCurrency(valorHoraAjudanteConfig)}).
            </p>
          </div>

          {resultado && (
            <div className="space-y-1 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800">
              <div>
                Técnicos: {resultado.tecnicos.quantidade} × {resultado.tecnicos.horas}h ×{' '}
                {formatCurrency(resultado.tecnicos.valorHora)}
                {resultado.tecnicos.origemValorHora === 'configuracao' && (
                  <span className="text-brand-500"> (config.)</span>
                )}{' '}
                = {formatCurrency(resultado.tecnicos.subtotal)}
              </div>
              {resultado.ajudantes.quantidade > 0 && resultado.ajudantes.horas > 0 && (
                <div>
                  Ajudantes: {resultado.ajudantes.quantidade} × {resultado.ajudantes.horas}h ×{' '}
                  {formatCurrency(resultado.ajudantes.valorHora)}
                  {resultado.ajudantes.origemValorHora === 'configuracao' && (
                    <span className="text-brand-500"> (config.)</span>
                  )}{' '}
                  = {formatCurrency(resultado.ajudantes.subtotal)}
                </div>
              )}
              <div className="border-t border-brand-200 pt-1 font-bold">
                Total mão de obra = {formatCurrency(resultado.valorMaoDeObra)}
              </div>
            </div>
          )}
        </Card>

        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Outros custos</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Taxa de deslocamento (R$)"
              name="taxa_deslocamento"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={campos.taxa_deslocamento}
              onChange={(e) => set('taxa_deslocamento', e.target.value)}
            />
            <TextField
              label="Outros custos (R$)"
              name="outros_custos"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={campos.outros_custos}
              onChange={(e) => set('outros_custos', e.target.value)}
            />
          </div>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={() => navigate(id ? `/servicos/${id}` : '/servicos')}
            disabled={salvando}
          >
            Cancelar
          </Button>
          <Button type="submit" fullWidth disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar serviço'}
          </Button>
        </div>
      </form>
    </div>
  )
}
