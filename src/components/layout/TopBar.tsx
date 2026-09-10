import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { NAV_ITEMS, PRIMARY_NAV } from '@/config/navigation'
import { Logo } from '@/components/ui/Logo'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { useAuth } from '@/hooks/useAuth'

const secondary = NAV_ITEMS.filter((i) => !PRIMARY_NAV.includes(i))

/** Barra superior - visível no celular (no desktop a navegação fica na Sidebar). */
export function TopBar() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between px-4 py-2.5">
        <Logo />
        <button
          type="button"
          aria-label="Mais opções"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 p-3">
          <nav className="grid grid-cols-2 gap-2">
            {secondary.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'bg-slate-50 text-slate-700'
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-900">
                {user?.nome ?? 'Usuário'}
              </p>
              <p className="truncate text-xs text-slate-400">{user?.email ?? '—'}</p>
            </div>
            <LogoutButton
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700"
              onDone={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </header>
  )
}
