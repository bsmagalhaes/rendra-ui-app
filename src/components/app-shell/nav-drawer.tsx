import { useCallback, useEffect, useRef } from 'react'
import { BackHandler, Modal as RNModal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native'
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X } from 'lucide-react-native'
import { Gradient } from '../gradient/gradient'
import { Text } from '../internal/text'
import { Button } from '../ui/button'
import { BrandLogo } from '../ui/brand-logo'
import { cn } from '../../lib/cn'
import { useReducedMotion } from '../../lib/reduced-motion'
import { useMotion } from '../../lib/motion/context'
import { useOverlayMotion } from '../../lib/motion/use-overlay-motion'
import { useOverlayPan } from '../../lib/motion/use-overlay-pan'
import { timing } from '../../lib/motion/tokens'
import { useRendraNavigation } from '../../navigation/rendra-navigation'
import { getNavigationTargets, resolveActiveTo } from './navigation-utils'
import { ShellLink } from './shell-link'
import { MotionView } from '../internal/motion-view'
import type { NavGroup, NavIcon } from './types'

/** Fração da largura da janela ocupada pelo painel (a área escura ao lado fecha a gaveta). */
const PANEL_WIDTH_RATIO = 0.8

/**
 * Posição de `translateX` do painel: `'closed'` fica fora da tela, à esquerda (`-largura`, ao
 * contrário do `Drawer` público, que entra da direita); `'settled'` fica assentado em 0. Função
 * pura com `'worklet'`, testada isolada (mesmo padrão de `drawerTranslateX`).
 */
export function navDrawerTranslateX(phase: 'closed' | 'settled', width: number): number {
  'worklet'
  return phase === 'closed' ? -width : 0
}

// Os dois estados (ativo e inativo) declaram sempre a mesma família de classes: classe que só
// aparece depois do primeiro render derruba o css-interop no Android.
const tone = {
  sidebar: {
    title: 'text-sidebar-muted-foreground',
    active: 'bg-sidebar-active',
    inactive: 'bg-transparent',
    activeText: 'text-sidebar-active-foreground',
    inactiveText: 'text-sidebar-foreground',
  },
  surface: {
    title: 'text-muted-foreground',
    active: 'bg-primary-soft',
    inactive: 'bg-transparent',
    activeText: 'text-primary-soft-foreground',
    inactiveText: 'text-foreground',
  },
} as const

export interface NavMenuListProps {
  navigation: NavGroup[]
  /** Fundo em que a lista está: gaveta (`sidebar`) ou folha (`surface`). */
  on: 'sidebar' | 'surface'
  onNavigate: () => void
}

/**
 * Lista de grupos e itens do menu, usada pela gaveta e pela folha. Filhos de item ficam sempre
 * abertos e recuados, sem chevron (nada de `rotate-*` condicional). O item ativo vem do
 * `currentPath` da navegação, pelo destino mais específico.
 */
