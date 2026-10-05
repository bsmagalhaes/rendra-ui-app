import { View, ScrollView } from 'react-native'
import { Text } from '../../../src/components/internal/text'
import { Card, CardContent } from '../../../src/components/ui'
import { useBrand } from '../../../src/brand'
import { contrast } from '../../../src/brand/palette'
import { useDocumentTitle } from '../../../src/lib/use-document-title'

const TEXT_SIZE_CLASSES: Record<string, string> = {
  xs: 'text-xs', sm: 'text-sm', base: 'text-base', lg: 'text-lg',
  xl: 'text-xl', '2xl': 'text-2xl', '3xl': 'text-3xl',
}
const SPACING_WIDTH_CLASSES: Record<string, string> = {
  '1': 'w-1', '2': 'w-2', '3': 'w-3', '4': 'w-4',
  '6': 'w-6', '8': 'w-8', '12': 'w-12', '16': 'w-16', '24': 'w-24',
}
const RADIUS_CLASSES: Record<string, string> = {
  control: 'rounded-control', item: 'rounded-item', surface: 'rounded-surface',
  block: 'rounded-block', avatar: 'rounded-avatar',
}
const SHADOW_CLASSES: Record<string, string> = { sm: 'shadow-sm', md: 'shadow-md', lg: 'shadow-lg' }

function SectionTitle({ children }: { children: string }) {
  return <Text weight="semibold" className="text-lg text-foreground">{children}</Text>
}

function AAPair({ label, fg, bg }: { label: string; fg: string; bg: string }) {
  const ratio = contrast(fg, bg)
  const passes = ratio >= 4.5
  return (
    <View
      className="min-h-touch flex-row items-center justify-between gap-2 rounded-item border border-border p-3"
      style={{ backgroundColor: bg }}
    >
      <Text style={{ color: fg }}>{label}</Text>
      <Text weight="semibold" style={{ color: fg }}>{passes ? 'AA' : 'Reprovado'}</Text>
    </View>
  )
}

export default function TokensIndex() {
  useDocumentTitle('Tokens · Rendra App')
  const { palette, resolvedMode } = useBrand()
  const vars = resolvedMode === 'light' ? palette.light : palette.dark
  const pairs: [string, string, string][] = [
    ['Primária', vars['--rendra-primary-foreground']!, vars['--rendra-primary']!],
    ['Hover da primária', vars['--rendra-primary-hover-foreground']!, vars['--rendra-primary-hover']!],
    ['Secundária', vars['--rendra-secondary-foreground']!, vars['--rendra-secondary']!],
    ['Hover da secundária', vars['--rendra-secondary-hover-foreground']!, vars['--rendra-secondary-hover']!],
    ['Suave da primária', vars['--rendra-primary-soft-foreground']!, vars['--rendra-primary-soft']!],
  ]

  return (
    // tabIndex: região rolável sem nenhum conteúdo focável dentro (axe: scrollable-region-focusable,
    // ver src/types/react-native-web.d.ts).
    <ScrollView tabIndex={0} className="flex-1 bg-background" contentContainerClassName="gap-8 p-4">
      <Text weight="semibold" className="text-2xl text-foreground">Tokens</Text>
      <Text className="text-sm text-muted-foreground">Paleta, tipografia, espaço, raio e sombra do modelo ativo.</Text>

      <Card>
        <CardContent className="gap-3">
            <SectionTitle>Paleta</SectionTitle>
            {pairs.map(([label, fg, bg]) => <AAPair key={label} label={label} fg={fg} bg={bg} />)}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="gap-3">
            <SectionTitle>Tipografia</SectionTitle>
            {Object.entries(TEXT_SIZE_CLASSES).map(([size, className]) => (
              <Text key={size} className={`${className} text-foreground`}>{`text-${size}`}</Text>
            ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="gap-3">
            <SectionTitle>Espaço</SectionTitle>
            <View className="flex-row flex-wrap items-end gap-4">
              {Object.entries(SPACING_WIDTH_CLASSES).map(([token, widthClassName]) => (
                <View key={token} className="items-start gap-1">
                  <View testID={`espaco-${token}`} className={`h-4 ${widthClassName} bg-primary`} />
                  <Text className="text-xs text-muted-foreground">{token}</Text>
                </View>
              ))}
            </View>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="gap-3">
            <SectionTitle>Raio</SectionTitle>
            <View className="flex-row flex-wrap gap-4">
              {Object.entries(RADIUS_CLASSES).map(([role, className]) => (
                <View key={role} className={`size-12 bg-primary-soft ${className}`} />
              ))}
            </View>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="gap-3">
            <SectionTitle>Sombra</SectionTitle>
            <View className="flex-row flex-wrap gap-4">
              {Object.entries(SHADOW_CLASSES).map(([level, className]) => (
                <View key={level} className={`size-12 rounded-control bg-card ${className}`} />
              ))}
            </View>
        </CardContent>
      </Card>
    </ScrollView>
  )
}
