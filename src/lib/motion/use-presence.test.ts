import { act, renderHook } from '@testing-library/react-native'
import { usePresence } from './use-presence'

describe('usePresence', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('inativo, mounted = open no mesmo render e não cria timer', async () => {
    const { result, rerender } = await renderHook(({ open }: { open: boolean }) => usePresence(open, false, 200), {
      initialProps: { open: true },
    })
    expect(result.current).toBe(true)
    const espia = jest.spyOn(globalThis, 'setTimeout')
    await rerender({ open: false })
    expect(result.current).toBe(false)
    // nenhum timer de saída (200 ms) foi criado pelo hook
    expect(espia.mock.calls.filter((chamada: unknown[]) => chamada[1] === 200)).toHaveLength(0)
    espia.mockRestore()
  })

  it('ativo, ao fechar mantém mounted até exitMs e então desmonta', async () => {
    const { result, rerender } = await renderHook(({ open }: { open: boolean }) => usePresence(open, true, 200), {
      initialProps: { open: true },
    })
    expect(result.current).toBe(true)
    await rerender({ open: false })
    expect(result.current).toBe(true)
    await act(async () => {
      jest.advanceTimersByTime(199)
    })
    expect(result.current).toBe(true)
    await act(async () => {
      jest.advanceTimersByTime(2)
    })
    expect(result.current).toBe(false)
  })

  it('reabrir durante a saída cancela o desmonte', async () => {
    const { result, rerender } = await renderHook(({ open }: { open: boolean }) => usePresence(open, true, 200), {
      initialProps: { open: true },
    })
    await rerender({ open: false })
    await act(async () => {
      jest.advanceTimersByTime(100)
    })
    await rerender({ open: true })
    await act(async () => {
      jest.advanceTimersByTime(500)
    })
    expect(result.current).toBe(true)
  })

  it('ativo e aberto desde a montagem já nasce montado', async () => {
    const { result } = await renderHook(() => usePresence(true, true, 200))
    expect(result.current).toBe(true)
  })
})
