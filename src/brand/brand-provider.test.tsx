import { render, renderHook, act, waitFor, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { BrandProvider } from './brand-provider'
import { useBrand } from './use-brand'
import { models } from '../theme/models'
import type { BrandConfig } from './types'

function wrapper({ children }: { children: React.ReactNode }) {
  return <BrandProvider>{children}</BrandProvider>
}

// Tarefa 2.5 (achado B7 do veredito do Opus): sonda que imprime `brands` (array do contexto)
// como JSON, para os testes novos afirmarem o conteúdo real sem depender de inspecionar props
// internas do provider.
function SondaBrands() {
  const { brands } = useBrand()
  return <Text testID="brands">{JSON.stringify(brands)}</Text>
}

// Tarefa 4.2 (Sincronizacao 1, item C1 do levantamento, achado B3 do veredito do Opus): marca
// mínima com todos os campos obrigatórios de `BrandConfig` (src/brand/types.ts), para os testes
// de `labelStyle` sem depender da marca de demonstração (`brand.config.ts`, que fica só em `app/`).
const brandMinimo: BrandConfig = {
  id: 't', productName: 'Teste', companyName: 'Teste', tagline: 'x', shape: 'square', sidebarLogo: 'dark',
}

function SondaLabelStyle() {
  const { labelStyle } = useBrand()
  return <Text testID="label-style">{labelStyle}</Text>
}

describe('useBrand', () => {
  beforeEach(() => AsyncStorage.clear())

  it('lança fora do provider, com a mensagem exata do contrato', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    await expect(renderHook(() => useBrand())).rejects.toThrow('useBrand precisa estar dentro de <BrandProvider>.')
  })

  it('padrão é T1/safira/system', async () => {
    const { result } = await renderHook(() => useBrand(), { wrapper })
    await waitFor(() => expect(result.current.hydrated).toBe(true))
    expect(result.current.modelCode).toBe('T1')
    expect(result.current.paletteId).toBe('safira')
  })

  it('se a leitura do armazenamento rejeitar, hidrata mesmo assim com o padrão T1/safira', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('storage indisponível'))
    const { result } = await renderHook(() => useBrand(), { wrapper })
    await waitFor(() => expect(result.current.hydrated).toBe(true))
    expect(result.current.modelCode).toBe('T1')
    expect(result.current.paletteId).toBe('safira')
  })

  it('trocar modelo muda themeVars[--rendra-shape-control] de verdade, 0px -> 28px (Review Focus 3)', async () => {
    const { result } = await renderHook(() => useBrand(), { wrapper })
    await waitFor(() => expect(result.current.hydrated).toBe(true))
    expect(result.current.themeVars['--rendra-shape-control']).toBe('0px')
    await act(async () => result.current.setModelCode('T3'))
    await waitFor(() => expect(result.current.themeVars['--rendra-shape-control']).toBe('28px'))
  })

  it('trocar paleta muda themeVars[--rendra-primary] de verdade (acesso --kebab, bloqueadora C1)', async () => {
    const { result } = await renderHook(() => useBrand(), { wrapper })
    await waitFor(() => expect(result.current.hydrated).toBe(true))
    const before = result.current.themeVars['--rendra-primary']
    await act(async () => result.current.setPaletteId('aurora'))
    await waitFor(() => expect(result.current.themeVars['--rendra-primary']).not.toBe(before))
  })

  it('trocar modo muda themeVars[--rendra-shadow-opacity-sm] de verdade, 0.06 -> 0.3', async () => {
    const { result } = await renderHook(() => useBrand(), { wrapper })
    await waitFor(() => expect(result.current.hydrated).toBe(true))
    expect(result.current.themeVars['--rendra-shadow-opacity-sm']).toBe('0.06')
    await act(async () => result.current.setMode('dark'))
    await waitFor(() => expect(result.current.themeVars['--rendra-shadow-opacity-sm']).toBe('0.3'))
    expect(result.current.resolvedMode).toBe('dark')
  })

  it('persiste: grava, desmonta, remonta e lê o valor salvo', async () => {
    const first = await renderHook(() => useBrand(), { wrapper })
    await waitFor(() => expect(first.result.current.hydrated).toBe(true))
    await act(async () => first.result.current.setModelCode('T2'))
    await waitFor(() => expect(first.result.current.modelCode).toBe('T2'))
    await first.unmount()

    const second = await renderHook(() => useBrand(), { wrapper })
    await waitFor(() => expect(second.result.current.hydrated).toBe(true))
    expect(second.result.current.modelCode).toBe('T2')
  })

  it('applyPalette registra uma paleta customizada sem tocar em DOM', async () => {
    const { result } = await renderHook(() => useBrand(), { wrapper })
    await waitFor(() => expect(result.current.hydrated).toBe(true))
    await act(async () =>
      result.current.applyPalette({
        id: 'cliente', name: 'Cliente',
        primary: '#ffcc00', primaryHover: '#e6b800',
        secondary: '#ff6699', secondaryHover: '#e0507f',
        gradient: ['#ffe680', '#ffcc00', '#b38f00'],
      }),
    )
    await waitFor(() => expect(result.current.paletteId).toBe('cliente'))
    expect(result.current.palette.light['--rendra-primary']).toBe('#ffcc00')
  })

  it('testID da raiz combina modelCode e código da paleta ativa, só depois de hydrated (Tarefa B16)', async () => {
    await renderHook(() => useBrand(), { wrapper })
    await waitFor(() => expect(screen.getByTestId('rendra-T1-C1')).toBeTruthy())
  })

  it('hidrata no padrão T1/safira/system quando o storage tem JSON inválido (correção pós-validação)', async () => {
    await AsyncStorage.setItem('rendra:brand', '{lixo')
    const { result } = await renderHook(() => useBrand(), { wrapper })
    await waitFor(() => expect(result.current.hydrated).toBe(true))
    expect(result.current.modelCode).toBe('T1')
    expect(result.current.paletteId).toBe('safira')
    expect(screen.getByTestId('rendra-T1-C1')).toBeTruthy()
  })

  it('hidrata no padrão T1/safira/system quando modelCode do storage não existe (correção pós-validação)', async () => {
    await AsyncStorage.setItem(
      'rendra:brand',
      JSON.stringify({ modelCode: 'T9', paletteId: 'safira', mode: 'system' }),
    )
    const { result } = await renderHook(() => useBrand(), { wrapper })
    await waitFor(() => expect(result.current.hydrated).toBe(true))
    expect(result.current.modelCode).toBe('T1')
    expect(result.current.paletteId).toBe('safira')
    expect(screen.getByTestId('rendra-T1-C1')).toBeTruthy()
  })

  it('setPaletteId depois de applyPalette isola: volta à paleta pronta, sem customSeeds no storage (correção pós-validação)', async () => {
    const { result } = await renderHook(() => useBrand(), { wrapper })
    await waitFor(() => expect(result.current.hydrated).toBe(true))
    await act(async () =>
      result.current.applyPalette({
        id: 'cliente', name: 'Cliente',
        primary: '#ffcc00', primaryHover: '#e6b800',
        secondary: '#ff6699', secondaryHover: '#e0507f',
        gradient: ['#ffe680', '#ffcc00', '#b38f00'],
      }),
    )
    await waitFor(() => expect(result.current.paletteId).toBe('cliente'))

    await act(async () => result.current.setPaletteId('safira'))
    await waitFor(() => expect(result.current.paletteId).toBe('safira'))
    expect(result.current.palette.light['--rendra-primary']).toBe('#0b6fe0')

    const raw = await AsyncStorage.getItem('rendra:brand')
    const stored = JSON.parse(raw!)
    expect(stored.customSeeds).toBeUndefined()
  })

  it('hidrata no padrão T1/safira/system quando paletteId do storage não existe e não há customSeeds (correção pós-validação)', async () => {
    await AsyncStorage.setItem(
      'rendra:brand',
      JSON.stringify({ modelCode: 'T2', paletteId: 'inexistente', mode: 'system' }),
    )
    const { result } = await renderHook(() => useBrand(), { wrapper })
    await waitFor(() => expect(result.current.hydrated).toBe(true))
    expect(result.current.modelCode).toBe('T1')
    expect(result.current.paletteId).toBe('safira')
  })
})

