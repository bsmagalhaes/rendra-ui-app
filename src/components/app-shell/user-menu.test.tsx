import { fireEvent, render } from '@testing-library/react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { RendraNavigationProvider } from '../../navigation/rendra-navigation'
import { IconStub } from '../../test-utils/shell-fixtures'
import { UserMenu } from './user-menu'
import type { ShellMenuItem, ShellUser } from './types'

function montar(props: { user?: ShellUser; userMenuItems?: ShellMenuItem[]; onLogout?: () => void }, navigate = jest.fn()) {
  return render(
    <BrandProvider>
      <RendraNavigationProvider value={{ navigate, currentPath: '/' }}>
        <UserMenu user={props.user ?? { name: 'Ana Ribeiro', email: 'ana@exemplo.com' }} {...props} />
      </RendraNavigationProvider>
    </BrandProvider>,
  )
}

describe('UserMenu', () => {
  it('o gatilho é o avatar, nomeado com o usuário, e abre nome e e-mail', async () => {
    const tela = await montar({})
    await fireEvent.press(await tela.findByRole('button', { name: 'Menu de Ana Ribeiro' }))
    expect(await tela.findByText('Ana Ribeiro')).toBeTruthy()
    expect(await tela.findByText('ana@exemplo.com')).toBeTruthy()
  })

  it('sem e-mail mostra só o nome', async () => {
    const tela = await montar({ user: { name: 'Ana Ribeiro' } })
    await fireEvent.press(await tela.findByRole('button', { name: 'Menu de Ana Ribeiro' }))
    expect(await tela.findByRole('menuitem', { name: 'Aparência' })).toBeTruthy()
    expect(tela.queryByText('ana@exemplo.com')).toBeNull()
  })

  it('Aparência navega para /configuracoes', async () => {
    const navigate = jest.fn()
    const tela = await montar({}, navigate)
    await fireEvent.press(await tela.findByRole('button', { name: 'Menu de Ana Ribeiro' }))
    await fireEvent.press(await tela.findByRole('menuitem', { name: 'Aparência' }))
    expect(navigate).toHaveBeenCalledWith('/configuracoes')
  })

  it('item com `to` navega e item com `onSelect` chama a função', async () => {
    const navigate = jest.fn()
    const onSelect = jest.fn()
    const tela = await montar(
      {
        userMenuItems: [
          { label: 'Meu perfil', to: '/perfil', icon: IconStub },
          { label: 'Ajuda', onSelect },
        ],
      },
      navigate,
    )
    await fireEvent.press(await tela.findByRole('button', { name: 'Menu de Ana Ribeiro' }))
    await fireEvent.press(await tela.findByRole('menuitem', { name: 'Meu perfil' }))
    expect(navigate).toHaveBeenCalledWith('/perfil')
    await fireEvent.press(await tela.findByRole('button', { name: 'Menu de Ana Ribeiro' }))
    await fireEvent.press(await tela.findByRole('menuitem', { name: 'Ajuda' }))
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledTimes(1)
  })

  it('Sair chama onLogout', async () => {
    const onLogout = jest.fn()
    const tela = await montar({ user: { name: 'Ana' }, onLogout })
    await fireEvent.press(await tela.findByRole('button', { name: 'Menu de Ana' }))
    await fireEvent.press(await tela.findByRole('menuitem', { name: 'Sair' }))
    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('sem onLogout não há item Sair', async () => {
    const tela = await montar({})
    await fireEvent.press(await tela.findByRole('button', { name: 'Menu de Ana Ribeiro' }))
    await tela.findByRole('menuitem', { name: 'Aparência' })
    expect(tela.queryByRole('menuitem', { name: 'Sair' })).toBeNull()
  })
})

describe('UserMenu: workspaces (seletor de espaço no topo)', () => {
  const workspaces = {
    items: [
      { id: 'a', label: 'Matriz' },
      { id: 'b', label: 'Filial Sul' },
    ],
    activeId: 'a',
    onSelect: jest.fn(),
  }
  beforeEach(() => workspaces.onSelect.mockClear())

  it('sem workspaces, o menu não mostra o rótulo "Espaço" nem os itens (os casos de sempre)', async () => {
    const tela = await montar({})
    await fireEvent.press(await tela.findByRole('button', { name: 'Menu de Ana Ribeiro' }))
    await tela.findByText('ana@exemplo.com')
    expect(tela.queryByText('Espaço')).toBeNull()
  })

  it('mostra o rótulo padrão "Espaço" e os itens acima do nome e do e-mail, com o ativo marcado', async () => {
    const tela = await montar({ workspaces } as never)
    await fireEvent.press(await tela.findByRole('button', { name: 'Menu de Ana Ribeiro' }))
    expect(await tela.findByText('Espaço')).toBeTruthy()
    const matriz = await tela.findByRole('menuitem', { name: 'Matriz' })
    const filial = await tela.findByRole('menuitem', { name: 'Filial Sul' })
    expect(matriz.props.accessibilityState).toMatchObject({ selected: true })
    expect(filial.props.accessibilityState).toMatchObject({ selected: false })
    // ordem de leitura: espaços antes do nome e do e-mail
    const textos = tela.container
      .queryAll((no) => typeof no.props.children === 'string')
      .map((no) => no.props.children as string)
    expect(textos.indexOf('Matriz')).toBeLessThan(textos.indexOf('Ana Ribeiro'))
    expect(textos.indexOf('Espaço')).toBeLessThan(textos.indexOf('Matriz'))
  })

  it('label próprio troca o rótulo do grupo', async () => {
    const tela = await montar({ workspaces: { ...workspaces, label: 'Empresa' } } as never)
    await fireEvent.press(await tela.findByRole('button', { name: 'Menu de Ana Ribeiro' }))
    expect(await tela.findByText('Empresa')).toBeTruthy()
    expect(tela.queryByText('Espaço')).toBeNull()
  })

  it('tocar em outro espaço chama onSelect(id) e fecha o menu', async () => {
    const tela = await montar({ workspaces } as never)
    await fireEvent.press(await tela.findByRole('button', { name: 'Menu de Ana Ribeiro' }))
    await fireEvent.press(await tela.findByRole('menuitem', { name: 'Filial Sul' }))
    expect(workspaces.onSelect).toHaveBeenCalledWith('b')
    expect(tela.queryByRole('menuitem', { name: 'Filial Sul' })).toBeNull()
  })

  it('tocar no espaço ativo também chama onSelect (sem filtro inventado)', async () => {
    const tela = await montar({ workspaces } as never)
    await fireEvent.press(await tela.findByRole('button', { name: 'Menu de Ana Ribeiro' }))
    await fireEvent.press(await tela.findByRole('menuitem', { name: 'Matriz' }))
    expect(workspaces.onSelect).toHaveBeenCalledWith('a')
  })
})
