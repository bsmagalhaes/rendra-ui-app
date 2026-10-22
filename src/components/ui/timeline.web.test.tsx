import { Platform } from 'react-native'
import { render, screen } from '@testing-library/react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { Timeline, type TimelineEvent } from './timeline'
import { advance, animated, transformValue } from '../../test-utils/motion-style'

jest.mock('../../lib/reduced-motion', () => ({ useReducedMotion: jest.fn(() => false) }))
// eslint-disable-next-line import/first
import { useReducedMotion } from '../../lib/reduced-motion'

const mockReduced = useReducedMotion as jest.Mock

function eventos(n: number): TimelineEvent[] {
  return Array.from({ length: n }, (_, i) => ({ id: `e${i}`, title: `Evento ${i}`, date: '01/10/2026' }))
}

function Casa({ n = 3, motion = 'on' }: { n?: number; motion?: 'on' | 'off' }) {
  return (
    <BrandProvider motion={motion}>
      <Timeline events={eventos(n)} />
    </BrandProvider>
  )
}

async function noNavegador(fn: () => Promise<void>) {
  const original = Platform.OS
  Platform.OS = 'web'
  try {
    await fn()
  } finally {
    Platform.OS = original
  }
}

beforeEach(() => {
  jest.useFakeTimers()
  mockReduced.mockReturnValue(false)
})
afterEach(() => jest.useRealTimers())

describe('Timeline no navegador em motion="on"', () => {
  it('cada evento sobe 8 px e a cascata respeita o atraso de 60 ms por item', async () => {
    await noNavegador(async () => {
      await render(<Casa />)
      for (const id of ['e0', 'e1', 'e2']) {
        expect(animated(`timeline-anim-${id}`).opacity).toBe(0)
        expect(transformValue(`timeline-anim-${id}`, 'translateY')).toBe(8)
      }
      await advance(100)
      // e0 (atraso 0) já avançou; e2 (atraso 120) ainda não começou
      expect(animated('timeline-anim-e0').opacity ?? 0).toBeGreaterThan(animated('timeline-anim-e1').opacity ?? 0)
      expect(animated('timeline-anim-e2').opacity).toBe(0)
      await advance(600)
      for (const id of ['e0', 'e1', 'e2']) {
        expect(animated(`timeline-anim-${id}`).opacity).toBe(1)
        expect(transformValue(`timeline-anim-${id}`, 'translateY')).toBe(0)
      }
    })
  })

  it('com 30 eventos o último termina em até 200 + 480 ms e nenhum fica invisível', async () => {
    await noNavegador(async () => {
      await render(<Casa n={30} />)
      await advance(700)
      for (let i = 0; i < 30; i++) {
        expect(animated(`timeline-anim-e${i}`).opacity).toBe(1)
        expect(transformValue(`timeline-anim-e${i}`, 'translateY')).toBe(0)
      }
    })
  })

  it('com movimento reduzido não há cascata nem deslocamento', async () => {
    mockReduced.mockReturnValue(true)
    await noNavegador(async () => {
      await render(<Casa />)
      await advance(300)
      expect(animated('timeline-anim-e2').opacity).toBe(1)
      expect(transformValue('timeline-anim-e2', 'translateY')).toBeUndefined()
    })
  })

  it('off: sem envoltório animado e o texto de sempre', async () => {
    await noNavegador(async () => {
      await render(<Casa motion="off" />)
      expect(screen.queryByTestId('timeline-anim-e1')).toBeNull()
      expect(screen.getByText('Evento 1')).toBeTruthy()
    })
  })
})
