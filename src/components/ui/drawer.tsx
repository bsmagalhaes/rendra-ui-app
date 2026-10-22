import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BackHandler,
  KeyboardAvoidingView,
  Modal as RNModal,
  View,
  useWindowDimensions,
} from 'react-native'
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { OverlayShell } from '../internal/overlay-shell'
import { Modal } from './modal'
import { a11yPresets } from '../../lib/a11y'
import { useReducedMotion } from '../../lib/reduced-motion'
import { useMotion } from '../../lib/motion/context'
import { useOverlayMotion } from '../../lib/motion/use-overlay-motion'
import { useOverlayPan } from '../../lib/motion/use-overlay-pan'
import { timing } from '../../lib/motion/tokens'

export interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  children: ReactNode
  description?: ReactNode
  icon?: ReactNode
  footer?: ReactNode
  dirty?: boolean
  discardTitle?: string
  discardDescription?: string
  /** Sem efeito no celular (sempre tela cheia); mantido por paridade com o contrato web (B13). */
  size?: '30' | '40' | '50' | '75' | 'full' | 'sm' | 'md' | 'lg' | 'xl'
  testID?: string
}

export function drawerTranslateX(phase: 'closed' | 'settled', width: number): number {
  'worklet'
  return phase === 'closed' ? width : 0
}

function DrawerStatic({
  open,
  onOpenChange,
  title,
  children,
  description,
  icon,
  footer,
  dirty = false,
  discardTitle = 'Descartar alterações?',
  discardDescription = 'As informações preenchidas neste painel serão perdidas.',
  testID,
}: DrawerProps) {
  const [confirming, setConfirming] = useState(false)
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (!open && confirming) setConfirming(false)
  }

  const { width } = useWindowDimensions()
  const reducedMotion = useReducedMotion()
  const widthRef = useRef(width)
  const reducedMotionRef = useRef(reducedMotion)
  const translateX = useSharedValue(width)

  useEffect(() => {
    widthRef.current = width
    reducedMotionRef.current = reducedMotion
  })

  useEffect(() => {
    if (!open) return
    translateX.set(drawerTranslateX('closed', widthRef.current))
    const timer = setTimeout(() => {
      translateX.set(
        withTiming(
          drawerTranslateX('settled', widthRef.current),
          reducedMotionRef.current ? { duration: 0 } : timing('slow', 'drawer'),
        ),
      )
    }, 0)
    return () => clearTimeout(timer)
  }, [open, translateX])

  useEffect(() => {
    if (!open) return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (dirty) {
        setConfirming(true)
      } else {
        onOpenChange(false)
      }
      return true
    })
    return () => sub.remove()
  }, [open, dirty, onOpenChange])

  const requestClose = useCallback(() => {
    if (dirty) {
      setConfirming(true)
      return
    }
    onOpenChange(false)
  }, [dirty, onOpenChange])

  // Mesmo gesto do caminho `on` (worklet, fricção ao puxar para o lado de abrir, decisão por
  // projeção). C13 (veredito do Opus): o painel volta sempre para 0 e a decisão de fechar direto ou
  // abrir a confirmação usa o mesmo requestClose().
  const gesture = useOverlayPan({
    axis: 'x',
    direction: 1,
    size: width,
    offset: translateX,
    onDismiss: requestClose,
    testID: `${testID ?? 'drawer'}-arraste`,
    activeOffsetX: 20,
    failOffsetY: [-15, 15],
    afterDismiss: 'return',
  })

  const animated = useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ translateX: translateX.get() }],
  }))

  return (
    <>
      <RNModal
        transparent={false}
        animationType="none"
        visible={open}
        onRequestClose={requestClose}
        statusBarTranslucent
        testID={testID}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <GestureDetector gesture={gesture}>
            <Animated.View style={animated}>
              <View
                role={a11yPresets.dialog.role}
                accessibilityLabel={typeof title === 'string' ? title : undefined}
                accessibilityViewIsModal
                className="flex-1 bg-card"
                dataSet={{ rendra: 'GAV-001' }}
              >
                <KeyboardAvoidingView
                  behavior="padding"
                  className="flex-1"
                  testID={testID ? `${testID}-teclado` : undefined}
                >
                  <OverlayShell
                    title={title}
                    description={description}
                    icon={icon}
                    footer={footer}
                    onRequestClose={requestClose}
                  >
                    {children}
                  </OverlayShell>
                </KeyboardAvoidingView>
              </View>
            </Animated.View>
          </GestureDetector>
        </GestureHandlerRootView>
      </RNModal>
      <Modal
        open={confirming}
        onOpenChange={setConfirming}
        type="destructive"
        title={discardTitle}
        description={discardDescription}
        confirmLabel="Descartar"
        cancelLabel="Continuar editando"
        onConfirm={() => onOpenChange(false)}
      />
    </>
  )
}

