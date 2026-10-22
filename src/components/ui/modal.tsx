import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { BackHandler, KeyboardAvoidingView, Modal as RNModal, Pressable, View } from 'react-native'
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import { Text } from '../internal/text'
import { OverlayShell } from '../internal/overlay-shell'
import { MotionView } from '../internal/motion-view'
import { ActionBar } from './action-bar'
import { BrandFeedbackIcon } from './brand-feedback-icon'
import { a11yPresets } from '../../lib/a11y'
import { cn } from '../../lib/cn'
import { useReducedMotion } from '../../lib/reduced-motion'
import { useMotion } from '../../lib/motion/context'
import { usePresence } from '../../lib/motion/use-presence'
import { openSpring, reducedTiming, timing } from '../../lib/motion/tokens'
import { motionTokens } from '../../theme/motion'
import type { FeedbackType } from '../../brand/types'
import { resolveCatalogCode } from '../../catalog/components'

export type ModalType = 'confirm' | 'destructive' | 'info' | 'form'

export interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  type?: ModalType
  size?: 'sm' | 'md' | 'lg'
  children?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void | boolean | Promise<void | boolean>
  loading?: boolean
  className?: string
}

const feedbackByType: Record<Exclude<ModalType, 'form'>, FeedbackType> = {
  confirm: 'info',
  destructive: 'error',
  info: 'info',
}

/**
 * Entrada própria do cartão do Modal, mesmo padrão de `bottomSheetTranslateY` (`bottom-sheet.tsx`)
 * e `drawerTranslateX` (`drawer.tsx`): função pura com `'worklet'`, duas fases. `animationType="none"`
 * no `RNModal` (comentário abaixo) é necessário para o `role="dialog"` ficar ativo no export web
 * (`ModalAnimation.js` só aplica o `role` quando `animationend` dispara, e uma animação CSS nunca
 * dispara sob paralelismo alto), mas tira a transição nativa do diálogo; sem entrada própria, o
 * Modal (e o `InfoHint`, que é um Modal por baixo, `info-hint.tsx:30`) passa a aparecer seco em toda
 * plataforma (achado M1 do veredito do fechamento do lote 3). `'closed'` é o ponto de partida
 * (deslocado para baixo, transparente); `'settled'` é a posição final (no lugar, opaco).
 */
export function modalCardStyle(phase: 'closed' | 'settled'): { translateY: number; opacity: number } {
  'worklet'
  return phase === 'settled' ? { translateY: 0, opacity: 1 } : { translateY: 24, opacity: 0 }
}

