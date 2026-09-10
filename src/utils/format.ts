const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export function formatCurrency(value: number): string {
  return brl.format(Number.isFinite(value) ? value : 0)
}

export function formatNumber(value: number, casas = 2): string {
  if (!Number.isFinite(value)) return '0'
  return String(Math.round(value * 10 ** casas) / 10 ** casas)
}

export function formatDate(value: string | Date): string {
  let d: Date
  if (typeof value === 'string') {
    // Datas "YYYY-MM-DD" (colunas date) são interpretadas como locais, não UTC,
    // para não "voltar um dia" em fusos negativos.
    const somenteData = /^\d{4}-\d{2}-\d{2}$/.exec(value)
    if (somenteData) {
      const [ano, mes, dia] = value.split('-').map(Number)
      d = new Date(ano, mes - 1, dia)
    } else {
      d = new Date(value)
    }
  } else {
    d = value
  }
  return Number.isNaN(d.getTime()) ? '-' : dateFmt.format(d)
}
