import { StyleSheet } from 'react-native'
import { render, fireEvent } from '@testing-library/react-native'
import * as SafeAreaContext from 'react-native-safe-area-context'
import { BrandProvider } from '../../brand/brand-provider'
import { ActionBar } from './action-bar'
import { nodesWithCode } from '../../test-utils/rendra-code'
import { bordasSemCor, classesDo } from '../../test-utils/bordas'
import { ShellProvider } from '../app-shell/shell-context'
import { navComPagina } from '../../test-utils/shell-fixtures'

describe('ActionBar: layout de colunas', () => {
  it('só primary: ocupa flex-1', async () => {
    const { findByText } = await render(
      <BrandProvider>
        <ActionBar primary={{ label: 'Salvar', onPress: () => {} }} sticky={false} />
      </BrandProvider>,
    )
    const primary = await findByText('Salvar')
    // .parent?.parent?.parent: Button é Pressable (className, o root de verdade) > Animated.View
    // (só a escala do press) > View (a linha com ícone e texto); um Animated.View com className
    // perde as classes no web, então o texto fica três níveis abaixo do Pressable.
    expect(primary.parent?.parent?.parent?.props.className.split(' ')).toContain('flex-1')
  })

  it('primary + cancel: cancel flex-3, primary flex-7', async () => {
    const { findByText } = await render(
      <BrandProvider>
        <ActionBar
          primary={{ label: 'Salvar', onPress: () => {} }}
          cancel={{ label: 'Cancelar', onPress: () => {} }}
          sticky={false}
        />
      </BrandProvider>,
    )
    const cancel = await findByText('Cancelar')
    const primary = await findByText('Salvar')
    expect(cancel.parent?.parent?.parent?.props.className.split(' ')).toContain('flex-3')
    expect(primary.parent?.parent?.parent?.props.className.split(' ')).toContain('flex-7')
  })

  it('secondary vazio ([]) não abre menu (hasMenu deve ser falso)', async () => {
    const { queryByLabelText } = await render(
      <BrandProvider>
        <ActionBar primary={{ label: 'Salvar', onPress: () => {} }} secondary={[]} sticky={false} />
      </BrandProvider>,
    )
    expect(queryByLabelText('Mais ações')).toBeNull()
  })

  it('secondary com itens: menu, coluna do meio vazia (sem cancel) e primary', async () => {
    const onSecondaryPress = jest.fn()
    const { findByLabelText, findByText } = await render(
      <BrandProvider>
        <ActionBar
          primary={{ label: 'Salvar', onPress: () => {} }}
          secondary={[{ label: 'Duplicar', onPress: onSecondaryPress }]}
          sticky={false}
        />
      </BrandProvider>,
    )
    const trigger = await findByLabelText('Mais ações')
    await fireEvent.press(trigger)
    const item = await findByText('Duplicar')
    await fireEvent.press(item)
    expect(onSecondaryPress).toHaveBeenCalledTimes(1)
  })

  it('primary.loading mostra loadingLabel e desabilita', async () => {
    const { findByText } = await render(
      <BrandProvider>
        <ActionBar primary={{ label: 'Salvar', onPress: () => {}, loading: true }} sticky={false} />
      </BrandProvider>,
    )
    expect(await findByText('Salvando...')).toBeTruthy()
  })
})

