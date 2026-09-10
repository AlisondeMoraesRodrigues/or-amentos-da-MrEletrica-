import type { ReactNode } from 'react'

type Tone = 'gray' | 'blue' | 'green' | 'red' | 'yellow'

const toneClass: Record<Tone, string> = {
  gray: 'bg-slate-100 text-slate-600',
  blue: 'bg-brand-50 text-brand-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-energy-400/20 text-energy-600',
}

export function Badge({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${toneClass[tone]}`}>
      {children}
    </span>
  )
}
