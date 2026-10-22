import { Pressable, View } from 'react-native'
import { Star } from 'lucide-react-native'
import { Text } from '../internal/text'
import { cn } from '../../lib/cn'
import { a11yPresets } from '../../lib/a11y'
import { resolveCatalogCode } from '../../catalog/components'
import { PressScale } from '../internal/motion-view'
import { motionTokens } from '../../theme/motion'

/*
 * Avaliação: estrelas (1 a max, padrão 5) ou escala numérica (min a max, padrão 1 a 10).
 * `value` nulo é "sem resposta ainda", nunca 0: tocar de novo na opção marcada desmarca e devolve
 * null. Sempre controlado. Semântica de radiogroup. A navegação por setas, Home e End do web é só
 * de teclado e fica fora no celular.
 */

export interface RatingProps {
  variant?: 'stars' | 'scale'
  value: number | null
  onChange?: (value: number | null) => void
  /** stars: total de estrelas (padrão 5). scale: valor máximo (padrão 10, até 10). */
  max?: number
  /** Só a escala: valor mínimo (padrão 1). */
  min?: number
  /** Só a escala: rótulo da ponta de baixo. */
  lowLabel?: string
  /** Só a escala: rótulo da ponta de cima. */
  highLabel?: string
  disabled?: boolean
  invalid?: boolean
  id?: string // recebido via cloneElement pelo Field; reservado, sem uso interno
  accessibilityLabel?: string
  testID?: string
}

const SCALE_COLUMNS = 5

// Tom da nota marcada pela faixa: até 1/3 destrutivo, até 2/3 aviso, acima sucesso. Cada faixa
// declara as mesmas propriedades (borda, fundo e texto), para a troca de tom não criar classe só
// num dos estados.
function scaleTone(ratio: number): { frame: string; text: string } {
  if (ratio <= 1 / 3) return { frame: 'border-destructive bg-destructive-soft', text: 'text-destructive-soft-foreground' }
  if (ratio <= 2 / 3) return { frame: 'border-warning bg-warning-soft', text: 'text-warning-soft-foreground' }
  return { frame: 'border-success bg-success-soft', text: 'text-success-soft-foreground' }
}

export function Rating({
  variant = 'stars',
  value,
  onChange,
  max,
  min = 1,
  lowLabel,
  highLabel,
  disabled = false,
  invalid = false,
  accessibilityLabel,
  testID,
}: RatingProps) {
  const effectiveMax = max ?? (variant === 'stars' ? 5 : 10)
  const options =
    variant === 'stars'
      ? Array.from({ length: effectiveMax }, (_, i) => i + 1)
      : Array.from({ length: Math.max(0, effectiveMax - min + 1) }, (_, i) => i + min)

  // `disabled` no Pressable já impede o toque; nenhuma guarda extra aqui.
  function select(n: number) {
    onChange?.(value === n ? null : n)
  }

  const code = resolveCatalogCode('Rating', { variant })

  if (variant === 'stars') {
    return (
      <View
        testID={testID}
        accessibilityRole={a11yPresets.radiogroup.accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        dataSet={{ rendra: code }}
        className="flex-row gap-1 self-start"
      >
        {options.map((n) => {
          const filled = value !== null && n <= value
          return (
            <PressScale
              key={n}
              accessibilityRole={a11yPresets.radio.accessibilityRole}
              accessibilityState={{ checked: n === value, disabled }}
              aria-checked={n === value}
              accessibilityLabel={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`}
              disabled={disabled}
              onPress={() => select(n)}
              pressScale={motionTokens.scales.bump}
              playful
              motionTestID={`rating-press-${n}`}
              className={cn('min-h-touch min-w-touch items-center justify-center rounded-control', disabled && 'opacity-50')}
              outerClassName={cn('min-h-touch min-w-touch items-center justify-center rounded-control', disabled && 'opacity-50')}
              innerClassName="items-center justify-center"
            >
              <Star
                testID={`rating-estrela-${n}`}
                fill={filled ? 'currentColor' : 'none'}
                className={cn('size-icon-lg', filled ? 'text-warning' : invalid ? 'text-destructive' : 'text-muted-foreground')}
              />
            </PressScale>
          )
        })}
      </View>
    )
  }

  const rows: number[][] = []
  for (let i = 0; i < options.length; i += SCALE_COLUMNS) rows.push(options.slice(i, i + SCALE_COLUMNS))

  return (
    <View className="flex-col gap-2">
      <View
        testID={testID}
        accessibilityRole={a11yPresets.radiogroup.accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        dataSet={{ rendra: code }}
        className="flex-col gap-2"
      >
        {rows.map((row, r) => (
          <View key={r} className="flex-row gap-2">
            {row.map((n) => {
              const checked = n === value
              const ratio = options.length > 1 ? (n - min) / (effectiveMax - min) : 1
              const tone = scaleTone(ratio)
              return (
                <Pressable
                  key={n}
                  accessibilityRole={a11yPresets.radio.accessibilityRole}
                  accessibilityState={{ checked, disabled }}
                  aria-checked={checked}
                  accessibilityLabel={`Nota ${n}`}
                  disabled={disabled}
                  onPress={() => select(n)}
                  className={cn(
                    'aspect-square min-h-touch flex-1 items-center justify-center rounded-control border bg-card',
                    checked ? tone.frame : invalid ? 'border-destructive' : 'border-input',
                    disabled && 'opacity-50',
                  )}
                >
                  <Text weight="medium" className={cn('text-sm tabular-nums', checked ? tone.text : 'text-foreground')}>
                    {n}
                  </Text>
                </Pressable>
              )
            })}
            {/* Completa a última fileira para as notas não esticarem além da largura das outras. */}
            {Array.from({ length: SCALE_COLUMNS - row.length }, (_, i) => (
              <View key={`vazio-${i}`} className="flex-1" />
            ))}
          </View>
        ))}
      </View>
      {lowLabel || highLabel ? (
        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-muted-foreground">{lowLabel}</Text>
          <Text className="text-xs text-muted-foreground">{highLabel}</Text>
        </View>
      ) : null}
    </View>
  )
}
