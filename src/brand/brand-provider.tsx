import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useColorScheme, View } from 'react-native'
import { vars } from 'nativewind'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { BrandContext, type ColorMode } from './brand-context'
import { models, type ModelId } from '../theme/models'
import type { BrandConfig } from './types'
import { createPalette, registerPalette, type Palette, type PaletteSeeds } from './palette'
import { paletteSeeds } from './palettes'
import { buildThemeVars } from '../theme/vars'
import { colorCodes } from '../config/presets'

// Padrão interno mínimo (Tarefa 2.5, decisão do redator 9 do plano): quando quem consome o
// pacote não passa `brands`, o `BrandProvider` não embarca a marca de demonstração ("Rendra",
// `src/brand/brand.config.ts`, que fica só em `app/`). Cada entrada usa o nome do produto do
// próprio modelo (`models.ts`), sem logotipo nem símbolo (campos opcionais em `BrandConfig`).
const PADRAO_INTERNO: Record<ModelId, BrandConfig> = {
  T1: {
    id: models.T1.brandId, productName: models.T1.productName, companyName: models.T1.productName,
    tagline: models.T1.tagline, shape: models.T1.shape, logoMode: 'themed', sidebarLogo: 'dark', feedbackIcons: {},
    labelStyle: 'discreto',
  },
  T2: {
    id: models.T2.brandId, productName: models.T2.productName, companyName: models.T2.productName,
    tagline: models.T2.tagline, shape: models.T2.shape, logoMode: 'themed', sidebarLogo: 'dark', feedbackIcons: {},
    labelStyle: 'discreto',
  },
  T3: {
    id: models.T3.brandId, productName: models.T3.productName, companyName: models.T3.productName,
    tagline: models.T3.tagline, shape: models.T3.shape, logoMode: 'themed', sidebarLogo: 'dark', feedbackIcons: {},
    labelStyle: 'discreto',
  },
}

const STORAGE_KEY = 'rendra:brand'

const DEFAULT_MODEL_CODE: ModelId = 'T1'
const DEFAULT_PALETTE_ID = 'safira'
const DEFAULT_MODE: ColorMode = 'system'

interface StoredBrand {
  /** Formato do valor persistido; permite migração futura sem quebrar quem já tem dado salvo. */
  version: 1
  modelCode: ModelId
  paletteId: string
  mode: ColorMode
  customSeeds?: PaletteSeeds
}

const isModelId = (value: unknown): value is ModelId => typeof value === 'string' && value in models
const isColorMode = (value: unknown): value is ColorMode =>
  value === 'light' || value === 'dark' || value === 'system'
const isKnownPaletteId = (value: unknown, lista: PaletteSeeds[]): boolean =>
  typeof value === 'string' && lista.some((seed) => seed.id === value)

function isValidPaletteSeeds(value: unknown): value is PaletteSeeds {
  if (!value || typeof value !== 'object') return false
  const seeds = value as Record<string, unknown>
  const requiredStrings = ['id', 'name', 'primary', 'primaryHover', 'secondary', 'secondaryHover']
  const hasRequiredStrings = requiredStrings.every((key) => typeof seeds[key] === 'string')
  const hasGradient =
    Array.isArray(seeds.gradient) && seeds.gradient.length === 3 && seeds.gradient.every((item) => typeof item === 'string')
  return hasRequiredStrings && hasGradient
}

/**
 * Hidratação defensiva (correção pós-validação, Fable): storage com JSON corrompido, `modelCode`
 * que não existe em `models`, ou `paletteId` sem paleta pronta correspondente e sem `customSeeds`
 * devolve `null`, o BrandProvider mantém o padrão T1/safira/system (os valores iniciais de
 * `useState`) e ainda assim marca `hydrated = true`, para não travar a UI num app com storage
 * corrompido ou gravado por uma versão anterior/incompatível.
 */
function parseStoredBrand(raw: string, lista: PaletteSeeds[]): StoredBrand | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof parsed !== 'object' || parsed === null) return null
  const candidate = parsed as Partial<StoredBrand>
  if (!isModelId(candidate.modelCode)) return null
  if (!isColorMode(candidate.mode)) return null
  const hasCustomSeeds = isValidPaletteSeeds(candidate.customSeeds)
  if (!isKnownPaletteId(candidate.paletteId, lista) && !hasCustomSeeds) return null
  return {
    version: 1,
    modelCode: candidate.modelCode,
    paletteId: hasCustomSeeds ? candidate.customSeeds!.id : (candidate.paletteId as string),
    mode: candidate.mode,
    customSeeds: hasCustomSeeds ? candidate.customSeeds : undefined,
  }
}

