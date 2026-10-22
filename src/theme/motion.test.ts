import { motionTokens } from './motion'

/**
 * Contrato público (B1 do parecer): `motionTokens` é `as const` e sai em `src/index.ts`. O tipo
 * abaixo é o de hoje, literal por literal: se uma chave existente mudar de valor ou de forma, o
 * `tsc` (typecheck) acusa aqui. Só chaves novas são permitidas.
 */
type Legado = {
  readonly duration: { readonly fast: 120; readonly base: 200; readonly slow: 320; readonly draw: 420; readonly pop: 420; readonly pulse: 1000 }
  readonly delay: { readonly draw: 200 }
  readonly ease: {
    readonly out: readonly [0.22, 1, 0.36, 1]
    readonly inOut: readonly [0.65, 0, 0.35, 1]
    readonly spring: readonly [0.34, 1.56, 0.64, 1]
  }
  readonly spring: {
    readonly snappy: { readonly stiffness: 420; readonly damping: 34; readonly mass: 1 }
    readonly soft: { readonly stiffness: 220; readonly damping: 26; readonly mass: 1 }
    readonly overshoot: { readonly stiffness: 320; readonly damping: 16; readonly mass: 1 }
  }
  readonly distance: { readonly sm: 8; readonly md: 16; readonly lg: 24 }
  readonly scale: { readonly enter: 0.96; readonly press: 0.97; readonly pop: 1.08 }
  readonly stagger: { readonly step: 60; readonly max: 360 }
  readonly reveal: { readonly enter: 600; readonly stagger: 120; readonly staggerMax: 960; readonly count: 1200; readonly draw: 900 }
}
const _legado: Legado = motionTokens
void _legado

describe('motionTokens (tokens de motion do tema)', () => {
  it('as curvas antigas seguem como estão e as novas são as do web (linguagem única)', () => {
    expect(motionTokens.ease.out).toEqual([0.22, 1, 0.36, 1])
    expect(motionTokens.ease.inOut).toEqual([0.65, 0, 0.35, 1])
    expect(motionTokens.ease.spring).toEqual([0.34, 1.56, 0.64, 1])
    expect(motionTokens.ease.move).toEqual([0.77, 0, 0.175, 1])
    expect(motionTokens.ease.drawer).toEqual([0.32, 0.72, 0, 1])
    expect(motionTokens.ease.back).toEqual(motionTokens.ease.spring)
  })

  it('as durações do web, mais press 120 e move 250', () => {
    expect(motionTokens.duration).toMatchObject({ fast: 120, base: 200, slow: 320, draw: 420, pop: 420, pulse: 1000 })
    expect(motionTokens.duration.press).toBe(120)
    expect(motionTokens.duration.move).toBe(250)
    expect(motionTokens.delay.draw).toBe(200)
  })

  it('as molas antigas têm rigidez, amortecimento e massa; as novas usam duração e razão de amortecimento', () => {
    for (const nome of ['snappy', 'soft', 'overshoot'] as const) {
      const spring = motionTokens.spring[nome]
      expect(spring.stiffness).toBeGreaterThan(0)
      expect(spring.damping).toBeGreaterThan(0)
      expect(spring.mass).toBeGreaterThan(0)
    }
    expect(motionTokens.spring.settle).toEqual({ duration: 400, dampingRatio: 1 })
    expect(motionTokens.spring.sheet).toEqual({ duration: 300, dampingRatio: 0.8 })
    expect(motionTokens.spring.playful).toEqual({ duration: 400, dampingRatio: 0.6 })
  })

  it('as escalas: nada abaixo de 0,9 em uso frequente; pop parte de 0,8 e o modal abre em 0,95', () => {
    expect(motionTokens.scales).toEqual({ enter: 0.95, tooltip: 0.97, small: 0.9, press: 0.97, pop: 0.8, bump: 1.08 })
  })

  it('o passo e o teto do stagger são finitos; a cascata de rotina chega a 8 itens (480 ms)', () => {
    expect(motionTokens.stagger.step).toBeGreaterThan(0)
    expect(motionTokens.stagger.max).toBeGreaterThan(motionTokens.stagger.step)
    expect(motionTokens.stagger.cap).toBe(480)
  })

  it('o reveal do dashboard fica travado: 600, 120, 960, 1200 e 900', () => {
    expect(motionTokens.reveal).toEqual({ enter: 600, stagger: 120, staggerMax: 960, count: 1200, draw: 900 })
  })
})
