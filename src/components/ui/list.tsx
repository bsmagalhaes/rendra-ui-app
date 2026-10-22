import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AccessibilityInfo, FlatList, Platform, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, type SharedValue } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, GripVertical } from 'lucide-react-native'
import { Text } from '../internal/text'
import { Separator } from './separator'
import { Badge, type BadgeTone } from './badge'
import { Button } from './button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu'
import { useRendraNavigation } from '../../navigation/rendra-navigation'
import { a11yPresets } from '../../lib/a11y'
import { cn } from '../../lib/cn'
import { resolveCatalogCode } from '../../catalog/components'
import { useReducedMotion } from '../../lib/reduced-motion'
import { PressScale } from '../internal/motion-view'
import { useMotion } from '../../lib/motion/context'
import { layoutTransition } from '../../lib/motion/layout'
import { springConfigs } from '../../lib/motion/tokens'
import { announcePosition, autoScrollDelta, clampScrollOffset, dragTarget, moveItem, reorderRowOffset, rowSpan } from '../../lib/list-reorder'

/** Selo textual de status da linha, com contraste AA (nunca so cor). Item D8 do levantamento. */
export type ListItemTone = 'success' | 'warning' | 'error' | 'neutral'

export interface ListItem {
  id: string
  title: ReactNode
  description?: ReactNode
  leading?: ReactNode
  trailing?: ReactNode
  href?: string
  onPress?: () => void
  tone?: ListItemTone
}

const toneLabel: Record<ListItemTone, string> = {
  success: 'Sucesso',
  warning: 'Atenção',
  error: 'Erro',
  neutral: 'Neutro',
}

const toneBadge: Record<ListItemTone, BadgeTone> = {
  success: 'success',
  warning: 'warning',
  error: 'error',
  neutral: 'neutral',
}

export interface ListProps {
  items: ListItem[]
  divided?: boolean
  empty?: ReactNode
  /** Aditivo ao contrato §12.28 (decisão do plano do lote 4): evita o aviso de VirtualizedList
   *  aninhada quando o List está dentro de outra rolagem (ex.: vitrine). Padrão `true`. */
  scrollEnabled?: boolean
  testID?: string
  className?: string
  /**
   * Torna a lista reordenável (`LIST-002`): cada linha ganha uma alça de arraste e um botão
   * "Mover" (menu "Mover para cima" e "Mover para baixo"), e as ações de acessibilidade
   * `moveUp`/`moveDown` na alça. A lista é controlada por quem usa: `onReorder` recebe a lista
   * inteira na nova ordem, uma única vez por movimento (ao soltar o arraste, ao escolher no
   * menu ou ao acionar pelo leitor de tela), e quem usa guarda a ordem. Sem `onReorder`, a lista
   * é só de leitura e nada disso aparece.
   *
   * `onReorder` recebe só as linhas passadas em `items`: com busca ou filtro ativo, a tela deve
   * mapear o resultado de volta para a lista completa ou desligar a reordenação
   * (`onReorder={undefined}`, como faz a tela de tarefas da demo), senão as linhas ocultas se perdem.
   *
   * O arraste exige o `GestureHandlerRootView` na raiz do app (como o `Slider` e o `ImageViewer`;
   * ver o README, seção "Pacote npm"). A rolagem
   * automática na borda só acontece quando a própria `List` rola (`scrollEnabled` verdadeiro);
   * com `scrollEnabled={false}` dentro de uma `ScrollView` da página não há rolagem automática,
   * e o menu Mover cobre o deslocamento longo. A rolagem automática é coberta por teste de
   * unidade, sem prova em aparelho.
   */
  onReorder?: (items: ListItem[]) => void
  /** Nome da linha nos rótulos "Reordenar X" e "Mover X". Padrão: o `title` se for `string`, senão o `id`. */
  itemLabel?: (item: ListItem) => string
}

