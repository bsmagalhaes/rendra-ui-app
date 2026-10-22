import { Text } from 'react-native'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { RendraNavigationProvider } from '../../navigation/rendra-navigation'
import { advance, transformValue } from '../../test-utils/motion-style'
import { Table, type TableColumn } from './table'

jest.mock('../../lib/reduced-motion', () => ({ useReducedMotion: jest.fn(() => false) }))

interface Cliente {
  id: string
  nome: string
}
const dados: Cliente[] = [{ id: '1', nome: 'Padaria Estrela' }]

function Casa({ comLink, motion = 'on', navigate = jest.fn() }: { comLink: boolean; motion?: 'on' | 'off'; navigate?: jest.Mock }) {
  const colunas: TableColumn<Cliente>[] = [
    {
      id: 'nome',
      header: 'Nome',
      accessor: (c) => c.nome,
      mobile: 'primary',
      ...(comLink ? { href: (c: Cliente) => `/clientes/${c.id}` } : {}),
    },
  ]
  return (
    <BrandProvider motion={motion}>
      <RendraNavigationProvider value={{ navigate }}>
        <Table<Cliente> data={dados} columns={colunas} getRowId={(c) => c.id} accessibilityLabel="Clientes" />
        <Text>fim</Text>
      </RendraNavigationProvider>
    </BrandProvider>
  )
}

beforeEach(() => jest.useFakeTimers())
afterEach(() => jest.useRealTimers())

describe('Table em motion="on"', () => {
  it('a linha com href escala no toque e ainda navega', async () => {
    const navigate = jest.fn()
    await render(<Casa comLink navigate={navigate} />)
    await fireEvent(screen.getByTestId('tabela-link'), 'pressIn')
    await advance(1500)
    expect(transformValue('tabela-link-motion', 'scale') as number).toBeLessThan(1)
    await fireEvent.press(screen.getByTestId('tabela-link'))
    expect(navigate).toHaveBeenCalledWith('/clientes/1')
  })

  it('sem href não há MotionPressable', async () => {
    await render(<Casa comLink={false} />)
    expect(screen.queryByTestId('tabela-link')).toBeNull()
    expect(screen.getByText('Padaria Estrela')).toBeTruthy()
  })

  it('off: o link é o Pressable de sempre', async () => {
    await render(<Casa comLink motion="off" />)
    expect(screen.queryByTestId('tabela-link')).toBeNull()
    expect(screen.getByRole('link')).toBeTruthy()
  })
})
