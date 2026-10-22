/**
 * Contador do StatCard: funções puras (rodam também em worklet). Interpreta um número ou uma
 * string em pt-BR com um número dentro (`"R$ 12.480,00"`, `"-3,5%"`), preserva prefixo, sufixo e
 * casas decimais e formata cada passo; no fim devolve exatamente o texto original.
 */
export interface Countable {
  prefix: string
  suffix: string
  decimals: number
  target: number
  original: string
}

const PT_BR_NUMBER = /^([^\d-]*)(-?\d{1,3}(?:\.\d{3})+(?:,\d+)?|-?\d+(?:,\d+)?)([^\d]*)$/

function decimalsOf(n: number): number {
  const text = String(n)
  const dot = text.indexOf('.')
  return dot < 0 ? 0 : Math.min(4, text.length - dot - 1)
}

export function formatPtBR(value: number, decimals: number): string {
  'worklet'
  const sign = value < 0 ? '-' : ''
  const fixed = Math.abs(value).toFixed(decimals)
  const parts = fixed.split('.')
  const int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return decimals > 0 ? `${sign}${int},${parts[1]}` : `${sign}${int}`
}

/** `null` quando o valor não é um número nem uma string pt-BR com um número (só aparece com fade). */
export function parseCountable(value: unknown): Countable | null {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null
    const decimals = decimalsOf(value)
    return { prefix: '', suffix: '', decimals, target: value, original: formatPtBR(value, decimals) }
  }
  if (typeof value !== 'string') return null
  const match = PT_BR_NUMBER.exec(value)
  if (!match) return null
  const [, prefix, number, suffix] = match
  const target = Number(number.replace(/\./g, '').replace(',', '.'))
  if (!Number.isFinite(target)) return null
  const comma = number.indexOf(',')
  return { prefix, suffix, decimals: comma < 0 ? 0 : number.length - comma - 1, target, original: value }
}

/** Texto no passo `progress` (0 a 1). Em 1 devolve o texto original, sem arredondar diferente. */
export function formatCount(countable: Countable, progress: number): string {
  'worklet'
  if (progress >= 1) return countable.original
  const current = countable.target * Math.max(0, progress)
  return `${countable.prefix}${formatPtBR(current, countable.decimals)}${countable.suffix}`
}
