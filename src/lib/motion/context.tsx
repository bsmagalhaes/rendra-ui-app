import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { MotionMode } from '../../theme/motion'

export type { MotionMode }

const MotionContext = createContext<MotionMode>('off')

export function MotionProvider({ motion, children }: { motion: MotionMode; children: ReactNode }) {
  return <MotionContext.Provider value={motion}>{children}</MotionContext.Provider>
}

/** `'off'` fora de qualquer provider; nunca lança (ao contrário de `useBrand`). */
export function useMotion(): MotionMode {
  return useContext(MotionContext)
}