describe('BrandProvider: customSeeds inválido em rendra:brand', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
  })

  it('descarta customSeeds vazio e volta para a paleta padrão do modelo', async () => {
    await AsyncStorage.setItem(
      'rendra:brand',
      JSON.stringify({ version: 1, modelCode: 'T1', mode: 'system', paletteId: 'x', customSeeds: {} }),
    )
    const { result } = await renderHook(() => useBrand(), { wrapper })
    await waitFor(() => expect(result.current.hydrated).toBe(true))
    expect(result.current.paletteId).toBe('safira')
  })

  it('aceita customSeeds com a forma completa de PaletteSeeds', async () => {
    const validSeeds = {
      id: 'cliente',
      name: 'Cliente',
      primary: '#ffcc00',
      primaryHover: '#e6b800',
      secondary: '#ff6699',
      secondaryHover: '#e0507f',
      gradient: ['#ffe680', '#ffcc00', '#b38f00'],
    }
    await AsyncStorage.setItem(
      'rendra:brand',
      JSON.stringify({ version: 1, modelCode: 'T1', mode: 'system', paletteId: 'cliente', customSeeds: validSeeds }),
    )
    const { result } = await renderHook(() => useBrand(), { wrapper })
    await waitFor(() => expect(result.current.hydrated).toBe(true))
    expect(result.current.paletteId).toBe('cliente')
  })
})

