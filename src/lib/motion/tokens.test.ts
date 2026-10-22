import { Easing, ReduceMotion } from 'react-native-reanimated'
import { motionTokens } from '../../theme/motion'
import { easings, openSpring, pressTiming, reducedTiming, springConfigs, timing } from './tokens'

function sample(fn: (t: number) => number) {
  return [0, 0.5, 1].map((t) => fn(t))
}

describe('tokens executáveis', () => {
  it('as curvas são Easing.bezier com os mesmos números do tema', () => {
    const [ox1, oy1, ox2, oy2] = motionTokens.ease.out
    expect(sample(easings.out)).toEqual(sample(Easing.bezierFn(ox1, oy1, ox2, oy2)))
    expect(easings.out(0)).toBe(0)
    expect(easings.out(1)).toBe(1)
    expect(easings.out(0.5)).toBeGreaterThan(0.5)
  })

  it('ease-spring passa de 1 no meio do caminho (overshoot)', () => {
    const peak = Math.max(...Array.from({ length: 21 }, (_, i) => easings.spring(i / 20)))
    expect(peak).toBeGreaterThan(1)
  })

  it('ease-in-out é simétrica no meio', () => {
    expect(easings.inOut(0.5)).toBeCloseTo(0.5, 2)
  })

  it('timing() monta a config de withTiming com duração do token', () => {
    const cfg = timing('base', 'out')
    expect(cfg.duration).toBe(motionTokens.duration.base)
    expect(cfg.easing).toBe(easings.out)
  })

  it('springConfigs expõe as configs do tema, antigas e novas', () => {
    expect(springConfigs.snappy).toEqual(motionTokens.spring.snappy)
    expect(springConfigs.overshoot.damping).toBe(motionTokens.spring.overshoot.damping)
    expect(springConfigs.settle).toEqual({ duration: 400, dampingRatio: 1 })
    expect(springConfigs.sheet).toEqual({ duration: 300, dampingRatio: 0.8 })
    expect(springConfigs.playful).toEqual({ duration: 400, dampingRatio: 0.6 })
  })

  it('as curvas novas (move, drawer, back) são Easing.bezier dos números do tema', () => {
    for (const nome of ['move', 'drawer', 'back'] as const) {
      const [x1, y1, x2, y2] = motionTokens.ease[nome]
      expect(sample(easings[nome])).toEqual(sample(Easing.bezierFn(x1, y1, x2, y2)))
    }
    // move parte devagar e chega depressa no meio (ease-in-out forte); drawer sai rápido (ease-out forte)
    expect(easings.move(0.25)).toBeLessThan(0.25)
    expect(easings.drawer(0.25)).toBeGreaterThan(0.5)
    // a antiga ease-in-out não mudou de valor
    expect(motionTokens.ease.inOut).toEqual([0.65, 0, 0.35, 1])
  })

  it('timing() aceita as durações novas: press 120 e move 250', () => {
    expect(timing('press', 'out').duration).toBe(120)
    expect(timing('move', 'move').duration).toBe(250)
    expect(timing('move', 'move').easing).toBe(easings.move)
  })

  it('pressTiming() é o toque único: 120 ms, ease-out, sem mola', () => {
    expect(pressTiming()).toEqual({ duration: 120, easing: easings.out })
  })

  it('reducedTiming() é só opacidade em base e não deixa o Reanimated pular a animação', () => {
    expect(reducedTiming().duration).toBe(200)
    expect(reducedTiming().reduceMotion).toBe(ReduceMotion.Never)
  })

  it('openSpring() é a mola do overlay ancorado: base, sem quique', () => {
    expect(openSpring()).toEqual({ duration: 200, dampingRatio: 1 })
  })

  it('linear existe para o movimento constante (progress) e é a identidade', () => {
    expect(easings.linear(0.3)).toBeCloseTo(0.3, 10)
    expect(timing('base', 'linear')).toEqual({ duration: 200, easing: easings.linear })
  })
})
