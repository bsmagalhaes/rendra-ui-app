import { useEffect, useMemo } from 'react'
import { Gesture } from 'react-native-gesture-handler'
import { useSharedValue, withSpring } from 'react-native-reanimated'
import type { SharedValue } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { dragOffset, shouldDismiss } from './drag'
import { motionTokens } from '../../theme/motion'

const SHEET = motionTokens.spring.sheet

export interface OverlayPanOptions {
  /** Folha: 'y' (fecha para baixo, `direction` 1). Gaveta direita: 'x', 1. Gaveta esquerda: 'x', -1. */
  axis: 'x' | 'y'
  direction: 1 | -1
  /** Distância até estar fora da tela. */
  size: number
  /** Deslocamento do painel (px, com sinal): o valor que o gesto escreve e a mola devolve. */
  offset: SharedValue<number>
  /** Chamada na JS, uma vez, quando o gesto decide fechar. Quem chama decide: fechar ou abrir confirmação. */
  onDismiss: () => void
  testID: string
  activeOffsetX?: number
  failOffsetY?: [number, number]
  /**
   * `keep` (caminho `on`): ao fechar, o painel fica onde o dedo soltou e a saída continua dali com a
   * velocidade gravada. `return` (caminho estático): o painel sempre volta a 0; o `RNModal` some na hora.
   */
  afterDismiss: 'keep' | 'return'
  /** Gravados no `onEnd` quando o gesto fecha: a velocidade do dedo e a marca de "fechou por arraste". */
  closeVelocity?: SharedValue<number>
  draggedClose?: SharedValue<boolean>
}

/**
 * Pan de folha e gaveta, 100% worklet, compartilhado pelos dois caminhos (`on` e estático). Segue o
 * dedo a partir de onde o painel estava (`onStart` captura o valor atual: pegar a folha no meio da
 * entrada não a teletransporta), com fricção ao puxar além do repouso, decide por projeção (um
 * arremesso curto fecha) e entrega a velocidade à mola ao soltar, sem costura. A volta à JS é uma
 * chamada no fim (`scheduleOnRN` no `onEnd`), nunca por quadro.
 */
export function useOverlayPan({
  axis,
  direction,
  size,
  offset,
  onDismiss,
  testID,
  activeOffsetX,
  failOffsetY,
  afterDismiss,
  closeVelocity,
  draggedClose,
}: OverlayPanOptions) {
  const sizeSv = useSharedValue(size)
  const start = useSharedValue(0)
  useEffect(() => {
    sizeSv.set(size)
  }, [size, sizeSv])

  return useMemo(() => {
    let pan = Gesture.Pan()
      .withTestId(testID)
      .onStart(() => {
        'worklet'
        start.set(offset.get() * direction)
      })
      .onUpdate((event) => {
        'worklet'
        const t = (axis === 'x' ? event.translationX : event.translationY) * direction
        offset.set(direction * dragOffset(start.get() + t, sizeSv.get()))
      })
      .onEnd((event) => {
        'worklet'
        const raw = axis === 'x' ? event.velocityX : event.velocityY
        // Posição de quando o dedo soltou, no sentido de fechar (o `offset` visual já passou pela fricção).
        const position = start.get() + (axis === 'x' ? event.translationX : event.translationY) * direction
        const dismiss = shouldDismiss(position, raw * direction, sizeSv.get())
        if (dismiss) {
          closeVelocity?.set(raw)
          draggedClose?.set(true)
          scheduleOnRN(onDismiss)
          if (afterDismiss === 'keep') return
        }
        offset.set(withSpring(0, { duration: SHEET.duration, dampingRatio: SHEET.dampingRatio, velocity: raw }))
      })
    if (activeOffsetX !== undefined) pan = pan.activeOffsetX(direction * activeOffsetX)
    if (failOffsetY) pan = pan.failOffsetY(failOffsetY)
    return pan
  }, [testID, axis, direction, offset, sizeSv, start, onDismiss, activeOffsetX, failOffsetY, afterDismiss, closeVelocity, draggedClose])
}
