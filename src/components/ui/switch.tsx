import { useId } from 'react'
import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import Animated, { type WithTimingConfig, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { Text } from '../internal/text'
import { cn } from '../../lib/cn'
import { a11yPresets } from '../../lib/a11y'
import { useReducedMotion } from '../../lib/reduced-motion'
import { useMotion } from '../../lib/motion/context'
import { timing } from '../../lib/motion/tokens'
import { useControlledState } from '../../hooks/use-controlled-state'

export interface SwitchProps {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  label?: ReactNode
  description?: ReactNode
  disabled?: boolean
  id?: string
  accessibilityLabel?: string
  className?: string
}

/**
 * Animação do polegar: `on` assenta em `base` (200 ms) pela curva `move`, sem mola (um toggle de
 * 150 a 200 ms, e a mola de antes levava cerca de 230 ms para assentar); fora de `on` fica o
 * `withTiming` de sempre (200 ms), e com movimento reduzido o polegar troca seco (0). Pura, para o
 * teste distinguir os caminhos.
 */
export function switchThumbMotion(motionOn: boolean, reducedMotion: boolean): { timing: WithTimingConfig } {
  if (reducedMotion) return { timing: { duration: 0 } }
  return motionOn ? { timing: timing('base', 'move') } : { timing: { duration: 200 } }
}

export function Switch({
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  label,
  description,
  disabled = false,
  id: idProp,
  accessibilityLabel,
  className,
}: SwitchProps) {
  const [checked, setChecked] = useControlledState<boolean>(checkedProp, defaultChecked, onCheckedChange)
  const generatedId = useId()
  const id = idProp ?? `sw${generatedId}`
  const reducedMotion = useReducedMotion()
  const motionOn = useMotion() === 'on'

  // `on`: 200 ms pela curva `move`; sem `on` o `withTiming` de sempre (200 ms); reduzido troca seco (0).
  const thumbMotion = switchThumbMotion(motionOn, reducedMotion)
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(checked ? 24 : 0, thumbMotion.timing) }],
  }))

  function handlePress() {
    if (disabled) return
    setChecked(!checked)
  }

  const trackVisual = (
    <View className={cn('h-6 w-12 rounded-full border-2 border-transparent bg-input', checked && 'bg-primary')}>
      {/* Um `Animated.View` com `className` perde as classes no web (o polegar saía 0 de altura e transparente):
          o animado leva só `testID` e `style`, e as classes do polegar vivem num `View` filho (mesmo padrão do Button). */}
      <Animated.View testID={`${id}-thumb`} style={thumbStyle}>
        <View className="size-icon-md rounded-full bg-card shadow-sm" />
      </Animated.View>
    </View>
  )

  if (!label) {
    return (
      <Pressable
        testID={id}
        dataSet={{ rendra: 'SWT-001' }}
        accessibilityRole={a11yPresets.switch.accessibilityRole}
        accessibilityState={{ checked, disabled }}
        aria-checked={checked}
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        onPress={handlePress}
        hitSlop={12}
        className={cn('min-h-touch min-w-touch items-center justify-center', disabled && 'opacity-50', className)}
      >
        {trackVisual}
      </Pressable>
    )
  }

  return (
    <Pressable
      testID={id}
      dataSet={{ rendra: 'SWT-001' }}
      accessibilityRole={a11yPresets.switch.accessibilityRole}
      accessibilityState={{ checked, disabled }}
      aria-checked={checked}
      accessibilityLabel={typeof label === 'string' ? label : accessibilityLabel}
      onPress={handlePress}
      disabled={disabled}
      hitSlop={12}
      className={cn('min-h-touch flex-row items-center justify-between gap-4 py-3', disabled && 'opacity-60', className)}
    >
      <View className="flex-1 flex-col">
        <Text weight="medium" className="text-sm text-foreground">{label}</Text>
        {description ? <Text className="text-sm text-muted-foreground">{description}</Text> : null}
      </View>
      {trackVisual}
    </Pressable>
  )
}
