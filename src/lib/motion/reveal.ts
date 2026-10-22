import { motionTokens } from '../../theme/motion'
import { entering, reduceSpec } from './animation'
import type { MotionSpec } from './animation'
import type { SlideDirection } from './slide'
import { easings } from './tokens'

/** Atraso do bloco `index` no reveal: `index * 120 ms`, com teto; sem cascata com movimento reduzido. */
export function staggerReveal(index: number, reduced: boolean): number {
  if (reduced) return 0
  return Math.min(index * motionTokens.reveal.stagger, motionTokens.reveal.staggerMax)
}

/** Entrada de um bloco do reveal: 600 ms em `ease-out`, deslocada pela distância, atrasada pela posição. */
export function resolveReveal(
  direction: SlideDirection,
  reduced: boolean,
  index: number,
  distance: number = motionTokens.distance.sm,
): MotionSpec {
  const spec: MotionSpec = {
    opacity: true,
    duration: motionTokens.reveal.enter,
    delay: staggerReveal(index, reduced),
    easing: easings.out,
  }
  if (direction === 'up') spec.translateY = distance
  if (direction === 'down') spec.translateY = -distance
  if (direction === 'left') spec.translateX = distance
  if (direction === 'right') spec.translateX = -distance
  return reduceSpec(spec, reduced)
}

export function revealIn(direction: SlideDirection, reduced: boolean, index: number, distance?: number) {
  return entering(resolveReveal(direction, reduced, index, distance))
}
