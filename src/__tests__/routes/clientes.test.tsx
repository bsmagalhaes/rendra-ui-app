import { act, fireEvent, within } from '@testing-library/react-native'
import { screen } from 'expo-router/testing-library'
import { Text } from 'react-native'
import ShellLayout from '../../../app/(shell)/_layout'
import Clientes from '../../../app/(shell)/clientes/index'
import { toast } from '../../components/ui'
import { restaurarClientes } from '../../demo/clients-store'
import { clients } from '../../mocks/clients'
import { renderDemo } from '../../test-utils/render-demo'
import { nodesWithCode } from '../../test-utils/rendra-code'

const rotas = {
  '(shell)/_layout': ShellLayout,
  '(shell)/clientes/index': Clientes,
  '(shell)/clientes/[id]': () => <Text>Tela do cliente</Text>,
  '(shell)/clientes/novo': () => <Text>Tela de novo cliente</Text>,
}

afterEach(async () => {
  restaurarClientes()
  await act(async () => {
    toast.dismiss()
  })
})

describe('lista de clientes', () => {
  it('mostra os 10 primeiros e o total', async () => {
    await renderDemo(rotas, '/clientes')
    expect((await screen.findAllByText(clients[0]!.nome)).length).toBeGreaterThan(0)
    expect(screen.queryByText(clients[10]!.nome)).toBeNull()
    expect(await screen.findByText('Mostrando 10 de 48 clientes')).toBeTruthy()
  })

  it('busca por nome', async () => {
    await renderDemo(rotas, '/clientes')
    await fireEvent.changeText(await screen.findByLabelText('Buscar cliente'), clients[3]!.nome)
    expect(await screen.findByText('Mostrando 1 de 1 cliente')).toBeTruthy()
    expect(screen.queryByText(clients[0]!.nome)).toBeNull()
  })

  it('busca sem resultado mostra o estado vazio e Limpar filtros volta à lista', async () => {
    await renderDemo(rotas, '/clientes')
    await fireEvent.changeText(await screen.findByLabelText('Buscar cliente'), 'zzzz')
    expect(await screen.findByText('Nenhum cliente encontrado')).toBeTruthy()
    await fireEvent.press(await screen.findByRole('button', { name: 'Limpar filtros' }))
    expect(await screen.findByText('Mostrando 10 de 48 clientes')).toBeTruthy()
  })

  it('carregar mais traz mais 10', async () => {
    await renderDemo(rotas, '/clientes')
    await fireEvent.press(await screen.findByRole('button', { name: 'Carregar mais' }))
    expect(await screen.findByText('Mostrando 20 de 48 clientes')).toBeTruthy()
  })

  it('filtra por situação no drawer', async () => {
    const n = clients.filter((c) => c.situacao === 'Inativo').length
    await renderDemo(rotas, '/clientes')
    await fireEvent.press(await screen.findByRole('button', { name: 'Filtros' }))
    await fireEvent.press(await screen.findByRole('radio', { name: 'Inativo' }))
    await fireEvent.press(screen.getByRole('button', { name: 'Aplicar' }))
    expect(await screen.findByText(`Mostrando ${Math.min(10, n)} de ${n} clientes`)).toBeTruthy()
    expect(screen.queryByText(clients.find((c) => c.situacao === 'Ativo')!.nome)).toBeNull()
  })

  it('filtra por segmento no drawer', async () => {
    const n = clients.filter((c) => c.segmento === 'Saúde').length
    await renderDemo(rotas, '/clientes')
    await fireEvent.press(await screen.findByRole('button', { name: 'Filtros' }))
    await fireEvent.press(await screen.findByRole('radio', { name: 'Saúde' }))
    await fireEvent.press(screen.getByRole('button', { name: 'Aplicar' }))
    expect(await screen.findByText(`Mostrando ${Math.min(10, n)} de ${n} clientes`)).toBeTruthy()
  })

  it('exclui pelo menu do item, com confirmação', async () => {
    const alvo = clients[0]!
    await renderDemo(rotas, '/clientes')
    await fireEvent.press(await screen.findByRole('button', { name: `Ações de ${alvo.nome}` }))
    await fireEvent.press(await screen.findByRole('menuitem', { name: 'Excluir' }))
    expect(await screen.findByText('Excluir cliente?')).toBeTruthy()
    await fireEvent.press(await screen.findByRole('button', { name: 'Confirmar exclusão' }))
    expect(await screen.findByText('Cliente excluído')).toBeTruthy()
    expect(screen.queryByText(alvo.nome)).toBeNull()
    expect(await screen.findByText('Mostrando 10 de 47 clientes')).toBeTruthy()
  })

  it('cancelar a exclusão mantém o cliente', async () => {
    const alvo = clients[0]!
    await renderDemo(rotas, '/clientes')
    await fireEvent.press(await screen.findByRole('button', { name: `Ações de ${alvo.nome}` }))
    await fireEvent.press(await screen.findByRole('menuitem', { name: 'Excluir' }))
    await fireEvent.press(await screen.findByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByText('Excluir cliente?')).toBeNull()
    expect((await screen.findAllByText(alvo.nome)).length).toBeGreaterThan(0)
    expect(await screen.findByText('Mostrando 10 de 48 clientes')).toBeTruthy()
  })

  it('tocar no item abre o detalhe', async () => {
    const tela = await renderDemo(rotas, '/clientes')
    await fireEvent.press((await screen.findAllByText(clients[1]!.nome))[0]!)
    expect(await screen.findByText('Tela do cliente')).toBeTruthy()
    expect(tela.getPathname()).toBe(`/clientes/${clients[1]!.id}`)
  })

  it('Novo cliente leva ao formulário', async () => {
    const tela = await renderDemo(rotas, '/clientes')
    await fireEvent.press(await screen.findByRole('button', { name: 'Novo cliente' }))
    expect(await screen.findByText('Tela de novo cliente')).toBeTruthy()
    expect(tela.getPathname()).toBe('/clientes/novo')
  })
})


describe('clientes: conteúdo no cartão', () => {
  it('a lista e o "Carregar mais" ficam dentro de um cartão; a busca e o total ficam fora', async () => {
    const tela = await renderDemo(rotas, '/clientes')
    await screen.findAllByText(clients[0]!.nome)
    const cartoes = nodesWithCode(tela.container, 'CARD-001')
    expect(cartoes).toHaveLength(1)
    expect(within(cartoes[0]!).getAllByText(clients[0]!.nome).length).toBeGreaterThan(0)
    expect(within(cartoes[0]!).getByRole('button', { name: 'Carregar mais' })).toBeTruthy()
    expect(within(cartoes[0]!).queryByLabelText('Buscar cliente')).toBeNull()
    expect(within(cartoes[0]!).queryByText('Mostrando 10 de 48 clientes')).toBeNull()
  })
})
