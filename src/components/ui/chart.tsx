import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { Pressable, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native'
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Polygon, Rect, Stop, Text as SvgText } from 'react-native-svg'
import { area, arc, curveMonotoneX, line } from 'd3-shape'
import { Text } from '../internal/text'
import { Badge, type BadgeTone } from './badge'
import { Button } from './button'
import { useBrand } from '../../brand/use-brand'
import { themeColorString } from '../../theme/vars'
import { systemColorsDark, systemColorsLight } from '../../theme/tokens'
import { mix } from '../../brand/palette'
import { resolveCatalogCode } from '../../catalog/components'
import {
  categoryAt,
  clamp01,
  funnelWidth,
  gaugeArcPath,
  gaugePoint,
  linearScale,
  niceTicks,
  pieAngles,
  stackSeries,
  zoneFor,
  type GaugeZone,
} from '../../lib/chart-scale'
import { a11yPresets } from '../../lib/a11y'
import { cn } from '../../lib/cn'
import { ChartReveal } from '../internal/chart-reveal'

// `Chart` mora no subcaminho `@rendra-ui/app/chart` (src/chart.ts): carrega `d3-shape` e nunca
// entra na entrada principal. Toda cor de SVG sai de `themeColorString(themeVars, ...)`, nunca
// literal (R2): o `Svg` nao le `className` em `fill`/`stroke`. Sem `ResponsiveContainer`, a
// largura vem do `onLayout` do plot.

export interface ChartSeries {
  key: string
  label: string
  /** Posicao (1 a 5) em `--rendra-chart-N`; sem ela, a cor gira pela ordem da serie. */
  color?: 1 | 2 | 3 | 4 | 5
  /** So no `combo`: sem `kind`, a primeira serie e barra e as demais sao linha. */
  kind?: 'bar' | 'line'
}

interface BaseProps {
  valueFormatter?: (n: number) => string
  height?: 'sm' | 'md' | 'fill'
  'aria-label': string
  className?: string
}

export interface CartesianChartProps extends BaseProps {
  type: 'line' | 'bar' | 'area' | 'pie' | 'combo'
  /** Uma linha por categoria; `interface` do consumidor serve, sem index signature. */
  data: readonly object[]
  xKey: string
  series: ChartSeries[]
  stacked?: boolean
  colorByCategory?: boolean
  /** Acima dessa quantidade de categorias aparece o botao "Ver como lista" (padrao 8). */
  listThreshold?: number
}

export type { GaugeZone }

export interface GaugeChartProps extends BaseProps {
  type: 'gauge'
  value: number
  max: number
  min?: number
  /** Com meta, o ponteiro mostra `value / target`; sem ela, `(value - min) / (max - min)`. */
  target?: number
  zones?: GaugeZone[]
  label?: string
}

export interface FunnelChartProps extends BaseProps {
  type: 'funnel'
  stages: { label: string; value: number }[]
}

export type ChartProps = CartesianChartProps | GaugeChartProps | FunnelChartProps

/** Cor da serie `index` (ciclica em `--rendra-chart-1..5`), no formato `rgb(r g b)` que o SVG aceita. */
export function seriesColor(themeVars: Record<string, string>, index: number): string {
  return themeColorString(themeVars, `--rendra-chart-${(((index % 5) + 5) % 5) + 1}`)
}

const defaultFormatter = (n: number) => n.toLocaleString('pt-BR')

const heightClass = { sm: 'h-chart-sm', md: 'h-chart-md', fill: 'min-h-chart-sm flex-1' } as const

const FONT_SIZE = 12
const MARGIN_TOP = 8
const MARGIN_RIGHT = 8
const MARGIN_BOTTOM = 24
const MAX_BAR = 40

type Row = Record<string, unknown>

const num = (valor: unknown): number | null => (typeof valor === 'number' && Number.isFinite(valor) ? valor : null)
const safeId = (raw: string) => raw.replace(/[^a-zA-Z0-9_-]/g, '')

function colorOfSeries(vars: Record<string, string>, serie: ChartSeries, index: number) {
  return seriesColor(vars, serie.color ? serie.color - 1 : index)
}

