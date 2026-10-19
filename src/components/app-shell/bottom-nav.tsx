import { useEffect, useState } from 'react'
import { Keyboard, Platform, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Menu } from 'lucide-react-native'
import Svg from 'react-native-svg'
import { cssInterop } from 'nativewind'
import { Text } from '../internal/text'
import { useBrand } from '../../brand/use-brand'
import { cn } from '../../lib/cn'
import { ShellLink } from './shell-link'
import { useShell } from './shell-context'
import type { NavItem } from './types'

// O símbolo da marca é um Svg: só resolve `currentColor` pelo próprio `style.color` (mesmo precedente de brand-logo.tsx).
cssInterop(Svg, { className: 'style' })

/**
 * Barra inferior: até 4 atalhos e, no centro, o botão redondo do menu, subindo metade acima da
 * linha da barra. É a dona do inset inferior. O botão central leva `shadow-md` sempre (nunca
 * condicional: classe de sombra que aparece depois do primeiro render derruba o css-interop no
 * Android), e o item ativo declara os dois estados de cor. No Android, com o teclado aberto, o
 * inset inferior sai: a área segura fica atrás do teclado e o recuo deixaria um vão entre a barra
 * e as teclas (o `KeyboardAvoidingView` do shell já subiu a barra até o teclado).
 */
export function BottomNav() {
  const insets = useSafeAreaInsets()
  const { bottomNavItems, activeTo, setMobileNavOpen, centerButton } = useShell()
  const { brand } = useBrand()
  const [tecladoAberto, setTecladoAberto] = useState(false)

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined
    const abre = Keyboard.addListener('keyboardDidShow', () => setTecladoAberto(true))
    const fecha = Keyboard.addListener('keyboardDidHide', () => setTecladoAberto(false))
    return () => {
      abre.remove()
      fecha.remove()
    }
  }, [])

  const item = (entry: NavItem) => {
    const to = entry.to ?? entry.children?.[0]?.to ?? '/'
    const Icon = entry.icon
    const ativo = to === activeTo || Boolean(entry.children?.some((filho) => filho.to === activeTo))
    return (
      <View key={entry.title} className="flex-1">
        <ShellLink
          to={to}
          active={ativo}
          className="min-h-touch flex-col items-center justify-center gap-1 py-2"
        >
          <Icon className={cn('size-icon-md', ativo ? 'text-primary-text' : 'text-muted-foreground')} />
          <Text
            weight="medium"
            numberOfLines={1}
            className={cn('px-1 text-xs', ativo ? 'text-primary-text' : 'text-muted-foreground')}
          >
            {entry.shortTitle ?? entry.title}
          </Text>
        </ShellLink>
      </View>
    )
  }

  // Ícone do botão central: o símbolo da marca, um ícone próprio ou, sem nada (ou sem símbolo), o menu.
  const classeIcone = 'size-icon-lg text-primary-foreground'
  const iconeCentral = centerButton?.icon
  const Simbolo = brand.symbol
  const Proprio = iconeCentral && iconeCentral !== 'brand-symbol' ? iconeCentral : null
  const iconeDoCentro = Proprio ? (
    <Proprio className={classeIcone} />
  ) : iconeCentral === 'brand-symbol' && Simbolo ? (
    <Simbolo className={classeIcone} />
  ) : (
    <Menu className={classeIcone} />
  )

  const metade = Math.ceil(bottomNavItems.length / 2)

  return (
    <View
      role="navigation"
      accessibilityLabel="Navegação rápida"
      className="flex-row items-end border-t border-border bg-card"
      style={{ paddingBottom: tecladoAberto ? 0 : Math.max(0, insets.bottom) }}
    >
      {bottomNavItems.slice(0, metade).map(item)}
      <View className="flex-1 items-center">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={centerButton?.accessibilityLabel ?? 'Abrir menu'}
          onPress={() => setMobileNavOpen(true)}
          className="-mt-6 mb-1 size-12 items-center justify-center rounded-full border-4 border-card bg-primary shadow-md"
        >
          {iconeDoCentro}
        </Pressable>
      </View>
      {bottomNavItems.slice(metade).map(item)}
    </View>
  )
}
