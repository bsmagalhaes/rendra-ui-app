import { View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { cssInterop } from 'nativewind'
import { Text } from '../internal/text'
import { useBrand } from '../../brand/use-brand'
import { a11yPresets } from '../../lib/a11y'
import { cn } from '../../lib/cn'

// Mesmo precedente de gradient.tsx:6 e brand-feedback-icon.tsx:13 (decisão 4 do plano do lote 4):
// o Svg só resolve `currentColor` a partir do próprio `style.color`, então className com cor só
// tem efeito no Svg se o cssInterop mapear className -> style neste componente.
cssInterop(Svg, { className: 'style' })

export interface BrandLogoProps {
  on?: 'sidebar' | 'surface' | 'brand'
  symbolOnly?: boolean
  size?: 'sm' | 'md'
  className?: string
  testID?: string
}

// B2 (Fable, validacao da entrega): react-native-svg so resolve `currentColor` a partir do proprio
// Svg (RenderableView.getCurrentColor, no nativo; extractBrush.js no cssInterop); o View do selo
// nunca alimenta essa cadeia. A cor precisa estar aplicada ao Svg/simbolo, nunca ao View pai
// (mesmo precedente de brand-feedback-icon.tsx:140,144), por isso o fundo e a cor viram mapas
// separados: tileBgClass no View do selo, tileColorClass no Svg/simbolo. `tileColorClass` é
// exportado só para o teste (mesmo precedente de `colorClass` em brand-feedback-icon.tsx:33): o
// cssInterop(Svg, { className: 'style' }) consome o `className` do Svg em tempo de execução e o
// substitui por um `style` computado que não resolve variável CSS sob Jest, então o mapa que o
// componente usa para montar essa className é a parte observável e estável.
export const tileBgClass: Record<'sidebar' | 'surface' | 'brand', string> = {
  sidebar: 'bg-sidebar-indicator',
  surface: 'bg-primary',
  brand: 'bg-gradient-brand-foreground',
}
export const tileColorClass: Record<'sidebar' | 'surface' | 'brand', string> = {
  sidebar: 'text-sidebar',
  surface: 'text-primary-foreground',
  brand: 'text-sidebar',
}
const sizeClass: Record<'sm' | 'md', string> = { sm: 'size-6 p-1', md: 'size-8 p-1' }
const wordClass: Record<'sidebar' | 'surface' | 'brand', [string, string]> = {
  sidebar: ['text-sidebar-foreground', 'text-sidebar-muted-foreground'],
  surface: ['text-foreground', 'text-muted-foreground'],
  brand: ['text-gradient-brand-foreground', 'text-gradient-brand-foreground opacity-80'],
}

export function BrandLogo({ on = 'surface', symbolOnly = false, size = 'md', className, testID }: BrandLogoProps) {
  const { brand, resolvedMode, sidebarLogoVariant } = useBrand()
  // C7 (veredito do Opus): `brand.symbol` é `ComponentType<SvgProps>`; atribuir a uma constante
  // com nome capitalizado antes de usar como tag JSX (`<Symbol .../>`), em vez de `<brand.symbol
  // .../>`, deixa o componente igual ao padrão já usado em brand-feedback-icon.tsx.
  const Symbol = brand.symbol
  const [firstWord, ...rest] = brand.productName.split(' ')
  const restWord = rest.join(' ')

  const seloAccessibility = symbolOnly
    ? { accessible: true as const, role: a11yPresets.img.role, accessibilityLabel: brand.productName }
    : {
        'aria-hidden': true as const,
        accessibilityElementsHidden: true,
        importantForAccessibility: 'no-hide-descendants' as const,
      }

  // Arte oficial: com `logoMode: 'image'` e `brand.logo`, desenha o logotipo completo (claro ou
  // escuro) no lugar do selo e da palavra. Sobre a sidebar vale a variante da paleta; sobre o
  // degradê da marca, sempre a escura; nos demais casos, a do modo ativo.
  if (brand.logoMode === 'image' && brand.logo && !symbolOnly) {
    const variante = on === 'sidebar' ? sidebarLogoVariant : on === 'brand' || resolvedMode === 'dark' ? 'dark' : 'light'
    const Logo = brand.logo[variante]
    return (
      <View
        accessible
        role={a11yPresets.img.role}
        accessibilityLabel={brand.productName}
        className={cn('flex-row items-center', className)}
        dataSet={{ rendra: 'LOGO-001' }}
      >
        {/* O tamanho vem de classe da escala (nunca `style`): o Svg não tem tamanho intrínseco no RN, então `w-auto` daria largura zero. */}
        <Logo className="h-8 w-24" preserveAspectRatio="xMinYMid meet" aria-hidden />
      </View>
    )
  }

  return (
    <View className={cn('flex-row items-center gap-3', className)} dataSet={{ rendra: 'LOGO-001' }}>
      <View
        testID={testID ? `${testID}-selo` : undefined}
        className={cn('shrink-0 items-center justify-center rounded-control', tileBgClass[on], sizeClass[size])}
        {...seloAccessibility}
      >
        {Symbol ? (
          <Symbol className={cn('size-full', tileColorClass[on])} />
        ) : (
          <Svg
            testID={testID ? `${testID}-simbolo` : undefined}
            viewBox="0 0 24 24"
            className={cn('size-full', tileColorClass[on])}
            fill="currentColor"
          >
            <Circle cx={12} cy={12} r={10} />
          </Svg>
        )}
      </View>
      {!symbolOnly ? (
        <View className="flex-row gap-1">
          <Text weight="semibold" className={cn('text-lg', wordClass[on][0])}>
            {firstWord}
          </Text>
          {restWord ? (
            <Text weight="normal" className={cn('text-lg', wordClass[on][1])}>
              {restWord}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}
