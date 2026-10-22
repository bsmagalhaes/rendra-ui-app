import { ReduceMotion, withDelay, withTiming } from 'react-native-reanimated'
import type { EntryExitAnimationFunction } from 'react-native-reanimated'
import { motionTokens } from '../../theme/motion'
import { easings } from './tokens'

// O spec já vem sem movimento quando o sistema pede menos (`reduceSpec`); o Reanimated não deve pular também o fade que sobra.
const NEVER = ReduceMotion.Never

/** Descrição pura de uma entrada ou saída. Com `reduced`, só sobra a opacidade. */
export interface MotionSpec {
  opacity: boolean
  translateX?: number
  translateY?: number
  scale?: number
  duration: number
  delay: number
  easing: (t: number) => number
}

/**
 * Movimento reduzido: menos e mais suave, não zero. Sobra só a opacidade, na duração base e com a
 * curva `out`, sem deslocamento, escala nem cascata (o atraso some).
 */
export function reduceSpec(spec: MotionSpec, reduced: boolean): MotionSpec {
  if (!reduced) return spec
  return { opacity: true, duration: motionTokens.duration.base, delay: 0, easing: easings.out }
}

/** Anexa a descrição ao worklet (campo `spec`), para os testes lerem duração, atraso e variante. */
function withSpec(fn: EntryExitAnimationFunction, spec: MotionSpec): EntryExitAnimationFunction {
  return Object.assign(fn, { spec })
}

function transformOf(spec: MotionSpec, settled: boolean) {
  'worklet'
  const transform: Record<string, number>[] = []
  if (spec.translateX !== undefined) transform.push({ translateX: settled ? 0 : spec.translateX })
  if (spec.translateY !== undefined) transform.push({ translateY: settled ? 0 : spec.translateY })
  if (spec.scale !== undefined) transform.push({ scale: settled ? 1 : spec.scale })
  return transform
}

/**
 * Entrada: parte do estado deslocado e transparente e chega ao lugar. Layout Animation pura
 * (sem `style`), por isso não pede liberação no R3.
 */
export function entering(spec: MotionSpec): EntryExitAnimationFunction {
  return withSpec((() => {
    'worklet'
    const config = { duration: spec.duration, easing: spec.easing, reduceMotion: NEVER }
    const run = (to: number) => (spec.delay > 0 ? withDelay(spec.delay, withTiming(to, config)) : withTiming(to, config))
    const hasTransform = transformOf(spec, false).length > 0
    const animations: Record<string, unknown> = { opacity: run(1) }
    const initialValues: Record<string, unknown> = { opacity: 0 }
    if (hasTransform) {
      initialValues.transform = transformOf(spec, false)
      animations.transform = transformOf(spec, true).map((item) => {
        const key = Object.keys(item)[0]
        return { [key]: run(item[key]) }
      })
    }
    return { initialValues, animations } as never
  }) as EntryExitAnimationFunction, spec)
}

/** Saída: do lugar para o estado deslocado e transparente. */
export function exiting(spec: MotionSpec): EntryExitAnimationFunction {
  return withSpec((() => {
    'worklet'
    const config = { duration: spec.duration, easing: spec.easing, reduceMotion: NEVER }
    const hasTransform = transformOf(spec, false).length > 0
    const animations: Record<string, unknown> = { opacity: withTiming(0, config) }
    const initialValues: Record<string, unknown> = { opacity: 1 }
    if (hasTransform) {
      initialValues.transform = transformOf(spec, true)
      animations.transform = transformOf(spec, false).map((item) => {
        const key = Object.keys(item)[0]
        return { [key]: withTiming(item[key], config) }
      })
    }
    return { initialValues, animations } as never
  }) as EntryExitAnimationFunction, spec)
}
