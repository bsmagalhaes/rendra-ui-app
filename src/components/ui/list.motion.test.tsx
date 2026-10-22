import { fireEvent, render, screen } from '@testing-library/react-native'
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils'
import { State } from 'react-native-gesture-handler'
import { BrandProvider } from '../../brand/brand-provider'
import { advance, allNodes, transformValue } from '../../test-utils/motion-style'
import { List, type ListItem } from './list'

jest.mock('../../lib/reduced-motion', () => ({ useReducedMotion: jest.fn(() => false) }))
// eslint-disable-next-line import/first
import { useReducedMotion } from '../../lib/reduced-motion'

const mockReduced = useReducedMotion as jest.Mock

const onPress = jest.fn()
const itens: ListItem[] = [
  { id: '1', title: 'Ana Souza', onPress },
  { id: '2', title: 'Bruno Lima' },
  { id: '3', title: 'Carla Dias' },
]

function Casa({ motion = 'on', onReorder }: { motion?: 'on' | 'off'; onReorder?: (items: ListItem[]) => void }) {
  return (
    <BrandProvider motion={motion}>
      <List items={itens} testID="lista" onReorder={onReorder} />
    </BrandProvider>
  )
}

beforeEach(() => {
  jest.useFakeTimers()
  mockReduced.mockReturnValue(false)
})
afterEach(() => jest.useRealTimers())

describe('List em motion="on"', () => {
  it('a lista ganha itemLayoutAnimation (Animated.FlatList); em off, não', async () => {
    const on = await render(<Casa onReorder={() => {}} />)
    // o `itemLayoutAnimation` vira `layout` nas células da lista (nós hospedeiros)
    expect(allNodes((n) => n.props.layout !== undefined).length).toBeGreaterThanOrEqual(itens.length)
    await on.unmount()
    await render(<Casa motion="off" onReorder={() => {}} />)
    expect(allNodes((n) => n.props.layout !== undefined)).toHaveLength(0)
  })

  it('a linha interativa escala no toque; a que não é interativa não tem MotionPressable', async () => {
    await render(<Casa />)
    expect(screen.queryByTestId('list-press-2')).toBeNull()
    await fireEvent(screen.getByTestId('list-press-1'), 'pressIn')
    await advance(1500)
    expect(transformValue('list-press-1-motion', 'scale') as number).toBeLessThan(1)
    await fireEvent(screen.getByTestId('list-press-1'), 'pressOut')
    await advance(1500)
    expect(transformValue('list-press-1-motion', 'scale')).toBe(1)
  })

  it('com movimento reduzido a linha não escala', async () => {
    mockReduced.mockReturnValue(true)
    await render(<Casa />)
    await fireEvent(screen.getByTestId('list-press-1'), 'pressIn')
    await advance(1500)
    expect(transformValue('list-press-1-motion', 'scale')).toBe(1)
  })

  it('o onPress da linha continua funcionando', async () => {
    onPress.mockClear()
    await render(<Casa />)
    await fireEvent.press(screen.getByTestId('list-press-1'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('mover pelo menu devolve a lista com moveItem (a reordenação só vale ao soltar ou pelo menu)', async () => {
    const onReorder = jest.fn()
    await render(<Casa onReorder={onReorder} />)
    await fireEvent.press(screen.getByRole('button', { name: 'Mover Ana Souza' }))
    await fireEvent.press(await screen.findByRole('menuitem', { name: 'Mover para baixo' }))
    expect(onReorder).toHaveBeenCalledTimes(1)
    expect((onReorder.mock.calls[0][0] as ListItem[]).map((i) => i.id)).toEqual(['2', '1', '3'])
  })

  it('durante o arraste nada é reordenado: onReorder só ao soltar', async () => {
    const onReorder = jest.fn()
    await render(<Casa onReorder={onReorder} />)
    const alca = getByGestureTestId('lista-handle-1')
    fireGestureHandler(alca, [
      { state: State.BEGAN, translationY: 0 },
      { state: State.ACTIVE, translationY: 0 },
      { translationY: 20 },
    ])
    await advance(50)
    expect(onReorder).not.toHaveBeenCalled()
  })
})
