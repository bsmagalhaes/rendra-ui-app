import { Platform } from 'react-native'
import { render, screen } from '@testing-library/react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { Alert } from './alert'
import { advance, animated, transformValue } from '../../test-utils/motion-style'

jest.mock('../../lib/reduced-motion', () => ({ useReducedMotion: jest.fn(() => false) }))
// eslint-disable-next-line import/first
import { useReducedMotion } from '../../lib/reduced-motion'

const mockReduced = useReducedMotion as jest.Mock

function Casa({ motion = 'on' }: { motion?: 'on' | 'off' }) {
  return (
    <BrandProvider motion={motion}>
      <Alert type="info" title="Aviso" testID="alerta" />
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

describe('Alert no navegador em motion="on"', () => {
  it('entra de cima: nasce transparente 8 px acima e termina no lugar em 200 ms', async () => {
    await noNavegador(async () => {
      await render(<Casa />)
      expect(animated('alerta-anim').opacity).toBe(0)
      expect(transformValue('alerta-anim', 'translateY')).toBe(-8)
      await advance(100)
      const meio = animated('alerta-anim').opacity ?? 0
      expect(meio).toBeGreaterThan(0)
      expect(meio).toBeLessThan(1)
      await advance(300)
      expect(animated('alerta-anim').opacity).toBe(1)
      expect(Math.abs(transformValue('alerta-anim', 'translateY') as number)).toBe(0)
    })
  })

  it('com movimento reduzido só aparece, sem deslocamento', async () => {
    mockReduced.mockReturnValue(true)
    await noNavegador(async () => {
      await render(<Casa />)
      await advance(300)
      expect(animated('alerta-anim').opacity).toBe(1)
      expect(transformValue('alerta-anim', 'translateY')).toBeUndefined()
    })
  })

  it('o worklet de saída não vai ao navegador (sem aviso da Reanimated no desmonte)', async () => {
    await noNavegador(async () => {
      await render(<Casa />)
      expect(screen.getByTestId('alerta-anim', { includeHiddenElements: true }).props.exiting).toBeUndefined()
    })
  })

  it('off: sem nó animado e o aviso de sempre', async () => {
    await noNavegador(async () => {
      await render(<Casa motion="off" />)
      expect(screen.queryByTestId('alerta-anim')).toBeNull()
      expect(screen.getByText('Aviso')).toBeTruthy()
    })
  })
})
