import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { ArrowLeft } from 'lucide-react-native'
import { Text } from '../internal/text'
import { Gradient } from '../gradient/gradient'
import { BrandLogo } from '../ui/brand-logo'
import { RendraCredit } from '../ui/rendra-credit'
import { useBrand } from '../../brand/use-brand'
import { useRendraNavigation } from '../../navigation/rendra-navigation'
import { a11yPresets } from '../../lib/a11y'
import { cn } from '../../lib/cn'
import { gapClass } from './tokens'

/*
 * Moldura das telas públicas (entrar, recuperar senha, cadastro): painel de marca no topo (o
 * único `Gradient` da tela, com o logotipo e a frase do modelo), título, descrição, o conteúdo,
 * o rodapé e, por último, o crédito "Feito com Rendra" (removível por `credit={false}`). Sem
 * rolagem própria: a tela que usa o layout põe o `ScrollView`. Fica fora do `AppShell`.
 */

export interface AuthLayoutProps {
  title: string
  description?: string
  /** Link de voltar acima do título (ex.: "Voltar ao login"). */
  back?: { href: string; label: string }
  children: ReactNode
  footer?: ReactNode
  /** Padrão true; false remove o crédito. */
  credit?: boolean
  creditText?: string
  creditHref?: string
  /** `'start'` (padrão) ou `'center'`: centraliza o logotipo, a frase, o título e a descrição. */
  align?: 'start' | 'center'
  /** Espaço entre os blocos: `'fields'` (16 px) ou `'section'` (32 px). Sem a prop, ficam os 24 px de sempre. */
  gap?: 'fields' | 'section'
  /** Botão só com ícone ("Voltar") ao lado do logotipo, no painel de marca. Vence `backHref` se vierem juntos. */
  onBack?: () => void
  /** Como `onBack`, mas navega para este endereço (com o link do roteador, quando houver). */
  backHref?: string
  /**
   * `'gradient'` (padrão) pinta o painel de marca com o degradê; `'none'` tira o degradê: o
   * logotipo vai sobre a superfície (a arte oficial, quando a marca tem `logo`) e a frase do
   * modelo em `text-muted-foreground`.
   */
  headerBackground?: 'gradient' | 'none'
}

function BackLink({ href, label }: { href: string; label: string }) {
  const { navigate, linkComponent: LinkComponent } = useRendraNavigation()
  const conteudo = (
    <Pressable
      accessibilityRole={a11yPresets.link.accessibilityRole}
      onPress={LinkComponent ? undefined : () => navigate(href)}
      className="min-h-touch flex-row items-center gap-2 self-start rounded-item"
    >
      <ArrowLeft className="size-icon-md text-muted-foreground" />
      <Text weight="medium" className="text-sm text-muted-foreground">
        {label}
      </Text>
    </Pressable>
  )
  return LinkComponent ? (
    <LinkComponent href={href} asChild>
      {conteudo}
    </LinkComponent>
  ) : (
    conteudo
  )
}

// Cor do ícone do botão só com ícone: sobre o degradê, o texto do degradê; sem ele, o texto comum.
// Exportado só para o teste (a className do ícone Lucide vira variável CSS e não aparece sob Jest, como em `colorClass`).
export const backIconClass: Record<'gradient' | 'none', string> = {
  gradient: 'text-gradient-brand-foreground',
  none: 'text-foreground',
}

// Botão só com ícone do painel de marca. `onBack` vence `backHref`; sem nenhum dos dois, não existe.
function BackIconButton({ onBack, href, iconClass }: { onBack?: () => void; href?: string; iconClass: string }) {
  const { navigate, linkComponent: LinkComponent } = useRendraNavigation()
  const comLink = !onBack && href !== undefined && Boolean(LinkComponent)
  const conteudo = (
    <Pressable
      accessibilityRole={onBack ? a11yPresets.button.accessibilityRole : a11yPresets.link.accessibilityRole}
      accessibilityLabel="Voltar"
      onPress={onBack ?? (comLink ? undefined : () => navigate(href!))}
      className="size-touch items-center justify-center rounded-item"
    >
      <ArrowLeft className={cn('size-icon-md', iconClass)} />
    </Pressable>
  )
  if (comLink && LinkComponent) {
    return (
      <LinkComponent href={href!} asChild>
        {conteudo}
      </LinkComponent>
    )
  }
  return conteudo
}

export function AuthLayout({
  title,
  description,
  back,
  children,
  footer,
  credit,
  creditText,
  creditHref,
  align = 'start',
  gap,
  onBack,
  backHref,
  headerBackground = 'gradient',
}: AuthLayoutProps) {
  const { brand } = useBrand()
  const centered = align === 'center'
  const gradient = headerBackground === 'gradient'
  const espaco = gap ? gapClass[gap] : 'gap-6'
  const temVoltar = Boolean(onBack) || backHref !== undefined

  return (
    <View className={cn('w-full p-4', espaco)}>
      <View className={cn('relative rounded-block', gradient ? 'overflow-hidden p-6' : 'p-2')}>
        {gradient ? (
          <View
            aria-hidden
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="absolute inset-0"
          >
            <Gradient token="brand" className="size-full" />
          </View>
        ) : null}
        <View className="gap-4">
          <View className={cn('flex-row items-center gap-2', centered && 'justify-center')}>
            {temVoltar ? (
              <View className={centered ? 'absolute left-0' : undefined}>
                <BackIconButton
                  onBack={onBack}
                  href={backHref}
                  iconClass={backIconClass[headerBackground]}
                />
              </View>
            ) : null}
            <BrandLogo on={gradient ? 'brand' : 'surface'} />
          </View>
          <Text
            className={cn(
              'text-sm',
              gradient ? 'text-gradient-brand-foreground' : 'text-muted-foreground',
              centered && 'text-center',
            )}
          >
            {brand.tagline}
          </Text>
        </View>
      </View>
      <View className={cn('w-full max-w-sm self-center', espaco)}>
        {back ? <BackLink href={back.href} label={back.label} /> : null}
        <View className={cn('gap-2', centered && 'items-center')}>
          <Text
            weight="semibold"
            accessibilityRole={a11yPresets.header.accessibilityRole}
            className={cn('text-2xl text-foreground', centered && 'text-center')}
          >
            {title}
          </Text>
          {description ? <Text className={cn('text-sm text-muted-foreground', centered && 'text-center')}>{description}</Text> : null}
        </View>
        {children}
        {footer}
        <RendraCredit credit={credit} text={creditText} href={creditHref} />
      </View>
    </View>
  )
}
