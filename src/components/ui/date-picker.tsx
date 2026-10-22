import { useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { addDays, addMonths, format, isSameDay, setHours, setMinutes, startOfMonth, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react-native'
import { Text } from '../internal/text'
import { PickerPanel } from '../internal/picker-panel'
import { Input } from './input'
import { Button } from './button'
import { cn } from '../../lib/cn'
import { a11yPresets } from '../../lib/a11y'
import { controlAdornmentButton, controlFrameClasses, type ControlSize } from '../../lib/control'

export interface DateRange {
  from?: Date
  to?: Date
}

interface BaseDatePickerProps {
  placeholder?: string
  label?: string
  size?: ControlSize
  invalid?: boolean
  disabled?: boolean
  time?: boolean
  minDate?: Date
  maxDate?: Date
  dropdowns?: boolean
  // Botão de limpar ao lado do gatilho (forma simples e `range`); só com valor e fora de `disabled`.
  clearable?: boolean
  id?: string // recebido via cloneElement pelo Field (Tarefa 19); reservado, sem uso interno
  className?: string
  testID?: string
}
export interface SingleDatePickerProps extends BaseDatePickerProps {
  range?: false
  value?: Date | null
  onChange?: (value: Date | null) => void
}
export interface RangeDatePickerProps extends BaseDatePickerProps {
  range: true
  value?: DateRange | null
  onChange?: (value: DateRange | null) => void
}
export type DatePickerProps = SingleDatePickerProps | RangeDatePickerProps

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function formatTime(d: Date) {
  return format(d, 'HH:mm')
}

function applyTime(date: Date, time: string) {
  const [h, m] = time.split(':').map(Number)
  return setMinutes(setHours(date, h || 0), m || 0)
}

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i),
  label: capitalize(format(new Date(2026, i, 1), 'MMMM', { locale: ptBR })),
}))

