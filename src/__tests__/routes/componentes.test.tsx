import { renderRouter, screen } from 'expo-router/testing-library'
import { fireEvent, waitFor, within } from '@testing-library/react-native'
import RootLayout from '../../../app/_layout'
import ComponentesLayout from '../../../app/(shell)/componentes/_layout'
import ComponentesIndex from '../../../app/(shell)/componentes/index'
import ComponentesSlugScreen, { generateStaticParams } from '../../../app/(shell)/componentes/[slug]'

function routes() {
  return {
    _layout: RootLayout,
    'componentes/_layout': ComponentesLayout,
    'componentes/index': ComponentesIndex,
  }
}

function fullRoutes() {
  return {
    ...routes(),
    'componentes/[slug]': ComponentesSlugScreen,
  }
}

describe('/componentes (lista)', () => {
  it('lista os 5 grupos da vitrine', async () => {
    await renderRouter(routes(), { initialUrl: '/componentes' })
    expect(await screen.findByText('Ações')).toBeTruthy()
    expect(await screen.findByText('Formulário')).toBeTruthy()
    expect(await screen.findByText('Feedback')).toBeTruthy()
    expect(await screen.findByText('Exibição')).toBeTruthy()
    expect(await screen.findByText('Layout')).toBeTruthy()
  })
})

