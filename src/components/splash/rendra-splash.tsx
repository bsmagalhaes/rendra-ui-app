import { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { Text } from '../internal/text'
import { BrandLogo } from '../ui/brand-logo'
import { useBrand } from '../../brand/use-brand'
import { easings } from '../../lib/motion/tokens'

/*
 * Splash animado da abertura do app: um overlay que cobre a tela com a marca do modelo e da
 * paleta ativos (selo, nome e lema), curto e suave, e sai por fade. Não usa `expo-splash-screen`
 * (a costura com o splash nativo vive em `app/_layout.tsx`, para o pacote não depender dele).
 *
 * Sequência (`minDuration` padrão de 900 ms): o anel abre atrás do selo, o selo cresce com um
 * pequeno excesso, o nome sobe e aparece 160 ms depois, o lema 320 ms depois; segura até
 * `minDuration` e some em `SPLASH_FADE_MS`. Com "reduzir movimento" a versão é estática: tudo
 * opaco desde o início, dura `minDuration` e sai sem fade. O fim é contado em JS (`setTimeout`),
 * nunca por callback de animação, para não depender do relógio da UI; o `Animated.View` só
 * desenha. O overlay é decorativo: fora da árvore de acessibilidade e sem capturar toque.
 */

export const SPLASH_FADE_MS = 250
const SELO_MS = 420
const TEXTO_MS = 320
const ATRASO_NOME_MS = 160
const ATRASO_LEMA_MS = 320
const ANEL_MS = 700

// As curvas vêm dos tokens (sem literal): a mesma `ease-out` e `back` do design system.
const EASE_OUT = easings.out
const EASE_SPRING = easings.back

// Estilos como funções puras, cada uma com a diretiva 'worklet' (rodam na UI runtime e ficam
// testáveis isoladas, como `drawerTranslateX`).
export function splashSeloStyle(p: number) {
  'worklet'
  return { opacity: p, transform: [{ scale: 0.6 + 1.4 * p }] }
}

export function splashTextStyle(p: number) {
  'worklet'
  return { opacity: p, transform: [{ translateY: 12 * (1 - p) }] }
}

export function splashRingStyle(p: number) {
  'worklet'
  return {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5 * (1 - p),
    transform: [{ scale: 0.7 + 0.8 * p }],
  }
}

export function splashOverlayStyle(opacity: number) {
  'worklet'
  return {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none' as const,
    opacity,
  }
}

export interface RendraSplashProps {
  visible: boolean
  onFinished: () => void
  /** Tempo mínimo na tela, em ms, antes do fade (padrão 900). */
  minDuration?: number
  testID?: string
}

export function RendraSplash({ visible, onFinished, minDuration = 900, testID = 'rendra-splash' }: RendraSplashProps) {
  const { brand, hydrated } = useBrand()
  const [done, setDone] = useState(false)

  const selo = useSharedValue(0)
  const nome = useSharedValue(0)
  const lema = useSharedValue(0)
  const anel = useSharedValue(0)
  const fade = useSharedValue(1)

  // Lidos por ref no efeito: o valor de "reduzir movimento" chega depois do primeiro render e
  // `onFinished` pode mudar de identidade sem reiniciar a animação.
  const reducedMotionRef = useRef(false)
  const onFinishedRef = useRef(onFinished)
  useEffect(() => {
    onFinishedRef.current = onFinished
  })

  useEffect(() => {
    if (!visible || !hydrated) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    // Leitura que rejeita: trata como movimento normal, para o overlay nunca ficar preso.
    AccessibilityInfo.isReduceMotionEnabled().catch(() => false).then((reduced) => {
      if (cancelled) return
      reducedMotionRef.current = reduced
      if (reduced) {
        selo.set(1)
        nome.set(1)
        lema.set(1)
        anel.set(1)
      } else {
        selo.set(withTiming(1, { duration: SELO_MS, easing: EASE_SPRING }))
        anel.set(withTiming(1, { duration: ANEL_MS, easing: EASE_OUT }))
        nome.set(withDelay(ATRASO_NOME_MS, withTiming(1, { duration: TEXTO_MS, easing: EASE_OUT })))
        lema.set(withDelay(ATRASO_LEMA_MS, withTiming(1, { duration: TEXTO_MS, easing: EASE_OUT })))
        fade.set(withDelay(minDuration, withTiming(0, { duration: SPLASH_FADE_MS, easing: EASE_OUT })))
      }
      timer = setTimeout(
        () => {
          setDone(true)
          onFinishedRef.current()
        },
        reducedMotionRef.current ? minDuration : minDuration + SPLASH_FADE_MS,
      )
    })
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [visible, hydrated, minDuration, selo, nome, lema, anel, fade])

  const overlayStyle = useAnimatedStyle(() => splashOverlayStyle(fade.value))
  const seloStyle = useAnimatedStyle(() => splashSeloStyle(selo.value))
  const nomeStyle = useAnimatedStyle(() => splashTextStyle(nome.value))
  const lemaStyle = useAnimatedStyle(() => splashTextStyle(lema.value))
  const anelStyle = useAnimatedStyle(() => splashRingStyle(anel.value))

  if (!visible || done) return null

  const [primeira, ...resto] = brand.productName.split(' ')

  return (
    <Animated.View
      testID={testID}
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={overlayStyle}
    >
      <View className="pointer-events-none flex-1 items-center justify-center gap-6 bg-background px-8">
        <View className="size-24 items-center justify-center">
          <Animated.View style={anelStyle}>
            <View className="size-full rounded-full border-2 border-primary" />
          </Animated.View>
          <Animated.View style={seloStyle}>
            <BrandLogo on="surface" symbolOnly />
          </Animated.View>
        </View>
        <Animated.View style={nomeStyle}>
          <View className="flex-row gap-2">
            <Text weight="semibold" className="text-3xl text-foreground">
              {primeira}
            </Text>
            {resto.length > 0 ? (
              <Text weight="normal" className="text-3xl text-muted-foreground">
                {resto.join(' ')}
              </Text>
            ) : null}
          </View>
        </Animated.View>
        <Animated.View style={lemaStyle}>
          <Text className="text-center text-sm text-muted-foreground">{brand.tagline}</Text>
        </Animated.View>
      </View>
    </Animated.View>
  )
}
