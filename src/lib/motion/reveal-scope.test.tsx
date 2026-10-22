import { renderHook } from '@testing-library/react-native'
import type { ReactNode } from 'react'
import { RevealScope, useReveal } from './reveal-scope'

describe('RevealScope', () => {
  it('fora dele useReveal() é false; dentro, true', async () => {
    expect((await renderHook(() => useReveal())).result.current).toBe(false)
    function Dentro({ children }: { children: ReactNode }) {
      return <RevealScope>{children}</RevealScope>
    }
    expect((await renderHook(() => useReveal(), { wrapper: Dentro })).result.current).toBe(true)
  })
})
