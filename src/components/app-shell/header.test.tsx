import { StyleSheet, Text } from 'react-native'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as SafeAreaContext from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { BrandProvider } from '../../brand/brand-provider'
import { useBrand } from '../../brand/use-brand'
import { RendraNavigationProvider, type RendraNavigationValue } from '../../navigation/rendra-navigation'
import { navComPagina } from '../../test-utils/shell-fixtures'
import { Header } from './header'
import { ShellProvider, useShell, type ShellProviderProps } from './shell-context'

function SondaMenu() {
  const { mobileNavOpen } = useShell()
  return <Text testID="menu-aberto">{String(mobileNavOpen)}</Text>
}

function SondaMarca() {
  const { brand } = useBrand()
  return <Text testID="marca">{brand.productName}</Text>
}

function DefinirMeta({ title, help }: { title?: string; help?: string }) {
  const { setPageMeta } = useShell()
  useEffect(() => {
    setPageMeta({ title, help })
    return () => setPageMeta(null)
  }, [setPageMeta, title, help])
  return null
}

function montar(
  navegacao: Partial<RendraNavigationValue>,
  opcoes: { shell?: Partial<ShellProviderProps>; extra?: ReactNode } = {},
) {
  return render(
    <BrandProvider>
      <RendraNavigationProvider value={{ navigate: jest.fn(), ...navegacao }}>
        <ShellProvider navigation={navComPagina} {...opcoes.shell}>
          <Header />
          <SondaMenu />
          <SondaMarca />
          {opcoes.extra}
        </ShellProvider>
      </RendraNavigationProvider>
    </BrandProvider>,
  )
}

