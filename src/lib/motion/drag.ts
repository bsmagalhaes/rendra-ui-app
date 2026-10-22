const DISMISS_RATIO = 0.4
const RUBBER = 0.35
/** Constante da fricção ao puxar além do ponto de repouso (receita do animate-expo). */
const RUBBER_CONSTANT = 0.55
/** Taxa de desaceleração do dedo (a forma exponencial da Apple, a mesma da receita). */
const DECELERATION = 0.998

/**
 * Onde o dedo pararia se continuasse desacelerando (px, com `velocity` em px/s). Forma exponencial
 * da Apple, não a v²/2a da física escolar: `((v / 1000) * 0,998) / (1 - 0,998)`, cerca de 0,499·v.
 */
export function project(velocity: number, decelerationRate: number = DECELERATION): number {
  'worklet'
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate)
}

/** Quanto mais além da borda, menos o elemento acompanha o dedo: fricção, não muro. */
export function rubberband(overshoot: number, dimension: number, constant: number = RUBBER_CONSTANT): number {
  'worklet'
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot))
}

/**
 * Deslocamento da folha ou gaveta acompanhando o dedo. No sentido de fechar (`translation > 0`) é
 * livre até o tamanho e, além dele, com resistência. No sentido de abrir (`translation < 0`, além
 * do repouso) vem a fricção do `rubberband`, nunca um muro.
 */
export function dragOffset(translation: number, size: number): number {
  'worklet'
  if (translation < 0) return rubberband(translation, size)
  if (translation <= size) return translation
  return size + (translation - size) * RUBBER
}

/**
 * Fecha pela projeção: a posição atual somada ao quanto o dedo ainda andaria (`project(velocity)`)
 * passa de 40% do tamanho. Um arremesso curto fecha; um arraste lento e curto volta.
 */
export function shouldDismiss(translation: number, velocity: number, size: number): boolean {
  'worklet'
  return translation + project(velocity) > size * DISMISS_RATIO
}
