import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <EmptyState
      title="Página não encontrada"
      description="O endereço acessado não existe."
      action={<Button onClick={() => navigate('/dashboard')}>Ir para o Dashboard</Button>}
    />
  )
}
