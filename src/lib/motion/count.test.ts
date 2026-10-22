import { formatCount, formatPtBR, parseCountable } from './count'

describe('parseCountable', () => {
  it('interpreta "R$ 12.480,00" com prefixo, casas e o texto original', () => {
    expect(parseCountable('R$ 12.480,00')).toEqual({
      prefix: 'R$ ',
      suffix: '',
      decimals: 2,
      target: 12480,
      original: 'R$ 12.480,00',
    })
  })
  it('interpreta um número (inteiro e com casas)', () => {
    expect(parseCountable(12480)).toMatchObject({ prefix: '', suffix: '', decimals: 0, target: 12480, original: '12.480' })
    expect(parseCountable(3.5)).toMatchObject({ decimals: 1, target: 3.5, original: '3,5' })
  })
  it('interpreta "-3,5%" com sinal e sufixo', () => {
    expect(parseCountable('-3,5%')).toMatchObject({ prefix: '', suffix: '%', decimals: 1, target: -3.5 })
  })
  it('interpreta inteiro sem separador de milhar e sufixo de texto', () => {
    expect(parseCountable('1480 clientes')).toMatchObject({ suffix: ' clientes', target: 1480, decimals: 0 })
  })
  it('não conta: texto sem número, número em formato inglês, vários números, tipos que não são texto ou número', () => {
    expect(parseCountable('abc')).toBeNull()
    expect(parseCountable('12.5')).toBeNull()
    expect(parseCountable('2026-10-18')).toBeNull()
    expect(parseCountable('')).toBeNull()
    expect(parseCountable(null)).toBeNull()
    expect(parseCountable(undefined)).toBeNull()
    expect(parseCountable({})).toBeNull()
    expect(parseCountable(Number.NaN)).toBeNull()
    expect(parseCountable(Number.POSITIVE_INFINITY)).toBeNull()
  })
})

describe('formatPtBR', () => {
  it('usa ponto de milhar e vírgula decimal', () => {
    expect(formatPtBR(1234567.891, 2)).toBe('1.234.567,89')
    expect(formatPtBR(999, 0)).toBe('999')
    expect(formatPtBR(-1200.5, 1)).toBe('-1.200,5')
    expect(formatPtBR(0, 2)).toBe('0,00')
  })
})

describe('formatCount', () => {
  const dinheiro = parseCountable('R$ 12.480,00')!
  it('formata cada passo com as mesmas casas, prefixo e sufixo', () => {
    expect(formatCount(dinheiro, 0)).toBe('R$ 0,00')
    expect(formatCount(dinheiro, 0.5)).toBe('R$ 6.240,00')
    const percentual = parseCountable('-3,5%')!
    expect(formatCount(percentual, 0.5)).toBe('-1,8%')
  })
  it('no fim devolve exatamente o texto original', () => {
    expect(formatCount(dinheiro, 1)).toBe('R$ 12.480,00')
    expect(formatCount(parseCountable('1480')!, 1)).toBe('1480')
    expect(formatCount(dinheiro, 1.2)).toBe('R$ 12.480,00')
  })
  it('progresso negativo vale 0', () => {
    expect(formatCount(dinheiro, -1)).toBe('R$ 0,00')
  })
})
