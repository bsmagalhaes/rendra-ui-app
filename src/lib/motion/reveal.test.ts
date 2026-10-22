import { motionTokens } from '../../theme/motion'
import { easings, revealTiming } from './tokens'
import { resolveReveal, revealIn, staggerReveal } from './reveal'
import { specOf } from '../../test-utils/motion-spec'

describe('tokens de reveal (entrada de uso único, mais lenta que as interações)', () => {
  it('os valores do dono: bloco 600 ms, cascata 120 ms, contador 1.200 ms, gráfico 900 ms', () => {
    expect(motionTokens.reveal).toMatchObject({ enter: 600, stagger: 120, count: 1200, draw: 900 })
  })

  it('as interações do dia a dia não mudam', () => {
    expect(motionTokens.duration).toMatchObject({ fast: 120, base: 200, slow: 320, draw: 420, pop: 420, pulse: 1000 })
    expect(motionTokens.stagger).toMatchObject({ step: 60, max: 360 })
  })

  it('revealTiming monta o withTiming com a duração do token e a curva out', () => {
    expect(revealTiming('count')).toEqual({ duration: 1200, easing: easings.out })
    expect(revealTiming('draw').duration).toBe(900)
  })
})

describe('staggerReveal', () => {
  it('passo de 120 ms pela posição, com teto, e zero com movimento reduzido', () => {
    expect([0, 1, 2, 6].map((i) => staggerReveal(i, false))).toEqual([0, 120, 240, 720])
    expect(staggerReveal(100, false)).toBe(motionTokens.reveal.staggerMax)
    expect(staggerReveal(3, true)).toBe(0)
  })
})

describe('revealIn', () => {
  it('cada bloco dura 600 ms em ease-out, sobe pela distância pedida e atrasa pela posição', () => {
    const spec = resolveReveal('up', false, 3, 8)
    expect(spec).toMatchObject({ duration: 600, delay: 360, translateY: 8, opacity: true })
    expect(spec.easing).toBe(easings.out)
    expect(specOf(revealIn('up', false, 2, 8))).toMatchObject({ duration: 600, delay: 240 })
  })

  it('com movimento reduzido sobra só a opacidade, sem atraso', () => {
    const spec = resolveReveal('up', true, 4, 8)
    expect(spec.translateY).toBeUndefined()
    expect(spec.delay).toBe(0)
    expect(spec.duration).toBe(motionTokens.duration.base)
  })

  it('o reveal do dashboard é sempre que abrir: valores travados e nenhum "uma vez por sessão"', () => {
    // 7 blocos, 600 ms, passo 120 (teto 960), contador 1.200, gráfico 900 + 200 (decisão do dono, 20/10/2026)
    expect(motionTokens.reveal).toEqual({ enter: 600, stagger: 120, staggerMax: 960, count: 1200, draw: 900 })
    expect(motionTokens.delay.draw).toBe(200)
    const atrasos = Array.from({ length: 7 }, (_, i) => resolveReveal('up', false, i).delay)
    expect(atrasos).toEqual([0, 120, 240, 360, 480, 600, 720])
  })
})