export function DatePicker(props: DatePickerProps) {
  const {
    placeholder,
    label,
    size = 'md',
    invalid = false,
    disabled = false,
    time = false,
    minDate,
    maxDate,
    dropdowns = true,
    clearable = false,
    className,
    testID,
  } = props
  const range = props.range === true
  const [open, setOpen] = useState(false)
  const immediate = !range && !time
  const currentSingle = !range ? (props.value as Date | null | undefined) : undefined
  const currentRange = range ? (props.value as DateRange | null | undefined) : undefined
  const [draftSingle, setDraftSingle] = useState<Date | null>(currentSingle ?? null)
  const [draftRange, setDraftRange] = useState<DateRange>(currentRange ?? {})
  const [draftTimeFrom, setDraftTimeFrom] = useState(
    currentSingle ? formatTime(currentSingle) : currentRange?.from ? formatTime(currentRange.from) : '09:00',
  )
  const [draftTimeTo, setDraftTimeTo] = useState(currentRange?.to ? formatTime(currentRange.to) : '09:00')
  const [month, setMonth] = useState(() => currentSingle ?? currentRange?.from ?? new Date())
  const today = new Date()
  // R9 de DESIGN_RULES.md proíbe Modal dentro de Modal: o cabeçalho não abre mais um `Select`
  // (que montaria um segundo BottomSheet/RNModal) para trocar mês/ano; em vez disso troca o
  // conteúdo do MESMO painel já aberto entre a grade de dias, a grade de meses e a lista de anos.
  const [pickerMode, setPickerMode] = useState<'days' | 'months' | 'years'>('days')
  const monthLabel = MONTHS[month.getMonth()].label
  // Melhoria 7 do veredito do fechamento (Fable): a grade de anos ia de 1900 até o ano atual mais
  // 10 sempre, ignorando minDate/maxDate (um ano fora do intervalo permitido não faz sentido
  // aparecer na lista) e abrindo com o topo (1900) visível em vez do ano relevante. Corrigido
  // respeitando minDate/maxDate quando existirem; sem eles, a janela padrão passa a ser compacta
  // (10 anos antes e depois do atual, 21 anos/6 linhas de 4 colunas) em vez de ~137 anos/35
  // linhas, para o ano atual ficar bem mais perto do topo da grade (visível sem precisar rolar
  // tanto) ao abrir.
  const DEFAULT_YEARS_BEFORE = 10
  const DEFAULT_YEARS_AFTER = 10
  const minYear = minDate ? minDate.getFullYear() : today.getFullYear() - DEFAULT_YEARS_BEFORE
  const maxYear = maxDate ? maxDate.getFullYear() : today.getFullYear() + DEFAULT_YEARS_AFTER
  const years = Array.from({ length: Math.max(0, maxYear - minYear + 1) }, (_, i) => minYear + i)

  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
    const allDays = Array.from({ length: 42 }, (_, i) => addDays(start, i))
    return Array.from({ length: 6 }, (_, week) => allDays.slice(week * 7, week * 7 + 7))
  }, [month])

  function isDisabledDay(day: Date) {
    if (minDate && day < minDate) return true
    if (maxDate && day > maxDate) return true
    return false
  }

  // Bloqueador 3 do veredito do Bloco B: reabrir o painel ressincroniza os rascunhos com o
  // `value` atual, em vez de manter o que sobrou de uma sessão anterior nunca aplicada.
  function handleOpenChange(next: boolean) {
    if (next) {
      setDraftSingle(currentSingle ?? null)
      setDraftRange(currentRange ?? {})
      setDraftTimeFrom(currentSingle ? formatTime(currentSingle) : currentRange?.from ? formatTime(currentRange.from) : '09:00')
      setDraftTimeTo(currentRange?.to ? formatTime(currentRange.to) : '09:00')
      setMonth(currentSingle ?? currentRange?.from ?? new Date())
      setPickerMode('days')
    }
    setOpen(next)
  }

  function commitSingle(day: Date) {
    const withTime = time ? applyTime(day, draftTimeFrom) : day
    if (immediate) {
      ;(props.onChange as (v: Date | null) => void)?.(withTime)
      setOpen(false)
    } else {
      setDraftSingle(withTime)
    }
  }

  function applyDraft() {
    if (range) {
      const finalRange: DateRange = {
        from: draftRange.from && time ? applyTime(draftRange.from, draftTimeFrom) : draftRange.from,
        to: draftRange.to && time ? applyTime(draftRange.to, draftTimeTo) : draftRange.to,
      }
      ;(props.onChange as (v: DateRange | null) => void)?.(finalRange)
    } else {
      // Bloqueador 3 do veredito do Bloco B: reaplica a hora atual do rascunho (`draftTimeFrom`)
      // sobre a data escolhida, em vez de enviar `draftSingle` como ficou no momento do toque
      // no dia (que já carregava a hora de então, ignorando uma edição posterior do campo
      // "Horário").
      const finalSingle = time && draftSingle ? applyTime(draftSingle, draftTimeFrom) : draftSingle
      ;(props.onChange as (v: Date | null) => void)?.(finalSingle)
    }
    setOpen(false)
  }

  function clearAll() {
    if (range) (props.onChange as (v: DateRange | null) => void)?.(null)
    else (props.onChange as (v: Date | null) => void)?.(null)
    setOpen(false)
  }

  const text = (() => {
    if (range) {
      const from = currentRange?.from ? format(currentRange.from, 'dd/MM/yyyy', { locale: ptBR }) : null
      if (!from) return null
      const to = currentRange?.to ? format(currentRange.to, 'dd/MM/yyyy', { locale: ptBR }) : '...'
      return `${from} a ${to}`
    }
    if (!currentSingle) return null
    const base = format(currentSingle, 'dd/MM/yyyy', { locale: ptBR })
    return time ? `${base} ${formatTime(currentSingle)}` : base
  })()

  const showClear = clearable && Boolean(text) && !disabled

  const resolvedPlaceholder = placeholder ?? (range ? 'Selecione o período' : 'Selecione a data')

  return (
    <PickerPanel
      open={open}
      onOpenChange={handleOpenChange}
      title={label ?? resolvedPlaceholder}
      testID={testID}
      adornment={
        showClear ? (
          <Pressable
            accessibilityRole={a11yPresets.button.accessibilityRole}
            accessibilityLabel="Limpar data"
            onPress={clearAll}
            className={cn(controlAdornmentButton, 'absolute right-2 top-1/2 -translate-y-1/2')}
          >
            <X className="size-icon-sm" />
          </Pressable>
        ) : undefined
      }
      trigger={
        <Pressable
          accessibilityRole={a11yPresets.button.accessibilityRole}
          accessibilityState={{ expanded: open, disabled }}
          aria-expanded={open}
          accessibilityLabel={label ?? resolvedPlaceholder}
          disabled={disabled}
          onPress={() => !disabled && handleOpenChange(true)}
          className={cn(controlFrameClasses({ size, invalid, disabled }), showClear && 'pr-16', className)}
          dataSet={{ rendra: 'DTP-001' }}
        >
          <CalendarDays className="size-icon-sm shrink-0 text-muted-foreground" />
          <Text numberOfLines={1} className={cn('flex-1 text-base', text ? 'text-foreground' : 'text-muted-foreground')}>
            {text ?? resolvedPlaceholder}
          </Text>
        </Pressable>
      }
      footer={
        !immediate ? (
          <View className="flex-col gap-3">
            {time && !range ? (
              <Input
                mask="time"
                size="sm"
                value={draftTimeFrom}
                onChange={setDraftTimeFrom}
                placeholder="Horário"
                accessibilityLabel="Horário"
                testID="date-picker-time"
              />
            ) : null}
            {time && range ? (
              <View className="flex-row gap-3">
                <Input
                  mask="time"
                  size="sm"
                  value={draftTimeFrom}
                  onChange={setDraftTimeFrom}
                  placeholder="Hora inicial"
                  accessibilityLabel="Hora inicial"
                  testID="date-picker-time-from"
                  className="flex-1"
                />
                <Input
                  mask="time"
                  size="sm"
                  value={draftTimeTo}
                  onChange={setDraftTimeTo}
                  placeholder="Hora final"
                  accessibilityLabel="Hora final"
                  testID="date-picker-time-to"
                  className="flex-1"
                />
              </View>
            ) : null}
            <View className="flex-row gap-3">
              <Button variant="outline" onPress={clearAll} className="flex-1">
                Limpar
              </Button>
              <Button onPress={applyDraft} className="flex-1">
                Aplicar
              </Button>
            </View>
          </View>
        ) : undefined
      }
    >
      <View className="p-2">
        <View className="flex-row items-center justify-between">
          {pickerMode === 'days' ? (
            <>
              <Pressable
                accessibilityRole={a11yPresets.button.accessibilityRole}
                accessibilityLabel="Mês anterior"
                onPress={() => setMonth((m) => addMonths(m, -1))}
                className="size-control-sm items-center justify-center rounded-item"
              >
                <ChevronLeft className="text-muted-foreground" />
              </Pressable>
              {dropdowns ? (
                <View className="flex-1 flex-row justify-center gap-2">
                  <Pressable
                    accessibilityRole={a11yPresets.button.accessibilityRole}
                    accessibilityLabel={`Mês: ${monthLabel}`}
                    onPress={() => setPickerMode('months')}
                    className="min-h-touch flex-row items-center gap-1 rounded-item px-2"
                  >
                    <Text weight="semibold" className="text-sm text-foreground">{monthLabel}</Text>
                    <ChevronDown className="size-icon-sm text-muted-foreground" />
                  </Pressable>
                  <Pressable
                    accessibilityRole={a11yPresets.button.accessibilityRole}
                    accessibilityLabel={`Ano: ${month.getFullYear()}`}
                    onPress={() => setPickerMode('years')}
                    className="min-h-touch flex-row items-center gap-1 rounded-item px-2"
                  >
                    <Text weight="semibold" className="text-sm text-foreground">{month.getFullYear()}</Text>
                    <ChevronDown className="size-icon-sm text-muted-foreground" />
                  </Pressable>
                </View>
              ) : (
                <Text weight="semibold" className="text-sm text-foreground">
                  {capitalize(format(month, 'MMMM yyyy', { locale: ptBR }))}
                </Text>
              )}
              <Pressable
                accessibilityRole={a11yPresets.button.accessibilityRole}
                accessibilityLabel="Próximo mês"
                onPress={() => setMonth((m) => addMonths(m, 1))}
                className="size-control-sm items-center justify-center rounded-item"
              >
                <ChevronRight className="text-muted-foreground" />
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                accessibilityRole={a11yPresets.button.accessibilityRole}
                accessibilityLabel="Voltar"
                onPress={() => setPickerMode('days')}
                className="size-control-sm items-center justify-center rounded-item"
              >
                <ChevronLeft className="text-muted-foreground" />
              </Pressable>
              <Text weight="semibold" className="text-sm text-foreground">
                {pickerMode === 'months' ? 'Selecione o mês' : 'Selecione o ano'}
              </Text>
              <View className="size-control-sm" />
            </>
          )}
        </View>
        {/* Troca de modo (dias, meses, anos) é frequente: sem entrada, o conteúdo troca na hora. */}
        <>
        {pickerMode === 'days' ? (
          <>
            <View className="flex-row">
              {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'].map((d) => (
                <Text key={d} weight="medium" className="flex-1 py-1 text-center text-xs text-muted-foreground">
                  {d}
                </Text>
              ))}
            </View>
            {weeks.map((weekDays, week) => (
              <View key={week} className="flex-row">
                {weekDays.map((day) => {
                  const disabledDay = isDisabledDay(day)
                  const isEndpoint = range
                    ? Boolean((draftRange.from && isSameDay(day, draftRange.from)) || (draftRange.to && isSameDay(day, draftRange.to)))
                    : draftSingle
                      ? isSameDay(day, draftSingle)
                      : currentSingle
                        ? isSameDay(day, currentSingle)
                        : false
                  const isMiddle = Boolean(
                    range && draftRange.from && draftRange.to && day > draftRange.from && day < draftRange.to,
                  )
                  const isToday = isSameDay(day, today)
                  const outside = day.getMonth() !== month.getMonth()
                  return (
                    <Pressable
                      key={day.toISOString()}
                      disabled={disabledDay}
                      accessibilityRole={a11yPresets.button.accessibilityRole}
                      accessibilityLabel={format(day, "d 'de' MMMM", { locale: ptBR })}
                      accessibilityState={{ selected: isEndpoint, disabled: disabledDay }}
                      onPress={() => {
                        if (range) {
                          setDraftRange((r) => (!r.from || r.to ? { from: day } : day < r.from ? { from: day } : { from: r.from, to: day }))
                        } else {
                          commitSingle(day)
                        }
                      }}
                      className="flex-1 items-center justify-center py-1"
                    >
                      <Text
                        className={cn(
                          'size-touch rounded-item text-center text-sm text-foreground',
                          isEndpoint && 'bg-primary text-primary-foreground',
                          isMiddle && !isEndpoint && 'bg-primary-soft',
                          isToday && !isEndpoint && 'border border-primary',
                          // Achado do Playwright (Tarefa 22/24): `opacity-40` sobre
                          // `text-foreground` mistura a cor com o fundo
                          // (bg-popover), contraste real 3.37 no modo escuro, abaixo de 4,5:1;
                          // dias de fora do mês continuam clicáveis (não são "componente
                          // inativo", sem a isenção da WCAG 1.4.3 para texto desabilitado).
                          // `text-muted-foreground` é o token de texto secundário já garantido
                          // 4,5:1 por `reach(...)` (src/brand/palette.ts).
                          outside && 'text-muted-foreground',
                          disabledDay && 'opacity-30',
                        )}
                      >
                        {day.getDate()}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            ))}
          </>
        ) : pickerMode === 'months' ? (
          <View className="flex-row flex-wrap py-2">
            {MONTHS.map((m) => {
              const selected = Number(m.value) === month.getMonth()
              return (
                <Pressable
                  key={m.value}
                  accessibilityRole={a11yPresets.button.accessibilityRole}
                  accessibilityLabel={m.label}
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setMonth((cur) => new Date(cur.getFullYear(), Number(m.value), 1))
                    setPickerMode('days')
                  }}
                  className="min-h-touch w-1/3 items-center justify-center py-1"
                >
                  <Text
                    className={cn(
                      'rounded-item px-2 py-1 text-center text-sm text-foreground',
                      selected && 'bg-primary text-primary-foreground',
                    )}
                  >
                    {m.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        ) : (
          <View className="flex-row flex-wrap py-2">
            {years.map((y) => {
              const selected = y === month.getFullYear()
              return (
                <Pressable
                  key={y}
                  accessibilityRole={a11yPresets.button.accessibilityRole}
                  accessibilityLabel={String(y)}
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setMonth((cur) => new Date(y, cur.getMonth(), 1))
                    setPickerMode('days')
                  }}
                  className="min-h-touch w-1/4 items-center justify-center py-1"
                >
                  <Text
                    className={cn(
                      'rounded-item px-2 py-1 text-center text-sm text-foreground',
                      selected && 'bg-primary text-primary-foreground',
                    )}
                  >
                    {y}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        )}
        </>
      </View>
    </PickerPanel>
  )
}
