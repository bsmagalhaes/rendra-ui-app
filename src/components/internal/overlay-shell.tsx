import type { ReactNode } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X } from 'lucide-react-native'
import { Text } from './text'
import { cn } from '../../lib/cn'
import { a11yPresets } from '../../lib/a11y'

export interface OverlayShellProps {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  children: ReactNode
  footer?: ReactNode
  hideHeader?: boolean
  fill?: boolean
  onRequestClose: () => void
  bodyClassName?: string
  testID?: string
}

export function OverlayShell({
  title,
  description,
  icon,
  children,
  footer,
  hideHeader = false,
  fill = true,
  onRequestClose,
  bodyClassName,
  testID,
}: OverlayShellProps) {
  const insets = useSafeAreaInsets()

  return (
    <View testID={testID} className={fill ? 'flex-1' : 'shrink'}>
      {!hideHeader && (
        <View className="flex-row items-start gap-3 border-b border-border px-4 py-4" style={{ paddingTop: Math.max(16, insets.top) }}>
          {icon && <View className="size-control-md items-center justify-center rounded-control bg-primary-soft">{icon}</View>}
          <View className="flex-1 flex-col gap-1 pt-1">
            <Text weight="semibold" accessibilityRole={a11yPresets.header.accessibilityRole} className="text-lg text-foreground">
              {title}
            </Text>
            {description && <Text className="text-sm text-muted-foreground">{description}</Text>}
          </View>
          <Pressable
            accessibilityRole={a11yPresets.button.accessibilityRole}
            accessibilityLabel="Fechar"
            onPress={onRequestClose}
            className="size-touch items-center justify-center rounded-item"
          >
            <X className="size-icon-md text-muted-foreground" />
          </Pressable>
        </View>
      )}
      <ScrollView
        tabIndex={0}
        testID={testID ? `${testID}-corpo` : undefined}
        className={fill ? 'flex-1' : 'grow-0 shrink'}
        contentContainerClassName={cn('p-4', bodyClassName)}
      >
        {children}
      </ScrollView>
      {footer && (
        <View className="border-t border-border bg-card px-4 pt-4" style={{ paddingBottom: Math.max(16, insets.bottom) }}>
          {footer}
        </View>
      )}
    </View>
  )
}
