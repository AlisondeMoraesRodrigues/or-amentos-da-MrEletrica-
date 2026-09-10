import { useEffect, useState, type FormEvent } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Loading } from '@/components/ui/Loading'
import { TextField } from '@/components/ui/TextField'
import { useAsync } from '@/hooks/useAsync'
import { getConfiguracao, updateConfiguracao } from '@/services/configuracoesService'
import type { ConfiguracaoRow } from '@/types/database'

type Texto =
  | 'empresa_nome'
  | 'empresa_cnpj'
  | 'empresa_telefone'
  | 'empresa_email'
  | 'empresa_endereco'
  | 'logo_url'
  | 'pix_beneficiario'
  | 'pix_chave'
  | 'pix_cidade'
type Numero =
  | 'valor_hora_tecnica'
  | 'valor_hora_auxiliar'
  | 'valor_hora_emergencia'
  | 'valor_hora_noturna'
  | 'margem_padrao_materiais'
  | 'taxa_deslocamento'

type Form = Record<Texto, string> & Record<Numero, string>

function num(v: string): number {
  const n = Number.parseFloat(v.replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

function paraForm(c: ConfiguracaoRow): Form {
  return {
    empresa_nome: c.empresa_nome ?? '',
    empresa_cnpj: c.empresa_cnpj ?? '',
    empresa_telefone: c.empresa_telefone ?? '',
    empresa_email: c.empresa_email ?? '',
    empresa_endereco: c.empresa_endereco ?? '',
    logo_url: c.logo_url ?? '',
    pix_beneficiario: c.pix_beneficiario ?? '',
    pix_chave: c.pix_chave ?? '',
    pix_cidade: c.pix_cidade ?? '',
    valor_hora_tecnica: String(c.valor_hora_tecnica ?? 0),
    valor_hora_auxiliar: String(c.valor_hora_auxiliar ?? 0),
    valor_hora_emergencia: String(c.valor_hora_emergencia ?? 0),
    valor_hora_noturna: String(c.valor_hora_noturna ?? 0),
    margem_padrao_materiais: String(c.margem_padrao_materiais ?? 20),
    taxa_deslocamento: String(c.taxa_deslocamento ?? 0),
  }
}

export default function ConfiguracoesPage() {
  const { data, loading, error, reload } = useAsync(() => getConfiguracao(), [])
  const [form, setForm] = useState<Form | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; texto: string } | null>(null)

  useEffect(() => {
    if (data) setForm(paraForm(data))
  }, [data])

  function set(chave: keyof Form, valor: string) {
    setForm((f) => (f ? { ...f, [chave]: valor } : f))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form) return
    setSalvando(true)
    setMsg(null)
    try {
      await updateConfiguracao({
        empresa_nome: form.empresa_nome.trim() || null,
        empresa_cnpj: form.empresa_cnpj.trim() || null,
        empresa_telefone: form.empresa_telefone.trim() || null,
        empresa_email: form.empresa_email.trim() || null,
        empresa_endereco: form.empresa_endereco.trim() || null,
        logo_url: form.logo_url.trim() || null,
        pix_beneficiario: form.pix_beneficiario.trim() || null,
        pix_chave: form.pix_chave.trim() || null,
        pix_cidade: form.pix_cidade.trim() || null,
        valor_hora_tecnica: num(form.valor_hora_tecnica),
        valor_hora_auxiliar: num(form.valor_hora_auxiliar),
        valor_hora_emergencia: num(form.valor_hora_emergencia),
        valor_hora_noturna: num(form.valor_hora_noturna),
        margem_padrao_materiais: num(form.margem_padrao_materiais),
        taxa_deslocamento: num(form.taxa_deslocamento),
      })
      setMsg({ tone: 'success', texto: 'Configurações salvas.' })
      reload()
    } catch (err) {
      setMsg({
        tone: 'error',
        texto: err instanceof Error ? err.message : 'Não foi possível salvar.',
      })
    } finally {
      setSalvando(false)
    }
  }

  if (loading || !form) return <Loading label="Carregando configurações…" />
  if (error) return <Alert tone="error">{error}</Alert>

  const t = (label: string, chave: Texto, type?: string) => (
    <TextField
      label={label}
      name={chave}
      type={type}
      value={form[chave]}
      onChange={(e) => set(chave, e.target.value)}
    />
  )
  const n = (label: string, chave: Numero) => (
    <TextField
      label={label}
      name={chave}
      type="number"
      min={0}
      step="0.01"
      inputMode="decimal"
      value={form[chave]}
      onChange={(e) => set(chave, e.target.value)}
    />
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PageHeader
        title="Configurações"
        subtitle="Empresa, valores e PIX"
        action={
          <Button type="submit" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </Button>
        }
      />

      {msg && <Alert tone={msg.tone}>{msg.texto}</Alert>}

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Dados da empresa</h2>
        {t('Nome da empresa', 'empresa_nome')}
        <div className="grid gap-3 sm:grid-cols-2">
          {t('CNPJ', 'empresa_cnpj')}
          {t('Telefone', 'empresa_telefone')}
        </div>
        {t('E-mail', 'empresa_email', 'email')}
        {t('Endereço', 'empresa_endereco')}
        {t('Logo (URL da imagem)', 'logo_url')}
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Configuração financeira</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {n('Valor hora técnica (R$)', 'valor_hora_tecnica')}
          {n('Valor hora auxiliar (R$)', 'valor_hora_auxiliar')}
          {n('Valor hora emergência (R$)', 'valor_hora_emergencia')}
          {n('Valor hora noturna (R$)', 'valor_hora_noturna')}
          {n('Margem padrão sobre materiais (%)', 'margem_padrao_materiais')}
          {n('Taxa de deslocamento (R$)', 'taxa_deslocamento')}
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Configuração PIX</h2>
        {t('Nome do beneficiário', 'pix_beneficiario')}
        <div className="grid gap-3 sm:grid-cols-2">
          {t('Chave PIX', 'pix_chave')}
          {t('Cidade', 'pix_cidade')}
        </div>
        <p className="text-xs text-slate-400">
          Usado para gerar o QR Code e o "PIX copia e cola" nos documentos.
        </p>
      </Card>

      <Button type="submit" fullWidth disabled={salvando}>
        {salvando ? 'Salvando…' : 'Salvar configurações'}
      </Button>
    </form>
  )
}
