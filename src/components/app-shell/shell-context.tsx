import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRendraNavigation } from '../../navigation/rendra-navigation'
import { parseModelCode } from '../../config/presets'
import { defaultShellLayout, layoutOptions } from './layout'
import type { ShellLayout, ShellLayoutCode } from './layout'
import { getBottomNavItems, getNavigationTargets, resolveActiveTo } from './navigation-utils'
import type { NavigationTarget } from './navigation-utils'
import type { NavGroup, NavItem, ShellCenterButton, ShellMenuItem, ShellNotificationsConfig, ShellUser, ShellWorkspaces } from './types'

const STORAGE_KEY = 'rendra:shell-layout'

interface StoredShellLayout {
  /** Formato do valor persistido; permite migração futura sem quebrar quem já tem dado salvo. */
  version: 1
  layout: ShellLayout
}

export interface ShellPageMeta {
  title?: string
  help?: string
  /**
   * Rota da tela que enviou. Numa pilha a tela anterior segue montada por baixo, então o
   * cabeçalho só usa título e ajuda cuja rota é a atual (sem `path`, vale para qualquer rota).
   */
  path?: string
}

export interface ShellContextValue {
  layout: ShellLayout
  /** Mescla parcialmente com o layout atual e grava a escolha (quando `userConfigurable`). */
  setLayout: (next: Partial<ShellLayout>) => void
  /** Aplica um dos códigos `N1` a `N3`. */
  applyLayout: (code: ShellLayoutCode) => void
  /** Apaga a escolha salva e volta ao layout da prop. */
  resetLayout: () => void
  /** `true` depois de ler o layout salvo; a barra inferior só aparece a partir daí. */
  hydrated: boolean
  mobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
  navigation: NavGroup[]
  bottomNavItems: NavItem[]
  navigationTargets: NavigationTarget[]
  /** Rota do destino ativo (a mais específica), ou `null`. */
  activeTo: string | null
  user?: ShellUser
  userMenuItems?: ShellMenuItem[]
  onLogout?: () => void
  /** Sino de notificações do cabeçalho; ausente, o shell não mostra sino. */
  notifications?: ShellNotificationsConfig
  homeLabel?: string
  /** Botão central da barra inferior (ícone e rótulo próprios); ausente, o botão de menu de sempre. */
  centerButton?: ShellCenterButton
  /** Seletor de espaço no topo do menu do usuário. */
  workspaces?: ShellWorkspaces
  /** Logo no lugar do título do cabeçalho. */
  headerLogo?: ReactNode
  /** Título e ajuda enviados pela tela (o `PageHeader` dentro do shell). */
  pageTitle?: string
  pageHelp?: string
  setPageMeta: (meta: ShellPageMeta | null) => void
}

/** Nulo fora do shell: `PageHeader` e `ActionBar` leem com `useContext` e seguem sem shell. */
export const ShellContext = createContext<ShellContextValue | null>(null)

export function useShell(): ShellContextValue {
  const context = useContext(ShellContext)
  if (!context) {
    throw new Error('useShell precisa estar dentro de <ShellProvider> ou <AppShell>.')
  }
  return context
}

const isMenu = (value: unknown): value is ShellLayout['menu'] => value === 'drawer' || value === 'sheet'

/**
 * Hidratação defensiva, campo a campo: JSON corrompido, versão desconhecida ou campo com tipo
 * errado nunca derrubam o shell; o que for válido é aproveitado e o resto fica no padrão.
 */
function parseStoredLayout(raw: string): Partial<ShellLayout> | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof parsed !== 'object' || parsed === null) return null
  const candidate = parsed as Partial<StoredShellLayout>
  if (candidate.version !== 1) return null
  const stored = candidate.layout as Partial<Record<keyof ShellLayout, unknown>> | undefined
  if (typeof stored !== 'object' || stored === null) return null
  const layout: Partial<ShellLayout> = {}
  if (typeof stored.bottomNav === 'boolean') layout.bottomNav = stored.bottomNav
  if (isMenu(stored.menu)) layout.menu = stored.menu
  return layout
}

/**
 * `?codigo=T#-C#-N#` na URL escolhe o layout, depois de hidratar. Mesma guarda por valor de
 * `ModelCodeFromUrl`: `applyLayout` muda de identidade a cada troca, então a guarda é pelo valor
 * já aplicado, não pela função, senão a URL seria reaplicada por cima de uma troca manual.
 */
function LayoutFromUrl() {
  const { searchParams } = useRendraNavigation()
  const { hydrated, applyLayout } = useShell()
  const codigo = searchParams?.codigo
  const aplicado = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!hydrated || codigo === undefined || aplicado.current === codigo) return
    aplicado.current = codigo
    const nav = parseModelCode(codigo).nav
    if (nav) applyLayout(nav.code as ShellLayoutCode)
  }, [hydrated, codigo, applyLayout])

  return null
}

