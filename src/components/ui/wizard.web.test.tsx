import { Platform, Text } from 'react-native'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { Wizard } from './wizard'
import { advance, animated, transformValue } from '../../test-utils/motion-style'

jest.mock('../../lib/reduced-motion', () => ({ useReducedMotion: jest.fn(() => false) }))
// eslint-disable-next-line import/first
import { useReducedMotion } from '../../lib/reduced-motion'

const mockReduced = useReducedMotion as jest.Mock
const steps = [
  { id: 'a', title: 'Dados' },
  { id: 'b', title: 'Endereço' },
]

function Casa({ motion = 'on' }: { motion?: 'on' | 'off' }) {
  return (
    <BrandProvider motion={motion}>
      <Wizard steps={steps}>{[<Text key="a">Passo A</Text>, <Text key="b">Passo B</Text>]}</Wizard>
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

describe('Wizard no navegador em motion="on"', () => {
  it('avançar entra pela direita (+16) e voltar pela esquerda (-16), com fade, e cada troca recomeça do zero', async () => {
    await noNavegador(async () => {
      await render(<Casa />)
      await advance(400)
      expect(animated('wizard-etapa').opacity).toBe(1)
      await fireEvent.press(screen.getByText('Avançar'))
      expect(animated('wizard-etapa').opacity).toBe(0)
      expect(transformValue('wizard-etapa', 'translateX')).toBe(16)
      await advance(100)
      const meio = animated('wizard-etapa').opacity ?? 0
      expect(meio).toBeGreaterThan(0)
      expect(meio).toBeLessThan(1)
      await advance(400)
      expect(animated('wizard-etapa').opacity).toBe(1)
      expect(transformValue('wizard-etapa', 'translateX')).toBe(0)
      await fireEvent.press(screen.getByText('Voltar'))
      expect(animated('wizard-etapa').opacity).toBe(0)
      expect(transformValue('wizard-etapa', 'translateX')).toBe(-16)
      await advance(400)
      expect(animated('wizard-etapa').opacity).toBe(1)
    })
  })

  it('com movimento reduzido só aparece, sem deslocamento', async () => {
    mockReduced.mockReturnValue(true)
    await noNavegador(async () => {
      await render(<Casa />)
      await fireEvent.press(screen.getByText('Avançar'))
      await advance(300)
      expect(animated('wizard-etapa').opacity).toBe(1)
      expect(transformValue('wizard-etapa', 'translateX')).toBeUndefined()
    })
  })

  it('off: o passo aparece sem nó animado', async () => {
    await noNavegador(async () => {
      await render(<Casa motion="off" />)
      await fireEvent.press(screen.getByText('Avançar'))
      expect(screen.queryByTestId('wizard-etapa')).toBeNull()
      expect(screen.getByText('Passo B')).toBeTruthy()
    })
  })
})
