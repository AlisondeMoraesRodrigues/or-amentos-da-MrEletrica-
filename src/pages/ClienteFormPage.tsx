import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Loading } from '@/components/ui/Loading'
import { TextField } from '@/components/ui/TextField'
import { TextAreaField } from '@/components/ui/TextAreaField'
import { createCliente, getCliente, updateCliente, type NovoCliente } from '@/services/clientesService'
import { isValidEmail } from '@/utils/validation'

type Campos = {
  nome: string
  cpf: string
  cnpj: string
  telefone: string
  whatsapp: string
  email: string
  endereco: string
  cidade: string
  condominio: string
  responsavel: string
  observacoes: string
}

const VAZIO: Campos = {
  nome: '',
  cpf: '',
  cnpj: '',
  telefone: '',
  whatsapp: '',
  email: '',
  endereco: '',
  cidade: '',
  condominio: '',
  responsavel: '',
  observacoes: '',
}

function limpar(valor: string): string | null {
  const v = valor.trim()
  return v === '' ? null : v
}

export default function ClienteFormPage() {
  const { id } = useParams<{ id: string }>()
  const editando = Boolean(id)
  const navigate = useNavigate()

  const [campos, setCampos] = useState<Campos>(VAZIO)
  const [carregando, setCarregando] = useState(editando)
  const [erroCarga, setErroCarga] = useState('')
  const [erros, setErros] = useState<Partial<Record<keyof Campos, string>>>({})
  const [erroGeral, setErroGeral] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!id) return
    let ativo = true
    setCarregando(true)
    getCliente(id)
      .then((cliente) => {
        if (!ativo) return
        if (!cliente) {
          setErroCarga('Cliente não encontrado.')
          return
        }
        setCampos({
          nome: cliente.nome ?? '',
          cpf: cliente.cpf ?? '',
          cnpj: cliente.cnpj ?? '',
          telefone: cliente.telefone ?? '',
          whatsapp: cliente.whatsapp ?? '',
          email: cliente.email ?? '',
          endereco: cliente.endereco ?? '',
          cidade: cliente.cidade ?? '',
          condominio: cliente.condominio ?? '',
          responsavel: cliente.responsavel ?? '',
          observacoes: cliente.observacoes ?? '',
        })
      })
      .catch((e: unknown) =>
        setErroCarga(e instanceof Error ? e.message : 'Não foi possível carregar o cliente.'),
      )
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [id])

  function set<K extends keyof Campos>(chave: K, valor: string) {
    setCampos((c) => ({ ...c, [chave]: valor }))
  }

  function validar(): boolean {
    const next: Partial<Record<keyof Campos, string>> = {}
    if (!campos.nome.trim()) next.nome = 'Informe o nome do cliente.'
    if (campos.email.trim() && !isValidEmail(campos.email)) next.email = 'E-mail inválido.'
    setErros(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErroGeral('')
    if (!validar()) return

    const payload: NovoCliente = {
      nome: campos.nome.trim(),
      cpf: limpar(campos.cpf),
      cnpj: limpar(campos.cnpj),
      telefone: limpar(campos.telefone),
      whatsapp: limpar(campos.whatsapp),
      email: limpar(campos.email),
      endereco: limpar(campos.endereco),
      cidade: limpar(campos.cidade),
      condominio: limpar(campos.condominio),
      responsavel: limpar(campos.responsavel),
      observacoes: limpar(campos.observacoes),
    }

    setSalvando(true)
    try {
      const salvo = id ? await updateCliente(id, payload) : await createCliente(payload)
      navigate(`/clientes/${salvo.id}`, { replace: true })
    } catch (err) {
      setErroGeral(
        err instanceof Error ? err.message : 'Não foi possível salvar o cliente.',
      )
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) return <Loading label="Carregando cliente…" />

  if (erroCarga) {
    return (
      <div className="space-y-4">
        <PageHeader title="Editar cliente" />
        <Alert tone="error">{erroCarga}</Alert>
        <Button variant="ghost" onClick={() => navigate('/clientes')}>
          Voltar para clientes
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={editando ? 'Editar cliente' : 'Novo cliente'}
        subtitle={editando ? campos.nome : 'Preencha os dados do cliente'}
      />

      {erroGeral && <Alert tone="error">{erroGeral}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Card className="space-y-3">
          <TextField
            label="Nome / Razão social *"
            name="nome"
            value={campos.nome}
            onChange={(e) => set('nome', e.target.value)}
            error={erros.nome}
            autoComplete="off"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="CPF"
              name="cpf"
              inputMode="numeric"
              value={campos.cpf}
              onChange={(e) => set('cpf', e.target.value)}
            />
            <TextField
              label="CNPJ"
              name="cnpj"
              inputMode="numeric"
              value={campos.cnpj}
              onChange={(e) => set('cnpj', e.target.value)}
            />
          </div>
          <TextField
            label="Responsável"
            name="responsavel"
            value={campos.responsavel}
            onChange={(e) => set('responsavel', e.target.value)}
          />
        </Card>

        <Card className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Telefone"
              name="telefone"
              type="tel"
              inputMode="tel"
              value={campos.telefone}
              onChange={(e) => set('telefone', e.target.value)}
            />
            <TextField
              label="WhatsApp"
              name="whatsapp"
              type="tel"
              inputMode="tel"
              value={campos.whatsapp}
              onChange={(e) => set('whatsapp', e.target.value)}
            />
          </div>
          <TextField
            label="E-mail"
            name="email"
            type="email"
            inputMode="email"
            value={campos.email}
            onChange={(e) => set('email', e.target.value)}
            error={erros.email}
          />
        </Card>

        <Card className="space-y-3">
          <TextField
            label="Endereço"
            name="endereco"
            value={campos.endereco}
            onChange={(e) => set('endereco', e.target.value)}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Cidade"
              name="cidade"
              value={campos.cidade}
              onChange={(e) => set('cidade', e.target.value)}
            />
            <TextField
              label="Condomínio"
              name="condominio"
              value={campos.condominio}
              onChange={(e) => set('condominio', e.target.value)}
            />
          </div>
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
            onClick={() => navigate(id ? `/clientes/${id}` : '/clientes')}
            disabled={salvando}
          >
            Cancelar
          </Button>
          <Button type="submit" fullWidth disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar cliente'}
          </Button>
        </div>
      </form>
    </div>
  )
}
