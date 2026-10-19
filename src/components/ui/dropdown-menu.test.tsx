import { Component, useState } from 'react'
import type { ReactNode } from 'react'
import { Platform } from 'react-native'
import { render, fireEvent, act } from '@testing-library/react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { Text } from '../internal/text'
import { Button } from './button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './dropdown-menu'
import { nodesWithCode } from '../../test-utils/rendra-code'

class LimiteDeErro extends Component<{ children: ReactNode }, { erro: Error | null }> {
  state: { erro: Error | null } = { erro: null }
  static getDerivedStateFromError(erro: Error) {
    return { erro }
  }
  componentDidCatch() {}
  render() {
    if (this.state.erro) {
      return <Text className="text-foreground">{this.state.erro.message}</Text>
    }
    return this.props.children
  }
}

function Example({ onSelectEditar = jest.fn(), onOpenChange }: { onSelectEditar?: () => void; onOpenChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <BrandProvider>
      <DropdownMenu open={open} onOpenChange={(next: boolean) => { setOpen(next); onOpenChange?.(next) }}>
        <DropdownMenuTrigger>
          <Button variant="outline" iconOnly accessibilityLabel="Mais ações" />
        </DropdownMenuTrigger>
        <DropdownMenuContent accessibilityLabel="Mais ações">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem onSelect={onSelectEditar}>Editar</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={() => {}}>Excluir</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </BrandProvider>
  )
}

describe('DropdownMenu', () => {
  it('abre ao tocar no gatilho e mostra os itens', async () => {
    const { findByLabelText, findByText } = await render(<Example />)
    const trigger = await findByLabelText('Mais ações')
    await fireEvent.press(trigger)
    expect(await findByText('Editar')).toBeTruthy()
    expect(await findByText('Excluir')).toBeTruthy()
  })

  it('tocar num item chama onSelect e fecha o menu', async () => {
    const onSelectEditar = jest.fn()
    const onOpenChange = jest.fn()
    const { findByLabelText, findByText } = await render(
      <Example onSelectEditar={onSelectEditar} onOpenChange={onOpenChange} />,
    )
    const trigger = await findByLabelText('Mais ações')
    await fireEvent.press(trigger)
    const item = await findByText('Editar')
    await fireEvent.press(item)
    expect(onSelectEditar).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('item destrutivo usa text-destructive-soft-foreground em repouso (divergência do contrato §12.4, achado do axe na Tarefa 15: color-contrast 2.67 com text-destructive)', async () => {
    const { findByLabelText, findByText } = await render(<Example />)
    const trigger = await findByLabelText('Mais ações')
    await fireEvent.press(trigger)
    const excluir = await findByText('Excluir')
    expect(excluir.props.className.split(' ')).toContain('text-destructive-soft-foreground')
  })

  it('a cor do texto do item destrutivo permanece text-destructive-soft-foreground com pressIn/pressOut (l2-a)', async () => {
    const { findByLabelText, findByText } = await render(<Example />)
    await fireEvent.press(await findByLabelText('Mais ações'))
    await act(async () => {
      fireEvent(await findByText('Excluir'), 'pressIn')
    })
    let classes = (await findByText('Excluir')).props.className.split(' ')
    expect(classes).toContain('text-destructive-soft-foreground')
    await act(async () => {
      fireEvent(await findByText('Excluir'), 'pressOut')
    })
    classes = (await findByText('Excluir')).props.className.split(' ')
    expect(classes).toContain('text-destructive-soft-foreground')
  })

  it('DropdownMenuItem fora de DropdownMenu lanca a mensagem exata (l2-c)', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const { findByText } = await render(
      <BrandProvider>
        <LimiteDeErro>
          <DropdownMenuItem onSelect={() => {}}>Item solto</DropdownMenuItem>
        </LimiteDeErro>
      </BrandProvider>,
    )
    expect(await findByText('DropdownMenuItem precisa estar dentro de <DropdownMenu>.')).toBeTruthy()
    spy.mockRestore()
  })

  it('DropdownMenuContent carrega dataSet.rendra = DDM-001, aberto (item D12 do levantamento da Sincronizacao 1)', async () => {
    const { findByLabelText, container } = await render(<Example />)
    const trigger = await findByLabelText('Mais ações')
    await fireEvent.press(trigger)
    expect(nodesWithCode(container, 'DDM-001')).toHaveLength(1)
  })
})

describe('DropdownMenuItem: selected (B5, sem aria-selected no web)', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })
  function ComItem({ selected }: { selected?: boolean }) {
    return (
      <BrandProvider>
        <DropdownMenu open onOpenChange={() => {}}>
          <DropdownMenuTrigger>
            <Button variant="outline" iconOnly accessibilityLabel="Abrir" />
          </DropdownMenuTrigger>
          <DropdownMenuContent accessibilityLabel="Menu">
            <DropdownMenuItem selected={selected} onSelect={() => {}}>
              Espaço A
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </BrandProvider>
    )
  }
  const icones = (item: { queryAll: (f: (no: { type: unknown }) => boolean) => unknown[] }) =>
    item.queryAll((no) => String(no.type) === 'RNSVGSvgView')

  it('nativo: selected marca accessibilityState.selected e mostra o Check; sem a prop, só disabled', async () => {
    const marcado = await render(<ComItem selected />)
    const item = await marcado.findByRole('menuitem', { name: 'Espaço A' })
    expect(item.props.accessibilityState).toMatchObject({ selected: true, disabled: false })
    expect(icones(item)).toHaveLength(1)
    await marcado.unmount()
    const solto = await render(<ComItem />)
    const semProp = await solto.findByRole('menuitem', { name: 'Espaço A' })
    expect(semProp.props.accessibilityState).toEqual({ disabled: false })
    expect(icones(semProp)).toHaveLength(0)
  })

  it('selected={false} não marca nem mostra o Check', async () => {
    const tela = await render(<ComItem selected={false} />)
    const item = await tela.findByRole('menuitem', { name: 'Espaço A' })
    expect(item.props.accessibilityState).toMatchObject({ selected: false })
    expect(icones(item)).toHaveLength(0)
  })

  it('web: usa aria-current="true" e nunca selected no accessibilityState (aria-selected não vale em menuitem)', async () => {
    jest.replaceProperty(Platform, 'OS', 'web')
    const marcado = await render(<ComItem selected />)
    const item = await marcado.findByRole('menuitem', { name: 'Espaço A' })
    expect(item.props['aria-current']).toBe('true')
    expect(item.props.accessibilityState).toEqual({ disabled: false })
    expect(icones(item)).toHaveLength(1)
    await marcado.unmount()
    const desmarcado = await render(<ComItem selected={false} />)
    const outro = await desmarcado.findByRole('menuitem', { name: 'Espaço A' })
    expect(outro.props['aria-current']).toBeUndefined()
  })
})