beforeEach(async () => {
  await AsyncStorage.clear()
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('Header do AppShell', () => {
  it('mostra o título do destino ativo em text-base', async () => {
    const tela = await montar({ currentPath: '/paginas' })
    const titulo = await tela.findByText('Páginas')
    expect(titulo.props.className.split(' ')).toContain('text-base')
  })

  it('sem destino ativo, o título é o nome do produto', async () => {
    const tela = await montar({ currentPath: '/desconhecida' })
    const nome = (await tela.findByTestId('marca')).props.children as string
    const titulos = await tela.findAllByText(nome)
    expect(titulos.some((t) => String(t.props.className).includes('text-base'))).toBe(true)
  })

  it('o título enviado pela tela (setPageMeta) vence o do destino ativo', async () => {
    const tela = await montar({ currentPath: '/paginas' }, { extra: <DefinirMeta title="Minha tela" /> })
    expect(await tela.findByText('Minha tela')).toBeTruthy()
    expect(tela.queryByText('Páginas')).toBeNull()
  })

  it('mostra a ajuda da tela como InfoHint ao lado do título', async () => {
    const tela = await montar({ currentPath: '/paginas' }, { extra: <DefinirMeta title="Minha tela" help="Ajuda da tela" /> })
    await fireEvent.press(await tela.findByRole('button', { name: 'Sobre: Minha tela' }))
    expect(await tela.findByText('Ajuda da tela')).toBeTruthy()
  })

  it('em rota de segundo nível mostra a seta e chama goBack quando há histórico', async () => {
    const goBack = jest.fn()
    const navigate = jest.fn()
    const tela = await montar({ currentPath: '/paginas/acoes', goBack, canGoBack: () => true, navigate })
    await fireEvent.press(await tela.findByRole('button', { name: 'Voltar para Páginas' }))
    expect(goBack).toHaveBeenCalledTimes(1)
    expect(navigate).not.toHaveBeenCalled()
  })

  it('sem histórico, a seta navega para o item pai', async () => {
    const goBack = jest.fn()
    const navigate = jest.fn()
    const tela = await montar({ currentPath: '/paginas/acoes', goBack, canGoBack: () => false, navigate })
    await fireEvent.press(await tela.findByRole('button', { name: 'Voltar para Páginas' }))
    expect(navigate).toHaveBeenCalledWith('/paginas')
    expect(goBack).not.toHaveBeenCalled()
  })

  it('no destino de primeiro nível não há seta de voltar', async () => {
    const tela = await montar({ currentPath: '/paginas' })
    await tela.findByText('Páginas')
    expect(tela.queryByRole('button', { name: /Voltar para/ })).toBeNull()
  })

  it('com a barra inferior ligada, o cabeçalho não tem botão de menu', async () => {
    const tela = await montar({ currentPath: '/paginas' })
    await waitFor(async () => expect(await tela.findByTestId('menu-aberto')).toBeTruthy())
    expect(tela.queryByRole('button', { name: 'Abrir menu' })).toBeNull()
  })

  it('sem barra inferior (N3), o botão de menu do cabeçalho abre o menu', async () => {
    const tela = await montar({ currentPath: '/paginas' }, { shell: { layout: { bottomNav: false } } })
    await fireEvent.press(await tela.findByRole('button', { name: 'Abrir menu' }))
    expect((await tela.findByTestId('menu-aberto')).props.children).toBe('true')
  })

  it('com usuário, o avatar à direita abre o menu do usuário', async () => {
    const tela = await montar({ currentPath: '/paginas' }, { shell: { user: { name: 'Ana Ribeiro', email: 'ana@exemplo.com' } } })
    await fireEvent.press(await tela.findByRole('button', { name: 'Menu de Ana Ribeiro' }))
    expect(await tela.findByText('ana@exemplo.com')).toBeTruthy()
  })

  it('sem usuário não há menu do usuário', async () => {
    const tela = await montar({ currentPath: '/paginas' })
    await tela.findByText('Páginas')
    expect(tela.queryByRole('button', { name: /Menu de/ })).toBeNull()
  })

  it('o cabeçalho é dono do inset superior: paddingTop igual a insets.top', async () => {
    jest.spyOn(SafeAreaContext, 'useSafeAreaInsets').mockReturnValue({ top: 24, bottom: 0, left: 0, right: 0 })
    const tela = await montar({ currentPath: '/paginas' })
    const cabecalho = await tela.findByTestId('shell-cabecalho')
    expect(StyleSheet.flatten(cabecalho.props.style)).toMatchObject({ paddingTop: 24 })
  })
})

describe('Header: o botão de menu do cabeçalho não segue o centerButton', () => {
  it('sem barra inferior, "Abrir menu" continua com o rótulo padrão mesmo com centerButton próprio', async () => {
    const tela = await montar(
      { currentPath: '/paginas' },
      { shell: { layout: { bottomNav: false }, centerButton: { accessibilityLabel: 'Atalhos' } } },
    )
    await fireEvent.press(await tela.findByRole('button', { name: 'Abrir menu' }))
    expect((await tela.findByTestId('menu-aberto')).props.children).toBe('true')
    expect(tela.queryByRole('button', { name: 'Atalhos' })).toBeNull()
  })
})

describe('Header: workspaces chega ao menu do usuário', () => {
  it('o workspaces do shell aparece no menu do avatar, e só quando há usuário', async () => {
    const onSelect = jest.fn()
    const workspaces = { items: [{ id: 'a', label: 'Matriz' }, { id: 'b', label: 'Filial Sul' }], activeId: 'b', onSelect }
    const comUsuario = await montar(
      { currentPath: '/paginas' },
      { shell: { user: { name: 'Ana Ribeiro' }, workspaces } },
    )
    await fireEvent.press(await comUsuario.findByRole('button', { name: 'Menu de Ana Ribeiro' }))
    expect((await comUsuario.findByRole('menuitem', { name: 'Filial Sul' })).props.accessibilityState).toMatchObject({ selected: true })
    await fireEvent.press(await comUsuario.findByRole('menuitem', { name: 'Matriz' }))
    expect(onSelect).toHaveBeenCalledWith('a')
    await comUsuario.unmount()
    // sem usuário não há menu do usuário, logo nem espaços (limitação documentada)
    const semUsuario = await montar({ currentPath: '/paginas' }, { shell: { workspaces } })
    await semUsuario.findByText('Páginas')
    expect(semUsuario.queryByText('Matriz')).toBeNull()
  })
})

describe('Header: headerLogo no lugar do título', () => {
  const classesDe = (no: { props: Record<string, unknown> }) => String(no.props.className ?? '').split(' ')
  const logo = <Text testID="logo-do-cabecalho">LOGO</Text>

  it('sem headerLogo o título segue visível (text-base) e sem ocultação', async () => {
    const tela = await montar({ currentPath: '/paginas' })
    const classes = classesDe(await tela.findByText('Páginas'))
    expect(classes).toContain('text-base')
    expect(classes).not.toContain('absolute')
  })

  it('com headerLogo, o logo aparece e o título fica só para o leitor de tela (oculto visualmente, ainda na árvore)', async () => {
    const tela = await montar({ currentPath: '/paginas' }, { shell: { headerLogo: logo } })
    // decorativo: some da árvore de acessibilidade, então só aparece com includeHiddenElements
    expect(await tela.findByTestId('logo-do-cabecalho', { includeHiddenElements: true })).toBeTruthy()
    const titulo = await tela.findByText('Páginas')
    expect(classesDe(titulo)).toEqual(expect.arrayContaining(['absolute', 'h-px', 'w-px', 'overflow-hidden']))
  })

  it('o logo é decorativo para o leitor de tela (a View que o envolve some da árvore de acessibilidade)', async () => {
    const tela = await montar({ currentPath: '/paginas' }, { shell: { headerLogo: logo } })
    const envolucro = (await tela.findByTestId('logo-do-cabecalho', { includeHiddenElements: true })).parent!
    expect(envolucro.props.accessibilityElementsHidden).toBe(true)
    expect(envolucro.props.importantForAccessibility).toBe('no-hide-descendants')
    expect(envolucro.props['aria-hidden']).toBe(true)
  })

  it('o título enviado pela tela continua sendo o anunciado, e a ajuda (InfoHint) segue ao lado do logo', async () => {
    const tela = await montar(
      { currentPath: '/paginas' },
      { shell: { headerLogo: logo }, extra: <DefinirMeta title="Minha tela" help="Ajuda da tela" /> },
    )
    const titulo = await tela.findByText('Minha tela')
    expect(classesDe(titulo)).toContain('absolute')
    expect(await tela.findByRole('button', { name: 'Sobre: Minha tela' })).toBeTruthy()
    expect(await tela.findByTestId('logo-do-cabecalho', { includeHiddenElements: true })).toBeTruthy()
  })
})
