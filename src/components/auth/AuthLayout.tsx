import type { ReactNode } from 'react'
import { Logo } from '@/components/ui/Logo'

interface AuthLayoutProps {
  title: string
  children: ReactNode
  footer?: ReactNode
}

/** Casca visual das telas de autenticação (login, cadastro, senha). */
export function AuthLayout({ title, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-900 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo showText={false} className="scale-110" />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">MR ORÇAMENTOS</h1>
            <p className="mt-0.5 text-sm text-slate-300">
              Gestão inteligente para serviços e orçamentos.
            </p>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-lg font-bold text-ink-900">{title}</h2>
          {children}
        </div>

        {footer && <div className="mt-4 text-center text-sm text-slate-300">{footer}</div>}
      </div>
    </div>
  )
}
