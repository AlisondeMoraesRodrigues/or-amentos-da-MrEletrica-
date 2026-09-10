import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { TextField } from '@/components/ui/TextField'
import { gerarPdfRecibo } from '@/services/documentacaoService'
import { baixarBlob } from '@/utils/download'

interface Prefill {
  clienteNome?: string
  clienteId?: string | null
  valor?: number
  referencia?: string
  formaPagamento?: string | null
  orcamentoId?: string | null
  servicoId?: string | null
}

const HOJE = new Date().toISOString().slice(0, 10)

function num(v: string): number {
  const n = Number.parseFloat(v.replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export default function ReciboFormPage() {
  const navigate = useNavigate()
  const pre = (useLocation().state as Prefill | null) ?? {}

  const [clienteNome, setClienteNome] = useState(pre.clienteNome ?? '')
  const [valor, setValor] = useState(pre.valor ? String(pre.valor) : '')
  const [referencia, setReferencia] = useState(pre.referencia ?? '')
  const [data, setData] = useState(HOJE)
  const [formaPagamento, setFormaPagamento] = useState(pre.formaPagamento ?? '')
  const [erro, setErro] = useState('')
  const [gerando, setGerando] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')
    if (!clienteNome.trim() || num(valor) <= 0) {
      setErro('Informe o cliente e um valor maior que zero.')
      return
    }
    setGerando(true)
    try {
      const { blob, nomeArquivo } = await gerarPdfRecibo({
        clienteNome: clienteNome.trim(),
        clienteId: pre.clienteId ?? null,
        valor: num(valor),
        referencia: referencia.trim() || 'serviços prestados',
        data,
        formaPagamento: formaPagamento.trim() || null,
        orcamentoId: pre.orcamentoId ?? null,
        servicoId: pre.servicoId ?? null,
      })
      baixarBlob(blob, nomeArquivo)
      navigate('/documentos', { replace: true })
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível gerar o recibo.')
    } finally {
      setGerando(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Novo recibo" subtitle="Gera o PDF do recibo" />
      {erro && <Alert tone="error">{erro}</Alert>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="space-y-3">
          <TextField
            label="Cliente *"
            name="cliente"
            value={clienteNome}
            onChange={(e) => setClienteNome(e.target.value)}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Valor (R$) *"
              name="valor"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
            <TextField
              label="Data"
              name="data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>
          <TextField
            label="Referência"
            name="referencia"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            placeholder="Ex.: serviço de manutenção elétrica — ORC-2026-015"
          />
          <TextField
            label="Forma de pagamento"
            name="forma"
            value={formaPagamento}
            onChange={(e) => setFormaPagamento(e.target.value)}
            placeholder="Ex.: PIX"
          />
        </Card>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="button" variant="ghost" fullWidth onClick={() => navigate('/documentos')}>
            Cancelar
          </Button>
          <Button type="submit" fullWidth disabled={gerando}>
            {gerando ? 'Gerando…' : 'Gerar recibo (PDF)'}
          </Button>
        </div>
      </form>
    </div>
  )
}
