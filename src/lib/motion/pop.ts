import { motionTokens } from '../../theme/motion'
import { entering, reduceSpec } from './animation'
import type { MotionSpec } from './animation'
import { easings } from './tokens'

/**
 * Entrada do check do checkbox (uso frequente): de 0,9 a 1 com opacidade em `fast`, `ease-out`, sem quique.
 * O pop com a curva `back` (de `scales.pop`, 0,8) é só da cota rara e mora no ícone de feedback da marca.
 */
export function resolveCheck(reduced: boolean, delay = 0): MotionSpec {
  return reduceSpec(
    { opacity: true, scale: motionTokens.scales.small, duration: motionTokens.duration.fast, delay, easing: easings.out },
    reduced,
  )
}

export function checkIn(reduced: boolean, delay = 0) {
  return entering(resolveCheck(reduced, delay))
}
