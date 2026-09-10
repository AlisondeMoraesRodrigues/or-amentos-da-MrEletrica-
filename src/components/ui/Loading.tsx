interface LoadingProps {
  label?: string
  className?: string
}

/** Indicador de carregamento inline (para dentro de uma página). */
export function Loading({ label = 'Carregando…', className = '' }: LoadingProps) {
  return (
    <div className={`flex items-center justify-center gap-2 py-10 text-sm text-slate-500 ${className}`}>
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600"
        aria-hidden
      />
      {label}
    </div>
  )
}
