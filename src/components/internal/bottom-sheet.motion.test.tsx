import { useState } from 'react'
import { Dimensions, Text as RNText } from 'react-native'
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils'
import { State } from 'react-native-gesture-handler'
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { advance, animated, transformValue } from '../../test-utils/motion-style'
import { BottomSheet } from './bottom-sheet'

jest.mock('../../lib/reduced-motion', () => ({ useReducedMotion: jest.fn(() => false) }))
// eslint-disable-next-line import/first
import { useReducedMotion } from '../../lib/reduced-motion'

const mockReduced = useReducedMotion as jest.Mock

function Harness({ onChange, follow = true }: { onChange: (open: boolean) => void; follow?: boolean }) {
  const [open, setOpen] = useState(true)
  return (
    <BrandProvider motion="on">
      <BottomSheet
        open={open}
        onOpenChange={(next) => {
          onChange(next)
          if (follow) setOpen(next)
        }}
        testID="folha"
      >
        <RNText>Conteúdo</RNText>
      </BottomSheet>
    </BrandProvider>
  )
}

const longo = [{ translationY: 0 }, { translationY: 200 }, { state: State.END, translationY: 420, velocityY: 300 }]

beforeEach(() => {
  jest.useFakeTimers()
  mockReduced.mockReturnValue(false)
})
afterEach(() => jest.useRealTimers())

