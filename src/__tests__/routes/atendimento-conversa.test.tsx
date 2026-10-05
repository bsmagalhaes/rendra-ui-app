import { act, fireEvent, within } from '@testing-library/react-native'
import { screen } from 'expo-router/testing-library'
import { router } from 'expo-router'
import ShellLayout from '../../../app/(shell)/_layout'
import Atendimento from '../../../app/(shell)/atendimento/index'
import Conversa, { generateStaticParams } from '../../../app/(shell)/atendimento/[id]'
import { restaurarTickets } from '../../demo/tickets-store'
import { renderDemo } from '../../test-utils/render-demo'

const rotas = {
  '(shell)/_layout': ShellLayout,
  '(shell)/atendimento/index': Atendimento,
  '(shell)/atendimento/[id]': Conversa,
}

afterEach(async () => {
  await act(async () => {
    restaurarTickets()
  })
})

describe('atendimento: conversa', () => {
  it('gera uma página estática por conversa (t1, t2 e t3)', () => {
    expect(generateStaticParams()).toEqual([{ id: 't1' }, { id: 't2' }, { id: 't3' }])
  })

  it('mostra o nome do contato, as mensagens, o campo Mensagem e o botão Enviar', async () => {
    await renderDemo(rotas, '/atendimento/t2')
    expect((await screen.findAllByText('Carlos Dias')).length).toBeGreaterThan(0)
    expect(await screen.findByText('Bom dia, o relatório de vendas não abre aqui.')).toBeTruthy()
    expect(screen.getByTestId('message-bubble-c1')).toBeTruthy()
    expect(screen.getByLabelText('Mensagem')).toBeTruthy()
    expect(screen.getByLabelText('Enviar')).toBeTruthy()
  })

  it('enviar acrescenta a bolha na conversa e limpa o campo', async () => {
    await renderDemo(rotas, '/atendimento/t2')
    await fireEvent.changeText(await screen.findByLabelText('Mensagem'), 'Posso ajudar em algo mais?')
    await fireEvent.press(screen.getByLabelText('Enviar'))
    expect(await screen.findByText('Posso ajudar em algo mais?')).toBeTruthy()
    expect(screen.getByLabelText('Mensagem').props.value).toBe('')
  })

  it('ao voltar para a lista, a conversa aberta não tem mais o contador de não lidas', async () => {
    await renderDemo(rotas, '/atendimento')
    await fireEvent.press(await screen.findByRole('tab', { name: 'Atendimento 2 não lidas' }))
    expect(within(await screen.findByTestId('conversation-item-t2')).getByText('2')).toBeTruthy()
    await fireEvent.press(within(screen.getByTestId('conversation-item-t2')).getByRole('button'))
    expect(await screen.findByLabelText('Mensagem')).toBeTruthy()
    await act(async () => {
      router.back()
    })
    // abrir a conversa zerou as não lidas do Carlos: a aba perde o balão
    expect(await screen.findByRole('tab', { name: 'Atendimento' })).toBeTruthy()
    expect(screen.queryByRole('tab', { name: 'Atendimento 2 não lidas' })).toBeNull()
    await fireEvent.press(screen.getByRole('tab', { name: 'Atendimento' }))
    expect(within(await screen.findByTestId('conversation-item-t2')).queryByText('2')).toBeNull()
  })

  it('o selo do Atendimento no menu mostra 3 não lidas e cai para 1 depois de abrir a conversa do Carlos', async () => {
    await renderDemo(rotas, '/atendimento')
    await fireEvent.press(await screen.findByRole('button', { name: 'Abrir menu' }))
    const menu = await screen.findByLabelText('Navegação principal')
    const itemAntes = within(menu).getByRole('link', { name: /Atendimento/ })
    expect(within(itemAntes).getByText('3')).toBeTruthy()
    await fireEvent.press(screen.getByLabelText('Fechar menu'))
    await fireEvent.press(await screen.findByRole('tab', { name: 'Atendimento 2 não lidas' }))
    await fireEvent.press(within(await screen.findByTestId('conversation-item-t2')).getByRole('button'))
    await screen.findByLabelText('Mensagem')
    await fireEvent.press(await screen.findByRole('button', { name: 'Abrir menu' }))
    const itemDepois = within(await screen.findByLabelText('Navegação principal')).getByRole('link', { name: /Atendimento/ })
    expect(within(itemDepois).getByText('1')).toBeTruthy()
    expect(within(itemDepois).queryByText('3')).toBeNull()
  })

  it('responder cita a mensagem, e reagir e editar agem sobre a mensagem escolhida', async () => {
    await renderDemo(rotas, '/atendimento/t1')
    await screen.findByLabelText('Mensagem')
    await fireEvent(screen.getByTestId('message-bubble-a5'), 'longPress')
    await fireEvent.press(await screen.findByText('Responder'))
    expect(await screen.findByText('Respondendo a Ana Souza')).toBeTruthy()
    await fireEvent.press(screen.getByLabelText('Cancelar resposta'))
    await fireEvent(screen.getByTestId('message-bubble-a5'), 'longPress')
    await fireEvent.press(await screen.findByLabelText('Reagir com ❤️'))
    expect(await screen.findByLabelText('Reação ❤️. Remover')).toBeTruthy()
    await fireEvent(screen.getByTestId('message-bubble-a4'), 'longPress')
    await fireEvent.press(await screen.findByText('Editar'))
    expect(await screen.findByText('Editando mensagem')).toBeTruthy()
    await fireEvent.changeText(screen.getByLabelText('Mensagem'), 'Boleto de outubro, vence em 15/10/2026.')
    await fireEvent.press(screen.getByLabelText('Enviar'))
    expect(await screen.findByText('Boleto de outubro, vence em 15/10/2026.')).toBeTruthy()
    expect(screen.getByText('Boleto de outubro, vence em 10/10/2026.')).toBeTruthy()
  })

  it('excluir marca a mensagem e anexar arquivo envia o anexo', async () => {
    await renderDemo(rotas, '/atendimento/t1')
    await screen.findByLabelText('Mensagem')
    await fireEvent(screen.getByTestId('message-bubble-a3'), 'longPress')
    await fireEvent.press(await screen.findByText('Excluir'))
    expect(await screen.findByText('Mensagem excluída')).toBeTruthy()
    await fireEvent.press(screen.getByLabelText('Mais ações da mensagem'))
    await fireEvent.press(await screen.findByText('Anexar arquivo'))
    expect(await screen.findByText('Orçamento.pdf')).toBeTruthy()
  })

  it('id inexistente mostra o estado de não encontrado, sem campo de mensagem', async () => {
    await renderDemo(rotas, '/atendimento/zzz')
    expect(await screen.findByText('Conversa não encontrada')).toBeTruthy()
    expect(screen.queryByLabelText('Mensagem')).toBeNull()
  })
})

