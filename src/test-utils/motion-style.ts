import { act, screen } from '@testing-library/react-native'
import { getAnimatedStyle } from 'react-native-reanimated'

type Flat = {
  opacity?: number
  width?: number | string
  height?: number | string
  transform?: Record<string, number | string>[]
}

/** Estilo animado atual de um nó pelo testID (o que a UI thread aplicaria agora). */
export function animated(testID: string): Flat {
  return getAnimatedStyle(screen.getByTestId(testID, { includeHiddenElements: true })) as Flat
}

/** Valor de um item de `transform` (ex.: `translateY`, `scale`); `undefined` se não houver. */
export function transformValue(testID: string, key: string): number | string | undefined {
  return animated(testID).transform?.find((item) => key in item)?.[key]
}

/** Avança os timers falsos (e, com eles, as animações do Reanimated) por `ms`. Exige `jest.useFakeTimers()`. */
export async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms)
  })
}

type Instance = ReturnType<typeof screen.getByTestId>

const temEstiloAnimado = (n: Instance) => (n.props as { jestAnimatedStyle?: unknown }).jestAnimatedStyle !== undefined

/** Nós hospedeiros animados (com `jestAnimatedStyle`) abaixo de `node`, ou de toda a árvore sem `node`. */
export function animatedNodes(node?: Instance): Instance[] {
  return (node ?? screen.container).queryAll(temEstiloAnimado)
}

/** Nós hospedeiros da árvore inteira que satisfazem o predicado. */
export function allNodes(predicate: (n: Instance) => boolean): Instance[] {
  return screen.container.queryAll(predicate)
}

/** Escala animada do primeiro descendente animado de um nó (quando o `Animated.View` não tem testID). */
export function scaleOfFirstAnimated(node: Instance): number {
  const style = getAnimatedStyle(animatedNodes(node)[0] as never) as Flat
  return (style.transform?.find((item) => 'scale' in item)?.scale as number) ?? Number.NaN
}
