import { useEffect } from 'react'
import { useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import { motionTokens } from '../../theme/motion'
import { reducedTiming, revealTiming, timing } from './tokens'

/**
 * Progresso (0 a 1) da revelação do gráfico, só na PRIMEIRA montagem: não reinicia quando a largura
 * ou a altura mudam (rotação, teclado). Rotina: `draw` (420 ms, `ease-out`, sem atraso). Dentro de um
 * `RevealScope` (o dashboard, `reveal = true`): 900 ms depois de 200 ms de atraso. Com movimento
 * reduzido, só um fade em `base`, sem atraso. Inativo (`motion="off"`), não anima nada.
 */
export function useRevealProgress(active: boolean, reduced: boolean, reveal = false) {
  const progress = useSharedValue(0)

  useEffect(() => {
    if (!active) return
    progress.set(0)
    if (reduced) progress.set(withTiming(1, reducedTiming()))
    else if (reveal) progress.set(withDelay(motionTokens.delay.draw, withTiming(1, revealTiming('draw'))))
    else progress.set(withTiming(1, timing('draw', 'out')))
  }, [active, reduced, reveal, progress])

  return progress
}