describe('BrandProvider: prop brands opcional (Tarefa 2.5, achado B7 do veredito do Opus)', () => {
  it('sem prop brands, usa um padrao interno minimo derivado de models (nome do produto, sem logotipo, nunca a marca de demonstracao)', async () => {
    const { getByTestId } = await render(
      <BrandProvider>
        <SondaBrands />
      </BrandProvider>,
    )
    const brands = JSON.parse(getByTestId('brands').props.children) as { companyName: string }[]
    // M1 (veredito Fable, Blocos 1 e 2): a asserção anterior (só productName do T1) passaria
    // igual com brand.config.ts (marca de demonstração, "Rendra"), porque os dois usam
    // models.T1.productName. Afirma os três nomes e a ausência real de "Rendra".
    expect(brands.map((b) => b.companyName)).toEqual([
      models.T1.productName,
      models.T2.productName,
      models.T3.productName,
    ])
    expect(brands.some((b) => b.companyName === 'Rendra')).toBe(false)
  })

  it('chave presente em brands com valor undefined nao sobrescreve o padrao interno (M5, veredito Fable)', async () => {
    const { getByTestId } = await render(
      <BrandProvider brands={{ T1: undefined }}>
        <SondaBrands />
      </BrandProvider>,
    )
    const brands = JSON.parse(getByTestId('brands').props.children) as { id: string; companyName: string }[]
    expect(brands).toHaveLength(3)
    expect(brands.find((b) => b.id === models.T1.brandId)?.companyName).toBe(models.T1.productName)
  })

  it('com prop brands, mescla com o padrao interno (marca de demonstracao continua funcionando)', async () => {
    const brandsDeTeste = {
      T1: {
        id: 'teste',
        productName: 'Teste App',
        companyName: 'Teste',
        tagline: 'x',
        shape: 'square' as const,
        sidebarLogo: 'dark' as const,
      },
    }
    const { getByTestId } = await render(
      <BrandProvider brands={brandsDeTeste}>
        <SondaBrands />
      </BrandProvider>,
    )
    const brands = JSON.parse(getByTestId('brands').props.children) as { id: string; companyName: string }[]
    expect(brands).toHaveLength(3)
    expect(brands.find((b) => b.companyName === 'Teste')).toBeTruthy()
    // M1: os modelos não sobrescritos continuam vindo do padrão interno, nunca da marca de
    // demonstração ("Rendra").
    expect(brands.find((b) => b.id === models.T2.brandId)?.companyName).toBe(models.T2.productName)
  })
})

describe('BrandProvider: labelStyle (Tarefa 4.2, item C1 e risco R8 do levantamento)', () => {
  it('useBrand().labelStyle é "discreto" por padrão, sem prop brands', async () => {
    const { findByTestId } = await render(
      <BrandProvider>
        <SondaLabelStyle />
      </BrandProvider>,
    )
    expect((await findByTestId('label-style')).props.children).toBe('discreto')
  })

  it('com brands informando labelStyle "normal", useBrand() repassa', async () => {
    const brands = { T1: { ...brandMinimo, labelStyle: 'normal' as const } }
    const { findByTestId } = await render(
      <BrandProvider brands={brands}>
        <SondaLabelStyle />
      </BrandProvider>,
    )
    expect((await findByTestId('label-style')).props.children).toBe('normal')
  })
})

describe('BrandProvider: dataSet.label (Tarefa 4.3, item C2 do levantamento)', () => {
  it('a View raiz do provider carrega dataSet.label igual ao labelStyle ativo', async () => {
    const { findByTestId } = await render(
      <BrandProvider>
        <Text>x</Text>
      </BrandProvider>,
    )
    expect((await findByTestId(/^rendra-/)).props.dataSet).toMatchObject({ label: 'discreto' })
  })
})

