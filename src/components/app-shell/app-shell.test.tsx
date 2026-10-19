import { Keyboard, Platform, StyleSheet, Text } from 'react-native'
import { act, fireEvent, render, waitFor, within } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { BrandProvider } from '../../brand/brand-provider'
import { RendraNavigationProvider } from '../../navigation/rendra-navigation'
import { navComPagina } from '../../test-utils/shell-fixtures'
import { AppShell, type AppShellProps } from './app-shell'

function arvore(currentPath: string, props: Partial<AppShellProps> = {}, navigate = jest.fn()) {
  return (
    <BrandProvider>
      <RendraNavigationProvider value={{ navigate, currentPath }}>
        <AppShell navigation={navComPagina} user={{ name: 'Ana Ribeiro' }} {...props}>
          <Text>Conteúdo da tela</Text>
        </AppShell>
      </RendraNavigationProvider>
    </BrandProvider>
  )
}

beforeEach(async () => {
  await AsyncStorage.clear()
})

describe('AppShell', () => {
  it('monta sem roteador e mostra conteúdo, título da rota, usuário, barra e botão de menu', async () => {
    const tela = await render(arvore('/paginas'))
    expect(await tela.findByText('Conteúdo da tela')).toBeTruthy()
    expect(await tela.findByRole('button', { name: /Ana Ribeiro/ })).toBeTruthy()
    expect(await tela.findByRole('button', { name: 'Abrir menu' })).toBeTruthy()
    expect((await tela.findByLabelText('Navegação rápida')).props.role).toBe('navigation')
    const titulos = await tela.findAllByText('Páginas')
    expect(titulos.some((t) => String(t.props.className).includes('text-base'))).toBe(true)
  })

  it('N1: o botão central abre a gaveta com a navegação principal', async () => {
    const tela = await render(arvore('/'))
    expect(tela.queryByLabelText('Menu')).toBeNull()
    await fireEvent.press(await tela.findByRole('button', { name: 'Abrir menu' }))
    expect((await tela.findByLabelText('Menu')).props.role).toBe('dialog')
    expect(await tela.findByLabelText('Navegação principal')).toBeTruthy()
  })

  it('N2 (menu em folha): o botão central abre a folha com o link Páginas', async () => {
    const tela = await render(arvore('/', { layout: { menu: 'sheet' } }))
    await fireEvent.press(await tela.findByRole('button', { name: 'Abrir menu' }))
    const folha = await tela.findByTestId('nav-sheet-rolagem')
    expect(await within(folha).findByRole('link', { name: 'Páginas' })).toBeTruthy()
    expect(tela.queryByLabelText('Menu')).toBeNull()
  })

  it('N2: tocar num item da folha navega e fecha a folha', async () => {
    const navigate = jest.fn()
    const tela = await render(arvore('/', { layout: { menu: 'sheet' } }, navigate))
    await fireEvent.press(await tela.findByRole('button', { name: 'Abrir menu' }))
    const folha = await tela.findByTestId('nav-sheet-rolagem')
    await fireEvent.press(await within(folha).findByRole('link', { name: 'Tokens' }))
    expect(navigate).toHaveBeenCalledWith('/tokens')
    await waitFor(() => expect(tela.queryByTestId('nav-sheet-rolagem')).toBeNull())
  })

  it('tocar num item da gaveta navega e fecha a gaveta', async () => {
    const navigate = jest.fn()
    const tela = await render(arvore('/', {}, navigate))
    await fireEvent.press(await tela.findByRole('button', { name: 'Abrir menu' }))
    const gaveta = await tela.findByLabelText('Navegação principal')
    await fireEvent.press(await within(gaveta).findByRole('link', { name: 'Tokens' }))
    expect(navigate).toHaveBeenCalledWith('/tokens')
    await waitFor(() => expect(tela.queryByLabelText('Menu')).toBeNull())
  })

  it('a gaveta fecha sozinha quando a rota muda', async () => {
    const tela = await render(arvore('/'))
    await fireEvent.press(await tela.findByRole('button', { name: 'Abrir menu' }))
    await tela.findByLabelText('Menu')
    await tela.rerender(arvore('/tokens'))
    await waitFor(() => expect(tela.queryByLabelText('Menu')).toBeNull())
  })

  it('N3 salvo: depois de hidratar, sem barra inferior e com o botão de menu no cabeçalho', async () => {
    await AsyncStorage.setItem('rendra:shell-layout', JSON.stringify({ version: 1, layout: { bottomNav: false, menu: 'drawer' } }))
    const tela = await render(arvore('/paginas'))
    await waitFor(() => expect(tela.queryByLabelText('Navegação rápida')).toBeNull())
    const botoes = await tela.findAllByRole('button', { name: 'Abrir menu' })
    expect(botoes).toHaveLength(1)
    await fireEvent.press(botoes[0]!)
    expect(await tela.findByLabelText('Menu')).toBeTruthy()
  })

  it('a barra inferior só aparece depois de hidratar o layout salvo (sem piscar)', async () => {
    await AsyncStorage.setItem('rendra:shell-layout', JSON.stringify({ version: 1, layout: { bottomNav: false, menu: 'drawer' } }))
    const tela = await render(arvore('/paginas'))
    // Em nenhum instante a barra existiu: com o layout salvo sem barra, ela nunca foi montada.
    expect(tela.queryByLabelText('Navegação rápida')).toBeNull()
    await tela.findByText('Conteúdo da tela')
    expect(tela.queryByLabelText('Navegação rápida')).toBeNull()
  })
})

