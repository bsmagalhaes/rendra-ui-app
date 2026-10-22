import { useId } from 'react'
import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { Check, Minus } from 'lucide-react-native'
import { Text } from '../internal/text'
import { cn } from '../../lib/cn'
import { a11yPresets } from '../../lib/a11y'
import { useControlledState } from '../../hooks/use-controlled-state'
import { MotionPresence, MotionView } from '../internal/motion-view'
import { checkIn } from '../../lib/motion/pop'
import { usePressScale } from '../../lib/motion/use-press-scale'

export interface CheckboxProps {
  checked?: boolean | 'indeterminate'
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  label?: ReactNode
  description?: ReactNode
  disabled?: boolean
  invalid?: boolean
  id?: string
  className?: string
  accessibilityLabel?: string
}

export function Checkbox({
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  label,
  description,
  disabled = false,
  invalid = false,
  id: idProp,
  className,
  accessibilityLabel,
}: CheckboxProps) {
  const [checked, setChecked] = useControlledState<boolean | 'indeterminate'>(
    checkedProp,
    defaultChecked,
    onCheckedChange as (v: boolean | 'indeterminate') => void,
  )
  const generatedId = useId()
  const id = idProp ?? `cb${generatedId}`
  const isIndeterminate = checked === 'indeterminate'
  const isChecked = checked === true
  const ariaChecked = isIndeterminate ? 'mixed' : isChecked

  function handlePress() {
    if (disabled) return
    setChecked(!(isChecked || isIndeterminate))
  }

  const { active: motionOn, scale: pressScale, pressProps } = usePressScale()

  const box = (
    <View
      className={cn(
        'size-icon-md items-center justify-center rounded-item border border-input bg-card',
        (isChecked || isIndeterminate) && 'border-primary bg-primary',
        invalid && 'border-destructive',
        disabled && 'opacity-50',
      )}
    >
      {isIndeterminate ? (
        <Minus className="text-primary-foreground" />
      ) : isChecked ? (
        <MotionPresence testID={`${id}-check`} enter={checkIn}>
          <Check className="text-primary-foreground" />
        </MotionPresence>
      ) : null}
    </View>
  )
  // `on`: a caixa escala no toque (spring); `off` devolve a caixa como está.
  const boxVisual = motionOn ? <MotionView scale={pressScale}>{box}</MotionView> : box

  if (!label) {
    return (
      <Pressable
        testID={id}
        dataSet={{ rendra: 'CHK-001' }}
        accessibilityRole={a11yPresets.checkbox.accessibilityRole}
        accessibilityState={{ checked: isIndeterminate ? 'mixed' : isChecked, disabled }}
        aria-checked={ariaChecked}
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        onPress={handlePress}
        hitSlop={12}
        {...pressProps}
        className={cn('min-h-touch min-w-touch items-center justify-center', className)}
      >
        {boxVisual}
      </Pressable>
    )
  }

  return (
    <Pressable
      testID={id}
      dataSet={{ rendra: 'CHK-001' }}
      accessibilityRole={a11yPresets.checkbox.accessibilityRole}
      accessibilityState={{ checked: isIndeterminate ? 'mixed' : isChecked, disabled }}
      aria-checked={ariaChecked}
      accessibilityLabel={typeof label === 'string' ? label : accessibilityLabel}
      onPress={handlePress}
      disabled={disabled}
      hitSlop={12}
      {...pressProps}
      className={cn('min-h-touch flex-row items-start gap-3 py-3', disabled && 'opacity-60', className)}
    >
      <View className="pt-px">{boxVisual}</View>
      <View className="flex-1 flex-col">
        <Text weight="medium" className="text-sm text-foreground">{label}</Text>
        {description ? <Text className="text-sm text-muted-foreground">{description}</Text> : null}
      </View>
    </Pressable>
  )
}

export interface CheckboxGroupOption {
  value: string
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
}

export interface CheckboxGroupProps {
  options: CheckboxGroupOption[]
  value?: string[]
  onChange?: (value: string[]) => void
  selectAll?: boolean
  orientation?: 'vertical' | 'horizontal'
  invalid?: boolean
  id?: string // recebido via cloneElement pelo Field (Tarefa 19); reservado, sem uso interno
  label?: string
}

export function CheckboxGroup({
  options,
  value = [],
  onChange,
  selectAll = false,
  orientation = 'vertical',
  invalid = false,
  label,
}: CheckboxGroupProps) {
  const enabledValues = options.filter((o) => !o.disabled).map((o) => o.value)
  const allSelected = enabledValues.length > 0 && enabledValues.every((v) => value.includes(v))
  const someSelected = enabledValues.some((v) => value.includes(v))

  function toggle(optionValue: string) {
    onChange?.(value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue])
  }

  function toggleAll() {
    onChange?.(allSelected ? [] : enabledValues)
  }

  return (
    <View role={a11yPresets.group.role} className="flex-col" accessibilityLabel={label} dataSet={{ rendra: 'CHK-002' }}>
      {selectAll ? (
        <Checkbox
          label="Selecionar todos"
          checked={allSelected ? true : someSelected ? 'indeterminate' : false}
          onCheckedChange={toggleAll}
          invalid={invalid}
          className="border-b border-border"
        />
      ) : null}
      <View className={cn('flex-col', orientation === 'horizontal' && 'flex-row flex-wrap gap-x-6')}>
        {options.map((option) => (
          <Checkbox
            key={option.value}
            label={option.label}
            description={option.description}
            checked={value.includes(option.value)}
            disabled={option.disabled}
            invalid={invalid}
            onCheckedChange={() => toggle(option.value)}
          />
        ))}
      </View>
    </View>
  )
}
