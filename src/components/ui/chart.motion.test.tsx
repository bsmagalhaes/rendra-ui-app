import { fireEvent, render, screen } from '@testing-library/react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { Chart } from './chart'

jest.mock('../../lib/reduced-motion', () => ({ useReducedMotion: jest.fn(() => false) }))
// eslint-disable-next-line import/first
import { useReducedMotion } from '../../lib/reduced-motion'

const mockReduced = useReducedMotion as jest.Mock
const dados = [
  { mes: 'Out', receita: 42100 },
  { mes: 'Nov', receita: 45800 },
  { mes: 'Dez', receita: 51200 },
]
const serie = [{ key: 'receita', label: 'Receita' }]

function Casa({ motion = 'on', type = 'line' }: { motion?: 'on' | 'off'; type?: 'line' | 'bar' | 'area' | 'pie' }) {
  return (
    <BrandProvider motion={motion}>
      <Chart type={type} data={dados} xKey="mes" series={serie} aria-label="Receita" />
    </BrandProvider>
  )
}

async function medir() {
  const plot = await screen.findByTestId('chart-plot')
  await fireEvent(plot, 'layout', { nativeEvent: { layout: { width: 320, height: 256, x: 0, y: 0 } } })
}

beforeEach(() => {
  jest.useFakeTimers()
  mockReduced.mockReturnValue(false)
})
afterEach(() => jest.useRealTimers())

describe('Chart em motion="on"', () => {
  it('line: existe o recorte e a linha segue presente', async () => {
    await render(<Casa />)
    await medir()
    expect(screen.getByTestId('chart-reveal-clip')).toBeTruthy()
    expect(screen.getByTestId('chart-line-receita')).toBeTruthy()
  })

  it('bar e pie também revelam por recorte', async () => {
    const barra = await render(<Casa type="bar" />)
    await medir()
    expect(screen.getByTestId('chart-reveal-clip')).toBeTruthy()
    await barra.unmount()
    await render(<Casa type="pie" />)
    await medir()
    expect(screen.getByTestId('chart-reveal-clip')).toBeTruthy()
    expect(screen.getByTestId('chart-slice-0')).toBeTruthy()
  })

  it('com movimento reduzido não há recorte, só fade', async () => {
    mockReduced.mockReturnValue(true)
    await render(<Casa />)
    await medir()
    expect(screen.queryByTestId('chart-reveal-clip')).toBeNull()
    expect(screen.getByTestId('chart-reveal-fade')).toBeTruthy()
  })

  it('o gauge também revela por recorte', async () => {
    await render(
      <BrandProvider motion="on">
        <Chart type="gauge" value={30} max={100} target={100} aria-label="Meta" />
      </BrandProvider>,
    )
    await medir()
    expect(screen.getByTestId('chart-reveal-clip')).toBeTruthy()
    expect(screen.getByTestId('chart-gauge-arco')).toBeTruthy()
  })

  it('off: árvore sem recorte nenhum', async () => {
    await render(<Casa motion="off" />)
    await medir()
    expect(screen.queryByTestId('chart-reveal-clip')).toBeNull()
    expect(screen.queryByTestId('chart-reveal-fade')).toBeNull()
    expect(screen.getByTestId('chart-line-receita')).toBeTruthy()
  })
})
