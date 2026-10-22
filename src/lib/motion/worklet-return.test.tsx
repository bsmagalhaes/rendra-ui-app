import { render } from '@testing-library/react-native'
import { View } from 'react-native'
import { Gesture, GestureDetector, GestureHandlerRootView, State } from 'react-native-gesture-handler'
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils'
import { scheduleOnRN } from 'react-native-worklets'

// Spike T0.10: gesto SEM runOnJS(true), retorno ao JS por scheduleOnRN com uma função vinda de
// props (o caso real: onOpenChange, requestClose, onReorder), observado sob setUpTests().
function Alvo({ onFim }: { onFim: (valor: number) => void }) {
  const gesto = Gesture.Pan()
    .withTestId('alvo')
    .onUpdate(() => {
      'worklet'
    })
    .onEnd((e) => {
      'worklet'
      scheduleOnRN(onFim, Math.round(e.translationX))
    })
  return (
    <GestureHandlerRootView>
      <GestureDetector gesture={gesto}>
        <View />
      </GestureDetector>
    </GestureHandlerRootView>
  )
}

describe('retorno ao JS a partir de um gesto worklet', () => {
  it('scheduleOnRN chama a função vinda de props com o argumento do gesto', async () => {
    jest.useFakeTimers()
    const onFim = jest.fn()
    await render(<Alvo onFim={onFim} />)
    fireGestureHandler(getByGestureTestId('alvo'), [
      { state: State.BEGAN },
      { state: State.ACTIVE, translationX: 0 },
      { translationX: 42 },
      { state: State.END, translationX: 42 },
    ])
    jest.runAllTimers()
    await Promise.resolve()
    expect(onFim).toHaveBeenCalledWith(42)
    jest.useRealTimers()
  })
})
