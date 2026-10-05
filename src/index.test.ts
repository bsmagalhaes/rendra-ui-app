import * as pacote from './index'
import type { ShellNotificationItem, ShellNotificationsConfig } from './index'

describe('src/index.ts, entrada principal do pacote', () => {
  it('exporta os componentes de UI e o BrandProvider, funcoes de verdade', () => {
    // Button e forwardRef (React.forwardRef devolve um objeto com $$typeof, nao uma funcao);
    // os demais aqui sao funcoes de componente ou hooks comuns.
    expect(typeof pacote.Button).toBe('object')
    expect(pacote.Button).toBeTruthy()
    expect(typeof pacote.BrandProvider).toBe('function')
    expect(typeof pacote.useBrand).toBe('function')
    expect(typeof pacote.Gradient).toBe('function')
    expect(typeof pacote.registerIconInterop).toBe('function')
    expect(typeof pacote.useControlledState).toBe('function')
    expect(typeof pacote.usePlaceholderColor).toBe('function')
    expect(typeof pacote.createPalette).toBe('function')
    expect(typeof pacote.buildThemeVars).toBe('function')
    expect(typeof pacote.Spinner).toBe('function')
    expect(typeof pacote.RendraCredit).toBe('function')
    expect(typeof pacote.ErrorPage).toBe('function')
    expect(typeof pacote.AuthLayout).toBe('function')
    expect(typeof pacote.RendraSplash).toBe('function')
    expect((pacote as Record<string, unknown>).splashSeloStyle).toBeUndefined()
    expect(pacote.RENDRA_CREDIT_TEXT).toBe('Feito com Rendra')
  })

  it('exporta o tipo InputTrailingAction (a conferência é a compilação)', () => {
    const acao: pacote.InputTrailingAction = { icon: null, accessibilityLabel: 'Filtros', onPress: () => {}, badge: 1 }
    expect(acao.badge).toBe(1)
  })

  it('exporta os componentes da F3 da entrada principal (Timeline, Calendar, Kanban)', () => {
    expect(typeof pacote.Timeline).toBe('function')
    expect(typeof pacote.Calendar).toBe('function')
    expect(typeof pacote.Kanban).toBe('function')
    expect(typeof pacote.ImageViewer).toBe('function')
    expect(typeof pacote.ConversationList).toBe('function')
    expect(typeof pacote.ChatThread).toBe('function')
    expect(typeof pacote.ChatComposer).toBe('function')
    expect(typeof pacote.ChannelBadge).toBe('function')
    expect(typeof pacote.moveKanbanCard).toBe('function')
  })

  it('exporta os componentes da Sincronização 2 (Rating, Checklist, Pagination, DataToolbar, Table, Stepper, Wizard) e os tipos do sino do shell', () => {
    expect(typeof pacote.Rating).toBe('function')
    expect(typeof pacote.Checklist).toBe('function')
    expect(typeof pacote.Pagination).toBe('function')
    expect(typeof pacote.DataToolbar).toBe('function')
    expect(typeof pacote.Table).toBe('function')
    expect(typeof pacote.Stepper).toBe('function')
    expect(typeof pacote.Wizard).toBe('function')
    // Tipos do sino: a conferência é a compilação (`npm run typecheck`).
    const item: ShellNotificationItem = { id: '1', type: 'info', title: 'Fatura paga', time: '29/09/2026', read: false }
    const config: ShellNotificationsConfig = { items: [item], onMarkAllRead: () => {}, onItemClick: () => {} }
    expect(config.items).toHaveLength(1)
  })

  it('exporta o AppShell e a superficie publica de navegacao, sem o menu de exemplo', () => {
    expect(typeof pacote.AppShell).toBe('function')
    expect(typeof pacote.ShellProvider).toBe('function')
    expect(typeof pacote.useShell).toBe('function')
    expect(pacote.ShellContext).toBeTruthy()
    expect(pacote.defaultShellLayout).toEqual({ bottomNav: true, menu: 'drawer' })
    expect(Object.keys(pacote.layoutOptions)).toEqual(['N1', 'N2', 'N3'])
    expect(typeof pacote.getBottomNavItems).toBe('function')
    expect(typeof pacote.getNavigationTargets).toBe('function')
    expect(typeof pacote.resolveActiveTo).toBe('function')
    expect(typeof pacote.getBackTarget).toBe('function')
    // `src/config/navigation.tsx` é só o exemplo da vitrine, como `brand.config.ts`.
    expect((pacote as Record<string, unknown>).exampleNavigation).toBeUndefined()
    expect((pacote as Record<string, unknown>).exampleUser).toBeUndefined()
  })

  it('exporta os codigos de navegacao N1 a N3', () => {
    expect(Array.isArray(pacote.navCodes)).toBe(true)
    expect(pacote.navCodes.map((n) => n.code)).toEqual(['N1', 'N2', 'N3'])
    expect(pacote.defaultModelCode).toBe('T1-C1-N1')
  })

  it('exporta o catalogo de codigos de componente (secao 3.3 do levantamento da Sincronizacao 1)', () => {
    expect(Array.isArray(pacote.CATALOG)).toBe(true)
    expect(typeof pacote.resolveCatalogCode).toBe('function')
    expect(typeof pacote.getCatalogEntry).toBe('function')
    expect(typeof pacote.catalogByComponent).toBe('function')
  })

  it('exporta RendraNavigationProvider e useRendraNavigation (lacuna 4 do veredito Fable: README.md:262, docs/PROMPT_MIGRACAO.md:43, docs/COMO_APLICAR.md:33 prometem os dois)', () => {
    expect(typeof pacote.RendraNavigationProvider).toBe('function')
    expect(typeof pacote.useRendraNavigation).toBe('function')
  })

  it('nao exporta a marca de demonstracao nem o componente ligado ao roteador', () => {
    expect((pacote as Record<string, unknown>).brandConfigs).toBeUndefined()
    expect((pacote as Record<string, unknown>).activeBrandCode).toBeUndefined()
    expect((pacote as Record<string, unknown>).ModelCodeFromUrl).toBeUndefined()
  })
})
