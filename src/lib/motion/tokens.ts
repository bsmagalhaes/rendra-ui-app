import { Easing, ReduceMotion } from 'react-native-reanimated'
import type { WithSpringConfig, WithTimingConfig } from 'react-native-reanimated'
import { motionTokens } from '../../theme/motion'

const [ox1, oy1, ox2, oy2] = motionTokens.ease.out
const [ix1, iy1, ix2, iy2] = motionTokens.ease.inOut
const [sx1, sy1, sx2, sy2] = motionTokens.ease.spring
const [mx1, my1, mx2, my2] = motionTokens.ease.move
const [dx1, dy1, dx2, dy2] = motionTokens.ease.drawer
const [bx1, by1, bx2, by2] = motionTokens.ease.back

export const easings = {
  out: Easing.bezierFn(ox1, oy1, ox2, oy2),
  inOut: Easing.bezierFn(ix1, iy1, ix2, iy2),
  spring: Easing.bezierFn(sx1, sy1, sx2, sy2),
  /** Deslocamento na tela (indicador, reordenação): ease-in-out forte. */
  move: Easing.bezierFn(mx1, my1, mx2, my2),
  /** Gaveta e folha: a curva iOS de sheet. */
  drawer: Easing.bezierFn(dx1, dy1, dx2, dy2),
  /** O quique (`spring` com nome honesto): só para a cota rara. */
  back: Easing.bezierFn(bx1, by1, bx2, by2),
  /** Movimento constante (barra de progresso, giro): sem aceleração. */
  linear: Easing.linear,
}

export type DurationName = keyof typeof motionTokens.duration
export type EaseName = keyof typeof easings

/** Config de `withTiming` com a duração e a curva dos tokens. */
export function timing(duration: DurationName, ease: EaseName): WithTimingConfig {
  return { duration: motionTokens.duration[duration], easing: easings[ease] }
}

/** Toque único (botão, caixa, item, linha, card): 120 ms em `ease-out`, sem mola e sem quique. */
export function pressTiming(): WithTimingConfig {
  return timing('press', 'out')
}

/**
 * Movimento reduzido: só a opacidade, na duração base. `ReduceMotion.Never` porque, por padrão, o
 * Reanimated pula a animação inteira quando o sistema pede menos movimento, e aqui a opacidade é
 * justamente o que continua (menos e mais suave, não zero).
 */
export function reducedTiming(): WithTimingConfig {
  return { duration: motionTokens.duration.base, easing: easings.out, reduceMotion: ReduceMotion.Never }
}

/** Entrada de overlay ancorado (modal): mola criticamente amortecida em `base`, sem quique. */
export function openSpring(): WithSpringConfig {
  return { duration: motionTokens.duration.base, dampingRatio: 1 }
}

/** Config de `withTiming` dos reveals de uso único (contador e desenho do gráfico), em `ease-out`. */
export function revealTiming(name: 'count' | 'draw'): WithTimingConfig {
  return { duration: motionTokens.reveal[name], easing: easings.out }
}

export const springConfigs: Record<keyof typeof motionTokens.spring, WithSpringConfig> = {
  snappy: { ...motionTokens.spring.snappy },
  soft: { ...motionTokens.spring.soft },
  overshoot: { ...motionTokens.spring.overshoot },
  settle: { ...motionTokens.spring.settle },
  sheet: { ...motionTokens.spring.sheet },
  playful: { ...motionTokens.spring.playful },
}