describe('BottomSheet em motion="on"', () => {
  it('entra com spring até translateY 0 e o fundo aparece', async () => {
    await render(<Harness onChange={() => {}} />)
    expect(transformValue('folha-sheet', 'translateY')).toBeGreaterThan(0)
    await advance(2000)
    expect(transformValue('folha-sheet', 'translateY')).toBe(0)
    expect(animated('folha-sheet').opacity).toBe(1)
    expect(animated('folha-backdrop').opacity).toBe(1)
  })

  it('o arraste acompanha o dedo durante o onUpdate', async () => {
    await render(<Harness onChange={() => {}} />)
    await advance(2000)
    // `fireGestureHandler` sempre fecha com END; os handlers diretos deixam o gesto no meio do arraste.
    const { handlers } = getByGestureTestId('folha-drag-handle') as unknown as {
      handlers: { onUpdate: (e: unknown) => void }
    }
    await act(async () => {
      handlers.onUpdate({ translationY: 90, translationX: 0 })
    })
    await advance(20)
    expect(transformValue('folha-sheet', 'translateY')).toBe(90)
  })

  it('B3: onEnd longo chama onOpenChange(false) uma vez e o modal só desmonta ao fim da saída', async () => {
    const onChange = jest.fn()
    await render(<Harness onChange={onChange} />)
    await advance(2000)
    fireGestureHandler(getByGestureTestId('folha-drag-handle'), longo)
    await advance(30)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(false)
    expect(screen.queryByTestId('folha')).toBeTruthy()
    await advance(100)
    expect(screen.queryByTestId('folha')).toBeTruthy()
    await advance(400)
    expect(screen.queryByTestId('folha')).toBeNull()
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('a saída parte de onde o dedo soltou (sem voltar a 0 antes)', async () => {
    await render(<Harness onChange={() => {}} />)
    await advance(2000)
    fireGestureHandler(getByGestureTestId('folha-drag-handle'), longo)
    await advance(30)
    // soltou em 200 (último onUpdate): a saída parte dali e segue para fora, sem voltar a 0
    const posicao = transformValue('folha-sheet', 'translateY') as number
    expect(posicao).toBeGreaterThanOrEqual(200)
    expect(posicao).toBeLessThan(700)
    await advance(100)
    expect(transformValue('folha-sheet', 'translateY') as number).toBeGreaterThan(posicao)
  })

  it('onEnd curto volta a 0 e não fecha', async () => {
    const onChange = jest.fn()
    await render(<Harness onChange={onChange} />)
    await advance(2000)
    fireGestureHandler(getByGestureTestId('folha-drag-handle'), [
      { translationY: 0 },
      { translationY: 40 },
      { state: State.END, translationY: 40, velocityY: 0 },
    ])
    await advance(2000)
    expect(transformValue('folha-sheet', 'translateY')).toBe(0)
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.queryByTestId('folha')).toBeTruthy()
  })

  it('controlado que não fecha: a folha volta para 0', async () => {
    const onChange = jest.fn()
    await render(<Harness onChange={onChange} follow={false} />)
    await advance(2000)
    fireGestureHandler(getByGestureTestId('folha-drag-handle'), longo)
    await advance(30)
    expect(onChange).toHaveBeenCalledWith(false)
    await advance(2000)
    expect(transformValue('folha-sheet', 'translateY')).toBe(0)
    expect(screen.queryByTestId('folha')).toBeTruthy()
  })

  it('toque no fundo fecha na hora (uma chamada)', async () => {
    const onChange = jest.fn()
    await render(<Harness onChange={onChange} />)
    await fireEvent.press(screen.getByTestId('folha-overlay'))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('com movimento reduzido só a opacidade anima: sem deslocamento', async () => {
    mockReduced.mockReturnValue(true)
    await render(<Harness onChange={() => {}} />)
    expect(transformValue('folha-sheet', 'translateY')).toBe(0)
    expect(animated('folha-sheet').opacity).toBe(0)
    await advance(2000)
    expect(animated('folha-sheet').opacity).toBe(1)
    expect(transformValue('folha-sheet', 'translateY')).toBe(0)
  })
})

// B5 do parecer: a velocidade do dedo entra na mola e o fechamento nunca passa do tamanho.
describe('BottomSheet em motion="on": velocidade, fricção e entrada (A4, A5, B5)', () => {
  // `size` enquanto não há onLayout: metade da janela (a folha mede a si mesma em aparelho).
  const size = () => Dimensions.get('window').height / 2

  it('entra em 320 ms pela curva drawer: forte no começo, assenta sem passar de 0', async () => {
    await render(<Harness onChange={() => {}} />)
    const inicio = transformValue('folha-sheet', 'translateY') as number
    expect(inicio).toBeGreaterThan(0)
    await advance(160)
    const metade = transformValue('folha-sheet', 'translateY') as number
    // ease-out forte (0,32, 0,72, 0, 1): na metade do tempo falta menos de 20% do caminho
    expect(metade).toBeGreaterThan(0)
    expect(metade / inicio).toBeLessThan(0.2)
    await advance(200)
    expect(transformValue('folha-sheet', 'translateY')).toBe(0)
  })

  it('soltar com velocidade fecha por projeção: a mola nunca recua nem passa do tamanho', async () => {
    await render(<Harness onChange={() => {}} />)
    await advance(2000)
    // arrasto curto (60 px) mas arremessado a 1.500 px/s: 60 + 748 passa de 40% do tamanho
    fireGestureHandler(getByGestureTestId('folha-drag-handle'), [
      { translationY: 0 },
      { translationY: 60 },
      { state: State.END, translationY: 60, velocityY: 1500 },
    ])
    const amostras: number[] = []
    for (let i = 0; i < 17; i += 1) {
      await advance(16)
      amostras.push(transformValue('folha-sheet', 'translateY') as number)
    }
    expect(amostras[0]).toBeGreaterThanOrEqual(60)
    for (let i = 1; i < amostras.length; i += 1) expect(amostras[i]).toBeGreaterThanOrEqual(amostras[i - 1] - 0.0001)
    expect(Math.max(...amostras)).toBeLessThanOrEqual(size() + 0.5)
    // com a velocidade na mola ela já avançou bem mais que o tween antigo do mesmo tempo
    expect(amostras[amostras.length - 1]).toBeGreaterThan(size() * 0.6)
  })

  it('B5: a velocidade do dedo entra na mola de volta ao repouso (soltar com arremesso para cima passa um pouco do 0 e assenta)', async () => {
    await render(<Harness onChange={() => {}} />)
    await advance(2000)
    // soltou a 40 px do repouso, indo para cima a 1.500 px/s: não fecha, e a mola herda a velocidade
    fireGestureHandler(getByGestureTestId('folha-drag-handle'), [
      { translationY: 0 },
      { translationY: 40 },
      { state: State.END, translationY: 40, velocityY: -1500 },
    ])
    const amostras: number[] = []
    for (let i = 0; i < 30; i += 1) {
      await advance(16)
      amostras.push(transformValue('folha-sheet', 'translateY') as number)
    }
    // sem a velocidade a mola desceria de 40 a 0 sem passar de 0 (quique mínimo); com ela, passa
    expect(Math.min(...amostras)).toBeLessThan(-3)
    await advance(2000)
    expect(transformValue('folha-sheet', 'translateY')).toBe(0)
  })

  it('puxar para cima do repouso tem fricção, não muro: anda um pouco e menos que o dedo', async () => {
    await render(<Harness onChange={() => {}} />)
    await advance(2000)
    const { handlers } = getByGestureTestId('folha-drag-handle') as unknown as {
      handlers: { onStart: (e: unknown) => void; onUpdate: (e: unknown) => void }
    }
    await act(async () => {
      handlers.onStart({})
      handlers.onUpdate({ translationY: -100, translationX: 0 })
    })
    await advance(20)
    const y = transformValue('folha-sheet', 'translateY') as number
    expect(y).toBeLessThan(0)
    expect(y).toBeGreaterThan(-100)
    // devolve ao repouso ao soltar, com mola
    fireGestureHandler(getByGestureTestId('folha-drag-handle'), [
      { translationY: 0 },
      { translationY: -100 },
      { state: State.END, translationY: -100, velocityY: 0 },
    ])
    await advance(2000)
    expect(transformValue('folha-sheet', 'translateY')).toBe(0)
  })

  it('pegar a folha no meio da entrada continua de onde ela está, sem teletransportar para 0', async () => {
    await render(<Harness onChange={() => {}} />)
    await advance(60)
    const antes = transformValue('folha-sheet', 'translateY') as number
    expect(antes).toBeGreaterThan(0)
    const { handlers } = getByGestureTestId('folha-drag-handle') as unknown as {
      handlers: { onStart: (e: unknown) => void; onUpdate: (e: unknown) => void }
    }
    await act(async () => {
      handlers.onStart({})
      handlers.onUpdate({ translationY: 0, translationX: 0 })
    })
    await advance(20)
    const depois = transformValue('folha-sheet', 'translateY') as number
    expect(depois).toBeGreaterThan(0)
    expect(Math.abs(depois - antes)).toBeLessThan(antes * 0.5)
  })

  it('fechar sem arraste (toque no fundo) sai em base (200 ms) pela curva out, sem mola', async () => {
    await render(<Harness onChange={() => {}} />)
    await advance(2000)
    await fireEvent.press(screen.getByTestId('folha-overlay'))
    await advance(100)
    const meio = transformValue('folha-sheet', 'translateY') as number
    expect(meio).toBeGreaterThan(0)
    await advance(110)
    expect(Math.abs((transformValue('folha-sheet', 'translateY') as number) - size())).toBeLessThan(1)
  })
})

