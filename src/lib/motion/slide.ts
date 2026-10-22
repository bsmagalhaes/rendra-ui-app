import { motionTokens } from '../../theme/motion'
import { entering, exiting, reduceSpec } from './animation'
import type { MotionSpec } from './animation'
import { easings } from './tokens'

export type SlideDirection = 'up' | 'down' | 'left' | 'right'

/** `up` nasce abaixo e sobe; `down` nasce acima e desce; `left` nasce à direita e vai para a esquerda. */
export function resolveSlide(
  kind: 'in' | 'out',
  direction: SlideDirection,
  reduced: boolean,
  delay = 0,
  distance: number = motionTokens.distance.md,
): MotionSpec {
  const spec: MotionSpec = {
    opacity: true,
    duration: kind === 'in' ? motionTokens.duration.base : motionTokens.duration.fast,
    delay,
    easing: easings.out,
  }
  if (direction === 'up') spec.translateY = distance
  if (direction === 'down') spec.translateY = -distance
  if (direction === 'left') spec.translateX = distance
  if (direction === 'right') spec.translateX = -distance
  return reduceSpec(spec, reduced)
}

export function slideIn(direction: SlideDirection, reduced: boolean, delay = 0, distance?: number) {
  return entering(resolveSlide('in', direction, reduced, delay, distance))
}

export function slideOut(direction: SlideDirection, reduced: boolean, distance?: number) {
  return exiting(resolveSlide('out', direction, reduced, 0, distance))
}
