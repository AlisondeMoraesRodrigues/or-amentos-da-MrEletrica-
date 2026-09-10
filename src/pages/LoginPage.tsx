import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { TextField } from '@/components/ui/TextField'
import { useAuth } from '@/hooks/useAuth'
import { DEMO_EMAIL, DEMO_PASSWORD } from '@/services/authService'
import { isValidEmail } from '@/utils/validation'

interface LocationState {
  from?: string
  notice?: string
}

export default function LoginPage() {
  const { user, loading, isDemo, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null
  const redirectTo = state?.from ?? '/dashboard'
  const notice = state?.notice

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [remember, setRemember] = useState(true)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (!loading && user) return <Navigate to={redirectTo} replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')

    if (!isValidEmail(email)) {
      setErro('Informe um e-mail válido.')
      return
    }
    if (!senha) {
      setErro('Informe sua senha.')
      return
    }

    setEnviando(true)
    try {
      await signIn(email, senha, remember)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível entrar. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  function preencherDemo() {
    setEmail(DEMO_EMAIL)
    setSenha(DEMO_PASSWORD)
    setErro('')
  }

  return (
    <AuthLayout
      title="Entrar"
      footer={
        <>
          Não tem conta?{' '}
          <Link to="/register" className="font-semibold text-energy-400 hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      {isDemo && (
        <Alert tone="info">
          <span className="font-semibold">🟡 Modo demonstração.</span> Use{' '}
          <span className="font-mono">{DEMO_EMAIL}</span> /{' '}
          <span className="font-mono">{DEMO_PASSWORD}</span>.{' '}
          <button type="button" onClick={preencherDemo} className="font-semibold underline">
            Preencher
          </button>
        </Alert>
      )}

      {notice && <Alert tone="success">{notice}</Alert>}
      {erro && <Alert tone="error">{erro}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@mreletrica.com.br"
        />
        <TextField
          label="Senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="••••••••"
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-200"
            />
            Manter conectado
          </label>
          <Link to="/forgot-password" className="font-medium text-brand-600 hover:underline">
            Esqueci minha senha
          </Link>
        </div>

        <Button type="submit" fullWidth disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </AuthLayout>
  )
}
