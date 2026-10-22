import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { advance, allNodes, transformValue } from '../../test-utils/motion-style'
import { Kanban, moveKanbanCard, type KanbanCard, type KanbanColumn } from './kanban'

jest.mock('../../lib/reduced-motion', () => ({ useReducedMotion: jest.fn(() => false) }))

const colunas: KanbanColumn[] = [
  { id: 'novo', title: 'Novo' },
  { id: 'ganho', title: 'Ganho' },
]
const inicial: KanbanCard[] = [
  { id: 'c1', columnId: 'novo', title: 'Primeiro' },
  { id: 'c2', columnId: 'novo', title: 'Segundo' },
  { id: 'c3', columnId: 'novo', title: 'Terceiro' },
]

function Controlado({ motion = 'on', onCardClick }: { motion?: 'on' | 'off'; onCardClick?: (c: KanbanCard) => void }) {
  const [cards, setCards] = useState(inicial)
  return (
    <BrandProvider motion={motion}>
      <Kanban
        columns={colunas}
        cards={cards}
        aria-label="Funil"
        onCardClick={onCardClick}
        onCardMove={(id, coluna, indice) => setCards((atual) => moveKanbanCard(atual, id, coluna, indice))}
      />
    </BrandProvider>
  )
}

const ordem = () => screen.getAllByText(/^(Primeiro|Segundo|Terceiro)$/).map((n) => n.props.children)

beforeEach(() => jest.useFakeTimers())
afterEach(() => jest.useRealTimers())

describe('Kanban em motion="on"', () => {
  it('a lista da coluna é Animated.FlatList com itemLayoutAnimation; em off, não', async () => {
    const on = await render(<Controlado />)
    expect(allNodes((n) => n.props.layout !== undefined).length).toBeGreaterThanOrEqual(inicial.length)
    await on.unmount()
    await render(<Controlado motion="off" />)
    expect(allNodes((n) => n.props.layout !== undefined)).toHaveLength(0)
  })

  it('mover pelo menu grava a nova ordem (moveKanbanCard real)', async () => {
    await render(<Controlado />)
    expect(ordem()).toEqual(['Primeiro', 'Segundo', 'Terceiro'])
    await fireEvent.press(screen.getByRole('button', { name: 'Ações do card Primeiro' }))
    await fireEvent.press(await screen.findByRole('menuitem', { name: 'Mover para baixo' }))
    expect(ordem()).toEqual(['Segundo', 'Primeiro', 'Terceiro'])
  })

  it('o card clicável escala no toque', async () => {
    const onCardClick = jest.fn()
    await render(<Controlado onCardClick={onCardClick} />)
    await fireEvent(screen.getByTestId('kanban-card-press-c1'), 'pressIn')
    await advance(1500)
    expect(transformValue('kanban-card-press-c1-motion', 'scale') as number).toBeLessThan(1)
    await fireEvent.press(screen.getByTestId('kanban-card-press-c1'))
    expect(onCardClick).toHaveBeenCalledTimes(1)
  })

  it('off: o card clicável é o Pressable de sempre, sem MotionView', async () => {
    await render(<Controlado motion="off" onCardClick={() => {}} />)
    expect(screen.queryByTestId('kanban-card-press-c1')).toBeNull()
  })
})
