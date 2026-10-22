import type { ReactNode } from 'react'
import { View } from 'react-native'
import { Gradient } from '../gradient/gradient'
import { BrandFeedbackIcon } from './brand-feedback-icon'
import { Text } from '../internal/text'
import { a11yPresets } from '../../lib/a11y'
import { cn } from '../../lib/cn'
import { MotionPresence } from '../internal/motion-view'
import { slideIn } from '../../lib/motion/slide'
import { stagger } from '../../lib/motion/stagger'
import type { FeedbackType } from '../../brand/types'

export interface EmptyStateProps {
  title: string
  description?: ReactNode
  type?: FeedbackType
  actions?: ReactNode
  size?: 'default' | 'compact'
  className?: string
  testID?: string
}

export function EmptyState({
  title,
  description,
  type = 'info',
  actions,
  size = 'default',
  className,
  testID,
}: EmptyStateProps) {
  const compact = size === 'compact'
  return (
    <View
      testID={testID}
      dataSet={{ rendra: 'VAZ-001' }}
      className={cn('items-center justify-center gap-4', compact ? 'px-4 py-8' : 'px-4 py-12', className)}
    >
      <MotionPresence testID={testID ? `${testID}-anim-icone` : undefined} enter={(r) => slideIn('up', r, stagger(0, r), 8)}>
      <View className="relative items-center justify-center">
        <View
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="absolute size-16 rounded-full overflow-hidden"
        >
          <Gradient token="soft" className="size-full" />
        </View>
        <BrandFeedbackIcon
          type={type}
          size={compact ? 'xl' : '2xl'}
          testID={testID ? `${testID}-icone` : undefined}
          className="relative"
        />
      </View>
      </MotionPresence>
      <MotionPresence fillWidth testID={testID ? `${testID}-anim-titulo` : undefined} enter={(r) => slideIn('up', r, stagger(1, r), 8)}>
      <Text
        weight="semibold"
        accessibilityRole={a11yPresets.header.accessibilityRole}
        className="max-w-full break-words text-center text-base text-foreground"
      >
        {title}
      </Text>
      </MotionPresence>
      {description ? (
        <MotionPresence fillWidth testID={testID ? `${testID}-anim-descricao` : undefined} enter={(r) => slideIn('up', r, stagger(2, r), 8)}>
          <Text className="max-w-full break-words text-center text-sm text-muted-foreground">{description}</Text>
        </MotionPresence>
      ) : null}
      {actions ? (
        <MotionPresence testID={testID ? `${testID}-anim-acoes` : undefined} enter={(r) => slideIn('up', r, stagger(3, r), 8)}>
          <View className="flex-row flex-wrap justify-center gap-3">{actions}</View>
        </MotionPresence>
      ) : null}
    </View>
  )
}