export function NavMenuList({ navigation, on, onNavigate }: NavMenuListProps) {
  const { currentPath } = useRendraNavigation()
  const t = tone[on]
  const activeTo = currentPath === undefined ? null : resolveActiveTo(getNavigationTargets(navigation), currentPath)

  const row = (
    key: string,
    to: string,
    title: string,
    active: boolean,
    Icon: NavIcon | null,
    badge?: string,
    nested = false,
  ) => (
    <ShellLink
      key={key}
      to={to}
      active={active}
      onNavigate={onNavigate}
      className={cn(
        'min-h-touch flex-row items-center gap-3 rounded-item px-3',
        nested && 'pl-12',
        active ? t.active : t.inactive,
      )}
    >
      {Icon ? <Icon className={cn('size-icon-md', active ? t.activeText : t.inactiveText)} /> : null}
      <Text
        weight={active ? 'semibold' : 'medium'}
        numberOfLines={1}
        className={cn('flex-1 text-sm', active ? t.activeText : t.inactiveText)}
      >
        {title}
      </Text>
      {badge ? <Text className={cn('text-xs', active ? t.activeText : t.inactiveText)}>{badge}</Text> : null}
    </ShellLink>
  )

  return (
    <View role="navigation" accessibilityLabel="Navegação principal" className="gap-4">
      {navigation.map((group) => (
        <View key={group.title} className="gap-1">
          <Text weight="medium" className={cn('px-3 text-xs', t.title)}>
            {group.title}
          </Text>
          {group.items.map((item) => (
            <View key={item.title} className="gap-1">
              {item.to ? (
                row(item.title, item.to, item.title, item.to === activeTo, item.icon, item.badge)
              ) : (
                <View className="min-h-touch flex-row items-center gap-3 px-3">
                  <item.icon className={cn('size-icon-md', t.inactiveText)} />
                  <Text weight="medium" className={cn('flex-1 text-sm', t.inactiveText)}>
                    {item.title}
                  </Text>
                </View>
              )}
              {item.children?.map((child) =>
                row(`${item.title}/${child.to}`, child.to, child.title, child.to === activeTo, null, undefined, true),
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}

export interface NavDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  navigation: NavGroup[]
}

/**
 * Gaveta de navegação (`N1`/`N3`): painel lateral que entra da esquerda, sobre uma área escura
 * que fecha ao toque. Fecha também arrastando para a esquerda e pelo botão voltar do Android.
 * A posição e a largura vivem no `useAnimatedStyle` (um `Animated.View` com `className` perde
 * classes no web).
 */
function NavDrawerStatic({ open, onOpenChange, navigation }: NavDrawerProps) {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const reducedMotion = useReducedMotion()
  const panelWidth = Math.round(width * PANEL_WIDTH_RATIO)
  const widthRef = useRef(panelWidth)
  const reducedMotionRef = useRef(reducedMotion)
  const translateX = useSharedValue(-panelWidth)

  useEffect(() => {
    widthRef.current = panelWidth
    reducedMotionRef.current = reducedMotion
  })

  useEffect(() => {
    if (!open) return
    translateX.set(navDrawerTranslateX('closed', widthRef.current))
    const timer = setTimeout(() => {
      translateX.set(
        withTiming(
          navDrawerTranslateX('settled', widthRef.current),
          reducedMotionRef.current ? { duration: 0 } : timing('slow', 'drawer'),
        ),
      )
    }, 0)
    return () => clearTimeout(timer)
  }, [open, translateX])

  useEffect(() => {
    if (!open) return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onOpenChange(false)
      return true
    })
    return () => sub.remove()
  }, [open, onOpenChange])

  // Mesmo gesto do caminho `on`: worklet, fricção para o lado de abrir, decisão por projeção.
  const dismiss = useCallback(() => onOpenChange(false), [onOpenChange])
  const gesture = useOverlayPan({
    axis: 'x',
    direction: -1,
    size: panelWidth,
    offset: translateX,
    onDismiss: dismiss,
    testID: 'nav-drawer-arraste',
    activeOffsetX: 20,
    failOffsetY: [-15, 15],
    afterDismiss: 'return',
  })

  const animated = useAnimatedStyle(() => ({
    width: panelWidth,
    transform: [{ translateX: translateX.get() }],
  }))

  return (
    // `animationType="none"` com entrada própria: no export web só assim o modal ganha `role="dialog"`.
    <RNModal
      transparent
      animationType="none"
      visible={open}
      onRequestClose={() => onOpenChange(false)}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 flex-row bg-overlay">
          <GestureDetector gesture={gesture}>
            <Animated.View style={animated}>
              <View
                role="dialog"
                accessibilityLabel="Menu"
                accessibilityViewIsModal
                testID="nav-drawer-painel"
                className="flex-1 overflow-hidden bg-sidebar"
                style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
              >
                <Gradient token="brand" className="absolute inset-0" />
                <View className="h-header flex-row items-center justify-between gap-2 px-4">
                  <BrandLogo on="sidebar" />
                  <Button
                    variant="ghost"
                    iconOnly
                    accessibilityLabel="Fechar menu"
                    icon={<X className="text-sidebar-foreground" />}
                    onPress={() => onOpenChange(false)}
                  />
                </View>
                <ScrollView tabIndex={0} className="flex-1" contentContainerClassName="p-2">
                  <NavMenuList navigation={navigation} on="sidebar" onNavigate={() => onOpenChange(false)} />
                </ScrollView>
              </View>
            </Animated.View>
          </GestureDetector>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            className="flex-1"
            onPress={() => onOpenChange(false)}
          />
        </View>
      </GestureHandlerRootView>
    </RNModal>
  )
}

/** Caminho `motion="on"`: spring na entrada, arraste worklet para a esquerda, saída animada. */
function NavDrawerMotion({ open, onOpenChange, navigation }: NavDrawerProps) {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const reducedMotion = useReducedMotion()
  const panelWidth = Math.round(width * PANEL_WIDTH_RATIO)
  const close = useCallback(() => onOpenChange(false), [onOpenChange])
  const { mounted, offset, backdrop, contentOpacity, gesture } = useOverlayMotion({
    open,
    axis: 'x',
    direction: -1,
    size: panelWidth,
    reduced: reducedMotion,
    onDismiss: close,
    testID: 'nav-drawer-arraste',
    activeOffsetX: 20,
    failOffsetY: [-15, 15],
  })

  useEffect(() => {
    if (!open) return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close()
      return true
    })
    return () => sub.remove()
  }, [open, close])

  const animated = useAnimatedStyle(() => ({
    width: panelWidth,
    transform: [{ translateX: offset.get() }],
    opacity: contentOpacity.get(),
  }))

  return (
    <RNModal transparent animationType="none" visible={mounted} onRequestClose={close} statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 flex-row">
          <View className="absolute inset-0" pointerEvents="none">
            <MotionView fill opacity={backdrop} testID="nav-drawer-backdrop">
              <View className="size-full bg-overlay" />
            </MotionView>
          </View>
          <GestureDetector gesture={gesture}>
            <Animated.View style={animated} pointerEvents={open ? 'auto' : 'none'}>
              <View
                role="dialog"
                accessibilityLabel="Menu"
                accessibilityViewIsModal
                testID="nav-drawer-painel"
                className="flex-1 overflow-hidden bg-sidebar"
                style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
              >
                <Gradient token="brand" className="absolute inset-0" />
                <View className="h-header flex-row items-center justify-between gap-2 px-4">
                  <BrandLogo on="sidebar" />
                  <Button
                    variant="ghost"
                    iconOnly
                    accessibilityLabel="Fechar menu"
                    icon={<X className="text-sidebar-foreground" />}
                    onPress={close}
                  />
                </View>
                <ScrollView tabIndex={0} className="flex-1" contentContainerClassName="p-2">
                  <NavMenuList navigation={navigation} on="sidebar" onNavigate={close} />
                </ScrollView>
              </View>
            </Animated.View>
          </GestureDetector>
          <Pressable accessibilityRole="button" accessibilityLabel="Fechar" className="flex-1" onPress={close} />
        </View>
      </GestureHandlerRootView>
    </RNModal>
  )
}

export function NavDrawer(props: NavDrawerProps) {
  const mode = useMotion()
  return mode === 'on' ? <NavDrawerMotion {...props} /> : <NavDrawerStatic {...props} />
}
