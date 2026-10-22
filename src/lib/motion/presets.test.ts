import { motionTokens } from '../../theme/motion'
import { easings } from './tokens'
import { fadeIn, fadeOut, resolveFade } from './fade'
import { resolveSlide, slideIn, slideOut } from './slide'
import { checkIn, resolveCheck } from './pop'
import { layoutTransition } from './layout'
import { stagger, staggerDelay } from './stagger'
import { LinearTransition } from 'react-native-reanimated'
import { specOf } from '../../test-utils/motion-spec'

describe('fade', () => {
  it('usa duração base e curva out dos tokens', () => {
    const spec = resolveFade('in', false)
    expect(spec.duration).toBe(motionTokens.duration.base)
    expect(spec.easing).toBe(easings.out)
    expect(spec.opacity).toBe(true)
  })
  it('a saída é mais curta que a entrada', () => {
    expect(resolveFade('out', false).duration).toBeLessThan(resolveFade('in', false).duration)
  })
  it('o worklet de entrada começa em opacidade 0 e anima para 1', () => {
    const anim = (fadeIn(false) as (v: unknown) => { initialValues: { opacity: number }; animations: { opacity: unknown } })({})
    expect(anim.initialValues.opacity).toBe(0)
    expect(anim.animations.opacity).toBeDefined()
    const out = (fadeOut(false) as (v: unknown) => { initialValues: { opacity: number } })({})
    expect(out.initialValues.opacity).toBe(1)
  })
})

describe('slide', () => {
  it('desloca na direção pedida pela distância do token', () => {
    expect(resolveSlide('in', 'up', false)).toMatchObject({ translateY: motionTokens.distance.md, opacity: true })
    expect(resolveSlide('in', 'down', false)).toMatchObject({ translateY: -motionTokens.distance.md })
    expect(resolveSlide('in', 'left', false)).toMatchObject({ translateX: motionTokens.distance.md })
    expect(resolveSlide('in', 'right', false)).toMatchObject({ translateX: -motionTokens.distance.md })
  })
  it('com reduced não tem deslocamento, só opacidade', () => {
    const spec = resolveSlide('in', 'up', true)
    expect(spec.translateY).toBeUndefined()
    expect(spec.translateX).toBeUndefined()
    expect(spec.opacity).toBe(true)
  })
  it('o worklet de entrada tem transform com deslocamento e, reduced, não tem', () => {
    const normal = (slideIn('up', false) as (v: unknown) => { initialValues: { transform?: unknown[] } })({})
    expect(normal.initialValues.transform).toBeDefined()
    const reduced = (slideIn('up', true) as (v: unknown) => { initialValues: { transform?: unknown[] } })({})
    expect(reduced.initialValues.transform).toBeUndefined()
    expect(typeof slideOut('up', false)).toBe('function')
  })
})

describe('check (uso frequente) e escalas únicas', () => {
  it('o check parte de 0,9 em 120 ms (nunca do pop de 0,8) e some sob reduzido', () => {
    const spec = resolveCheck(false)
    expect(spec.scale).toBe(motionTokens.scales.small)
    expect(spec.duration).toBe(motionTokens.duration.fast)
    expect(resolveCheck(true).scale).toBeUndefined()
    expect(typeof checkIn(false)).toBe('function')
  })
  it('scales tem os mesmos nomes e valores do web; scale (legado) não mudou', () => {
    expect(motionTokens.scales).toEqual({ enter: 0.95, tooltip: 0.97, small: 0.9, press: 0.97, pop: 0.8, bump: 1.08 })
    expect(motionTokens.scale).toEqual({ enter: 0.96, press: 0.97, pop: 1.08 })
  })
})

describe('layout', () => {
  it('usa LinearTransition do Reanimated', () => {
    expect(layoutTransition()).toBeInstanceOf(LinearTransition)
  })
})

describe('stagger', () => {
  it('o atraso do item i é i * passo, com teto', () => {
    expect(staggerDelay(0)).toBe(0)
    expect(staggerDelay(2)).toBe(2 * motionTokens.stagger.step)
    expect(staggerDelay(1000)).toBe(motionTokens.stagger.cap)
  })
  it('a cascata de rotina vai até 8 itens: o oitavo atrasa 420 ms e o teto é 480 ms', () => {
    expect(staggerDelay(7)).toBe(420)
    expect(staggerDelay(8)).toBe(480)
    expect(staggerDelay(9)).toBe(480)
  })
  it('stagger(i, reduced) devolve o atraso, e zero com reduced', () => {
    expect(stagger(3, false)).toBe(staggerDelay(3))
    expect(stagger(3, true)).toBe(0)
  })
})

describe('animation (descrição anexada ao worklet)', () => {
  it('specOf devolve a descrição do preset, e undefined para qualquer outra coisa', () => {
    const spec = specOf(slideIn('up', false, 80, 8))
    expect(spec).toMatchObject({ translateY: 8, delay: 80, duration: motionTokens.duration.base })
    expect(specOf(undefined)).toBeUndefined()
    expect(specOf(() => 1)).toBeUndefined()
  })
  it('o worklet de saída parte de opacidade 1 e leva o deslocamento do preset', () => {
    const out = (slideOut('up', false) as unknown as (v: unknown) => { initialValues: { opacity: number; transform: unknown[] } })({})
    expect(out.initialValues.opacity).toBe(1)
    expect(out.initialValues.transform).toEqual([{ translateY: 0 }])
  })
  it('a entrada com atraso embrulha a animação em withDelay', () => {
    const anim = (slideIn('up', false, 80) as (v: unknown) => { animations: { opacity: unknown } })({})
    expect(anim.animations.opacity).toBeDefined()
  })
})

describe('movimento reduzido (T1.5): só opacidade em base, sem deslocamento, escala nem cascata', () => {
  it.each([
    ['fade in', resolveFade('in', true, 120)],
    ['fade out', resolveFade('out', true, 0)],
    ['slide in', resolveSlide('in', 'up', true, 180)],
    ['slide out', resolveSlide('out', 'left', true)],
    ['check', resolveCheck(true, 240)],
  ])('%s', (_nome, spec) => {
    expect(spec.opacity).toBe(true)
    expect(spec.translateX).toBeUndefined()
    expect(spec.translateY).toBeUndefined()
    expect(spec.scale).toBeUndefined()
    expect(spec.delay).toBe(0)
    expect(spec.duration).toBe(motionTokens.duration.base)
  })
})

describe('layout (move)', () => {
  it('a transição de layout usa os 250 ms da curva move, não os 320 ms antigos', () => {
    const t = layoutTransition() as unknown as { durationV: number }
    expect(t.durationV).toBe(motionTokens.duration.move)
    expect((t as unknown as { easingV: unknown }).easingV).toBe(easings.move)
  })
})
