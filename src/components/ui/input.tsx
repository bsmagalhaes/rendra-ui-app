import { useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Pressable, TextInput, View } from 'react-native'
import { createMask } from 'imask'
import { ChevronDown, Eye, EyeOff, X } from 'lucide-react-native'
import { Text } from '../internal/text'
import { Select } from './select'
import { Spinner } from './spinner'
import { Button } from './button'
import { cn } from '../../lib/cn'
import { a11yPresets } from '../../lib/a11y'
import { useControlledState } from '../../hooks/use-controlled-state'
import { usePlaceholderColor } from '../../hooks/use-placeholder-color'
import { controlFrameClasses, controlAdornmentButton, type ControlSize } from '../../lib/control'
import {
  masks,
  type MaskName,
  phoneCountries,
  DEFAULT_DDI,
  internationalPhoneMask,
  percentMask,
  toCents,
  type PhoneCountry,
} from '../../lib/masks'
import { useLookup, type LookupResult } from '../../hooks/use-lookup'

/**
 * Uma unidade do seletor embutido do Input (item D7 do levantamento da Sincronizacao 1). Os ids
 * "percent" e "currency" ligam a mascara de percentual (teto configuravel por `percentMax`) e de
 * moeda; qualquer outro id nao aplica mascara, so rotulo.
 */
export interface InputUnitOption {
  id: string
  label: string
}

/**
 * Botão de ação dentro da moldura do campo, à direita (44 px, como "Limpar campo" e "Mostrar senha").
 * O ícone vem de quem chama (use `size-icon-sm`). `badge` é um número no canto do botão (ex.: filtros
 * ativos) e some com 0 ou sem a prop; o número também precisa entrar no `accessibilityLabel`.
 */
export interface InputTrailingAction {
  icon: ReactNode
  accessibilityLabel: string
  onPress: () => void
  badge?: number
}

export interface InputProps {
  size?: ControlSize
  mask?: MaskName
  icon?: ReactNode
  suffix?: ReactNode
  clearable?: boolean
  /** Botão de ação à direita, depois de "Limpar campo" (ex.: abrir filtros numa busca). */
  trailingAction?: InputTrailingAction
  invalid?: boolean
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onValueChange?: (unmasked: string, masked: string) => void
  secureTextEntry?: boolean
  ddi?: string
  onDdiChange?: (ddi: string) => void
  ddiOptions?: PhoneCountry[]
  hideDdi?: boolean
  onCentsChange?: (cents: number | null) => void
  onLookup?: (result: LookupResult) => void
  /** Unidades: seletor embutido a direita, no mesmo padrao do seletor de DDI. Trocar de unidade
   *  sempre limpa o valor do campo. `suffix` e ignorado quando `units` esta presente. */
  units?: InputUnitOption[]
  /** Unidade escolhida (controlada). Sem ela, usa a primeira de `units`. */
  unit?: string
  onUnitChange?: (unit: string) => void
  /** Teto do percentual quando a unidade escolhida e "percent". Padrao 100. */
  percentMax?: number
  /** Variante de valor guardado: mostra `maskedHint` no lugar do valor real, que nunca chega a
   *  existir no campo. "Trocar" abre um campo vazio (`isEditing`); a tela controla o fluxo
   *  (`isEditing`, `onStartEdit`, `onCancelEdit`). */
  variant?: 'secret'
  /** Ha um valor salvo (mesmo sem mostra-lo). */
  hasValue?: boolean
  /** Texto mascarado mostrado no lugar do valor, ex.: "••••1234". Padrao "••••••••". */
  maskedHint?: string
  /** Campo aberto para digitar um valor novo. */
  isEditing?: boolean
  onStartEdit?: () => void
  onCancelEdit?: () => void
  /** Remove o valor salvo. Sem essa prop, o botao "Remover" nao aparece. */
  onRemove?: () => void
  /** Remocao em andamento: desabilita e mostra o carregamento no botao "Remover". */
  removing?: boolean
  disabled?: boolean
  placeholder?: string
  accessibilityLabel?: string
  className?: string
  id?: string // recebido via cloneElement pelo Field (Tarefa 19); reservado, sem uso interno
  testID?: string
}

