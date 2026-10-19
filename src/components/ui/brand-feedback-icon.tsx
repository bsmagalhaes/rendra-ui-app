import { useEffect } from 'react'
import { View } from 'react-native'
import Animated, { Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated'
import { cssInterop } from 'nativewind'
import Svg, { Circle, Path } from 'react-native-svg'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react-native'
import { useBrand } from '../../brand/use-brand'
import type { FeedbackType } from '../../brand/types'
import { useReducedMotion } from '../../lib/reduced-motion'
import { cn } from '../../lib/cn'

// Mesmo padrão de gradient.tsx:6: o Svg só resolve `currentColor` a partir do próprio `style.color`,
// então className com cor só tem efeito no Svg se o cssInterop mapear className -> style neste componente.
cssInterop(Svg, { className: 'style' })

export type FeedbackIconSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export interface BrandFeedbackIconProps {
  type: FeedbackType
  size?: FeedbackIconSize
  label?: string
  animated?: boolean
  /**
   * Cor do símbolo: `'state'` (padrão) usa a cor do estado (sucesso, erro, atenção, informação);
   * `'brand'` usa a cor primária da marca e deixa só o selo na cor do estado.
   */
  symbolTone?: 'state' | 'brand'
  /**
   * Padrão `false`: o selo do estado fica sobreposto ao canto do símbolo, como sempre foi. Com
   * `true`, o selo vira o ícone do estado (na cor do estado) ao lado do símbolo, com metade da
   * altura dele. O componente fica mais largo que o `size` (símbolo + selo): confira o espaço
   * onde ele entra.
   */
  statusBadge?: boolean
  /**
   * `'pop'` (padrão, 420 ms, com quique) ou `'encaixe'` (240 ms, curva de saída suave, sem
   * quique e sem tremor). Com `animated={false}` ou movimento reduzido no sistema, não anima.
   */
  animation?: 'pop' | 'encaixe'
  className?: string
  testID?: string
}

export const feedbackLabels: Record<FeedbackType, string> = {
  success: 'Sucesso',
  error: 'Erro',
  warning: 'Atenção',
  info: 'Informação',
}

export const colorClass: Record<FeedbackType, string> = {
  success: 'text-success',
  error: 'text-destructive',
  warning: 'text-warning',
  info: 'text-info',
}
/** Cor do símbolo por tom: `'state'` segue o estado, `'brand'` usa a cor primária. */
export const symbolToneClass = (type: FeedbackType, tone: 'state' | 'brand'): string => (tone === 'brand' ? 'text-primary' : colorClass[type])
const badgeBgClass: Record<FeedbackType, string> = {
  success: 'bg-success',
  error: 'bg-destructive',
  warning: 'bg-warning',
  info: 'bg-info',
}
const badgeForegroundClass: Record<FeedbackType, string> = {
  success: 'text-success-foreground',
  error: 'text-destructive-foreground',
  warning: 'text-warning-foreground',
  info: 'text-info-foreground',
}
const sizeClass: Record<FeedbackIconSize, string> = {
  sm: 'size-icon-sm',
  md: 'size-icon-md',
  lg: 'size-icon-lg',
  xl: 'size-12',
  '2xl': 'size-16',
}
// Com `statusBadge` a raiz só fixa a altura (a largura é símbolo + selo); o símbolo mantém o quadrado.
const heightClass: Record<FeedbackIconSize, string> = {
  sm: 'h-icon-sm',
  md: 'h-icon-md',
  lg: 'h-icon-lg',
  xl: 'h-12',
  '2xl': 'h-16',
}
const stateIcon = { success: CheckCircle2, error: XCircle, warning: AlertTriangle, info: Info }
const glyphPath: Record<FeedbackType, string> = {
  success: 'M3 6.2 5.1 8.2 9 4',
  error: 'M4 4l4 4M8 4 4 8',
  warning: 'M6 3.2v3.3M6 8.8v0',
  info: 'M6 3.2v0M6 5.5v3.3',
}

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1)
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1)
const EASE_SPRING = Easing.bezier(0.34, 1.56, 0.64, 1)

/**
 * Tempo de cada animação (exposto como `colorClass`, para o teste afirmar a configuração).
 * `pop`: sobe a 1,12 e assenta em 1 (252 ms + 168 ms) com a curva de mola. `encaixe`: uma só
 * trilha de 240 ms, de 0,92 a 1 com opacidade, em curva de saída suave, sem quique e sem tremor.
 */
export const animationTimings = {
  pop: { duration: 420, easing: 'spring' },
  encaixe: { duration: 240, easing: 'ease-out' },
} as const

const AnimatedPath = Animated.createAnimatedComponent(Path)

