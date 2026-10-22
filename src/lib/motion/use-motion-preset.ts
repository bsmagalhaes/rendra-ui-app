import { useReducedMotion } from '../reduced-motion'
import { useMotion } from './context'

/** `active` só com `motion="on"`; `reduced` repete o movimento reduzido do sistema. */
export function useMotionPreset(): { active: boolean; reduced: boolean } {
  const mode = useMotion()
  const reduced = useReducedMotion()
  return { active: mode === 'on', reduced }
}
