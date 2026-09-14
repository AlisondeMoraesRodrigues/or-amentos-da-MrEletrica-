import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { TextField } from '@/components/ui/TextField'
import { SelectField } from '@/components/ui/SelectField'
import { createFuncionario, listFuncionarios } from '@/services/funcionariosService'
import {
  adicionarEquipeServico,
  listEquipeServico,
  removerEquipeServico,
} from '@/services/servicoFuncionariosService'
import { formatCurrency } from '@/utils/format'
import type { FuncionarioRow, ServicoFuncionarioRow } from '@/types/database'

/** Equipe (ajudantes/terceiros) alocada num serviço, com diária (Checkpoint 27). */
export function EquipeServicoEditor({
  servicoId,
  onNeedServicoId,
  diariaPadrao,
  onEquipeChange,
}: {
  servicoId: string | null
  onNeedServicoId: () => Promise<string>
  diariaPadrao: number
  onEquipeChange: (rows: ServicoFuncionarioRow[]) => void
}) {
  const [funcionarios, setFuncionarios] = useState<FuncionarioRow[]>([])
  const [equipe, setEquipe] = useState<ServicoFuncionarioRow[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [funcionarioId, setFuncionarioId] = useState('')
  const [dias, setDias] = useState('1')
  const [horas, setHoras] = useState('')
  const [adicionando, setAdicionando] = useState(false)

  const [mostrarNovo, setMostrarNovo] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novaDiaria, setNovaDiaria] = useState(String(diariaPadrao))
  const [criandoFuncionario, setCriandoFuncionario] = useState(false)

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      const listaFuncionarios = await listFuncionarios({ apenasAtivos: true })
      setFuncionarios(listaFuncionarios)
      if (!funcionarioId && listaFuncionarios.length > 0) setFuncionarioId(listaFuncionarios[0].id)
      if (servicoId) {
        const listaEquipe = await listEquipeServico(servicoId)
        setEquipe(listaEquipe)
        onEquipeChange(listaEquipe)
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível carregar a equipe.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicoId])

  async function handleAdicionar() {
    const funcionario = funcionarios.find((f) => f.id === funcionarioId)
    if (!funcionario) return
    const diasNum = Number.parseFloat(dias.replace(',', '.')) || 1
    const horasNum = Number.parseFloat(horas.replace(',', '.')) || 0
    setAdicionando(true)
    setErro('')
    try {
      const id = servicoId ?? (await onNeedServicoId())
      await adicionarEquipeServico({
        servico_id: id,
        funcionario_id: funcionario.id,
        nome_funcionario: funcionario.nome,
        quantidade_dias: diasNum,
        quantidade_horas: horasNum,
        valor_diaria_aplicado: funcionario.valor_diaria,
        custo: Math.round(diasNum * funcionario.valor_diaria * 100) / 100,
      })
      setDias('1')
      setHoras('')
      const listaEquipe = await listEquipeServico(id)
      setEquipe(listaEquipe)
      onEquipeChange(listaEquipe)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível adicionar à equipe.')
    } finally {
      setAdicionando(false)
    }
  }

  async function handleRemover(id: string) {
    setErro('')
    try {
      await removerEquipeServico(id)
      if (servicoId) {
        const listaEquipe = await listEquipeServico(servicoId)
        setEquipe(listaEquipe)
        onEquipeChange(listaEquipe)
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível remover da equipe.')
    }
  }

  async function handleNovoFuncionario() {
    if (!novoNome.trim()) return
    setCriandoFuncionario(true)
    setErro('')
    try {
      const criado = await createFuncionario({
        nome: novoNome.trim(),
        valor_diaria: Number.parseFloat(novaDiaria.replace(',', '.')) || diariaPadrao,
        ativo: true,
      })
      setFuncionarios((lista) => [...lista, criado])
      setFuncionarioId(criado.id)
      setNovoNome('')
      setNovaDiaria(String(diariaPadrao))
      setMostrarNovo(false)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível cadastrar o funcionário.')
    } finally {
      setCriandoFuncionario(false)
    }
  }

  const totalEquipe = equipe.reduce((s, e) => s + e.custo, 0)

  return (
    <Card className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-700">👷 Equipe</h2>

      {erro && <Alert tone="error">{erro}</Alert>}

      {equipe.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {equipe.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <div>
                <p className="font-medium text-ink-900">{e.nome_funcionario}</p>
                <p className="text-xs text-slate-400">
                  {e.quantidade_dias} diária(s) × {formatCurrency(e.valor_diaria_aplicado)}
                  {e.quantidade_horas > 0 ? ` · ${e.quantidade_horas}h` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-semibold">{formatCurrency(e.custo)}</span>
                <button
                  type="button"
                  onClick={() => handleRemover(e.id)}
                  className="text-xs font-semibold text-red-600 underline"
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
          <li className="flex justify-between pt-2 text-sm font-bold text-ink-900">
            <span>Custo da equipe</span>
            <span>{formatCurrency(totalEquipe)}</span>
          </li>
        </ul>
      )}

      {!carregando && funcionarios.length === 0 && !mostrarNovo && (
        <p className="text-sm text-slate-400">Nenhum funcionário cadastrado ainda.</p>
      )}

      {!carregando && funcionarios.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <SelectField
            label="Funcionário"
            value={funcionarioId}
            onChange={(e) => setFuncionarioId(e.target.value)}
          >
            {funcionarios.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome} — {formatCurrency(f.valor_diaria)}/diária
              </option>
            ))}
          </SelectField>
          <TextField
            label="Diárias"
            type="number"
            min={0}
            step="0.5"
            inputMode="decimal"
            value={dias}
            onChange={(e) => setDias(e.target.value)}
          />
          <TextField
            label="Horas (opcional)"
            type="number"
            min={0}
            step="0.5"
            inputMode="decimal"
            value={horas}
            onChange={(e) => setHoras(e.target.value)}
          />
        </div>
      )}

      {!carregando && funcionarios.length > 0 && (
        <Button type="button" variant="ghost" fullWidth onClick={handleAdicionar} disabled={adicionando}>
          {adicionando ? 'Adicionando…' : '+ Adicionar à equipe'}
        </Button>
      )}

      {!mostrarNovo ? (
        <button
          type="button"
          onClick={() => setMostrarNovo(true)}
          className="text-xs font-semibold text-brand-600 underline"
        >
          + Novo funcionário
        </button>
      ) : (
        <div className="space-y-2 rounded-xl bg-slate-50 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <TextField
              label="Nome do funcionário"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
            />
            <TextField
              label="Valor da diária (R$)"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={novaDiaria}
              onChange={(e) => setNovaDiaria(e.target.value)}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" variant="ghost" fullWidth onClick={() => setMostrarNovo(false)}>
              Cancelar
            </Button>
            <Button type="button" fullWidth onClick={handleNovoFuncionario} disabled={criandoFuncionario || !novoNome.trim()}>
              {criandoFuncionario ? 'Salvando…' : 'Salvar funcionário'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
