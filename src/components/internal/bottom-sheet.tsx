import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Modal as RNModal,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native'
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { cn } from '../../lib/cn'
import { a11yPresets } from '../../lib/a11y'
import { useReducedMotion } from '../../lib/reduced-motion'

export interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  accessibilityLabel?: string
  contentContainerClassName?: string
  header?: ReactNode
  footer?: ReactNode
  scrollable?: boolean
  testID?: string
}

const DRAG_CLOSE_THRESHOLD = 100

/**
 * Posição de `translateY` da folha nas duas fases da entrada (bloqueador 2 do veredito do
 * fechamento, Fable): `'closed'` é o ponto de partida, fora da tela (a altura da janela, abaixo
 * da área visível); `'settled'` é a posição final, assentada no lugar (0). Função pura com
 * `'worklet'` (mesmo padrão de `thumbTranslateX` em `slider.tsx`, Tarefa 24): consultar
 * `.props.style`/`getAnimatedStyle()` de um `Animated.View` via RNTL depois que um `useEffect`
 * muda o `SharedValue` num render já montado não reflete o valor novo sob o mock de
 * `useAnimatedStyle` do `react-native-reanimated` (mesma limitação já enfrentada por
 * `thumbTranslateX` no `Slider`); testar a fórmula isolada evita depender dessa consulta.
 */
export function bottomSheetTranslateY(phase: 'closed' | 'settled', windowHeight: number): number {
  'worklet'
  return phase === 'settled' ? 0 : windowHeight
}

export function BottomSheet({
  open,
  onOpenChange,
  children,
  accessibilityLabel,
  contentContainerClassName,
  header,
  footer,
  scrollable = true,
  testID,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets()
  const { height: windowHeight } = useWindowDimensions()
  const translateY = useSharedValue(0)
  const reducedMotion = useReducedMotion()

  // Melhoria do veredito do fechamento (Fable): windowHeight (gira a tela) e reducedMotion
  // (AccessibilityInfo.isReduceMotionEnabled é assíncrono, resolve depois da montagem) podiam
  // mudar com a folha já aberta e assentada; antes, os dois nas dependências do efeito de
  // entrada abaixo disparavam a animação e o anúncio de novo nesse momento, sem o usuário ter
  // reaberto nada. Lidos por ref (sempre o valor mais recente no instante em que o efeito
  // roda), o efeito volta a depender só da transição de `open`. A atribuição a `.current` vai
  // num `useEffect` sem array de dependências (roda depois de todo render, fora da fase de
  // render em si): mutar ref direto no corpo do componente é erro da regra `react-hooks/refs`.
  const windowHeightRef = useRef(windowHeight)
  const reducedMotionRef = useRef(reducedMotion)
  useEffect(() => {
    windowHeightRef.current = windowHeight
    reducedMotionRef.current = reducedMotion
  })

  // translateY (useSharedValue) é uma referência estável entre renders (mesma orientação do
  // useRef), então incluí-la no array de dependências não dispara o efeito de novo além do
  // esperado (open/accessibilityLabel mudando); listada aqui só para satisfazer exhaustive-deps
  // sem eslint-disable, já que `.set()` (API 4.x do Reanimated) deixou de disparar o falso
  // positivo de react-hooks/immutability que a mutação direta de `.value` causava.
  //
  // Bloqueador 2 do veredito do fechamento (Fable): `translateY.set(0)` colocava a folha direto
  // na posição final, sem nenhuma entrada (o valor já nascia em 0). Corrigido em duas fases: o
  // salto síncrono para `windowHeight` (fora da tela, abaixo) e, um instante depois (`setTimeout`
  // 0, evitando que as duas mutações colapsem no mesmo commit da UI Runtime e a entrada nunca
  // apareça), a animação real até 0 com `withTiming` (200ms, ou 0 sob `reduced motion`, mesmo
  // padrão do `Switch`).
  useEffect(() => {
    if (open) {
      translateY.set(bottomSheetTranslateY('closed', windowHeightRef.current))
      const id = setTimeout(() => {
        translateY.set(
          withTiming(bottomSheetTranslateY('settled', windowHeightRef.current), {
            duration: reducedMotionRef.current ? 0 : 200,
          }),
        )
      }, 0)
      AccessibilityInfo.announceForAccessibility(accessibilityLabel ?? 'Painel aberto')
      return () => clearTimeout(id)
    }
  }, [open, accessibilityLabel, translateY])

  const pan = Gesture.Pan()
    .withTestId(`${testID ?? 'bottom-sheet'}-drag-handle`)
    .runOnJS(true)
    .onUpdate((e) => {
      translateY.set(Math.max(0, e.translationY))
    })
    .onEnd((e) => {
      if (e.translationY > DRAG_CLOSE_THRESHOLD) {
        onOpenChange(false)
      } else {
        translateY.set(withTiming(0, { duration: 150 }))
      }
    })

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    maxHeight: windowHeight * 0.8,
    paddingBottom: Math.max(16, insets.bottom),
  }))

  return (
    // Achado do Playwright (Tarefa 22/24): `animationType="fade"` no export web só chama
    // `onShow` quando o evento DOM `animationend`
    // dispara (react-native-web, ModalAnimation.js); como o `BottomSheet` já faz sua própria
    // animação por `Animated.View`/`useAnimatedStyle` (linha ~88 abaixo), esse `animationend`
    // nunca dispara, `onShow` nunca roda, o modal nunca vira "ativo" (`isActive`), e o `role`
    // (`dialog` só quando ativo) nunca é aplicado, enquanto `aria-modal="true"` continua fixo
    // (axe: `aria-allowed-attr`, "ARIA attribute is not allowed"). `animationType="none"` chama
    // o mesmo efeito de forma síncrona, sem depender de nenhuma animação CSS.
    <RNModal transparent animationType="none" visible={open} onRequestClose={() => onOpenChange(false)} testID={testID}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 bg-overlay">
          <Pressable
            testID={testID ? `${testID}-overlay` : undefined}
            accessibilityRole={a11yPresets.button.accessibilityRole}
            accessibilityLabel="Fechar"
            className="flex-1"
            onPress={() => onOpenChange(false)}
          />
          <Animated.View testID={testID ? `${testID}-sheet` : undefined} style={sheetStyle}>
            <View className="rounded-t-surface border-t border-border bg-popover shadow-lg shrink">
              <GestureDetector gesture={pan}>
                <View
                  testID={`${testID ?? 'bottom-sheet'}-drag-handle`}
                  className="my-2 h-1 w-12 self-center rounded-full bg-border"
                />
              </GestureDetector>
              <KeyboardAvoidingView
                behavior="padding"
                className="shrink"
                testID={`${testID ?? 'bottom-sheet'}-teclado`}
              >
                {header}
                {scrollable ? (
                  <ScrollView
                    tabIndex={0}
                    testID={`${testID ?? 'bottom-sheet'}-rolagem`}
                    contentContainerClassName={cn('p-1', contentContainerClassName)}
                  >
                    {children}
                  </ScrollView>
                ) : (
                  <View className="shrink">{children}</View>
                )}
                {footer}
              </KeyboardAvoidingView>
            </View>
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </RNModal>
  )
}