function kindOf(type: CartesianChartProps['type'], serie: ChartSeries, index: number): 'bar' | 'line' {
  if (type === 'bar') return 'bar'
  if (type === 'combo') return serie.kind ?? (index === 0 ? 'bar' : 'line')
  return 'line'
}

function LegendItem({ color, label, testID }: { color: string; label: string; testID?: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <Svg testID={testID} width={8} height={8}>
        <Rect width={8} height={8} rx={4} fill={color} />
      </Svg>
      <Text className="text-xs text-muted-foreground">{label}</Text>
    </View>
  )
}

/**
 * Modo texto: uma linha por categoria, renderizada por `map` (nao por `FlatList`). Um `List`
 * aninhado na rolagem da rota virtualiza e so monta as primeiras dez linhas (licao 7 do
 * levantamento); aqui todas as categorias precisam estar na arvore, e `listitem` e seguro porque
 * os itens sao filhos diretos do contêiner `list` (I6 do parecer).
 */
function ChartListMode({
  data,
  xKey,
  series,
  format,
}: {
  data: readonly Row[]
  xKey: string
  series: ChartSeries[]
  format: (n: number) => string
}) {
  return (
    <View {...a11yPresets.list}>
      {data.map((row, i) => (
        <View key={i} {...a11yPresets.listitem} className={cn('min-h-touch justify-center gap-1 py-2', i > 0 && 'border-t border-border')}>
          <Text weight="medium" className="text-sm text-foreground">
            {String(row[xKey] ?? '')}
          </Text>
          <Text className="text-sm text-muted-foreground">
            {series.map((s) => `${s.label}: ${num(row[s.key]) === null ? '-' : format(num(row[s.key])!)}`).join(' · ')}
          </Text>
        </View>
      ))}
    </View>
  )
}

interface PlotGeometry {
  width: number
  height: number
  left: number
  plotW: number
  plotH: number
  band: number
  xCenter: (i: number) => number
}

