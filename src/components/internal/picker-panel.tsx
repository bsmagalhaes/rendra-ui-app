import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { X } from 'lucide-react-native'
import { BottomSheet } from './bottom-sheet'
import { Text } from './text'
import { a11yPresets } from '../../lib/a11y'

export interface PickerPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: ReactNode
  title: string
  header?: ReactNode
  children: ReactNode
  footer?: ReactNode
  adornment?: ReactNode
  scrollable?: boolean
  testID?: string
}

export function PickerPanel({
  open,
  onOpenChange,
  trigger,
  title,
  header,
  children,
  footer,
  adornment,
  scrollable = true,
  testID,
}: PickerPanelProps) {
  return (
    <View className="relative">
      {trigger}
      {adornment}
      <BottomSheet
        open={open}
        onOpenChange={onOpenChange}
        accessibilityLabel={title}
        testID={testID}
        scrollable={scrollable}
        header={
          <View>
            <View className="flex-row items-center justify-between gap-2 px-4 pb-3">
              <Text weight="semibold" numberOfLines={1} className="flex-1 text-base text-popover-foreground">
                {title}
              </Text>
              <Pressable
                accessibilityRole={a11yPresets.button.accessibilityRole}
                accessibilityLabel="Fechar"
                testID={testID ? `${testID}-fechar` : 'picker-panel-fechar'}
                onPress={() => onOpenChange(false)}
                className="size-touch items-center justify-center rounded-item"
              >
                <X className="size-icon-md text-muted-foreground" />
              </Pressable>
            </View>
            {header ? <View className="border-b border-border px-4 pb-3">{header}</View> : null}
          </View>
        }
        footer={
          footer ? (
            <View className="border-t border-border px-4 pb-4 pt-3">
              {footer}
            </View>
          ) : undefined
        }
      >
        {children}
      </BottomSheet>
    </View>
  )
}
