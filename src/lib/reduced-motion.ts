import { useEffect, useState } from 'react'
import { AccessibilityInfo } from 'react-native'
import { useReducedMotion as useSystemReducedMotion } from 'react-native-reanimated'

/**
 * Movimento reduzido do sistema. O estado nasce do valor SÍNCRONO do Reanimated (o ajuste lido na
 * partida do app), então o primeiro quadro já vem certo para quem pediu menos movimento; a
 * assinatura do `AccessibilityInfo` continua, porque o hook do Reanimated não reage a uma mudança
 * feita com o app aberto (B4 do parecer).
 */
// O mock do Reanimated que o `expo-router/testing-library` instala não traz `useReducedMotion` (o próprio mock
// avisa "ADD ME IF NEEDED"); fora do teste o hook sempre existe.
const lerAjusteDoSistema: () => boolean = typeof useSystemReducedMotion === 'function' ? useSystemReducedMotion : () => false

export function useReducedMotion(): boolean {
  const sistema = lerAjusteDoSistema()
  const [reducedMotion, setReducedMotion] = useState(sistema)

  useEffect(() => {
    let mounted = true

    AccessibilityInfo.isReduceMotionEnabled().catch(() => false).then((value) => {
      if (mounted) setReducedMotion(value)
    })

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      if (mounted) setReducedMotion(value)
    })

    return () => {
      mounted = false
      subscription.remove()
    }
  }, [])

  return reducedMotion
}