// Ativacao do arraste (px verticais), escala e opacidade da linha sob o dedo, duracao da previa.
const ACTIVATE_OFFSET = 2
const ACTIVE_SCALE = 1.02
const ACTIVE_OPACITY = 0.9
const PREVIEW_MS = 150
// Rolagem automatica na borda (so com a `List` rolavel): zona de ativacao e passo maximo por tick.
const AUTO_SCROLL_ZONE = 64
const AUTO_SCROLL_STEP = 10
const AUTO_SCROLL_TICK_MS = 16

// Acoes do leitor de tela na alca (TalkBack e VoiceOver); no web o equivalente e o teclado.
const REORDER_ACTIONS = [
  { name: 'moveUp', label: 'Mover para cima' },
  { name: 'moveDown', label: 'Mover para baixo' },
]

function defaultItemLabel(item: ListItem): string {
  return typeof item.title === 'string' ? item.title : item.id
}

// Função de módulo (não criada dentro do render): mesma referência em toda renderização, como
// o contrato pede para ItemSeparatorComponent (C3 do veredito do Opus).
function ListSeparator() {
  return <Separator />
}

/**
 * Estado compartilhado do arraste. Mora em valores compartilhados e em refs, nao em `useState`:
 * o `FlatList` nao precisa de `extraData` para a previa, porque cada linha le estes valores no
 * proprio `useAnimatedStyle` (correcao 5 do parecer). O unico estado React do arraste e o
 * `dragging` da `List`, que so liga e desliga a rolagem propria.
 */
interface SortableApi {
  testID: string
  active: SharedValue<number>
  target: SharedValue<number>
  dragY: SharedValue<number>
  shift: SharedValue<number>
  durationMs: SharedValue<number>
  /** Espelhos, em valores compartilhados, do que o `onUpdate` (worklet) precisa ler sem voltar à JS. */
  fingerY: SharedValue<number>
  startScroll: SharedValue<number>
  scrollOffset: SharedValue<number>
  gapSv: SharedValue<number>
  sizesSv: SharedValue<(number | undefined)[]>
  measureRow: (id: string, height: number) => void
  begin: (id: string) => void
  end: (translationY: number) => void
  cancel: () => void
  moveBy: (id: string, delta: -1 | 1, refocus?: boolean) => void
  registerHandle: (id: string, node: unknown) => void
}

interface RowReorder {
  label: string
  index: number
  total: number
  sortable: SortableApi
}

// Medida do separador (o `ItemSeparatorComponent` fica dentro da celula, fora da linha). So existe
// com `onReorder`; sem ele o separador e o de sempre.
const GapContext = createContext<((height: number) => void) | null>(null)

function SortableSeparator() {
  const reportGap = useContext(GapContext)
  return (
    <View onLayout={(event: LayoutChangeEvent) => reportGap?.(event.nativeEvent.layout.height)}>
      <Separator />
    </View>
  )
}

/**
 * Alca de arraste e botao Mover. Ficam fora da `Pressable` da linha, irmaos do `trailing`
 * interativo (M4: sem controle aninhado em controle), antes do corpo, como no web.
 */