export function BrandFeedbackIcon({
  type,
  size = 'md',
  label,
  animated = false,
  symbolTone = 'state',
  statusBadge = false,
  animation = 'pop',
  className,
  testID,
}: BrandFeedbackIconProps) {
  const { brand } = useBrand()
  const reducedMotion = useReducedMotion()
  const playAnimation = animated && !reducedMotion

  const symbolOpacity = useSharedValue(playAnimation ? 0 : 1)
  const encaixe = animation === 'encaixe'
  const startScale = encaixe ? 0.92 : 0.4
  const symbolScale = useSharedValue(playAnimation ? startScale : 1)
  const badgeOpacity = useSharedValue(playAnimation ? 0 : 1)
  const badgeScale = useSharedValue(playAnimation ? startScale : 1)
  // No `encaixe` o glifo não se desenha: o selo entra inteiro junto com o símbolo.
  const strokeDashoffset = useSharedValue(playAnimation && !encaixe ? 1 : 0)
  const shakeX = useSharedValue(0)

  // pop: 0.4 -> 1.12 (60% do tempo) -> 1 (40% restante), spec:304
  const pop = () => withSequence(withTiming(1.12, { duration: 252, easing: EASE_SPRING }), withTiming(1, { duration: 168, easing: EASE_SPRING }))

  useEffect(() => {
    if (!playAnimation) return
    if (encaixe) {
      // Uma trilha só, 240 ms, saída suave, sem atraso e sem tremor (nem no erro).
      const trilha = { duration: animationTimings.encaixe.duration, easing: EASE_OUT }
      symbolOpacity.value = withTiming(1, trilha)
      symbolScale.value = withTiming(1, trilha)
      badgeOpacity.value = withTiming(1, trilha)
      badgeScale.value = withTiming(1, trilha)
      return
    }
    symbolOpacity.value = withTiming(1, { duration: 420, easing: EASE_SPRING })
    symbolScale.value = pop()
    badgeOpacity.value = withDelay(120, withTiming(1, { duration: 420, easing: EASE_SPRING }))
    badgeScale.value = withDelay(120, pop())
    strokeDashoffset.value = withDelay(200, withTiming(0, { duration: 420, easing: EASE_OUT }))
    if (type === 'error') {
      shakeX.value = withDelay(
        620,
        withSequence(
          withTiming(-8, { duration: 84, easing: EASE_IN_OUT }),
          withTiming(8, { duration: 84, easing: EASE_IN_OUT }),
          withTiming(-8, { duration: 84, easing: EASE_IN_OUT }),
          withTiming(8, { duration: 84, easing: EASE_IN_OUT }),
          withTiming(0, { duration: 84, easing: EASE_IN_OUT }),
        ),
      )
    }
  }, [playAnimation, encaixe, type, symbolOpacity, symbolScale, badgeOpacity, badgeScale, strokeDashoffset, shakeX])

  // Animated.View leva só style (opacity/transform, mais width/height 100% para manter a árvore de
  // percentuais definida sem className); as classes de cor, tamanho e posição ficam em View/Svg internos.
  const symbolStyle = useAnimatedStyle(() => ({
    opacity: symbolOpacity.value,
    transform: [{ scale: symbolScale.value }],
    width: '100%',
    height: '100%',
  }))
  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
    transform: [{ scale: badgeScale.value }],
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  }))
  const wrapperStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }))
  const glyphAnimatedProps = useAnimatedProps(() => ({ strokeDashoffset: strokeDashoffset.value }))

  const EstadoIcon = stateIcon[type]

  return (
    <Animated.View style={wrapperStyle}>
      <View
        testID={testID}
        dataSet={{ rendra: 'BFI-001' }}
        accessible={Boolean(label)}
        accessibilityRole={label ? 'image' : undefined}
        accessibilityLabel={label}
        accessibilityElementsHidden={!label}
        importantForAccessibility={label ? 'auto' : 'no-hide-descendants'}
        className={cn(
          'shrink-0',
          statusBadge ? cn('flex-row items-end gap-1', heightClass[size]) : cn('relative', sizeClass[size]),
          className,
        )}
      >
        <View className={statusBadge ? cn('shrink-0', sizeClass[size]) : 'size-full'}>
          <Animated.View style={symbolStyle}>
            {brand.symbol ? (
              <brand.symbol className={cn('size-full', symbolToneClass(type, symbolTone))} />
            ) : (
              <Svg
                viewBox="0 0 24 24"
                className={cn('size-full', symbolToneClass(type, symbolTone))}
                testID={testID ? `${testID}-symbol` : undefined}
              >
                <Circle cx={12} cy={12} r={10} fill="currentColor" opacity={0.16} />
                <Circle cx={12} cy={12} r={6} fill="currentColor" />
              </Svg>
            )}
          </Animated.View>
        </View>
        {statusBadge ? (
          <View
            className="aspect-square h-1/2 shrink-0 items-center justify-center"
            testID={testID ? `${testID}-estado` : undefined}
          >
            <Animated.View style={badgeStyle}>
              <EstadoIcon className={cn('size-full', colorClass[type])} />
            </Animated.View>
          </View>
        ) : (
          <View className={cn('absolute right-0 bottom-0 size-1/2 items-center justify-center rounded-full', badgeBgClass[type])}>
            <Animated.View style={badgeStyle}>
              <Svg
                viewBox="0 0 12 12"
                className={cn('size-2/3', badgeForegroundClass[type])}
                testID={testID ? `${testID}-glyph` : undefined}
              >
                <AnimatedPath
                  d={glyphPath[type]}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={1}
                  animatedProps={glyphAnimatedProps}
                />
              </Svg>
            </Animated.View>
          </View>
        )}
      </View>
    </Animated.View>
  )
}
