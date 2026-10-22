import { render, screen } from '@testing-library/react-native'
import { getAnimatedStyle } from 'react-native-reanimated'
import { BrandProvider } from '../../brand/brand-provider'
import { MotionProvider } from '../../lib/motion/context'
import { advance, animated, animatedNodes, transformValue } from '../../test-utils/motion-style'
import { motionTokens } from '../../theme/motion'
import { easings } from '../../lib/motion/tokens'
import { Progress, progressTimingConfig } from './progress'
import { Skeleton, shimmerTranslate, skeletonPulseConfig, skeletonShimmerConfig } from './skeleton'

jest.mock('../../lib/reduced-motion', () => ({ useReducedMotion: jest.fn(() => false) }))
// eslint-disable-next-line import/first
import { useReducedMotion } from '../../lib/reduced-motion'

const mockReduced = useReducedMotion as jest.Mock

function barra() {
  return animatedNodes()[0]
}

beforeEach(() => {
  jest.useFakeTimers()
  mockReduced.mockReturnValue(false)
})
afterEach(() => jest.useRealTimers())

describe('configs únicas em on e off (A14)', () => {
  it('progressTimingConfig: progresso é movimento constante: base (200 ms) em linear, igual nos dois caminhos; reduzido 0', () => {
    const normal = progressTimingConfig(false)
    expect(normal.duration).toBe(motionTokens.duration.base)
    expect((normal as { easing?: unknown }).easing).toBe(easings.linear)
    expect(progressTimingConfig(true)).toEqual({ duration: 0 })
  })

  it('skeletonPulseConfig: pulse (1.000 ms) pela curva inOut dos tokens, sem literal; o brilho usa a curva move', () => {
    const pulso = skeletonPulseConfig()
    expect(pulso.duration).toBe(motionTokens.duration.pulse)
    expect(pulso.easing).toBe(easings.inOut)
    const brilho = skeletonShimmerConfig()
    expect(brilho.duration).toBe(motionTokens.duration.pulse)
    expect(brilho.easing).toBe(easings.move)
  })
})

describe('Progress em motion="on"', () => {
  it('determinado: a largura chega a clamped% em 200 ms, linear', async () => {
    function Caso({ valor }: { valor: number }) {
      return (
        <BrandProvider motion="on">
          <Progress value={valor} accessibilityLabel="Envio" />
        </BrandProvider>
      )
    }
    const { rerender } = await render(<Caso valor={20} />)
    await advance(50)
    await rerender(<Caso valor={80} />)
    await advance(100)
    const meio = Number.parseFloat(String((getAnimatedStyle(barra()) as { width: string }).width))
    // linear: na metade dos 200 ms a barra está na metade do caminho (50%)
    expect(meio).toBeGreaterThan(45)
    expect(meio).toBeLessThan(55)
    await advance(1000)
    expect((getAnimatedStyle(barra()) as { width: string }).width).toBe('80%')
  })

  it('A14: off usa o mesmo token (200 ms, linear): a barra chega a 80 em 220 ms', async () => {
    function Caso({ valor }: { valor: number }) {
      return (
        <BrandProvider>
          <Progress value={valor} accessibilityLabel="Envio" />
        </BrandProvider>
      )
    }
    const { rerender } = await render(<Caso valor={20} />)
    await rerender(<Caso valor={80} />)
    await advance(100)
    const meio = Number.parseFloat(String((getAnimatedStyle(barra()) as { width: string }).width))
    expect(meio).toBeGreaterThan(45)
    expect(meio).toBeLessThan(55)
    await advance(120)
    expect((getAnimatedStyle(barra()) as { width: string }).width).toBe('80%')
  })

  it.each(['on', 'off'] as const)('A14 (%s): o indeterminado anda por translateX em % da própria barra, nunca por `left`', async (motion) => {
    await render(
      <BrandProvider motion={motion}>
        <Progress accessibilityLabel="Carregando" />
      </BrandProvider>,
    )
    await advance(500)
    const estilo = getAnimatedStyle(barra()) as { left?: unknown; width?: string; transform?: Record<string, string>[] }
    expect(estilo.left).toBeUndefined()
    expect(estilo.width).toBe('33.333%')
    const x = Number.parseFloat(estilo.transform?.find((t) => 'translateX' in t)?.translateX ?? 'NaN')
    // linear em 1.000 ms: aos 500 ms está na metade do curso de 198%
    expect(x).toBeGreaterThan(90)
    expect(x).toBeLessThan(108)
    await advance(500)
    const fim = Number.parseFloat(
      (getAnimatedStyle(barra()) as { transform?: Record<string, string>[] }).transform?.find((t) => 'translateX' in t)?.translateX ?? 'NaN',
    )
    expect(fim).toBeGreaterThan(190)
  })

  it('indeterminado segue com a largura de um terço em on', async () => {
    await render(
      <BrandProvider motion="on">
        <Progress accessibilityLabel="Carregando" />
      </BrandProvider>,
    )
    await advance(500)
    expect((getAnimatedStyle(barra()) as { width: string }).width).toBe('33.333%')
  })
})

describe('Skeleton', () => {
  it('shimmerTranslate: de -100% a 100% da largura do próprio bloco', () => {
    expect(shimmerTranslate(0)).toBe('-100%')
    expect(shimmerTranslate(0.5)).toBe('0%')
    expect(shimmerTranslate(1)).toBe('100%')
  })

  it('on: brilho suave que cruza o bloco em 1.000 ms (transform), e a opacidade do bloco fica parada em 1', async () => {
    await render(
      <BrandProvider motion="on">
        <Skeleton testID="sk" />
      </BrandProvider>,
    )
    const inicio = Number.parseFloat(String(transformValue('sk-brilho', 'translateX')))
    expect(inicio).toBeLessThanOrEqual(-90)
    await advance(500)
    const meio = Number.parseFloat(String(transformValue('sk-brilho', 'translateX')))
    expect(meio).toBeGreaterThan(-60)
    expect(meio).toBeLessThan(60)
    await advance(1000)
    expect(animated('sk-pulso').opacity).toBe(1)
  })

  it('on fora de um BrandProvider não quebra: o bloco aparece, sem brilho (não há cor de tema)', async () => {
    await render(
      <MotionProvider motion="on">
        <Skeleton testID="sk" />
      </MotionProvider>,
    )
    await advance(500)
    expect(screen.getByTestId('sk', { includeHiddenElements: true })).toBeTruthy()
    expect(screen.queryByTestId('sk-brilho')).toBeNull()
    expect(animated('sk-pulso').opacity).toBe(1)
  })

  it('on com movimento reduzido: sem brilho nem pulso, parado', async () => {
    mockReduced.mockReturnValue(true)
    await render(
      <BrandProvider motion="on">
        <Skeleton testID="sk" />
      </BrandProvider>,
    )
    await advance(1500)
    expect(screen.queryByTestId('sk-brilho')).toBeNull()
    expect(animated('sk-pulso').opacity).toBe(1)
  })

  it('off: pulso de opacidade pelos tokens (1.000 ms, 0,5 no meio do ciclo), sem brilho', async () => {
    await render(
      <BrandProvider>
        <Skeleton testID="sk" />
      </BrandProvider>,
    )
    expect(screen.queryByTestId('sk-brilho')).toBeNull()
    await advance(1000)
    expect(animated('sk-pulso').opacity).toBeCloseTo(0.5, 2)
    await advance(1000)
    expect(animated('sk-pulso').opacity).toBeCloseTo(1, 2)
  })
})
