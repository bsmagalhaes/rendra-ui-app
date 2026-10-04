import { act, fireEvent } from '@testing-library/react-native'
import { screen } from 'expo-router/testing-library'
import { router } from 'expo-router'
import { Text } from 'react-native'
import ShellLayout from '../../../app/(shell)/_layout'
import Funil from '../../../app/(shell)/kanban'
import Tarefas from '../../../app/(shell)/tarefas'
import { toast } from '../../components/ui'
import { restaurarPlanejamento } from '../../demo/planning-store'
import { tasks } from '../../mocks/tasks'
import { renderDemo } from '../../test-utils/render-demo'

const rotas = {
  '(shell)/_layout': ShellLayout,
  '(shell)/tarefas': Tarefas,
  '(shell)/kanban': Funil,
  '(shell)/clientes/[id]': () => <Text>Tela do cliente</Text>,
}

afterEach(async () => {
  await act(async () => {
    restaurarPlanejamento()
    toast.dismiss()
  })
})

// O FlatList do Jest renderiza só o lote inicial (10 linhas): os casos usam tarefas entre as 10
// primeiras (risco registrado na reconferência, D19).
describe('tarefas', () => {
  it('lista as tarefas com prioridade e prazo', async () => {
    await renderDemo(rotas, '/tarefas')
    expect((await screen.findAllByText(tasks[0]!.titulo)).length).toBeGreaterThan(0)
    expect(screen.getAllByText(tasks[0]!.prazo).length).toBeGreaterThan(0)
    expect(screen.getAllByText(tasks[0]!.prioridade).length).toBeGreaterThan(0)
  })

  it('selecionar mostra o contador e Concluir selecionadas conclui', async () => {
    await renderDemo(rotas, '/tarefas')
    const alvo = tasks.find((t) => !t.concluida)!
    const antes = (await screen.findAllByText('Concluída')).length
    await fireEvent.press(await screen.findByRole('checkbox', { name: `Selecionar ${alvo.titulo}` }))
    expect(await screen.findByText('Selecionadas: 1')).toBeTruthy()
    await fireEvent.press(screen.getByRole('button', { name: 'Concluir selecionadas' }))
    expect(await screen.findByText('Selecionadas: 0')).toBeTruthy()
    expect(await screen.findByRole('checkbox', { name: `Selecionar ${alvo.titulo}`, checked: false })).toBeTruthy()
    expect((await screen.findAllByText('Concluída')).length).toBe(antes + 1)
    expect(await screen.findByText('Tarefa concluída')).toBeTruthy()
  })

  it('sem seleção o botão de concluir fica desabilitado', async () => {
    await renderDemo(rotas, '/tarefas')
    const botao = await screen.findByRole('button', { name: 'Concluir selecionadas' })
    expect(botao.props.accessibilityState?.disabled ?? botao.props['aria-disabled']).toBe(true)
  })

  it('o menu da tarefa conclui e reabre', async () => {
    await renderDemo(rotas, '/tarefas')
    const alvo = tasks.find((t) => !t.concluida)!
    const antes = (await screen.findAllByText('Concluída')).length
    await fireEvent.press(await screen.findByRole('button', { name: `Ações de ${alvo.titulo}` }))
    await fireEvent.press(await screen.findByRole('menuitem', { name: 'Concluir tarefa' }))
    expect((await screen.findAllByText('Concluída')).length).toBe(antes + 1)
    await fireEvent.press(await screen.findByRole('button', { name: `Ações de ${alvo.titulo}` }))
    await fireEvent.press(await screen.findByRole('menuitem', { name: 'Reabrir tarefa' }))
    expect((await screen.findAllByText('Concluída')).length).toBe(antes)
  })

  it('busca filtra a lista', async () => {
    await renderDemo(rotas, '/tarefas')
    await fireEvent.changeText(await screen.findByLabelText('Buscar tarefa'), tasks[2]!.titulo)
    expect(screen.queryByText(tasks[0]!.titulo)).toBeNull()
    expect((await screen.findAllByText(tasks[2]!.titulo)).length).toBeGreaterThan(0)
  })

  it('Enviar ao funil põe um card na primeira coluna, e ele leva ao cliente da tarefa', async () => {
    const tela = await renderDemo(rotas, '/tarefas')
    const alvo = tasks[0]!
    await fireEvent.press(await screen.findByRole('button', { name: `Ações de ${alvo.titulo}` }))
    await fireEvent.press(await screen.findByRole('menuitem', { name: 'Enviar ao funil' }))
    expect(await screen.findByText('Tarefa enviada ao funil')).toBeTruthy()
    await act(async () => {
      router.push('/kanban')
    })
    expect(await screen.findByRole('tab', { name: 'Novo contato 3' })).toBeTruthy()
    await fireEvent.press((await screen.findAllByText('Padaria Estrela'))[0]!)
    expect(await screen.findByText('Tela do cliente')).toBeTruthy()
    expect(tela.getPathname()).toBe('/clientes/1000')
  })

  it('enviar a mesma tarefa duas vezes não duplica o card', async () => {
    await renderDemo(rotas, '/tarefas')
    const alvo = tasks[0]!
    for (let i = 0; i < 2; i += 1) {
      await fireEvent.press(await screen.findByRole('button', { name: `Ações de ${alvo.titulo}` }))
      await fireEvent.press(await screen.findByRole('menuitem', { name: 'Enviar ao funil' }))
    }
    await act(async () => {
      router.push('/kanban')
    })
    expect(await screen.findByRole('tab', { name: 'Novo contato 3' })).toBeTruthy()
  })

  it('a tarefa sem cliente não oferece Enviar ao funil', async () => {
    await renderDemo(rotas, '/tarefas')
    const semCliente = tasks.find((t) => t.clienteId === undefined && tasks.indexOf(t) < 10)!
    await fireEvent.press(await screen.findByRole('button', { name: `Ações de ${semCliente.titulo}` }))
    expect(await screen.findByRole('menuitem', { name: 'Reabrir tarefa' })).toBeTruthy()
    expect(screen.queryByRole('menuitem', { name: 'Enviar ao funil' })).toBeNull()
  })

  it('busca sem resultado mostra o estado vazio', async () => {
    await renderDemo(rotas, '/tarefas')
    await fireEvent.changeText(await screen.findByLabelText('Buscar tarefa'), 'zzzz')
    expect(await screen.findByText('Nenhuma tarefa encontrada')).toBeTruthy()
  })

  describe('reordenar', () => {
    const titulos = () =>
      screen.getAllByRole('button', { name: /^Reordenar / }).map((no) => String(no.props.accessibilityLabel).replace('Reordenar ', ''))

    it('o menu Mover para baixo na primeira tarefa troca a ordem visível', async () => {
      await renderDemo(rotas, '/tarefas')
      expect(await screen.findByRole('button', { name: `Reordenar ${tasks[0]!.titulo}` })).toBeTruthy()
      expect(titulos().slice(0, 3)).toEqual([tasks[0]!.titulo, tasks[1]!.titulo, tasks[2]!.titulo])
      await fireEvent.press(screen.getByRole('button', { name: `Mover ${tasks[0]!.titulo}` }))
      await fireEvent.press(screen.getByRole('menuitem', { name: 'Mover para baixo' }))
      expect(titulos().slice(0, 3)).toEqual([tasks[1]!.titulo, tasks[0]!.titulo, tasks[2]!.titulo])
    })

    it('o Mover convive com o menu Ações de X (rótulos distintos)', async () => {
      await renderDemo(rotas, '/tarefas')
      expect(await screen.findByRole('button', { name: `Mover ${tasks[0]!.titulo}` })).toBeTruthy()
      expect(screen.getByRole('button', { name: `Ações de ${tasks[0]!.titulo}` })).toBeTruthy()
    })

    it('com a busca ativa, a alça e o Mover somem; limpar a busca devolve os dois e preserva a ordem', async () => {
      await renderDemo(rotas, '/tarefas')
      await fireEvent.press(await screen.findByRole('button', { name: `Mover ${tasks[0]!.titulo}` }))
      await fireEvent.press(screen.getByRole('menuitem', { name: 'Mover para baixo' }))
      await fireEvent.changeText(await screen.findByLabelText('Buscar tarefa'), tasks[2]!.titulo)
      expect((await screen.findAllByText(tasks[2]!.titulo)).length).toBeGreaterThan(0)
      expect(screen.queryByRole('button', { name: /^Reordenar / })).toBeNull()
      expect(screen.queryByRole('button', { name: /^Mover / })).toBeNull()
      await fireEvent.changeText(screen.getByLabelText('Buscar tarefa'), '')
      expect(await screen.findByRole('button', { name: `Reordenar ${tasks[0]!.titulo}` })).toBeTruthy()
      expect(titulos().slice(0, 3)).toEqual([tasks[1]!.titulo, tasks[0]!.titulo, tasks[2]!.titulo])
    })

    it('a ordem nova continua depois de concluir uma tarefa', async () => {
      await renderDemo(rotas, '/tarefas')
      await fireEvent.press(await screen.findByRole('button', { name: `Mover ${tasks[0]!.titulo}` }))
      await fireEvent.press(screen.getByRole('menuitem', { name: 'Mover para baixo' }))
      await fireEvent.press(screen.getByRole('button', { name: `Ações de ${tasks[2]!.titulo}` }))
      await fireEvent.press(screen.getByRole('menuitem', { name: 'Concluir tarefa' }))
      expect(titulos().slice(0, 3)).toEqual([tasks[1]!.titulo, tasks[0]!.titulo, tasks[2]!.titulo])
    })
  })
})
