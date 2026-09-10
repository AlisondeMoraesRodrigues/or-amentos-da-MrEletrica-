import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { TextField } from '@/components/ui/TextField'
import { useAuth } from '@/hooks/useAuth'
import { isStrongEnoughPassword, isValidEmail } from '@/utils/validation'

type Errors = Partial<Record<'nome' | 'email' | 'senha' | 'confirmar', string>>

export default function RegisterPage() {
  const { user, loading, isDemo, signUp } = useAuth()
  const navigate = useNavigate()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [erroGeral, setErroGeral] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (!loading && user) return <Navigate to="/dashboard" replace />

  function validar(): boolean {
    const next: Errors = {}
    if (!nome.trim()) next.nome = 'Informe seu nome completo.'
    if (!isValidEmail(email)) next.email = 'E-mail inválido.'
    if (!isStrongEnoughPassword(senha)) next.senha = 'A senha deve ter no mínimo 6 caracteres.'
    if (confirmar !== senha) next.confirmar = 'As senhas não são iguais.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErroGeral('')
    setSucesso('')
    if (!validar()) return

    setEnviando(true)
    try {
      const { needsEmailConfirmation } = await signUp(nome.trim(), email.trim(), senha)
      if (needsEmailConfirmation) {
        setSucesso(
          'Cadastro realizado com sucesso. Verifique seu e-mail para confirmar sua conta.',
        )
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setErroGeral(
        err instanceof Error ? err.message : 'Não foi possível criar a conta. Tente novamente.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout
      title="Criar conta"
      footer={
        <>
          Já tem conta?{' '}
          <Link to="/login" className="font-semibold text-energy-400 hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      {isDemo && (
        <Alert tone="info">
          <span className="font-semibold">🟡 Modo demonstração.</span> A criação de contas
          exige o Supabase configurado. Use a tela de login para testar a interface.
        </Alert>
      )}

      {erroGeral && <Alert tone="error">{erroGeral}</Alert>}
      {sucesso && <Alert tone="success">{sucesso}</Alert>}

      {!sucesso && (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <TextField
            label="Nome completo"
            name="nome"
            autoComplete="name"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            error={errors.nome}
          />
          <TextField
            label="E-mail"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <TextField
            label="Senha"
            name="senha"
            type="password"
            autoComplete="new-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            error={errors.senha}
          />
          <TextField
            label="Confirmar senha"
            name="confirmar"
            type="password"
            autoComplete="new-password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            error={errors.confirmar}
          />
          <Button type="submit" fullWidth disabled={enviando}>
            {enviando ? 'Criando conta…' : 'Criar conta'}
          </Button>
        </form>
      )}

      {sucesso && (
        <Link to="/login" className="btn-primary w-full">
          Ir para o login
        </Link>
      )}
    </AuthLayout>
  )
}
