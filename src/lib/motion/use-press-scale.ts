import { useCallback } from 'react'
import { useSharedValue, withTiming } from 'react-native-reanimated'
import { motionTokens } from '../../theme/motion'
import { pressTiming } from './tokens'
import { useMotionPreset } from './use-motion-preset'

/**
 * Escala no toque (token `press`: 120 ms, `ease-out`, sem quique), para componentes em que só uma parte
 * visual escala (a caixa do checkbox). `pressProps` é vazio fora de `on` (nenhum handler novo no `Pressable`).
 */
export function usePressScale(pressScale: number = motionTokens.scales.press) {
  const { active, reduced } = useMotionPreset()
  const scale = useSharedValue(1)
  const onPressIn = useCallback(() => {
    if (!reduced) scale.set(withTiming(pressScale, pressTiming()))
  }, [reduced, scale, pressScale])
  const onPressOut = useCallback(() => {
    if (!reduced) scale.set(withTiming(1, pressTiming()))
  }, [reduced, scale])
  return { active, scale, pressProps: active ? { onPressIn, onPressOut } : {} }
}
