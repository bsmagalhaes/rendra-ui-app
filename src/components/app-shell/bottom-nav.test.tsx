import { Keyboard, Platform, StyleSheet, Text } from 'react-native'
import { act, fireEvent, render } from '@testing-library/react-native'
import * as SafeAreaContext from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { BrandProvider } from '../../brand/brand-provider'
import { RendraNavigationProvider, type RendraNavigationValue } from '../../navigation/rendra-navigation'
import { IconStub, navComPagina } from '../../test-utils/shell-fixtures'
import type { BrandConfig } from '../../brand/types'
import { BottomNav } from './bottom-nav'
import { ShellProvider, useShell, type ShellProviderProps } from './shell-context'
import type { NavGroup } from './types'

function SondaMenu() {
  const { mobileNavOpen } = useShell()
  return <Text testID="menu-aberto">{String(mobileNavOpen)}</Text>
}

function montar(navegacao: Partial<RendraNavigationValue> = {}, navigation: NavGroup[] = navComPagina) {
  return render(
    <BrandProvider>
      <RendraNavigationProvider value={{ navigate: jest.fn(), currentPath: '/paginas', ...navegacao }}>
        <ShellProvider navigation={navigation}>
          <BottomNav />
          <SondaMenu />
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

describe('BottomNav', () => {
  it('é uma navegação chamada "Navegação rápida" com os itens marcados como links', async () => {
    const tela = await montar()
    // Consulta por rótulo: o RNTL só acha por `role` nós acessíveis, e marcar a barra como
    // `accessible` esconderia os links dela dos leitores de tela; o papel é conferido na prop.
    const barra = await tela.findByLabelText('Navegação rápida')
    expect(barra.props.role).toBe('navigation')
    expect(await tela.findByRole('link', { name: 'Início' })).toBeTruthy()
    expect(await tela.findByRole('link', { name: 'Páginas' })).toBeTruthy()
    expect(tela.queryByRole('link', { name: 'Tokens' })).toBeNull()
  })

  it('marca só o destino ativo como selecionado (e o pai quando o ativo é um filho)', async () => {
    const tela = await montar({ currentPath: '/paginas/acoes' })
    const paginas = await tela.findByRole('link', { name: 'Páginas' })
    const inicio = await tela.findByRole('link', { name: 'Início' })
    expect(paginas.props.accessibilityState).toMatchObject({ selected: true })
    expect(inicio.props.accessibilityState).toMatchObject({ selected: false })
  })

  it('tocar num item navega para a rota dele', async () => {
    const navigate = jest.fn()
    const tela = await montar({ navigate })
    await fireEvent.press(await tela.findByRole('link', { name: 'Início' }))
    expect(navigate).toHaveBeenCalledWith('/')
  })

  it('o botão central "Abrir menu" abre o menu do mesmo shell', async () => {
    const tela = await montar()
    expect((await tela.findByTestId('menu-aberto')).props.children).toBe('false')
    await fireEvent.press(await tela.findByRole('button', { name: 'Abrir menu' }))
    expect((await tela.findByTestId('menu-aberto')).props.children).toBe('true')
  })

  it('usa shortTitle como rótulo e cai no primeiro filho quando o item não tem rota', async () => {
    const navigate = jest.fn()
    const menu: NavGroup[] = [
      {
        title: 'G',
        items: [
          { title: 'Configurações do sistema', shortTitle: 'Ajustes', icon: IconStub, bottomNav: true, children: [{ title: 'Marca', to: '/marca' }] },
        ],
      },
    ]
    const tela = await montar({ navigate, currentPath: '/marca' }, menu)
    const ajustes = await tela.findByRole('link', { name: 'Ajustes' })
    expect(ajustes.props.accessibilityState).toMatchObject({ selected: true })
    await fireEvent.press(ajustes)
    expect(navigate).toHaveBeenCalledWith('/marca')
  })

  it('a barra é dona do inset inferior: paddingBottom igual a insets.bottom', async () => {
    jest.spyOn(SafeAreaContext, 'useSafeAreaInsets').mockReturnValue({ top: 0, bottom: 34, left: 0, right: 0 })
    const tela = await montar()
    const barra = await tela.findByLabelText('Navegação rápida')
    expect(StyleSheet.flatten(barra.props.style)).toMatchObject({ paddingBottom: 34 })
  })

  describe('com o teclado aberto', () => {
    async function comTeclado(os: 'android' | 'ios') {
      jest.replaceProperty(Platform, 'OS', os)
      jest.spyOn(SafeAreaContext, 'useSafeAreaInsets').mockReturnValue({ top: 0, bottom: 34, left: 0, right: 0 })
      const espiao = jest.spyOn(Keyboard, 'addListener')
      const tela = await montar()
      const disparar = async (nome: string) =>
        act(async () => {
          espiao.mock.calls.filter(([n]) => n === nome).forEach(([, f]) => (f as () => void)())
        })
      const barra = () => StyleSheet.flatten(tela.getByLabelText('Navegação rápida').props.style)
      return { tela, disparar, barra }
    }

    it('no Android o recuo inferior some ao abrir o teclado e volta ao fechar', async () => {
      const { tela, disparar, barra } = await comTeclado('android')
      expect(barra().paddingBottom).toBe(34)
      await disparar('keyboardDidShow')
      expect(barra().paddingBottom).toBe(0)
      await disparar('keyboardDidHide')
      expect(barra().paddingBottom).toBe(34)
      await tela.unmount()
    })

    it('no iOS o recuo inferior continua (o teclado é tratado pelas telas)', async () => {
      const { tela, disparar, barra } = await comTeclado('ios')
      await disparar('keyboardDidShow')
      await disparar('keyboardWillShow')
      expect(barra().paddingBottom).toBe(34)
      await tela.unmount()
    })
  })

  it('os dois estados de cor do item existem sempre (sem classe que aparece só depois)', async () => {
    const tela = await montar()
    const ativo = await tela.findByText('Páginas')
    const inativo = await tela.findByText('Início')
    expect(ativo.props.className.split(' ')).toContain('text-primary-text')
    expect(inativo.props.className.split(' ')).toContain('text-muted-foreground')
  })
})

describe('BottomNav: botão central configurável (centerButton)', () => {
  const classesDe = (no: { props: Record<string, unknown> }) => String(no.props.className ?? '').split(' ')
  const IconePropio = jest.fn((props: { className?: string }) => <Text testID="icone-proprio" className={props.className} />)
  const SimboloFalso = jest.fn((props: { className?: string }) => <Text testID="simbolo-falso" className={props.className} />)
  const marcaComSimbolo: Partial<Record<'T1', BrandConfig>> = {
    T1: {
      id: 'teste',
      productName: 'Teste',
      companyName: 'Teste',
      tagline: 'x',
      shape: 'square',
      sidebarLogo: 'dark',
      symbol: SimboloFalso as unknown as BrandConfig['symbol'],
    },
  }

  function montarCom(shell: Partial<ShellProviderProps>, comSimbolo = false) {
    return render(
      <BrandProvider brands={comSimbolo ? marcaComSimbolo : undefined}>
        <RendraNavigationProvider value={{ navigate: jest.fn(), currentPath: '/paginas' }}>
          <ShellProvider navigation={navComPagina} {...shell}>
            <BottomNav />
            <SondaMenu />
          </ShellProvider>
        </RendraNavigationProvider>
      </BrandProvider>,
    )
  }

  beforeEach(() => {
    IconePropio.mockClear()
    SimboloFalso.mockClear()
  })

  it('accessibilityLabel próprio troca "Abrir menu" e o botão continua abrindo o menu', async () => {
    const tela = await montarCom({ centerButton: { accessibilityLabel: 'Atalhos' } })
    expect(tela.queryByRole('button', { name: 'Abrir menu' })).toBeNull()
    await fireEvent.press(await tela.findByRole('button', { name: 'Atalhos' }))
    expect((await tela.findByTestId('menu-aberto')).props.children).toBe('true')
  })

  it('ícone próprio é o desenhado, com size-icon-lg e text-primary-foreground', async () => {
    const tela = await montarCom({ centerButton: { icon: IconePropio } })
    const icone = await tela.findByTestId('icone-proprio')
    expect(classesDe(icone)).toEqual(expect.arrayContaining(['size-icon-lg', 'text-primary-foreground']))
    // continua com o rótulo de sempre quando só o ícone muda
    expect(await tela.findByRole('button', { name: 'Abrir menu' })).toBeTruthy()
  })

  it('icon "brand-symbol" desenha o símbolo da marca, tingido de text-primary-foreground', async () => {
    const tela = await montarCom({ centerButton: { icon: 'brand-symbol' } }, true)
    const simbolo = await tela.findByTestId('simbolo-falso')
    expect(classesDe(simbolo)).toEqual(expect.arrayContaining(['size-icon-lg', 'text-primary-foreground']))
  })

  it('icon "brand-symbol" sem brand.symbol cai no ícone de menu de sempre', async () => {
    const tela = await montarCom({ centerButton: { icon: 'brand-symbol' } })
    expect(await tela.findByRole('button', { name: 'Abrir menu' })).toBeTruthy()
    expect(SimboloFalso).not.toHaveBeenCalled()
    expect(IconePropio).not.toHaveBeenCalled()
  })

  it('sem centerButton, nada muda: "Abrir menu" e nenhum ícone próprio', async () => {
    const tela = await montarCom({})
    expect(await tela.findByRole('button', { name: 'Abrir menu' })).toBeTruthy()
    expect(IconePropio).not.toHaveBeenCalled()
  })
})
