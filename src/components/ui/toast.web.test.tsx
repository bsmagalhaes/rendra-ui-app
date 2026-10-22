import { Platform } from 'react-native'
import { act, render, screen } from '@testing-library/react-native'
import { FadeOut, FadeOutDown } from 'react-native-reanimated'
import { BrandProvider } from '../../brand/brand-provider'
import { Toaster, toast } from './toast'
import { advance, animated, transformValue } from '../../test-utils/motion-style'

jest.mock('../../lib/reduced-motion', () => ({ useReducedMotion: jest.fn(() => false) }))
// eslint-disable-next-line import/first
import { useReducedMotion } from '../../lib/reduced-motion'

const mockReduced = useReducedMotion as jest.Mock

async function noNavegador(fn: () => Promise<void>) {
  const original = Platform.OS
  Platform.OS = 'web'
  try {
    await fn()
  } finally {
    Platform.OS = original
  }
}

function Casa({ motion = 'on' }: { motion?: 'on' | 'off' }) {
  return (
    <BrandProvider motion={motion}>
      <Toaster />
    </BrandProvider>
  )
}

const idsAnim = () => screen.queryAllByTestId(/^toast-anim-/, { includeHiddenElements: true }).map((n) => n.props.testID as string)

beforeEach(() => {
  jest.useFakeTimers()
  mockReduced.mockReturnValue(false)
})
afterEach(async () => {
  await act(async () => {
    toast.dismiss()
  })
  jest.useRealTimers()
})

describe('Toast no navegador', () => {
  it('em on, entra de 16 px abaixo com fade, leva layout e saída por FadeOutDown', async () => {
    await noNavegador(async () => {
      await render(<Casa />)
      await act(async () => {
        toast.success('Salvo')
      })
      const [id] = idsAnim()
      expect(id).toBeTruthy()
      expect(animated(id).opacity).toBe(0)
      expect(transformValue(id, 'translateY')).toBe(16)
      await advance(100)
      const meio = animated(id).opacity ?? 0
      expect(meio).toBeGreaterThan(0)
      expect(meio).toBeLessThan(1)
      await advance(300)
      expect(animated(id).opacity).toBe(1)
      expect(transformValue(id, 'translateY')).toBe(0)
      const no = screen.getByTestId(id, { includeHiddenElements: true })
      expect(no.props.layout).toBeDefined()
      expect(no.props.exiting).toBeInstanceOf(FadeOutDown)
      expect(no.props.exiting.getDuration()).toBe(120)
    })
  })

  it('em on com movimento reduzido a saída é só fade e a entrada só opacidade', async () => {
    mockReduced.mockReturnValue(true)
    await noNavegador(async () => {
      await render(<Casa />)
      await act(async () => {
        toast.info('Aviso')
      })
      const [id] = idsAnim()
      await advance(300)
      expect(animated(id).opacity).toBe(1)
      expect(transformValue(id, 'translateY')).toBeUndefined()
      const saida = screen.getByTestId(id, { includeHiddenElements: true }).props.exiting
      expect(saida).toBeInstanceOf(FadeOut)
      expect(saida).not.toBeInstanceOf(FadeOutDown)
    })
  })

  it('com dois toasts a pilha tem dois nós animados, cada um com o seu id', async () => {
    await noNavegador(async () => {
      await render(<Casa />)
      await act(async () => {
        toast.success('Um')
        toast.error('Dois')
      })
      const ids = idsAnim()
      expect(ids).toHaveLength(2)
      expect(new Set(ids).size).toBe(2)
      await advance(400)
      for (const id of ids) expect(animated(id).opacity).toBe(1)
    })
  })

  it('off: o FadeInUp/FadeOutDown de sempre, sem layout e sem nó de valor animado', async () => {
    await noNavegador(async () => {
      await render(<Casa motion="off" />)
      await act(async () => {
        toast.success('Salvo')
      })
      expect(idsAnim()).toHaveLength(0)
      let no = (await screen.findByText('Salvo')).parent
      while (no && !no.props.entering) no = no.parent
      expect(no?.props.layout).toBeUndefined()
      expect(no?.props.exiting).toBeDefined()
    })
  })
})
