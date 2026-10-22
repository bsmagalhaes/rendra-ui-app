import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated'
import { Text } from '../internal/text'
import { cn } from '../../lib/cn'
import { a11yPresets } from '../../lib/a11y'
import { useControlledState } from '../../hooks/use-controlled-state'
import { resolveCatalogCode } from '../../catalog/components'
import { MotionView } from '../internal/motion-view'
import { timing } from '../../lib/motion/tokens'
import { motionTokens } from '../../theme/motion'
import { useMotionPreset } from '../../lib/motion/use-motion-preset'

export interface RadioOption {
  value: string
  label: ReactNode
  description?: ReactNode
  icon?: ReactNode
  disabled?: boolean
}

export interface RadioGroupProps {
  options: RadioOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  variant?: 'list' | 'cards'
  orientation?: 'vertical' | 'horizontal'
  invalid?: boolean
  disabled?: boolean
  id?: string // recebido via cloneElement pelo Field (Tarefa 19); reservado, sem uso interno
  accessibilityLabel?: string
}

/**
 * Alvo do ponto interno: fora de `on` devolve `null` (nada é animado, as classes `scale-100`/`scale-0`
 * de sempre mandam); em `on` devolve o valor final (progresso 0 a 1) e se anima em 120 ms `ease-out`
 * (movimento reduzido troca seco). O progresso guia opacidade e escala de 0,9 a 1: o ponto nunca
 * nasce de `scale(0)`.
 */
export function radioDotTarget(active: boolean, reduced: boolean, checked: boolean): { value: 0 | 1; animate: boolean } | null {
  if (!active) return null
  return { value: checked ? 1 : 0, animate: !reduced }
}

function Bullet({ checked, invalid }: { checked: boolean; invalid?: boolean }) {
  const { active, reduced } = useMotionPreset()
  const dot = useSharedValue(checked ? 1 : 0)
  useEffect(() => {
    // `on`: o ponto aparece de 0,9 a 1 com opacidade (120 ms, `ease-out`, sem quique) e some do mesmo
    // jeito; com movimento reduzido troca sem animar. Em `off` não mexe no valor.
    const alvo = radioDotTarget(active, reduced, checked)
    if (!alvo) return
    dot.set(alvo.animate ? withTiming(alvo.value, timing('fast', 'out')) : alvo.value)
  }, [active, checked, reduced, dot])
  const dotScale = useDerivedValue(() => motionTokens.scales.small + (1 - motionTokens.scales.small) * dot.get())
  return (
    <View
      className={cn(
        'size-icon-md items-center justify-center rounded-full border border-input bg-card',
        checked && 'border-primary',
        invalid && 'border-destructive',
      )}
    >
      {active ? (
        <MotionView testID="radio-ponto" scale={dotScale} opacity={dot}>
          <View className="size-2 rounded-full bg-primary" />
        </MotionView>
      ) : (
        <View className={cn('size-2 rounded-full bg-primary', checked ? 'scale-100' : 'scale-0')} />
      )}
    </View>
  )
}

export function RadioGroup({
  options,
  value: valueProp,
  defaultValue,
  onChange,
  variant = 'list',
  orientation = 'vertical',
  invalid = false,
  disabled = false,
  accessibilityLabel,
}: RadioGroupProps) {
  const [value, setValue] = useControlledState<string | undefined>(valueProp, defaultValue, onChange as (v: string | undefined) => void)

  function select(optionValue: string, optionDisabled?: boolean) {
    if (disabled || optionDisabled) return
    setValue(optionValue)
  }

  const code = resolveCatalogCode('RadioGroup', { variant })

  return (
    <View
      accessibilityRole={a11yPresets.radiogroup.accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      dataSet={{ rendra: code }}
      className={variant === 'cards' ? 'flex-col gap-3' : orientation === 'horizontal' ? 'flex-row flex-wrap gap-x-6' : 'flex-col'}
    >
      {options.map((option) => {
        const checked = option.value === value
        const isDisabled = disabled || option.disabled
        if (variant === 'cards') {
          return (
            <Pressable
              key={option.value}
              accessibilityRole={a11yPresets.radio.accessibilityRole}
              accessibilityState={{ checked, disabled: isDisabled }}
              aria-checked={checked}
              disabled={isDisabled}
              onPress={() => select(option.value, option.disabled)}
              className={cn(
                'flex-row items-start gap-3 rounded-control border border-border bg-card p-4',
                checked && 'border-primary bg-primary-soft',
                isDisabled && 'opacity-50',
              )}
            >
              {option.icon ? (
                <View
                  className={cn(
                    'size-control-sm items-center justify-center rounded-control bg-muted text-foreground',
                    checked && 'bg-primary text-primary-foreground',
                  )}
                >
                  {option.icon}
                </View>
              ) : null}
              <View className="flex-1 flex-col">
                <Text weight="semibold" className="text-sm text-foreground">{option.label}</Text>
                {option.description ? <Text className="text-sm text-muted-foreground">{option.description}</Text> : null}
              </View>
              <Bullet checked={checked} invalid={invalid} />
            </Pressable>
          )
        }
        return (
          <Pressable
            key={option.value}
            accessibilityRole={a11yPresets.radio.accessibilityRole}
            accessibilityState={{ checked, disabled: isDisabled }}
            aria-checked={checked}
            disabled={isDisabled}
            onPress={() => select(option.value, option.disabled)}
            className={cn('min-h-touch flex-row items-start gap-3 py-3', isDisabled && 'opacity-60')}
          >
            <Bullet checked={checked} invalid={invalid} />
            <View className="flex-1 flex-col">
              <Text weight="medium" className="text-sm text-foreground">{option.label}</Text>
              {option.description ? <Text className="text-sm text-muted-foreground">{option.description}</Text> : null}
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}
