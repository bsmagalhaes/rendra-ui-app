import { Profiler } from 'react'
import { Platform } from 'react-native'
import { render, screen } from '@testing-library/react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { advance } from '../../test-utils/motion-style'
import { StatCard } from './stat-card'

jest.mock('../../lib/reduced-motion', () => ({ useReducedMotion: jest.fn(() => false) }))
// eslint-disable-next-line import/first
import { useReducedMotion } from '../../lib/reduced-motion'

const mockReduced = useReducedMotion as jest.Mock

function Casa({ value, motion = 'on' }: { value: React.ReactNode; motion?: 'on' | 'off' }) {
  return (
    <BrandProvider motion={motion}>
      <StatCard label="Receita" value={value} />
    </BrandProvider>
  )
}

beforeEach(() => {
  jest.useFakeTimers()
  mockReduced.mockReturnValue(false)
})
afterEach(() => jest.useRealTimers())

describe('StatCard em motion="on"', () => {
  it('string pt-BR conta em UI thread e o valor final é o texto de sempre', async () => {
    await render(<Casa value="R$ 12.480,00" />)
    const contador = screen.getByTestId('stat-valor-contador')
    expect(contador.props.defaultValue).toBe('R$ 12.480,00')
    expect(contador.props.editable).toBe(false)
    await advance(1500)
    expect(screen.getByDisplayValue('R$ 12.480,00')).toBeTruthy()
  })

  it('número também conta e mostra o valor final formatado', async () => {
    await render(<Casa value={12480} />)
    expect(screen.getByTestId('stat-valor-contador').props.defaultValue).toBe('12.480')
  })

  it('o rótulo acessível do bloco de valor segue com o valor final', async () => {
    await render(<Casa value="R$ 12.480,00" />)
    expect(screen.getByLabelText('Receita, R$ 12.480,00')).toBeTruthy()
  })

  it('fora do formato (texto livre), só aparece com fade e o texto é o de sempre', async () => {
    await render(<Casa value="Sem dados" />)
    expect(screen.queryByTestId('stat-valor-contador')).toBeNull()
    expect(screen.getByText('Sem dados')).toBeTruthy()
  })

  // Mudança de comportamento registrada (D5 revista, 19/10/2026): antes afirmava "no navegador só há fade".
  it('no navegador também conta: valor intermediário menor que o alvo e final exato', async () => {
    const original = Platform.OS
    Platform.OS = 'web'
    try {
      await render(<Casa value="R$ 12.480,00" />)
      const contador = screen.getByTestId('stat-valor-contador', { includeHiddenElements: true })
      await advance(800)
      const meio = String(contador.props.jestAnimatedProps.value.text)
      expect(meio).not.toBe('R$ 12.480,00')
      expect(Number(meio.replace(/\D/g, ''))).toBeLessThan(1248000)
      await advance(500)
      expect(contador.props.jestAnimatedProps.value.text).toBe('R$ 12.480,00')
    } finally {
      Platform.OS = original
    }
  })

  it('no navegador a contagem não renderiza o cartão por quadro (no máximo 2 commits em 420 ms)', async () => {
    const original = Platform.OS
    Platform.OS = 'web'
    let commits = 0
    try {
      await render(
        <BrandProvider motion="on">
          <Profiler id="cartao" onRender={() => (commits += 1)}>
            <StatCard label="Receita" value="R$ 12.480,00" />
          </Profiler>
        </BrandProvider>,
      )
      await advance(420)
      expect(commits).toBeLessThanOrEqual(2)
    } finally {
      Platform.OS = original
    }
  })

  it('no navegador o contador fica fora da ordem de Tab e escondido da leitura (o rótulo do grupo já tem o valor)', async () => {
    const original = Platform.OS
    Platform.OS = 'web'
    try {
      await render(<Casa value="R$ 12.480,00" />)
      const contador = screen.getByTestId('stat-valor-contador', { includeHiddenElements: true })
      expect(contador.props.focusable).toBe(false)
      expect(contador.props['aria-hidden']).toBe(true)
    } finally {
      Platform.OS = original
    }
  })

  it('com movimento reduzido não conta: só fade', async () => {
    mockReduced.mockReturnValue(true)
    await render(<Casa value="R$ 12.480,00" />)
    expect(screen.queryByTestId('stat-valor-contador')).toBeNull()
    expect(screen.getByText('R$ 12.480,00')).toBeTruthy()
  })

  it('off: o Text de sempre, sem contador', async () => {
    await render(<Casa value="R$ 12.480,00" motion="off" />)
    expect(screen.queryByTestId('stat-valor-contador')).toBeNull()
    expect(screen.getByText('R$ 12.480,00')).toBeTruthy()
  })
})