function CartesianPlot({
  props,
  geometry,
  ticks,
  yOf,
  selected,
}: {
  props: CartesianChartProps
  geometry: PlotGeometry
  ticks: number[]
  yOf: (n: number) => number
  selected: number | null
}) {
  const { type, xKey, series, stacked, colorByCategory } = props
  const data = props.data as readonly Row[]
  const format = props.valueFormatter ?? defaultFormatter
  const { themeVars, model } = useBrand()
  const gradientId = safeId(useId())
  const { width, height, left, plotW, band, xCenter } = geometry
  const grid = themeColorString(themeVars, '--rendra-border')
  const axis = themeColorString(themeVars, '--rendra-muted-foreground')
  const fontFamily = model.fontFamily.normal

  const bars = series.map((s, index) => ({ s, index })).filter(({ s, index }) => kindOf(type, s, index) === 'bar')
  const lines = series.map((s, index) => ({ s, index })).filter(({ s, index }) => kindOf(type, s, index) === 'line')
  const stack = stacked ? stackSeries(data, bars.map(({ s }) => s.key)) : null
  const yZero = yOf(0)
  const barW = Math.max(2, Math.min(MAX_BAR, (band * 0.7) / (stacked ? 1 : Math.max(1, bars.length))))
  const groupW = stacked ? barW : barW * bars.length

  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(1, Math.floor(plotW / 40))))

  return (
    <Svg width={width} height={height}>
      {ticks.map((tick) => (
        <G key={tick}>
          <Line x1={left} x2={width - MARGIN_RIGHT} y1={yOf(tick)} y2={yOf(tick)} stroke={grid} strokeWidth={1} strokeDasharray="3 3" />
          <SvgText x={left - 6} y={yOf(tick) + 4} fontSize={FONT_SIZE} fontFamily={fontFamily} fill={axis} textAnchor="end">
            {format(tick)}
          </SvgText>
        </G>
      ))}
      {selected !== null ? (
        <Rect
          testID="chart-destaque"
          x={left + selected * band}
          y={MARGIN_TOP}
          width={band}
          height={geometry.plotH}
          fill={grid}
          fillOpacity={0.35}
        />
      ) : null}
      <ChartReveal width={width} height={height}>
      {bars.map(({ s, index }) =>
        data.map((row, i) => {
          const valor = stack ? stack[i]![s.key]! : null
          const v = stack ? valor![1] : num(row[s.key])
          if (v === null) return null
          const from = stack ? valor![0] : 0
          const yTop = yOf(Math.max(v, from))
          const yBase = yOf(Math.min(v, from))
          const slot = stack ? 0 : bars.findIndex((b) => b.s.key === s.key)
          const x = left + i * band + (band - groupW) / 2 + slot * barW
          const cor = colorByCategory ? seriesColor(themeVars, i) : colorOfSeries(themeVars, s, index)
          return (
            <Rect
              key={`${s.key}-${i}`}
              testID={`chart-bar-${s.key}-${i}`}
              x={x}
              y={yTop}
              width={barW}
              height={Math.max(0, yBase - yTop)}
              rx={Math.min(4, barW / 2)}
              fill={cor}
            />
          )
        }),
      )}
      {lines.map(({ s, index }) => {
        const cor = colorOfSeries(themeVars, s, index)
        const pontos = data.map((row, i) => ({ i, v: num(row[s.key]) }))
        const gerador = line<{ i: number; v: number | null }>()
          .defined((p) => p.v !== null)
          .x((p) => xCenter(p.i))
          .y((p) => yOf(p.v!))
          .curve(curveMonotoneX)
        const preenchimento =
          type === 'area'
            ? area<{ i: number; v: number | null }>()
                .defined((p) => p.v !== null)
                .x((p) => xCenter(p.i))
                .y0(yZero)
                .y1((p) => yOf(p.v!))
                .curve(curveMonotoneX)(pontos)
            : null
        const id = `${gradientId}-${safeId(s.key)}`
        return (
          <G key={s.key}>
            {preenchimento ? (
              <>
                <Defs>
                  <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={cor} stopOpacity={0.3} />
                    <Stop offset="1" stopColor={cor} stopOpacity={0} />
                  </LinearGradient>
                </Defs>
                <Path testID={`chart-area-${s.key}`} d={preenchimento} fill={`url(#${id})`} />
              </>
            ) : null}
            <Path testID={`chart-line-${s.key}`} d={gerador(pontos) ?? ''} fill="none" stroke={cor} strokeWidth={2} />
          </G>
        )
      })}
      </ChartReveal>
      {data.map((row, i) =>
        i % labelEvery === 0 ? (
          <SvgText key={i} x={xCenter(i)} y={height - 6} fontSize={FONT_SIZE} fontFamily={fontFamily} fill={axis} textAnchor="middle">
            {String(row[xKey] ?? '')}
          </SvgText>
        ) : null,
      )}
    </Svg>
  )
}

function PieChart({ props, width, height }: { props: CartesianChartProps; width: number; height: number }) {
  const { series } = props
  const data = props.data as readonly Row[]
  const { themeVars } = useBrand()
  const serie = series[0]!
  const fatias = pieAngles(data.map((row) => Math.max(0, num(row[serie.key]) ?? 0)))
  const meio = Math.min(width, height) / 2
  const gerador = arc().innerRadius(meio * 0.55).outerRadius(meio * 0.85).padAngle(0.035)
  const borda = themeColorString(themeVars, '--rendra-card')
  return (
    <Svg width={width} height={height}>
      <ChartReveal width={width} height={height}>
      <G transform={`translate(${width / 2},${height / 2})`}>
        {fatias.map(({ start, end }, i) => (
          <Path
            key={i}
            testID={`chart-slice-${i}`}
            d={gerador({ startAngle: start, endAngle: end, innerRadius: 0, outerRadius: 0 }) ?? ''}
            fill={seriesColor(themeVars, i)}
            stroke={borda}
            strokeWidth={1}
          />
        ))}
      </G>
      </ChartReveal>
    </Svg>
  )
}

