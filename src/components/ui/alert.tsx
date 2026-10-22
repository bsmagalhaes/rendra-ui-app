import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { X } from 'lucide-react-native'
import { useBrand } from '../../brand/use-brand'
import type { FeedbackType } from '../../brand/types'
import { BrandFeedbackIcon } from './brand-feedback-icon'
import { Text } from '../internal/text'
import { a11yPresets } from '../../lib/a11y'
import { cn } from '../../lib/cn'
import { MotionPresence } from '../internal/motion-view'
import { fadeOut } from '../../lib/motion/fade'
import { slideIn } from '../../lib/motion/slide'

export interface AlertProps {
  type: FeedbackType
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  onDismiss?: () => void
  animated?: boolean
  className?: string
  testID?: string
}

const toneRootClass: Record<FeedbackType, string> = {
  success: 'border-success/25 bg-success-soft',
  error: 'border-destructive/25 bg-destructive-soft',
  warning: 'border-warning/25 bg-warning-soft',
  info: 'border-info/25 bg-info-soft',
}

const toneTextClass: Record<FeedbackType, string> = {
  success: 'text-success-soft-foreground',
  error: 'text-destructive-soft-foreground',
  warning: 'text-warning-soft-foreground',
  info: 'text-info-soft-foreground',
}

export function Alert({
  type,
  title,
  description,
  action,
  onDismiss,
  animated = false,
  className,
  testID,
}: AlertProps) {
  const { shape } = useBrand()
  const isPill = shape === 'pill'
  const isAssertive = type === 'error' || type === 'warning'

  return (
    <MotionPresence testID={testID ? `${testID}-anim` : undefined} enter={(reduced) => slideIn('down', reduced, 0, 8)} exit={fadeOut}>
    <View
      testID={testID}
      dataSet={{ rendra: 'ALRT-001' }}
      accessibilityRole={isAssertive ? a11yPresets.alert.accessibilityRole : undefined}
      role={isAssertive ? undefined : a11yPresets.status.role}
      accessibilityLiveRegion={type === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'flex-row items-start gap-3 rounded-control border',
        toneRootClass[type],
        isPill ? 'items-center py-3 pr-4 pl-4' : 'p-4',
        className,
      )}
    >
      <BrandFeedbackIcon type={type} size="lg" animated={animated} />
      <View className="flex-1 flex-col gap-1">
        <Text weight="semibold" className={cn('text-sm', toneTextClass[type])}>
          {title}
        </Text>
        {description ? (
          <Text className={cn('text-sm opacity-90', toneTextClass[type])}>{description}</Text>
        ) : null}
      </View>
      {action ? <View className="shrink-0 self-center">{action}</View> : null}
      {onDismiss ? (
        <Pressable
          accessibilityRole={a11yPresets.button.accessibilityRole}
          accessibilityLabel="Fechar aviso"
          onPress={onDismiss}
          className={cn(
            'size-touch shrink-0 items-center justify-center rounded-full',
            isPill ? '-my-2' : '-mt-2 -mr-2',
          )}
        >
          <X className={cn('size-icon-sm', toneTextClass[type])} />
        </Pressable>
      ) : null}
    </View>
    </MotionPresence>
  )
}
