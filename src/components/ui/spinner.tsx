import { useEffect } from 'react'
import { View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { Loader2 } from 'lucide-react-native'
import { Text } from '../internal/text'
import { cn } from '../../lib/cn'
import { a11yPresets } from '../../lib/a11y'
import { useReducedMotion } from '../../lib/reduced-motion'
import { easings } from '../../lib/motion/tokens'

/**
 * Indicador de carregamento unico do sistema (item E1 do levantamento da Sincronizacao 1).
 * Substitui qualquer `Loader2` solto em `Button`, `Input` e `Select` (Tarefa 8.2). Sem `label` e
 * decorativo (oculto de leitor de tela); com `label`, anuncia o carregamento (`role="status"`,
 * texto so acessivel). Para de girar quando o sistema pede menos movimento.
 */
export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  /** Nome do que esta carregando. Vazio (padrao): decorativo, sem anuncio de leitor de tela. */
  label?: string
  /** Repassada ao icone (nao a raiz): no nativo a cor do texto so resolve no proprio SVG, sem
   *  herdar de um ancestral (achado C18 do veredito do Opus). */
  className?: string
  testID?: string
}

const sizeClass: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'size-icon-sm',
  md: 'size-icon-md',
  lg: 'size-icon-lg',
}

// Equivalente RN da tecnica sr-only do web (mesmo padrao de page-header.tsx:19-20): visivel a
// leitor de tela, invisivel na tela.
const visuallyHiddenClassName = 'absolute h-px w-px overflow-hidden'

/**
 * Giro do Spinner, funcao pura testavel isolada (mesmo padrao de `modalCardStyle`, modal.tsx:47):
 * parado (0deg) com reduce motion, senao o progresso do laco continuo (0 a 1) em graus (0 a 360).
 */
export function spinnerRotationStyle({
  progresso,
  reduceMotion,
}: {
  progresso: number
  reduceMotion: boolean
}): { transform: [{ rotate: string }] } {
  'worklet'
  return { transform: [{ rotate: `${reduceMotion ? 0 : progresso * 360}deg` }] }
}

export function Spinner({ size = 'md', label, className, testID }: SpinnerProps) {
  const reduceMotion = useReducedMotion()
  const spin = useSharedValue(0)

  useEffect(() => {
    if (reduceMotion) {
      spin.value = 0
      return
    }
    spin.value = withRepeat(withTiming(1, { duration: 800, easing: easings.linear }), -1, false)
  }, [reduceMotion, spin])

  const rotationStyle = useAnimatedStyle(() => spinnerRotationStyle({ progresso: spin.value, reduceMotion }))

  const icon = (
    <Animated.View style={rotationStyle}>
      <Loader2 testID={testID ? `${testID}-icone` : undefined} className={cn(sizeClass[size], className)} />
    </Animated.View>
  )

  if (!label) {
    return (
      <View
        testID={testID}
        dataSet={{ rendra: 'SPIN-001' }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="flex-row items-center"
      >
        {icon}
      </View>
    )
  }

  return (
    <View
      testID={testID}
      dataSet={{ rendra: 'SPIN-001' }}
      role={a11yPresets.status.role}
      accessible
      className="flex-row items-center gap-2"
    >
      {icon}
      <Text className={visuallyHiddenClassName}>{label}</Text>
    </View>
  )
}
