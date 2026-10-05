import { act, fireEvent, within } from '@testing-library/react-native'
import { screen } from 'expo-router/testing-library'
import { router } from 'expo-router'
import { Text } from 'react-native'
import ShellLayout from '../../../app/(shell)/_layout'
import Atendimento from '../../../app/(shell)/atendimento/index'
import Conversa from '../../../app/(shell)/atendimento/[id]'
import Detalhe, { generateStaticParams } from '../../../app/(shell)/clientes/[id]'
import { toast } from '../../components/ui'
import { restaurarClientes } from '../../demo/clients-store'
import { restaurarTickets } from '../../demo/tickets-store'
import { activityOf, clients } from '../../mocks/clients'
import { renderDemo } from '../../test-utils/render-demo'

const rotas = {
  '(shell)/_layout': ShellLayout,
  '(shell)/clientes/[id]': Detalhe,
  '(shell)/clientes/index': () => <Text>Lista de clientes</Text>,
  '(shell)/atendimento/index': Atendimento,
  '(shell)/atendimento/[id]': Conversa,
}

afterEach(async () => {
  restaurarClientes()
  restaurarTickets()
  await act(async () => {
    toast.dismiss()
  })
})

describe('detalhe do cliente', () => {
  it('gera uma página estática por cliente (B8)', () => {
    expect(generateStaticParams()).toHaveLength(48)
    expect(generateStaticParams()).toContainEqual({ id: '1000' })
  })

  it('mostra o nome e as quatro abas', async () => {
    await renderDemo(rotas, `/clientes/${clients[0]!.id}`)
    expect((await screen.findAllByText(clients[0]!.nome)).length).toBeGreaterThan(0)
    for (const aba of ['Resumo', 'Contratos', 'Atividade', 'Documentos']) {
      expect(screen.getByRole('tab', { name: aba })).toBeTruthy()
    }
  })

  it('o Resumo mostra os dados do cliente', async () => {
    await renderDemo(rotas, `/clientes/${clients[0]!.id}`)
    expect(await screen.findByText(clients[0]!.cnpj)).toBeTruthy()
    expect(await screen.findByText(clients[0]!.email)).toBeTruthy()
  })

  it('a aba Contratos lista valores em reais', async () => {
    await renderDemo(rotas, `/clientes/${clients[0]!.id}`)
    await fireEvent.press(await screen.findByRole('tab', { name: 'Contratos' }))
    expect((await screen.findAllByText(/^R\$\s\d/)).length).toBeGreaterThan(0)
    expect(await screen.findByText('Plano mensal')).toBeTruthy()
  })

  it('a aba Atividade lista os eventos com data', async () => {
    await renderDemo(rotas, `/clientes/${clients[0]!.id}`)
    await fireEvent.press(await screen.findByRole('tab', { name: 'Atividade' }))
    expect(await screen.findByText('Fatura de setembro paga')).toBeTruthy()
    expect(await screen.findByText('29/09/2026')).toBeTruthy()
    // Linha do tempo: um item por evento de activityOf, com título, data e o tom de cada um.
    const linha = screen.getByTestId('timeline')
    for (const a of activityOf(clients[0]!.id)) {
      expect(within(linha).getByText(a.titulo)).toBeTruthy()
      expect(within(linha).getByText(a.data)).toBeTruthy()
      expect(screen.getByTestId(`timeline-item-${a.id}`)).toBeTruthy()
    }
    expect(screen.getByTestId('timeline-ponto-1000-a1').props.className).toContain('bg-success')
    expect(screen.getByTestId('timeline-ponto-1000-a2').props.className).not.toContain('bg-success')
  })

  it('a aba Documentos mostra o estado vazio e Anexar só avisa', async () => {
    await renderDemo(rotas, `/clientes/${clients[0]!.id}`)
    await fireEvent.press(await screen.findByRole('tab', { name: 'Documentos' }))
    expect(await screen.findByText('Nenhum documento anexado')).toBeTruthy()
    await fireEvent.press(screen.getByRole('button', { name: 'Anexar documento' }))
    expect(await screen.findByText('Anexo simulado nesta demonstração')).toBeTruthy()
  })

  it('id inexistente mostra o estado de não encontrado', async () => {
    await renderDemo(rotas, '/clientes/9999')
    expect(await screen.findByText('Cliente não encontrado')).toBeTruthy()
    expect(screen.queryByRole('tab', { name: 'Resumo' })).toBeNull()
  })

  it('excluir pelo cabeçalho pede confirmação e volta à lista', async () => {
    const tela = await renderDemo(rotas, `/clientes/${clients[0]!.id}`)
    await fireEvent.press(await screen.findByRole('button', { name: 'Excluir cliente' }))
    expect(await screen.findByText('Excluir cliente?')).toBeTruthy()
    await fireEvent.press(await screen.findByRole('button', { name: 'Confirmar exclusão' }))
    expect(await screen.findByText('Lista de clientes')).toBeTruthy()
    expect(tela.getPathname()).toBe('/clientes')
    expect(await screen.findByText('Cliente excluído')).toBeTruthy()
  })

  it('Conversar abre a conversa do cliente que tem uma (1000 para t1, 1009 para t2)', async () => {
    const tela = await renderDemo(rotas, '/clientes/1009')
    await fireEvent.press(await screen.findByRole('button', { name: 'Conversar' }))
    expect(await screen.findByLabelText('Mensagem')).toBeTruthy()
    expect(tela.getPathname()).toBe('/atendimento/t2')
    expect(await screen.findByText('Bom dia, o relatório de vendas não abre aqui.')).toBeTruthy()
  })

  it('Conversar leva o cliente 1000 à conversa t1', async () => {
    const tela = await renderDemo(rotas, '/clientes/1000')
    await fireEvent.press(await screen.findByRole('button', { name: 'Conversar' }))
    expect(await screen.findByLabelText('Mensagem')).toBeTruthy()
    expect(tela.getPathname()).toBe('/atendimento/t1')
  })

  it('abrir a conversa pelo cliente zera as não lidas dela na lista', async () => {
    await renderDemo(rotas, '/clientes/1009')
    await fireEvent.press(await screen.findByRole('button', { name: 'Conversar' }))
    await screen.findByLabelText('Mensagem')
    await act(async () => {
      router.replace('/atendimento')
    })
    // a conversa do Carlos foi aberta e as não lidas dela zeraram: a aba fica sem balão
    await fireEvent.press(await screen.findByRole('tab', { name: 'Atendimento' }))
    expect(within(await screen.findByTestId('conversation-item-t2')).queryByText('2')).toBeNull()
  })

  it('o cliente sem conversa não tem o botão Conversar', async () => {
    await renderDemo(rotas, '/clientes/1001')
    await screen.findByRole('button', { name: 'Excluir cliente' })
    expect(screen.queryByRole('button', { name: 'Conversar' })).toBeNull()
  })

  it('cancelar a exclusão fica no detalhe', async () => {
    const tela = await renderDemo(rotas, `/clientes/${clients[0]!.id}`)
    await fireEvent.press(await screen.findByRole('button', { name: 'Excluir cliente' }))
    await fireEvent.press(await screen.findByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByText('Excluir cliente?')).toBeNull()
    expect(tela.getPathname()).toBe(`/clientes/${clients[0]!.id}`)
  })
})
