import { Platform, Text } from 'react-native'
import { render, screen } from '@testing-library/react-native'
import { MotionProvider } from '../../lib/motion/context'
import { slideIn, slideOut } from '../../lib/motion/slide'
import { advance, animated, transformValue } from '../../test-utils/motion-style'
import { FadeOut, FadeOutDown } from 'react-native-reanimated'
import { MotionPresence } from './motion-view'

jest.mock('../../lib/reduced-motion', () => ({ useReducedMotion: jest.fn(() => false) }))
// eslint-disable-next-line import/first
import { useReducedMotion } from '../../lib/reduced-motion'

const mockReduced = useReducedMotion as jest.Mock

// A Reanimated web ignora o worklet de `entering` e, com Keyframe, deixa o nó em `position:absolute`
// ao fim da animação. Com `webEnter` a entrada sobe e aparece por valores animados, sem Layout Animation.
function Casa({ motion = 'on', webEnter }: { motion?: 'on' | 'off'; webEnter?: boolean }) {
  return (
    <MotionProvider motion={motion}>
      <MotionPresence testID="bloco" webEnter={webEnter} enter={(r) => slideIn('up', r, 120, 8)}>
        <Text>conteúdo</Text>
      </MotionPresence>
    </MotionProvider>
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

describe('MotionPresence com webEnter no navegador', () => {
  it('começa transparente e deslocado, espera o atraso e termina no lugar', async () => {
    await noNavegador(async () => {
      await render(<Casa />)
      expect(animated('bloco').opacity).toBe(0)
      expect(transformValue('bloco', 'translateY')).toBe(8)
      await advance(60)
      expect(animated('bloco').opacity).toBe(0)
      await advance(120)
      const meio = animated('bloco').opacity ?? 0
      expect(meio).toBeGreaterThan(0)
      expect(meio).toBeLessThan(1)
      await advance(600)
      expect(animated('bloco').opacity).toBe(1)
      expect(transformValue('bloco', 'translateY')).toBe(0)
      expect(screen.getByText('conteúdo')).toBeTruthy()
    })
  })

  it('com movimento reduzido só aparece (sem deslocamento)', async () => {
    mockReduced.mockReturnValue(true)
    await noNavegador(async () => {
      await render(<Casa />)
      await advance(600)
      expect(animated('bloco').opacity).toBe(1)
      expect(transformValue('bloco', 'translateY')).toBeUndefined()
    })
  })

  it('sem webEnter o nó de sempre (sem opacidade animada no navegador)', async () => {
    await noNavegador(async () => {
      await render(<Casa webEnter={false} />)
      expect(animated('bloco').opacity).toBeUndefined()
    })
  })

  it('off: sem nó extra', async () => {
    await noNavegador(async () => {
      await render(<Casa motion="off" />)
      expect(screen.queryByTestId('bloco')).toBeNull()
      expect(screen.getByText('conteúdo')).toBeTruthy()
    })
  })

  it('no nativo continua a Layout Animation (sem opacidade animada por valor)', async () => {
    await render(<Casa />)
    expect(animated('bloco').opacity).toBeUndefined()
  })

  it('o padrão é entrar por valor animado: sem a prop, no navegador, nasce transparente e termina em 1', async () => {
    await noNavegador(async () => {
      await render(<Casa />)
      expect(animated('bloco').opacity).toBe(0)
      await advance(800)
      expect(animated('bloco').opacity).toBe(1)
    })
  })
})

describe('MotionPresence no navegador: layout e saída', () => {
  function Pilha({ layout, exit, webExit }: { layout?: boolean; exit?: boolean; webExit?: boolean }) {
    return (
      <MotionProvider motion="on">
        <MotionPresence
          testID="bloco"
          layout={layout}
          enter={(r) => slideIn('up', r, 0, 16)}
          exit={exit ? (r) => slideOut('up', r, 16) : undefined}
          webExit={webExit ? (r) => (r ? FadeOut : FadeOutDown) : undefined}
        >
          <Text>conteúdo</Text>
        </MotionPresence>
      </MotionProvider>
    )
  }

  it('com layout, o nó animado do navegador também reacomoda a posição', async () => {
    await noNavegador(async () => {
      await render(<Pilha layout />)
      expect(screen.getByTestId('bloco').props.layout).toBeDefined()
    })
  })

  it('sem layout, o nó não leva layout', async () => {
    await noNavegador(async () => {
      await render(<Pilha />)
      expect(screen.getByTestId('bloco').props.layout).toBeUndefined()
    })
  })

  it('o worklet de saída não vai ao navegador (a Reanimated só avisa e não anima)', async () => {
    await noNavegador(async () => {
      await render(<Pilha exit />)
      expect(screen.getByTestId('bloco').props.exiting).toBeUndefined()
    })
  })

  it('a saída por builder (webExit) vai ao nó do navegador, e o worklet continua de fora', async () => {
    await noNavegador(async () => {
      await render(<Pilha exit webExit />)
      expect(screen.getByTestId('bloco').props.exiting).toBe(FadeOutDown)
    })
  })

  it('com movimento reduzido o webExit recebe reduced e entrega só a opacidade', async () => {
    mockReduced.mockReturnValue(true)
    await noNavegador(async () => {
      await render(<Pilha webExit />)
      expect(screen.getByTestId('bloco').props.exiting).toBe(FadeOut)
    })
  })

  it('no nativo a saída por worklet segue indo ao nó (e o webExit não entra)', async () => {
    await render(<Pilha exit webExit layout />)
    const no = screen.getByTestId('bloco')
    expect(typeof no.props.exiting).toBe('function')
    expect(no.props.layout).toBeDefined()
  })
})
