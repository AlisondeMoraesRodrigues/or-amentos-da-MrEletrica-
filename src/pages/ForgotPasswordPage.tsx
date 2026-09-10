import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { TextField } from '@/components/ui/TextField'
import { useAuth } from '@/hooks/useAuth'
import { isValidEmail } from '@/utils/validation'

const MENSAGEM_NEUTRA =
  'Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.'

export default function ForgotPasswordPage() {
  const { isDemo, resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [erro, setErro] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')

    if (!isValidEmail(email)) {
      setErro('Informe um e-mail válido.')
      return
    }

    setEnviando(true)
    try {
      await resetPassword(email.trim())
      setEnviado(true)
    } catch (err) {
      setErro(
        err instanceof Error ? err.message : 'Não foi possível enviar o e-mail. Tente novamente.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout
      title="Recuperar senha"
      footer={
        <Link to="/login" className="font-semibold text-energy-400 hover:underline">
          Voltar para o login
        </Link>
      }
    >
      {isDemo && (
        <Alert tone="info">
          <span className="font-semibold">🟡 Modo demonstração.</span> Nenhum e-mail é
          enviado. Configure o Supabase para usar a recuperação de senha.
        </Alert>
      )}

      {enviado ? (
        <Alert tone="success">{MENSAGEM_NEUTRA}</Alert>
      ) : (
        <>
          {erro && <Alert tone="error">{erro}</Alert>}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <TextField
              label="E-mail"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@mreletrica.com.br"
            />
            <Button type="submit" fullWidth disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar link de recuperação'}
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  )
}
