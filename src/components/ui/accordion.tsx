import { useState } from 'react'
import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { ChevronDown } from 'lucide-react-native'
import { Text } from '../internal/text'
import { a11yPresets } from '../../lib/a11y'
import { useReducedMotion } from '../../lib/reduced-motion'
import { cn } from '../../lib/cn'

export interface AccordionItem {
  value: string
  title: ReactNode
  /**
   * M3 (Fable, validacao da entrega): o conteudo fechado ganha `pointerEvents="none"` (bloqueia
   * toque/clique), mas um filho focavel por teclado (`Button` num item fechado, por exemplo)
   * ainda entra no tab order do web dentro do no `aria-hidden`; conteudo focavel nao tem suporte
   * completo de navegacao por teclado no fechado nesta versao.
   */
  content: ReactNode
  disabled?: boolean
}

export interface AccordionProps {
  items: AccordionItem[]
  multiple?: boolean
  defaultValue?: string[]
  className?: string
}

/**
 * Função pura, testada isolada: altura alvo do `Animated.View` do conteúdo. Fechado é sempre 0;
 * aberto sem medida ainda devolve `undefined` (altura natural, sem piscar em 0 no primeiro
 * render, antes do `onLayout` medir).
 */
export function accordionHeight(open: boolean, measured: number | null): number | undefined {
  'worklet'
  if (!open) return 0
  return measured ?? undefined
}

// C5 (veredito do Opus): hook por item extraído num componente próprio, nunca dentro do `.map`
// do componente pai (react-hooks/rules-of-hooks reprova hook chamado dentro de laço/map).
function AccordionRow({
  item,
  expanded,
  onToggle,
  reducedMotion,
  isLast,
}: {
  item: AccordionItem
  expanded: boolean
  onToggle: () => void
  reducedMotion: boolean
  isLast: boolean
}) {
  const measured = useSharedValue<number | null>(null)

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: withTiming(expanded ? '180deg' : '0deg', { duration: reducedMotion ? 0 : 200 }) }],
  }))

  const contentStyle = useAnimatedStyle(() => {
    const h = accordionHeight(expanded, measured.get())
    return {
      overflow: 'hidden',
      height: h === undefined ? undefined : withTiming(h, { duration: reducedMotion ? 0 : 200 }),
    }
  })

  // M3 (Fable, validacao da entrega): sem pointerEvents="none", um filho focavel do conteudo
  // fechado (Button e composicao autorizada em "linha de Accordion") continua alcancavel por
  // toque/tab no web dentro de um no aria-hidden (axe aria-hidden-focus).
  const hiddenProps = !expanded
    ? {
        'aria-hidden': true as const,
        accessibilityElementsHidden: true,
        importantForAccessibility: 'no-hide-descendants' as const,
        pointerEvents: 'none' as const,
      }
    : {}

  return (
    <View className={cn('border-b border-border', isLast && 'border-b-0')}>
      <Pressable
        accessibilityRole={a11yPresets.button.accessibilityRole}
        accessibilityState={{ expanded, disabled: item.disabled }}
        aria-expanded={expanded}
        disabled={item.disabled}
        onPress={onToggle}
        className={cn(
          'min-h-touch w-full flex-row items-center justify-between gap-4 py-4',
          item.disabled && 'opacity-50',
        )}
      >
        <Text weight="medium" className="text-sm text-foreground">
          {item.title}
        </Text>
        <Animated.View style={chevronStyle}>
          <ChevronDown className="size-icon-sm shrink-0 text-muted-foreground" />
        </Animated.View>
      </Pressable>
      <Animated.View style={contentStyle}>
        <View
          onLayout={(e) => measured.set(e.nativeEvent.layout.height)}
          className="pb-4"
          {...hiddenProps}
        >
          {typeof item.content === 'string' ? (
            <Text className="text-sm text-muted-foreground">{item.content}</Text>
          ) : (
            item.content
          )}
        </View>
      </Animated.View>
    </View>
  )
}

export function Accordion({ items, multiple = false, defaultValue, className }: AccordionProps) {
  // C5 (veredito do Opus): em modo único, só o primeiro valor de `defaultValue` abre (contrato
  // §12.30); `multiple` permite todos os valores iniciais.
  const [abertos, setAbertos] = useState<string[]>(
    multiple ? (defaultValue ?? []) : (defaultValue ?? []).slice(0, 1),
  )
  const reducedMotion = useReducedMotion()

  function toggle(value: string) {
    setAbertos((prev) => {
      const isOpen = prev.includes(value)
      if (multiple) return isOpen ? prev.filter((v) => v !== value) : [...prev, value]
      return isOpen ? [] : [value]
    })
  }

  return (
    <View className={className} dataSet={{ rendra: 'ACRN-001' }}>
      {items.map((item, index) => (
        <AccordionRow
          key={item.value}
          item={item}
          expanded={abertos.includes(item.value)}
          onToggle={() => toggle(item.value)}
          reducedMotion={reducedMotion}
          isLast={index === items.length - 1}
        />
      ))}
    </View>
  )
}
