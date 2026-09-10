interface FullScreenLoaderProps {
  label?: string
}

export function FullScreenLoader({ label = 'Carregando…' }: FullScreenLoaderProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-100 text-slate-500">
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600"
        aria-hidden
      />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}
