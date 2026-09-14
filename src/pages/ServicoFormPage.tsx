import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
import { listMateriais, deleteMaterial } from '@/services/materiaisService'
import { ClienteSeletor } from '@/components/cliente/ClienteSeletor'
import { ClienteQuickCreateModal } from '@/components/cliente/ClienteQuickCreateModal'
import { NotaMaterialCapture } from '@/components/servico/NotaMaterialCapture'
import { EquipeServicoEditor } from '@/components/servico/EquipeServicoEditor'
import {
  FORMA_COBRANCA_META,
  FORMA_COBRANCA_ORDEM,
  SERVICO_STATUS_META,
  SERVICO_STATUS_ORDEM,
  TIPO_HORA_META,
  TIPO_HORA_ORDEM,
  valorHoraDaConfig,
} from '@/config/servico'
import { calcularMaoDeObra } from '@/utils/maoDeObra'
import { calcularLucro } from '@/utils/lucro'
import { AIService } from '@/services/aiService'
import { formatCurrency, formatNumber } from '@/utils/format'
import type {
  ClienteRow,
  FormaCobranca,
  MaterialRow,
  ServicoFuncionarioRow,
  ServicoStatus,
  TipoHora,
} from '@/types/database'

type Campos = {
  cliente_id: string
  descricao: string
  descricao_livre: string
  data_servico: string
  forma_cobranca: FormaCobranca
  quantidade_tecnicos: string
  horas_trabalhadas: string
  tipo_hora: TipoHora
  valor_hora_aplicado: string
  quantidade_ajudantes: string
  horas_ajudantes: string
  valor_hora_ajudante: string
  valor_fechado: string
  custo_mao_de_obra: string
  taxa_deslocamento: string
  outros_custos: string
  km_inicial: string
  km_final: string
  combustivel_valor: string
  pedagio: string
  estacionamento_valor: string
  status: ServicoStatus
}

const HOJE = new Date().toISOString().slice(0, 10)

