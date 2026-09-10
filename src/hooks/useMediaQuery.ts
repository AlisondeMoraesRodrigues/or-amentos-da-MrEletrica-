import { useEffect, useState } from 'react'

/** Retorna true quando a media query casa. Usado para alternar layout mobile/desktop. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    setMatches(mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

/** true em telas >= 1024px (desktop). */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}
