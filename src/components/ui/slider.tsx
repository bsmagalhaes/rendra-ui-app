import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { Text } from '../internal/text'
import { cn } from '../../lib/cn'
import { a11yPresets } from '../../lib/a11y'
import { useControlledState } from '../../hooks/use-controlled-state'
import { useMotionPreset } from '../../lib/motion/use-motion-preset'
import { pressTiming } from '../../lib/motion/tokens'
import { motionTokens } from '../../theme/motion'

export interface SliderProps {
  value?: number[]
  defaultValue?: number[]
  onChange?: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  showValue?: boolean
  formatValue?: (n: number) => string
  accessibilityLabel?: string
  id?: string // recebido via cloneElement pelo Field (Tarefa 19); reservado, sem uso interno
  testID?: string
}

const THUMB_TOUCH = 44

function clampToStep(raw: number, min: number, max: number, step: number) {
  'worklet'
  const stepped = min + Math.round((raw - min) / step) * step
  return Math.min(max, Math.max(min, stepped))
}

/**
 * Deslocamento horizontal da alça (área de toque de `THUMB_TOUCH`px) para ficar centrada em
 * `ratio * width`. Bloqueador 1 do veredito do Bloco B (Fable): exportada como função pura para
 * teste porque, sob Jest, o valor de `style` de uma `Animated.View` com `className` fica preso
 * ao cálculo do primeiro render mesmo depois de um re-render com `width` diferente (limitação do
 * mock/interop registrada no arquivo de desvios), então uma asserção de `props.style` depois de
 * um `fireEvent(trilho, 'layout', ...)` não é confiável para verificar este cálculo.
 */
export function thumbTranslateX(ratio: number, width: number) {
  'worklet'
  return ratio * width - THUMB_TOUCH / 2
}

function Thumb({
  index,
  testID,
  width,
  min,
  max,
  step,
  value,
  values,
  disabled,
  accessibilityLabel,
  onCommit,
}: {
  index: number
  testID?: string
  width: number
  min: number
  max: number
  step: number
  value: number
  values: number[]
  disabled?: boolean
  accessibilityLabel?: string
  onCommit: (index: number, next: number) => void
}) {
  const startValue = useSharedValue(value)
  const liveValue = useSharedValue(value)
  const lastCommitted = useSharedValue(value)
  const { active: motionOn, reduced } = useMotionPreset()
  const grow = useSharedValue(1)
  // Calculada fora do worklet: `pressTiming()` é uma função da JS e não roda na UI thread.
  const pressConfig = pressTiming()

  useEffect(() => {
    liveValue.set(value)
    lastCommitted.set(value)
  }, [value, liveValue, lastCommitted])

  // O arraste é worklet: a alça segue o dedo na UI thread (`liveValue`), sem `setState` por quadro. O
  // React só é avisado quando o valor em PASSOS muda (limiar), por `scheduleOnRN` numa reação, nunca
  // dentro do `onUpdate`.
  useAnimatedReaction(
    () => liveValue.get(),
    (current) => {
      if (current === lastCommitted.get()) return
      lastCommitted.set(current)
      scheduleOnRN(onCommit, index, current)
    },
    [onCommit, index],
  )

  const gesture = Gesture.Pan()
    .withTestId(`${testID ?? 'slider'}-thumb-${index}`)
    .enabled(!disabled)
    .onBegin(() => {
      'worklet'
      startValue.set(liveValue.get())
    })
    .onUpdate((e) => {
      'worklet'
      const raw = startValue.get() + (e.translationX / width) * (max - min)
      const bounded = clampToStep(raw, min, max, step)
      const lowerBound = index > 0 ? values[index - 1] : min
      const upperBound = index < values.length - 1 ? values[index + 1] : max
      liveValue.set(Math.min(upperBound, Math.max(lowerBound, bounded)))
    })

  // `on`: gesto extra, também worklet, composto com o de sempre; só cresce a alça enquanto
  // o dedo está nela. Fora de `on` o `GestureDetector` recebe o mesmo objeto de gesto de sempre.
  const growGesture = Gesture.Pan()
    .withTestId(`${testID ?? 'slider'}-thumb-${index}-escala`)
    .enabled(!disabled && !reduced)
    .onBegin(() => {
      'worklet'
      grow.set(withTiming(motionTokens.scales.bump, pressConfig))
    })
    .onFinalize(() => {
      'worklet'
      grow.set(withTiming(1, pressConfig))
    })

  // Posição e tamanho fixos (`position`, `left`, `top`, `height`, `width`, `alignItems`,
  // `justifyContent`) vão dentro do mesmo `useAnimatedStyle`, não em `className`: combinar
  // `className` com `style` de `useAnimatedStyle` num `Animated.View` (react-native-reanimated)
  // faz o `react-native-css-interop` aplicar as classes utilitárias no elemento errado tanto no
  // export web real (comprovado via Playwright, `role="slider"` saindo com 20x20 em vez de
  // 44x44) quanto sob Jest (`style` preso ao cálculo do primeiro render mesmo após um re-render
  // com `width` novo); ambos registrados no arquivo de desvios.
  const style = useAnimatedStyle(() => {
    const ratio = (liveValue.get() - min) / (max - min)
    return {
      position: 'absolute',
      left: 0,
      top: 0,
      height: THUMB_TOUCH,
      width: THUMB_TOUCH,
      alignItems: 'center',
      justifyContent: 'center',
      transform: motionOn
        ? [{ translateX: thumbTranslateX(ratio, width) }, { scale: grow.get() }]
        : [{ translateX: thumbTranslateX(ratio, width) }],
    }
  })

  return (
    <GestureDetector gesture={motionOn ? Gesture.Simultaneous(gesture, growGesture) : gesture}>
      <Animated.View
        testID={`${testID ?? 'slider'}-thumb-${index}-alca`}
        style={style}
        accessible
        accessibilityRole={a11yPresets.adjustable.accessibilityRole}
        accessibilityLabel={values.length > 1 ? (index === 0 ? 'Mínimo' : 'Máximo') : accessibilityLabel}
        accessibilityState={{ disabled }}
        accessibilityValue={{ min, max, now: value }}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-disabled={disabled}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          // Achado 6 do veredito do Bloco B: desabilitado só desligava o gesto de arraste;
          // a ação de acessibilidade (leitor de tela) ainda alterava o valor.
          if (disabled) return
          const delta = e.nativeEvent.actionName === 'increment' ? step : -step
          onCommit(index, clampToStep(value + delta, min, max, step))
        }}
      >
        <View className="size-icon-md rounded-full border-2 border-primary bg-card shadow-sm" />
      </Animated.View>
    </GestureDetector>
  )
}

