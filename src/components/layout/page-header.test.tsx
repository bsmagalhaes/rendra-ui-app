import { StyleSheet, View } from 'react-native'
import { act, render, fireEvent, within } from '@testing-library/react-native'
import * as SafeAreaContext from 'react-native-safe-area-context'
import { BrandProvider } from '../../brand/brand-provider'
import { RendraNavigationProvider } from '../../navigation/rendra-navigation'
import { AppShell } from '../app-shell/app-shell'
import { navComPagina } from '../../test-utils/shell-fixtures'
import { PageHeader } from './page-header'

describe('PageHeader', () => {
  it('showTitle: título visível em text-2xl, com accessibilityRole header', async () => {
    const { findByText } = await render(
      <BrandProvider>
        <PageHeader title="Minha tela" showTitle />
      </BrandProvider>,
    )
    const title = await findByText('Minha tela')
    expect(title.props.className.split(' ')).toContain('text-2xl')
    expect(title.props.accessibilityRole).toBe('header')
  })

  it('sem showTitle nem help: título oculto visualmente, mas ainda accessibilityRole header', async () => {
    const { findByText } = await render(
      <BrandProvider>
        <PageHeader title="Minha tela" description="Descrição" />
      </BrandProvider>,
    )
    const title = await findByText('Minha tela')
    const classes = title.props.className.split(' ')
    expect(classes).toEqual(expect.arrayContaining(['absolute', 'h-px', 'w-px', 'overflow-hidden']))
    expect(classes).not.toContain('opacity-0')
    expect(title.props.accessibilityRole).toBe('header')
  })

  it('sem título visível, descrição, ações, help nem children: contêiner inteiro oculto visualmente', async () => {
    const { findByTestId } = await render(
      <BrandProvider>
        <PageHeader title="Minha tela" testID="cabecalho-vazio" />
      </BrandProvider>,
    )
    const classes = (await findByTestId('cabecalho-vazio')).props.className.split(' ')
    expect(classes).toEqual(expect.arrayContaining(['absolute', 'h-px', 'w-px', 'overflow-hidden']))
    expect(classes).not.toContain('opacity-0')
  })

  it('description e actions aparecem', async () => {
    const { findByText } = await render(
      <BrandProvider>
        <PageHeader title="Minha tela" description="Descrição curta" actions={<></>} />
      </BrandProvider>,
    )
    expect(await findByText('Descrição curta')).toBeTruthy()
  })

  it('actions: cada elemento recebe flex-1 (linha dividida igualmente)', async () => {
    const { findByTestId } = await render(
      <BrandProvider>
        <PageHeader
          title="Minha tela"
          actions={
            <>
              <View testID="acao-1" />
              <View testID="acao-2" />
            </>
          }
        />
      </BrandProvider>,
    )
    expect((await findByTestId('acao-1')).props.className.split(' ')).toContain('flex-1')
    expect((await findByTestId('acao-2')).props.className.split(' ')).toContain('flex-1')
  })

  it('help: renderiza InfoHint ao lado do título e abre o modal com o título da tela', async () => {
    const { findByLabelText, findAllByText } = await render(
      <BrandProvider>
        <PageHeader title="Minha tela" help={<></>} />
      </BrandProvider>,
    )
    const trigger = await findByLabelText('Sobre: Minha tela')
    await fireEvent.press(trigger)
    // findAllByText, não findByText: com help presente, titleVisible (showTitle || help) fica
    // verdadeiro (o próprio contrato do componente), então o título do PageHeader já aparece
    // visível; abrir o InfoHint soma um segundo "Minha tela" dentro do Modal (o próprio título
    // passado ao InfoHint), ficando 2 nós de texto iguais na árvore, não 1.
    const matches = await findAllByText('Minha tela')
    expect(matches.length).toBe(2)
  })

  it('paddingTop = max(0, insets.top)', async () => {
    const { findByTestId } = await render(
      <BrandProvider>
        <PageHeader title="Minha tela" testID="cabecalho" />
      </BrandProvider>,
    )
    const header = await findByTestId('cabecalho')
    expect(StyleSheet.flatten(header.props.style)).toMatchObject({ paddingTop: 0 })
  })
})