function CartesianChart(props: CartesianChartProps) {
  const { type, xKey, series, stacked, listThreshold = 8, height = 'md' } = props
  const data = props.data as readonly Row[]
  const format = props.valueFormatter ?? defaultFormatter
  const { themeVars } = useBrand()
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [listMode, setListMode] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const isPie = type === 'pie'
  const canList = data.length > listThreshold

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height: h } = event.nativeEvent.layout
    setSize({ width, height: h })
  }

  // Dominio: empilhado soma as series de barra; senao vale o maior valor de qualquer serie.
  const keys = series.map((s) => s.key)
  const barKeys = series.filter((s, i) => kindOf(type, s, i) === 'bar').map((s) => s.key)
  const todos = data.flatMap((row) => keys.map((k) => num(row[k])).filter((v): v is number => v !== null))
  const somas = stacked ? stackSeries(data, barKeys).map((r) => Object.values(r).reduce((m, [, fim]) => Math.max(m, fim), 0)) : []
  const dataMax = Math.max(0, ...todos, ...somas)
  const dataMin = Math.min(0, ...todos)
  const ticks = niceTicks(dataMin, dataMax, 3)
  const labelWidth = Math.max(...ticks.map((t) => format(t).length)) * 7 + 12
  const left = Math.max(32, labelWidth)
  const plotW = Math.max(0, size.width - left - MARGIN_RIGHT)
  const plotH = Math.max(0, size.height - MARGIN_TOP - MARGIN_BOTTOM)
  const band = data.length > 0 ? plotW / data.length : 0
  const geometry: PlotGeometry = {
    width: size.width,
    height: size.height,
    left,
    plotW,
    plotH,
    band,
    xCenter: (i) => left + band * (i + 0.5),
  }
  const yOf = linearScale([ticks[0]!, ticks[ticks.length - 1]!], [MARGIN_TOP + plotH, MARGIN_TOP])

  const onSelect = (event: GestureResponderEvent) => {
    const x = event.nativeEvent.locationX - left
    setSelected(categoryAt(x, plotW, data.length))
  }

  const selecionado = selected !== null ? data[selected] : undefined
  const resumo = selecionado
    ? [String(selecionado[xKey] ?? ''), ...series.map((s) => `${s.label}: ${num(selecionado[s.key]) === null ? '-' : format(num(selecionado[s.key])!)}`)].join(' · ')
    : null

  const plotClass = cn('w-full', heightClass[height])
  const medido = size.width > 0 && size.height > 0

  return (
    <View className={cn('w-full gap-2', height === 'fill' && 'flex-1')}>
      {canList ? (
        <View className="flex-row justify-end">
          <Button variant="ghost" size="sm" onPress={() => setListMode((atual) => !atual)}>
            {listMode ? 'Ver gráfico' : 'Ver como lista'}
          </Button>
        </View>
      ) : null}
      {listMode ? (
        <ChartListMode data={data} xKey={xKey} series={series} format={format} />
      ) : isPie ? (
        <>
          <View testID="chart-plot" onLayout={onLayout} className={plotClass}>
            {medido ? <PieChart props={props} width={size.width} height={size.height} /> : null}
          </View>
          <View className="gap-1">
            {data.map((row, i) => (
              <LegendItem
                key={i}
                color={seriesColor(themeVars, i)}
                label={`${String(row[xKey] ?? '')}: ${format(num(row[series[0]!.key]) ?? 0)}`}
              />
            ))}
          </View>
        </>
      ) : (
        <>
          <Pressable
            testID="chart-plot"
            accessible={false}
            focusable={false}
            onLayout={onLayout}
            onPress={onSelect}
            className={plotClass}
          >
            {medido ? <CartesianPlot props={props} geometry={geometry} ticks={ticks} yOf={yOf} selected={selected} /> : null}
          </Pressable>
          {series.length > 1 ? (
            <View className="flex-row flex-wrap gap-x-4 gap-y-1">
              {series.map((s, index) => (
                <LegendItem key={s.key} color={colorOfSeries(themeVars, s, index)} label={s.label} />
              ))}
            </View>
          ) : null}
          {resumo ? (
            <Text testID="chart-selecao" accessibilityLiveRegion="polite" className="text-sm text-foreground">
              {resumo}
            </Text>
          ) : null}
        </>
      )}
    </View>
  )
}

