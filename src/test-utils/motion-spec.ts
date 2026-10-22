import type { MotionSpec } from '../lib/motion/animation'

/** Lê a descrição (`spec`) que `entering`/`exiting` anexam ao worklet; só os testes a usam. */
export function specOf(fn: unknown): MotionSpec | undefined {
  return (fn as { spec?: MotionSpec } | undefined)?.spec
}
