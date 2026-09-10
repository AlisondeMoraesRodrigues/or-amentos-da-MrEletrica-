import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { TextField } from '@/components/ui/TextField'
import { useAuth } from '@/hooks/useAuth'
import { isStrongEnoughPassword } from '@/utils/validation'

type Errors = Partial<Record<'senha' | 'confirmar', string>>

export default function ResetPasswordPage() {
  const { isDemo, loading, session, updatePassword, signOut } = useAuth()
  const navigate = useNavigate()

  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [erroGeral, setErroGeral] = useState('')
  const [enviando, setEnviando] = useState(false)

  // A demonstração não tem link de recuperação.
  if (isDemo) {
    return (
      <AuthLayout
        title="Redefinir senha"
        footer={
          <Link to="/login" className="font-semibold text-energy-400 hover:underline">
            Voltar para o login
          </Link>
        }
      >
        <Alert tone="info">
          <span className="font-semibold">🟡 Modo demonstração.</span> A redefinição de senha
          exige o Supabase configurado.
        </Alert>
      </AuthLayout>
    )
  }

  // Sem sessão de recuperação (link inválido/expirado ou acesso direto).
  if (!loading && !session) {
    return (
      <AuthLayout
        title="Redefinir senha"
        footer={
          <Link to="/forgot-password" className="font-semibold text-energy-400 hover:underline">
            Solicitar novo link
          </Link>
        }
      >
        <Alert tone="error">
          Link de recuperação inválido ou expirado. Solicite um novo e-mail de recuperação.
        </Alert>
      </AuthLayout>
    )
  }

  function validar(): boolean {
    const next: Errors = {}
    if (!isStrongEnoughPassword(senha)) next.senha = 'A senha deve ter no mínimo 6 caracteres.'
    if (confirmar !== senha) next.confirmar = 'As senhas não são iguais.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErroGeral('')
    if (!validar()) return

    setEnviando(true)
    try {
      await updatePassword(senha)
      await signOut()
      navigate('/login', {
        replace: true,
        state: { notice: 'Senha alterada com sucesso. Faça login com a nova senha.' },
      })
    } catch (err) {
      setErroGeral(
        err instanceof Error ? err.message : 'Não foi possível alterar a senha. Tente novamente.',
      )
    } finally {
      setEnviando(false)
    }
  }

  if (loading) return <Navigate to="/login" replace />

  return (
    <AuthLayout
      title="Redefinir senha"
      footer={
        <Link to="/login" className="font-semibold text-energy-400 hover:underline">
          Voltar para o login
        </Link>
      }
    >
      {erroGeral && <Alert tone="error">{erroGeral}</Alert>}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <TextField
          label="Nova senha"
          name="senha"
          type="password"
          autoComplete="new-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          error={errors.senha}
        />
        <TextField
          label="Confirmar nova senha"
          name="confirmar"
          type="password"
          autoComplete="new-password"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          error={errors.confirmar}
        />
        <Button type="submit" fullWidth disabled={enviando}>
          {enviando ? 'Salvando…' : 'Alterar senha'}
        </Button>
      </form>
    </AuthLayout>
  )
}
