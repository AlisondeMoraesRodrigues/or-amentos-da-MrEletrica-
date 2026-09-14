import { useState, type FormEvent } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { TextField } from '@/components/ui/TextField'
import { TextAreaField } from '@/components/ui/TextAreaField'
import { createCliente, type NovoCliente } from '@/services/clientesService'
import { isValidEmail } from '@/utils/validation'
import type { ClienteRow } from '@/types/database'

/**
 * Cadastro rápido de cliente, sem sair da tela onde foi aberto (Checkpoint 27).
 * Renderizado como uma folha cheia de tela; o estado da tela de trás (ex.: o
 * formulário de serviço) não é tocado — ele só recebe o cliente criado.
 */

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

function limpar(v: string): string | null {
  const t = v.trim()
  return t === '' ? null : t
}

export function ClienteQuickCreateModal({
  nomeInicial,
  onCancelar,
  onCriado,
}: {
  nomeInicial?: string
  onCancelar: () => void
  onCriado: (cliente: ClienteRow) => void
}) {
  const [campos, setCampos] = useState<Campos>({ ...VAZIO, nome: nomeInicial ?? '' })
  const [erros, setErros] = useState<Partial<Record<keyof Campos, string>>>({})
  const [erroGeral, setErroGeral] = useState('')
  const [salvando, setSalvando] = useState(false)

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
      const cliente = await createCliente(payload)
      onCriado(cliente)
    } catch (err) {
      setErroGeral(err instanceof Error ? err.message : 'Não foi possível salvar o cliente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-slate-100">
      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-lg flex-1 space-y-4 p-4 pb-24" noValidate>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-900">+ Novo cliente</h2>
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-500 ring-1 ring-slate-200"
          >
            Cancelar
          </button>
        </div>

        {erroGeral && <Alert tone="error">{erroGeral}</Alert>}

        <Card className="space-y-3">
          <TextField
            label="Nome / Razão social *"
            name="nome"
            value={campos.nome}
            onChange={(e) => set('nome', e.target.value)}
            error={erros.nome}
            autoFocus
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="CPF" name="cpf" inputMode="numeric" value={campos.cpf} onChange={(e) => set('cpf', e.target.value)} />
            <TextField label="CNPJ" name="cnpj" inputMode="numeric" value={campos.cnpj} onChange={(e) => set('cnpj', e.target.value)} />
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
            <TextField label="Telefone" name="telefone" type="tel" inputMode="tel" value={campos.telefone} onChange={(e) => set('telefone', e.target.value)} />
            <TextField label="WhatsApp" name="whatsapp" type="tel" inputMode="tel" value={campos.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
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
          <TextField label="Endereço" name="endereco" value={campos.endereco} onChange={(e) => set('endereco', e.target.value)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Cidade" name="cidade" value={campos.cidade} onChange={(e) => set('cidade', e.target.value)} />
            <TextField label="Condomínio" name="condominio" value={campos.condominio} onChange={(e) => set('condominio', e.target.value)} />
          </div>
          <TextAreaField
            label="Observações"
            name="observacoes"
            value={campos.observacoes}
            onChange={(e) => set('observacoes', e.target.value)}
          />
        </Card>

        <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white p-3">
          <div className="mx-auto grid max-w-lg gap-3 sm:grid-cols-2">
            <Button type="button" variant="ghost" fullWidth onClick={onCancelar} disabled={salvando}>
              Cancelar
            </Button>
            <Button type="submit" fullWidth disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar cliente'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