describe('BrandProvider: rendraRoot (Tarefa 6.4, secao 3.2 item 4 do levantamento)', () => {
  it('a View raiz do provider carrega dataSet.rendraRoot, brand, shape e palette, ao lado de label', async () => {
    const { findByTestId } = await render(
      <BrandProvider>
        <Text>x</Text>
      </BrandProvider>,
    )
    expect((await findByTestId(/^rendra-/)).props.dataSet).toMatchObject({
      rendraRoot: expect.any(String),
      brand: expect.any(String),
      shape: expect.any(String),
      label: 'discreto',
      palette: expect.any(String),
    })
  })
})

// Item 8 (app-correcoes): palettes, defaultPaletteId, defaultModelCode e storage={false}.
const paletaDoCliente = {
  id: 'cliente',
  name: 'Cliente',
  primary: '#ffcc00',
  primaryHover: '#e6b800',
  secondary: '#ff6699',
  secondaryHover: '#e0507f',
  gradient: ['#ffe680', '#ffcc00', '#b38f00'] as [string, string, string],
}
const outraPaleta = { ...paletaDoCliente, id: 'outra', name: 'Outra', primary: '#0b6bcb', primaryHover: '#0a5bb0' }

// Guarda o que cada render do provider entregou, para afirmar a PRIMEIRA pintura, não só o estado final.
function Gravador({ vistos }: { vistos: { modelCode: string; paletteId: string; hydrated: boolean }[] }) {
  const { modelCode, paletteId, hydrated } = useBrand()
  vistos.push({ modelCode, paletteId, hydrated })
  return null
}

describe('BrandProvider: defaultModelCode e defaultPaletteId', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
    jest.restoreAllMocks()
  })

  it('o PRIMEIRO render já usa o modelo e a paleta padrão passados', async () => {
    const vistos: { modelCode: string; paletteId: string; hydrated: boolean }[] = []
    await render(
      <BrandProvider defaultModelCode="T2" defaultPaletteId="aurora">
        <Gravador vistos={vistos} />
      </BrandProvider>,
    )
    expect(vistos[0]).toEqual({ modelCode: 'T2', paletteId: 'aurora', hydrated: false })
    await waitFor(() => expect(vistos.at(-1)!.hydrated).toBe(true))
    expect(vistos.at(-1)).toMatchObject({ modelCode: 'T2', paletteId: 'aurora' })
  })

  it('uma escolha salva no armazenamento vence o padrão depois de hidratar', async () => {
    await AsyncStorage.setItem(
      'rendra:brand',
      JSON.stringify({ version: 1, modelCode: 'T3', paletteId: 'ardosia', mode: 'dark' }),
    )
    const { result } = await renderHook(() => useBrand(), {
      wrapper: ({ children }) => (
        <BrandProvider defaultModelCode="T2" defaultPaletteId="aurora">
          {children}
        </BrandProvider>
      ),
    })
    await waitFor(() => expect(result.current.hydrated).toBe(true))
    expect(result.current.modelCode).toBe('T3')
    expect(result.current.paletteId).toBe('ardosia')
  })

  it('id desconhecido em defaultPaletteId cai na primeira paleta da lista', async () => {
    const { result } = await renderHook(() => useBrand(), {
      wrapper: ({ children }) => <BrandProvider defaultPaletteId="nao-existe">{children}</BrandProvider>,
    })
    expect(result.current.paletteId).toBe('safira')
    await waitFor(() => expect(result.current.hydrated).toBe(true))
    expect(result.current.paletteId).toBe('safira')
  })
})

