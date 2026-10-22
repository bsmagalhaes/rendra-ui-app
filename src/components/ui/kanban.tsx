import { useState } from 'react'
import type { ReactNode } from 'react'
import { FlatList, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { ArrowDown, ArrowRightLeft, ArrowUp, CalendarDays, EllipsisVertical, Mail, Phone, Plus, User } from 'lucide-react-native'
import { format } from 'date-fns'
import { Text } from '../internal/text'
import { PressScale } from '../internal/motion-view'
import { useMotion } from '../../lib/motion/context'
import { layoutTransition } from '../../lib/motion/layout'
import { Avatar } from './avatar'
import { Badge, dotClass, type BadgeProps, type BadgeTone } from './badge'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { Tabs, type TabItem } from './tabs'
import { formatCurrency } from '../../lib/masks'
import { moveKanbanCard } from '../../lib/kanban-move'
import { a11yPresets } from '../../lib/a11y'
import { cn } from '../../lib/cn'
import { resolveCatalogCode } from '../../catalog/components'

export { moveKanbanCard }

export interface KanbanColumn {
  id: string
  title: string
  /** Cor do marcador da coluna. */
  tone?: BadgeProps['tone']
  /** Limite de cards (WIP). Passando dele, o contador fica em alerta. */
  limit?: number
}

export interface KanbanCard {
  id: string
  columnId: string
  /** Empresa ou pessoa. */
  title: string
  /** Linha abaixo do titulo: CNPJ da empresa ou CPF da pessoa. */
  subtitle?: string
  description?: string
  /** Pessoa de contato: nome, telefone e e-mail. */
  contact?: { name?: string; phone?: string; email?: string }
  tags?: { label: string; tone?: BadgeProps['tone'] }[]
  /** Nome do responsavel (vira avatar com iniciais). */
  assignee?: string
  dueDate?: Date
  /** Valor ou informacao curta a direita do rodape (ex.: "R$ 12.500,00"). */
  meta?: string
  /** Valores numericos do card, pelas chaves de valueFields. */
  values?: Record<string, number>
}

/** Valor somado no cabecalho da coluna e mostrado no card. */
export interface KanbanValueField {
  key: string
  label: string
}

/**
 * Destino alem de outra coluna (ex.: "Marcar como ganho", "Arquivar"). Aparece no menu "Mover
 * para" do card; no app nao ha barra de arraste, o menu e o caminho por toque.
 */
export interface KanbanDropTarget {
  id: string
  label: string
  /** Texto curto de apoio, mostrado abaixo do rotulo. */
  hint?: string
  icon?: ReactNode
  tone?: BadgeProps['tone']
  disabled?: boolean
  /** Motivo mostrado quando desabilitado; o destino recusa a escolha. */
  disabledReason?: string
}

export interface KanbanProps {
  columns: KanbanColumn[]
  cards: KanbanCard[]
  /** Card movido: coluna de destino e posicao dentro dela (0 = topo). Habilita o menu do card. */
  onCardMove?: (cardId: string, toColumnId: string, toIndex: number) => void
  /** Destinos alem das colunas; com eles a raiz vira `KANB-002`. */
  dropTargets?: KanbanDropTarget[]
  /** Destino escolhido no menu "Mover para". */
  onDropTarget?: (cardId: string, targetId: string) => void
  onCardClick?: (card: KanbanCard) => void
  /** Botao (+) no titulo de cada etapa. */
  onAddCard?: (columnId: string) => void
  /** Cards mostrados por vez em cada etapa; ao chegar ao fim da lista, mostra mais. Padrao: 20. */
  pageSize?: number
  /** Busca mais cards no servidor quando a etapa chega ao fim do que ja foi carregado. */
  onLoadMore?: (columnId: string) => void
  /** A etapa ainda tem cards no servidor (usado com onLoadMore). */
  hasMore?: (columnId: string) => boolean
  /** Conteudo proprio do card, no lugar do padrao. */
  renderCard?: (card: KanbanCard) => ReactNode
  /** Valores do card (ate 2, lado a lado) e o total de cada um na coluna. */
  valueFields?: KanbanValueField[]
  /** Formato dos valores. Padrao: moeda (R$ 1.250,00). */
  formatValue?: (n: number) => string
  /** Evita o aviso de VirtualizedList aninhada quando o quadro esta dentro de outra rolagem. Padrao `true`. */
  scrollEnabled?: boolean
  'aria-label'?: string
  className?: string
}

const DEFAULT_PAGE_SIZE = 20

function CardBody({
  card,
  valueFields,
  formatValue,
}: {
  card: KanbanCard
  valueFields: KanbanValueField[]
  formatValue: (n: number) => string
}) {
  const contato = card.contact
  return (
    <View className="gap-2">
      {card.tags && card.tags.length > 0 ? (
        <View className="flex-row flex-wrap gap-1">
          {card.tags.map((tag) => (
            <Badge key={tag.label} tone={tag.tone ?? 'neutral'}>
              {tag.label}
            </Badge>
          ))}
        </View>
      ) : null}
      <Text weight="medium" numberOfLines={2} className="text-sm text-foreground">
        {card.title}
      </Text>
      {card.subtitle ? <Text className="text-xs text-muted-foreground">{card.subtitle}</Text> : null}
      {card.description ? (
        <Text numberOfLines={2} className="text-xs text-muted-foreground">
          {card.description}
        </Text>
      ) : null}
      {contato ? (
        <View className="gap-1">
          {contato.name ? (
            <View className="flex-row items-center gap-1">
              <User className="size-icon-sm text-muted-foreground" />
              <Text className="text-xs text-muted-foreground">{contato.name}</Text>
            </View>
          ) : null}
          {contato.phone ? (
            <View className="flex-row items-center gap-1">
              <Phone className="size-icon-sm text-muted-foreground" />
              <Text className="text-xs text-muted-foreground">{contato.phone}</Text>
            </View>
          ) : null}
          {contato.email ? (
            <View className="flex-row items-center gap-1">
              <Mail className="size-icon-sm text-muted-foreground" />
              <Text className="text-xs text-muted-foreground">{contato.email}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      {valueFields.length > 0 && card.values ? (
        <View className="flex-row gap-2">
          {valueFields.slice(0, 2).map((campo) => (
            <View key={campo.key} className="flex-1 rounded-item bg-muted p-2">
              <Text className="text-xs text-muted-foreground">{campo.label}</Text>
              <Text weight="medium" className="text-sm text-foreground">
                {formatValue(card.values?.[campo.key] ?? 0)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {card.dueDate || card.meta || card.assignee ? (
        <View className="flex-row items-center justify-between gap-2">
          <View className="min-w-0 flex-1 flex-row items-center gap-1">
            {card.dueDate ? (
              <>
                <CalendarDays className="size-icon-sm text-muted-foreground" />
                <Text className="text-xs text-muted-foreground">{format(card.dueDate, 'dd/MM/yyyy')}</Text>
              </>
            ) : null}
            {card.meta ? <Text className="text-xs text-muted-foreground">{card.meta}</Text> : null}
          </View>
          {card.assignee ? <Avatar name={card.assignee} size="sm" /> : null}
        </View>
      ) : null}
    </View>
  )
}

function CardMenu({
  card,
  column,
  columns,
  index,
  total,
  props,
}: {
  card: KanbanCard
  column: KanbanColumn
  columns: KanbanColumn[]
  index: number
  total: number
  props: KanbanProps
}) {
  const { onCardMove, dropTargets = [], onDropTarget } = props
  const outras = columns.filter((c) => c.id !== column.id)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          accessibilityLabel={`Ações do card ${card.title}`}
          icon={<EllipsisVertical className="size-icon-sm text-foreground" />}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent accessibilityLabel={`Ações do card ${card.title}`}>
        <DropdownMenuLabel>Mover para</DropdownMenuLabel>
        {onCardMove
          ? outras.map((destino) => (
              <DropdownMenuItem
                key={destino.id}
                icon={<ArrowRightLeft className="size-icon-sm text-muted-foreground" />}
                onSelect={() => onCardMove(card.id, destino.id, Number.MAX_SAFE_INTEGER)}
              >
                {destino.title}
              </DropdownMenuItem>
            ))
          : null}
        {dropTargets.length > 0 && onCardMove ? <DropdownMenuSeparator /> : null}
        {dropTargets.map((alvo) => (
          <DropdownMenuItem
            key={alvo.id}
            icon={alvo.icon}
            disabled={alvo.disabled}
            onSelect={() => onDropTarget?.(card.id, alvo.id)}
          >
            {[alvo.label, alvo.hint, alvo.disabled ? alvo.disabledReason : undefined].filter(Boolean).join('\n')}
          </DropdownMenuItem>
        ))}
        {onCardMove ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              icon={<ArrowUp className="size-icon-sm text-muted-foreground" />}
              disabled={index === 0}
              onSelect={() => onCardMove(card.id, column.id, index - 1)}
            >
              Mover para cima
            </DropdownMenuItem>
            <DropdownMenuItem
              icon={<ArrowDown className="size-icon-sm text-muted-foreground" />}
              disabled={index >= total - 1}
              onSelect={() => onCardMove(card.id, column.id, index + 1)}
            >
              Mover para baixo
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ColumnView({
  column,
  columns,
  cards,
  shown,
  props,
  onEndReached,
}: {
  column: KanbanColumn
  columns: KanbanColumn[]
  cards: KanbanCard[]
  shown: number
  props: KanbanProps
  onEndReached: () => void
}) {
  const { valueFields = [], formatValue = formatCurrency, onAddCard, onCardClick, renderCard, scrollEnabled = true } = props
  const overLimit = column.limit !== undefined && cards.length > column.limit
  const visible = cards.slice(0, shown)
  const hasMore = shown < cards.length || Boolean(props.hasMore?.(column.id))
  const tone: BadgeTone = column.tone ?? 'neutral'
  // `on`: `Animated.FlatList` com `itemLayoutAnimation` (quem se move é a célula da lista, não o filho);
  // `off`: o `FlatList` de sempre.
  const motionOn = useMotion() === 'on'
  const ListComponent = (motionOn ? Animated.FlatList : FlatList) as typeof FlatList

  return (
    <View className="gap-3 rounded-surface bg-muted p-2">
      <View className="gap-2">
        <View className="flex-row items-center justify-between gap-2">
          <View className="min-w-0 flex-1 flex-row items-center gap-2">
            <View className={cn('size-2 rounded-full', dotClass[tone])} />
            <Text weight="semibold" numberOfLines={1} className="text-sm text-foreground">
              {column.title}
            </Text>
            <Badge testID={`kanban-count-${column.id}`} tone={overLimit ? 'warning' : 'neutral'}>
              {column.limit !== undefined ? `${cards.length}/${column.limit}` : String(cards.length)}
            </Badge>
          </View>
          {onAddCard ? (
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              accessibilityLabel={`Adicionar card em ${column.title}`}
              icon={<Plus className="size-icon-sm text-foreground" />}
              onPress={() => onAddCard(column.id)}
            />
          ) : null}
        </View>
        {valueFields.map((campo) => (
          <Text key={campo.key} className="text-xs text-muted-foreground">
            {`Total ${campo.label}: ${formatValue(cards.reduce((soma, c) => soma + (c.values?.[campo.key] ?? 0), 0))}`}
          </Text>
        ))}
      </View>
      {/* `group` e nao `list`: o axe exige `listitem` como filho direto de `list` (aria-required-children), e o FlatList do web insere divs no meio */}
      <View {...a11yPresets.group} accessibilityLabel={`Cards em ${column.title}`}>
        <ListComponent
          testID={`kanban-list-${column.id}`}
          {...(motionOn ? { itemLayoutAnimation: layoutTransition() } : {})}
          scrollEnabled={scrollEnabled}
          data={visible}
          keyExtractor={(card) => card.id}
          ItemSeparatorComponent={CardSeparator}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View className="items-center rounded-item border border-dashed border-border p-4">
              <Text className="text-sm text-muted-foreground">Nenhum card</Text>
            </View>
          }
          ListFooterComponent={
            hasMore ? <Text className="py-2 text-center text-xs text-muted-foreground">Carregando mais cards...</Text> : null
          }
          renderItem={({ item, index }) => {
            const temMenu = Boolean(props.onCardMove) || (props.dropTargets?.length ?? 0) > 0
            const conteudo = renderCard ? renderCard(item) : <CardBody card={item} valueFields={valueFields} formatValue={formatValue} />
            return (
              <View className="flex-row items-start gap-1 rounded-block border border-border bg-card p-3 shadow-sm">
                <View className="min-w-0 flex-1">
                  {onCardClick ? (
                    <PressScale
                      accessibilityRole={a11yPresets.button.accessibilityRole}
                      onPress={() => onCardClick(item)}
                      className="min-h-touch"
                      outerClassName="min-h-touch"
                      motionTestID={`kanban-card-press-${item.id}`}
                    >
                      {conteudo}
                    </PressScale>
                  ) : (
                    conteudo
                  )}
                </View>
                {temMenu ? <CardMenu card={item} column={column} columns={columns} index={index} total={visible.length} props={props} /> : null}
              </View>
            )
          }}
        />
      </View>
    </View>
  )
}

function CardSeparator() {
  return <View className="h-2" />
}

export function Kanban(props: KanbanProps) {
  const { columns, cards, pageSize = DEFAULT_PAGE_SIZE, onLoadMore } = props
  const [shown, setShown] = useState<Record<string, number>>({})

  const items: TabItem[] = columns.map((column) => {
    const doColumn = cards.filter((c) => c.columnId === column.id)
    const visiveis = shown[column.id] ?? pageSize
    return {
      value: column.id,
      label: column.title,
      count: doColumn.length,
      content: (
        <ColumnView
          column={column}
          columns={columns}
          cards={doColumn}
          shown={visiveis}
          props={props}
          onEndReached={() => {
            if (visiveis < doColumn.length) setShown((atual) => ({ ...atual, [column.id]: visiveis + pageSize }))
            else if (props.hasMore?.(column.id)) onLoadMore?.(column.id)
          }}
        />
      ),
    }
  })

  return (
    <View
      {...a11yPresets.region}
      accessibilityLabel={props['aria-label'] ?? 'Quadro kanban'}
      dataSet={{ rendra: resolveCatalogCode('Kanban', { hasDropTargets: (props.dropTargets?.length ?? 0) > 0 }) }}
      className={cn('w-full', props.className)}
    >
      <Tabs variant="pill" accessibilityLabel="Colunas" items={items} />
    </View>
  )
}