function ModalStatic({
  open,
  onOpenChange,
  title,
  description,
  type = 'confirm',
  children,
  confirmLabel,
  cancelLabel = 'Cancelar',
  onConfirm,
  loading = false,
  className,
}: ModalProps) {
  const [busy, setBusy] = useState(false)
  const isForm = type === 'form'
  // Item D5 do levantamento da Sincronizacao 1: destructive resolve para o mesmo codigo de
  // confirm (MOD-001), porque so muda a cor, igual ao web.
  const code = resolveCatalogCode('Modal', { type: type === 'destructive' ? 'confirm' : type })
  const translateY = useSharedValue(0)
  const opacity = useSharedValue(1)
  const reducedMotion = useReducedMotion()

  // Mesma razão de `bottom-sheet.tsx` (melhoria do veredito do fechamento): reducedMotion resolve
  // de forma assíncrona (AccessibilityInfo.isReduceMotionEnabled é uma Promise) e pode mudar com o
  // Modal já aberto e assentado; lido por ref, o efeito de entrada abaixo continua dependendo só
  // da transição de `open`, sem disparar de novo por essa mudança sozinha.
  const reducedMotionRef = useRef(reducedMotion)
  useEffect(() => {
    reducedMotionRef.current = reducedMotion
  })

  useEffect(() => {
    if (!open) return
    const closed = modalCardStyle('closed')
    translateY.set(closed.translateY)
    opacity.set(closed.opacity)
    const id = setTimeout(() => {
      const settled = modalCardStyle('settled')
      const duration = reducedMotionRef.current ? 0 : 200
      translateY.set(withTiming(settled.translateY, { duration }))
      opacity.set(withTiming(settled.opacity, { duration }))
    }, 0)
    return () => clearTimeout(id)
  }, [open, translateY, opacity])

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }],
    opacity: opacity.get(),
    // A1 (validação final do lote 3, Fable): antes da entrada própria (M1, `77e8989`), a `View`
    // do cartão era filha direta do `Body` (flex-1, coluna) e, com `shrink max-h-full`
    // (`:161`), encolhia até a altura do `Body`. O `Animated.View` que passou a envolver o
    // cartão nasce sem `flexShrink` (padrão do Yoga/react-native-web é 0), então cresce até o
    // tamanho do conteúdo e o `max-h-full` do filho vira 100% de um pai sem limite (o rodapé com
    // o `ActionBar` sai da tela em modal alto, tipo `form` com teclado aberto). Mesma correção
    // dos dois precedentes, dentro do próprio `style` animado: `flex: 1` de `drawer.tsx:123-126`
    // e `maxHeight` de `bottom-sheet.tsx:120-123` (aqui `flexShrink` porque o pai, `Body`, não é
    // sempre uma coluna flex de um item só; `maxHeight: '100%'` porque o limite é o espaço que o
    // `Body` sobra depois do `Pressable`/`View` de espaçamento acima, não uma altura de janela).
    flexShrink: 1,
    maxHeight: '100%',
  }))

  const close = useCallback(() => onOpenChange(false), [onOpenChange])

  const confirm = useCallback(async () => {
    if (!onConfirm) {
      close()
      return
    }
    setBusy(true)
    try {
      const result = await onConfirm()
      if (result !== false) {
        close()
      }
    } finally {
      setBusy(false)
    }
  }, [onConfirm, close])

  useEffect(() => {
    if (!open) return
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      close()
      return true
    })
    return () => subscription.remove()
  }, [open, close])

  const resolvedConfirmLabel =
    confirmLabel ?? (type === 'destructive' ? 'Excluir' : type === 'info' ? 'Entendi' : 'Confirmar')

  const Body = isForm ? KeyboardAvoidingView : View

  return (
    // Tarefa 12, nota da Tarefa 15: o axe reprovou aria-allowed-attr (aria-modal="true" sem role
    // ativo) com animationType="fade" no export web, porque o wrapper do RNModal so recebe
    // role/fica "ativo" quando o evento DOM animationend dispara (react-native-web,
    // ModalAnimation.js), e essa espera e sensivel a carga/tempo sob paralelismo alto (mesma causa
    // ja documentada em bottom-sheet.tsx). animationType="none" aplica o mesmo efeito de forma
    // sincrona, sem depender de nenhuma animacao CSS (mesmo padrao de bottom-sheet.tsx:135).
    <RNModal
      transparent
      animationType="none"
      visible={open}
      onRequestClose={close}
      statusBarTranslucent
      testID="modal-rn"
    >
      <Body {...(isForm ? { behavior: 'padding' as const, testID: 'modal-teclado' } : {})} className="flex-1 bg-overlay">
        {!isForm && (
          <Pressable
            accessibilityLabel="Fechar"
            accessibilityRole={a11yPresets.button.accessibilityRole}
            className="flex-1"
            onPress={close}
          />
        )}
        {isForm && <View className="flex-1" />}
        <Animated.View style={cardStyle}>
          <View
            role={a11yPresets.dialog.role}
            accessibilityLabel={title}
            accessibilityViewIsModal
            className={cn('shrink max-h-full rounded-t-surface bg-card', className)}
            dataSet={{ rendra: code }}
          >
            <OverlayShell
              title={title}
              description={isForm ? description : undefined}
              hideHeader={!isForm}
              fill={false}
              onRequestClose={close}
              footer={
                <ActionBar
                  sticky={false}
                  primary={{
                    label: resolvedConfirmLabel,
                    destructive: type === 'destructive',
                    loading: busy || loading,
                    loadingLabel: `${resolvedConfirmLabel}...`,
                    onPress: confirm,
                  }}
                  cancel={type === 'info' ? undefined : { label: cancelLabel, onPress: close }}
                />
              }
            >
              {isForm ? (
                <View className="flex-col gap-2">{children}</View>
              ) : (
                <View className="items-center justify-center gap-4">
                  <BrandFeedbackIcon type={feedbackByType[type]} size="2xl" animated />
                  <Text weight="semibold" className="max-w-full break-words text-center text-lg text-foreground">
                    {title}
                  </Text>
                  {description && <Text className="max-w-full break-words text-center text-sm text-muted-foreground">{description}</Text>}
                  {children}
                </View>
              )}
            </OverlayShell>
          </View>
        </Animated.View>
      </Body>
    </RNModal>
  )
}

/**
 * Caminho `motion="on"`: o cartão entra por mola criticamente amortecida (sem quique) a partir de
 * 0,95 e 8 px, com opacidade em `base`; sai mais rápido (`fast`) e só em opacidade, porque o usuário
 * já decidiu fechar. O `progress` (0 a 1) guia deslocamento e escala; o `RNModal` só desmonta ao fim da
 * saída (`usePresence`). Sem arraste (A-P3). Com movimento reduzido, só opacidade em `base`.
 */