/** Janela de 800 de altura, teclado de 300 abrindo em y 500. */
async function abrirTeclado(os: 'android' | 'ios' | 'web') {
  jest.replaceProperty(Platform, 'OS', os)
  const espiao = jest.spyOn(Keyboard, 'addListener')
  const tela = await render(arvore('/paginas'))
  const area = await tela.findByTestId('shell-teclado')
  await fireEvent(area, 'layout', { persist: () => {}, nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 800 } } })
  await act(async () => {
    // Dispara o ouvinte que o KeyboardAvoidingView registrou no teclado.
    // Os dois eventos: `keyboardDidShow` (Android) e `keyboardWillShow` (iOS), os que o KAV de cada sistema ouve.
    const evento = { endCoordinates: { screenX: 0, screenY: 500, width: 400, height: 300 }, duration: 0 } as never
    for (const nome of ['keyboardDidShow', 'keyboardWillShow']) {
      espiao.mock.calls.filter(([n]) => n === nome).forEach(([, f]) => (f as (e: never) => void)(evento))
    }
  })
  return { tela, area: tela.getByTestId('shell-teclado') }
}

describe('AppShell: teclado', () => {
  afterEach(() => jest.restoreAllMocks())

  it('no Android o teclado encolhe a area da tela e a barra inferior sobe junto (padding igual a altura coberta)', async () => {
    const { tela, area } = await abrirTeclado('android')
    expect(StyleSheet.flatten(area.props.style).paddingBottom).toBe(300)
    expect(within(area).getByText('Conteúdo da tela')).toBeTruthy()
    expect(within(area).getByLabelText('Navegação rápida')).toBeTruthy()
    await tela.unmount()
  })

  it('no iOS e no web o shell nao compensa o teclado (as telas com campo ja tratam, e nao deve dobrar)', async () => {
    for (const os of ['ios', 'web'] as const) {
      const { tela, area } = await abrirTeclado(os)
      expect(StyleSheet.flatten(area.props.style)?.paddingBottom).toBeUndefined()
      await tela.unmount()
    }
  })
})

describe('AppShell: workspaces, centerButton e headerLogo chegam à tela pelas props', () => {
  it('workspaces vai ao menu do usuário e centerButton ao botão central', async () => {
    const onSelect = jest.fn()
    const tela = await render(
      arvore('/paginas', {
        workspaces: { items: [{ id: 'a', label: 'Matriz' }], activeId: 'a', onSelect },
        centerButton: { accessibilityLabel: 'Atalhos' },
      }),
    )
    expect(await tela.findByRole('button', { name: 'Atalhos' })).toBeTruthy()
    await fireEvent.press(await tela.findByRole('button', { name: 'Menu de Ana Ribeiro' }))
    await fireEvent.press(await tela.findByRole('menuitem', { name: 'Matriz' }))
    expect(onSelect).toHaveBeenCalledWith('a')
  })
})
