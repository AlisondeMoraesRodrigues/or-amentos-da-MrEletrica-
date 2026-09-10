import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import DashboardPage from '@/pages/DashboardPage'
import ClientesPage from '@/pages/ClientesPage'
import ClienteFormPage from '@/pages/ClienteFormPage'
import ClienteDetailPage from '@/pages/ClienteDetailPage'
import OrcamentosPage from '@/pages/OrcamentosPage'
import OrcamentoFormPage from '@/pages/OrcamentoFormPage'
import OrcamentoDetailPage from '@/pages/OrcamentoDetailPage'
import ServicosPage from '@/pages/ServicosPage'
import ServicoFormPage from '@/pages/ServicoFormPage'
import ServicoDetailPage from '@/pages/ServicoDetailPage'
import MaterialFormPage from '@/pages/MaterialFormPage'
import LeituraNotaPage from '@/pages/LeituraNotaPage'
import MateriaisPage from '@/pages/MateriaisPage'
import DocumentosPage from '@/pages/DocumentosPage'
import ReciboFormPage from '@/pages/ReciboFormPage'
import ConfiguracoesPage from '@/pages/ConfiguracoesPage'
import FinanceiroPage from '@/pages/FinanceiroPage'
import NotFoundPage from '@/pages/NotFoundPage'

/**
 * Rotas da aplicação.
 * Públicas: /login, /register, /forgot-password, /reset-password.
 * Privadas (via <ProtectedRoute>): dashboard, clientes, orçamentos, serviços,
 * materiais, documentos, configurações.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<LayoutRoute />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/clientes/novo" element={<ClienteFormPage />} />
          <Route path="/clientes/:id" element={<ClienteDetailPage />} />
          <Route path="/clientes/:id/editar" element={<ClienteFormPage />} />
          <Route path="/orcamentos" element={<OrcamentosPage />} />
          <Route path="/orcamentos/novo" element={<OrcamentoFormPage />} />
          <Route path="/orcamentos/:id" element={<OrcamentoDetailPage />} />
          <Route path="/orcamentos/:id/editar" element={<OrcamentoFormPage />} />
          <Route path="/servicos" element={<ServicosPage />} />
          <Route path="/servicos/novo" element={<ServicoFormPage />} />
          <Route path="/servicos/:id" element={<ServicoDetailPage />} />
          <Route path="/servicos/:id/editar" element={<ServicoFormPage />} />
          <Route path="/servicos/:id/materiais/novo" element={<MaterialFormPage />} />
          <Route path="/servicos/:id/materiais/:materialId/editar" element={<MaterialFormPage />} />
          <Route path="/servicos/:id/notas/:notaId/ler" element={<LeituraNotaPage />} />
          <Route path="/materiais" element={<MateriaisPage />} />
          <Route path="/documentos" element={<DocumentosPage />} />
          <Route path="/recibos/novo" element={<ReciboFormPage />} />
          <Route path="/configuracoes" element={<ConfiguracoesPage />} />
          <Route path="/financeiro" element={<FinanceiroPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

function LayoutRoute() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}