function ModalMotion({
  open,
  onOpenChange,
  title,
  description,
  type = 'confirm',
  children,
  confirmLabel,
  cancelLabel = 'Cancelar',
  onConfirm,
  loading = false,
  className,
}: ModalProps) {
  const [busy, setBusy] = useState(false)
  const isForm = type === 'form'
  const code = resolveCatalogCode('Modal', { type: type === 'destructive' ? 'confirm' : type })
  const reducedMotion = useReducedMotion()
  // Entrada em `base`, saída em `fast` (em `base` sob movimento reduzido): o `RNModal` fica o tempo da saída.
  const mounted = usePresence(open, true, reducedMotion ? motionTokens.duration.base : motionTokens.duration.fast)
  const progress = useSharedValue(0)
  const opacity = useSharedValue(0)
  const translateY = useDerivedValue(() => (reducedMotion ? 0 : (1 - progress.get()) * motionTokens.distance.sm))
  const scale = useDerivedValue(() => (reducedMotion ? 1 : 1 - (1 - progress.get()) * (1 - motionTokens.scales.enter)))

  useEffect(() => {
    if (open) {
      progress.set(0)
      progress.set(withSpring(1, openSpring()))
      opacity.set(withTiming(1, reducedMotion ? reducedTiming() : timing('base', 'out')))
      return
    }
    // Saída assimétrica: só a opacidade, mais curta; o cartão não encolhe nem desliza.
    opacity.set(withTiming(0, reducedMotion ? reducedTiming() : timing('fast', 'out')))
  }, [open, reducedMotion, progress, opacity])

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }, { scale: scale.get() }],
    opacity: opacity.get(),
    flexShrink: 1,
    maxHeight: '100%',
  }))

  const close = useCallback(() => onOpenChange(false), [onOpenChange])

  const confirm = useCallback(async () => {
    if (!onConfirm) {
      close()
      return
    }
    setBusy(true)
    try {
      const result = await onConfirm()
      if (result !== false) {
        close()
      }
    } finally {
      setBusy(false)
    }
  }, [onConfirm, close])

  useEffect(() => {
    if (!open) return
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      close()
      return true
    })
    return () => subscription.remove()
  }, [open, close])

  const resolvedConfirmLabel =
    confirmLabel ?? (type === 'destructive' ? 'Excluir' : type === 'info' ? 'Entendi' : 'Confirmar')

  const Body = isForm ? KeyboardAvoidingView : View

  return (
    <RNModal
      transparent
      animationType="none"
      visible={mounted}
      onRequestClose={close}
      statusBarTranslucent
      testID="modal-rn"
    >
      <Body {...(isForm ? { behavior: 'padding' as const, testID: 'modal-teclado' } : {})} className="flex-1">
        <View className="absolute inset-0" pointerEvents="none">
          <MotionView fill opacity={opacity} testID="modal-backdrop">
            <View className="size-full bg-overlay" />
          </MotionView>
        </View>
        {!isForm && (
          <Pressable
            accessibilityLabel="Fechar"
            accessibilityRole={a11yPresets.button.accessibilityRole}
            className="flex-1"
            onPress={close}
          />
        )}
        {isForm && <View className="flex-1" />}
        <Animated.View testID="modal-card" style={cardStyle} pointerEvents={open ? 'auto' : 'none'}>
          <View
            role={a11yPresets.dialog.role}
            accessibilityLabel={title}
            accessibilityViewIsModal
            className={cn('shrink max-h-full rounded-t-surface bg-card', className)}
            dataSet={{ rendra: code }}
          >
            <OverlayShell
              title={title}
              description={isForm ? description : undefined}
              hideHeader={!isForm}
              fill={false}
              onRequestClose={close}
              footer={
                <ActionBar
                  sticky={false}
                  primary={{
                    label: resolvedConfirmLabel,
                    destructive: type === 'destructive',
                    loading: busy || loading,
                    loadingLabel: `${resolvedConfirmLabel}...`,
                    onPress: confirm,
                  }}
                  cancel={type === 'info' ? undefined : { label: cancelLabel, onPress: close }}
                />
              }
            >
              {isForm ? (
                <View className="flex-col gap-2">{children}</View>
              ) : (
                <View className="items-center justify-center gap-4">
                  <BrandFeedbackIcon type={feedbackByType[type]} size="2xl" animated />
                  <Text weight="semibold" className="max-w-full break-words text-center text-lg text-foreground">
                    {title}
                  </Text>
                  {description && <Text className="max-w-full break-words text-center text-sm text-muted-foreground">{description}</Text>}
                  {children}
                </View>
              )}
            </OverlayShell>
          </View>
        </Animated.View>
      </Body>
    </RNModal>
  )
}

export function Modal(props: ModalProps) {
  const mode = useMotion()
  return mode === 'on' ? <ModalMotion {...props} /> : <ModalStatic {...props} />
}
