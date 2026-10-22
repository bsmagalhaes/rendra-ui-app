import { renderHook } from '@testing-library/react-native'
import type { ReactNode } from 'react'
import { MotionProvider, useMotion } from './context'

describe('MotionContext', () => {
  it('sem provider, useMotion() é off e não lança', async () => {
    const { result } = await renderHook(() => useMotion())
    expect(result.current).toBe('off')
  })

  it('MotionProvider motion="on" dá on', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => <MotionProvider motion="on">{children}</MotionProvider>
    const { result } = await renderHook(() => useMotion(), { wrapper })
    expect(result.current).toBe('on')
  })

  it('aninhado, vale o valor do provider mais interno', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MotionProvider motion="on">
        <MotionProvider motion="off">{children}</MotionProvider>
      </MotionProvider>
    )
    const { result } = await renderHook(() => useMotion(), { wrapper })
    expect(result.current).toBe('off')
  })
})
