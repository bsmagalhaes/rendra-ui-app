import { cloneElement, isValidElement } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { View } from 'react-native'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react-native'
import { Text } from '../internal/text'
import { Card } from './card'
import { Skeleton } from './skeleton'
import { Gradient } from '../gradient/gradient'
import { a11yPresets } from '../../lib/a11y'
import { cn } from '../../lib/cn'
import { MotionCountText, MotionPresence } from '../internal/motion-view'
import { fadeIn } from '../../lib/motion/fade'
import { parseCountable } from '../../lib/motion/count'
import { useMotionPreset } from '../../lib/motion/use-motion-preset'

export interface StatCardProps {
  label: string
  value: ReactNode
  change?: number
  changeLabel?: string
  inverse?: boolean
  icon?: ReactElement
  highlight?: boolean
  loading?: boolean
  footer?: ReactNode
  className?: string
  testID?: string
}

/**
 * Função pura, testada isolada: compõe o rótulo acessível do bloco de valor/variação. `value`
 * só entra no rótulo quando `string`/`number` (senão o `Math.abs(undefined)` da variação viraria
 * `NaN`, e um `ReactNode` qualquer não tem representação textual segura).
 */
export function statCardLabel({
  label,
  value,
  change,
  changeLabel,
  good,
}: {
  label: string
  value?: ReactNode
  change?: number
  changeLabel?: string
  good: boolean
}): string {
  const valuePart = typeof value === 'string' || typeof value === 'number' ? `, ${value}` : ''
  if (change === undefined) return `${label}${valuePart}`
  const direction = changeLabel ?? (good ? 'alta' : 'queda')
  const amount = Math.abs(change).toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  return `${label}${valuePart}, ${direction} de ${amount}%`
}

/**
 * Valor do cartão. `off`: o `Text` de sempre. `on`: conta até o valor quando ele é número ou string
 * pt-BR com número (nativo e navegador; sem movimento reduzido); fora disso só aparece com fade.
 */
function StatValue({ value }: { value: ReactNode }) {
  const { active, reduced } = useMotionPreset()
  const text = (
    <Text weight="semibold" className="text-2xl text-foreground">
      {value}
    </Text>
  )
  if (!active) return text
  const countable = !reduced ? parseCountable(value) : null
  if (countable) return <MotionCountText countable={countable} />
  return <MotionPresence enter={fadeIn}>{text}</MotionPresence>
}

export function StatCard({
  label,
  value,
  change,
  changeLabel,
  inverse = false,
  icon,
  highlight = false,
  loading = false,
  footer,
  className,
  testID,
}: StatCardProps) {
  const up = change !== undefined && change > 0
  const flat = !change
  const good = inverse ? !up : up

  const pillToneClass = flat ? 'bg-muted' : good ? 'bg-success-soft' : 'bg-destructive-soft'
  const pillTextClass = flat
    ? 'text-muted-foreground'
    : good
      ? 'text-success-soft-foreground'
      : 'text-destructive-soft-foreground'
  const TrendIcon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight

  return (
    <Card code="STAT-001" className={cn('gap-3 p-4', highlight && 'relative overflow-hidden', className)}>
      {highlight ? (
        <View
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="absolute inset-0"
        >
          <Gradient token="soft" className="size-full" />
        </View>
      ) : null}
      <View className="flex-row items-start justify-between gap-3">
        <Text className="min-w-0 flex-1 break-words text-sm text-muted-foreground">{label}</Text>
        {icon && isValidElement(icon) ? (
          <View className="size-8 shrink-0 items-center justify-center rounded-control bg-primary-soft">
            {cloneElement(icon as ReactElement<{ className?: string }>, {
              className: cn(
                (icon.props as { className?: string }).className,
                'size-icon-sm text-primary-soft-foreground',
              ),
            })}
          </View>
        ) : null}
      </View>
      <View
        accessible
        role={a11yPresets.group.role}
        accessibilityLabel={loading ? `${label}, carregando` : statCardLabel({ label, value, change, changeLabel, good })}
      >
        {loading ? (
          <Skeleton testID={testID ? `${testID}-skeleton-valor` : undefined} className="h-8 w-24" />
        ) : (
          <StatValue value={value} />
        )}
        {loading ? (
          <Skeleton testID={testID ? `${testID}-skeleton-variacao` : undefined} className="h-3 w-16" />
        ) : change !== undefined ? (
          <View className="flex-row flex-wrap items-center gap-1">
            <View className={cn('flex-row items-center gap-1 rounded-item px-1', pillToneClass)}>
              <TrendIcon className={cn('size-3', pillTextClass)} />
              <Text weight="medium" className={cn('text-xs', pillTextClass)}>
                {`${change > 0 ? '+' : ''}${change.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}
              </Text>
            </View>
            {changeLabel ? <Text className="text-xs text-muted-foreground">{changeLabel}</Text> : null}
          </View>
        ) : null}
      </View>
      {footer ?? null}
    </Card>
  )
}
