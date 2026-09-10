import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '@/config/navigation'
import { Logo } from '@/components/ui/Logo'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { useAuth } from '@/hooks/useAuth'

export function Sidebar() {
  const { user, isDemo } = useAuth()

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="px-5 py-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-ink-900'
              }`
            }
          >
            <span className="shrink-0">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-2 border-t border-slate-200 px-5 py-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-900">
            {user?.nome ?? 'Usuário'}
          </p>
          <p className="truncate text-xs text-slate-400">{user?.email ?? '—'}</p>
        </div>
        <LogoutButton className="text-sm text-slate-600 hover:text-red-600" />
        <p className="text-[11px] text-slate-400">
          v1.0.0{isDemo ? ' · modo demonstração' : ''}
        </p>
      </div>
    </aside>
  )
}
