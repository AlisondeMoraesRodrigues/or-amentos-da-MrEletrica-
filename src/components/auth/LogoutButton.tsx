import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface LogoutButtonProps {
  className?: string
  onDone?: () => void
}

const icon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5M21 12H9" />
  </svg>
)

export function LogoutButton({ className = '', onDone }: LogoutButtonProps) {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  async function handleClick() {
    if (busy) return
    if (!window.confirm('Deseja sair da sua conta?')) return
    setBusy(true)
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch {
      // signOut local sempre limpa o estado; ignora falha de rede
      navigate('/login', { replace: true })
    } finally {
      setBusy(false)
      onDone?.()
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className={`inline-flex items-center gap-2 font-medium transition-colors disabled:opacity-60 ${className}`}
    >
      {icon}
      {busy ? 'Saindo…' : 'Sair'}
    </button>
  )
}
