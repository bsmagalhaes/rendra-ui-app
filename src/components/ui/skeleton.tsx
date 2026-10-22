import { useContext, useEffect, useId } from 'react'
import { View } from 'react-native'
import Animated, {
  type WithTimingConfig,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'
import { cn } from '../../lib/cn'
import { BrandContext } from '../../brand/brand-context'
import { themeColorString } from '../../theme/vars'
import { useReducedMotion } from '../../lib/reduced-motion'
import { useMotion } from '../../lib/motion/context'
import { timing } from '../../lib/motion/tokens'

export interface SkeletonProps {
  className?: string
  testID?: string
}

/**
 * Config do pulso de opacidade (`off`): a duração `pulse` e a curva `ease-in-out` dos tokens, sem
 * literal. Pura, para o teste conferir.
 */
export function skeletonPulseConfig(): WithTimingConfig {
  return timing('pulse', 'inOut')
}

/** Config do brilho (`on`): cruza o bloco em `pulse` (1.000 ms) pela curva `move`. */
export function skeletonShimmerConfig(): WithTimingConfig {
  return timing('pulse', 'move')
}

/** Translação do brilho em % da largura do PRÓPRIO bloco: de fora, à esquerda, a fora, à direita. */
export function shimmerTranslate(progress: number): `${number}%` {
  'worklet'
  return `${-100 + progress * 200}%`
}

/** Opacidade da faixa de brilho (suave): 12% da cor `muted-foreground` do tema no centro. */
export const SHIMMER_PEAK = 0.12

function Shimmer({ testID, progress }: { testID?: string; progress: { get: () => number } }) {
  // Fora de um BrandProvider não há cor de tema: sem brilho, só o bloco (nunca quebra).
  const brand = useContext(BrandContext)
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const color = brand ? themeColorString(brand.themeVars, '--rendra-muted-foreground') : ''
  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    transform: [{ translateX: shimmerTranslate(progress.get()) }],
  }))
  if (!brand) return null
  return (
    <Animated.View testID={testID} pointerEvents="none" style={style}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={color} stopOpacity={0} />
            <Stop offset="50%" stopColor={color} stopOpacity={SHIMMER_PEAK} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  )
}

export function Skeleton({ className, testID }: SkeletonProps) {
  const reducedMotion = useReducedMotion()
  const motionOn = useMotion() === 'on'
  const opacity = useSharedValue(1)
  const shimmer = useSharedValue(0)

  useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(opacity)
      cancelAnimation(shimmer)
      opacity.set(1)
      shimmer.set(0)
      return
    }
    if (motionOn) {
      // `on`: brilho suave que cruza o bloco (transform), em vez do pulso de opacidade.
      opacity.set(1)
      shimmer.set(0)
      shimmer.set(withRepeat(withTiming(1, skeletonShimmerConfig()), -1, false))
      return () => cancelAnimation(shimmer)
    }
    // `off`: pulso de opacidade, com a duração e a curva dos tokens.
    opacity.set(withRepeat(withTiming(0.5, skeletonPulseConfig()), -1, true))
    return () => cancelAnimation(opacity)
  }, [reducedMotion, motionOn, opacity, shimmer])

  // B12 (veredito do Opus): o Animated.View só com `style` não herda o tamanho do pai por
  // className; sem width/height 100% aqui, o View filho (`size-full`) resolvia 100% de uma
  // árvore de percentuais vazia e o Skeleton ficava invisível (Jest passava, tela não mostrava
  // nada). Mesmo padrão já documentado em brand-feedback-icon.tsx:107-111.
  const animated = useAnimatedStyle(() => ({ opacity: opacity.get(), width: '100%', height: '100%' }))

  return (
    <View
      testID={testID}
      dataSet={{ rendra: 'SKEL-001' }}
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={cn('overflow-hidden rounded-block', className)}
    >
      <Animated.View testID={testID ? `${testID}-pulso` : undefined} style={animated}>
        <View className="size-full bg-muted" />
      </Animated.View>
      {motionOn && !reducedMotion ? <Shimmer testID={testID ? `${testID}-brilho` : undefined} progress={shimmer} /> : null}
    </View>
  )
}