const DEFAULT_ZONES: GaugeZone[] = [
  { to: 0.6, tone: 'error' },
  { to: 0.9, tone: 'warning' },
  { to: 1, tone: 'success' },
]

const zoneText: Record<GaugeZone['tone'], string> = {
  error: 'Abaixo da meta',
  warning: 'Atenção',
  success: 'No verde',
  primary: 'Em andamento',
  neutral: 'Em andamento',
}

const zoneBadge: Record<GaugeZone['tone'], BadgeTone> = {
  error: 'error',
  warning: 'warning',
  success: 'success',
  primary: 'primary',
  neutral: 'neutral',
}

const GAUGE_WIDTH = 240
const GAUGE_HEIGHT = 140
const GAUGE_MAX_WIDTH = 320

/** Uma casa decimal e `%`, com virgula: `2,3%`. */
const pct = (fracao: number) =>
  `${(fracao * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`

function GaugeChart(props: GaugeChartProps) {
  const { value, max, min = 0, target, zones = DEFAULT_ZONES, label } = props
  const format = props.valueFormatter ?? defaultFormatter
  const { themeVars, model } = useBrand()
  const [largura, setLargura] = useState(0)
  const gradientId = safeId(useId())

  const bruta = target !== undefined && target > 0 ? value / target : max > min ? (value - min) / (max - min) : 0
  const frac = clamp01(bruta)
  const now = Math.round(frac * 100)
  const zona = zoneFor(frac, zones)
  const texto = `${now}% da meta, ${zoneText[zona.tone]}`
  const nome = label ?? props['aria-label']

  const svgW = Math.min(largura, GAUGE_MAX_WIDTH)
  const ponta = gaugePoint(frac, 80)
  const foreground = themeColorString(themeVars, '--rendra-foreground')
  const card = themeColorString(themeVars, '--rendra-card')
  const eixo = themeColorString(themeVars, '--rendra-muted-foreground')
  const fontFamily = model.fontFamily.normal

  return (
    <View
      accessible
      {...a11yPresets.meter}
      accessibilityLabel={nome}
      accessibilityValue={{ min: 0, max: 100, now, text: texto }}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={now}
      aria-valuetext={texto}
      className="w-full items-center gap-2"
    >
      <View testID="chart-plot" onLayout={(e) => setLargura(e.nativeEvent.layout.width)} className="w-full items-center">
        {svgW > 0 ? (
          <Svg width={svgW} height={(svgW * GAUGE_HEIGHT) / GAUGE_WIDTH} viewBox={`0 0 ${GAUGE_WIDTH} ${GAUGE_HEIGHT}`}>
            <Defs>
              <LinearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="20" y1="0" x2="220" y2="0">
                <Stop offset="0" stopColor={themeColorString(themeVars, '--rendra-meter-low')} />
                <Stop offset="0.6" stopColor={themeColorString(themeVars, '--rendra-meter-mid')} />
                <Stop offset="1" stopColor={themeColorString(themeVars, '--rendra-meter-high')} />
              </LinearGradient>
            </Defs>
            <ChartReveal width={GAUGE_WIDTH} height={GAUGE_HEIGHT}>
            <Path d={gaugeArcPath(0, 1, 92)} fill="none" stroke={card} strokeWidth={20} strokeLinecap="round" />
            <Path testID="chart-gauge-arco" d={gaugeArcPath(0, 1, 92)} fill="none" stroke={`url(#${gradientId})`} strokeWidth={16} strokeLinecap="round" />
            <Line testID="chart-gauge-ponteiro" x1={120} y1={120} x2={ponta.x} y2={ponta.y} stroke={foreground} strokeWidth={3} strokeLinecap="round" />
            <Circle cx={120} cy={120} r={6} fill={foreground} />
            <Circle cx={120} cy={120} r={2} fill={card} />
            </ChartReveal>
            <SvgText x={20} y={136} fontSize={FONT_SIZE} fontFamily={fontFamily} fill={eixo} textAnchor="middle">
              0%
            </SvgText>
            <SvgText x={220} y={136} fontSize={FONT_SIZE} fontFamily={fontFamily} fill={eixo} textAnchor="middle">
              100%
            </SvgText>
          </Svg>
        ) : null}
      </View>
      <Text weight="semibold" className="text-3xl text-foreground">
        {format(value)}
      </Text>
      {label ? <Text className="text-sm text-muted-foreground">{label}</Text> : null}
      <View className="flex-row flex-wrap justify-center gap-x-4">
        {target !== undefined ? <Text className="text-sm text-muted-foreground">{`Meta: ${format(target)}`}</Text> : null}
        <Text className="text-sm text-muted-foreground">{`Realizado: ${format(value)}`}</Text>
      </View>
      <Badge tone={zoneBadge[zona.tone]}>{zoneText[zona.tone]}</Badge>
    </View>
  )
}

