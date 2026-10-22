import { fireEvent, render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { advance, allNodes, animated, transformValue } from '../../test-utils/motion-style'
import { Tabs, type TabsProps } from './tabs'

jest.mock('../../lib/reduced-motion', () => ({ useReducedMotion: jest.fn(() => false) }))
// eslint-disable-next-line import/first
import { useReducedMotion } from '../../lib/reduced-motion'

const mockReduced = useReducedMotion as jest.Mock

const items = [
  { value: 'a', label: 'Alfa', content: <Text>Painel A</Text> },
  { value: 'b', label: 'Beta', content: <Text>Painel B</Text> },
]

function Casa(props: Partial<TabsProps> & { motion?: 'on' | 'off' }) {
  const { motion = 'on', ...rest } = props
  return (
    <BrandProvider motion={motion}>
      <Tabs testID="t" items={items} {...rest} />
    </BrandProvider>
  )
}

async function medir(id: string, box: { x: number; y: number; width: number; height: number }) {
  await fireEvent(screen.getByTestId(`t-aba-${id}`), 'layout', { nativeEvent: { layout: box } })
}

beforeEach(() => {
  jest.useFakeTimers()
  mockReduced.mockReturnValue(false)
})
afterEach(() => jest.useRealTimers())

describe('Tabs em motion="on"', () => {
  it('sem medida ainda, não há indicador', async () => {
    await render(<Casa />)
    expect(screen.queryByTestId('t-indicador')).toBeNull()
  })

  it('line: o indicador tem translateX e largura da aba selecionada, e a troca muda o alvo', async () => {
    await render(<Casa />)
    await medir('a', { x: 0, y: 0, width: 80, height: 44 })
    await medir('b', { x: 88, y: 0, width: 96, height: 44 })
    await advance(50)
    expect(transformValue('t-indicador', 'translateX')).toBe(0)
    expect(animated('t-indicador').width).toBe(80)
    expect(transformValue('t-indicador', 'translateY')).toBe(42)
    await fireEvent.press(screen.getByTestId('t-aba-b'))
    await advance(2000)
    expect(transformValue('t-indicador', 'translateX')).toBe(88)
    expect(animated('t-indicador').width).toBe(96)
    expect(screen.getByText('Painel B')).toBeTruthy()
  })

  it('o indicador desliza em 250 ms pela curva move: no meio do caminho está entre as abas e não passa de 88', async () => {
    await render(<Casa />)
    await medir('a', { x: 0, y: 0, width: 80, height: 44 })
    await medir('b', { x: 88, y: 0, width: 96, height: 44 })
    await advance(50)
    await fireEvent.press(screen.getByTestId('t-aba-b'))
    const amostras: number[] = []
    for (let i = 0; i < 17; i += 1) {
      await advance(16)
      amostras.push(transformValue('t-indicador', 'translateX') as number)
    }
    expect(amostras[3]).toBeGreaterThan(0)
    expect(amostras[3]).toBeLessThan(88)
    expect(Math.max(...amostras)).toBeLessThanOrEqual(88)
    expect(amostras[amostras.length - 1]).toBe(88)
    // 250 ms: aos 112 ms ainda não chegou
    expect(amostras[6]).toBeLessThan(88)
  })

  it('pill: o indicador também leva a altura e o translateY da aba', async () => {
    await render(<Casa variant="pill" />)
    await medir('a', { x: 4, y: 4, width: 80, height: 40 })
    await medir('b', { x: 88, y: 4, width: 96, height: 40 })
    await advance(50)
    expect(animated('t-indicador')).toMatchObject({ width: 80, height: 40 })
    expect(transformValue('t-indicador', 'translateX')).toBe(4)
    expect(transformValue('t-indicador', 'translateY')).toBe(4)
  })

  it('as classes de seleção saem em on e ficam em off', async () => {
    const on = await render(<Casa variant="pill" />)
    expect(screen.getByTestId('t-aba-a').props.className).not.toContain('bg-card')
    expect(screen.getByTestId('t-aba-a').props.className).toContain('shadow-none')
    await on.unmount()
    await render(<Casa variant="pill" motion="off" />)
    expect(screen.getByRole('tab', { selected: true }).props.className).toContain('bg-card')
  })

  it('com movimento reduzido o indicador troca sem deslizar', async () => {
    mockReduced.mockReturnValue(true)
    await render(<Casa />)
    await medir('a', { x: 0, y: 0, width: 80, height: 44 })
    await medir('b', { x: 88, y: 0, width: 96, height: 44 })
    await advance(20)
    await fireEvent.press(screen.getByTestId('t-aba-b'))
    await advance(20)
    expect(transformValue('t-indicador', 'translateX')).toBe(88)
  })

  it('A3: o painel novo aparece SEM entrada (troca de aba é de uso muito frequente): inteiro no primeiro quadro', async () => {
    await render(<Casa />)
    await medir('a', { x: 0, y: 0, width: 80, height: 44 })
    await medir('b', { x: 88, y: 0, width: 96, height: 44 })
    expect(screen.getByTestId('t-painel').props.entering).toBeUndefined()
    expect(allNodes((n) => n.props.entering !== undefined)).toHaveLength(0)
    await fireEvent.press(screen.getByTestId('t-aba-b'))
    expect(screen.getByText('Painel B')).toBeTruthy()
    expect(screen.queryByText('Painel A')).toBeNull()
    expect(animated('t-indicador')).toBeDefined()
    expect(allNodes((n) => n.props.entering !== undefined)).toHaveLength(0)
  })

  it('no modo select (não cabe) não há indicador nem entrada do painel', async () => {
    await render(<Casa />)
    await fireEvent(screen.getByTestId('t-container'), 'layout', { nativeEvent: { layout: { width: 100, height: 44, x: 0, y: 0 } } })
    await fireEvent(screen.getByTestId('t-medida', { includeHiddenElements: true }), 'layout', { nativeEvent: { layout: { width: 300, height: 44, x: 0, y: 0 } } })
    await advance(20)
    expect(screen.queryByTestId('t-indicador')).toBeNull()
    expect(screen.getByRole('combobox')).toBeTruthy()
    expect(screen.getByTestId('t-painel').props.entering).toBeUndefined()
  })

  it('off: sem indicador e sem painel com testID de motion', async () => {
    await render(<Casa motion="off" />)
    expect(screen.queryByTestId('t-indicador')).toBeNull()
    expect(screen.queryByTestId('t-painel')).toBeNull()
  })
})
