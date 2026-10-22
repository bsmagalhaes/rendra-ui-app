import { useCallback, useEffect, useRef } from 'react'
import { useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import { motionTokens } from '../../theme/motion'
import { timing } from './tokens'
import { useOverlayPan } from './use-overlay-pan'
import { usePresence } from './use-presence'

/** Espera antes de conferir se o pai (controlado) não fechou; se ainda aberto, a folha volta a 0. */
const RESTORE_CHECK_MS = 60

/** A saída por arraste é uma mola de 300 ms; a sem arraste, `base`. O `RNModal` fica até a maior. */
const SHEET = motionTokens.spring.sheet
export const OVERLAY_EXIT_MS = SHEET.duration

export interface OverlayMotionOptions {
  open: boolean
  /** Folha: 'y' (fecha para baixo, `direction` 1). Gaveta direita: 'x', 1. Gaveta esquerda: 'x', -1. */
  axis: 'x' | 'y'
  direction: 1 | -1
  /** Distância até estar fora da tela. */
  size: number
  reduced: boolean
  /** Chamada (na JS) quando o arraste decide fechar. Quem chama decide: fechar ou abrir confirmação. */
  onDismiss: () => void
  testID: string
  activeOffsetX?: number
  failOffsetY?: [number, number]
}

/**
 * Movimento de folha e gaveta no caminho `on`. Entrada em `slow` com a curva `drawer` (tween, não
 * mola: gaveta e folha entram por inteiro de fora da tela, e a mola sem quique daria o mesmo
 * deslocamento e deixaria a curva sem chamador). Saída em `base` pela curva `out`; saída por arraste
 * é uma mola com a velocidade do dedo e `overshootClamping`, sem costura. O pan é o `useOverlayPan`
 * (worklet, fricção ao abrir, decisão por projeção). Todo fechamento chama `onOpenChange(false)` na hora:
 * a transição `open: true -> false` dispara a saída, e o desmonte vem de `usePresence` ao fim dela.
 */
export function useOverlayMotion({
  open,
  axis,
  direction,
  size,
  reduced,
  onDismiss,
  testID,
  activeOffsetX,
  failOffsetY,
}: OverlayMotionOptions) {
  const mounted = usePresence(open, true, OVERLAY_EXIT_MS)
  const offset = useSharedValue(reduced ? 0 : direction * size)
  const backdrop = useSharedValue(0)
  const contentOpacity = useSharedValue(reduced ? 0 : 1)
  const closeVelocity = useSharedValue(0)
  const draggedClose = useSharedValue(false)
  // `open` espelhado em valores compartilhados: o desmonte e a volta ao lugar são decididos fora do render.
  const openSv = useSharedValue(open)
  const wasOpenSv = useSharedValue(false)
  // A entrada e a saída dependem só de `open`: medir a folha (muda `size`) não pode reiniciá-las.
  const sizeRef = useRef(size)
  useEffect(() => {
    sizeRef.current = size
  })

  useEffect(() => {
    const extent = sizeRef.current
    openSv.set(open)
    if (open) {
      wasOpenSv.set(true)
      draggedClose.set(false)
      backdrop.set(withTiming(1, timing('base', 'out')))
      if (reduced) {
        offset.set(0)
        contentOpacity.set(withTiming(1, timing('base', 'out')))
      } else {
        contentOpacity.set(1)
        offset.set(withTiming(0, timing('slow', 'drawer')))
      }
      return
    }
    if (!wasOpenSv.get()) return
    backdrop.set(withTiming(0, timing('base', 'out')))
    if (reduced) {
      contentOpacity.set(withTiming(0, timing('base', 'out')))
    } else if (draggedClose.get()) {
      // Fechou por arraste: a mola continua com a velocidade do dedo, sem passar do fim.
      offset.set(
        withSpring(direction * extent, {
          duration: SHEET.duration,
          dampingRatio: 1,
          velocity: closeVelocity.get(),
          overshootClamping: true,
        }),
      )
    } else {
      offset.set(withTiming(direction * extent, timing('base', 'out')))
    }
  }, [open, reduced, direction, offset, backdrop, contentOpacity, openSv, wasOpenSv, draggedClose, closeVelocity])

  const handleDismiss = useCallback(() => {
    onDismiss()
    // Controlado que não fechou (ou confirmação de descarte): a folha volta ao lugar, com a mesma velocidade.
    setTimeout(() => {
      if (!openSv.get()) return
      draggedClose.set(false)
      offset.set(withSpring(0, { duration: SHEET.duration, dampingRatio: SHEET.dampingRatio, velocity: closeVelocity.get() }))
    }, RESTORE_CHECK_MS)
  }, [onDismiss, offset, openSv, draggedClose, closeVelocity])

  const gesture = useOverlayPan({
    axis,
    direction,
    size,
    offset,
    onDismiss: handleDismiss,
    testID,
    activeOffsetX,
    failOffsetY,
    afterDismiss: 'keep',
    closeVelocity,
    draggedClose,
  })

  return { mounted, offset, backdrop, contentOpacity, gesture }
}