const STAGE_HEIGHT = 48

function FunnelChart(props: FunnelChartProps) {
  const { stages } = props
  const format = props.valueFormatter ?? defaultFormatter
  const { palette, resolvedMode } = useBrand()
  const [largura, setLargura] = useState(0)
  const n = stages.length
  const vars = resolvedMode === 'light' ? palette.light : palette.dark
  const sucesso = (resolvedMode === 'light' ? systemColorsLight : systemColorsDark).success
  const sidebar = vars['--rendra-sidebar']!
  const primary = vars['--rendra-primary']!

  const taxas = stages.map((estagio, i) => {
    const proximo = stages[i + 1]
    return proximo && estagio.value > 0 ? proximo.value / estagio.value : null
  })
  const validas = taxas.filter((t): t is number => t !== null)
  const pior = n > 2 && validas.length > 0 ? taxas.indexOf(Math.min(...validas)) : -1
  const conversao = n > 0 && stages[0]!.value > 0 ? stages[n - 1]!.value / stages[0]!.value : 0

  return (
    <View testID="chart-plot" onLayout={(e) => setLargura(e.nativeEvent.layout.width)} className="w-full">
      {stages.map((estagio, i) => {
        const topo = funnelWidth(i, n)
        const base = funnelWidth(i + 1, n)
        const cor = mix(mix(primary, sucesso, 1 - topo), sidebar, 0.42)
        const meio = largura / 2
        const pontos = [
          [meio - (topo * largura) / 2, 0],
          [meio + (topo * largura) / 2, 0],
          [meio + (base * largura) / 2, STAGE_HEIGHT],
          [meio - (base * largura) / 2, STAGE_HEIGHT],
        ]
          .map(([x, y]) => `${x},${y}`)
          .join(' ')
        const taxa = taxas[i]
        return (
          <View key={`${estagio.label}-${i}`}>
            <View className="h-12 items-center justify-center">
              {largura > 0 ? (
                <View className="absolute inset-0">
                  <Svg width={largura} height={STAGE_HEIGHT}>
                    <Polygon testID={`chart-funnel-${i}`} points={pontos} fill={cor} />
                  </Svg>
                </View>
              ) : null}
              <Text weight="medium" className="text-sm text-sidebar-foreground">
                {estagio.label}
              </Text>
              <Text className="text-xs text-sidebar-foreground">{format(estagio.value)}</Text>
            </View>
            {taxa !== null && taxa !== undefined ? (
              <Text className={cn('py-1 text-center text-xs', i === pior ? 'text-destructive-soft-foreground' : 'text-muted-foreground')}>
                {`${pct(taxa)} para a próxima etapa${i === pior ? ' · Maior queda' : ''}`}
              </Text>
            ) : null}
          </View>
        )
      })}
      <Text className="pt-1 text-center text-sm text-foreground">{`${pct(conversao)} de conversão total do funil`}</Text>
    </View>
  )
}

export function Chart(props: ChartProps): ReactNode {
  const code = resolveCatalogCode('Chart', { type: props.type })
  return (
    <View
      {...a11yPresets.figure}
      accessibilityLabel={props['aria-label']}
      dataSet={{ rendra: code }}
      className={cn('w-full', props.height === 'fill' && 'flex-1', props.className)}
    >
      {props.type === 'gauge' ? (
        <GaugeChart {...props} />
      ) : props.type === 'funnel' ? (
        <FunnelChart {...props} />
      ) : (
        <CartesianChart {...props} />
      )}
    </View>
  )
}
