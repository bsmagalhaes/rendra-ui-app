import { act, fireEvent, render, screen } from '@testing-library/react-native'
import { useState } from 'react'
import { getByGestureTestId } from 'react-native-gesture-handler/jest-utils'
import { BrandProvider } from '../../brand'
import { List } from './list'

/*
 * O arraste da `List` é worklet: `onStart` e `onEnd` voltam à JS por `scheduleOnRN` (assíncrono de
 * verdade, aqui sem trocar o agendador). Provas do que o síncrono dos outros testes esconde:
 *  - atualizações do dedo que chegam ANTES de o `begin` ser entregue à JS são descartadas, sem erro;
 *  - depois do `begin`, o dedo move a linha e o `end` confirma a nova ordem uma única vez.
 */
const items = [
  { id: '1', title: 'Ana Souza' },
  { id: '2', title: 'Bruno Lima' },
  { id: '3', title: 'Carla Dias' },
]

function Controlada({ onReorder }: { onReorder: (ids: string[]) => void }) {
  const [ordem, setOrdem] = useState(items)
  return (
    <List
      testID="lista"
      items={ordem}
      scrollEnabled={false}
      onReorder={(nova) => {
        onReorder(nova.map((i) => i.id))
        setOrdem(nova as typeof items)
      }}
    />
  )
}

type Handlers = {
  onStart?: (e: object) => void
  onUpdate?: (e: object) => void
  onEnd?: (e: object, success: boolean) => void
  onFinalize?: (e: object, success: boolean) => void
}
const alca = (id: string) => (getByGestureTestId(id) as unknown as { handlers: Handlers }).handlers
const entregar = () => act(async () => { await new Promise((r) => setTimeout(r, 20)) })

describe('List reordenável: a volta assíncrona à JS', () => {
  it('atualização que chega antes do begin é descartada; depois do begin o dedo move a linha e o end confirma uma vez', async () => {
    const onReorder = jest.fn()
    await render(
      <BrandProvider>
        <Controlada onReorder={onReorder} />
      </BrandProvider>,
    )
    for (const id of ['1', '2', '3']) {
      await fireEvent(screen.getByTestId(`lista-row-${id}`), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 44 } } })
    }
    const gesto = alca('lista-handle-1')
    // começo e uma atualização no MESMO quadro: o `begin` ainda está na fila da JS
    await act(async () => {
      gesto.onStart?.({ translationY: 0 })
      gesto.onUpdate?.({ translationY: 90 })
    })
    await entregar()
    // o `begin` chegou; as atualizações seguintes (já com `active` gravado) movem a linha
    await act(async () => {
      gesto.onUpdate?.({ translationY: 100 })
    })
    expect(onReorder).not.toHaveBeenCalled()
    await act(async () => {
      gesto.onEnd?.({ translationY: 100 }, true)
      gesto.onFinalize?.({}, true)
    })
    await entregar()
    expect(onReorder).toHaveBeenCalledTimes(1)
    expect(onReorder).toHaveBeenCalledWith(['2', '3', '1'])
  })
})
