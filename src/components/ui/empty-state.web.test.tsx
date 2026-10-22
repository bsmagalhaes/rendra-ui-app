import { Platform, Text } from 'react-native'
import { render, screen } from '@testing-library/react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { EmptyState } from './empty-state'
import { advance, animated, transformValue } from '../../test-utils/motion-style'

jest.mock('../../lib/reduced-motion', () => ({ useReducedMotion: jest.fn(() => false) }))
// eslint-disable-next-line import/first
import { useReducedMotion } from '../../lib/reduced-motion'

const mockReduced = useReducedMotion as jest.Mock
const blocos = ['icone', 'titulo', 'descricao', 'acoes'] as const
const no = (b: (typeof blocos)[number]) => `vazio-anim-${b}`

function Casa({ motion = 'on' }: { motion?: 'on' | 'off' }) {
  return (
    <BrandProvider motion={motion}>
      <EmptyState testID="vazio" title="Nada aqui" description="Crie o primeiro item." actions={<Text>Criar</Text>} />
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

describe('EmptyState no navegador em motion="on"', () => {
  it('os quatro blocos sobem 8 px em cascata (0, 60, 120 e 180 ms) e terminam no lugar', async () => {
    await noNavegador(async () => {
      await render(<Casa />)
      for (const b of blocos) {
        expect(animated(no(b)).opacity).toBe(0)
        expect(transformValue(no(b), 'translateY')).toBe(8)
      }
      await advance(100)
      // o primeiro já começou; o último (atraso de 180 ms) ainda não
      expect(animated(no('icone')).opacity ?? 0).toBeGreaterThan(0)
      expect(animated(no('acoes')).opacity).toBe(0)
      await advance(1000)
      for (const b of blocos) {
        expect(animated(no(b)).opacity).toBe(1)
        expect(transformValue(no(b), 'translateY')).toBe(0)
      }
    })
  })

  it('título e descrição ocupam a largura toda da coluna (quebra de linha de texto longo)', async () => {
    await noNavegador(async () => {
      await render(<Casa />)
      expect(animated(no('titulo')).width).toBe('100%')
      expect(animated(no('descricao')).width).toBe('100%')
      expect(animated(no('icone')).width).toBeUndefined()
    })
  })

  it('com movimento reduzido não há cascata nem deslocamento', async () => {
    mockReduced.mockReturnValue(true)
    await noNavegador(async () => {
      await render(<Casa />)
      await advance(300)
      for (const b of blocos) {
        expect(animated(no(b)).opacity).toBe(1)
        expect(transformValue(no(b), 'translateY')).toBeUndefined()
      }
    })
  })

  it('off: sem nós animados e os textos de sempre', async () => {
    await noNavegador(async () => {
      await render(<Casa motion="off" />)
      expect(screen.queryByTestId(no('titulo'))).toBeNull()
      expect(screen.getByText('Nada aqui')).toBeTruthy()
    })
  })
})
