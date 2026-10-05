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