describe('atendimento: conversa da fila', () => {
  it('no t3 o campo some, aparece o aviso e a ação Assumir atendimento', async () => {
    await renderDemo(rotas, '/atendimento/t3')
    expect(await screen.findByText('Assuma a conversa para responder.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Assumir atendimento' })).toBeTruthy()
    expect(screen.queryByLabelText('Mensagem')).toBeNull()
  })

  it('assumir devolve o campo, registra o aviso de sistema e tira a conversa da Fila', async () => {
    await renderDemo(rotas, '/atendimento')
    await fireEvent.press(within(await screen.findByTestId('conversation-item-t3')).getByRole('button'))
    await fireEvent.press(await screen.findByRole('button', { name: 'Assumir atendimento' }))
    expect(await screen.findByLabelText('Mensagem')).toBeTruthy()
    expect(screen.getByText(/^Ana Ribeiro assumiu a conversa · [0-9]{2}:[0-9]{2}$/)).toBeTruthy()
    expect(screen.queryByText('Assuma a conversa para responder.')).toBeNull()
    await act(async () => {
      router.back()
    })
    // sem conversas não lidas na Fila; a Diana assumida entra em Atendimento já lida (só o Carlos tem 2)
    expect(await screen.findByRole('tab', { name: 'Fila' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Atendimento 2 não lidas' })).toBeTruthy()
    await fireEvent.press(screen.getByRole('tab', { name: 'Atendimento 2 não lidas' }))
    expect(await screen.findByTestId('conversation-item-t3')).toBeTruthy()
  })
})
