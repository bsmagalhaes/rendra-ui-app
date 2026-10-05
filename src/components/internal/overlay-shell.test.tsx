import type { ReactElement } from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { Text as RNText } from 'react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { OverlayShell } from './overlay-shell'
import { bordasSemCor } from '../../test-utils/bordas'

// OverlayShell usa Text (./text), que chama useBrand() e lança fora de <BrandProvider>
// (mesmo desvio já registrado nas Tarefas 13 a 17).
function withBrand(children: ReactElement) {
  return <BrandProvider>{children}</BrandProvider>
}

describe('OverlayShell', () => {
  it('renderiza título, descrição, corpo e chama onRequestClose ao fechar', async () => {
    const onRequestClose = jest.fn()
    const { findByText, findByLabelText } = await render(
      withBrand(
        <OverlayShell title="Título" description="Descrição" onRequestClose={onRequestClose}>
          <RNText>Corpo</RNText>
        </OverlayShell>,
      ),
    )
    expect(await findByText('Título')).toBeTruthy()
    expect(await findByText('Descrição')).toBeTruthy()
    expect(await findByText('Corpo')).toBeTruthy()
    const close = await findByLabelText('Fechar')
    await fireEvent.press(close)
    expect(onRequestClose).toHaveBeenCalledTimes(1)
  })

  it('hideHeader: não renderiza o bloco de cabeçalho (nem título nem botão fechar)', async () => {
    const { queryByLabelText, queryByText } = await render(
      withBrand(
        <OverlayShell title="Título" hideHeader onRequestClose={() => {}}>
          <RNText>Corpo</RNText>
        </OverlayShell>,
      ),
    )
    expect(queryByText('Título')).toBeNull()
    expect(queryByLabelText('Fechar')).toBeNull()
  })

  it('renderiza o rodapé quando fornecido', async () => {
    const { findByText } = await render(
      withBrand(
        <OverlayShell title="Título" onRequestClose={() => {}} footer={<RNText>Rodapé</RNText>}>
          <RNText>Corpo</RNText>
        </OverlayShell>,
      ),
    )
    expect(await findByText('Rodapé')).toBeTruthy()
  })

  it('fill=true (padrão): raiz ocupa flex-1', async () => {
    const { getByTestId } = await render(
      withBrand(
        <OverlayShell title="Título" onRequestClose={() => {}} testID="shell">
          <RNText>Corpo</RNText>
        </OverlayShell>,
      ),
    )
    expect(getByTestId('shell').props.className.split(' ')).toContain('flex-1')
  })

  it('fill=false: raiz vira shrink, não flex-1', async () => {
    const { getByTestId } = await render(
      withBrand(
        <OverlayShell title="Título" onRequestClose={() => {}} fill={false} testID="shell">
          <RNText>Corpo</RNText>
        </OverlayShell>,
      ),
    )
    const classes = getByTestId('shell').props.className.split(' ')
    expect(classes).toContain('shrink')
    expect(classes).not.toContain('flex-1')
  })

  it('a area rolavel do corpo tem tabIndex 0 (scrollable-region-focusable, achado a3)', async () => {
    const { findByTestId } = await render(
      withBrand(
        <OverlayShell title="Painel" onRequestClose={() => {}} testID="shell">
          <RNText>Conteudo</RNText>
        </OverlayShell>,
      ),
    )
    const corpo = await findByTestId('shell-corpo')
    expect(corpo.props.tabIndex).toBe(0)
  })
})


describe('OverlayShell: borda com a cor do token', () => {
  it('cabeçalho e rodapé usam border-border (não pretos)', async () => {
    const { container } = await render(
      withBrand(
        <OverlayShell title="Título" footer={<RNText>Rodapé</RNText>} onRequestClose={() => {}}>
          <RNText>Corpo</RNText>
        </OverlayShell>,
      ),
    )
    expect(bordasSemCor(container)).toEqual([])
    expect(container.queryAll((no) => String(no.props.className ?? '').split(' ').includes('border-border'))).toHaveLength(2)
  })
})
