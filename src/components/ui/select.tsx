import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { FlatList, Pressable, TextInput, View } from 'react-native'
import { Check, ChevronDown, Plus, Search, X } from 'lucide-react-native'
import { Text } from '../internal/text'
import { PickerPanel } from '../internal/picker-panel'
import { PressScale } from '../internal/motion-view'
import { Button } from './button'
import { Spinner } from './spinner'
import { cn } from '../../lib/cn'
import { a11yPresets } from '../../lib/a11y'
import { useControlledState } from '../../hooks/use-controlled-state'
import { usePlaceholderColor } from '../../hooks/use-placeholder-color'
import { controlFrameClasses, controlAdornmentButton, type ControlSize } from '../../lib/control'

export interface SelectOption {
  value: string
  label: string
  description?: string
  icon?: ReactNode
  disabled?: boolean
  group?: string
}

interface BaseSelectProps {
  options?: SelectOption[]
  placeholder?: string
  label?: string
  size?: ControlSize
  invalid?: boolean
  disabled?: boolean
  searchable?: boolean
  creatable?: boolean
  onCreate?: (label: string) => SelectOption | Promise<SelectOption>
  loadOptions?: (query: string) => Promise<SelectOption[]>
  loading?: boolean
  clearable?: boolean
  emptyText?: string
  trigger?: (state: { onPress: () => void; open: boolean; disabled: boolean }) => ReactNode
  id?: string
  className?: string
  testID?: string
}

/** Acima deste número de opções, o "Selecionar todos" aparece sem a prop `selectAll`. */
const SELECT_ALL_AUTO_MIN = 5

export interface SingleSelectProps extends BaseSelectProps {
  multiple?: false
  value?: string | null
  onChange?: (value: string | null) => void
}

export interface MultipleSelectProps extends BaseSelectProps {
  multiple: true
  value?: string[]
  onChange?: (value: string[]) => void
  /**
   * Linha "Selecionar todos" no topo da lista (vira "Desmarcar todos" com tudo marcado).
   * Padrão: aparece sozinha com mais de 5 opções; `false` desliga, `true` força com 5 ou menos.
   */
  selectAll?: boolean
  showCount?: boolean
  maxChips?: number
}

export type SelectProps = SingleSelectProps | MultipleSelectProps

const DEBOUNCE_MS = 250

