import type { ReactNode } from 'react'
import { useId } from 'react'
import Animated, { useAnimatedProps } from 'react-native-reanimated'
import { ClipPath, Defs, G, Rect } from 'react-native-svg'
import { useMotionPreset } from '../../lib/motion/use-motion-preset'
import { useReveal } from '../../lib/motion/reveal-scope'
import { useRevealProgress } from '../../lib/motion/use-reveal-progress'

const AnimatedRect = Animated.createAnimatedComponent(Rect)
const AnimatedG = Animated.createAnimatedComponent(G)

function safe(id: string) {
  return id.replace(/[^a-zA-Z0-9_-]/g, '')
}

/**
 * Revelação do gráfico por recorte: um `Rect` de recorte com `width` animada (UI thread, por
 * `useAnimatedProps`): 420 ms (`draw`) sem atraso na rotina, e 900 ms depois de 200 ms só dentro do
 * `RevealScope` (o dashboard); só na primeira montagem, sem reiniciar ao girar a tela. Com
 * `motion="off"` devolve os filhos como estão (sem `ClipPath`); com movimento reduzido não há recorte, só fade.
 */
export function ChartReveal({ width, height, children }: { width: number; height: number; children: ReactNode }) {
  const { active, reduced } = useMotionPreset()
  const clipId = `rv${safe(useId())}`
  const progress = useRevealProgress(active, reduced, useReveal())

  const clipProps = useAnimatedProps(() => ({ width: width * progress.get() }))
  const fadeProps = useAnimatedProps(() => ({ opacity: progress.get() }))

  if (!active) return <>{children}</>
  if (reduced) {
    return (
      <AnimatedG testID="chart-reveal-fade" animatedProps={fadeProps}>
        {children}
      </AnimatedG>
    )
  }
  return (
    <>
      <Defs>
        <ClipPath id={clipId}>
          <AnimatedRect testID="chart-reveal-clip" x={0} y={0} height={height} animatedProps={clipProps} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${clipId})`}>{children}</G>
    </>
  )
}
