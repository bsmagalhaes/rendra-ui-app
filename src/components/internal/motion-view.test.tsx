import { render, screen, fireEvent } from '@testing-library/react-native'
import { Text } from 'react-native'
import { useSharedValue } from 'react-native-reanimated'
import { MotionProvider } from '../../lib/motion/context'
import { MotionPresence, MotionPressable, MotionView, PressScale } from './motion-view'
import { fadeIn, fadeOut } from '../../lib/motion/fade'
import { layoutTransition } from '../../lib/motion/layout'
import { advance, animated, transformValue } from '../../test-utils/motion-style'

jest.mock('../../lib/reduced-motion')
// eslint-disable-next-line import/first
import { useReducedMotion } from '../../lib/reduced-motion'

const mockReduced = useReducedMotion as jest.Mock

beforeEach(() => {
  jest.useFakeTimers()
  mockReduced.mockReturnValue(false)
})
afterEach(() => jest.useRealTimers())

describe('MotionPressable', () => {
  it('ao onPressIn termina com escala menor que 1 e volta a 1 no onPressOut', async () => {
    await render(
      <MotionProvider motion="on">
        <MotionPressable testID="p" accessibilityLabel="alvo">
          <Text>Oi</Text>
        </MotionPressable>
      </MotionProvider>,
    )
    expect(transformValue('p-motion', 'scale')).toBe(1)
    await fireEvent(screen.getByTestId('p'), 'pressIn')
    await advance(1500)
    expect(transformValue('p-motion', 'scale')).toBeLessThan(1)
    await fireEvent(screen.getByTestId('p'), 'pressOut')
    await advance(1500)
    expect(transformValue('p-motion', 'scale')).toBe(1)
  })

  it('A2: toca em 0,97 e solta em 120 ms sem NUNCA passar de 1 (token press, sem a mola de quique)', async () => {
    await render(
      <MotionProvider motion="on">
        <MotionPressable testID="p" accessibilityLabel="alvo">
          <Text>Oi</Text>
        </MotionPressable>
      </MotionProvider>,
    )
    await fireEvent(screen.getByTestId('p'), 'pressIn')
    await advance(1500)
    expect(transformValue('p-motion', 'scale')).toBe(0.97)
    await fireEvent(screen.getByTestId('p'), 'pressOut')
    const amostras: number[] = []
    for (let i = 0; i < 12; i += 1) {
      await advance(16)
      amostras.push(transformValue('p-motion', 'scale') as number)
    }
    expect(Math.max(...amostras)).toBeLessThanOrEqual(1)
    expect(amostras[amostras.length - 1]).toBe(1)
  })

  it('playful (cota rara): a mola de quique passa de 1 ao soltar', async () => {
    await render(
      <MotionProvider motion="on">
        <MotionPressable testID="p" accessibilityLabel="alvo" pressScale={1.08} playful>
          <Text>Oi</Text>
        </MotionPressable>
      </MotionProvider>,
    )
    await fireEvent(screen.getByTestId('p'), 'pressIn')
    await advance(1500)
    await fireEvent(screen.getByTestId('p'), 'pressOut')
    const amostras: number[] = []
    for (let i = 0; i < 40; i += 1) {
      await advance(16)
      amostras.push(transformValue('p-motion', 'scale') as number)
    }
    expect(Math.min(...amostras)).toBeLessThan(1)
    expect(amostras[amostras.length - 1]).toBeCloseTo(1, 2)
  })

  it('com movimento reduzido não escala', async () => {
    mockReduced.mockReturnValue(true)
    await render(
      <MotionProvider motion="on">
        <MotionPressable testID="p" accessibilityLabel="alvo">
          <Text>Oi</Text>
        </MotionPressable>
      </MotionProvider>,
    )
    await fireEvent(screen.getByTestId('p'), 'pressIn')
    await advance(1500)
    expect(transformValue('p-motion', 'scale')).toBe(1)
  })

  it('repassa onPress, onPressIn e as props de acessibilidade', async () => {
    const onPress = jest.fn()
    const onPressIn = jest.fn()
    await render(
      <MotionProvider motion="on">
        <MotionPressable
          testID="p"
          accessibilityLabel="alvo"
          accessibilityRole="button"
          onPress={onPress}
          onPressIn={onPressIn}
        >
          <Text>Oi</Text>
        </MotionPressable>
      </MotionProvider>,
    )
    await fireEvent.press(screen.getByTestId('p'))
    await fireEvent(screen.getByTestId('p'), 'pressIn')
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(onPressIn).toHaveBeenCalledTimes(1)
    expect(screen.getByLabelText('alvo')).toBeTruthy()
  })
})

