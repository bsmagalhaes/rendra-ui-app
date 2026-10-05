import { fireEvent, render } from '@testing-library/react-native'
import { BrandProvider } from '../../brand'
import { Accordion, accordionHeight } from './accordion'
import { nodesWithCode } from '../../test-utils/rendra-code'
import { bordasSemCor, classesDo } from '../../test-utils/bordas'

describe('accordionHeight', () => {
  it('aberto com altura medida, devolve a altura', () => {
    expect(accordionHeight(true, 120)).toBe(120)
  })
  it('fechado, devolve 0 independente da medida', () => {
    expect(accordionHeight(false, 120)).toBe(0)
  })
  it('aberto sem medida ainda, devolve undefined (altura natural, sem piscar em 0)', () => {
    expect(accordionHeight(true, null)).toBeUndefined()
  })
})

const items = [
  { value: 'a', title: 'Envio', content: 'Prazo de 5 dias uteis.' },
  { value: 'b', title: 'Pagamento', content: 'Aceita Pix e cartao.' },
]

describe('Accordion', () => {
  it('sem defaultValue, nenhum item abre no primeiro render', async () => {
    const { queryByText } = await render(<BrandProvider><Accordion items={items} /></BrandProvider>)
    expect(queryByText('Prazo de 5 dias uteis.')).toBeNull()
    expect(queryByText('Aceita Pix e cartao.')).toBeNull()
  })

  it('modo unico: abrir o segundo fecha o primeiro', async () => {
    const { getByRole, queryByText, findByText } = await render(
      <BrandProvider><Accordion items={items} defaultValue={['a']} /></BrandProvider>,
    )
    expect(await findByText('Prazo de 5 dias uteis.')).toBeTruthy()
    await fireEvent.press(getByRole('button', { name: 'Pagamento' }))
    expect(await findByText('Aceita Pix e cartao.')).toBeTruthy()
    expect(queryByText('Prazo de 5 dias uteis.')).toBeNull()
  })

  it('multiple mantem os dois abertos', async () => {
    const { getByRole, findByText } = await render(
      <BrandProvider><Accordion items={items} multiple defaultValue={['a']} /></BrandProvider>,
    )
    await fireEvent.press(getByRole('button', { name: 'Pagamento' }))
    expect(await findByText('Prazo de 5 dias uteis.')).toBeTruthy()
    expect(await findByText('Aceita Pix e cartao.')).toBeTruthy()
  })

  it('accessibilityState.expanded alterna ao tocar o gatilho', async () => {
    const { getByRole } = await render(
      <BrandProvider><Accordion items={items} defaultValue={['a']} /></BrandProvider>,
    )
    expect(getByRole('button', { name: 'Envio' }).props.accessibilityState.expanded).toBe(true)
    await fireEvent.press(getByRole('button', { name: 'Envio' }))
    // C5 (veredito do Opus): reler o gatilho depois do toque, em vez de reusar a referência
    // antiga (o nó é outro objeto depois do re-render).
    expect(getByRole('button', { name: 'Envio' }).props.accessibilityState.expanded).toBe(false)
  })

  it('conteudo fechado nao recebe toque (pointerEvents none); aberto volta a receber (M3, Fable)', async () => {
    // M3 (Fable, validacao da entrega): o conteudo fechado ficava na arvore com altura 0 e
    // aria-hidden, mas um filho focavel (Button e composicao autorizada em "linha de Accordion")
    // continuava no tab order do web dentro de um no aria-hidden (axe aria-hidden-focus).
    // pointerEvents="none" no fechado impede toque/foco por ponteiro nesse estado.
    const { getByText, queryByText, getByRole } = await render(
      <BrandProvider><Accordion items={items} defaultValue={['a']} /></BrandProvider>,
    )
    const conteudoAberto = getByText('Prazo de 5 dias uteis.')
    expect(conteudoAberto.parent?.props.pointerEvents).not.toBe('none')
    await fireEvent.press(getByRole('button', { name: 'Envio' }))
    const conteudoFechado = queryByText('Prazo de 5 dias uteis.', { includeHiddenElements: true })
    expect(conteudoFechado?.parent?.props.pointerEvents).toBe('none')
  })

  it('disabled nao abre e leva accessibilityState.disabled', async () => {
    const disabledItems = [{ value: 'c', title: 'Indisponivel', content: 'Texto interno', disabled: true }, ...items]
    const { getByRole, queryByText } = await render(
      <BrandProvider><Accordion items={disabledItems} /></BrandProvider>,
    )
    const gatilho = getByRole('button', { name: 'Indisponivel' })
    expect(gatilho.props.accessibilityState.disabled).toBe(true)
    await fireEvent.press(gatilho)
    expect(queryByText('Texto interno')).toBeNull()
  })

  it('carrega dataSet.rendra = ACRN-001 na raiz (item D12 do levantamento da Sincronizacao 1)', async () => {
    const { container } = await render(<BrandProvider><Accordion items={items} /></BrandProvider>)
    expect(nodesWithCode(container, 'ACRN-001')).toHaveLength(1)
  })
})


describe('Accordion: borda com a cor do token', () => {
  it('a linha entre os itens usa border-border (não preta)', async () => {
    const { container } = await render(<BrandProvider><Accordion items={items} /></BrandProvider>)
    expect(bordasSemCor(container)).toEqual([])
    const separados = container.queryAll((no) => classesDo(no).includes('border-b'))
    expect(separados.length).toBeGreaterThan(0)
    for (const no of separados) expect(classesDo(no)).toContain('border-border')
  })
})
