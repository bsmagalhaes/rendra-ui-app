/**
 * Rendra App, entrada principal do pacote @rendra-ui/app.
 * expo-router fica fora daqui: use @rendra-ui/app/router-bridge.
 */
export * from './components/ui'
export * from './components/layout'
export * from './components/app-shell'
export { Text } from './components/internal/text'
export type { TextProps } from './components/internal/text'
export { RendraSplash } from './components/splash/rendra-splash'
export type { RendraSplashProps } from './components/splash/rendra-splash'
export { Gradient, gradientStops } from './components/gradient/gradient'
export type { GradientProps } from './components/gradient/gradient'

export { BrandProvider } from './brand/brand-provider'
export { useBrand } from './brand/use-brand'
export { ThemedStatusBar } from './brand/themed-status-bar'
export { BrandContext, type ColorMode, type BrandContextValue } from './brand/brand-context'
export { createPalette, registerPalette } from './brand/palette'
export type { Palette, PaletteSeeds, PaletteVars } from './brand/palette'
export { paletteSeeds } from './brand/palettes'
export type { BrandConfig, PaletteConfig, SvgComponent, FeedbackType } from './brand/types'

export { models } from './theme/models'
export type { Model, ModelId } from './theme/models'
export { systemColorsLight, systemColorsDark } from './theme/tokens'
export { buildThemeVars, themeColorString } from './theme/vars'

export { themeCodes, colorCodes, navCodes, parseModelCode, formatModelCode, defaultModelCode } from './config/presets'
export type { NavCode } from './config/presets'

export { CATALOG, resolveCatalogCode, getCatalogEntry, catalogByComponent } from './catalog/components'
export type { ComponentCatalogEntry } from './catalog/components'

export { cn } from './lib/cn'
export * from './lib/masks'
export { isValidCpf, isValidCnpj, isValidDateBR, zBR } from './lib/validators'
export { a11yPresets } from './lib/a11y'
export { radiusByRole } from './lib/shape'
export type { Shape } from './lib/shape'
export { registerIconInterop } from './lib/icon-interop'
export { useDocumentTitle } from './lib/use-document-title'

export { useControlledState } from './hooks/use-controlled-state'
export { usePlaceholderColor } from './hooks/use-placeholder-color'

// Lacuna 4 do veredito Fable sobre o pacote npm: README.md:262, docs/PROMPT_MIGRACAO.md:43 e docs/COMO_APLICAR.md:33 prometem
// "forneça seu próprio RendraNavigationProvider (de @rendra-ui/app)" para quem usa outro
// roteador que não o Expo Router, mas o pacote não exportava nada com esse nome.
export { RendraNavigationProvider, useRendraNavigation } from './navigation/rendra-navigation'
export type { RendraNavigationValue, RendraLinkProps } from './navigation/rendra-navigation'
