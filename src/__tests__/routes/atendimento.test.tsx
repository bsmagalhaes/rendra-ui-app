import { act, fireEvent, within } from '@testing-library/react-native'
import { screen } from 'expo-router/testing-library'
import { Text } from 'react-native'
import ShellLayout from '../../../app/(shell)/_layout'
import Atendimento from '../../../app/(shell)/atendimento/index'
import { abrirTicket, restaurarTickets } from '../../demo/tickets-store'
import { renderDemo } from '../../test-utils/render-demo'
import { nodesWithCode } from '../../test-utils/rendra-code'

const rotas = {
  '(shell)/_layout': ShellLayout,
  '(shell)/atendimento/index': Atendimento,
  '(shell)/atendimento/[id]': () => <Text>Conversa aberta</Text>,
}

afterEach(async () => {
  await act(async () => {
    restaurarTickets()
  })
  jest.useFakeTimers()
})

/** Fixa só o relógio (o `Date`) em 04/10/2026 12:00; as conversas de exemplo são de 29/09/2026. */
function fixarHoje(agora = new Date(2026, 9, 4, 12, 0)) {
  jest.useFakeTimers({
    now: agora,
    doNotFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate', 'nextTick', 'queueMicrotask'],
  })
}

async function abrirFiltros(nome: string | RegExp = 'Filtros') {
  await fireEvent.press(await screen.findByRole('button', { name: nome }))
  return screen.findByTestId('atendimento-filtros')
}

async function aplicar() {
  await fireEvent.press(screen.getByRole('button', { name: 'Aplicar' }))
}

