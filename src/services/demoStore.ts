/**
 * Armazém local do MODO DEMONSTRAÇÃO.
 *
 * Substitui o banco de dados quando o Supabase não está configurado: os dados
 * ficam apenas no `localStorage` do navegador e nada é enviado a servidor.
 * A partir do Checkpoint 03 as telas passam a consumir a "camada de acesso a
 * dados" (services), que usa este armazém no modo demonstração e o Supabase
 * quando configurado.
 */

const PREFIX = 'mr-demo-'

function keyOf(name: string): string {
  return `${PREFIX}${name}`
}

export function demoRead<T>(name: string, seed: T[]): T[] {
  try {
    const raw = window.localStorage.getItem(keyOf(name))
    if (raw) return JSON.parse(raw) as T[]
    window.localStorage.setItem(keyOf(name), JSON.stringify(seed))
    return [...seed]
  } catch {
    return [...seed]
  }
}

export function demoWrite<T>(name: string, rows: T[]): void {
  try {
    window.localStorage.setItem(keyOf(name), JSON.stringify(rows))
  } catch {
    /* storage indisponível - ignora */
  }
}

export function demoReadObject<T>(name: string, seed: T): T {
  try {
    const raw = window.localStorage.getItem(keyOf(name))
    if (raw) return JSON.parse(raw) as T
    window.localStorage.setItem(keyOf(name), JSON.stringify(seed))
    return seed
  } catch {
    return seed
  }
}

export function demoWriteObject<T>(name: string, value: T): void {
  try {
    window.localStorage.setItem(keyOf(name), JSON.stringify(value))
  } catch {
    /* ignora */
  }
}

export function demoId(): string {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  return `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

/** Limpa todos os dados de demonstração (usado ao sair da conta demo). */
export function clearDemoData(): void {
  try {
    const toRemove: string[] = []
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i)
      if (k && k.startsWith(PREFIX)) toRemove.push(k)
    }
    toRemove.forEach((k) => window.localStorage.removeItem(k))
  } catch {
    /* ignora */
  }
}