describe('BrandProvider: palettes próprias', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
    jest.restoreAllMocks()
  })
  const comPaletas = ({ children }: { children: React.ReactNode }) => (
    <BrandProvider palettes={[paletaDoCliente, outraPaleta]} defaultPaletteId="outra">
      {children}
    </BrandProvider>
  )

  it('substitui as quatro prontas: useBrand().palettes reflete a lista e a ativa vem dela', async () => {
    const { result } = await renderHook(() => useBrand(), { wrapper: comPaletas })
    await waitFor(() => expect(result.current.hydrated).toBe(true))
    expect(result.current.palettes.map((p) => p.id)).toEqual(['cliente', 'outra'])
    expect(result.current.paletteId).toBe('outra')
    expect(result.current.palette.light['--rendra-primary']).toBe('#0b6bcb')
  })

  it('sem defaultPaletteId, a primeira paleta da lista é a ativa', async () => {
    const { result } = await renderHook(() => useBrand(), {
      wrapper: ({ children }) => <BrandProvider palettes={[paletaDoCliente, outraPaleta]}>{children}</BrandProvider>,
    })
    expect(result.current.paletteId).toBe('cliente')
    expect(result.current.palette.light['--rendra-primary']).toBe('#ffcc00')
  })

  it('o código da paleta própria é o id em maiúsculas (fora de C1 a C4)', async () => {
    await render(
      <BrandProvider palettes={[paletaDoCliente]}>
        <Text>x</Text>
      </BrandProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('rendra-T1-CLIENTE')).toBeTruthy())
  })

  it('paleta salva que não está na lista passada é ignorada: volta ao padrão da lista', async () => {
    await AsyncStorage.setItem('rendra:brand', JSON.stringify({ version: 1, modelCode: 'T1', paletteId: 'safira', mode: 'system' }))
    const { result } = await renderHook(() => useBrand(), { wrapper: comPaletas })
    await waitFor(() => expect(result.current.hydrated).toBe(true))
    expect(result.current.paletteId).toBe('outra')
  })

  it('paleta salva que está na lista passada é aceita', async () => {
    await AsyncStorage.setItem('rendra:brand', JSON.stringify({ version: 1, modelCode: 'T1', paletteId: 'cliente', mode: 'system' }))
    const { result } = await renderHook(() => useBrand(), { wrapper: comPaletas })
    await waitFor(() => expect(result.current.paletteId).toBe('cliente'))
  })
})

describe('BrandProvider: storage={false}', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
    jest.restoreAllMocks()
    // O mock do AsyncStorage já é jest.fn: o spyOn devolve o mesmo, com as chamadas dos testes anteriores.
    for (const metodo of [AsyncStorage.getItem, AsyncStorage.setItem, AsyncStorage.removeItem]) (metodo as jest.Mock).mockClear()
  })
  const semStorage = ({ children }: { children: React.ReactNode }) => <BrandProvider storage={false}>{children}</BrandProvider>

  it('nunca lê nem grava no AsyncStorage, mesmo trocando modelo, modo e paleta', async () => {
    const getItem = jest.spyOn(AsyncStorage, 'getItem')
    const setItem = jest.spyOn(AsyncStorage, 'setItem')
    const removeItem = jest.spyOn(AsyncStorage, 'removeItem')
    const { result } = await renderHook(() => useBrand(), { wrapper: semStorage })
    await act(async () => result.current.setModelCode('T2'))
    await act(async () => result.current.setMode('dark'))
    await act(async () => result.current.setPaletteId('aurora'))
    await act(async () => result.current.applyPalette(paletaDoCliente))
    expect(getItem).not.toHaveBeenCalled()
    expect(setItem).not.toHaveBeenCalled()
    expect(removeItem).not.toHaveBeenCalled()
  })

  it('hidratado de imediato: o testID da raiz aparece no primeiro render e os setters funcionam', async () => {
    const vistos: { modelCode: string; paletteId: string; hydrated: boolean }[] = []
    await render(
      <BrandProvider storage={false}>
        <Gravador vistos={vistos} />
      </BrandProvider>,
    )
    expect(vistos[0]!.hydrated).toBe(true)
    expect(screen.getByTestId('rendra-T1-C1')).toBeTruthy()
  })

  it('applyPalette muda a paleta ativa sem gravar nada', async () => {
    const setItem = jest.spyOn(AsyncStorage, 'setItem')
    const { result } = await renderHook(() => useBrand(), { wrapper: semStorage })
    await act(async () => result.current.applyPalette(paletaDoCliente))
    expect(result.current.paletteId).toBe('cliente')
    expect(result.current.palette.light['--rendra-primary']).toBe('#ffcc00')
    expect(setItem).not.toHaveBeenCalled()
  })

  it('o que já estava salvo no armazenamento não é lido: vale o padrão passado', async () => {
    await AsyncStorage.setItem('rendra:brand', JSON.stringify({ version: 1, modelCode: 'T3', paletteId: 'ardosia', mode: 'dark' }))
    const { result } = await renderHook(() => useBrand(), {
      wrapper: ({ children }) => (
        <BrandProvider storage={false} defaultModelCode="T2">
          {children}
        </BrandProvider>
      ),
    })
    expect(result.current.modelCode).toBe('T2')
    expect(result.current.paletteId).toBe('safira')
  })
})
