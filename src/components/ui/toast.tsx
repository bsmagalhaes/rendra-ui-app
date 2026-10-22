import { useEffect, useSyncExternalStore } from 'react'
import { AccessibilityInfo, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated'
import { BrandFeedbackIcon } from './brand-feedback-icon'
import { Text } from '../internal/text'
import { a11yPresets } from '../../lib/a11y'
import { cn } from '../../lib/cn'
import { useReducedMotion } from '../../lib/reduced-motion'
import { useMotion } from '../../lib/motion/context'
import { slideIn, slideOut } from '../../lib/motion/slide'
import { layoutTransition } from '../../lib/motion/layout'
import type { FeedbackType } from '../../brand/types'

export interface ToastOptions {
  description?: string
  action?: { label: string; onPress: () => void }
  duration?: number
}

interface ToastItem {
  id: string
  type: FeedbackType
  title: string
  description?: string
  action?: { label: string; onPress: () => void }
}

let toasts: ToastItem[] = []
const listeners = new Set<() => void>()
const timers = new Map<string, ReturnType<typeof setTimeout>>()
let nextId = 0

function emit() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return toasts
}

function push(type: FeedbackType, title: string, opts?: ToastOptions): string {
  const id = `toast-${nextId++}`
  const duration = opts?.duration ?? (type === 'error' ? 8000 : 4000)
  toasts = [...toasts, { id, type, title, description: opts?.description, action: opts?.action }]
  emit()
  AccessibilityInfo.announceForAccessibility(title)
  timers.set(id, setTimeout(() => dismiss(id), duration))
  return id
}

function dismiss(id?: string) {
  if (id == null) {
    timers.forEach((timer) => clearTimeout(timer))
    timers.clear()
    toasts = []
    emit()
    return
  }
  const timer = timers.get(id)
  if (timer) clearTimeout(timer)
  timers.delete(id)
  toasts = toasts.filter((item) => item.id !== id)
  emit()
}

export const toast = {
  success: (title: string, opts?: ToastOptions) => push('success', title, opts),
  error: (title: string, opts?: ToastOptions) => push('error', title, opts),
  warning: (title: string, opts?: ToastOptions) => push('warning', title, opts),
  info: (title: string, opts?: ToastOptions) => push('info', title, opts),
  dismiss,
}

const toneClass: Record<FeedbackType, string> = {
  success: 'border-success/25',
  error: 'border-destructive/25',
  warning: 'border-warning/25',
  info: 'border-info/25',
}

export function Toaster() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const insets = useSafeAreaInsets()
  const reducedMotion = useReducedMotion()
  const motionOn = useMotion() === 'on'

  useEffect(() => () => dismiss(), [])

  if (items.length === 0) return null

  const visible = items.slice(-3)

  return (
    <View
      testID="toast-host"
      className="absolute inset-x-0 bottom-0 gap-2 px-4 pointer-events-box-none"
      style={{ paddingBottom: Math.max(16, insets.bottom) }}
    >
      {visible.map((item) => (
        <Animated.View
          key={item.id}
          entering={motionOn ? slideIn('up', reducedMotion, 0, 16) : FadeInUp.duration(reducedMotion ? 0 : 200)}
          exiting={motionOn ? slideOut('up', reducedMotion, 16) : FadeOutDown.duration(reducedMotion ? 0 : 150)}
          layout={motionOn ? layoutTransition() : undefined}
        >
          <View
            testID={`toast-${item.id}`}
            dataSet={{ rendra: 'TST-001' }}
            accessibilityRole={item.type === 'error' ? a11yPresets.alert.accessibilityRole : undefined}
            role={item.type === 'error' ? undefined : a11yPresets.status.role}
            accessibilityLiveRegion={item.type === 'error' ? 'assertive' : 'polite'}
            className={cn(
              'flex-row items-start gap-3 rounded-control border bg-popover p-4 shadow-lg',
              toneClass[item.type],
            )}
          >
            <BrandFeedbackIcon type={item.type} size="lg" animated />
            <View className="flex-1 flex-col gap-1">
              <Text weight="semibold" className="text-sm text-popover-foreground">
                {item.title}
              </Text>
              {item.description ? (
                <Text className="text-sm text-muted-foreground">{item.description}</Text>
              ) : null}
            </View>
            {item.action ? (
              <Pressable
                accessibilityRole={a11yPresets.button.accessibilityRole}
                onPress={() => {
                  item.action?.onPress()
                  dismiss(item.id)
                }}
                className="min-h-touch min-w-touch items-center justify-center rounded-item px-2"
              >
                <Text weight="semibold" className="text-sm text-primary-text">
                  {item.action.label}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      ))}
    </View>
  )
}