describe('atendimento: lista por etapa', () => {
  it('mostra o título e as quatro etapas, com o número de não lidas e sem balão quando é zero', async () => {
    await renderDemo(rotas, '/atendimento')
    expect((await screen.findAllByText('Atendimento')).length).toBeGreaterThan(0)
    expect(await screen.findByRole('tab', { name: 'URA/IA' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Fila 1 não lida' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Atendimento 2 não lidas' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Encerrado' })).toBeTruthy()
    // a pílula visível mostra só o número, e etapa sem não lidas não tem pílula
    expect(within(screen.getByRole('tab', { name: 'Atendimento 2 não lidas' })).getByText('2')).toBeTruthy()
    expect(within(screen.getByRole('tab', { name: 'URA/IA' })).queryByText('0')).toBeNull()
    expect(screen.queryByRole('tab', { name: 'URA/IA 0' })).toBeNull()
  })

  it('as abas rolam na horizontal em vez de virar um Select', async () => {
    await renderDemo(rotas, '/atendimento')
    await screen.findByRole('tab', { name: 'URA/IA' })
    expect(screen.queryByRole('combobox', { name: /Etapa/ })).toBeNull()
  })

  it('abre na Fila: Diana Melo com o tempo de espera, sem as conversas em atendimento', async () => {
    await renderDemo(rotas, '/atendimento')
    expect(await screen.findByText('Diana Melo')).toBeTruthy()
    expect(screen.getByText(/Esperando há/)).toBeTruthy()
    expect(screen.queryByText('Ana Souza')).toBeNull()
    expect(screen.queryByText('Carlos Dias')).toBeNull()
  })

  it('a aba Atendimento lista Ana e Carlos, e a pílula de não lidas do Carlos mostra 2', async () => {
    await renderDemo(rotas, '/atendimento')
    await fireEvent.press(await screen.findByRole('tab', { name: 'Atendimento 2 não lidas' }))
    expect(await screen.findByText('Ana Souza')).toBeTruthy()
    expect(screen.getByText('Carlos Dias')).toBeTruthy()
    expect(within(screen.getByTestId('conversation-item-t2')).getByText('2')).toBeTruthy()
    expect(within(screen.getByTestId('conversation-item-t1')).queryByText('2')).toBeNull()
  })

  it('as etapas sem conversa mostram o aviso de vazio', async () => {
    await renderDemo(rotas, '/atendimento')
    await fireEvent.press(await screen.findByRole('tab', { name: 'URA/IA' }))
    expect(await screen.findByText('Nenhuma conversa aqui.')).toBeTruthy()
    await fireEvent.press(screen.getByRole('tab', { name: 'Encerrado' }))
    expect(await screen.findByText('Nenhuma conversa aqui.')).toBeTruthy()
  })

  it('a busca casa com o nome ou com a última mensagem e reduz a lista', async () => {
    await renderDemo(rotas, '/atendimento')
    await fireEvent.press(await screen.findByRole('tab', { name: 'Atendimento 2 não lidas' }))
    await fireEvent.changeText(await screen.findByLabelText('Buscar conversa'), 'carlos')
    expect(await screen.findByText('Carlos Dias')).toBeTruthy()
    expect(screen.queryByText('Ana Souza')).toBeNull()
    await fireEvent.changeText(screen.getByLabelText('Buscar conversa'), 'obrigada')
    expect(await screen.findByText('Ana Souza')).toBeTruthy()
    expect(screen.queryByText('Carlos Dias')).toBeNull()
    await fireEvent.changeText(screen.getByLabelText('Buscar conversa'), 'zzz')
    expect(await screen.findByText('Nenhuma conversa com essa busca ou filtros.')).toBeTruthy()
  })

  it('tocar numa conversa abre a conversa dela', async () => {
    const tela = await renderDemo(rotas, '/atendimento')
    await fireEvent.press(await screen.findByRole('tab', { name: 'Atendimento 2 não lidas' }))
    await fireEvent.press(within(await screen.findByTestId('conversation-item-t2')).getByRole('button'))
    expect(await screen.findByText('Conversa aberta')).toBeTruthy()
    expect(tela.getPathname()).toBe('/atendimento/t2')
  })

  it('abrir a conversa zera as não lidas dela e a aba da etapa perde o balão', async () => {
    await renderDemo(rotas, '/atendimento')
    expect(await screen.findByRole('tab', { name: 'Atendimento 2 não lidas' })).toBeTruthy()
    // `abrirTicket` roda na rota da conversa (`[id]`, falsa neste teste): aqui é chamado direto
    await act(async () => {
      abrirTicket('t2')
    })
    expect(screen.getByRole('tab', { name: 'Atendimento' })).toBeTruthy()
    expect(screen.queryByRole('tab', { name: 'Atendimento 2 não lidas' })).toBeNull()
  })
})

describe('atendimento: busca com botão de filtros e folha inferior', () => {
  it('o botão de filtros fica dentro do campo de busca, sem selo enquanto não há filtro', async () => {
    await renderDemo(rotas, '/atendimento')
    const botao = await screen.findByRole('button', { name: 'Filtros' })
    expect(botao).toBeTruthy()
    expect(screen.queryByRole('combobox', { name: /Canal/ })).toBeNull()
    expect(screen.queryByTestId('atendimento-filtros')).toBeNull()
  })

  it('a folha traz Canal e Período na própria folha, com Limpar e Aplicar no rodapé', async () => {
    await renderDemo(rotas, '/atendimento')
    const folha = await abrirFiltros()
    expect(within(folha).getByText('Filtros')).toBeTruthy()
    expect(within(folha).getByText('Canal')).toBeTruthy()
    expect(within(folha).getByText('Período')).toBeTruthy()
    expect(within(folha).getByRole('checkbox', { name: 'WhatsApp' })).toBeTruthy()
    for (const periodo of ['Tudo', 'Hoje', '7 dias', '30 dias']) {
      expect(within(folha).getByRole('radio', { name: periodo })).toBeTruthy()
    }
    expect(within(folha).getByRole('radio', { name: 'Tudo' }).props.accessibilityState.checked).toBe(true)
    expect(within(folha).getByRole('button', { name: 'Limpar' })).toBeTruthy()
    expect(within(folha).getByRole('button', { name: 'Aplicar' })).toBeTruthy()
    // sem Select nem DatePicker: nada de uma segunda folha por cima
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  it('o filtro por canal mostra só o canal escolhido e o selo do botão mostra 1', async () => {
    await renderDemo(rotas, '/atendimento')
    await fireEvent.press(await screen.findByRole('tab', { name: 'Atendimento 2 não lidas' }))
    await abrirFiltros()
    await fireEvent.press(screen.getByRole('checkbox', { name: 'WhatsApp' }))
    await aplicar()
    expect(await screen.findByText('Ana Souza')).toBeTruthy()
    expect(screen.queryByText('Carlos Dias')).toBeNull()
    // a folha fechou e o botão diz quantos filtros estão ativos
    expect(screen.queryByTestId('atendimento-filtros')).toBeNull()
    const botao = screen.getByRole('button', { name: 'Filtros, 1 ativo' })
    expect(within(botao).getByText('1')).toBeTruthy()
    // só o Carlos tinha não lidas na etapa, então a aba perde o balão
    expect(screen.getByRole('tab', { name: 'Atendimento' })).toBeTruthy()
  })

  // O "agora" do filtro de período é a data da conversa mais recente dos mocks (05/10/2026), não o
  // relógio do aparelho: a demonstração mostra resultado em qualquer dia em que seja aberta.
  it('período Hoje, ancorado na conversa mais recente: mostra as de 05/10 e esconde a de 29/09, em qualquer data do aparelho', async () => {
    await renderDemo(rotas, '/atendimento')
    fixarHoje(new Date(2031, 0, 15, 12, 0))
    await abrirFiltros()
    await fireEvent.press(screen.getByRole('radio', { name: 'Hoje' }))
    await aplicar()
    expect(await screen.findByText('Nenhuma conversa com essa busca ou filtros.')).toBeTruthy()
    expect(screen.queryByText('Diana Melo')).toBeNull()
    await fireEvent.press(screen.getByRole('tab', { name: 'Atendimento 2 não lidas' }))
    expect(await screen.findByText('Ana Souza')).toBeTruthy()
    expect(screen.getByText('Carlos Dias')).toBeTruthy()
    expect(within(screen.getByRole('button', { name: 'Filtros, 1 ativo' })).getByText('1')).toBeTruthy()
  })

  it('período 7 dias e 30 dias mostram as três conversas, em qualquer data do aparelho', async () => {
    await renderDemo(rotas, '/atendimento')
    fixarHoje(new Date(2031, 0, 15, 12, 0))
    await abrirFiltros()
    await fireEvent.press(screen.getByRole('radio', { name: '7 dias' }))
    await aplicar()
    expect(await screen.findByText('Diana Melo')).toBeTruthy()
    await fireEvent.press(screen.getByRole('tab', { name: 'Atendimento 2 não lidas' }))
    expect(await screen.findByText('Ana Souza')).toBeTruthy()
    expect(screen.getByText('Carlos Dias')).toBeTruthy()
    await abrirFiltros('Filtros, 1 ativo')
    await fireEvent.press(screen.getByRole('radio', { name: '30 dias' }))
    await aplicar()
    expect(await screen.findByText('Ana Souza')).toBeTruthy()
  })

  it('Limpar volta tudo para sem canal e Tudo, e Aplicar devolve a lista inteira sem selo', async () => {
    await renderDemo(rotas, '/atendimento')
    fixarHoje()
    await abrirFiltros()
    await fireEvent.press(screen.getByRole('checkbox', { name: 'WhatsApp' }))
    await fireEvent.press(screen.getByRole('radio', { name: 'Hoje' }))
    await aplicar()
    expect(screen.getByRole('button', { name: 'Filtros, 2 ativos' })).toBeTruthy()
    await abrirFiltros('Filtros, 2 ativos')
    await fireEvent.press(screen.getByRole('button', { name: 'Limpar' }))
    expect(screen.getByRole('checkbox', { name: 'WhatsApp' }).props.accessibilityState.checked).toBe(false)
    expect(screen.getByRole('radio', { name: 'Tudo' }).props.accessibilityState.checked).toBe(true)
    await aplicar()
    expect(await screen.findByText('Diana Melo')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Filtros' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /ativo/ })).toBeNull()
  })

  it('fechar sem aplicar descarta o rascunho', async () => {
    await renderDemo(rotas, '/atendimento')
    await abrirFiltros()
    await fireEvent.press(screen.getByRole('checkbox', { name: 'WhatsApp' }))
    await fireEvent.press(screen.getByTestId('atendimento-filtros-fechar'))
    expect(screen.queryByTestId('atendimento-filtros')).toBeNull()
    expect(screen.getByRole('button', { name: 'Filtros' })).toBeTruthy()
    expect(await screen.findByText('Diana Melo')).toBeTruthy()
    await abrirFiltros()
    expect(screen.getByRole('checkbox', { name: 'WhatsApp' }).props.accessibilityState.checked).toBe(false)
  })
})


describe('atendimento: conteúdo no cartão', () => {
  it('a lista de conversas fica dentro de um cartão; a busca e as abas ficam fora', async () => {
    const tela = await renderDemo(rotas, '/atendimento')
    await screen.findByText('Diana Melo')
    const cartoes = nodesWithCode(tela.container, 'CARD-001')
    expect(cartoes).toHaveLength(1)
    expect(within(cartoes[0]!).getByText('Diana Melo')).toBeTruthy()
    expect(within(cartoes[0]!).queryByLabelText('Buscar conversa')).toBeNull()
    expect(within(cartoes[0]!).queryByRole('tab', { name: 'Encerrado' })).toBeNull()
  })

  it('a etapa sem conversa também mostra o aviso dentro do cartão', async () => {
    const tela = await renderDemo(rotas, '/atendimento')
    await fireEvent.press(await screen.findByRole('tab', { name: 'URA/IA' }))
    const [cartao] = nodesWithCode(tela.container, 'CARD-001')
    expect(within(cartao!).getByText('Nenhuma conversa aqui.')).toBeTruthy()
  })
})
