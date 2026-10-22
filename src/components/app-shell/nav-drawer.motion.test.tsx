import { useState } from 'react'
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils'
import { State } from 'react-native-gesture-handler'
import { render, screen } from '@testing-library/react-native'
import { advance } from '../../test-utils/motion-style'
import { BrandProvider } from '../../brand/brand-provider'
import { RendraNavigationProvider } from '../../navigation/rendra-navigation'
import { navComPagina } from '../../test-utils/shell-fixtures'
import { NavDrawer } from './nav-drawer'

jest.mock('../../lib/reduced-motion', () => ({ useReducedMotion: jest.fn(() => false) }))

function Harness({ onChange }: { onChange: (open: boolean) => void }) {
  const [open, setOpen] = useState(true)
  return (
    <BrandProvider motion="on">
      <RendraNavigationProvider value={{ navigate: jest.fn(), currentPath: '/' }}>
        <NavDrawer
          open={open}
          onOpenChange={(next) => {
            onChange(next)
            setOpen(next)
          }}
          navigation={navComPagina}
        />
      </RendraNavigationProvider>
    </BrandProvider>
  )
}

beforeEach(() => jest.useFakeTimers())
afterEach(() => jest.useRealTimers())

describe('NavDrawer em motion="on"', () => {
  it('arraste longo para a esquerda fecha na hora e o painel só some ao fim da saída', async () => {
    const onChange = jest.fn()
    await render(<Harness onChange={onChange} />)
    await advance(2000)
    expect(screen.getByTestId('nav-drawer-painel')).toBeTruthy()
    fireGestureHandler(getByGestureTestId('nav-drawer-arraste'), [
      { translationX: 0 },
      { translationX: -200 },
      { state: State.END, translationX: -520, velocityX: -200 },
    ])
    await advance(30)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(false)
    expect(screen.queryByTestId('nav-drawer-painel')).toBeTruthy()
    await advance(500)
    expect(screen.queryByTestId('nav-drawer-painel')).toBeNull()
  })

  it('arraste curto não fecha', async () => {
    const onChange = jest.fn()
    await render(<Harness onChange={onChange} />)
    await advance(2000)
    fireGestureHandler(getByGestureTestId('nav-drawer-arraste'), [
      { translationX: 0 },
      { translationX: -20 },
      { state: State.END, translationX: -20, velocityX: 0 },
    ])
    await advance(30)
    expect(onChange).not.toHaveBeenCalled()
  })
})