const VAZIO: Campos = {
  cliente_id: '',
  descricao: '',
  descricao_livre: '',
  data_servico: HOJE,
  forma_cobranca: 'hora',
  quantidade_tecnicos: '1',
  horas_trabalhadas: '',
  tipo_hora: 'tecnica',
  valor_hora_aplicado: '',
  quantidade_ajudantes: '0',
  horas_ajudantes: '',
  valor_hora_ajudante: '',
  valor_fechado: '',
  custo_mao_de_obra: '',
  taxa_deslocamento: '',
  outros_custos: '',
  km_inicial: '',
  km_final: '',
  combustivel_valor: '',
  pedagio: '',
  estacionamento_valor: '',
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

  // Rascunho: o serviço pode ser criado "por baixo dos panos" assim que o
  // usuário adiciona uma foto de material ou um funcionário — sem isso, não
  // haveria onde vincular essas informações antes de "Salvar serviço".
  const [servicoIdAtual, setServicoIdAtual] = useState<string | null>(id ?? null)
  const [materiais, setMateriais] = useState<MaterialRow[]>([])
  const [equipe, setEquipe] = useState<ServicoFuncionarioRow[]>([])
  const [mostrarNovoCliente, setMostrarNovoCliente] = useState(false)
  const [nomeClienteDigitado, setNomeClienteDigitado] = useState('')
  const [clientesExtras, setClientesExtras] = useState<ClienteRow[]>([])

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
        const forma = s.forma_cobranca ?? 'hora'
        setCampos({
          cliente_id: s.cliente_id ?? '',
          descricao: s.descricao ?? '',
          descricao_livre: s.descricao_livre ?? '',
          data_servico: s.data_servico ?? '',
          forma_cobranca: forma,
          quantidade_tecnicos: String(s.quantidade_tecnicos ?? 1),
          horas_trabalhadas: String(s.horas_trabalhadas ?? ''),
          tipo_hora: s.tipo_hora,
          valor_hora_aplicado: s.valor_hora_aplicado ? String(s.valor_hora_aplicado) : '',
          quantidade_ajudantes: String(s.quantidade_ajudantes ?? 0),
          horas_ajudantes: s.horas_ajudantes ? String(s.horas_ajudantes) : '',
          valor_hora_ajudante: s.valor_hora_ajudante ? String(s.valor_hora_ajudante) : '',
          valor_fechado: forma === 'fechado' && s.valor_mao_de_obra ? String(s.valor_mao_de_obra) : '',
          custo_mao_de_obra: s.custo_mao_de_obra ? String(s.custo_mao_de_obra) : '',
          taxa_deslocamento: s.taxa_deslocamento ? String(s.taxa_deslocamento) : '',
          outros_custos: s.outros_custos ? String(s.outros_custos) : '',
          km_inicial: s.km_inicial ? String(s.km_inicial) : '',
          km_final: s.km_final ? String(s.km_final) : '',
          combustivel_valor: s.combustivel_valor ? String(s.combustivel_valor) : '',
          pedagio: s.pedagio ? String(s.pedagio) : '',
          estacionamento_valor: s.estacionamento_valor ? String(s.estacionamento_valor) : '',
          status: s.status,
        })
        setServicoIdAtual(s.id)
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

  const recarregarMateriais = useCallback(() => {
    if (!servicoIdAtual) return
    listMateriais({ servicoId: servicoIdAtual }).then(setMateriais).catch(() => undefined)
  }, [servicoIdAtual])

  useEffect(() => {
    recarregarMateriais()
  }, [recarregarMateriais])

  async function handleExcluirMaterial(materialId: string) {
    if (!window.confirm('Remover este material?')) return
    try {
      await deleteMaterial(materialId)
      recarregarMateriais()
    } catch (err) {
      setErroGeral(err instanceof Error ? err.message : 'Não foi possível remover o material.')
    }
  }

  /** Cria o serviço em segundo plano na primeira vez que algo precisa de um id
   * (foto de material, funcionário) — assim nada digitado se perde. */
  const ensureServicoDraft = useCallback(async (): Promise<string> => {
    if (servicoIdAtual) return servicoIdAtual
    const criado = await createServico({
      cliente_id: campos.cliente_id || null,
      descricao: campos.descricao.trim(),
      descricao_livre: limpar(campos.descricao_livre),
      data_servico: campos.data_servico || null,
      status: campos.status,
    })
    setServicoIdAtual(criado.id)
    return criado.id
  }, [servicoIdAtual, campos.cliente_id, campos.descricao, campos.descricao_livre, campos.data_servico, campos.status])

  const resultado = useMemo(() => {
    if (!apoio) return null
    return calcularMaoDeObra(
      {
        forma: campos.forma_cobranca,
        valorFechado: num(campos.valor_fechado),
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
    campos.forma_cobranca,
    campos.valor_fechado,
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

  const formaMeta = FORMA_COBRANCA_META[campos.forma_cobranca]

  const materiaisCobrado = materiais.reduce((s, m) => s + m.valor_cobrado * m.quantidade, 0)
  const materiaisCusto = materiais.reduce((s, m) => s + m.valor_custo * m.quantidade, 0)
  const custoEquipe = equipe.reduce((s, e) => s + e.custo, 0)
  const custoDeslocamentoInterno =
    num(campos.combustivel_valor) + num(campos.pedagio) + num(campos.estacionamento_valor)
  const kmRodados =
    campos.km_inicial.trim() && campos.km_final.trim()
      ? Math.max(0, num(campos.km_final) - num(campos.km_inicial))
      : null

  const resumo = resultado
    ? calcularLucro({
        maoDeObraCobrada: resultado.valorMaoDeObra,
        materiaisCobrado,
        materiaisCusto,
        deslocamento: num(campos.taxa_deslocamento),
        outrosCustos: num(campos.outros_custos),
        custoMaoDeObra: num(campos.custo_mao_de_obra) + custoEquipe + custoDeslocamentoInterno,
      })
    : null

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
      forma_cobranca: campos.forma_cobranca,
      quantidade_tecnicos: resultado.tecnicos.quantidade || 1,
      horas_trabalhadas: resultado.tecnicos.horas,
      tipo_hora: campos.tipo_hora,
      valor_hora_aplicado: resultado.tecnicos.valorHora,
      quantidade_ajudantes: resultado.ajudantes.quantidade,
      horas_ajudantes: resultado.ajudantes.horas,
      valor_hora_ajudante: resultado.ajudantes.valorHora,
      custo_mao_de_obra: num(campos.custo_mao_de_obra),
      valor_mao_de_obra: resultado.valorMaoDeObra,
      taxa_deslocamento: num(campos.taxa_deslocamento),
      outros_custos: num(campos.outros_custos),
      km_inicial: campos.km_inicial.trim() ? num(campos.km_inicial) : null,
      km_final: campos.km_final.trim() ? num(campos.km_final) : null,
      combustivel_valor: num(campos.combustivel_valor),
      pedagio: num(campos.pedagio),
      estacionamento_valor: num(campos.estacionamento_valor),
      status: campos.status,
    }

    setSalvando(true)
    try {
      const salvo = servicoIdAtual
        ? await updateServico(servicoIdAtual, payload)
        : await createServico(payload)
      navigate(`/servicos/${salvo.id}`, { replace: true, state: { salvo: true } })
    } catch (err) {
      setErroGeral(err instanceof Error ? err.message : 'Não foi possível salvar o serviço.')
    } finally {
      setSalvando(false)
    }
  }

  const clientes = useMemo(() => {
    const base = apoio?.clientes ?? []
    const extrasNovos = clientesExtras.filter((c) => !base.some((b) => b.id === c.id))
    return [...extrasNovos, ...base]
  }, [apoio, clientesExtras])

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

  return (
    <div className="space-y-4">
      <PageHeader
        title={editando ? 'Editar serviço' : 'Novo serviço'}
        subtitle={editando ? campos.descricao : 'Registre o serviço realizado'}
      />

      {erroGeral && <Alert tone="error">{erroGeral}</Alert>}

      {mostrarNovoCliente && (
        <ClienteQuickCreateModal
          nomeInicial={nomeClienteDigitado}
          onCancelar={() => setMostrarNovoCliente(false)}
          onCriado={(cliente) => {
            setClientesExtras((lista) => [cliente, ...lista])
            set('cliente_id', cliente.id)
            setMostrarNovoCliente(false)
          }}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Card className="space-y-3">
          <ClienteSeletor
            clientes={clientes}
            value={campos.cliente_id}
            onChange={(cid) => set('cliente_id', cid)}
            onNovoCliente={(nomeDigitado) => {
              setNomeClienteDigitado(nomeDigitado)
              setMostrarNovoCliente(true)
            }}
          />

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

        <NotaMaterialCapture
          servicoId={servicoIdAtual}
          onNeedServicoId={ensureServicoDraft}
          onMateriaisSalvos={recarregarMateriais}
          precoReferenciaConfig={apoio?.config.preco_referencia_material ?? 'maior'}
          margemPadrao={apoio?.config.margem_padrao_materiais ?? 20}
        />

        {materiais.length > 0 && (
          <Card className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-700">Materiais adicionados ({materiais.length})</h2>
            <ul className="divide-y divide-slate-100">
              {materiais.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-ink-900">{m.nome}</p>
                    <p className="text-xs text-slate-400">
                      {m.quantidade} {m.unidade} × {formatCurrency(m.valor_cobrado)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-medium">{formatCurrency(m.valor_cobrado * m.quantidade)}</span>
                    <button
                      type="button"
                      onClick={() => handleExcluirMaterial(m.id)}
                      className="text-xs font-semibold text-red-600 underline"
                    >
                      Excluir
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-bold text-ink-900">
              <span>Total materiais</span>
              <span>{formatCurrency(materiaisCobrado)}</span>
            </div>
          </Card>
        )}

        <EquipeServicoEditor
          servicoId={servicoIdAtual}
          onNeedServicoId={ensureServicoDraft}
          diariaPadrao={apoio?.config.diaria_padrao ?? 130}
          onEquipeChange={setEquipe}
        />

        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">🚚 Deslocamento e combustível</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="KM inicial"
              type="number"
              min={0}
              step="0.1"
              inputMode="decimal"
              value={campos.km_inicial}
              onChange={(e) => set('km_inicial', e.target.value)}
            />
            <TextField
              label="KM final"
              type="number"
              min={0}
              step="0.1"
              inputMode="decimal"
              value={campos.km_final}
              onChange={(e) => set('km_final', e.target.value)}
            />
          </div>
          {kmRodados !== null && (
            <p className="text-xs text-slate-400">{formatNumber(kmRodados, 1)} km rodados.</p>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <TextField
              label="Combustível (R$)"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={campos.combustivel_valor}
              onChange={(e) => set('combustivel_valor', e.target.value)}
            />
            <TextField
              label="Pedágio (R$)"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={campos.pedagio}
              onChange={(e) => set('pedagio', e.target.value)}
            />
            <TextField
              label="Estacionamento (R$)"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={campos.estacionamento_valor}
              onChange={(e) => set('estacionamento_valor', e.target.value)}
            />
          </div>
          {apoio && apoio.config.gasto_semanal_camionete > 0 && (
            <p className="text-xs text-slate-400">
              Orçamento semanal da camionete: {formatCurrency(apoio.config.gasto_semanal_camionete)}{' '}
              (ajuste em Configurações). Esse valor não é lançado automaticamente aqui.
            </p>
          )}
          {custoDeslocamentoInterno > 0 && (
            <p className="text-sm font-semibold text-ink-900">
              Custo de deslocamento: {formatCurrency(custoDeslocamentoInterno)}
            </p>
          )}
        </Card>

        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Mão de obra</h2>

          <div>
            <span className="mb-1 block text-xs font-medium text-slate-500">Como cobrar?</span>
            <div className="grid grid-cols-3 gap-2">
              {FORMA_COBRANCA_ORDEM.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => set('forma_cobranca', f)}
                  className={`rounded-lg px-2 py-2 text-sm font-semibold ${
                    campos.forma_cobranca === f
                      ? 'bg-brand-600 text-white'
                      : 'bg-white text-slate-600 ring-1 ring-slate-200'
                  }`}
                >
                  {FORMA_COBRANCA_META[f].label}
                </button>
              ))}
            </div>
          </div>

          {campos.forma_cobranca === 'fechado' ? (
            <TextField
              label="Valor da mão de obra (R$)"
              name="valor_fechado"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={campos.valor_fechado}
              onChange={(e) => set('valor_fechado', e.target.value)}
            />
          ) : (
            <>
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
                  label={`${formaMeta.unidade} dos técnicos`}
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
                    label={`Valor da ${campos.forma_cobranca === 'diaria' ? 'diária' : 'hora'} do técnico (R$) — opcional`}
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
                    {formatCurrency(valorHoraConfig)}
                    {campos.forma_cobranca === 'diaria' ? ' / h' : ''}).
                  </p>
                </div>
              </div>

              <p className="border-t border-slate-100 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Ajudantes{' '}
                <span className="lowercase text-slate-300">(deixe 0 se trabalhou sozinho)</span>
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
                  label={`${formaMeta.unidade} dos ajudantes`}
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
                  label={`Valor da ${campos.forma_cobranca === 'diaria' ? 'diária' : 'hora'} do ajudante (R$) — opcional`}
                  name="valor_hora_ajudante"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={campos.valor_hora_ajudante}
                  onChange={(e) => set('valor_hora_ajudante', e.target.value)}
                  placeholder={
                    valorHoraAjudanteConfig ? formatCurrency(valorHoraAjudanteConfig) : '0,00'
                  }
                />
                <p className="mt-1 text-xs text-slate-400">
                  Vazio = usa a configuração (Auxiliar: {formatCurrency(valorHoraAjudanteConfig)}).
                </p>
              </div>
            </>
          )}

          {resultado && (
            <div className="space-y-1 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800">
              {campos.forma_cobranca === 'fechado' ? (
                <div className="font-bold">
                  Mão de obra (valor fechado) = {formatCurrency(resultado.valorMaoDeObra)}
                </div>
              ) : (
                <>
                  <div>
                    Técnicos: {resultado.tecnicos.quantidade} × {formatNumber(resultado.tecnicos.horas)}
                    {formaMeta.unidadeCurta} × {formatCurrency(resultado.tecnicos.valorHora)}
                    {resultado.tecnicos.origemValorHora === 'configuracao' && (
                      <span className="text-brand-500"> (config.)</span>
                    )}{' '}
                    = {formatCurrency(resultado.tecnicos.subtotal)}
                  </div>
                  {resultado.ajudantes.quantidade > 0 && resultado.ajudantes.horas > 0 && (
                    <div>
                      Ajudantes: {resultado.ajudantes.quantidade} ×{' '}
                      {formatNumber(resultado.ajudantes.horas)}
                      {formaMeta.unidadeCurta} × {formatCurrency(resultado.ajudantes.valorHora)}
                      {resultado.ajudantes.origemValorHora === 'configuracao' && (
                        <span className="text-brand-500"> (config.)</span>
                      )}{' '}
                      = {formatCurrency(resultado.ajudantes.subtotal)}
                    </div>
                  )}
                  <div className="border-t border-brand-200 pt-1 font-bold">
                    Total mão de obra = {formatCurrency(resultado.valorMaoDeObra)}
                  </div>
                </>
              )}
            </div>
          )}
        </Card>

        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Outros custos</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Taxa de deslocamento cobrada (R$)"
              name="taxa_deslocamento"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={campos.taxa_deslocamento}
              onChange={(e) => set('taxa_deslocamento', e.target.value)}
            />
            <TextField
              label="Outros custos cobrados (R$)"
              name="outros_custos"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={campos.outros_custos}
              onChange={(e) => set('outros_custos', e.target.value)}
            />
          </div>
          <TextField
            label="Outras despesas (R$) — o que você paga, não cobra do cliente"
            name="custo_mao_de_obra"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={campos.custo_mao_de_obra}
            onChange={(e) => set('custo_mao_de_obra', e.target.value)}
          />
        </Card>

        {resumo && (
          <Card className="space-y-1">
            <h2 className="mb-1 text-sm font-semibold text-slate-700">Resumo</h2>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Cliente</span>
              <span className="font-medium text-ink-900">
                {clientes.find((c) => c.id === campos.cliente_id)?.nome ?? 'Sem cliente'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Materiais</span>
              <span className="font-medium">{formatCurrency(materiaisCobrado)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Mão de obra</span>
              <span className="font-medium">{formatCurrency(resultado?.valorMaoDeObra ?? 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Deslocamento cobrado</span>
              <span className="font-medium">{formatCurrency(num(campos.taxa_deslocamento))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Outros custos cobrados</span>
              <span className="font-medium">{formatCurrency(num(campos.outros_custos))}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-ink-900">
              <span>Valor total (cliente)</span>
              <span>{formatCurrency(resumo.receita)}</span>
            </div>

            <div className="mt-3 space-y-1 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Só para você
              </p>
              <div className="flex justify-between">
                <span>Custo dos materiais</span>
                <span className="font-medium">{formatCurrency(materiaisCusto)}</span>
              </div>
              <div className="flex justify-between">
                <span>Custo da equipe</span>
                <span className="font-medium">{formatCurrency(custoEquipe)}</span>
              </div>
              <div className="flex justify-between">
                <span>Custo de combustível/deslocamento</span>
                <span className="font-medium">{formatCurrency(custoDeslocamentoInterno)}</span>
              </div>
              {num(campos.custo_mao_de_obra) > 0 && (
                <div className="flex justify-between">
                  <span>Outras despesas</span>
                  <span className="font-medium">{formatCurrency(num(campos.custo_mao_de_obra))}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-emerald-200 pt-1 font-semibold">
                <span>Custo total</span>
                <span>{formatCurrency(resumo.custo)}</span>
              </div>
              <div className="flex justify-between border-t border-emerald-200 pt-1 text-base font-bold">
                <span>Resultado estimado ({formatNumber(resumo.margemPct, 1)}%)</span>
                <span>{formatCurrency(resumo.lucro)}</span>
              </div>
            </div>
          </Card>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={() => navigate(servicoIdAtual ? `/servicos/${servicoIdAtual}` : '/servicos')}
            disabled={salvando}
          >
            Cancelar
          </Button>
          <Button type="submit" fullWidth disabled={salvando}>
            {salvando ? 'Salvando…' : '💾 Salvar serviço'}
          </Button>
        </div>
      </form>
    </div>
  )
}