export function Input({
  size = 'md',
  mask,
  icon,
  suffix,
  clearable = false,
  trailingAction,
  invalid = false,
  value: controlledValue,
  defaultValue = '',
  onChange,
  onValueChange,
  secureTextEntry: secureProp = false,
  ddi: ddiProp,
  onDdiChange,
  ddiOptions = phoneCountries,
  hideDdi = false,
  onCentsChange,
  onLookup,
  units,
  unit: unitProp,
  onUnitChange,
  percentMax,
  variant,
  hasValue = false,
  maskedHint,
  isEditing = false,
  onStartEdit,
  onCancelEdit,
  onRemove,
  removing = false,
  disabled = false,
  placeholder,
  accessibilityLabel,
  className,
  testID,
}: InputProps) {
  const isSecret = variant === 'secret'
  const placeholderColor = usePlaceholderColor()
  const isPhone = mask === 'phone'
  const [ddi, setDdi] = useControlledState<string>(ddiProp, DEFAULT_DDI, onDdiChange)
  const intl = isPhone && ddi !== '55'
  // Unidades (item D7): seletor embutido a direita. A unidade escolhida decide a mascara efetiva,
  // por cima da prop `mask` (igual ao contrato do web, input.tsx:180-183).
  const hasUnits = Boolean(units && units.length > 0)
  const [innerUnit, setInnerUnit] = useControlledState<string>(unitProp, units?.[0]?.id ?? '', onUnitChange)
  const unit = hasUnits ? innerUnit : undefined
  const unitMaskName = unit === 'percent' ? 'percent' : unit === 'currency' ? 'currency' : undefined
  const unitDef = unitMaskName === 'percent' ? percentMask(percentMax) : unitMaskName === 'currency' ? masks.currency : undefined
  const maskOptions = hasUnits
    ? unitDef?.options
    : intl
      ? internationalPhoneMask.options
      : mask
        ? masks[mask].options
        : undefined
  const masked = useMemo(() => (maskOptions ? createMask(maskOptions) : null), [maskOptions])
  const [internalValue, setInternalValue] = useState(() => {
    const initial = controlledValue ?? defaultValue
    if (masked) {
      masked.resolve(initial)
      return masked.value
    }
    return initial
  })
  const [focused, setFocused] = useState(false)
  const [secure, setSecure] = useState(secureProp || isSecret)
  const [searching, setSearching] = useState(false)
  // variant="secret" em edicao (achado B2 do veredito do Fable): o campo nunca deriva de
  // `value`/`defaultValue` do consumidor (o valor salvo nunca chega a existir no campo, mesmo
  // controlado por fora); um estado proprio, sempre vazio ao abrir a edicao, mesmo padrao do
  // contrato web (`defaultValue: ''`, input.tsx:354-364 do web).
  const [secretDraft, setSecretDraft] = useState('')
  const [lastIsEditing, setLastIsEditing] = useState(isEditing)
  if (isEditing !== lastIsEditing) {
    setLastIsEditing(isEditing)
    if (isEditing) setSecretDraft('')
  }
  const inputRef = useRef<TextInput>(null)
  const lookup = useLookup()

  // Ajuste de estado derivado durante a renderização (sem useEffect, para não disparar
  // react-hooks/set-state-in-effect): achado 6 do veredito do Bloco A, quando a máscara
  // muda (troca de DDI do telefone, nacional <-> internacional) no modo não controlado,
  // reaplica os dígitos já digitados sob a máscara nova, no mesmo ciclo de render, antes
  // do commit (padrão "adjusting state when a prop changes" do React).
  const syncKey = `${mask ?? ''}|${intl}`
  const [lastSyncKey, setLastSyncKey] = useState(syncKey)
  if (syncKey !== lastSyncKey) {
    setLastSyncKey(syncKey)
    if (masked && controlledValue === undefined) {
      masked.resolve(internalValue.replace(/\D/g, ''))
      setInternalValue(masked.value)
    }
  }

  // Achado 5 do veredito do Bloco A: no modo controlado, o texto exibido deriva só de
  // `controlledValue`, nunca do objeto `masked` mutável usado pelo digitar (`handleChangeText`
  // resolve nele a cada tecla, independente de o pai aceitar a mudança); assim, se o pai
  // rejeitar a mudança (não atualizar `value`), o campo não fica mostrando o texto digitado.
  const displayMasked = useMemo(() => {
    if (!maskOptions || controlledValue === undefined) return null
    const m = createMask(maskOptions)
    m.resolve(controlledValue)
    return m
  }, [maskOptions, controlledValue])

  const value = controlledValue !== undefined ? (displayMasked ? displayMasked.value : controlledValue) : internalValue

  function handleChangeText(text: string) {
    if (masked) {
      masked.resolve(text)
      onChange?.(masked.value)
      onValueChange?.(masked.unmaskedValue, masked.value)
      if (mask === 'currency' || unitMaskName === 'currency') onCentsChange?.(toCents(masked.value))
      setInternalValue(masked.value)
      if ((mask === 'cep' || mask === 'cnpj' || mask === 'cpfCnpj') && onLookup) {
        setSearching(true)
        lookup(mask, masked.unmaskedValue).then((result) => {
          setSearching(false)
          if (result) onLookup(result)
        })
      }
    } else {
      onChange?.(text)
      onValueChange?.(text, text)
      setInternalValue(text)
    }
  }

  function handleClear() {
    if (masked) masked.resolve('')
    setInternalValue('')
    setSecretDraft('')
    onChange?.('')
    onValueChange?.('', '')
    if (mask === 'currency') onCentsChange?.(null)
    inputRef.current?.focus()
  }

  // variant="secret" em edicao: buffer proprio, nunca deriva do valor salvo (achado B2).
  // `clearable` no secret olha o rascunho, nao o `value` do consumidor (observacao 1 do Fable):
  // o botao so aparece com algo digitado nesta edicao e limpa exatamente isso. O web condiciona
  // ao `value` do consumidor e nao esvazia o campo (defeito do web, fora do escopo daqui).
  function handleSecretChangeText(text: string) {
    setSecretDraft(text)
    onChange?.(text)
    onValueChange?.(text, text)
  }

  // Trocar de unidade sempre limpa o valor do campo (contrato do web, input.tsx:257-260):
  // o valor digitado sob uma unidade nao faz sentido reaplicado sob outra (ex.: "12,5 %"
  // virando moeda).
  function changeUnit(id: string) {
    setInnerUnit(id)
    setInternalValue('')
    onChange?.('')
    onValueChange?.('', '')
  }

  const country = ddiOptions.find((c) => c.ddi === ddi)
  const def = hasUnits ? unitDef : mask ? masks[mask] : undefined
  const selectedUnitLabel = units?.find((u) => u.id === unit)?.label ?? unit

  // Modo leitura de variant="secret" (item D7): o valor salvo nunca chega a existir no campo,
  // so um texto mascarado (nao mede AA, e sempre muted-foreground: nao ha classe de fonte
  // monoespacada no tema, R5 de DESIGN_RULES.md nao reserva nenhuma).
  if (isSecret && !isEditing) {
    return (
      <View className={cn(controlFrameClasses({ size, invalid, disabled }), className)} dataSet={{ rendra: 'CAMP-001' }}>
        <Text className="min-w-0 flex-1 text-sm text-muted-foreground" numberOfLines={1}>
          {hasValue ? (maskedHint ?? '••••••••') : 'Nenhum valor salvo'}
        </Text>
        <Button variant="ghost" size="sm" onPress={onStartEdit} disabled={disabled}>
          Trocar
        </Button>
        {hasValue && onRemove ? (
          <Button variant="ghost" size="sm" onPress={onRemove} disabled={disabled || removing} loading={removing}>
            Remover
          </Button>
        ) : null}
      </View>
    )
  }

  return (
    <View className={cn(controlFrameClasses({ size, invalid, focused, disabled }), className)} dataSet={{ rendra: 'CAMP-001' }}>
      {icon ? <View className="flex shrink-0 text-muted-foreground">{icon}</View> : null}
      {isPhone && !hideDdi ? (
        <Select
          options={ddiOptions.map((c) => ({ value: c.ddi, label: `+${c.ddi} ${c.name}` }))}
          value={ddi}
          onChange={(v) => v && setDdi(v)}
          label="Código do país (DDI)"
          testID={testID ? `${testID}-ddi` : undefined}
          trigger={({ onPress }) => (
            <Pressable
              accessibilityRole={a11yPresets.button.accessibilityRole}
              accessibilityLabel={`Código do país (DDI): ${country?.name ?? ''} +${ddi}`}
              onPress={onPress}
              className="min-h-touch min-w-touch flex-row items-center gap-1 pr-1"
            >
              <Text className="text-base text-foreground">{`+${ddi}`}</Text>
              <ChevronDown className="size-icon-sm text-muted-foreground" />
            </Pressable>
          )}
        />
      ) : null}
      <TextInput
        key={hasUnits ? `unit-${unit}` : undefined}
        ref={inputRef}
        testID={testID}
        value={isSecret ? secretDraft : value}
        onChangeText={isSecret ? handleSecretChangeText : handleChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        editable={!disabled}
        secureTextEntry={secure}
        inputMode={def?.inputMode}
        placeholder={placeholder ?? def?.placeholder}
        placeholderTextColor={placeholderColor}
        accessibilityLabel={accessibilityLabel}
        className="h-full min-w-0 flex-1 bg-transparent text-base text-foreground"
      />
      {searching ? <Spinner size="sm" label="Buscando..." className="text-muted-foreground" /> : null}
      {hasUnits ? (
        <Select
          options={units!.map((u) => ({ value: u.id, label: u.label }))}
          value={unit}
          onChange={(v) => v && changeUnit(v)}
          label="Unidade"
          trigger={({ onPress }) => (
            <Pressable
              accessibilityRole={a11yPresets.button.accessibilityRole}
              accessibilityLabel={`Unidade: ${selectedUnitLabel}`}
              onPress={onPress}
              className="min-h-touch min-w-touch flex-row items-center gap-1 border-l border-input pl-2"
            >
              <Text className="text-sm font-medium text-foreground">{selectedUnitLabel}</Text>
              <ChevronDown className="size-icon-sm text-muted-foreground" />
            </Pressable>
          )}
        />
      ) : null}
      {!hasUnits && suffix ? <Text className="shrink-0 text-sm text-muted-foreground">{suffix}</Text> : null}
      {clearable && (isSecret ? secretDraft : value) && !disabled ? (
        <Pressable
          accessibilityRole={a11yPresets.button.accessibilityRole}
          accessibilityLabel="Limpar campo"
          onPress={handleClear}
          className={controlAdornmentButton}
        >
          <X className="size-icon-sm" />
        </Pressable>
      ) : null}
      {trailingAction ? (
        <Pressable
          accessibilityRole={a11yPresets.button.accessibilityRole}
          accessibilityLabel={trailingAction.accessibilityLabel}
          disabled={disabled}
          onPress={trailingAction.onPress}
          className={cn(controlAdornmentButton, 'relative')}
        >
          {trailingAction.icon}
          {trailingAction.badge && trailingAction.badge > 0 ? (
            <View className="absolute right-0 top-0 h-icon-sm min-w-icon-sm items-center justify-center rounded-full bg-primary px-1">
              <Text weight="medium" className="text-xs text-primary-foreground">
                {trailingAction.badge}
              </Text>
            </View>
          ) : null}
        </Pressable>
      ) : null}
      {secureProp || isSecret ? (
        <Pressable
          accessibilityRole={a11yPresets.button.accessibilityRole}
          accessibilityLabel={secure ? 'Mostrar senha' : 'Ocultar senha'}
          accessibilityState={{ selected: !secure }}
          onPress={() => setSecure((s) => !s)}
          className={controlAdornmentButton}
        >
          {secure ? <Eye className="size-icon-sm" /> : <EyeOff className="size-icon-sm" />}
        </Pressable>
      ) : null}
      {isSecret ? (
        <Button variant="ghost" size="sm" onPress={onCancelEdit} disabled={disabled}>
          Cancelar
        </Button>
      ) : null}
    </View>
  )
}
