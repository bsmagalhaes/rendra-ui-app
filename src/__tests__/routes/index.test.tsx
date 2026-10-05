import { fireEvent, within } from '@testing-library/react-native'
import { renderRouter } from 'expo-router/testing-library'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Linking, Text } from 'react-native'
import RootLayout from '../../../app/_layout'
import Index from '../../../app/index'
import { nodesWithCode } from '../../test-utils/rendra-code'
import { RENDRA_CREDIT_HREF } from '../../components/ui'

type Contexto = Awaited<ReturnType<typeof renderRouter>>

// B13 (veredito do Opus): "Aurora" existe em modelo e em paleta; cada grupo é um radiogroup
// rotulado e a consulta é escopada ao grupo, como na galeria.
async function opcao(context: Contexto, grupo: string, nome: string) {
  return within(await context.findByLabelText(grupo)).getByRole('radio', { name: nome })
}

function abrir() {
  return renderRouter(
    {
      _layout: RootLayout,
      index: Index,
      componentes: () => <Text>Tela de componentes</Text>,
      tokens: () => <Text>Tela de tokens</Text>,
      galeria: () => <Text>Tela da galeria</Text>,
      painel: () => <Text>Tela do painel</Text>,
      login: () => <Text>Tela de entrada</Text>,
    },
    { initialUrl: '/' },
  )
}

beforeEach(async () => {
  await AsyncStorage.clear()
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('/ (home)', () => {
  it('apresenta o projeto: título nível 1 (header) com o lema do modelo e a contagem de componentes', async () => {
    const context = await abrir()
    await context.findByTestId('rendra-T1-C1')
    const titulo = await context.findByText('Precisão lapidada em cada tela.')
    expect(titulo.props.accessibilityRole).toBe('header')
    expect(titulo.props['aria-level']).toBe(1)
    expect(await context.findByText(/Rendra App é a base para o seu próximo app: 65 componentes/)).toBeTruthy()
    expect(await context.findByText('65')).toBeTruthy()
    expect(context.queryByText('49')).toBeNull()
    expect(context.queryByText('44')).toBeNull()
    expect(await context.findByText('A vitrine dos componentes, com exemplos vivos.')).toBeTruthy()
  })

  it('lista os 3 modelos e as 4 paletas, cada grupo com um só item marcado', async () => {
    const context = await abrir()
    await context.findByTestId('rendra-T1-C1')
    const modelos = within(await context.findByLabelText('Modelo')).getAllByRole('radio')
    const paletas = within(await context.findByLabelText('Paleta')).getAllByRole('radio')
    expect(modelos).toHaveLength(3)
    expect(paletas).toHaveLength(4)
    expect(modelos.filter((m) => m.props.accessibilityState?.checked)).toHaveLength(1)
    expect((await opcao(context, 'Modelo', 'Safira')).props.accessibilityState?.checked).toBe(true)
    expect((await opcao(context, 'Paleta', 'Safira')).props.accessibilityState?.checked).toBe(true)
  })

  it('tocar num modelo e numa paleta troca a raiz e o item marcado, e o lema do título', async () => {
    const context = await abrir()
    await context.findByTestId('rendra-T1-C1')
    await fireEvent.press(await opcao(context, 'Modelo', 'Aurora'))
    expect(await context.findByTestId('rendra-T3-C1')).toBeTruthy()
    expect(await context.findByText('Um novo dia, claro e leve, em cada tela.')).toBeTruthy()
    expect(context.queryByText('Precisão lapidada em cada tela.')).toBeNull()
    await fireEvent.press(await opcao(context, 'Paleta', 'Ardósia'))
    expect(await context.findByTestId('rendra-T3-C4')).toBeTruthy()
    expect((await opcao(context, 'Modelo', 'Aurora')).props.accessibilityState?.checked).toBe(true)
    expect((await opcao(context, 'Modelo', 'Safira')).props.accessibilityState?.checked).toBe(false)
    expect((await opcao(context, 'Paleta', 'Ardósia')).props.accessibilityState?.checked).toBe(true)
    expect(nodesWithCode(context.container, 'CRED-001')).toHaveLength(1)
  })

  it('os cartões são radios: nenhum usa aria-selected nem papel de botão', async () => {
    const context = await abrir()
    await context.findByTestId('rendra-T1-C1')
    const radios = [
      ...within(await context.findByLabelText('Modelo')).getAllByRole('radio'),
      ...within(await context.findByLabelText('Paleta')).getAllByRole('radio'),
    ]
    for (const radio of radios) {
      expect(radio.props.accessibilityState?.selected).toBeUndefined()
      expect(radio.props['aria-selected']).toBeUndefined()
    }
  })

  it('o link do Explorar de cada rota leva à tela certa', async () => {
    const casos: [RegExp, string][] = [
      [/Componentes/, 'Tela de componentes'],
      [/Tokens/, 'Tela de tokens'],
      [/Galeria/, 'Tela da galeria'],
      [/Painel de exemplo/, 'Tela do painel'],
    ]
    for (const [nome, tela] of casos) {
      const context = await abrir()
      await context.findByTestId('rendra-T1-C1')
      await fireEvent.press(await context.findByRole('link', { name: nome }))
      expect(await context.findByText(tela)).toBeTruthy()
      await context.unmount()
    }
  })

  it('o link Tela de entrada leva ao login', async () => {
    const context = await abrir()
    await context.findByTestId('rendra-T1-C1')
    await fireEvent.press(await context.findByRole('link', { name: /Tela de entrada/ }))
    expect(await context.findAllByText('Tela de entrada')).not.toHaveLength(0)
  })

  it('mostra o crédito Feito com Rendra, que abre o link do Rendra', async () => {
    const spy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never)
    const context = await abrir()
    await fireEvent.press(await context.findByRole('link', { name: 'Feito com Rendra' }))
    expect(spy).toHaveBeenCalledWith(RENDRA_CREDIT_HREF)
    expect(nodesWithCode(context.container, 'CRED-001')).toHaveLength(1)
  })

  it('a tela tem o próprio SafeAreaView (safe-area-tela) com só o inset superior', async () => {
    const context = await abrir()
    const area = await context.findByTestId('safe-area-tela')
    expect(area.props.edges.top).toBe('additive')
    expect(area.props.edges.bottom).toBe('off')
  })

  it('usa um só degradê (R11)', async () => {
    const context = await abrir()
    await context.findByTestId('rendra-T1-C1')
    const degrades = context.container.queryAll((no) => String(no.props.testID ?? '').startsWith('gradient-'))
    expect(degrades).toHaveLength(1)
  })

  // Achado do emulador: `Card` só leva `border`, que no nativo sai preto sem uma cor de borda.
  it('o cartão da lista Explorar declara a cor da borda do tema', async () => {
    const context = await abrir()
    await context.findByTestId('rendra-T1-C1')
    const [cartao] = nodesWithCode(context.container, 'CARD-001')
    expect(String(cartao!.props.className).split(' ')).toContain('border-border')
  })
})
