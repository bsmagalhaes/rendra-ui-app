import { renderHook } from '@testing-library/react-native'
import type { ReactNode } from 'react'
import { MotionProvider } from './context'
import { useMotionPreset } from './use-motion-preset'

jest.mock('../reduced-motion')
// eslint-disable-next-line import/first
import { useReducedMotion } from '../reduced-motion'

const mockReduced = useReducedMotion as jest.Mock

function wrap(mode: 'on' | 'off') {
  function Embrulho({ children }: { children: ReactNode }) {
    return <MotionProvider motion={mode}>{children}</MotionProvider>
  }
  return Embrulho
}

describe('useMotionPreset', () => {
  it('active só é verdadeiro em on', async () => {
    mockReduced.mockReturnValue(false)
    expect((await renderHook(() => useMotionPreset(), { wrapper: wrap('on') })).result.current.active).toBe(true)
    expect((await renderHook(() => useMotionPreset(), { wrapper: wrap('off') })).result.current.active).toBe(false)
  })
  it('reduced reflete o hook de movimento reduzido', async () => {
    mockReduced.mockReturnValue(true)
    const { result } = await renderHook(() => useMotionPreset(), { wrapper: wrap('on') })
    expect(result.current.reduced).toBe(true)
  })
})