describe('PressScale', () => {
  it('off: Pressable de sempre, com a string de classes original e sem MotionView', async () => {
    await render(
      <PressScale testID="ps" className="a b" outerClassName="x" innerClassName="y" accessibilityLabel="alvo">
        <Text>Oi</Text>
      </PressScale>,
    )
    expect(screen.getByTestId('ps').props.className).toBe('a b')
    expect(screen.queryByTestId('ps-motion')).toBeNull()
  })

  it('on: MotionPressable com as classes repartidas', async () => {
    await render(
      <MotionProvider motion="on">
        <PressScale testID="ps" className="a b" outerClassName="x" innerClassName="y" accessibilityLabel="alvo">
          <Text>Oi</Text>
        </PressScale>
      </MotionProvider>,
    )
    expect(screen.getByTestId('ps').props.className).toBe('x')
    expect(screen.getByTestId('ps-motion')).toBeTruthy()
  })
})

describe('MotionView', () => {
  it('repassa entering, exiting e layout ao nó animado', async () => {
    await render(
      <MotionView testID="v" entering={fadeIn(false)} exiting={fadeOut(false)} layout={layoutTransition()}>
        <Text>x</Text>
      </MotionView>,
    )
    const props = screen.getByTestId('v').props
    expect(typeof props.entering).toBe('function')
    expect(typeof props.exiting).toBe('function')
    expect(props.layout).toBeDefined()
  })

  it('aceita entradas de valor (translateX, scale, opacity) como número ou SharedValue', async () => {
    function Caso() {
      const x = useSharedValue(12)
      return (
        <MotionView testID="v" translateX={x} scale={0.5} opacity={0.25} fill>
          <Text>x</Text>
        </MotionView>
      )
    }
    await render(<Caso />)
    const style = animated('v')
    expect(style.opacity).toBe(0.25)
    expect(style.width).toBe('100%')
    expect(style.height).toBe('100%')
    expect(style.transform).toEqual(expect.arrayContaining([{ translateX: 12 }, { scale: 0.5 }]))
  })

  it('width e height numéricos (indicadores medidos) substituem o fill', async () => {
    await render(
      <MotionView testID="v" width={40} height={8} translateY={3}>
        <Text>x</Text>
      </MotionView>,
    )
    expect(animated('v')).toMatchObject({ width: 40, height: 8, transform: [{ translateY: 3 }] })
  })
})

describe('MotionPresence', () => {
  it('off: devolve os filhos sem nó novo', async () => {
    await render(
      <MotionPresence enter={fadeIn} testID="pr">
        <Text testID="filho">x</Text>
      </MotionPresence>,
    )
    expect(screen.queryByTestId('pr')).toBeNull()
    expect(screen.getByTestId('filho')).toBeTruthy()
  })

  it('on: envolve em MotionView com entering, exiting e layout', async () => {
    await render(
      <MotionProvider motion="on">
        <MotionPresence enter={fadeIn} exit={fadeOut} layout testID="pr">
          <Text>x</Text>
        </MotionPresence>
      </MotionProvider>,
    )
    const props = screen.getByTestId('pr').props
    expect(typeof props.entering).toBe('function')
    expect(typeof props.exiting).toBe('function')
    expect(props.layout).toBeDefined()
  })
})
