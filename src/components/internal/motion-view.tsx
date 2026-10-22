import { useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import { Platform, Pressable, TextInput, View } from 'react-native'
import type { PressableProps } from 'react-native'
import Animated, {
  type BaseAnimationBuilder,
  type EntryExitAnimationFunction,
  type LayoutAnimationFunction,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  ReduceMotion,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { motionTokens } from '../../theme/motion'
import { pressTiming, revealTiming, springConfigs } from '../../lib/motion/tokens'
import { useMotionPreset } from '../../lib/motion/use-motion-preset'
import { layoutTransition } from '../../lib/motion/layout'
import type { MotionSpec } from '../../lib/motion/animation'
import { formatCount } from '../../lib/motion/count'
import type { Countable } from '../../lib/motion/count'
import { useBrand } from '../../brand/use-brand'
import { themeColorString } from '../../theme/vars'

type Animatable = SharedValue<number> | number

function read(value: Animatable): number {
  'worklet'
  return typeof value === 'number' ? value : value.get()
}

export interface MotionViewProps {
  children?: ReactNode
  entering?: EntryExitAnimationFunction | BaseAnimationBuilder | typeof BaseAnimationBuilder
  exiting?: EntryExitAnimationFunction | BaseAnimationBuilder | typeof BaseAnimationBuilder
  layout?: LayoutAnimationFunction | BaseAnimationBuilder | typeof BaseAnimationBuilder
  /** Largura e altura de 100% do pai (um `Animated.View` sem classes não herda o tamanho). */
  fill?: boolean
  /** Só a largura de 100% do pai: o texto longo (sem espaço) quebra dentro da coluna em vez de empurrar a tela. */
  fillWidth?: boolean
  translateX?: Animatable
  translateY?: Animatable
  scale?: Animatable
  opacity?: Animatable
  /** Largura em px, só para indicadores medidos por `onLayout`. */
  width?: Animatable
  height?: Animatable
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only'
  testID?: string
}

/**
 * Único lugar do caminho `on` com `style` animado (R3 liberado só aqui). API fechada: sem `style`,
 * `className` nem objeto de estilo vindo do chamador, só `entering`/`exiting`/`layout`, `fill` e
 * entradas de valor numéricas ou `SharedValue`. As classes ficam no filho (R5).
 */
export function MotionView({
  children,
  entering,
  exiting,
  layout,
  fill = false,
  fillWidth = false,
  translateX,
  translateY,
  scale,
  opacity,
  width,
  height,
  pointerEvents,
  testID,
}: MotionViewProps) {
  const animated = useAnimatedStyle(() => {
    const out: Record<string, unknown> = {}
    const transform: Record<string, number>[] = []
    if (translateX !== undefined) transform.push({ translateX: read(translateX) })
    if (translateY !== undefined) transform.push({ translateY: read(translateY) })
    if (scale !== undefined) transform.push({ scale: read(scale) })
    if (transform.length > 0) out.transform = transform
    if (opacity !== undefined) out.opacity = read(opacity)
    if (width !== undefined) out.width = read(width)
    else if (fill || fillWidth) out.width = '100%'
    if (height !== undefined) out.height = read(height)
    else if (fill) out.height = '100%'
    return out
  })

  return (
    <Animated.View
      testID={testID}
      entering={entering}
      exiting={exiting}
      layout={layout}
      pointerEvents={pointerEvents}
      style={animated}
    >
      {children}
    </Animated.View>
  )
}

export interface MotionPressableProps extends Omit<PressableProps, 'style' | 'className' | 'children'> {
  children?: ReactNode
  /** Classes do `Pressable` (área de toque). */
  className?: string
  /** Classes do `View` filho, que é o que escala. */
  contentClassName?: string
  /** Escala no toque; padrão `motionTokens.scales.press`. */
  pressScale?: number
  /** Cota rara (a estrela do Rating): ao soltar, volta com a mola `playful` (quique). Padrão: sem quique. */
  playful?: boolean
}

/**
 * `Pressable` com escala no toque (UI thread): `press` (120 ms, `ease-out`, 0,97) ao tocar e ao soltar,
 * sem mola nem quique, porque é a interação mais frequente do app. Sem movimento reduzido ela não escala.
 * `Pressable (área de toque) > MotionView (escala) > View (contentClassName)`.
 */
export function MotionPressable({
  children,
  className,
  contentClassName,
  pressScale = motionTokens.scales.press,
  playful = false,
  onPressIn,
  onPressOut,
  testID,
  ...rest
}: MotionPressableProps) {
  const { reduced } = useMotionPreset()
  const scale = useSharedValue(1)

  const handleIn = useCallback<NonNullable<PressableProps['onPressIn']>>(
    (event) => {
      if (!reduced) scale.set(withTiming(pressScale, pressTiming()))
      onPressIn?.(event)
    },
    [reduced, scale, pressScale, onPressIn],
  )
  const handleOut = useCallback<NonNullable<PressableProps['onPressOut']>>(
    (event) => {
      if (!reduced) scale.set(playful ? withSpring(1, springConfigs.playful) : withTiming(1, pressTiming()))
      onPressOut?.(event)
    },
    [reduced, scale, playful, onPressOut],
  )

  return (
    <Pressable testID={testID} className={className} onPressIn={handleIn} onPressOut={handleOut} {...rest}>
      <MotionView fill testID={testID ? `${testID}-motion` : undefined} scale={scale}>
        <View className={contentClassName}>{children}</View>
      </MotionView>
    </Pressable>
  )
}

export interface MotionPresenceProps {
  children: ReactNode
  /** Preset de entrada (recebe `reduced`); sem ele não há entrada. */
  enter?: (reduced: boolean) => EntryExitAnimationFunction
  exit?: (reduced: boolean) => EntryExitAnimationFunction
  /** Anima mudanças de posição e tamanho do filho. */
  layout?: boolean
  fill?: boolean
  fillWidth?: boolean
  testID?: string
  /** Remonta o envoltório animado quando muda (só em `on`; em `off` não há nó para remontar). */
  resetKey?: string
  /**
   * No navegador a Reanimated ignora o worklet de `entering` (e um `Keyframe` deixa o nó em
   * `position:absolute` ao fim), então a entrada vira valores animados a partir do `spec` do preset
   * (deslocamento, duração, atraso e curva). Padrão `true`; passe `false` para desligar. Sem efeito
   * no nativo nem sem `enter`. No navegador o `layout` segue junto, mas o `exit` por worklet não
   * (a Reanimated só avisa e não anima): use `webExit`.
   */
  webEnter?: boolean
  /**
   * Saída só do navegador, por builder pré-definido (`FadeOutDown`, `FadeOut`), o único tipo de saída
   * que a Reanimated web anima. Recebe `reduced`; ignorada no nativo, que usa `exit`.
   */
  webExit?: (reduced: boolean) => BaseAnimationBuilder | typeof BaseAnimationBuilder
}

/** Entrada do navegador por valores animados: progresso 0 a 1 com atraso, sem Layout Animation. */
function WebEnter({
  spec,
  testID,
  fill,
  fillWidth,
  layout,
  exiting,
  children,
}: {
  spec: MotionSpec
  testID?: string
  fill?: boolean
  fillWidth?: boolean
  layout?: MotionViewProps['layout']
  exiting?: MotionViewProps['exiting']
  children: ReactNode
}) {
  const progress = useSharedValue(0)
  const { translateX, translateY, scale, delay, duration, easing } = spec
  useEffect(() => {
    progress.set(withDelay(delay, withTiming(1, { duration, easing, reduceMotion: ReduceMotion.Never })))
  }, [progress, delay, duration, easing])
  const x = useDerivedValue(() => (translateX ?? 0) * (1 - progress.get()))
  const y = useDerivedValue(() => (translateY ?? 0) * (1 - progress.get()))
  const z = useDerivedValue(() => 1 + ((scale ?? 1) - 1) * (1 - progress.get()))
  return (
    <MotionView
      fill={fill}
      fillWidth={fillWidth}
      testID={testID}
      layout={layout}
      exiting={exiting}
      opacity={progress}
      translateX={translateX !== undefined ? x : undefined}
      translateY={translateY !== undefined ? y : undefined}
      scale={scale !== undefined ? z : undefined}
    >
      {children}
    </MotionView>
  )
}

/**
 * Porta passiva: com `motion="off"` devolve os filhos como estão (nenhum nó novo); em `on` envolve
 * em um `MotionView` com os presets de entrada, saída e layout. Chama sempre os mesmos hooks, então
 * alternar o seletor não muda a contagem de hooks.
 */
export function MotionPresence({ children, enter, exit, layout, fill, fillWidth, testID, resetKey, webEnter = true, webExit }: MotionPresenceProps) {
  const { active, reduced } = useMotionPreset()
  if (!active) return <>{children}</>
  const entering = enter?.(reduced)
  const spec = (entering as { spec?: MotionSpec } | undefined)?.spec
  if (webEnter && Platform.OS === 'web' && spec) {
    return (
      <WebEnter
        key={resetKey}
        spec={spec}
        testID={testID}
        fill={fill}
        fillWidth={fillWidth}
        layout={layout ? layoutTransition() : undefined}
        exiting={webExit?.(reduced)}
      >
        {children}
      </WebEnter>
    )
  }
  return (
    <MotionView
      key={resetKey}
      fill={fill}
      fillWidth={fillWidth}
      testID={testID}
      entering={entering}
      exiting={exit?.(reduced)}
      layout={layout ? layoutTransition() : undefined}
    >
      {children}
    </MotionView>
  )
}

export interface PressScaleProps extends Omit<PressableProps, 'style' | 'className' | 'children'> {
  children?: ReactNode
  /** Classes do `Pressable` quando `motion="off"` (a string de sempre, sem mudança). */
  className?: string
  /** `on`: classes da área de toque (tamanho mínimo, fundo de realce, forma). */
  outerClassName?: string
  /** `on`: classes do conteúdo, que é o que escala (linha, alinhamento, espaçamento). */
  innerClassName?: string
  pressScale?: number
  playful?: boolean
  /** `testID` só do caminho `on` (o do `Pressable`); o `MotionView` interno leva `${motionTestID}-motion`. */
  motionTestID?: string
}

/**
 * Porta do `Pressable` com escala no toque: `off` é o `Pressable` de sempre com a mesma string de
 * classes; `on` é um `MotionPressable` com as classes repartidas entre a área de toque e o conteúdo.
 */
export function PressScale({
  children,
  className,
  outerClassName,
  innerClassName,
  pressScale,
  playful,
  motionTestID,
  ...rest
}: PressScaleProps) {
  const { active } = useMotionPreset()
  if (!active) {
    return (
      <Pressable className={className} {...rest}>
        {children}
      </Pressable>
    )
  }
  return (
    <MotionPressable
      testID={motionTestID}
      className={outerClassName}
      contentClassName={innerClassName}
      pressScale={pressScale}
      playful={playful}
      {...rest}
    >
      {children}
    </MotionPressable>
  )
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

/**
 * Contador em UI thread: um `TextInput` somente leitura cujo `text` vem de `useAnimatedProps`, sem
 * `setState` por quadro. O valor final (`countable.original`) já está no `defaultValue`, então o
 * texto final no render é o mesmo do `off`. No navegador a Reanimated grava `input.value` direto no DOM
 * por quadro (sem passar pelo React) e o campo sai da ordem de Tab e da leitura, porque o rótulo do
 * grupo do `StatCard` já carrega o valor.
 * Sem `className` (e sem `cssInterop`, que mudaria os demais `TextInput` do app): tamanho e linha do
 * `text-2xl`, peso pela família do modelo e cor `foreground` pelo tema.
 */
export function MotionCountText({
  countable,
  weight = 'semibold',
  accessibilityLabel,
}: {
  countable: Countable
  weight?: 'normal' | 'medium' | 'semibold'
  accessibilityLabel?: string
}) {
  const { model, themeVars } = useBrand()
  const progress = useSharedValue(0)
  useEffect(() => {
    progress.set(withTiming(1, revealTiming('count')))
  }, [countable.target, progress])
  const animatedProps = useAnimatedProps(() => ({ text: formatCount(countable, progress.get()) }) as never)
  return (
    <AnimatedTextInput
      testID="stat-valor-contador"
      editable={false}
      pointerEvents="none"
      accessibilityLabel={accessibilityLabel}
      defaultValue={countable.original}
      animatedProps={animatedProps}
      {...(Platform.OS === 'web' ? { focusable: false, 'aria-hidden': true } : null)}
      style={{
        fontFamily: model.fontFamily[weight],
        fontSize: 24,
        lineHeight: 32,
        padding: 0,
        color: themeColorString(themeVars, '--rendra-foreground'),
      }}
    />
  )
}
