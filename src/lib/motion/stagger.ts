import { motionTokens } from '../../theme/motion'

/** Atraso do item `index`: `index * passo`, com teto. */
export function staggerDelay(index: number): number {
  return Math.min(index * motionTokens.stagger.step, motionTokens.stagger.cap)
}

/** Com movimento reduzido não há cascata. */
export function stagger(index: number, reduced: boolean): number {
  return reduced ? 0 : staggerDelay(index)
}
