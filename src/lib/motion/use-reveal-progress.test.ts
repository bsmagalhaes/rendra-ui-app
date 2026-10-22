import { act, renderHook } from '@testing-library/react-native'
import { useRevealProgress } from './use-reveal-progress'

async function avancar(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms)
  })
}

beforeEach(() => jest.useFakeTimers())
afterEach(() => jest.useRealTimers())

describe('useRevealProgress: rotina (A9)', () => {
  it('desenha em 420 ms (token draw) sem atraso: já anda nos primeiros quadros e termina aos 420', async () => {
    const { result } = await renderHook(() => useRevealProgress(true, false))
    await avancar(40)
    expect(result.current.get()).toBeGreaterThan(0)
    await avancar(200)
    expect(result.current.get()).toBeLessThan(1)
    await avancar(200)
    expect(result.current.get()).toBe(1)
  })

  it('só na primeira montagem: re-render (rotação, teclado) não reinicia o desenho', async () => {
    const { result, rerender } = await renderHook(() => useRevealProgress(true, false))
    await avancar(1200)
    expect(result.current.get()).toBe(1)
    await rerender({})
    await avancar(10)
    expect(result.current.get()).toBe(1)
  })
})

describe('useRevealProgress: reveal do dashboard', () => {
  it('parte de 0, espera o atraso de 200 ms e leva 900 ms (token reveal.draw): termina em 1 aos 1.100 ms', async () => {
    const { result } = await renderHook(() => useRevealProgress(true, false, true))
    await avancar(10)
    expect(result.current.get()).toBe(0)
    await avancar(150)
    expect(result.current.get()).toBe(0)
    await avancar(150)
    expect(result.current.get()).toBeGreaterThan(0)
    expect(result.current.get()).toBeLessThan(1)
    await avancar(500)
    // 810 ms: ainda desenhando (com os 420 ms de antes já estaria em 1).
    expect(result.current.get()).toBeLessThan(1)
    await avancar(300)
    expect(result.current.get()).toBe(1)
  })

  it('também não reinicia quando o componente re-renderiza', async () => {
    const { result, rerender } = await renderHook(() => useRevealProgress(true, false, true))
    await avancar(1300)
    expect(result.current.get()).toBe(1)
    await rerender({})
    await avancar(10)
    expect(result.current.get()).toBe(1)
  })
})

describe('useRevealProgress: reduzido e inativo', () => {
  it('com movimento reduzido não há atraso e o fade dura a duração base, mesmo no reveal', async () => {
    const { result } = await renderHook(() => useRevealProgress(true, true, true))
    await avancar(50)
    expect(result.current.get()).toBeGreaterThan(0)
    await avancar(400)
    expect(result.current.get()).toBe(1)
  })

  it('inativo não anima nada', async () => {
    const { result } = await renderHook(() => useRevealProgress(false, false))
    await avancar(2000)
    expect(result.current.get()).toBe(0)
  })
})
