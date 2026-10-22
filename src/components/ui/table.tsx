import { Fragment, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { format } from 'date-fns'
import { ChevronDown, MoreHorizontal, RotateCw } from 'lucide-react-native'
import { Text } from '../internal/text'
import { PressScale } from '../internal/motion-view'
import { Badge, type BadgeProps } from './badge'
import { Button } from './button'
import { Card } from './card'
import { Checkbox } from './checkbox'
import { DataToolbar, type DataToolbarProps } from './data-toolbar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu'
import { EmptyState } from './empty-state'
import { Pagination } from './pagination'
import { Select } from './select'
import { Separator } from './separator'
import { Skeleton } from './skeleton'
import { cn } from '../../lib/cn'
import { a11yPresets } from '../../lib/a11y'
import { formatCurrency } from '../../lib/masks'
import { useRendraNavigation } from '../../navigation/rendra-navigation'

/*
 * Tabela de dados, renderizada só como lista de cards (o formato de celular do web). Mesma API de
 * dados do web, sem modo remoto: o consumidor que precisa de servidor controla `data`, `loading`,
 * `error` e `pageSize` por fora. Busca, ordenação e seleção são locais. Sem dependência nova.
 * Os cards são montados com `View` e `map`, sem `FlatList`: a tabela vive dentro da rolagem da
 * página, e uma lista virtualizada ali dentro daria aviso de VirtualizedList aninhada.
 */

export interface TableColumn<T> {
  id: string
  header: string
  /** Valor da célula (para ordenar, buscar e formatar). */
  accessor: (row: T) => unknown
  /** Renderização própria da célula. */
  cell?: (row: T) => ReactNode
  /** Linhas extras abaixo do valor, em texto menor. Valores vazios são ignorados. */
  details?: (row: T) => (ReactNode | null | undefined)[]
  /** O valor vira link para esta rota. */
  href?: (row: T) => string
  /** Formato automático: number e currency, date vira DD/MM/AAAA, badge usa `badgeTone`. */
  kind?: 'text' | 'number' | 'currency' | 'date' | 'badge'
  badgeTone?: (row: T) => BadgeProps['tone']
  /** Pode ordenar por esta coluna (padrão `true`). */
  sortable?: boolean
  /** Pode ser ocultada em "Campos no card" (padrão `true`). */
  hideable?: boolean
  /** Começa oculta. */
  hidden?: boolean
  /**
   * No card: `primary` no topo (até 3; a primeira é o título), `secondary` recolhido em
   * "Ver detalhes" (padrão), `hidden` não aparece.
   */
  mobile?: 'primary' | 'secondary' | 'hidden'
}

export interface RowAction<T> {
  label: string
  icon?: ReactNode
  onPress: (row: T) => void
  destructive?: boolean
  hidden?: (row: T) => boolean
}

export interface TableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  getRowId: (row: T) => string
  /** Seleção por caixa de seleção, no topo do card. */
  selectable?: boolean
  /** Conteúdo expandido da linha, dentro de "Ver detalhes". */
  expandable?: (row: T) => ReactNode
  /** Ordenação por coluna, no painel de filtros (padrão `true`). */
  sortable?: boolean
  /** Busca global: texto aplicado ao valor (`accessor`) de todas as colunas. */
  globalFilter?: string
  /** "Campos no card" no painel de filtros. */
  columnVisibility?: boolean
  /** Ações em massa para os selecionados. */
  bulkActions?: (selected: T[], clear: () => void) => ReactNode
  /** Mais ações em massa, no menu de três pontinhos ao lado dos botões. */
  bulkMenu?: {
    label: string
    icon?: ReactNode
    destructive?: boolean
    onPress: (selected: T[], clear: () => void) => void
  }[]
  /** Ações por linha. Até 2 visíveis; acima disso, a primeira e o resto em "Mais ações". */
  rowActions?: RowAction<T>[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  /** Estado vazio. */
  empty?: { title: string; description?: string; action?: ReactNode }
  /** Itens por página. Padrão 15; `0` mostra tudo sem paginação. */
  pageSize?: number
  /** `pages` (anterior e próxima) ou `loadMore` ("Carregar mais"). */
  mobilePagination?: 'pages' | 'loadMore'
  /** Barra de ferramentas no mesmo card, acima da lista. */
  toolbar?: Omit<DataToolbarProps, 'columns' | 'sort'>
  /** Colunas `badge` vão para o fim (padrão `true`). */
  statusLast?: boolean
  /** Rótulo da lista para leitores de tela. */
  accessibilityLabel: string
}

const DEFAULT_PAGE_SIZE = 15

/* ================================================================ utilidades */

const isEmpty = (v: unknown) => v == null || v === ''

function toDate(v: unknown): Date {
  return v instanceof Date ? v : new Date(String(v))
}

/** Texto exibido da coluna sem `cell` (`-` quando vazio). */
function plainText<T>(col: TableColumn<T>, row: T): string {
  const v = col.accessor(row)
  if (isEmpty(v)) return '-'
  switch (col.kind) {
    case 'number':
      return Number(v).toLocaleString('pt-BR')
    case 'currency':
      return formatCurrency(Number(v))
    case 'date':
      return format(toDate(v), 'dd/MM/yyyy')
    default:
      return String(v)
  }
}

function CellContent<T>({
  col,
  row,
  textClassName,
  weight,
}: {
  col: TableColumn<T>
  row: T
  textClassName: string
  weight?: 'normal' | 'medium' | 'semibold'
}) {
  const { navigate, linkComponent: LinkComponent } = useRendraNavigation()
  const href = col.href?.(row)

  let main: ReactNode
  if (col.cell) {
    main = col.cell(row)
  } else if (isEmpty(col.accessor(row))) {
    main = <Text className="text-sm text-muted-foreground">-</Text>
  } else if (col.kind === 'badge') {
    main = <Badge tone={col.badgeTone?.(row) ?? 'neutral'}>{String(col.accessor(row))}</Badge>
  } else {
    main = (
      <Text weight={weight} className={cn(textClassName, href && 'underline')}>
        {plainText(col, row)}
      </Text>
    )
  }

  const value =
    href === undefined ? (
      main
    ) : LinkComponent ? (
      <LinkComponent href={href} asChild>
        <PressScale
          accessibilityRole={a11yPresets.link.accessibilityRole}
          className="min-h-touch justify-center"
          outerClassName="min-h-touch justify-center"
          motionTestID="tabela-link"
        >
          {main}
        </PressScale>
      </LinkComponent>
    ) : (
      <PressScale
        accessibilityRole={a11yPresets.link.accessibilityRole}
        onPress={() => navigate(href)}
        className="min-h-touch justify-center"
        outerClassName="min-h-touch justify-center"
        motionTestID="tabela-link"
      >
        {main}
      </PressScale>
    )

  const extra = (col.details?.(row) ?? []).filter((d) => d != null && d !== '')
  if (extra.length === 0) return <>{value}</>
  return (
    <View className="min-w-0 flex-col">
      {value}
      {extra.map((d, i) =>
        typeof d === 'string' || typeof d === 'number' ? (
          <Text key={i} numberOfLines={1} className="text-xs text-muted-foreground">
            {d}
          </Text>
        ) : (
          <Fragment key={i}>{d}</Fragment>
        ),
      )}
    </View>
  )
}

function RowActions<T>({ row, actions }: { row: T; actions: RowAction<T>[] }) {
  const list = actions.filter((a) => !a.hidden?.(row))
  const visible = list.length <= 2 ? list : list.slice(0, 1)
  const rest = list.length <= 2 ? [] : list.slice(1)
  return (
    <View className="w-full flex-row items-center justify-end gap-2">
      {visible.map((a) => (
        <Button
          key={a.label}
          variant={a.destructive ? 'ghost' : 'outline'}
          size="sm"
          icon={a.icon}
          onPress={() => a.onPress(row)}
          className="flex-1"
        >
          {a.destructive ? <Text className="text-destructive-soft-foreground">{a.label}</Text> : a.label}
        </Button>
      ))}
      {rest.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="sm" iconOnly accessibilityLabel="Mais ações" icon={<MoreHorizontal className="text-foreground" />} />
          </DropdownMenuTrigger>
          <DropdownMenuContent accessibilityLabel="Mais ações">
            {rest.map((a) => (
              <DropdownMenuItem key={a.label} destructive={a.destructive} icon={a.icon} onSelect={() => a.onPress(row)}>
                {a.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </View>
  )
}

function RowCard<T>({
  row,
  id,
  primary,
  secondary,
  expandable,
  selectable,
  selected,
  onToggleSelected,
  rowActions,
}: {
  row: T
  id: string
  primary: TableColumn<T>[]
  secondary: TableColumn<T>[]
  expandable?: (row: T) => ReactNode
  selectable?: boolean
  selected: boolean
  onToggleSelected: (selected: boolean) => void
  rowActions?: RowAction<T>[]
}) {
  const [open, setOpen] = useState(false)
  const [title, ...others] = primary
  const hasDetails = secondary.length > 0 || Boolean(expandable)
  return (
    <View
      testID={`table-linha-${id}`}
      className={cn('flex-col gap-3 p-4', selected && 'bg-primary-soft')}
    >
      <View testID={`table-linha-${id}-principal`} className="flex-row items-start gap-3">
        {selectable ? (
          <Checkbox checked={selected} onCheckedChange={onToggleSelected} accessibilityLabel="Selecionar linha" />
        ) : null}
        <View className="min-w-0 flex-1 flex-col gap-1">
          {title ? (
            <View testID={`table-titulo-${id}`}>
              <CellContent col={title} row={row} textClassName="text-base text-foreground" weight="semibold" />
            </View>
          ) : null}
          {others.map((c) => {
            const text = c.cell || c.href ? null : plainText(c, row)
            return (
              <View
                key={c.id}
                accessible={text != null}
                accessibilityLabel={text != null ? `${c.header}: ${text}` : undefined}
                className="flex-row flex-wrap items-center gap-2"
              >
                <CellContent col={c} row={row} textClassName="text-sm text-muted-foreground" />
              </View>
            )
          })}
        </View>
      </View>
      {hasDetails ? (
        <View>
          <Pressable
            accessibilityRole={a11yPresets.button.accessibilityRole}
            accessibilityState={{ expanded: open }}
            onPress={() => setOpen((v) => !v)}
            className="min-h-touch flex-row items-center gap-1 self-start"
          >
            <Text weight="medium" className="text-sm text-primary-text">
              {open ? 'Ocultar detalhes' : 'Ver detalhes'}
            </Text>
            <ChevronDown className={cn('size-icon-sm text-primary-text', open ? 'rotate-180' : 'rotate-0')} />
          </Pressable>
          {open ? (
            <View className="flex-col gap-3 pt-2">
              {secondary.map((c) => (
                <View key={c.id} className="flex-col gap-1">
                  <Text className="text-xs text-muted-foreground">{c.header}</Text>
                  <CellContent col={c} row={row} textClassName="text-sm text-foreground" />
                </View>
              ))}
              {expandable ? <View className="pt-1">{expandable(row)}</View> : null}
            </View>
          ) : null}
        </View>
      ) : null}
      {rowActions && rowActions.length > 0 ? (
        <View className="border-t border-border pt-3">
          <RowActions row={row} actions={rowActions} />
        </View>
      ) : null}
    </View>
  )
}

function compareRows<T>(col: TableColumn<T>, a: T, b: T, desc: boolean): number {
  const va = col.accessor(a)
  const vb = col.accessor(b)
  // Valores vazios vão sempre para o fim, qualquer que seja o sentido.
  if (isEmpty(va) || isEmpty(vb)) return isEmpty(va) === isEmpty(vb) ? 0 : isEmpty(va) ? 1 : -1
  let result: number
  if (col.kind === 'number' || col.kind === 'currency') result = Number(va) - Number(vb)
  else if (col.kind === 'date') result = toDate(va).getTime() - toDate(vb).getTime()
  else result = String(va).localeCompare(String(vb), 'pt-BR', { numeric: true, sensitivity: 'base' })
  return desc ? -result : result
}

/* ================================================================ componente */

export function Table<T>({
  data,
  columns: columnsProp,
  getRowId,
  selectable = false,
  expandable,
  sortable = true,
  globalFilter,
  columnVisibility = false,
  bulkActions,
  bulkMenu,
  rowActions,
  loading = false,
  error = null,
  onRetry,
  empty,
  pageSize = DEFAULT_PAGE_SIZE,
  mobilePagination = 'pages',
  toolbar,
  statusLast = true,
  accessibilityLabel,
}: TableProps<T>) {
  const columns = useMemo(
    () =>
      statusLast
        ? [...columnsProp.filter((c) => c.kind !== 'badge'), ...columnsProp.filter((c) => c.kind === 'badge')]
        : columnsProp,
    [columnsProp, statusLast],
  )
  const [sorting, setSorting] = useState<{ id: string; desc: boolean } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Record<string, true>>({})
  const [hiddenIds, setHiddenIds] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(columnsProp.filter((c) => c.hidden).map((c) => [c.id, true])),
  )
  const [page, setPage] = useState(1)

  // Busca ou ordenação novas voltam para a página 1 no mesmo render.
  const resetKey = `${globalFilter ?? ''}|${sorting ? `${sorting.id}:${sorting.desc}` : ''}`
  const [lastResetKey, setLastResetKey] = useState(resetKey)
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey)
    setPage(1)
  }

  /* ---------------- linhas: busca, ordenação, página */
  const filtered = useMemo(() => {
    if (!globalFilter) return data
    const termo = globalFilter.toLowerCase()
    return data.filter((row) =>
      columns.some((col) => {
        const v = col.accessor(row)
        return (typeof v === 'string' || typeof v === 'number') && String(v).toLowerCase().includes(termo)
      }),
    )
  }, [data, columns, globalFilter])

  const sorted = useMemo(() => {
    const col = sorting ? columns.find((c) => c.id === sorting.id) : undefined
    if (!sorting || !col) return filtered
    return [...filtered].sort((a, b) => compareRows(col, a, b, sorting.desc))
  }, [filtered, columns, sorting])

  const total = sorted.length
  const rows = !pageSize
    ? sorted
    : mobilePagination === 'loadMore'
      ? sorted.slice(0, page * pageSize)
      : sorted.slice((page - 1) * pageSize, page * pageSize)

  const visibleCols = columns.filter((c) => !hiddenIds[c.id])
  const primary = visibleCols.filter((c) => c.mobile === 'primary').slice(0, 3)
  const secondary = visibleCols.filter((c) => (c.mobile ?? 'secondary') === 'secondary')

  const selectedRows = data.filter((row) => selectedIds[getRowId(row)])
  const clearSelection = () => setSelectedIds({})

  /* ---------------- barra de ferramentas */
  const sortOptions = columns
    .filter((c) => c.sortable !== false)
    .flatMap((c) => [
      { value: `${c.id}:asc`, label: `${c.header} (crescente)` },
      { value: `${c.id}:desc`, label: `${c.header} (decrescente)` },
    ])
  const sortControl =
    sortable && sortOptions.length > 0 ? (
      <Select
        label="Ordenar por"
        placeholder="Ordem padrão"
        clearable
        value={sorting ? `${sorting.id}:${sorting.desc ? 'desc' : 'asc'}` : null}
        onChange={(v) => {
          if (!v) return setSorting(null)
          const [id, dir] = v.split(':')
          setSorting({ id: id ?? '', desc: dir === 'desc' })
        }}
        options={sortOptions}
      />
    ) : undefined

  // "Campos no card": só as colunas que aparecem no card (as `mobile: 'hidden'` ficam de fora).
  const toolbarColumns = columnVisibility
    ? columns
        .filter((c) => c.hideable !== false && c.mobile !== 'hidden')
        .map((c) => ({
          id: c.id,
          label: c.header,
          visible: !hiddenIds[c.id],
          onToggle: (v: boolean) => setHiddenIds((h) => ({ ...h, [c.id]: !v })),
        }))
    : undefined
  const showToolbar = Boolean(toolbar || toolbarColumns?.length || sortControl)

  const selectionBar =
    selectable && selectedRows.length > 0 ? (
      <View className="flex-col gap-3 border-b border-border p-4">
        <Text weight="medium" className="text-sm tabular-nums text-foreground">
          {selectedRows.length} {selectedRows.length === 1 ? 'selecionado' : 'selecionados'}
        </Text>
        <View className="flex-row flex-wrap items-center gap-2">
          {bulkActions?.(selectedRows, clearSelection)}
          {bulkMenu && bulkMenu.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button
                  variant="outline"
                  iconOnly
                  accessibilityLabel="Mais ações para os selecionados"
                  icon={<MoreHorizontal className="text-foreground" />}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent accessibilityLabel="Mais ações para os selecionados">
                {bulkMenu.map((a) => (
                  <DropdownMenuItem
                    key={a.label}
                    destructive={a.destructive}
                    icon={a.icon}
                    onSelect={() => a.onPress(selectedRows, clearSelection)}
                  >
                    {a.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          <Button variant="ghost" size="sm" onPress={clearSelection}>
            Limpar seleção
          </Button>
        </View>
      </View>
    ) : null

  /* ---------------- corpo */
  let body: ReactNode
  if (error) {
    body = (
      <EmptyState
        type="error"
        size="compact"
        title="Não foi possível carregar"
        description={error}
        actions={
          onRetry ? (
            <Button variant="outline" icon={<RotateCw className="text-foreground" />} onPress={onRetry}>
              Tentar de novo
            </Button>
          ) : undefined
        }
      />
    )
  } else if (loading) {
    body = (
      <View className="flex-col">
        {Array.from({ length: 4 }, (_, i) => (
          <View key={i} testID={`table-esqueleto-${i}`} className="flex-col gap-3 p-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </View>
        ))}
      </View>
    )
  } else if (total === 0) {
    body = (
      <EmptyState
        size="compact"
        title={globalFilter ? 'Nenhum resultado' : (empty?.title ?? 'Nada por aqui ainda')}
        description={globalFilter ? 'Tente outros termos ou limpe os filtros.' : empty?.description}
        actions={!globalFilter && empty?.action ? empty.action : undefined}
      />
    )
  } else {
    body = (
      <View className="flex-col">
        {rows.map((row, i) => {
          const id = getRowId(row)
          return (
            <Fragment key={id}>
              {i > 0 ? <Separator /> : null}
              <RowCard
                row={row}
                id={id}
                primary={primary}
                secondary={secondary}
                expandable={expandable}
                selectable={selectable}
                selected={Boolean(selectedIds[id])}
                onToggleSelected={(v) =>
                  setSelectedIds((atual) => {
                    const { [id]: _removida, ...resto } = atual
                    return v ? { ...resto, [id]: true } : resto
                  })
                }
                rowActions={rowActions}
              />
            </Fragment>
          )
        })}
      </View>
    )
  }

  const showPagination = Boolean(pageSize) && !error && !loading && total > 0

  return (
    <Card code="TAB-001" className="overflow-hidden border-border">
      {showToolbar ? <DataToolbar {...toolbar} sort={sortControl} columns={toolbarColumns} /> : null}
      {selectionBar}
      <View
        accessibilityLabel={accessibilityLabel}
        role="group"
        accessibilityState={{ busy: loading }}
      >
        {body}
      </View>
      {showPagination ? (
        <View className="border-t border-border p-4">
          <Pagination page={page} pageSize={pageSize} total={total} mobileMode={mobilePagination} onPageChange={setPage} />
        </View>
      ) : null}
    </Card>
  )
}