describe('/componentes/[slug]', () => {
  it('abre o grupo de ações com as 4 entradas', async () => {
    await renderRouter(fullRoutes(), { initialUrl: '/componentes/acoes' })
    expect(await screen.findByText('Button')).toBeTruthy()
    expect(await screen.findByText('ButtonGroup')).toBeTruthy()
    expect(await screen.findByText('ActionBar')).toBeTruthy()
    expect(await screen.findByText('DropdownMenu')).toBeTruthy()
  })

  it('abre o grupo de layout com as 6 entradas', async () => {
    await renderRouter(fullRoutes(), { initialUrl: '/componentes/layout' })
    expect(await screen.findByText('Container')).toBeTruthy()
    expect(await screen.findByText('PageHeader')).toBeTruthy()
  })

  it('navega da lista para o grupo de layout ao tocar no link', async () => {
    await renderRouter(fullRoutes(), { initialUrl: '/componentes' })
    const link = await screen.findByText('Layout')
    await fireEvent.press(link)
    expect(await screen.findByText('Container')).toBeTruthy()
  })

  it('renderiza /componentes/formulario com as 11 entradas', async () => {
    const context = await renderRouter(fullRoutes(), { initialUrl: '/componentes/formulario' })
    expect(await context.findByText('Input')).toBeTruthy()
    expect(await context.findByText('Formulário (RHF)')).toBeTruthy()
  })

  it('renderiza /componentes/dados com o Chart e os sete codigos CHT', async () => {
    const context = await renderRouter(fullRoutes(), { initialUrl: '/componentes/dados' })
    expect(await context.findByText('Chart')).toBeTruthy()
    expect(await context.findByText('CHT-001')).toBeTruthy()
    expect(await context.findByText('CHT-007')).toBeTruthy()
    expect(await context.findByText('TLN-001')).toBeTruthy()
    expect(await context.findByText('Contrato assinado')).toBeTruthy()
  })

  it('renderiza /componentes/planejamento com o Calendar e o evento tocado', async () => {
    const context = await renderRouter(fullRoutes(), { initialUrl: '/componentes/planejamento' })
    expect(await context.findByText('CAL-001')).toBeTruthy()
    expect(await context.findByText('Outubro de 2026')).toBeTruthy()
    await fireEvent.press(await context.findByRole('button', { name: /Reunião de equipe/ }))
    expect(await context.findByText('Evento aberto: Reunião de equipe')).toBeTruthy()
  })

  it('renderiza os dois Kanban em /componentes/planejamento e move um card pelo menu', async () => {
    const context = await renderRouter(fullRoutes(), { initialUrl: '/componentes/planejamento' })
    expect(await context.findByText('KANB-001')).toBeTruthy()
    expect(await context.findByText('KANB-002')).toBeTruthy()
    const botoes = await context.findAllByRole('button', { name: 'Ações do card Padaria Estrela' })
    await fireEvent.press(botoes[0]!)
    await fireEvent.press(await context.findByRole('menuitem', { name: 'Fechamento' }))
    expect(await context.findAllByRole('tab', { name: 'Fechamento 2' })).toHaveLength(1)
  })

  it('abre a galeria de exemplo do ImageViewer, navega e fecha', async () => {
    const context = await renderRouter(fullRoutes(), { initialUrl: '/componentes/planejamento' })
    expect(await context.findByText('IMG-001')).toBeTruthy()
    await fireEvent.press(await context.findByText('Abrir galeria de exemplo'))
    expect(await context.findByText('1 de 4')).toBeTruthy()
    await fireEvent.press(context.getByLabelText('Próxima'))
    expect(await context.findByText('2 de 4')).toBeTruthy()
    await fireEvent.press(context.getByLabelText('Fechar'))
    expect(context.queryByTestId('image-viewer')).toBeNull()
  })

  it('no atendimento, abrir a conversa tira o contador e enviar acrescenta a mensagem ao historico', async () => {
    const context = await renderRouter(fullRoutes(), { initialUrl: '/componentes/planejamento' })
    expect(await context.findByText('CHAT-003')).toBeTruthy()
    expect(within(context.getByTestId('conversation-item-t2')).getByText('2')).toBeTruthy()
    await fireEvent.press(context.getByRole('button', { name: /Carlos Dias/ }))
    expect(within(context.getByTestId('conversation-item-t2')).queryByText('2')).toBeNull()
    expect(await context.findByText('Bom dia, o relatório de vendas não abre aqui.')).toBeTruthy()
    expect(within(context.getByTestId('chat-canal-ativo')).getByText('E-mail')).toBeTruthy()
    await fireEvent.changeText(context.getByLabelText('Mensagem'), 'Posso ajudar em algo mais?')
    await fireEvent.press(context.getByLabelText('Enviar'))
    expect(await context.findByText('Posso ajudar em algo mais?')).toBeTruthy()
    expect(context.getByLabelText('Mensagem').props.value).toBe('')
  })

  it('no atendimento, responder, reagir, editar e excluir agem sobre a mensagem escolhida', async () => {
    const context = await renderRouter(fullRoutes(), { initialUrl: '/componentes/planejamento' })
    await context.findByText('CHAT-003')
    // Responder: o campo mostra a citacao e cancelar a tira.
    await fireEvent(context.getByTestId('message-bubble-a5'), 'longPress')
    await fireEvent.press(await context.findByText('Responder'))
    expect(await context.findByText('Respondendo a Ana Souza')).toBeTruthy()
    await fireEvent.press(context.getByLabelText('Cancelar resposta'))
    expect(context.queryByText('Respondendo a Ana Souza')).toBeNull()
    // Reagir: a nova reacao aparece abaixo do balao.
    await fireEvent(context.getByTestId('message-bubble-a5'), 'longPress')
    await fireEvent.press(await context.findByLabelText('Reagir com ❤️'))
    expect(await context.findByLabelText('Reação ❤️. Remover')).toBeTruthy()
    await fireEvent.press(context.getByLabelText('Reação ❤️. Remover'))
    expect(context.queryByLabelText('Reação ❤️. Remover')).toBeNull()
    // Editar: o campo vem com o texto, e enviar troca o texto e mostra o original riscado.
    await fireEvent(context.getByTestId('message-bubble-a4'), 'longPress')
    await fireEvent.press(await context.findByText('Editar'))
    expect(await context.findByText('Editando mensagem')).toBeTruthy()
    expect(context.getByLabelText('Mensagem').props.value).toBe('Boleto de outubro, vence em 10/10/2026.')
    await fireEvent.changeText(context.getByLabelText('Mensagem'), 'Boleto de outubro, vence em 15/10/2026.')
    await fireEvent.press(context.getByLabelText('Enviar'))
    expect(await context.findByText('Boleto de outubro, vence em 15/10/2026.')).toBeTruthy()
    expect(context.getByText('Boleto de outubro, vence em 10/10/2026.')).toBeTruthy()
    expect(context.queryByText('Editando mensagem')).toBeNull()
    await fireEvent.press(context.getByLabelText('Mais ações da mensagem'))
    await fireEvent.press(await context.findByText('Anexar arquivo'))
    await context.findByText('Orçamento.pdf')
    // Excluir: a mensagem continua, riscada.
    await fireEvent(context.getByTestId('message-bubble-a3'), 'longPress')
    await fireEvent.press(await context.findByText('Excluir'))
    expect(await context.findByText('Mensagem excluída')).toBeTruthy()
  })

  it('renderiza /componentes/formulario com o RichTextEditor e a barra de formatacao do celular', async () => {
    const context = await renderRouter(fullRoutes(), { initialUrl: '/componentes/formulario' })
    expect(await context.findByText('RTE-001')).toBeTruthy()
    expect(await context.findByText(/^Conteúdo: \d+ caracteres$/)).toBeTruthy()
    expect(await context.findByLabelText('Negrito (Ctrl+B)')).toBeTruthy()
    expect(context.getByLabelText('Inserir imagem')).toBeTruthy()
  })

  it('renderiza /componentes/exibicao com o DocumentViewer, carregando o PDF e voltando ao vazio', async () => {
    const context = await renderRouter(fullRoutes(), { initialUrl: '/componentes/exibicao' })
    expect(await context.findByText('DOC-001')).toBeTruthy()
    expect(await context.findByText('Carregando documento...')).toBeTruthy()
    await fireEvent.press(context.getByText('Limpar seleção'))
    expect(await context.findByText('Nenhum documento selecionado')).toBeTruthy()
    await fireEvent.press(context.getByText('Selecionar contrato'))
    expect(await context.findByText('Carregando documento...')).toBeTruthy()
  })

  it('no formulario, Inserir imagem pede o endereco ao exemplo e o poe no editor', async () => {
    const context = await renderRouter(fullRoutes(), { initialUrl: '/componentes/formulario' })
    await fireEvent.press(await context.findByLabelText('Inserir imagem'))
    const tentap = jest.requireMock('@10play/tentap-editor') as { __editor: { setImage: jest.Mock } }
    await waitFor(() => expect(tentap.__editor.setImage).toHaveBeenCalledTimes(1))
    expect(typeof tentap.__editor.setImage.mock.calls[0][0]).toBe('string')
  })

  it('no planejamento, adicionar card, marcar como ganho, anexar midia e cancelar edicao chamam os manipuladores da vitrine', async () => {
    const context = await renderRouter(fullRoutes(), { initialUrl: '/componentes/planejamento' })
    await context.findByText('CHAT-003')
    const adicionar = await context.findAllByLabelText(/^Adicionar card em /)
    await fireEvent.press(adicionar[0]!)
    expect((await context.findAllByText(/^Novo card \d+$/)).length).toBeGreaterThan(0)
    const botoes = await context.findAllByRole('button', { name: 'Ações do card Padaria Estrela' })
    await fireEvent.press(botoes[1]!)
    await fireEvent.press(await context.findByRole('menuitem', { name: /Marcar como ganho/ }))
    await fireEvent.press(context.getByLabelText('Mais ações da mensagem'))
    await fireEvent.press(await context.findByText('Imagem ou vídeo'))
    expect(await context.findByText('Foto da vitrine.jpg')).toBeTruthy()
    await fireEvent.press(context.getByLabelText('Enviar'))
    expect((await context.findAllByText('Foto da vitrine.jpg')).length).toBeGreaterThan(0)
    await fireEvent(context.getByTestId('message-bubble-a5'), 'longPress')
    await fireEvent.press(await context.findByText('Responder'))
    await fireEvent.press(context.getByLabelText('Cancelar resposta'))
    await fireEvent(context.getByTestId('message-bubble-a4'), 'longPress')
    await fireEvent.press(await context.findByText('Editar'))
    await fireEvent.press(context.getByLabelText('Cancelar edição'))
    expect(context.queryByText('Editando mensagem')).toBeNull()
  })

  it('mostra "Grupo não encontrado" para slug inválido', async () => {
    const context = await renderRouter(fullRoutes(), { initialUrl: '/componentes/nao-existe' })
    expect(await context.findByText('Grupo não encontrado')).toBeTruthy()
  })

  it('generateStaticParams devolve um slug por grupo da vitrine', () => {
    const params = generateStaticParams()
    expect(params).toEqual([
      { slug: 'acoes' },
      { slug: 'formulario' },
      { slug: 'feedback' },
      { slug: 'exibicao' },
      { slug: 'layout' },
      { slug: 'dados' },
      { slug: 'planejamento' },
    ])
  })

  it('renderiza /componentes/feedback com Alert e Drawer', async () => {
    const context = await renderRouter(fullRoutes(), { initialUrl: '/componentes/feedback' })
    expect(await context.findByText('Alert')).toBeTruthy()
    expect(await context.findByText('Drawer')).toBeTruthy()
  })

  it('renderiza /componentes/exibicao com Badge e Separator', async () => {
    const context = await renderRouter(fullRoutes(), { initialUrl: '/componentes/exibicao' })
    expect(await context.findByText('Badge')).toBeTruthy()
    expect(await context.findByText('Separator')).toBeTruthy()
  })

  it('renderiza List, Tabs e BrandLogo em /componentes/exibicao', async () => {
    const context = await renderRouter(fullRoutes(), { initialUrl: '/componentes/exibicao' })
    expect(await context.findByText('List')).toBeTruthy()
    expect(await context.findByText('Tabs')).toBeTruthy()
    expect(await context.findByText('BrandLogo')).toBeTruthy()
  })

  it('a List da vitrine é reordenável: o menu Mover muda a ordem visível das linhas', async () => {
    await renderRouter(fullRoutes(), { initialUrl: '/componentes/exibicao' })
    const ordem = () => screen.getAllByRole('button', { name: /^Reordenar / }).map((no) => String(no.props.accessibilityLabel))
    expect(await screen.findByRole('button', { name: 'Reordenar Ana Souza' })).toBeTruthy()
    expect(ordem()).toEqual(['Reordenar Ana Souza', 'Reordenar Bruno Lima', 'Reordenar Carla Dias'])
    await fireEvent.press(screen.getByRole('button', { name: 'Mover Ana Souza' }))
    await fireEvent.press(screen.getByRole('menuitem', { name: 'Mover para baixo' }))
    expect(ordem()).toEqual(['Reordenar Bruno Lima', 'Reordenar Ana Souza', 'Reordenar Carla Dias'])
  })

  it('mostra o selo do codigo do catalogo ao lado do titulo (Tarefa 1.3, secao 2.1 e 3.3.4 do levantamento)', async () => {
    const acoes = await renderRouter(fullRoutes(), { initialUrl: '/componentes/acoes' })
    expect(await acoes.findByText('BTN-001')).toBeTruthy()
    const exibicao = await renderRouter(fullRoutes(), { initialUrl: '/componentes/exibicao' })
    expect(await exibicao.findByText('ABA-001')).toBeTruthy()
    expect(await exibicao.findByText('AVT-001')).toBeTruthy()
    expect(await exibicao.findByText('AVT-002')).toBeTruthy()
  })

  it('grupo de layout nao mostra selo (Container, Stack etc. nao tem codigo de catalogo)', async () => {
    const layout = await renderRouter(fullRoutes(), { initialUrl: '/componentes/layout' })
    expect(await layout.findByText('Container')).toBeTruthy()
    expect(layout.queryByText('CARD-001')).toBeNull()
  })
})