export function Select(props: SelectProps) {
  const {
    options: staticOptions = [],
    placeholder = 'Selecione',
    label,
    size = 'md',
    invalid = false,
    disabled = false,
    searchable = false,
    creatable = false,
    onCreate,
    loadOptions,
    loading = false,
    clearable = false,
    emptyText = 'Nenhuma opção encontrada.',
    trigger: customTrigger,
    className,
    testID,
  } = props
  const placeholderColor = usePlaceholderColor()
  // Achado do Playwright (Tarefa 22/24): axe (aria-required-attr) exige aria-controls em todo
  // role="combobox", apontando para o id
  // da lista que ele controla.
  const listboxId = useId()
  const multiple = props.multiple === true
  const [value, setValue] = useControlledState<string | string[] | null>(
    props.value as string | string[] | null | undefined,
    multiple ? [] : null,
    props.onChange as ((next: string | string[] | null) => void) | undefined,
  )
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [remoteOptions, setRemoteOptions] = useState<SelectOption[]>([])
  const [createdOptions, setCreatedOptions] = useState<SelectOption[]>([])
  const [searching, setSearching] = useState(false)
  const [draft, setDraft] = useState<string[]>(multiple ? ((value as string[]) ?? []) : [])
  const requestIdRef = useRef(0)
  const isSearchable = searchable || creatable || Boolean(loadOptions)
  const maxChips = multiple ? (props.maxChips ?? 2) : 2

  useEffect(() => {
    if (!loadOptions || !open) return
    const requestId = ++requestIdRef.current
    const timer = setTimeout(() => {
      setSearching(true)
      loadOptions(query)
        .then((results) => {
          if (requestIdRef.current === requestId) {
            setRemoteOptions(results)
            setSearching(false)
          }
        })
        .catch(() => {
          // Achado 1 do veredito do Bloco A: sem o `.catch`, uma rejeição deixava
          // "Carregando opções..." para sempre (searching nunca voltava a false).
          if (requestIdRef.current === requestId) {
            setRemoteOptions([])
            setSearching(false)
          }
        })
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query, loadOptions, open])

  const allOptions = useMemo(
    () => (loadOptions ? [...remoteOptions, ...createdOptions] : [...staticOptions, ...createdOptions]),
    [loadOptions, remoteOptions, createdOptions, staticOptions],
  )
  const filtered = useMemo(() => {
    if (loadOptions || !query) return allOptions
    const q = query.toLowerCase()
    return allOptions.filter((o) => o.label.toLowerCase().includes(q))
  }, [allOptions, query, loadOptions])

  const exactMatch = filtered.some((o) => o.label.toLowerCase() === query.toLowerCase())
  const showCreate = creatable && query.length > 0 && !exactMatch

  const rows = useMemo(() => {
    const result: ({ kind: 'header'; group: string } | { kind: 'option'; option: SelectOption })[] = []
    let lastGroup: string | undefined
    for (const option of filtered) {
      if (option.group && option.group !== lastGroup) {
        result.push({ kind: 'header', group: option.group })
      }
      lastGroup = option.group
      result.push({ kind: 'option', option })
    }
    return result
  }, [filtered])

  function handleOpenChange(next: boolean) {
    if (next && multiple) setDraft((value as string[]) ?? [])
    setOpen(next)
  }

  function selectedOptions(): SelectOption[] {
    const current = multiple ? ((value as string[]) ?? []) : value ? [value as string] : []
    return allOptions.filter((o) => current.includes(o.value))
  }

  function commitSingle(next: string | null) {
    setValue(next)
    setOpen(false)
  }

  function toggleDraft(optionValue: string) {
    setDraft((d) => (d.includes(optionValue) ? d.filter((v) => v !== optionValue) : [...d, optionValue]))
  }

  function applyMultiple() {
    setValue(draft)
    setOpen(false)
  }

  function clearMultiple() {
    setValue([])
    setOpen(false)
  }

  async function handleCreate() {
    if (!onCreate) return
    const created = await onCreate(query)
    setCreatedOptions((c) => [...c, created])
    if (multiple) toggleDraft(created.value)
    else commitSingle(created.value)
  }

  const enabledValues = allOptions.filter((o) => !o.disabled).map((o) => o.value)
  const allSelected = enabledValues.length > 0 && enabledValues.every((v) => draft.includes(v))
  const showSelectAll = multiple && ((props as MultipleSelectProps).selectAll ?? allOptions.length > SELECT_ALL_AUTO_MIN)

  function toggleSelectAll() {
    setDraft(allSelected ? [] : enabledValues)
  }

  const chosen = selectedOptions()
  const triggerLabel = multiple ? (props.showCount ? `${chosen.length} selecionado(s)` : null) : (chosen[0]?.label ?? null)
  const hasClearableValue = multiple ? chosen.length > 0 : Boolean(value)

  return (
    <PickerPanel
      open={open}
      onOpenChange={handleOpenChange}
      title={label ?? placeholder}
      testID={testID}
      scrollable={false}
      adornment={
        clearable && !disabled && hasClearableValue ? (
          <Pressable
            accessibilityRole={a11yPresets.button.accessibilityRole}
            accessibilityLabel="Limpar seleção"
            onPress={() => (multiple ? setValue([]) : setValue(null))}
            className={cn(controlAdornmentButton, 'absolute right-8 top-1/2 -translate-y-1/2')}
          >
            <X className="size-icon-sm" />
          </Pressable>
        ) : undefined
      }
      trigger={
        customTrigger ? (
          customTrigger({ onPress: () => !disabled && handleOpenChange(true), open, disabled })
        ) : (
        <Pressable
          accessibilityRole={a11yPresets.combobox.accessibilityRole}
          accessibilityState={{ expanded: open, disabled }}
          aria-expanded={open}
          aria-controls={listboxId}
          accessibilityLabel={triggerLabel ? `${label ?? placeholder}, ${triggerLabel}` : (label ?? placeholder)}
          disabled={disabled}
          onPress={() => !disabled && handleOpenChange(true)}
          className={cn(controlFrameClasses({ size, invalid, disabled }), 'flex-row items-center justify-between', className)}
          dataSet={{ rendra: 'SEL-001' }}
        >
          {multiple && !props.showCount && chosen.length > 0 ? (
            <View className="flex-1 flex-row flex-wrap items-center gap-1">
              {chosen.slice(0, maxChips).map((o) => (
                <Text key={o.value} weight="medium" numberOfLines={1} className="max-w-full shrink rounded-item bg-primary-soft px-2 py-1 text-xs text-primary-soft-foreground">
                  {o.label}
                </Text>
              ))}
              {chosen.length > maxChips ? (
                <Text weight="medium" className="shrink-0 rounded-item bg-muted px-2 py-1 text-xs text-foreground">{`+${chosen.length - maxChips}`}</Text>
              ) : null}
            </View>
          ) : (
            <Text numberOfLines={1} className={cn('flex-1 text-base', triggerLabel ? 'text-foreground' : 'text-muted-foreground')}>
              {triggerLabel ?? placeholder}
            </Text>
          )}
          {/* Levantamento de prevenção (Tarefa 21, Parte 2, mesmo padrão do crash de navegação no
              nativo do ButtonGroup/Tabs, ver button-group.tsx:59-79): `rotate-180` declara
              `--tw-rotate` no CSS nativo (confirmado nesta correção, mesma família de variável do
              `shadow-*`); `open && 'rotate-180'` fazia essa classe existir só depois de aberto,
              fora do primeiro render. `rotate-0`/`rotate-180` (nunca a ausência de nenhuma) evita
              o upgrade de variável fora do mount, sem efeito visual novo (fechado já era 0deg). */}
          <ChevronDown
            testID={testID ? `${testID}-chevron` : 'select-chevron'}
            className={cn('size-icon-sm shrink-0 text-muted-foreground', open ? 'rotate-180' : 'rotate-0')}
          />
        </Pressable>
        )
      }
      header={
        isSearchable ? (
          <View className={cn(controlFrameClasses({ size: 'md' }), 'bg-background')}>
            <Search className="size-icon-sm text-muted-foreground" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={creatable ? 'Buscar ou criar...' : 'Buscar...'}
              placeholderTextColor={placeholderColor}
              className="h-full min-w-0 flex-1 bg-transparent text-base text-foreground"
            />
          </View>
        ) : undefined
      }
      footer={
        multiple ? (
          <View className="flex-row gap-3">
            {/* Achado 4 do veredito do Bloco A: sem accessibilityLabel próprio, o nome
                acessível vem do texto "Limpar", evitando duplicar "Limpar seleção" com o
                adorno de limpar externo (acima). */}
            <Button variant="outline" disabled={draft.length === 0} onPress={clearMultiple} className="flex-1">
              Limpar
            </Button>
            <Button onPress={applyMultiple} className="flex-1">{`Aplicar (${draft.length})`}</Button>
          </View>
        ) : undefined
      }
    >
      {/* Achado do Playwright (Tarefa 22/24): `nativeID` posto direto no `FlatList` não chega ao
          `<div>` real no export web (o
          `FlatList`/`VirtualizedList` não repassa props desconhecidas ao `ScrollView` interno,
          mesma categoria de perda de props já vista no `Animated.View`); um `View` comum,
          envolvendo o `FlatList`, repassa corretamente o `id` que o `aria-controls` do gatilho
          aponta. `role="listbox"` foi tentado e revertido: exigiria que TODOS os filhos diretos
          do DOM tivessem `role="option"`/`group`, mas o `FlatList`/`ScrollView` insere `<div>`s
          de virtualização sem role entre o container e os itens (achado "Element has children
          which are not allowed", axe `aria-required-owned`), sem controle nosso sobre esses
          `<div>`s internos da biblioteca. */}
      {/* Achado 3 do veredito do fechamento (bloqueador): este `View` tinha `className="flex-1"`.
          Dentro da folha não rolável (`scrollable={false}`, o `Select` usa), a cadeia de
          ancestrais (`KeyboardAvoidingView`/`View` `shrink` em `bottom-sheet.tsx`) nunca tem
          altura própria definida, só clampada por `maxHeight` no `Animated.View` do topo; um
          filho `flex-1` (`flexBasis: 0%`, cresce para preencher espaço disponível) dentro de uma
          cadeia cujo próprio tamanho depende do conteúdo (nenhum ancestral com `flexGrow`/altura
          fixa) não tem espaço para crescer e colapsa para 0 (comprovado no emulador Android: a
          folha "Categoria" abria sem nenhum item nem "Nenhuma opção encontrada." entre a busca e
          o rodapé). Sem o `flex-1`, o `View` volta a se dimensionar pelo conteúdo do `FlatList`
          (que já se comporta como um `ScrollView` de altura de conteúdo, recortado pelo
          `maxHeight` do ancestral, quando nada acima define altura própria). */}
      {/* Bloqueador do veredito do fechamento (Fable): sem `flex-1` (achado 3 acima), este `View`
          passou a se dimensionar pelo conteúdo, mas no react-native-web isso deixa
          `flexShrink: 0` (padrão do `View`), então quando o conteúdo é maior que o `maxHeight`
          herdado da folha, a lista extrapola em vez de rolar por dentro. `min-h-0 shrink` deixa
          o `View` encolher até o espaço disponível (min-height:auto trava o encolhimento sem o
          `min-h-0`), devolvendo ao `FlatList`/`ScrollView` interno uma altura limitada de onde
          rolar. */}
      <View nativeID={listboxId} className="min-h-0 shrink">
      <FlatList
        tabIndex={0}
        data={rows}
        keyExtractor={(row) => (row.kind === 'header' ? `group-${row.group}` : row.option.value)}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="p-1"
        ListHeaderComponent={
          showSelectAll && !query ? (
            <Pressable onPress={toggleSelectAll} className="min-h-touch flex-row items-center gap-3 rounded-item px-3">
              <Text weight="medium" className="text-sm text-foreground">{allSelected ? 'Desmarcar todos' : 'Selecionar todos'}</Text>
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          searching || loading ? (
            <View className="flex-row items-center justify-center gap-2 px-3 py-6">
              <Spinner size="sm" className="text-muted-foreground" />
              <Text className="text-sm text-muted-foreground">Carregando opções...</Text>
            </View>
          ) : (
            <Text className="px-3 py-6 text-center text-sm text-muted-foreground">{emptyText}</Text>
          )
        }
        renderItem={({ item: row }) => {
          if (row.kind === 'header') {
            return (
              <Text weight="semibold" className="px-3 pb-1 pt-3 text-xs text-muted-foreground">
                {row.group}
              </Text>
            )
          }
          const item = row.option
          const isSelected = multiple ? draft.includes(item.value) : value === item.value
          return (
            <PressScale
              disabled={item.disabled}
              accessibilityState={{ selected: isSelected, disabled: item.disabled }}
              // `aria-selected={isSelected}` foi tentado e revertido: exige `role="option"`, que
              // por sua vez exige um ancestral `role="listbox"` cujos filhos diretos do DOM
              // sejam só `option`/`group`; o `FlatList`/`ScrollView` insere `<div>`s de
              // virtualização sem role entre o container e os itens (axe "Element has children
              // which are not allowed", `aria-required-owned`), sem controle nosso sobre esses
              // `<div>`s internos da biblioteca. `accessibilityState.selected` anuncia a seleção
              // só no NATIVO (TalkBack/VoiceOver, via a ponte de acessibilidade do React Native);
              // no export web, sem `aria-selected`, o item selecionado não é anunciado por leitor
              // de tela nenhum (dívida conhecida, melhoria 5 do veredito do fechamento). A
              // seleção continua visível na TELA por outros meios (ícone de check, texto/rótulo
              // do item), só não é anunciada por voz no web.
              onPress={() => (multiple ? toggleDraft(item.value) : commitSingle(item.value))}
              className={cn('min-h-touch flex-row items-center gap-3 rounded-item px-3', item.disabled && 'opacity-50')}
              outerClassName={cn('min-h-touch justify-center rounded-item', item.disabled && 'opacity-50')}
              innerClassName="flex-row items-center gap-3 px-3"
            >
              {multiple ? (
                <View className={cn('size-icon-sm items-center justify-center rounded-item border', isSelected ? 'border-primary bg-primary' : 'border-input bg-card')}>
                  {isSelected ? <Check className="text-primary-foreground" /> : null}
                </View>
              ) : null}
              {item.icon}
              <View className="min-w-0 flex-1">
                <Text weight={isSelected && !multiple ? 'medium' : 'normal'} numberOfLines={1} className="text-sm text-foreground">
                  {item.label}
                </Text>
                {item.description ? (
                  <Text numberOfLines={1} className="text-xs text-muted-foreground">{item.description}</Text>
                ) : null}
              </View>
              {!multiple && isSelected ? <Check className="text-primary-text" /> : null}
            </PressScale>
          )
        }}
        ListFooterComponent={
          showCreate ? (
            <Pressable onPress={handleCreate} className="min-h-touch flex-row items-center gap-3 rounded-item px-3">
              <Plus className="text-primary-text" />
              <Text className="text-sm text-primary-text">{`Criar "${query}"`}</Text>
            </Pressable>
          ) : null
        }
      />
      </View>
    </PickerPanel>
  )
}
