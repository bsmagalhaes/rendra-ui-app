import { AccessibilityInfo } from 'react-native'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import { useReducedMotion as useSystemReducedMotion } from 'react-native-reanimated'
import { useReducedMotion } from './reduced-motion'

// O hook do Reanimated lê o ajuste do sistema de forma síncrona (constante da partida do app); o
// teste controla esse valor para provar o primeiro quadro.
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated'),
  __esModule: true,
  useReducedMotion: jest.fn(() => false),
}))
const mockSistema = useSystemReducedMotion as jest.Mock

beforeEach(() => mockSistema.mockReturnValue(false))

describe('useReducedMotion', () => {
  it('devolve false quando AccessibilityInfo.isReduceMotionEnabled resolve false', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false)
    const { result } = await renderHook(() => useReducedMotion())
    await waitFor(() => expect(result.current).toBe(false))
  })

  it('devolve true quando AccessibilityInfo.isReduceMotionEnabled resolve true', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true)
    const { result } = await renderHook(() => useReducedMotion())
    await waitFor(() => expect(result.current).toBe(true))
  })

  it('devolve false, sem quebrar, quando isReduceMotionEnabled rejeita', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockRejectedValue(new Error('indisponível'))
    const { result } = await renderHook(() => useReducedMotion())
    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current).toBe(false)
  })

  it('reage ao evento reduceMotionChanged', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false)
    let emit: ((value: boolean) => void) | undefined
    // `addEventListener` é sobrecarregado (evento de mudança vs. evento de anúncio do iOS, com
    // handlers de assinaturas diferentes); o cast explícito para a assinatura do evento de mudança
    // evita que o tsc resolva a sobrecarga errada (announcementFinished) ao tipar o mock.
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(
      ((_event: string, handler: (value: boolean) => void) => {
        emit = handler
        return { remove: jest.fn() }
      }) as unknown as typeof AccessibilityInfo.addEventListener,
    )
    const { result } = await renderHook(() => useReducedMotion())
    await waitFor(() => expect(result.current).toBe(false))
    await act(async () => {
      emit?.(true)
    })
    expect(result.current).toBe(true)
  })

  it('ignora o valor inicial e o evento que chegam depois do desmonte', async () => {
    let resolver: (value: boolean) => void = () => {}
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(
      new Promise<boolean>((resolve) => {
        resolver = resolve
      }),
    )
    let emit: ((value: boolean) => void) | undefined
    const remove = jest.fn()
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(
      ((_event: string, handler: (value: boolean) => void) => {
        emit = handler
        return { remove }
      }) as unknown as typeof AccessibilityInfo.addEventListener,
    )
    const { result, unmount } = await renderHook(() => useReducedMotion())
    await unmount()
    await act(async () => {
      resolver(true)
      emit?.(true)
    })
    expect(result.current).toBe(false)
    expect(remove).toHaveBeenCalledTimes(1)
  })

  it('A8: com o ajuste do sistema ligado, o PRIMEIRO quadro já vem reduzido (sem esperar a Promise)', async () => {
    mockSistema.mockReturnValue(true)
    // a Promise nunca resolve: só o valor síncrono do Reanimated pode explicar o resultado
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(new Promise<boolean>(() => {}))
    const quadros: boolean[] = []
    await renderHook(() => {
      const valor = useReducedMotion()
      quadros.push(valor)
      return valor
    })
    expect(quadros[0]).toBe(true)
    expect(quadros.every((v) => v)).toBe(true)
  })

  it('B4: mesmo semeado pelo Reanimated, a mudança do sistema com o app aberto ainda reage (nos dois sentidos)', async () => {
    mockSistema.mockReturnValue(true)
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true)
    let emit: ((value: boolean) => void) | undefined
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(
      ((_event: string, handler: (value: boolean) => void) => {
        emit = handler
        return { remove: jest.fn() }
      }) as unknown as typeof AccessibilityInfo.addEventListener,
    )
    const { result } = await renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)
    await act(async () => {
      emit?.(false)
    })
    expect(result.current).toBe(false)
    await act(async () => {
      emit?.(true)
    })
    expect(result.current).toBe(true)
  })
})
