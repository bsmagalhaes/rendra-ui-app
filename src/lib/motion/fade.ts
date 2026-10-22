import { motionTokens } from '../../theme/motion'
import { entering, exiting, reduceSpec } from './animation'
import type { MotionSpec } from './animation'
import { easings } from './tokens'

export function resolveFade(kind: 'in' | 'out', reduced: boolean, delay = 0): MotionSpec {
  const duration = kind === 'in' ? motionTokens.duration.base : motionTokens.duration.fast
  return reduceSpec({ opacity: true, duration, delay, easing: easings.out }, reduced)
}

export function fadeIn(reduced: boolean, delay = 0) {
  return entering(resolveFade('in', reduced, delay))
}

export function fadeOut(reduced: boolean) {
  return exiting(resolveFade('out', reduced))
}
