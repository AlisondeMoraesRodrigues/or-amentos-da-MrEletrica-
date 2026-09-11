import { Link } from 'react-router-dom'

/**
 * Botão flutuante de ação (Floating Action Button).
 * Fica fixo no canto inferior direito, acima do menu do celular.
 * Usado para o "+ Novo" das telas de lista (serviço, orçamento, cliente).
 */
export function Fab({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      aria-label={label}
      className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-energy-400 px-5 py-3.5 text-sm font-bold text-ink-900 shadow-lg shadow-black/20 transition-transform hover:bg-energy-500 active:scale-95 lg:bottom-8 lg:right-8"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
      {label}
    </Link>
  )
}