describe('ActionBar: secondary com visible', () => {
  type No = { parent: No | null; props: Record<string, unknown> }
  // Mesma subida dos testes de cima: texto > View da linha > Animated.View > Pressable (o root).
  const classesDoBotao = (texto: No) => String(texto.parent?.parent?.parent?.props.className ?? '').split(' ')

  it('uma ação visible vira botão com o rótulo e, sem ação oculta, não cria o menu "Mais ações"', async () => {
    const { findByText, queryByLabelText } = await render(
      <BrandProvider>
        <ActionBar
          primary={{ label: 'Salvar', onPress: () => {} }}
          secondary={[{ label: 'Rascunho', onPress: () => {}, visible: true }]}
          sticky={false}
        />
      </BrandProvider>,
    )
    expect(await findByText('Rascunho')).toBeTruthy()
    expect(queryByLabelText('Mais ações')).toBeNull()
  })

  it('uma visible e uma oculta: botão da visible, menu só com a oculta', async () => {
    const { findByText, findByLabelText, queryByText } = await render(
      <BrandProvider>
        <ActionBar
          primary={{ label: 'Salvar', onPress: () => {} }}
          secondary={[
            { label: 'Rascunho', onPress: () => {}, visible: true },
            { label: 'Duplicar', onPress: () => {} },
          ]}
          sticky={false}
        />
      </BrandProvider>,
    )
    expect(await findByText('Rascunho')).toBeTruthy()
    expect(queryByText('Duplicar')).toBeNull()
    await fireEvent.press(await findByLabelText('Mais ações'))
    expect(await findByText('Duplicar')).toBeTruthy()
    expect(queryByText('Rascunho', { exact: true })).toBeTruthy()
  })

  it('o onPress da visible é chamado ao toque', async () => {
    const onPress = jest.fn()
    const { findByText } = await render(
      <BrandProvider>
        <ActionBar
          primary={{ label: 'Salvar', onPress: () => {} }}
          secondary={[{ label: 'Rascunho', onPress, visible: true }]}
          sticky={false}
        />
      </BrandProvider>,
    )
    await fireEvent.press(await findByText('Rascunho'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('visible desabilitada não dispara onPress', async () => {
    const onPress = jest.fn()
    const { findByText } = await render(
      <BrandProvider>
        <ActionBar
          primary={{ label: 'Salvar', onPress: () => {} }}
          secondary={[{ label: 'Rascunho', onPress, visible: true, disabled: true }]}
          sticky={false}
        />
      </BrandProvider>,
    )
    await fireEvent.press(await findByText('Rascunho'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('cancel + visible + primary: flex-3, flex-3 e flex-7, sem espaçador', async () => {
    const { findByText, queryByLabelText } = await render(
      <BrandProvider>
        <ActionBar
          primary={{ label: 'Salvar', onPress: () => {} }}
          cancel={{ label: 'Cancelar', onPress: () => {} }}
          secondary={[{ label: 'Rascunho', onPress: () => {}, visible: true }]}
          sticky={false}
        />
      </BrandProvider>,
    )
    expect(classesDoBotao(await findByText('Cancelar'))).toContain('flex-3')
    expect(classesDoBotao(await findByText('Rascunho'))).toContain('flex-3')
    expect(classesDoBotao(await findByText('Salvar'))).toContain('flex-7')
    expect(queryByLabelText('Mais ações')).toBeNull()
  })

  it('com os três botões de texto, cancel e visible apertam o respiro lateral (px-2) para caber em 360 px; com dois botões, cancel segue como sempre', async () => {
    const tres = await render(
      <BrandProvider>
        <ActionBar
          primary={{ label: 'Salvar', onPress: () => {} }}
          cancel={{ label: 'Cancelar', onPress: () => {} }}
          secondary={[{ label: 'Rascunho', onPress: () => {}, visible: true }]}
          sticky={false}
        />
      </BrandProvider>,
    )
    expect(classesDoBotao(await tres.findByText('Cancelar'))).toContain('px-2')
    expect(classesDoBotao(await tres.findByText('Rascunho'))).toContain('px-2')
    expect(classesDoBotao(await tres.findByText('Salvar'))).not.toContain('px-2')
    await tres.unmount()
    const dois = await render(
      <BrandProvider>
        <ActionBar primary={{ label: 'Salvar', onPress: () => {} }} cancel={{ label: 'Cancelar', onPress: () => {} }} sticky={false} />
      </BrandProvider>,
    )
    expect(classesDoBotao(await dois.findByText('Cancelar'))).not.toContain('px-2')
  })

  it('só visible + primary: visible flex-3, primary flex-7, sem espaçador do menu', async () => {
    const { findByText, toJSON } = await render(
      <BrandProvider>
        <ActionBar
          primary={{ label: 'Salvar', onPress: () => {} }}
          secondary={[{ label: 'Rascunho', onPress: () => {}, visible: true }]}
          sticky={false}
        />
      </BrandProvider>,
    )
    expect(classesDoBotao(await findByText('Rascunho'))).toContain('flex-3')
    expect(classesDoBotao(await findByText('Salvar'))).toContain('flex-7')
    // o espaçador é uma View cujo className é exatamente 'flex-3'; os botões têm mais classes
    const arvore = JSON.stringify(toJSON())
    expect(arvore).toContain('flex-7')
    expect(arvore).not.toContain('"className":"flex-3"')
  })

  it('com menu, no máximo 2 botões de texto: cancel + visible + ação oculta leva a visible ao menu, na ordem', async () => {
    const { findByText, findByLabelText, queryByText } = await render(
      <BrandProvider>
        <ActionBar
          primary={{ label: 'Salvar', onPress: () => {} }}
          cancel={{ label: 'Cancelar', onPress: () => {} }}
          secondary={[
            { label: 'Rascunho', onPress: () => {}, visible: true },
            { label: 'Duplicar', onPress: () => {} },
          ]}
          sticky={false}
        />
      </BrandProvider>,
    )
    expect(queryByText('Rascunho')).toBeNull()
    await fireEvent.press(await findByLabelText('Mais ações'))
    expect(await findByText('Rascunho')).toBeTruthy()
    expect(await findByText('Duplicar')).toBeTruthy()
  })

  it('cancel + duas visible: nenhuma fica visível (haveria menu), as duas vão ao menu', async () => {
    const { findByText, findByLabelText, queryByText } = await render(
      <BrandProvider>
        <ActionBar
          primary={{ label: 'Salvar', onPress: () => {} }}
          cancel={{ label: 'Cancelar', onPress: () => {} }}
          secondary={[
            { label: 'Rascunho', onPress: () => {}, visible: true },
            { label: 'Revisar', onPress: () => {}, visible: true },
          ]}
          sticky={false}
        />
      </BrandProvider>,
    )
    expect(queryByText('Rascunho')).toBeNull()
    await fireEvent.press(await findByLabelText('Mais ações'))
    expect(await findByText('Rascunho')).toBeTruthy()
    expect(await findByText('Revisar')).toBeTruthy()
  })

  it('sem cancel, a primeira visible fica visível e a segunda vai ao menu (2 botões de texto + menu)', async () => {
    const { findByText, findByLabelText, queryByText } = await render(
      <BrandProvider>
        <ActionBar
          primary={{ label: 'Salvar', onPress: () => {} }}
          secondary={[
            { label: 'Rascunho', onPress: () => {}, visible: true },
            { label: 'Revisar', onPress: () => {}, visible: true },
          ]}
          sticky={false}
        />
      </BrandProvider>,
    )
    expect(await findByText('Rascunho')).toBeTruthy()
    expect(queryByText('Revisar')).toBeNull()
    await fireEvent.press(await findByLabelText('Mais ações'))
    expect(await findByText('Revisar')).toBeTruthy()
  })

  it('visible destructive usa a variante destrutiva do botão', async () => {
    const { findByText } = await render(
      <BrandProvider>
        <ActionBar
          primary={{ label: 'Salvar', onPress: () => {} }}
          secondary={[{ label: 'Excluir', onPress: () => {}, visible: true, destructive: true }]}
          sticky={false}
        />
      </BrandProvider>,
    )
    const classes = classesDoBotao(await findByText('Excluir')).join(' ')
    expect(classes).toMatch(/destructive/)
  })
})

describe('ActionBar: safe area inferior (pendência 4)', () => {
  it('paddingBottom = insets.bottom quando maior que 16', async () => {
    jest.spyOn(SafeAreaContext, 'useSafeAreaInsets').mockReturnValue({ top: 0, bottom: 34, left: 0, right: 0 })
    const { findByTestId } = await render(
      <BrandProvider>
        <ActionBar primary={{ label: 'Salvar', onPress: () => {} }} testID="barra" />
      </BrandProvider>,
    )
    const bar = await findByTestId('barra')
    expect(StyleSheet.flatten(bar.props.style)).toMatchObject({ paddingBottom: 34 })
  })

  it('paddingBottom = 16 (mínimo) quando insets.bottom é 0', async () => {
    jest.spyOn(SafeAreaContext, 'useSafeAreaInsets').mockReturnValue({ top: 0, bottom: 0, left: 0, right: 0 })
    const { findByTestId } = await render(
      <BrandProvider>
        <ActionBar primary={{ label: 'Salvar', onPress: () => {} }} testID="barra" />
      </BrandProvider>,
    )
    const bar = await findByTestId('barra')
    expect(StyleSheet.flatten(bar.props.style)).toMatchObject({ paddingBottom: 16 })
  })
})

describe('ActionBar: data-rendra (item D12 do levantamento da Sincronizacao 1)', () => {
  it('carrega dataSet.rendra = ACB-001 sticky (padrao)', async () => {
    const { container } = await render(
      <BrandProvider>
        <ActionBar primary={{ label: 'Salvar', onPress: () => {} }} />
      </BrandProvider>,
    )
    expect(nodesWithCode(container, 'ACB-001')).toHaveLength(1)
  })

  it('carrega dataSet.rendra = ACB-001 nao sticky', async () => {
    const { container } = await render(
      <BrandProvider>
        <ActionBar primary={{ label: 'Salvar', onPress: () => {} }} sticky={false} />
      </BrandProvider>,
    )
    expect(nodesWithCode(container, 'ACB-001')).toHaveLength(1)
  })
})

describe('ActionBar dentro do shell', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  function noShell(layout: { bottomNav: boolean }) {
    return render(
      <BrandProvider>
        <ShellProvider navigation={navComPagina} layout={layout} userConfigurable={false}>
          <ActionBar primary={{ label: 'Salvar', onPress: () => {} }} testID="barra" />
        </ShellProvider>
      </BrandProvider>,
    )
  }

  it('com barra inferior não soma insets.bottom (a barra já é dona do respiro)', async () => {
    jest.spyOn(SafeAreaContext, 'useSafeAreaInsets').mockReturnValue({ top: 0, bottom: 34, left: 0, right: 0 })
    const { findByTestId } = await noShell({ bottomNav: true })
    expect(StyleSheet.flatten((await findByTestId('barra')).props.style)).toMatchObject({ paddingBottom: 16 })
  })

  it('sem barra inferior mantém o inset inferior', async () => {
    jest.spyOn(SafeAreaContext, 'useSafeAreaInsets').mockReturnValue({ top: 0, bottom: 34, left: 0, right: 0 })
    const { findByTestId } = await noShell({ bottomNav: false })
    expect(StyleSheet.flatten((await findByTestId('barra')).props.style)).toMatchObject({ paddingBottom: 34 })
  })
})


describe('ActionBar: borda com a cor do token', () => {
  it('a linha fixa acima das ações usa border-border (não preta)', async () => {
    const { container } = await render(
      <BrandProvider>
        <ActionBar primary={{ label: 'Salvar', onPress: () => {} }} />
      </BrandProvider>,
    )
    const [barra] = nodesWithCode(container, 'ACB-001')
    expect(classesDo(barra)).toEqual(expect.arrayContaining(['border-t', 'border-border']))
    expect(bordasSemCor(container)).toEqual([])
  })
})
