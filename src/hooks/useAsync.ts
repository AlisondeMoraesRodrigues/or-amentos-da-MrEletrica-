import { useCallback, useEffect, useState } from 'react'

interface AsyncState<T> {
  data: T | undefined
  loading: boolean
  error: string | undefined
}

/**
 * Executa uma função assíncrona e expõe { data, loading, error, reload }.
 * `deps` controla quando recarregar (mesma semântica de useEffect).
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<AsyncState<T>>({
    data: undefined,
    loading: true,
    error: undefined,
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps)

  const reload = useCallback(() => {
    let active = true
    setState((s) => ({ ...s, loading: true, error: undefined }))
    run()
      .then((data) => {
        if (active) setState({ data, loading: false, error: undefined })
      })
      .catch((err: unknown) => {
        if (active) {
          setState((s) => ({
            ...s,
            loading: false,
            error: err instanceof Error ? err.message : 'Ocorreu um erro. Tente novamente.',
          }))
        }
      })
    return () => {
      active = false
    }
  }, [run])

  useEffect(() => reload(), [reload])

  return { ...state, reload }
}
