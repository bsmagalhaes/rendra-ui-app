import { render, screen } from '@testing-library/react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { Timeline, type TimelineEvent } from './timeline'
import { staggerDelay } from '../../lib/motion/stagger'
import { specOf } from '../../test-utils/motion-spec'

jest.mock('../../lib/reduced-motion', () => ({ useReducedMotion: jest.fn(() => false) }))
// eslint-disable-next-line import/first
import { useReducedMotion } from '../../lib/reduced-motion'

const mockReduced = useReducedMotion as jest.Mock
const eventos: TimelineEvent[] = [
  { id: 'a', title: 'Primeiro', date: '01/10/2026' },
  { id: 'b', title: 'Segundo', date: '02/10/2026' },
  { id: 'c', title: 'Terceiro', date: '03/10/2026' },
]

function Casa({ motion = 'on' }: { motion?: 'on' | 'off' }) {
  return (
    <BrandProvider motion={motion}>
      <Timeline events={eventos} />
    </BrandProvider>
  )
}

function atraso(id: string): number | undefined {
  return specOf(screen.getByTestId(`timeline-anim-${id}`).props.entering)?.delay
}

beforeEach(() => mockReduced.mockReturnValue(false))

describe('Timeline em motion="on"', () => {
  it('os itens entram em cascata: o atraso do item i vem de stagger(i)', async () => {
    await render(<Casa />)
    expect(atraso('a')).toBe(0)
    expect(atraso('b')).toBe(staggerDelay(1))
    expect(atraso('c')).toBe(staggerDelay(2))
  })

  it('com movimento reduzido não há cascata', async () => {
    mockReduced.mockReturnValue(true)
    await render(<Casa />)
    expect(atraso('c')).toBe(0)
  })

  it('off: itens sem envoltório animado e o texto de sempre', async () => {
    await render(<Casa motion="off" />)
    expect(screen.queryByTestId('timeline-anim-b')).toBeNull()
    expect(screen.getByText('Segundo')).toBeTruthy()
  })
})
