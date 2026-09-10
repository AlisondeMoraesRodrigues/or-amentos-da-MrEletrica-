import type { ReactNode } from 'react'

type AlertTone = 'error' | 'success' | 'info'

const toneClass: Record<AlertTone, string> = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-green-200 bg-green-50 text-green-700',
  info: 'border-brand-200 bg-brand-50 text-brand-700',
}

export function Alert({ tone = 'info', children }: { tone?: AlertTone; children: ReactNode }) {
  return (
    <div role="alert" className={`rounded-xl border px-3 py-2 text-sm ${toneClass[tone]}`}>
      {children}
    </div>
  )
}
