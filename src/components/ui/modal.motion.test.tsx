import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { advance, animated, transformValue } from '../../test-utils/motion-style'
import { Modal } from './modal'
import { useReducedMotion } from '../../lib/reduced-motion'

jest.mock('../../lib/reduced-motion', () => ({ useReducedMotion: jest.fn(() => false) }))
const mockReduced = useReducedMotion as jest.Mock

function Harness() {
  const [open, setOpen] = useState(true)
  return (
    <BrandProvider motion="on">
      <Modal open={open} onOpenChange={setOpen} title="Excluir item?" type="destructive" />
    </BrandProvider>
  )
}

beforeEach(() => {
  jest.useFakeTimers()
  mockReduced.mockReturnValue(false)
})
afterEach(() => jest.useRealTimers())

describe('Modal em motion="on"', () => {
  it('o cartão entra: sai de opacidade 0 e escala menor, e chega a 1 e 1', async () => {
    await render(<Harness />)
    expect(animated('modal-card').opacity).toBe(0)
    expect(transformValue('modal-card', 'scale') as number).toBeLessThan(1)
    expect(transformValue('modal-card', 'translateY') as number).toBeGreaterThan(0)
    await advance(1000)
    expect(animated('modal-card').opacity).toBe(1)
    expect(transformValue('modal-card', 'scale')).toBe(1)
    expect(transformValue('modal-card', 'translateY')).toBe(0)
    expect(animated('modal-backdrop').opacity).toBe(1)
  })

  it('entra por mola criticamente amortecida: de 0,95 e 8 px, sem passar de 1 nem de 0 (sem quique)', async () => {
    await render(<Harness />)
    expect(transformValue('modal-card', 'scale')).toBeCloseTo(0.95, 5)
    expect(transformValue('modal-card', 'translateY')).toBeCloseTo(8, 5)
    const escalas: number[] = []
    const desloc: number[] = []
    for (let i = 0; i < 20; i += 1) {
      await advance(16)
      escalas.push(transformValue('modal-card', 'scale') as number)
      desloc.push(transformValue('modal-card', 'translateY') as number)
    }
    expect(Math.max(...escalas)).toBeLessThanOrEqual(1.0001)
    expect(Math.min(...desloc)).toBeGreaterThanOrEqual(-0.0001)
  })

  it('a saída é assimétrica: só a opacidade, em 120 ms (fast); o cartão não encolhe nem desliza e o fundo esmaece junto', async () => {
    await render(<Harness />)
    await advance(1000)
    await fireEvent.press(await screen.findByText('Cancelar'))
    await advance(48)
    const op = animated('modal-card').opacity as number
    expect(op).toBeGreaterThan(0)
    expect(op).toBeLessThan(1)
    expect(transformValue('modal-card', 'scale')).toBe(1)
    expect(transformValue('modal-card', 'translateY')).toBe(0)
    expect(animated('modal-backdrop').opacity as number).toBeLessThan(1)
    await advance(100)
    // a presença acabou junto com a saída de 120 ms: nada de cartão parado e invisível
    expect(screen.queryByTestId('modal-card')).toBeNull()
  })

  it('a saída é adiada: fechar mantém o modal montado até o fim', async () => {
    await render(<Harness />)
    await advance(1000)
    await fireEvent.press(await screen.findByText('Cancelar'))
    expect(screen.queryByTestId('modal-rn')).toBeTruthy()
    await advance(60)
    expect(screen.queryByTestId('modal-rn')).toBeTruthy()
    await advance(400)
    expect(screen.queryByTestId('modal-rn')).toBeNull()
  })

  it('a presença acompanha a saída: sai em fast (120 ms), mais curta que a entrada em base (200 ms)', async () => {
    await render(<Harness />)
    await advance(1000)
    await fireEvent.press(await screen.findByText('Cancelar'))
    await advance(90)
    expect(screen.queryByTestId('modal-rn')).toBeTruthy()
    await advance(60)
    expect(screen.queryByTestId('modal-rn')).toBeNull()
  })

  it('sob movimento reduzido a saída dura base (200 ms), a opacidade que sobra', async () => {
    mockReduced.mockReturnValue(true)
    await render(<Harness />)
    await advance(1000)
    await fireEvent.press(await screen.findByText('Cancelar'))
    await advance(150)
    expect(screen.queryByTestId('modal-rn')).toBeTruthy()
    await advance(70)
    expect(screen.queryByTestId('modal-rn')).toBeNull()
  })

  it('com movimento reduzido não há deslocamento nem escala, só opacidade', async () => {
    mockReduced.mockReturnValue(true)
    await render(<Harness />)
    expect(transformValue('modal-card', 'translateY')).toBe(0)
    expect(transformValue('modal-card', 'scale')).toBe(1)
    await advance(1000)
    expect(animated('modal-card').opacity).toBe(1)
  })

  it('fechado desde o começo não monta nada', async () => {
    await render(
      <BrandProvider motion="on">
        <Modal open={false} onOpenChange={() => {}} title="Oculto" />
      </BrandProvider>,
    )
    expect(screen.queryByText('Oculto')).toBeNull()
  })
})
