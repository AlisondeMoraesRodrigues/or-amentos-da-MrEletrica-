import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { DemoBanner } from './DemoBanner'

interface AppLayoutProps {
  children: ReactNode
}

/** Casca da aplicação: Sidebar no desktop, TopBar + BottomNav no celular. */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-4 lg:px-8 lg:pb-10">
          <DemoBanner />
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