/**
 * Caminho `motion="on"`: entrada por spring, arraste acompanhando o dedo (worklet), saída animada.
 * Com `dirty`, o arraste passa por `requestClose()`: volta para 0 e abre a confirmação, nunca
 * anima a saída (B3 do parecer).
 */
function DrawerMotion({
  open,
  onOpenChange,
  title,
  children,
  description,
  icon,
  footer,
  dirty = false,
  discardTitle = 'Descartar alterações?',
  discardDescription = 'As informações preenchidas neste painel serão perdidas.',
  testID,
}: DrawerProps) {
  const [confirming, setConfirming] = useState(false)
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (!open && confirming) setConfirming(false)
  }

  const { width } = useWindowDimensions()
  const reducedMotion = useReducedMotion()

  const requestClose = useCallback(() => {
    if (dirty) {
      setConfirming(true)
      return
    }
    onOpenChange(false)
  }, [dirty, onOpenChange])

  const { mounted, offset, contentOpacity, gesture } = useOverlayMotion({
    open,
    axis: 'x',
    direction: 1,
    size: width,
    reduced: reducedMotion,
    onDismiss: requestClose,
    testID: `${testID ?? 'drawer'}-arraste`,
    activeOffsetX: 20,
    failOffsetY: [-15, 15],
  })

  useEffect(() => {
    if (!open) return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      requestClose()
      return true
    })
    return () => sub.remove()
  }, [open, requestClose])

  const animated = useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ translateX: offset.get() }],
    opacity: contentOpacity.get(),
  }))

  return (
    <>
      <RNModal
        transparent={false}
        animationType="none"
        visible={mounted}
        onRequestClose={requestClose}
        statusBarTranslucent
        testID={testID}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <GestureDetector gesture={gesture}>
            <Animated.View
              testID={testID ? `${testID}-painel` : undefined}
              style={animated}
              pointerEvents={open ? 'auto' : 'none'}
            >
              <View
                role={a11yPresets.dialog.role}
                accessibilityLabel={typeof title === 'string' ? title : undefined}
                accessibilityViewIsModal
                className="flex-1 bg-card"
                dataSet={{ rendra: 'GAV-001' }}
              >
                <KeyboardAvoidingView
                  behavior="padding"
                  className="flex-1"
                  testID={testID ? `${testID}-teclado` : undefined}
                >
                  <OverlayShell
                    title={title}
                    description={description}
                    icon={icon}
                    footer={footer}
                    onRequestClose={requestClose}
                  >
                    {children}
                  </OverlayShell>
                </KeyboardAvoidingView>
              </View>
            </Animated.View>
          </GestureDetector>
        </GestureHandlerRootView>
      </RNModal>
      <Modal
        open={confirming}
        onOpenChange={setConfirming}
        type="destructive"
        title={discardTitle}
        description={discardDescription}
        confirmLabel="Descartar"
        cancelLabel="Continuar editando"
        onConfirm={() => onOpenChange(false)}
      />
    </>
  )
}

export function Drawer(props: DrawerProps) {
  const mode = useMotion()
  return mode === 'on' ? <DrawerMotion {...props} /> : <DrawerStatic {...props} />
}