describe('PageHeader: className, align e inset', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })
  const classesDe = (no: { props: Record<string, unknown> }) => String(no.props.className ?? '').split(' ')

  it('className="mb-0" vence a margem negativa embutida (-mb-2): é o caminho para tirá-la, sem prop nova', async () => {
    const { findByTestId, rerender } = await render(
      <BrandProvider>
        <PageHeader title="Minha tela" description="Descrição" testID="cabecalho" />
      </BrandProvider>,
    )
    expect(classesDe(await findByTestId('cabecalho'))).toContain('-mb-2')
    await rerender(
      <BrandProvider>
        <PageHeader title="Minha tela" description="Descrição" testID="cabecalho" className="mb-0" />
      </BrandProvider>,
    )
    const classes = classesDe(await findByTestId('cabecalho'))
    expect(classes).toContain('mb-0')
    expect(classes).not.toContain('-mb-2')
  })

  it('align="center" centraliza o título (linha e coluna) e a descrição; o padrão não centraliza', async () => {
    const montar = (align?: 'center') => (
      <BrandProvider>
        <PageHeader title="Minha tela" showTitle description="Descrição" align={align} />
      </BrandProvider>
    )
    const { findByText, rerender } = await render(montar())
    const titulo = await findByText('Minha tela')
    const linha = () => classesDe(titulo.parent as unknown as { props: Record<string, unknown> })
    const coluna = () => classesDe(titulo.parent!.parent as unknown as { props: Record<string, unknown> })
    expect(linha()).not.toContain('justify-center')
    expect(coluna()).not.toContain('items-center')
    expect(classesDe(await findByText('Descrição'))).not.toContain('text-center')
    await rerender(montar('center'))
    expect(linha()).toContain('justify-center')
    expect(coluna()).toContain('items-center')
    expect(classesDe(await findByText('Descrição'))).toContain('text-center')
  })

  it('inset={false} fora do shell zera o paddingTop mesmo com inset superior; o padrão soma o inset', async () => {
    jest.spyOn(SafeAreaContext, 'useSafeAreaInsets').mockReturnValue({ top: 24, bottom: 0, left: 0, right: 0 })
    const { findByTestId, rerender } = await render(
      <BrandProvider>
        <PageHeader title="Minha tela" showTitle testID="cabecalho" />
      </BrandProvider>,
    )
    expect(StyleSheet.flatten((await findByTestId('cabecalho')).props.style)).toMatchObject({ paddingTop: 24 })
    await rerender(
      <BrandProvider>
        <PageHeader title="Minha tela" showTitle testID="cabecalho" inset={false} />
      </BrandProvider>,
    )
    expect(StyleSheet.flatten((await findByTestId('cabecalho')).props.style)).toMatchObject({ paddingTop: 0 })
  })
})

describe('PageHeader: bodyTitle', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })
  const classesDe = (no: { props: Record<string, unknown> }) => String(no.props.className ?? '').split(' ')

  function noShell(filho: React.ReactNode) {
    return render(
      <BrandProvider>
        <RendraNavigationProvider value={{ navigate: jest.fn(), currentPath: '/paginas' }}>
          <AppShell navigation={navComPagina}>{filho}</AppShell>
        </RendraNavigationProvider>
      </BrandProvider>,
    )
  }

  it('dentro do shell, mostra o título discreto (text-base) no corpo, sem a classe de ocultação, e a raiz também não fica oculta', async () => {
    const { findAllByText, findByTestId } = await noShell(<PageHeader title="Minha tela" bodyTitle testID="cabecalho" />)
    const titulos = await findAllByText('Minha tela')
    // um no cabeçalho do shell e um no corpo, os dois visíveis
    expect(titulos).toHaveLength(2)
    for (const titulo of titulos) {
      const classes = classesDe(titulo)
      expect(classes).toContain('text-base')
      expect(classes).not.toContain('absolute')
    }
    const raiz = classesDe(await findByTestId('cabecalho'))
    expect(raiz).not.toContain('absolute')
    expect(raiz).not.toContain('overflow-hidden')
  })

  it('o título do corpo mantém accessibilityRole header e o cabeçalho do shell segue recebendo o título', async () => {
    const { findAllByText, findByTestId } = await noShell(<PageHeader title="Minha tela" bodyTitle testID="cabecalho" />)
    const doCorpo = (await findAllByText('Minha tela')).find(
      (no) => no.props.accessibilityRole === 'header' && !classesDe(no).includes('absolute'),
    )
    expect(doCorpo).toBeTruthy()
    expect(await within(await findByTestId('shell-cabecalho')).findByText('Minha tela')).toBeTruthy()
  })

  it('sem bodyTitle, dentro do shell, o título do corpo continua oculto (comportamento de hoje)', async () => {
    const { findAllByText } = await noShell(<PageHeader title="Minha tela" description="Descrição" />)
    const classes = (await findAllByText('Minha tela')).map((no) => classesDe(no))
    expect(classes.filter((c) => c.includes('absolute'))).toHaveLength(1)
  })

  it('fora do shell, bodyTitle não tem efeito: o título só aparece com showTitle, em text-2xl', async () => {
    const { findByText, rerender } = await render(
      <BrandProvider>
        <PageHeader title="Minha tela" description="Descrição" bodyTitle />
      </BrandProvider>,
    )
    expect(classesDe(await findByText('Minha tela'))).toContain('absolute')
    await rerender(
      <BrandProvider>
        <PageHeader title="Minha tela" showTitle bodyTitle />
      </BrandProvider>,
    )
    const classes = classesDe(await findByText('Minha tela'))
    expect(classes).toContain('text-2xl')
    expect(classes).not.toContain('text-base')
  })
})

