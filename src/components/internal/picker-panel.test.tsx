import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Text as RNText } from 'react-native'
import { PickerPanel } from './picker-panel'
import { bordasSemCor } from '../../test-utils/bordas'
import { Text } from './text'
import { BrandProvider } from '../../brand/brand-provider'

describe('PickerPanel', () => {
  it('mostra o trigger sempre e o título/fechar só quando aberto', async () => {
    const onOpenChange = jest.fn()
    const { findByText, queryByText } = await render(
      <BrandProvider>
        <PickerPanel open={false} onOpenChange={onOpenChange} title="Selecione a categoria" trigger={<Text className="text-foreground">Abrir</Text>}>
          <Text className="text-popover-foreground">Item</Text>
        </PickerPanel>
      </BrandProvider>,
    )
    expect(await findByText('Abrir')).toBeTruthy()
    expect(queryByText('Selecione a categoria')).toBeNull()
  })

  it('com open, mostra título e fecha ao tocar no X', async () => {
    const onOpenChange = jest.fn()
    const { findByText, findByTestId } = await render(
      <BrandProvider>
        <PickerPanel open onOpenChange={onOpenChange} title="Selecione a categoria" trigger={<Text className="text-foreground">Abrir</Text>} testID="painel">
          <Text className="text-popover-foreground">Item</Text>
        </PickerPanel>
      </BrandProvider>,
    )
    expect(await findByText('Selecione a categoria')).toBeTruthy()
    const fechar = await findByTestId('painel-fechar')
    fireEvent.press(fechar)
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it('renderiza header num bloco com border-b, abaixo do título', async () => {
    const { findByText } = await render(
      <BrandProvider>
        <PickerPanel
          open
          onOpenChange={() => {}}
          title="Selecione"
          trigger={<Text className="text-foreground">Abrir</Text>}
          header={<Text className="text-foreground">Buscar...</Text>}
        >
          <Text className="text-popover-foreground">Item</Text>
        </PickerPanel>
      </BrandProvider>,
    )
    expect(await findByText('Buscar...')).toBeTruthy()
  })

  it('renderiza footer com padding de safe area', async () => {
    const { findByText } = await render(
      <BrandProvider>
        <PickerPanel
          open
          onOpenChange={() => {}}
          title="Selecione"
          trigger={<Text className="text-foreground">Abrir</Text>}
          footer={<Text className="text-foreground">Aplicar</Text>}
        >
          <Text className="text-popover-foreground">Item</Text>
        </PickerPanel>
      </BrandProvider>,
    )
    const aplicar = await findByText('Aplicar')
    expect(aplicar).toBeTruthy()
  })

  it('com scrollable={false} repassa a prop ao BottomSheet, sem área rolável própria', async () => {
    const { queryByTestId } = await render(
      <BrandProvider>
        <PickerPanel open onOpenChange={() => {}} title="Selecione" trigger={<Text className="text-foreground">Abrir</Text>} scrollable={false}>
          <RNText>Lista própria</RNText>
        </PickerPanel>
      </BrandProvider>,
    )
    expect(queryByTestId('bottom-sheet-rolagem')).toBeNull()
  })
})


describe('PickerPanel: borda com a cor do token', () => {
  it('cabeçalho extra e rodapé usam border-border (não pretos)', async () => {
    const { container } = await render(
      <BrandProvider>
        <PickerPanel
          open
          onOpenChange={() => {}}
          title="Selecione"
          trigger={<Text className="text-foreground">Abrir</Text>}
          header={<Text className="text-foreground">Busca</Text>}
          footer={<Text className="text-foreground">Aplicar</Text>}
        >
          <Text className="text-popover-foreground">Item</Text>
        </PickerPanel>
      </BrandProvider>,
    )
    expect(bordasSemCor(container)).toEqual([])
    expect(container.queryAll((no) => String(no.props.className ?? '').split(' ').includes('border-border'))).toHaveLength(3)
  })
})