function ReorderControls({ item, reorder }: { item: ListItem; reorder: RowReorder }) {
  const { sortable } = reorder
  // Ativa com poucos pixels de arraste vertical para vencer a rolagem da pagina (correcao 3 do
  // parecer); o menu Mover e a alca nao disputam o toque com a linha. O gesto e worklet: o `onUpdate`
  // so escreve valores compartilhados (nenhum `setState`, nenhuma volta a JS por quadro); a JS e
  // chamada so no comeco e no fim do arraste (`scheduleOnRN`).
  const { begin, end, cancel, active, target, dragY, fingerY, startScroll, scrollOffset, gapSv, sizesSv } = sortable
  const index = reorder.index
  const gesture = Gesture.Pan()
    .withTestId(`${sortable.testID}-handle-${item.id}`)
    .activeOffsetY([-ACTIVATE_OFFSET, ACTIVATE_OFFSET])
    .onStart(() => {
      'worklet'
      scheduleOnRN(begin, item.id)
    })
    .onUpdate((e) => {
      'worklet'
      // `begin` ainda nao chegou a JS (ou o arraste foi cancelado): nada a mover.
      if (active.get() !== index) return
      fingerY.set(e.translationY)
      const dy = e.translationY + scrollOffset.get() - startScroll.get()
      dragY.set(dy)
      target.set(dragTarget(index, dy, sizesSv.get(), gapSv.get()))
    })
    .onEnd((e, success) => {
      'worklet'
      // A translação final vai como argumento: a JS não depende de ler o valor que o worklet gravou.
      if (success) scheduleOnRN(end, e.translationY)
      else scheduleOnRN(cancel)
    })
    .onFinalize(() => {
      'worklet'
      scheduleOnRN(cancel)
    })
  return (
    <View className="shrink-0 flex-row items-center">
      <GestureDetector gesture={gesture}>
        <View
          accessible
          accessibilityRole={a11yPresets.button.accessibilityRole}
          accessibilityLabel={`Reordenar ${reorder.label}`}
          ref={(node) => sortable.registerHandle(item.id, node)}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
            event.preventDefault()
            sortable.moveBy(item.id, event.key === 'ArrowUp' ? -1 : 1, true)
          }}
          accessibilityActions={REORDER_ACTIONS}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === 'moveUp') sortable.moveBy(item.id, -1)
            else if (event.nativeEvent.actionName === 'moveDown') sortable.moveBy(item.id, 1)
          }}
          className="size-touch items-center justify-center"
        >
          <GripVertical className="size-icon-sm text-muted-foreground" />
        </View>
      </GestureDetector>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            accessibilityLabel={`Mover ${reorder.label}`}
            icon={<ArrowUpDown className="size-icon-sm text-foreground" />}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent accessibilityLabel={`Mover ${reorder.label}`}>
          <DropdownMenuItem
            icon={<ArrowUp className="size-icon-sm text-muted-foreground" />}
            disabled={reorder.index === 0}
            onSelect={() => sortable.moveBy(item.id, -1)}
          >
            Mover para cima
          </DropdownMenuItem>
          <DropdownMenuItem
            icon={<ArrowDown className="size-icon-sm text-muted-foreground" />}
            disabled={reorder.index >= reorder.total - 1}
            onSelect={() => sortable.moveBy(item.id, 1)}
          >
            Mover para baixo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </View>
  )
}

/**
 * Linha reordenavel: o `Animated.View` esta sempre montado enquanto houver `onReorder` (se o no
 * mudasse de tipo ao comecar o arraste, a linha e o `GestureDetector` da alca remontariam e o
 * gesto cairia no meio: correcao 1 do parecer). Sem `className` (F5.1): posicao, escala e
 * opacidade so por `useAnimatedStyle`. A conta do deslocamento e a funcao pura `reorderRowOffset`.
 */
function SortableRow({ item, reorder }: { item: ListItem; reorder: RowReorder }) {
  const { sortable, index } = reorder
  const motionOn = useMotion() === 'on'
  // Valor de modulo (nao chama funcao da JS dentro do worklet): mola `settle`, sem quique e interrompivel.
  const moveConfig = springConfigs.settle
  const style = useAnimatedStyle(() => {
    const active = sortable.active.get()
    const isActive = active === index
    const offset = reorderRowOffset(index, active, sortable.target.get(), sortable.dragY.get(), sortable.shift.get())
    return {
      transform: [
        {
          translateY:
            isActive || active < 0
              ? offset
              : motionOn
                ? withSpring(offset, moveConfig)
                : withTiming(offset, { duration: sortable.durationMs.get() }),
        },
        { scale: isActive ? ACTIVE_SCALE : 1 },
      ],
      opacity: isActive ? ACTIVE_OPACITY : 1,
      zIndex: isActive ? 10 : 0,
    }
  })
  return (
    <Animated.View
      testID={`${sortable.testID}-row-${item.id}`}
      style={style}
      onLayout={(event: LayoutChangeEvent) => sortable.measureRow(item.id, event.nativeEvent.layout.height)}
    >
      <ListRow item={item} reorder={reorder} />
    </Animated.View>
  )
}