describe('PageHeader dentro do AppShell', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  function dentroDoShell(filho: React.ReactNode) {
    return render(
      <BrandProvider>
        <RendraNavigationProvider value={{ navigate: jest.fn(), currentPath: '/paginas' }}>
          <AppShell navigation={navComPagina}>{filho}</AppShell>
        </RendraNavigationProvider>
      </BrandProvider>,
    )
  }

  it('não soma o inset superior (o cabeçalho do shell é o dono) e mostra o título uma vez, no cabeçalho', async () => {
    jest.spyOn(SafeAreaContext, 'useSafeAreaInsets').mockReturnValue({ top: 24, bottom: 0, left: 0, right: 0 })
    const { findAllByText, findByTestId } = await dentroDoShell(
      <PageHeader title="Minha tela" showTitle testID="cabecalho" />,
    )
    const titulos = await findAllByText('Minha tela')
    expect(titulos).toHaveLength(2)
    const classes = titulos.map((t) => String(t.props.className))
    // um é o título oculto do PageHeader (só leitor de tela), o outro o visível do cabeçalho
    expect(classes.filter((c) => c.includes('absolute'))).toHaveLength(1)
    expect(classes.filter((c) => c.includes('text-base'))).toHaveLength(1)
    const oculto = titulos.find((t) => String(t.props.className).includes('absolute'))!
    expect(oculto.props.accessibilityRole).toBe('header')
    expect(StyleSheet.flatten((await findByTestId('cabecalho')).props.style)).toMatchObject({ paddingTop: 0 })
  })

  it('envia a ajuda em texto ao cabeçalho, sem InfoHint duplicado na tela', async () => {
    const { findAllByRole, findByTestId } = await dentroDoShell(
      <PageHeader title="Minha tela" help="Como usar esta tela" />,
    )
    const dicas = await findAllByRole('button', { name: 'Sobre: Minha tela' })
    expect(dicas).toHaveLength(1)
    // a única dica mora no cabeçalho do shell, não na tela
    expect(await within(await findByTestId('shell-cabecalho')).findByRole('button', { name: 'Sobre: Minha tela' })).toBeTruthy()
  })

  it('ajuda que não é texto continua como InfoHint da própria tela', async () => {
    const { findAllByRole } = await dentroDoShell(<PageHeader title="Minha tela" help={<View />} />)
    expect(await findAllByRole('button', { name: 'Sobre: Minha tela' })).toHaveLength(1)
  })

  it('a tela que segue montada depois de a rota mudar não sobrescreve o título do cabeçalho', async () => {
    const arvore = (caminho: string) => (
      <BrandProvider>
        <RendraNavigationProvider value={{ navigate: jest.fn(), currentPath: caminho }}>
          <AppShell navigation={navComPagina}>
            <PageHeader title="Minha tela" />
          </AppShell>
        </RendraNavigationProvider>
      </BrandProvider>
    )
    const tela = await render(arvore('/paginas'))
    const noCabecalho = async (texto: string) =>
      within(await tela.findByTestId('shell-cabecalho')).findByText(texto)
    expect(await noCabecalho('Minha tela')).toBeTruthy()
    // a rota muda para um destino sem PageHeader próprio; a tela antiga segue montada (pilha)
    await tela.rerender(arvore('/tokens'))
    expect(await noCabecalho('Tokens')).toBeTruthy()
  })

  // R2 (validação da entrega do P3): num push o roteador ainda entrega o pathname antigo no primeiro
  // render da tela nova. Aqui a tela monta com a rota de origem (/paginas) e, antes do primeiro
  // setTimeout, a rota passa a ser a dela (/paginas/acoes): o cabeçalho deve mostrar o título dela.
  it('a tela recém-montada adota a rota nova quando o pathname chega atrasado no push', async () => {
    jest.useFakeTimers()
    try {
      const arvore = (caminho: string) => (
        <BrandProvider>
          <RendraNavigationProvider value={{ navigate: jest.fn(), currentPath: caminho }}>
            <AppShell navigation={navComPagina}>
              <PageHeader title="Cliente Novo" />
            </AppShell>
          </RendraNavigationProvider>
        </BrandProvider>
      )
      const tela = await render(arvore('/paginas'))
      await tela.rerender(arvore('/paginas/acoes'))
      expect(await within(await tela.findByTestId('shell-cabecalho')).findByText('Cliente Novo')).toBeTruthy()
    } finally {
      jest.useRealTimers()
    }
  })

  it('a tela já assentada não adota a rota nova (é a que ficou por baixo na pilha)', async () => {
    jest.useFakeTimers()
    try {
      const arvore = (caminho: string) => (
        <BrandProvider>
          <RendraNavigationProvider value={{ navigate: jest.fn(), currentPath: caminho }}>
            <AppShell navigation={navComPagina}>
              <PageHeader title="Cliente Antigo" />
            </AppShell>
          </RendraNavigationProvider>
        </BrandProvider>
      )
      const tela = await render(arvore('/paginas'))
      await act(async () => {
        jest.advanceTimersByTime(10)
      })
      await tela.rerender(arvore('/paginas/acoes'))
      expect(await within(await tela.findByTestId('shell-cabecalho')).findByText('Ações')).toBeTruthy()
    } finally {
      jest.useRealTimers()
    }
  })

  it('descrição e ações continuam na tela', async () => {
    const { findByText } = await dentroDoShell(<PageHeader title="Minha tela" description="Descrição da tela" />)
    expect(await findByText('Descrição da tela')).toBeTruthy()
  })
})
