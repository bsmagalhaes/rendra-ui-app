import { Children, cloneElement, isValidElement } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { Text } from '../internal/text'
import { cn } from '../../lib/cn'
import { a11yPresets } from '../../lib/a11y'

export interface ButtonGroupOption {
  value: string
  label: ReactNode
  icon?: ReactNode
  disabled?: boolean
}

export interface ButtonGroupProps {
  children?: ReactNode
  options?: ButtonGroupOption[]
  value?: string
  onChange?: (value: string) => void
  size?: 'sm' | 'md'
  fullWidth?: boolean
  accessibilityLabel?: string
  className?: string
}

const heightClass: Record<'sm' | 'md', string> = { sm: 'h-control-sm', md: 'h-control-md' }

export function ButtonGroup({
  children,
  options,
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  accessibilityLabel,
  className,
}: ButtonGroupProps) {
  if (options) {
    return (
      <View
        accessibilityRole={a11yPresets.radiogroup.accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        dataSet={{ rendra: 'BTNG-001' }}
        className={cn('flex-row flex-wrap gap-1 rounded-control border border-border bg-muted p-1', fullWidth && 'w-full', className)}
      >
        {options.map((option) => {
          const checked = option.value === value
          return (
            <Pressable
              key={option.value}
              accessibilityRole={a11yPresets.radio.accessibilityRole}
              accessibilityState={{ checked, disabled: option.disabled }}
              // aria-checked explícito (além de accessibilityState): react-native-web não deriva
              // aria-checked de accessibilityState.checked (só lê a prop aria-checked/
              // accessibilityChecked diretamente, achado do Playwright, Tarefa 33); sem isso, o
              // papel radio em cada item, via a11yPresets.radio, fica sem o atributo ARIA que a própria especificação exige.
              aria-checked={checked}
              disabled={option.disabled}
              onPress={() => onChange?.(option.value)}
              className={cn(
                // M1/M2 (veredito do Fable, validação das correções da Tarefa 21): o gatilho do
                // crash "Couldn't find a navigation context" no nativo Android (achado do
                // emulador, Tarefa 20/21) não é "consumir variável de tema" (`bg-card`/`bg-muted`
                // compilam sem `variables`, e `rounded-item`, que consome `var(--rendra-shape-item)`
                // desde sempre em toda opção, nunca causou upgrade); é a classe `shadow-sm`
                // *declarar* a propriedade customizada `--tw-shadow-color` no CSS nativo (única
                // classe usada aqui que declara variável, `nativewind/src/tailwind/shadows.ts`).
                // Quando só a opção marcada tinha `shadow-sm` (condicional ao `checked`), a opção
                // que nascia desmarcada só passava a declarar essa variável na primeira vez em
                // que fosse marcada, fora do primeiro render. O react-native-css-interop trata
                // isso como upgrade para consumidor de variável e, em modo dev, loga um aviso
                // sobre esse upgrade serializando as props da própria árvore (`Object.entries`
                // recursivo em render-component.tsx); esse `Object.entries` aciona os getters do
                // valor padrão (não conectado) do contexto de navegação do Expo Router presente
                // na árvore, e cada um desses getters lança "Couldn't find a navigation context"
                // por design (sentinela de contexto ausente). `shadow-none` também declara
                // `--tw-shadow-color` (só que sem sombra visível), então usar `shadow-sm`/
                // `shadow-none` em toda opção desde o primeiro render (nunca a ausência de uma
                // classe de sombra) faz o upgrade acontecer sempre no mount, nunca depois, sem
                // reintroduzir a sombra tênue na opção não marcada (M1). Não reproduz em
                // Jest/RNTL nem em Playwright (achado só aparece no runtime nativo Fabric/Hermes
                // real; prova do próprio gatilho sob Jest em button-group.test.tsx, M3).
                'flex-1 flex-row min-h-touch items-center justify-center gap-2 rounded-item px-3',
                heightClass[size],
                checked ? 'bg-card shadow-sm' : 'bg-muted shadow-none',
                option.disabled && 'opacity-50',
              )}
            >
              {option.icon}
              <Text weight="medium" className={cn('text-sm', checked ? 'text-foreground' : 'text-muted-foreground')}>
                {option.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    )
  }

  const items = Children.toArray(children).filter(isValidElement) as ReactElement<{ className?: string }>[]

  return (
    <View
      accessibilityRole={a11yPresets.toolbar.accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      dataSet={{ rendra: 'BTNG-001' }}
      className={cn('flex-row', fullWidth && 'w-full', className)}
    >
      {items.map((child, index) => {
        const isFirst = index === 0
        const isLast = index === items.length - 1
        const positionClass = isFirst
          ? 'rounded-l-control rounded-r-none'
          : isLast
            ? 'rounded-r-control rounded-l-none'
            : 'rounded-none'
        return cloneElement(child, {
          key: index,
          className: cn(child.props.className, positionClass, 'shadow-none', !isFirst && 'border-l-0', fullWidth && 'flex-1'),
        })
      })}
    </View>
  )
}