function ListRow({ item, reorder }: { item: ListItem; reorder?: RowReorder }) {
  const { navigate, linkComponent: LinkComponent } = useRendraNavigation()
  const interactive = Boolean(item.href) || Boolean(item.onPress)
  // B1 (veredito do Fable, validacao da entrega): `py-3` só entra aqui (no View externo, a
  // linha inteira) quando a linha NÃO é interativa; a linha interativa leva `py-3` só na
  // Pressable (abaixo), nunca nos dois nós ao mesmo tempo (isso somava 68px, 12+44+12, contra
  // os 44px do contrato quando o item tinha só título, sem descrição para forçar a altura).
  const rowClassName = cn('min-h-touch flex-row items-center gap-3', interactive ? 'rounded-item px-2' : 'py-3')
  // `self-stretch` acompanha a altura da Pressable (que agora é quem define os 44px mínimos),
  // em vez de encolher para o tamanho do próprio conteúdo do trailing.
  const trailing = item.trailing ? <View className="shrink-0 flex-row items-center self-stretch">{item.trailing}</View> : null
  // M1 (veredito do Fable): o contrato põe `trailing` antes do `ChevronRight`; o chevron é só
  // decorativo (`aria-hidden` via lucide) e não precisa estar dentro da Pressable, então sai de
  // `mainContent` e vira irmão de `trailing`, sempre depois dele, nos dois ramos interativos.
  const chevron = interactive ? (
    <ChevronRight testID={`list-chevron-${item.id}`} className="size-icon-sm shrink-0 text-muted-foreground self-center" />
  ) : null

  const controls = reorder ? <ReorderControls item={item} reorder={reorder} /> : null

  // Correção 11 do parecer: numa linha reordenável com `leading` ou `trailing` (alça, Mover,
  // marcador, selo e menu somam perto de 220px), o título perderia a largura. Nela o título e a
  // descrição ocupam uma linha própria, de largura inteira (o título pode ir a duas linhas, em vez
  // de cortar), e os controles ficam na linha de baixo. Sem `leading` nem `trailing`, ou sem `onReorder`, a linha é a de sempre.
  const stacked = Boolean(reorder) && Boolean(item.leading || item.trailing)

  const textBlock = (
    <View className={cn('min-w-0 flex-col gap-1', stacked ? 'self-stretch' : 'flex-1')}>
      <Text weight="medium" numberOfLines={stacked || item.leading || item.trailing ? 2 : 1} className="text-sm text-foreground">
        {item.title}
      </Text>
      {item.description ? (
        <Text numberOfLines={2} className="text-sm text-muted-foreground">
          {item.description}
        </Text>
      ) : null}
    </View>
  )
  const toneBadgeNode = item.tone ? (
    <Badge tone={toneBadge[item.tone]} className="shrink-0">
      {toneLabel[item.tone]}
    </Badge>
  ) : null

  if (stacked) {
    const lowerRow = (
      <View className="flex-row items-center gap-3">
        {controls}
        {item.leading ? <View className="shrink-0">{item.leading}</View> : null}
        <View className="min-w-0 flex-1" />
        {toneBadgeNode}
        {item.trailing ? <View className="shrink-0 flex-row items-center">{item.trailing}</View> : null}
        {chevron}
      </View>
    )
    const stackedClassName = cn('flex-col', interactive ? 'rounded-item px-2 pb-2' : 'gap-1 py-3')
    if (item.href) {
      const hrefClassName = 'min-h-touch flex-row items-center pt-3'
      return (
        <View className={stackedClassName}>
          {LinkComponent ? (
            <LinkComponent href={item.href} asChild>
              <PressScale accessibilityRole={a11yPresets.link.accessibilityRole} className={hrefClassName} outerClassName="min-h-touch justify-center pt-3" innerClassName="flex-row items-center" motionTestID={`list-press-${item.id}`}>
                {textBlock}
              </PressScale>
            </LinkComponent>
          ) : (
            <PressScale
              accessibilityRole={a11yPresets.link.accessibilityRole}
              onPress={() => navigate(item.href!)}
              className={hrefClassName} outerClassName="min-h-touch justify-center pt-3" innerClassName="flex-row items-center" motionTestID={`list-press-${item.id}`}
            >
              {textBlock}
            </PressScale>
          )}
          {lowerRow}
        </View>
      )
    }
    if (item.onPress) {
      return (
        <View className={stackedClassName}>
          <PressScale
            accessibilityRole={a11yPresets.button.accessibilityRole}
            onPress={item.onPress}
            className="min-h-touch flex-row items-center pt-3" outerClassName="min-h-touch justify-center pt-3" innerClassName="flex-row items-center" motionTestID={`list-press-${item.id}`}
          >
            {textBlock}
          </PressScale>
          {lowerRow}
        </View>
      )
    }
    return (
      <View className={stackedClassName}>
        {textBlock}
        {lowerRow}
      </View>
    )
  }

  const mainContent = (
    <>
      {item.leading ? <View className="shrink-0">{item.leading}</View> : null}
      {textBlock}
      {toneBadgeNode}
      {/* M4 (Fable, validacao da entrega): quando a linha e interativa, o trailing (Button e
          composicao autorizada) so entra aqui dentro da Pressable se NAO for interativo; um
          trailing interativo fica fora, irmao da Pressable, para nao dar controle aninhado em
          controle (axe nested-interactive no web). */}
      {!interactive ? trailing : null}
    </>
  )

  if (item.href) {
    return (
      <View className={rowClassName}>
        {controls}
        {LinkComponent ? (
          <LinkComponent href={item.href} asChild>
            <PressScale accessibilityRole={a11yPresets.link.accessibilityRole} className="min-h-touch flex-1 flex-row items-center gap-3 py-3" outerClassName="min-h-touch flex-1 justify-center" innerClassName="flex-row items-center gap-3 py-3" motionTestID={`list-press-${item.id}`}>
              {mainContent}
            </PressScale>
          </LinkComponent>
        ) : (
          <PressScale
            accessibilityRole={a11yPresets.link.accessibilityRole}
            onPress={() => navigate(item.href!)}
            className="min-h-touch flex-1 flex-row items-center gap-3 py-3" outerClassName="min-h-touch flex-1 justify-center" innerClassName="flex-row items-center gap-3 py-3" motionTestID={`list-press-${item.id}`}
          >
            {mainContent}
          </PressScale>
        )}
        {trailing}
        {chevron}
      </View>
    )
  }

  if (item.onPress) {
    return (
      <View className={rowClassName}>
        {controls}
        <PressScale
          accessibilityRole={a11yPresets.button.accessibilityRole}
          onPress={item.onPress}
          className="min-h-touch flex-1 flex-row items-center gap-3 py-3" outerClassName="min-h-touch flex-1 justify-center" innerClassName="flex-row items-center gap-3 py-3" motionTestID={`list-press-${item.id}`}
        >
          {mainContent}
        </PressScale>
        {trailing}
        {chevron}
      </View>
    )
  }

  return (
    <View className={rowClassName}>
      {controls}
      {mainContent}
    </View>
  )
}

