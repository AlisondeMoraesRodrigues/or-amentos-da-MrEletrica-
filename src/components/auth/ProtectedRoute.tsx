import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { FullScreenLoader } from '@/components/ui/FullScreenLoader'

/**
 * Protege as rotas privadas.
 * - Enquanto verifica a sessão: mostra "Carregando…" (não renderiza o conteúdo).
 * - Sem usuário autenticado: redireciona para /login (guardando a origem).
 */
export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullScreenLoader label="Verificando sessão…" />

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
