import { useState } from 'react'
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils'
import { State } from 'react-native-gesture-handler'
import { render, screen } from '@testing-library/react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { Text } from '../internal/text'
import { advance, transformValue } from '../../test-utils/motion-style'
import { Drawer } from './drawer'

jest.mock('../../lib/reduced-motion', () => ({ useReducedMotion: jest.fn(() => false) }))

function Harness({ onChange, dirty = false }: { onChange: (open: boolean) => void; dirty?: boolean }) {
  const [open, setOpen] = useState(true)
  return (
    <BrandProvider motion="on">
      <Drawer
        open={open}
        dirty={dirty}
        onOpenChange={(next) => {
          onChange(next)
          setOpen(next)
        }}
        title="Editar cliente"
        testID="gaveta"
      >
        <Text className="text-foreground">Corpo</Text>
      </Drawer>
    </BrandProvider>
  )
}

const longo = [{ translationX: 0 }, { translationX: 200 }, { state: State.END, translationX: 520, velocityX: 200 }]

beforeEach(() => jest.useFakeTimers())
afterEach(() => jest.useRealTimers())

describe('Drawer em motion="on"', () => {
  it('B3: arraste longo fecha na hora e o RNModal só desmonta ao fim da saída', async () => {
    const onChange = jest.fn()
    await render(<Harness onChange={onChange} />)
    await advance(2000)
    fireGestureHandler(getByGestureTestId('gaveta-arraste'), longo)
    await advance(30)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(false)
    expect(screen.queryByTestId('gaveta')).toBeTruthy()
    await advance(500)
    expect(screen.queryByTestId('gaveta')).toBeNull()
  })

  it('com dirty, o arraste volta para 0 e abre a confirmação, sem saída', async () => {
    const onChange = jest.fn()
    await render(<Harness onChange={onChange} dirty />)
    await advance(2000)
    fireGestureHandler(getByGestureTestId('gaveta-arraste'), longo)
    await advance(30)
    expect(await screen.findByText('Descartar alterações?')).toBeTruthy()
    expect(onChange).not.toHaveBeenCalled()
    await advance(2000)
    expect(screen.queryByTestId('gaveta')).toBeTruthy()
  })

  it('arraste curto volta a 0 e não fecha', async () => {
    const onChange = jest.fn()
    await render(<Harness onChange={onChange} />)
    await advance(2000)
    fireGestureHandler(getByGestureTestId('gaveta-arraste'), [
      { translationX: 0 },
      { translationX: 30 },
      { state: State.END, translationX: 30, velocityX: 0 },
    ])
    await advance(2000)
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.queryByTestId('gaveta')).toBeTruthy()
    expect(transformValue('gaveta-painel', 'translateX')).toBe(0)
  })
})