export function BrandProvider({
  children,
  brands: brandsProp,
  palettes: palettesProp,
  defaultPaletteId,
  defaultModelCode,
  storage,
}: {
  children: ReactNode
  /** Mapa de marca por modelo (Tarefa 2.5); sem esta prop, usa o padrão interno mínimo (nome do
   *  produto de `models.ts`, sem logotipo). `app/_layout.tsx` continua passando `brandConfigs`
   *  (marca de demonstração da vitrine). Mescla com o padrão: um modelo ausente na prop ainda
   *  resolve para o padrão interno, nunca fica `undefined`. */
  brands?: Partial<Record<ModelId, BrandConfig>>
  /**
   * Paletas do app. Sem esta prop, as quatro prontas (`paletteSeeds`). Passada, a lista
   * SUBSTITUI as quatro prontas (não soma): `useBrand().palettes` e os seletores passam a
   * mostrar só as suas. O código da paleta de uma lista própria é o `id` em maiúsculas (os
   * códigos `C1` a `C4` são das quatro prontas). Uma paleta salva que não está nesta lista é
   * o registro salvo inteiro é descartado (modelo, paleta e modo voltam aos padrões: `defaultModelCode`, `defaultPaletteId` e `'system'`). Passe uma lista estável (constante fora do
   * componente).
   */
  palettes?: PaletteSeeds[]
  /**
   * `id` da paleta usada na primeira pintura e quando nada está salvo. Padrão `'safira'`; um id
   * que não está na lista cai na primeira paleta dela. Observação: `setPaletteId(null)` volta
   * para a paleta do modelo (`models[modelo].brandId`), que, numa lista própria sem esse id,
   * também resolve para a primeira paleta da lista.
   */
  defaultPaletteId?: string
  /**
   * Modelo (`ModelId`, como `'T1'`) usado na primeira pintura e quando nada está salvo. Padrão
   * `'T1'`. Atenção: não é a constante exportada `defaultModelCode` (`'T1-C1-N1'`, o código
   * completo de modelo, cor e navegação); aqui entra só o modelo.
   */
  defaultModelCode?: ModelId
  /**
   * `false` desliga a persistência: nada é lido nem gravado no `AsyncStorage`, o provider já
   * nasce hidratado e a escolha vale só enquanto o app está aberto. Padrão: persiste.
   */
  storage?: false
}) {
  const systemScheme = useColorScheme()
  const listaDePaletas = palettesProp ?? paletteSeeds
  const persistir = storage !== false
  const [modelCode, setModelCodeState] = useState<ModelId>(defaultModelCode ?? DEFAULT_MODEL_CODE)
  const [paletteId, setPaletteIdState] = useState<string>(() => {
    const pedido = defaultPaletteId ?? DEFAULT_PALETTE_ID
    return listaDePaletas.some((seed) => seed.id === pedido) ? pedido : (listaDePaletas[0]?.id ?? pedido)
  })
  const [mode, setModeState] = useState<ColorMode>(DEFAULT_MODE)
  const [customSeeds, setCustomSeeds] = useState<PaletteSeeds | null>(null)
  const [hydratedLido, setHydrated] = useState(false)
  // Sem persistência não há o que hidratar: já nasce pronto (senão os setters ficam mudos e o testID nunca aparece).
  const hydrated = !persistir || hydratedLido

  useEffect(() => {
    if (!persistir) return
    let active = true
    // Leitura que rejeita: segue com o padrão, sem deixar `hydrated` preso em falso.
    AsyncStorage.getItem(STORAGE_KEY).catch(() => null).then((raw) => {
      if (!active) return
      if (raw) {
        const stored = parseStoredBrand(raw, listaDePaletas)
        if (stored) {
          setModelCodeState(stored.modelCode)
          setPaletteIdState(stored.paletteId)
          setModeState(stored.mode)
          if (stored.customSeeds) setCustomSeeds(stored.customSeeds)
        }
        // storage inválido: mantém o padrão T1/safira/system já em useState, sem bloquear hydrated.
      }
      setHydrated(true)
    })
    return () => { active = false }
    // A lista só vale na leitura inicial; mudar a referência depois não relê o armazenamento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistir])

  const persist = useCallback((next: Partial<StoredBrand>) => {
    const value: StoredBrand = {
      version: 1, modelCode, paletteId, mode, customSeeds: customSeeds ?? undefined, ...next,
    }
    if (persistir) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  }, [modelCode, paletteId, mode, customSeeds, persistir])

  const setModelCode = useCallback((code: ModelId) => {
    if (!hydrated) return
    setModelCodeState(code)
    persist({ modelCode: code })
  }, [hydrated, persist])

  const setPaletteId = useCallback((id: string | null) => {
    if (!hydrated) return
    const resolved = id ?? models[modelCode].brandId
    setCustomSeeds(null) // volta a uma paleta pronta: zera qualquer semente de cliente aplicada antes
    setPaletteIdState(resolved)
    persist({ paletteId: resolved, customSeeds: undefined })
  }, [hydrated, persist, modelCode])

  // Melhoria da validação: troca modelo e paleta juntos numa escrita só. `nextModel`/`nextPalette`
  // são calculados aqui fora, a partir do `modelCode`/`paletteId` já fechados pelo closure deste
  // callback (o mesmo valor que `persist` também fecha), em vez de dentro de uma função de
  // atualização (setState(prev => ...)): sob StrictMode, o React invoca a função de atualização
  // duas vezes para checar pureza, e uma função de atualização com efeito colateral (como o
  // `persist(...)` que uma versão anterior deste arquivo chamava lá dentro) rodaria/persistiria
  // duas vezes por render. Uma chamada a cada setter (com valor direto, não função) mais uma
  // chamada a `persist` fora de qualquer updater evita esse efeito colateral duplicado.
  const setModelAndPalette = useCallback((code: ModelId | undefined, paletteIdNext: string | undefined) => {
    if (!hydrated) return
    if (code === undefined && paletteIdNext === undefined) return
    const nextModel = code ?? modelCode
    const nextPalette = paletteIdNext ?? paletteId
    setCustomSeeds(null)
    setModelCodeState(nextModel)
    setPaletteIdState(nextPalette)
    persist({ modelCode: nextModel, paletteId: nextPalette, customSeeds: undefined })
  }, [hydrated, persist, modelCode, paletteId])

  const setMode = useCallback((next: ColorMode) => {
    if (!hydrated) return
    setModeState(next)
    persist({ mode: next })
  }, [hydrated, persist])

  const applyPalette = useCallback((seeds: PaletteSeeds) => {
    if (!hydrated) return
    registerPalette(seeds)
    setCustomSeeds(seeds)
    setPaletteIdState(seeds.id)
    persist({ paletteId: seeds.id, customSeeds: seeds })
  }, [hydrated, persist])

  const resolvedMode = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode

  const model = models[modelCode]
  // M5 (veredito Fable, Blocos 1 e 2): uma chave presente em `brandsProp` com valor `undefined`
  // (`brands={{ T1: undefined }}`) sobrescreveria o padrão interno via spread, deixando `brand`
  // `undefined` para o modelo ativo (quebra `BrandLogo`). Filtra antes de mesclar.
  const brandsPropDefinidos = Object.fromEntries(
    Object.entries(brandsProp ?? {}).filter(([, valor]) => valor !== undefined),
  ) as Partial<Record<ModelId, BrandConfig>>
  const marcas = { ...PADRAO_INTERNO, ...brandsPropDefinidos }
  const brand = marcas[modelCode]
  const labelStyle = brand.labelStyle ?? 'discreto'

  const activeSeeds = customSeeds ?? listaDePaletas.find((s) => s.id === paletteId) ?? listaDePaletas[0] ?? paletteSeeds[0]!
  const palette: Palette = useMemo(() => createPalette(activeSeeds), [activeSeeds])

  const themeVars = useMemo(() => buildThemeVars(model, palette, resolvedMode), [model, palette, resolvedMode])

  // Achado do Playwright (Tarefa 22/24): no export web, `RNModal` faz portal do conteúdo para
  // fora da árvore normal (createPortal
  // para `document.body`), então o `<View style={vars(themeVars)}>` abaixo (raiz do app) nunca é
  // ancestral real do conteúdo de `Modal`/`BottomSheet`; toda cor baseada em `var(--rendra-foreground)`
  // etc. fica inválida (variável CSS indefinida) dentro de qualquer overlay, caindo no preto
  // padrão do CSS. Corrigido replicando as mesmas variáveis também em `:root`
  // (`document.documentElement`), que é ancestral comum de toda porta, sem depender da árvore
  // React. No-op fora do web, onde `document` não existe (mesmo padrão de
  // `src/lib/use-document-title.ts`); sem teste de Jest possível pelo mesmo motivo (comprovado
  // só via `npm run test:a11y`/inspeção do DOM real do export web).
  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    for (const [key, val] of Object.entries(themeVars)) root.style.setProperty(key, val)
  }, [themeVars])

  const codigoDaPaleta = colorCodes.find((c) => c.palette === paletteId)?.code ?? paletteId.toUpperCase()

  const value = {
    brand, brands: Object.values(marcas), model, modelCode, setModelCode, setModelAndPalette,
    mode, resolvedMode, setMode, shape: model.shape, palette, paletteId, hydrated, themeVars,
    palettes: listaDePaletas.map((s) => ({ id: s.id, name: s.name, sidebarLogo: createPalette(s).sidebarLogo })),
    setPaletteId, applyPalette, sidebarLogoVariant: palette.sidebarLogo, labelStyle,
  }

  return (
    <BrandContext.Provider value={value}>
      <View
        testID={hydrated ? `rendra-${modelCode}-${codigoDaPaleta}` : undefined}
        style={vars(themeVars)}
        className="flex-1"
        dataSet={{ rendraRoot: paletteId, brand: model.brandId, shape: model.shape, label: labelStyle, palette: paletteId }}
      >
        {children}
      </View>
    </BrandContext.Provider>
  )
}