export function Slider({
  value: controlledValue,
  defaultValue = [50],
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  showValue = false,
  formatValue = (n) => n.toLocaleString('pt-BR'),
  accessibilityLabel,
  testID,
}: SliderProps) {
  const [values, setValues] = useControlledState<number[]>(controlledValue, defaultValue, onChange)
  const [width, setWidth] = useState(0)
  const isRange = values.length > 1

  const commit = useCallback(
    (index: number, next: number) => {
      setValues(values.map((v, i) => (i === index ? next : v)))
    },
    [setValues, values],
  )

  const filledLeftRatio = isRange ? (values[0] - min) / (max - min) : 0
  const filledRightRatio = isRange ? (values[1] - min) / (max - min) : (values[0] - min) / (max - min)

  return (
    <View className="flex-col gap-3" dataSet={{ rendra: 'SLD-001' }}>
      {showValue ? (
        <View className="flex-row justify-between">
          <Text weight="medium" className="text-sm text-foreground">
            {formatValue(values[0])}
          </Text>
          {isRange ? (
            <Text weight="medium" className="text-sm text-foreground">
              {formatValue(values[1])}
            </Text>
          ) : null}
        </View>
      ) : null}
      <View
        testID={`${testID ?? 'slider'}-trilho`}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        className={cn('relative h-touch w-full items-center justify-center', disabled && 'opacity-50')}
      >
        <View className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <View
            testID={`${testID ?? 'slider'}-faixa`}
            style={{ left: `${filledLeftRatio * 100}%`, width: `${(filledRightRatio - filledLeftRatio) * 100}%` }}
            className="absolute h-2 rounded-full bg-primary"
          />
        </View>
        {values.map((v, i) => (
          <Thumb
            key={i}
            index={i}
            testID={testID}
            width={width}
            min={min}
            max={max}
            step={step}
            value={v}
            values={values}
            disabled={disabled}
            accessibilityLabel={accessibilityLabel}
            onCommit={commit}
          />
        ))}
      </View>
    </View>
  )
}
