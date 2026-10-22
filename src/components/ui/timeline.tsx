import type { ComponentType } from 'react'
import { View } from 'react-native'
import { CheckCircle2, SkipForward, XCircle } from 'lucide-react-native'
import { Text } from '../internal/text'
import { dotClass, type BadgeTone } from './badge'
import type { FeedbackType } from '../../brand/types'
import { a11yPresets } from '../../lib/a11y'
import { cn } from '../../lib/cn'
import { MotionPresence } from '../internal/motion-view'
import { slideIn } from '../../lib/motion/slide'
import { stagger } from '../../lib/motion/stagger'
import { resolveCatalogCode } from '../../catalog/components'

type TimelineTone = FeedbackType | 'neutral'
type TimelineIcon = ComponentType<{ className?: string; testID?: string }>

export interface TimelineEvent {
  id: string
  title: string
  description?: string
  /** Data curta, como "22/09/2026 14:30". */
  date: string
  tone?: TimelineTone
  icon?: TimelineIcon
  status?: 'succeeded' | 'failed' | 'skipped'
}

export interface TimelineProps {
  events: TimelineEvent[]
  className?: string
}

const markerClass: Record<TimelineTone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  info: 'bg-info-soft text-info-soft-foreground',
  success: 'bg-success-soft text-success-soft-foreground',
  warning: 'bg-warning-soft text-warning-soft-foreground',
  error: 'bg-destructive-soft text-destructive-soft-foreground',
}

const statusTone: Record<NonNullable<TimelineEvent['status']>, TimelineTone> = {
  succeeded: 'success',
  failed: 'error',
  skipped: 'neutral',
}

const statusIcon: Record<NonNullable<TimelineEvent['status']>, TimelineIcon> = {
  succeeded: CheckCircle2,
  failed: XCircle,
  skipped: SkipForward,
}

const statusLabel: Record<NonNullable<TimelineEvent['status']>, string> = {
  succeeded: 'Concluído',
  failed: 'Falhou',
  skipped: 'Ignorado',
}

const statusTextClass: Record<NonNullable<TimelineEvent['status']>, string> = {
  succeeded: 'text-success-soft-foreground',
  failed: 'text-destructive-soft-foreground',
  skipped: 'text-muted-foreground',
}

/** Sempre empilhado (titulo acima da data): o app e sempre o caso estreito do web. */
export function Timeline({ events, className }: TimelineProps) {
  return (
    <View testID="timeline" {...a11yPresets.list} dataSet={{ rendra: resolveCatalogCode('Timeline') }} className={className}>
      {events.map((event, index) => {
        const tone = event.status ? statusTone[event.status] : (event.tone ?? 'neutral')
        const Icon = event.icon ?? (event.status ? statusIcon[event.status] : undefined)
        const last = index === events.length - 1
        return (
          <MotionPresence key={event.id} testID={`timeline-anim-${event.id}`} enter={(r) => slideIn('up', r, stagger(index, r), 8)}>
          <View testID={`timeline-item-${event.id}`} {...a11yPresets.listitem} className="flex-row gap-3">
            <View className="w-8 items-center">
              <View
                testID={`timeline-marcador-${event.id}`}
                className={cn('size-8 items-center justify-center rounded-full', markerClass[tone])}
              >
                {Icon ? (
                  <Icon testID={`timeline-icone-${event.id}`} className="size-icon-sm" />
                ) : (
                  <View testID={`timeline-ponto-${event.id}`} className={cn('size-2 rounded-full', dotClass[tone as BadgeTone])} />
                )}
              </View>
              {last ? null : <View testID="timeline-line" className="w-px flex-1 bg-border" />}
            </View>
            <View className={cn('min-w-0 flex-1 gap-1', last ? 'pb-0' : 'pb-6')}>
              <Text weight="medium" className="text-sm text-foreground">
                {event.title}
              </Text>
              <Text className="text-xs text-muted-foreground">{event.date}</Text>
              {event.description ? <Text className="text-sm text-muted-foreground">{event.description}</Text> : null}
              {event.status ? (
                <Text weight="medium" className={cn('text-xs', statusTextClass[event.status])}>
                  {statusLabel[event.status]}
                </Text>
              ) : null}
            </View>
          </View>
          </MotionPresence>
        )
      })}
    </View>
  )
}
