import { render } from '@testing-library/react-native'
import Svg from 'react-native-svg'
import { BrandProvider } from '../../brand/brand-provider'
import { RevealScope } from '../../lib/motion/reveal-scope'
import { useRevealProgress } from '../../lib/motion/use-reveal-progress'
import { ChartReveal } from './chart-reveal'

jest.mock('../../lib/reduced-motion', () => ({ useReducedMotion: jest.fn(() => false) }))
// A conta do tempo é provada em `use-reveal-progress.test.ts`; aqui só a ligação: dentro do RevealScope o
// gráfico pede o desenho de 900 ms (reveal), fora dele o de rotina (420 ms).
jest.mock('../../lib/motion/use-reveal-progress', () => {
  const actual = jest.requireActual('../../lib/motion/use-reveal-progress')
  return { ...actual, useRevealProgress: jest.fn(actual.useRevealProgress) }
})

const mockProgresso = useRevealProgress as jest.Mock

function Grafico() {
  return (
    <Svg width={320} height={256}>
      <ChartReveal width={320} height={256}>
        <></>
      </ChartReveal>
    </Svg>
  )
}

beforeEach(() => mockProgresso.mockClear())

describe('ChartReveal e o RevealScope (A9)', () => {
  it('fora do RevealScope o gráfico desenha a rotina (reveal = false)', async () => {
    await render(
      <BrandProvider motion="on">
        <Grafico />
      </BrandProvider>,
    )
    expect(mockProgresso).toHaveBeenCalled()
    expect(mockProgresso.mock.calls.every((c) => c[2] === false)).toBe(true)
  })

  it('dentro do RevealScope (o dashboard) desenha o reveal (reveal = true)', async () => {
    await render(
      <BrandProvider motion="on">
        <RevealScope>
          <Grafico />
        </RevealScope>
      </BrandProvider>,
    )
    expect(mockProgresso.mock.calls.every((c) => c[2] === true)).toBe(true)
  })
})
