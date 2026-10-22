import { Platform } from 'react-native'
import { render, screen } from '@testing-library/react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { StatCard } from './stat-card'
import { advance, animated } from '../../test-utils/motion-style'

jest.mock('../../lib/reduced-motion', () => ({ useReducedMotion: jest.fn(() => false) }))
// eslint-disable-next-line import/first
import { useReducedMotion } from '../../lib/reduced-motion'

const mockReduced = useReducedMotion as jest.Mock

function Casa({ value, motion = 'on' }: { value: string; motion?: 'on' | 'off' }) {
  return (
    <BrandProvider motion={motion}>
      <StatCard testID="stat" label="Receita" value={value} />
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

describe('StatCard no navegador em motion="on"', () => {
  it('valor em texto livre aparece com fade de 200 ms', async () => {
    await noNavegador(async () => {
      await render(<Casa value="Sem dados" />)
      expect(animated('stat-valor-anim').opacity).toBe(0)
      await advance(100)
      const meio = animated('stat-valor-anim').opacity ?? 0
      expect(meio).toBeGreaterThan(0)
      expect(meio).toBeLessThan(1)
      await advance(300)
      expect(animated('stat-valor-anim').opacity).toBe(1)
    })
  })

  it('valor contável com movimento reduzido cai no fade (sem contador)', async () => {
    mockReduced.mockReturnValue(true)
    await noNavegador(async () => {
      await render(<Casa value="R$ 12.480,00" />)
      expect(screen.queryByTestId('stat-valor-contador')).toBeNull()
      await advance(300)
      expect(animated('stat-valor-anim').opacity).toBe(1)
    })
  })

  it('valor contável sem movimento reduzido segue com o contador, sem fade por cima', async () => {
    await noNavegador(async () => {
      await render(<Casa value="R$ 12.480,00" />)
      expect(screen.getByTestId('stat-valor-contador', { includeHiddenElements: true })).toBeTruthy()
      expect(screen.queryByTestId('stat-valor-anim')).toBeNull()
    })
  })

  it('off: sem nó animado e o texto de sempre', async () => {
    await noNavegador(async () => {
      await render(<Casa value="Sem dados" motion="off" />)
      expect(screen.queryByTestId('stat-valor-anim')).toBeNull()
      expect(screen.getByText('Sem dados')).toBeTruthy()
    })
  })
})