export interface ShellProviderProps {
  navigation: NavGroup[]
  layout?: Partial<ShellLayout>
  user?: ShellUser
  userMenuItems?: ShellMenuItem[]
  onLogout?: () => void
  /** Sino de notificações do cabeçalho (opcional, a lista é copiada na montagem). */
  notifications?: ShellNotificationsConfig
  homeLabel?: string
  /** Botão central da barra inferior: ícone (`'brand-symbol'` ou um componente) e rótulo acessível próprios. */
  centerButton?: ShellCenterButton
  /** Seletor de espaço (empresa, filial) no topo do menu do usuário; só aparece com `user`. */
  workspaces?: ShellWorkspaces
  /**
   * Logo (por exemplo, um `BrandLogo`) no lugar do título no cabeçalho. O título continua no
   * cabeçalho só para o leitor de tela (oculto visualmente) e o logo é decorativo para ele. A
   * ajuda (`InfoHint`) segue ao lado. Passe um elemento estável: um novo a cada render refaz o contexto.
   */
  headerLogo?: ReactNode
  /** Deixa a pessoa trocar e gravar o layout (padrão `true`). */
  userConfigurable?: boolean
  children: ReactNode
}

export function ShellProvider({
  navigation,
  layout: layoutProp,
  user,
  userMenuItems,
  onLogout,
  notifications,
  homeLabel,
  centerButton,
  workspaces,
  headerLogo,
  userConfigurable = true,
  children,
}: ShellProviderProps) {
  const { currentPath } = useRendraNavigation()
  const [stored, setStored] = useState<Partial<ShellLayout> | null>(null)
  const [hydrated, setHydrated] = useState(!userConfigurable)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [pageMeta, setPageMetaState] = useState<ShellPageMeta | null>(null)

  useEffect(() => {
    if (!userConfigurable) return
    let active = true
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => (raw ? parseStoredLayout(raw) : null))
      // Leitura que rejeita: segue com o padrão, sem deixar `hydrated` preso em falso.
      .catch(() => null)
      .then((salvo) => {
        if (!active) return
        if (salvo) setStored(salvo)
        setHydrated(true)
      })
    return () => {
      active = false
    }
  }, [userConfigurable])

  const base = useMemo<ShellLayout>(
    () => ({ ...defaultShellLayout, ...layoutProp }),
    [layoutProp],
  )
  const layout = useMemo<ShellLayout>(() => ({ ...base, ...stored }), [base, stored])

  const setLayout = useCallback(
    (next: Partial<ShellLayout>) => {
      const merged: ShellLayout = { ...layout, ...next }
      setStored(merged)
      if (userConfigurable) {
        const value: StoredShellLayout = { version: 1, layout: merged }
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value)).catch(() => {})
      }
    },
    [layout, userConfigurable],
  )

  const applyLayout = useCallback(
    (code: ShellLayoutCode) => setLayout(layoutOptions[code].layout),
    [setLayout],
  )

  const resetLayout = useCallback(() => {
    setStored(null)
    if (userConfigurable) AsyncStorage.removeItem(STORAGE_KEY).catch(() => {})
  }, [userConfigurable])

  const setPageMeta = useCallback((meta: ShellPageMeta | null) => {
    setPageMetaState((previous) =>
      previous?.title === meta?.title && previous?.help === meta?.help && previous?.path === meta?.path
        ? previous
        : meta,
    )
  }, [])

  const metaAtual = pageMeta && (pageMeta.path === undefined || pageMeta.path === currentPath) ? pageMeta : null

  const bottomNavItems = useMemo(() => getBottomNavItems(navigation), [navigation])
  const navigationTargets = useMemo(() => getNavigationTargets(navigation), [navigation])
  const activeTo = useMemo(
    () => (currentPath === undefined ? null : resolveActiveTo(navigationTargets, currentPath)),
    [navigationTargets, currentPath],
  )

  const value = useMemo<ShellContextValue>(
    () => ({
      layout,
      setLayout,
      applyLayout,
      resetLayout,
      hydrated,
      mobileNavOpen,
      setMobileNavOpen,
      navigation,
      bottomNavItems,
      navigationTargets,
      activeTo,
      user,
      userMenuItems,
      onLogout,
      notifications,
      homeLabel,
      centerButton,
      workspaces,
      headerLogo,
      pageTitle: metaAtual?.title,
      pageHelp: metaAtual?.help,
      setPageMeta,
    }),
    [
      layout,
      setLayout,
      applyLayout,
      resetLayout,
      hydrated,
      mobileNavOpen,
      navigation,
      bottomNavItems,
      navigationTargets,
      activeTo,
      user,
      userMenuItems,
      onLogout,
      notifications,
      homeLabel,
      centerButton,
      workspaces,
      headerLogo,
      metaAtual,
      setPageMeta,
    ],
  )

  return (
    <ShellContext.Provider value={value}>
      <LayoutFromUrl />
      {children}
    </ShellContext.Provider>
  )
}
