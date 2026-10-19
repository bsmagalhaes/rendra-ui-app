import { render } from '@testing-library/react-native'
import { useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { BrandContext, BrandProvider, useBrand } from '../../brand'
import type { BrandContextValue } from '../../brand'
import { brandConfigs } from '../../brand/brand.config'
import { models } from '../../theme/models'
import { nodesWithCode } from '../../test-utils/rendra-code'
import { BrandLogo, tileBgClass, tileColorClass } from './brand-logo'

function TrocaParaAurora() {
  const { setModelCode, hydrated } = useBrand()
  useEffect(() => {
    if (hydrated) setModelCode('T3')
  }, [hydrated, setModelCode])
  return null
}

describe('BrandLogo', () => {
  // Global Constraints do plano (linha 41): teste que envolve persistência limpa o AsyncStorage
  // antes de cada caso. O caso T3 desta suíte troca o modelo (setModelCode persiste no storage
  // mockado); sem limpar, os casos seguintes hidratam com T3 em vez de T1/Safira (achado próprio
  // desta execução).
  beforeEach(async () => {
    await AsyncStorage.clear()
  })

  it('mostra a palavra dividida (Rendra Safira)', async () => {
    const { findByText } = await render(<BrandProvider><BrandLogo /></BrandProvider>)
    expect(await findByText('Rendra')).toBeTruthy()
    expect(await findByText('Safira')).toBeTruthy()
  })

  it('em T3, a segunda palavra muda para Aurora', async () => {
    const { findByText } = await render(
      <BrandProvider><TrocaParaAurora /><BrandLogo /></BrandProvider>,
    )
    // C7 (veredito do Opus): `findByText` já espera; `waitFor` em volta era redundante e
    // deixava um import sem uso reprovando o lint.
    expect(await findByText('Aurora')).toBeTruthy()
  })

  it('symbolOnly esconde o texto e expoe accessibilityLabel no selo', async () => {
    const { queryByText, findByRole } = await render(
      <BrandProvider><BrandLogo symbolOnly /></BrandProvider>,
    )
    expect(queryByText('Rendra')).toBeNull()
    expect(await findByRole('img', { name: 'Rendra Safira' })).toBeTruthy()
  })

  it('sem symbolOnly, o selo nao tem papel de imagem (decorativo)', async () => {
    const { queryByRole } = await render(<BrandProvider><BrandLogo /></BrandProvider>)
    expect(queryByRole('img')).toBeNull()
  })

  it('on="sidebar" aplica bg-sidebar-indicator no selo e text-sidebar no simbolo (mapas separados)', async () => {
    // B2 (Fable, validacao da entrega): react-native-svg so resolve `currentColor` a partir do
    // proprio Svg (RenderableView.getCurrentColor, so sobe por elementos SVG); antes desta
    // correcao, a classe de cor estava só no View do selo (tileClass unico), e o Svg nunca a
    // recebia, entao o simbolo ficava preto no nativo. Os dois mapas agora sao exportados e
    // aplicados a nos diferentes: tileBgClass no View do selo, tileColorClass no Svg/simbolo
    // (mesmo precedente de `colorClass` em brand-feedback-icon.tsx, onde className nao e
    // observavel no Svg depois do cssInterop).
    expect(tileBgClass.sidebar).toBe('bg-sidebar-indicator')
    expect(tileColorClass.sidebar).toBe('text-sidebar')
    expect(tileBgClass.sidebar).not.toContain('text-')
    const { findByTestId } = await render(
      <BrandProvider><BrandLogo on="sidebar" testID="logo" /></BrandProvider>,
    )
    // B7 (veredito do Opus): o selo decorativo (sem symbolOnly) é aria-hidden; o RNTL exclui
    // nós ocultos por padrão.
    expect((await findByTestId('logo-selo', { includeHiddenElements: true })).props.className.split(' ')).toEqual(
      expect.arrayContaining(['bg-sidebar-indicator']),
    )
    expect(await findByTestId('logo-simbolo', { includeHiddenElements: true })).toBeTruthy()
  })

  it('size sm usa size-6; size md (padrao) usa size-8', async () => {
    const { findByTestId, rerender } = await render(
      <BrandProvider><BrandLogo size="sm" testID="logo" /></BrandProvider>,
    )
    expect((await findByTestId('logo-selo', { includeHiddenElements: true })).props.className).toContain('size-6')
    await rerender(<BrandProvider><BrandLogo testID="logo" /></BrandProvider>)
    expect((await findByTestId('logo-selo', { includeHiddenElements: true })).props.className).toContain('size-8')
  })

  it('sem brand.symbol, mostra o simbolo generico interno', async () => {
    const { findByTestId } = await render(<BrandProvider><BrandLogo testID="logo" /></BrandProvider>)
    expect(await findByTestId('logo-simbolo', { includeHiddenElements: true })).toBeTruthy()
  })

  // M2 (veredito do Fable, validacao da entrega): o caso do B2 (linha 60-72 acima) so afirma os
  // mapas exportados (`tileColorClass.sidebar`), que passam mesmo que `tileColorClass[on]` seja
  // removido do `className` do `brand.symbol` em brand-logo.tsx:73 (ramo nao coberto pelo
  // precedente de brand-feedback-icon.test.tsx, que so vale para o ramo Svg, onde o cssInterop
  // consome o className). Aqui um componente espiao (jest.fn) no lugar de `brand.symbol` recebe
  // `className` como prop comum (sem cssInterop aplicado a componentes de marca custom), entao o
  // efeito real e observavel: usa BrandContext.Provider direto (sem passar por BrandProvider,
  // cujos brandConfigs reais nao tem `symbol`) com uma BrandConfig de teste.
  it('com brand.symbol definido, o simbolo recebe tileColorClass[on] e size-full via className (M2, veredito Fable)', async () => {
    const simboloEspiao = jest.fn((_props: { className?: string }) => null)
    const value = {
      brand: { ...brandConfigs.T1, symbol: simboloEspiao },
    } as unknown as BrandContextValue
    await render(
      // symbolOnly: evita renderizar a palavra da marca (Text interno usa `model.fontFamily`,
      // que este contexto de teste minimo, so com `brand`, nao fornece; o simbolo em si nao
      // depende de `model`).
      <BrandContext.Provider value={value}>
        <BrandLogo on="sidebar" symbolOnly />
      </BrandContext.Provider>,
    )
    expect(simboloEspiao).toHaveBeenCalled()
    const props = simboloEspiao.mock.calls[0]?.[0] as { className?: string }
    expect(props.className?.split(' ')).toEqual(
      expect.arrayContaining(['size-full', tileColorClass.sidebar]),
    )
  })

  it('carrega dataSet.rendra = LOGO-001 na raiz (item D12 do levantamento da Sincronizacao 1)', async () => {
    const { container } = await render(<BrandProvider><BrandLogo /></BrandProvider>)
    expect(nodesWithCode(container, 'LOGO-001')).toHaveLength(1)
  })

  describe('arte oficial (logoMode "image" com brand.logo)', () => {
    // Logotipos falsos recebem as props de verdade (className, preserveAspectRatio, acessibilidade).
    const logoClaro = jest.fn((_props: Record<string, unknown>) => null)
    const logoEscuro = jest.fn((_props: Record<string, unknown>) => null)
    const comArte = (extra: Partial<BrandContextValue> = {}, brand: Record<string, unknown> = {}) =>
      ({
        brand: { ...brandConfigs.T1, logoMode: 'image', logo: { light: logoClaro, dark: logoEscuro }, ...brand },
        model: models.T1,
        resolvedMode: 'light',
        sidebarLogoVariant: 'dark',
        ...extra,
      }) as unknown as BrandContextValue
    const montar = (value: BrandContextValue, props: Parameters<typeof BrandLogo>[0] = {}) =>
      render(
        <BrandContext.Provider value={value}>
          <BrandLogo {...props} />
        </BrandContext.Provider>,
      )
    beforeEach(() => {
      logoClaro.mockClear()
      logoEscuro.mockClear()
    })

    it('modo claro, sobre a superfície: desenha a arte "light", como imagem com o nome do produto', async () => {
      const { findByRole } = await montar(comArte(), { on: 'surface' })
      expect(await findByRole('img', { name: brandConfigs.T1.productName })).toBeTruthy()
      expect(logoClaro).toHaveBeenCalled()
      expect(logoEscuro).not.toHaveBeenCalled()
    })

    it('modo escuro: desenha a arte "dark"', async () => {
      await montar(comArte({ resolvedMode: 'dark' }), { on: 'surface' })
      expect(logoEscuro).toHaveBeenCalled()
      expect(logoClaro).not.toHaveBeenCalled()
    })

    it('on="brand" (sobre o degradê) usa sempre a "dark", mesmo no modo claro', async () => {
      await montar(comArte(), { on: 'brand' })
      expect(logoEscuro).toHaveBeenCalled()
      expect(logoClaro).not.toHaveBeenCalled()
    })

    it('on="sidebar" segue sidebarLogoVariant', async () => {
      await montar(comArte({ sidebarLogoVariant: 'light' } as Partial<BrandContextValue>), { on: 'sidebar' })
      expect(logoClaro).toHaveBeenCalled()
      expect(logoEscuro).not.toHaveBeenCalled()
    })

    it('o tamanho vem de classe da escala (h-8 w-24) e de preserveAspectRatio, nunca de style', async () => {
      await montar(comArte())
      const props = logoClaro.mock.calls[0]![0] as { className?: string; style?: unknown; preserveAspectRatio?: string }
      expect(props.className?.split(' ')).toEqual(expect.arrayContaining(['h-8', 'w-24']))
      expect(props.preserveAspectRatio).toBe('xMinYMid meet')
      expect(props.style).toBeUndefined()
    })

    it('carrega o código LOGO-001 uma vez só', async () => {
      const { container } = await montar(comArte())
      expect(nodesWithCode(container, 'LOGO-001')).toHaveLength(1)
    })

    it('symbolOnly cai no desenho atual (selo), sem a arte oficial', async () => {
      const { findByRole } = await montar(comArte(), { symbolOnly: true })
      expect(await findByRole('img', { name: brandConfigs.T1.productName })).toBeTruthy()
      expect(logoClaro).not.toHaveBeenCalled()
      expect(logoEscuro).not.toHaveBeenCalled()
    })

    it('logoMode "themed" ou sem brand.logo mantém o desenho atual (selo e palavra)', async () => {
      const themed = await montar(comArte({}, { logoMode: 'themed' }))
      expect(themed.queryByRole('img')).toBeNull()
      expect(logoClaro).not.toHaveBeenCalled()
      await themed.unmount()
      const semLogo = await montar(comArte({}, { logo: undefined }))
      expect(semLogo.queryByRole('img')).toBeNull()
      expect(logoClaro).not.toHaveBeenCalled()
    })
  })
})
