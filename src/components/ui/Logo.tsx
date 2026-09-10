interface LogoProps {
  className?: string
  showText?: boolean
}

/** Marca provisória MR ELÉTRICA - raio dentro de um selo. */
export function Logo({ className = '', showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-energy-400 text-ink-900">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13z" />
        </svg>
      </span>
      {showText && (
        <div className="leading-tight">
          <p className="text-sm font-extrabold tracking-tight text-ink-900">MR ORÇAMENTOS</p>
          <p className="text-[11px] font-medium uppercase tracking-widest text-brand-600">
            MR Elétrica
          </p>
        </div>
      )}
    </div>
  )
}