export function List({ items, divided = true, empty, scrollEnabled = true, testID, className, onReorder, itemLabel = defaultItemLabel }: ListProps) {
  const baseTestID = testID ?? 'list'
  const reorderable = Boolean(onReorder)
  const reducedMotion = useReducedMotion()
  // `on`: `Animated.FlatList` com `itemLayoutAnimation` (reordenar ao soltar ou pelo menu anima a
  // célula; nunca a cada passo do arraste). `off`: o `FlatList` de sempre.
  const motionOn = useMotion() === 'on'
  const ListComponent = (motionOn ? Animated.FlatList : FlatList) as typeof FlatList

  const active = useSharedValue(-1)
  const target = useSharedValue(-1)
  const dragY = useSharedValue(0)
  const shift = useSharedValue(0)
  const durationMs = useSharedValue(PREVIEW_MS)
  const fingerY = useSharedValue(0)
  const startScroll = useSharedValue(0)
  const scrollOffset = useSharedValue(0)
  const gapSv = useSharedValue(0)
  const sizesSv = useSharedValue<(number | undefined)[]>([])
  useEffect(() => {
    durationMs.set(reducedMotion ? 0 : PREVIEW_MS)
  }, [reducedMotion, durationMs])

  const [dragging, setDragging] = useState(false)
  const itemsRef = useRef(items)
  const onReorderRef = useRef(onReorder)
  const itemLabelRef = useRef(itemLabel)
  const heights = useRef(new Map<string, number>())
  const gap = useRef(0)
  const scrollEnabledRef = useRef(scrollEnabled)
  // Os callbacks do gesto leem sempre o valor mais recente destas refs (atualizadas a cada render).
  useEffect(() => {
    itemsRef.current = items
    onReorderRef.current = onReorder
    itemLabelRef.current = itemLabel
    scrollEnabledRef.current = scrollEnabled
  })
  const [liveText, setLiveText] = useState('')
  const handleNodes = useRef(new Map<string, unknown>())
  const pendingFocus = useRef<string | null>(null)
  const listRef = useRef<FlatList<ListItem>>(null)
  const scroll = useRef({ offset: 0, content: 0, viewport: 0 })
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const drag = useRef<{ from: number; sizes: (number | undefined)[]; startScroll: number } | null>(null)

  const reset = useCallback(() => {
    active.set(-1)
    target.set(-1)
    dragY.set(0)
    shift.set(0)
  }, [active, target, dragY, shift])

  const sortable = useMemo<SortableApi>(() => {
    // Deslocamento da linha no espaco do conteudo: o do dedo mais o quanto a lista rolou sozinha.
    const displacement = (translationY: number, current: NonNullable<typeof drag.current>) => translationY + scroll.current.offset - current.startScroll
    const recompute = () => {
      const current = drag.current
      if (!current) return
      const dy = displacement(fingerY.get(), current)
      dragY.set(dy)
      target.set(dragTarget(current.from, dy, current.sizes, gap.current))
    }
    // Um movimento: avisa quem usa e anuncia a nova posicao (arraste, menu e acao do leitor de tela).
    const commit = (list: ListItem[], from: number, to: number) => {
      onReorderRef.current?.(moveItem(list, from, to))
      const text = announcePosition(itemLabelRef.current(list[from]), to, list.length)
      AccessibilityInfo.announceForAccessibility(text)
      // `announceForAccessibility` e vazio no react-native-web: no web a fala vem da regiao viva.
      if (Platform.OS === 'web') setLiveText(text)
    }
    const stopAutoScroll = () => {
      if (timer.current) clearInterval(timer.current)
      timer.current = null
    }
    // Rolagem com o dedo parado: `onUpdate` so dispara quando o dedo se mexe, entao um laco por tempo
    // continua rolando enquanto o dedo estiver na borda (correcao 9 do parecer). Desligado ao soltar.
    const tick = () => {
      const current = drag.current
      if (!current || !scrollEnabledRef.current) return
      const span = rowSpan(current.from, current.sizes, gap.current)
      if (!span) return
      const { offset, content, viewport } = scroll.current
      const finger = span.top + span.size / 2 + fingerY.get() - current.startScroll
      const delta = autoScrollDelta(finger, viewport, AUTO_SCROLL_ZONE, AUTO_SCROLL_STEP)
      if (delta === 0) return
      const next = clampScrollOffset(offset + delta, content, viewport)
      if (next === offset) return
      scroll.current.offset = next
      scrollOffset.set(next)
      listRef.current?.scrollToOffset({ offset: next, animated: false })
      recompute()
    }
    return {
      testID: baseTestID,
      active,
      target,
      dragY,
      shift,
      durationMs,
      fingerY,
      startScroll,
      scrollOffset,
      gapSv,
      sizesSv,
      measureRow: (id, height) => {
        heights.current.set(id, height)
      },
      begin: (id) => {
        const list = itemsRef.current
        const from = list.findIndex((entry) => entry.id === id)
        if (from < 0) return
        const sizes = list.map((entry) => heights.current.get(entry.id))
        const known = sizes.filter((h): h is number => typeof h === 'number' && h > 0)
        const average = known.length > 0 ? known.reduce((sum, h) => sum + h, 0) / known.length : 0
        const own = sizes[from]
        drag.current = { from, sizes, startScroll: scroll.current.offset }
        sizesSv.set(sizes)
        gapSv.set(gap.current)
        startScroll.set(scroll.current.offset)
        scrollOffset.set(scroll.current.offset)
        fingerY.set(0)
        shift.set((typeof own === 'number' && own > 0 ? own : average) + gap.current)
        active.set(from)
        target.set(from)
        dragY.set(0)
        setDragging(true)
        stopAutoScroll()
        if (scrollEnabledRef.current) timer.current = setInterval(tick, AUTO_SCROLL_TICK_MS)
      },
      end: (translationY) => {
        const current = drag.current
        if (!current) return
        const to = dragTarget(current.from, displacement(translationY, current), current.sizes, gap.current)
        drag.current = null
        stopAutoScroll()
        setDragging(false)
        if (to !== current.from) commit(itemsRef.current, current.from, to)
        reset()
      },
      cancel: () => {
        if (!drag.current) return
        drag.current = null
        stopAutoScroll()
        setDragging(false)
        reset()
      },
      moveBy: (id, delta, refocus = false) => {
        const list = itemsRef.current
        const from = list.findIndex((entry) => entry.id === id)
        const to = from + delta
        if (from < 0 || to < 0 || to >= list.length) return
        if (refocus) pendingFocus.current = id
        commit(list, from, to)
      },
      registerHandle: (id, node) => {
        if (node) handleNodes.current.set(id, node)
        else handleNodes.current.delete(id)
      },
    }
  }, [baseTestID, active, target, dragY, shift, durationMs, fingerY, startScroll, scrollOffset, gapSv, sizesSv, reset])

  // So no desmonte (e nao a cada troca de `sortable`): o laco de rolagem vive durante o arraste.
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current)
    },
    [],
  )

  // Mover um no no DOM tira o foco dele: o mesmo item continua com o foco depois da troca (so
  // quando o movimento veio do teclado; correcao 7 do parecer).
  useEffect(() => {
    const id = pendingFocus.current
    if (!id) return
    pendingFocus.current = null
    const node = handleNodes.current.get(id) as { focus?: () => void } | undefined
    node?.focus?.()
  }, [items])

  const reportGap = useCallback((height: number) => {
    gap.current = height
  }, [])

  if (items.length === 0) return <>{empty ?? null}</>

  const list = (
    <ListComponent
      ref={reorderable ? listRef : undefined}
      {...(motionOn ? { itemLayoutAnimation: layoutTransition() } : {})}
      onLayout={reorderable ? (event: LayoutChangeEvent) => { scroll.current.viewport = event.nativeEvent.layout.height } : undefined}
      onContentSizeChange={reorderable ? (_width: number, height: number) => { scroll.current.content = height } : undefined}
      onScroll={reorderable ? (event: NativeSyntheticEvent<NativeScrollEvent>) => { scroll.current.offset = event.nativeEvent.contentOffset.y; scrollOffset.set(scroll.current.offset) } : undefined}
      scrollEventThrottle={reorderable ? 16 : undefined}
      testID={testID}
      dataSet={{ rendra: resolveCatalogCode('List', { sortable: reorderable }) }}
      scrollEnabled={scrollEnabled && !dragging}
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) =>
        reorderable ? (
          <SortableRow item={item} reorder={{ label: itemLabel(item), index, total: items.length, sortable }} />
        ) : (
          <ListRow item={item} />
        )
      }
      ItemSeparatorComponent={divided ? (reorderable ? SortableSeparator : ListSeparator) : undefined}
      contentContainerClassName={className}
      ListFooterComponent={
        reorderable && Platform.OS === 'web' ? (
          <Text testID={`${baseTestID}-live`} accessibilityLiveRegion="polite" className="absolute h-px w-px overflow-hidden">
            {liveText}
          </Text>
        ) : undefined
      }
    />
  )
  return reorderable ? <GapContext.Provider value={reportGap}>{list}</GapContext.Provider> : list
}
