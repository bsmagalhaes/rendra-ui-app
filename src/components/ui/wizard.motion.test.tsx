import { fireEvent, render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { Wizard } from './wizard'
import { advance } from '../../test-utils/motion-style'

jest.mock('../../lib/reduced-motion', () => ({ useReducedMotion: jest.fn(() => false) }))
// eslint-disable-next-line import/first
import { useReducedMotion } from '../../lib/reduced-motion'

const mockReduced = useReducedMotion as jest.Mock
const steps = [
  { id: 'a', title: 'Dados' },
  { id: 'b', title: 'Endereço' },
]

function Casa({ motion = 'on' }: { motion?: 'on' | 'off' }) {
  return (
    <BrandProvider motion={motion}>
      <Wizard steps={steps}>{[<Text key="a">Passo A</Text>, <Text key="b">Passo B</Text>]}</Wizard>
    </BrandProvider>
  )
}

function inicial(): { transform?: Record<string, number>[]; opacity: number } {
  const entering = screen.getByTestId('wizard-etapa').props.entering as (v: unknown) => { initialValues: never }
  return entering({}).initialValues
}

beforeEach(() => {
  jest.useFakeTimers()
  mockReduced.mockReturnValue(false)
})
afterEach(() => jest.useRealTimers())

describe('Wizard em motion="on"', () => {
  it('avançar entra pela direita e voltar entra pela esquerda, com fade', async () => {
    await render(<Casa />)
    await fireEvent.press(screen.getByText('Avançar'))
    await advance(50)
    expect(screen.getByText('Passo B')).toBeTruthy()
    expect(inicial().opacity).toBe(0)
    expect((inicial().transform?.[0].translateX as number) > 0).toBe(true)
    await fireEvent.press(screen.getByText('Voltar'))
    await advance(50)
    expect(screen.getByText('Passo A')).toBeTruthy()
    expect((inicial().transform?.[0].translateX as number) < 0).toBe(true)
  })

  it('com movimento reduzido só há fade', async () => {
    mockReduced.mockReturnValue(true)
    await render(<Casa />)
    await fireEvent.press(screen.getByText('Avançar'))
    await advance(50)
    expect(inicial().transform).toBeUndefined()
    expect(inicial().opacity).toBe(0)
  })

  it('off: sem envoltório de transição', async () => {
    await render(<Casa motion="off" />)
    await fireEvent.press(screen.getByText('Avançar'))
    await advance(50)
    expect(screen.queryByTestId('wizard-etapa')).toBeNull()
    expect(screen.getByText('Passo B')).toBeTruthy()
  })
})
