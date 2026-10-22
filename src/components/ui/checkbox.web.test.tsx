import { Platform } from 'react-native'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { Checkbox } from './checkbox'
import { advance, animated, transformValue } from '../../test-utils/motion-style'

jest.mock('../../lib/reduced-motion', () => ({ useReducedMotion: jest.fn(() => false) }))
// eslint-disable-next-line import/first
import { useReducedMotion } from '../../lib/reduced-motion'

const mockReduced = useReducedMotion as jest.Mock

function Casa({ motion = 'on' }: { motion?: 'on' | 'off' }) {
  return (
    <BrandProvider motion={motion}>
      <Checkbox id="aceite" accessibilityLabel="Aceito" />
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

describe('Checkbox no navegador em motion="on"', () => {
  it('ao marcar, o check entra de 0,9 a 1 com opacidade em 120 ms', async () => {
    await noNavegador(async () => {
      await render(<Casa />)
      expect(screen.queryByTestId('aceite-check')).toBeNull()
      await fireEvent.press(screen.getByTestId('aceite'))
      expect(animated('aceite-check').opacity).toBe(0)
      expect(transformValue('aceite-check', 'scale')).toBe(0.9)
      await advance(60)
      const meio = animated('aceite-check').opacity ?? 0
      expect(meio).toBeGreaterThan(0)
      expect(meio).toBeLessThan(1)
      await advance(300)
      expect(animated('aceite-check').opacity).toBe(1)
      expect(transformValue('aceite-check', 'scale')).toBe(1)
    })
  })

  it('ao desmarcar, o nó do check some', async () => {
    await noNavegador(async () => {
      await render(<Casa />)
      await fireEvent.press(screen.getByTestId('aceite'))
      await advance(300)
      await fireEvent.press(screen.getByTestId('aceite'))
      expect(screen.queryByTestId('aceite-check', { includeHiddenElements: true })).toBeNull()
    })
  })

  it('com movimento reduzido só aparece, sem escala', async () => {
    mockReduced.mockReturnValue(true)
    await noNavegador(async () => {
      await render(<Casa />)
      await fireEvent.press(screen.getByTestId('aceite'))
      await advance(300)
      expect(animated('aceite-check').opacity).toBe(1)
      expect(transformValue('aceite-check', 'scale')).toBeUndefined()
    })
  })

  it('off: marca sem nó animado', async () => {
    await noNavegador(async () => {
      await render(<Casa motion="off" />)
      await fireEvent.press(screen.getByTestId('aceite'))
      expect(screen.queryByTestId('aceite-check')).toBeNull()
    })
  })
})
