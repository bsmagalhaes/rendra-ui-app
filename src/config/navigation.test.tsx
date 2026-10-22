import { getBottomNavItems, getNavigationTargets } from '../components/app-shell/navigation-utils'
import { buildNavigation, exampleUser } from './navigation'

const exampleNavigation = buildNavigation(48)
const itens = exampleNavigation.flatMap((grupo) => grupo.items)
const porTitulo = (titulo: string) => itens.find((i) => i.title === titulo)

describe('menu de exemplo da vitrine', () => {
  it('põe 4 itens na barra inferior: Painel, Componentes, Galeria e Configurações', () => {
    expect(getBottomNavItems(exampleNavigation).map((i) => i.title)).toEqual([
      'Painel',
      'Componentes',
      'Galeria',
      'Configurações',
    ])
  })

  it('leva às rotas da vitrine, com a raiz para o início', () => {
    // P3.7 (correção D8, mudança de comportamento registrada): Clientes, Cadastros (com os filhos)
    // e Tarefas entram no grupo Geral, na ordem do menu do web. P4 (T16): Atendimento, Agenda e
    // Funil entram depois de Tarefas, nessa ordem.
    expect(getNavigationTargets(exampleNavigation).map((t) => t.to)).toEqual([
      '/',
      '/painel',
      '/clientes',
      '/clientes/novo',
      '/cadastro',
      '/tarefas',
      '/atendimento',
      '/agenda',
      '/kanban',
      '/componentes',
      '/componentes-motion',
      '/dashboard-motion',
      '/tokens',
      '/galeria',
      '/configuracoes',
    ])
  })

  it('tem um usuário de exemplo com nome e e-mail', () => {
    expect(exampleUser).toEqual({ name: 'Ana Ribeiro', email: 'ana@exemplo.com' })
  })

  it('tem Clientes com selo, Cadastros com filhos e Tarefas', () => {
    expect(porTitulo('Clientes')?.to).toBe('/clientes')
    expect(porTitulo('Clientes')?.badge).toBe('48')
    expect(porTitulo('Cadastros')?.children?.map((f) => [f.title, f.to])).toEqual([
      ['Novo cliente', '/clientes/novo'],
      ['Cadastro guiado', '/cadastro'],
    ])
    expect(porTitulo('Tarefas')?.to).toBe('/tarefas')
  })

  it('tem Atendimento, Agenda e Funil no grupo Geral, depois de Tarefas, nessa ordem', () => {
    // P4 (T16, mudança de comportamento registrada): antes os três não existiam no menu.
    const geral = exampleNavigation[0]!.items.map((i) => i.title)
    expect(geral.slice(geral.indexOf('Tarefas'))).toEqual(['Tarefas', 'Atendimento', 'Agenda', 'Funil'])
    expect(porTitulo('Atendimento')?.to).toBe('/atendimento')
    expect(porTitulo('Agenda')?.to).toBe('/agenda')
    expect(porTitulo('Funil')?.to).toBe('/kanban')
  })

  it('o Dashboard com motion fica logo abaixo de Componentes com motion, com o ícone de dashboard e fora da barra inferior', () => {
    const sistema = exampleNavigation[1]!.items.map((i) => i.title)
    expect(sistema.indexOf('Dashboard com motion')).toBe(sistema.indexOf('Componentes com motion') + 1)
    expect(porTitulo('Dashboard com motion')?.to).toBe('/dashboard-motion')
    expect(porTitulo('Dashboard com motion')?.icon).toBe(porTitulo('Painel')?.icon)
    expect(porTitulo('Dashboard com motion')?.bottomNav).toBeUndefined()
  })

  it('o Funil e o Atendimento não entram na barra inferior (continuam 4 itens)', () => {
    expect(getBottomNavItems(exampleNavigation)).toHaveLength(4)
    expect(porTitulo('Atendimento')?.bottomNav).toBeUndefined()
  })
})

describe('selo de contagem do menu', () => {
  it('Atendimento leva o total de não lidas e some quando não há nenhuma', () => {
    const itensCom = (naoLidas: number) => buildNavigation(48, naoLidas).flatMap((g) => g.items)
    expect(itensCom(3).find((i) => i.title === 'Atendimento')?.badge).toBe('3')
    expect(itensCom(1).find((i) => i.title === 'Atendimento')?.badge).toBe('1')
    expect(itensCom(0).find((i) => i.title === 'Atendimento')?.badge).toBeUndefined()
  })

  it('acompanha a quantidade de clientes informada', () => {
    const itensCom = (total: number) => buildNavigation(total).flatMap((g) => g.items)
    expect(itensCom(47).find((i) => i.title === 'Clientes')?.badge).toBe('47')
    expect(itensCom(49).find((i) => i.title === 'Clientes')?.badge).toBe('49')
  })
})
