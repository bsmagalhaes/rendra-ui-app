import { Children, cloneElement, isValidElement } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { View } from 'react-native'
import { Text } from '../internal/text'
import { InfoHint } from './info-hint'
import { cn } from '../../lib/cn'

export function CardContent({
  children,
  noTopPadding,
  className,
  testID,
}: {
  children: ReactNode
  noTopPadding?: boolean
  className?: string
  testID?: string
}) {
  return (
    <View testID={testID} className={cn(noTopPadding ? 'px-4 pb-4' : 'p-4', className)}>
      {children}
    </View>
  )
}

export function Card({
  children,
  className,
  nativeID,
  code,
}: {
  children: ReactNode
  className?: string
  nativeID?: string
  /** Código interno do catálogo (item D4 do levantamento da Sincronizacao 1), usado por
   *  `FormSection` (`FORM-002`) e `StatCard` (`STAT-001`); sem a prop, `CARD-001`. */
  code?: string
}) {
  const items = Children.toArray(children).filter(isValidElement) as ReactElement[]
  const mapped = items.map((child, index) => {
    const prev = items[index - 1]
    if (child.type === CardContent && prev?.type === CardHeader) {
      return cloneElement(child as ReactElement<{ noTopPadding?: boolean }>, { key: index, noTopPadding: true })
    }
    return cloneElement(child, { key: index })
  })
  return (
    <View
      nativeID={nativeID}
      dataSet={{ rendra: code ?? 'CARD-001' }}
      className={cn('flex min-w-0 flex-col rounded-surface border border-border bg-card', className)}
    >
      {mapped}
    </View>
  )
}

export function CardHeader({
  children,
  actions,
  className,
}: {
  children: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <View
      className={cn(
        actions ? 'flex-row flex-wrap items-start justify-between gap-x-4 gap-y-3 p-4' : 'flex-col gap-1 p-4',
        className,
      )}
    >
      <View className="min-w-0 flex-1 flex-col gap-1">{children}</View>
      {actions ? <View className="flex-row items-center gap-2">{actions}</View> : null}
    </View>
  )
}

export function CardTitle({ children, help, className }: { children: ReactNode; help?: ReactNode; className?: string }) {
  const title = (
    <Text weight="semibold" className={cn('text-lg text-foreground', className)}>
      {children}
    </Text>
  )
  if (!help) return title
  return (
    <View className="flex-row items-center gap-1">
      {title}
      <InfoHint title={typeof children === 'string' ? children : 'Sobre esta seção'}>{help}</InfoHint>
    </View>
  )
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <Text className={cn('text-sm text-muted-foreground', className)}>{children}</Text>
}

export function CardFooter({
  children,
  className,
  testID,
}: {
  children: ReactNode
  className?: string
  testID?: string
}) {
  return (
    <View testID={testID} className={cn('flex-row items-center gap-3 border-t border-border px-4 py-3', className)}>
      {children}
    </View>
  )
}
