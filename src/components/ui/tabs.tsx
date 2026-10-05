import { useState } from 'react'
import type { ReactNode } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { Text } from '../internal/text'
import { Select } from './select'
import { a11yPresets } from '../../lib/a11y'
import { useControlledState } from '../../hooks/use-controlled-state'
import { cn } from '../../lib/cn'
import { resolveCatalogCode } from '../../catalog/components'

export interface TabItem {
  value: string
  label: string
  icon?: ReactNode
  count?: number
  /** Texto do número para leitor de tela: o nome acessível da aba passa a ser `${label} ${countLabel(count)}`
   *  (ex.: "Fila 1 não lida"). Sem ela, vale `${label} ${count}`. A pílula visível mostra só o número. */
  countLabel?: (count: number) => string
  disabled?: boolean
  content: ReactNode
}

export interface TabsProps {
  items: TabItem[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  variant?: 'line' | 'pill'
  /** O que fazer quando as abas não cabem na largura: `'select'` (padrão) troca a lista por um `Select`;
   *  `'scroll'` mantém as abas e rola a lista na horizontal, sem barra de rolagem. */
  overflow?: 'select' | 'scroll'
  accessibilityLabel?: string
  className?: string
  testID?: string
}

const listClass: Record<'line' | 'pill', string> = {
  line: 'flex-row gap-2 border-b border-border',
  pill: 'flex-row gap-1 rounded-control bg-muted p-1',
}

// No modo `scroll` a linha de baixo da variante `line` vai no contêiner da rolagem (senão ela acabaria onde
// a última aba acaba) e a lista cresce até o contêiner quando as abas cabem.
const scrollListClass: Record<'line' | 'pill', string> = {
  line: 'grow flex-row gap-2',
  pill: 'grow flex-row gap-1 rounded-control bg-muted p-1',
}

function tabAccessibilityLabel(item: TabItem): string | undefined {
  if (item.count === undefined) return undefined
  return `${item.label} ${item.countLabel ? item.countLabel(item.count) : item.count}`
}

// B1 (Fable, validacao da entrega): a aba real e a copia de medicao (mais abaixo) tinham que
// reproduzir exatamente a mesma largura natural, mas a copia perdia o peso da fonte, a pilula do
// count e o icon; um unico `TabLabel`, usado nas duas, torna a divergencia impossivel.
function TabLabel({ item, selected = false }: { item: TabItem; selected?: boolean }) {
  return (
    <>
      {item.icon}
      <Text
        weight="medium"
        numberOfLines={1}
        className={cn('text-sm', selected ? 'text-foreground' : 'text-muted-foreground')}
      >
        {item.label}
      </Text>
      {item.count !== undefined ? (
        <Text className="rounded-full bg-muted px-2 text-xs text-muted-foreground">{item.count}</Text>
      ) : null}
    </>
  )
}

export function Tabs({
  items,
  value,
  defaultValue,
  onChange,
  variant = 'line',
  overflow = 'select',
  accessibilityLabel,
  className,
  testID,
}: TabsProps) {
  const [active, setActive] = useControlledState<string>(
    value,
    defaultValue ?? items[0]?.value ?? '',
    onChange,
  )
  const [listWidth, setListWidth] = useState<number | null>(null)
  const [containerWidth, setContainerWidth] = useState<number | null>(null)
  const scroll = overflow === 'scroll'
  const useSelect = !scroll && listWidth != null && containerWidth != null && listWidth > containerWidth
  const activeItem = items.find((item) => item.value === active)
  const code = resolveCatalogCode('Tabs', { variant })

  const lista = (
    <View
      accessibilityRole={a11yPresets.tablist.accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      testID={testID ? `${testID}-lista` : undefined}
      className={scroll ? scrollListClass[variant] : listClass[variant]}
    >
      {items.map((item) => {
        const selected = item.value === active
        return (
          <Pressable
            key={item.value}
            accessibilityRole={a11yPresets.tab.accessibilityRole}
            accessibilityState={{ selected, disabled: item.disabled }}
            aria-selected={selected}
            accessibilityLabel={tabAccessibilityLabel(item)}
            disabled={item.disabled}
            onPress={() => setActive(item.value)}
            className={cn(
              'min-h-touch flex-row items-center justify-center gap-2 px-3',
              scroll && 'shrink-0',
              variant === 'line'
                ? cn('border-b-2 py-3', selected ? 'border-primary' : 'border-transparent')
                : // M1/M2 (veredito do Fable, validação das correções da Tarefa 21): mesma
                  // causa raiz do crash "Couldn't find a navigation context" do ButtonGroup
                  // no nativo Android (achado do emulador, Tarefa 20/21; ver
                  // button-group.tsx). O gatilho não é "consumir variável de tema"
                  // (`bg-card`/`bg-muted` compilam sem `variables`); é `shadow-sm`
                  // *declarar* `--tw-shadow-color` no CSS nativo (única classe usada aqui
                  // que declara variável). Só a aba selecionada tê-la (condicional a
                  // `selected`) fazia a aba que nasce não selecionada passar a declarar
                  // essa variável pela primeira vez fora do primeiro render, o que o
                  // react-native-css-interop trata como upgrade para consumidor de
                  // variável, disparando (em dev) um log que serializa a árvore de props e
                  // aciona os getters do valor padrão do contexto de navegação do Expo
                  // Router presente na árvore. `shadow-none` também declara
                  // `--tw-shadow-color` (sem sombra visível): usar `shadow-sm`/
                  // `shadow-none` em toda aba desde o primeiro render evita o upgrade fora
                  // do mount sem reintroduzir a sombra na aba não selecionada (M1). Não
                  // reproduz em Jest/RNTL nem em Playwright (prova do gatilho sob Jest em
                  // tabs.test.tsx, M3).
                  cn('rounded-item py-2', selected ? 'bg-card shadow-sm' : 'bg-muted shadow-none'),
            )}
          >
            <TabLabel item={item} selected={selected} />
          </Pressable>
        )
      })}
    </View>
  )

  return (
    <View className={cn('relative min-w-0 flex-col gap-6', className)} dataSet={{ rendra: code }}>
      {/* B6 (veredito do Opus): o contêiner mede a própria largura e envolve, sempre, ou a
          lista real (abas) ou o Select de fallback; nunca deixa de existir quando o modo troca. */}
      <View
        testID={testID ? `${testID}-container` : undefined}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        className="w-full"
      >
        {useSelect ? (
          <Select
            label={accessibilityLabel ?? 'Seção'}
            options={items.map((item) => ({
              value: item.value,
              label: item.count ? `${item.label} (${item.count})` : item.label,
              disabled: item.disabled,
            }))}
            value={active}
            onChange={(next) => {
              if (next) setActive(next)
            }}
          />
        ) : scroll ? (
          <View className={variant === 'line' ? 'border-b border-border' : undefined}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="min-w-full">
              {lista}
            </ScrollView>
          </View>
        ) : (
          lista
        )}
      </View>
      {/* Cópia de medição, montada sempre (menos no modo `scroll`, que nunca troca por Select),
          oculta da árvore de acessibilidade e nunca por opacity-0 (Global Constraints); sem
          Pressable nem papel, para o axe não contar `tab`s duplicados. */}
      {!scroll && (
        <View
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="absolute inset-x-0 top-0 h-0 overflow-hidden"
        >
          <View
            testID={testID ? `${testID}-medida` : undefined}
            onLayout={(e) => setListWidth(e.nativeEvent.layout.width)}
            // M3 (veredito do Fable): a lista real em variant="pill" tem `p-1` (linha 32, "bg-muted
            // p-1"); a cópia de medição precisa do mesmo `p-1`, senão mede 8px a menos que a
            // largura natural (mesmo tipo de desvio do B1 do veredito anterior, em escala menor).
            className={cn('self-start flex-row', variant === 'line' ? 'gap-2' : 'gap-1 p-1')}
          >
            {items.map((item) => (
              <View key={item.value} className="min-h-touch flex-row items-center justify-center gap-2 px-3">
                <TabLabel item={item} />
              </View>
            ))}
          </View>
        </View>
      )}
      <View role={a11yPresets.tabpanel.role} className="min-w-0">
        {typeof activeItem?.content === 'string' ? (
          <Text className="text-sm text-muted-foreground">{activeItem.content}</Text>
        ) : (
          activeItem?.content
        )}
      </View>
    </View>
  )
}
