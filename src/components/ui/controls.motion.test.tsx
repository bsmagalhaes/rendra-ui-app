import { useState } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils'
import { State } from 'react-native-gesture-handler'
import { getAnimatedStyle } from 'react-native-reanimated'
import { BrandProvider } from '../../brand/brand-provider'
import { advance, allNodes, animated, scaleOfFirstAnimated, transformValue } from '../../test-utils/motion-style'
import { Button } from './button'
import { Checkbox } from './checkbox'
import { RadioGroup, radioDotTarget } from './radio-group'
import { Rating } from './rating'
import { Slider } from './slider'
import { Switch, switchThumbMotion } from './switch'
import { timing } from '../../lib/motion/tokens'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu'
import { Select } from './select'
import { specOf } from '../../test-utils/motion-spec'

jest.mock('../../lib/reduced-motion', () => ({ useReducedMotion: jest.fn(() => false) }))
// eslint-disable-next-line import/first
import { useReducedMotion } from '../../lib/reduced-motion'

const mockReduced = useReducedMotion as jest.Mock

function Raiz({ motion = 'on', children }: { motion?: 'on' | 'off'; children: React.ReactNode }) {
  return <BrandProvider motion={motion}>{children}</BrandProvider>
}

beforeEach(() => {
  jest.useFakeTimers()
  mockReduced.mockReturnValue(false)
})
afterEach(() => jest.useRealTimers())

describe('Button em motion="on"', () => {
  it('escala por spring no toque (token press) e volta a 1; o realce de cor (estado pressed) continua', async () => {
    await render(
      <Raiz>
        <Button accessibilityLabel="Salvar">Salvar</Button>
      </Raiz>,
    )
    const botao = screen.getByRole('button', { name: 'Salvar' })
    expect(scaleOfFirstAnimated(botao)).toBe(1)
    await fireEvent(botao, 'pressIn')
    await advance(1500)
    expect(scaleOfFirstAnimated(botao)).toBe(0.97)
    expect(botao.props.className).toContain('bg-primary-hover')
    await fireEvent(botao, 'pressOut')
    await advance(1500)
    expect(scaleOfFirstAnimated(botao)).toBe(1)
    expect(botao.props.className).not.toContain('bg-primary-hover')
  })

  it('A2: off usa o MESMO token press (0,97, 120 ms), não mais o 0,98 de 100 ms', async () => {
    await render(
      <Raiz motion="off">
        <Button accessibilityLabel="Salvar">Salvar</Button>
      </Raiz>,
    )
    const botao = screen.getByRole('button', { name: 'Salvar' })
    await fireEvent(botao, 'pressIn')
    await advance(1500)
    expect(scaleOfFirstAnimated(botao)).toBe(0.97)
  })

  it.each(['on', 'off'] as const)('A2 (%s): soltar volta a 1 em 120 ms e NUNCA passa de 1 (sem quique)', async (motion) => {
    await render(
      <Raiz motion={motion}>
        <Button accessibilityLabel="Salvar">Salvar</Button>
      </Raiz>,
    )
    const botao = screen.getByRole('button', { name: 'Salvar' })
    await fireEvent(botao, 'pressIn')
    await advance(1500)
    await fireEvent(botao, 'pressOut')
    const amostras: number[] = []
    for (let i = 0; i < 12; i += 1) {
      await advance(16)
      amostras.push(scaleOfFirstAnimated(botao))
    }
    expect(Math.max(...amostras)).toBeLessThanOrEqual(1)
    expect(amostras[amostras.length - 1]).toBe(1)
    // 120 ms ao todo: aos 112 ms ainda não chegou, aos 144 ms já chegou
    expect(amostras[6]).toBeLessThan(1)
  })

  it('com movimento reduzido não escala', async () => {
    mockReduced.mockReturnValue(true)
    await render(
      <Raiz>
        <Button accessibilityLabel="Salvar">Salvar</Button>
      </Raiz>,
    )
    const botao = screen.getByRole('button', { name: 'Salvar' })
    await fireEvent(botao, 'pressIn')
    await advance(1500)
    expect(scaleOfFirstAnimated(botao)).toBe(1)
  })
})

describe('switchThumbMotion', () => {
  it('A12: on assenta em 200 ms pela curva move (sem mola); off o withTiming de sempre; reduzido troca seco', () => {
    expect(switchThumbMotion(true, false)).toEqual({ timing: timing('base', 'move') })
    expect(switchThumbMotion(true, false).timing.duration).toBe(200)
    expect(switchThumbMotion(false, false)).toEqual({ timing: { duration: 200 } })
    expect(switchThumbMotion(false, true)).toEqual({ timing: { duration: 0 } })
    expect(switchThumbMotion(true, true)).toEqual({ timing: { duration: 0 } })
  })
})

describe('Switch em motion="on"', () => {
  it('o polegar chega a translateX 24 em até 200 ms e volta a 0, sem passar do fim', async () => {
    function Caso() {
      const [ligado, setLigado] = useState(false)
      return <Switch id="sw" checked={ligado} onCheckedChange={setLigado} accessibilityLabel="Notificações" />
    }
    await render(
      <Raiz>
        <Caso />
      </Raiz>,
    )
    expect(transformValue('sw-thumb', 'translateX')).toBe(0)
    await fireEvent.press(screen.getByRole('switch'))
    const ida: number[] = []
    for (let i = 0; i < 13; i += 1) {
      await advance(16)
      ida.push(transformValue('sw-thumb', 'translateX') as number)
    }
    expect(Math.max(...ida)).toBeLessThanOrEqual(24)
    expect(ida[ida.length - 1]).toBe(24)
    await fireEvent.press(screen.getByRole('switch'))
    await advance(2000)
    expect(transformValue('sw-thumb', 'translateX')).toBe(0)
  })

  it('com movimento reduzido salta direto, sem animar', async () => {
    mockReduced.mockReturnValue(true)
    await render(
      <Raiz>
        <Switch id="sw" checked onCheckedChange={() => {}} accessibilityLabel="Notificações" />
      </Raiz>,
    )
    expect(transformValue('sw-thumb', 'translateX')).toBe(24)
  })
})

describe('Checkbox em motion="on"', () => {
  it('marcar mostra o ícone com entering de pop; a caixa escala no toque', async () => {
    function Caso() {
      const [marcado, setMarcado] = useState(false)
      return <Checkbox id="ck" checked={marcado} onCheckedChange={(v) => setMarcado(v === true)} accessibilityLabel="Aceito" />
    }
    await render(
      <Raiz>
        <Caso />
      </Raiz>,
    )
    await fireEvent(screen.getByTestId('ck'), 'pressIn')
    await advance(1500)
    await fireEvent(screen.getByTestId('ck'), 'pressOut')
    await fireEvent.press(screen.getByTestId('ck'))
    await advance(50)
    // A6: o check de uso frequente entra de 0,9 a 1 em 120 ms, sem quique (o pop de 0,8 é da cota rara)
    const checkEntrando = allNodes((n) => typeof n.props.entering === 'function' && specOf(n.props.entering)?.scale === 0.9)
    expect(checkEntrando.length).toBeGreaterThan(0)
    expect(specOf(checkEntrando[0].props.entering)).toMatchObject({ duration: 120, opacity: true })
    expect(allNodes((n) => typeof n.props.entering === 'function' && (specOf(n.props.entering)?.scale ?? 1) < 0.9)).toHaveLength(0)
  })

  it('off: sem entering nenhum', async () => {
    await render(
      <Raiz motion="off">
        <Checkbox id="ck" checked onCheckedChange={() => {}} accessibilityLabel="Aceito" />
      </Raiz>,
    )
    expect(allNodes((n) => typeof n.props.entering === 'function')).toHaveLength(0)
  })
})

describe('RadioGroup em motion="on"', () => {
  const opcoes = [
    { value: 'a', label: 'Alfa' },
    { value: 'b', label: 'Beta' },
  ]
  it('A1: o ponto aparece de 0,9 a 1 com opacidade, NUNCA a partir de escala 0, e o desmarcado fica em 0,9 invisível', async () => {
    function Caso() {
      const [valor, setValor] = useState<string | undefined>('a')
      return <RadioGroup options={opcoes} value={valor} onChange={setValor} accessibilityLabel="Letra" />
    }
    await render(
      <Raiz>
        <Caso />
      </Raiz>,
    )
    await advance(1000)
    const pontos = screen.getAllByTestId('radio-ponto')
    expect(pontos).toHaveLength(2)
    const escalas = pontos.map((p) => (animatedScale(p)))
    expect(escalas).toEqual([1, 0.9])
    expect(pontos.map((p) => animatedOf(p).opacity)).toEqual([1, 0])
    await fireEvent.press(screen.getByRole('radio', { name: 'Beta' }))
    // amostra quadro a quadro: o ponto que entra nunca tem escala menor que 0,9 e chega a 1 em 120 ms
    const entrando: number[] = []
    for (let i = 0; i < 10; i += 1) {
      await advance(16)
      entrando.push(animatedScale(screen.getAllByTestId('radio-ponto')[1]))
    }
    expect(Math.min(...entrando)).toBeGreaterThanOrEqual(0.9)
    expect(entrando[entrando.length - 1]).toBe(1)
    await advance(2000)
    expect(screen.getAllByTestId('radio-ponto').map((p) => animatedScale(p))).toEqual([0.9, 1])
  })

  it('off mantém as classes scale-100 e scale-0', async () => {
    await render(
      <Raiz motion="off">
        <RadioGroup options={opcoes} value="a" accessibilityLabel="Letra" />
      </Raiz>,
    )
    expect(screen.queryAllByTestId('radio-ponto')).toHaveLength(0)
  })
})

function animatedScale(node: Parameters<typeof animatedOf>[0]): number {
  return (animatedOf(node).transform?.find((t) => 'scale' in t)?.scale as number) ?? Number.NaN
}
function animatedOf(node: Parameters<typeof getAnimatedStyle>[0]) {
  return getAnimatedStyle(node) as { transform?: Record<string, number>[]; opacity?: number }
}

describe('Rating em motion="on"', () => {
  it('a estrela tocada cresce (1,08) e, na cota rara, volta com a mola playful (quique); continua selecionável', async () => {
    const onChange = jest.fn()
    await render(
      <Raiz>
        <Rating value={null} onChange={onChange} accessibilityLabel="Nota" />
      </Raiz>,
    )
    await fireEvent(screen.getByTestId('rating-press-3'), 'pressIn')
    await advance(1500)
    expect(transformValue('rating-press-3-motion', 'scale') as number).toBeGreaterThan(1)
    await fireEvent.press(screen.getByTestId('rating-press-3'))
    expect(onChange).toHaveBeenCalledWith(3)
  })
})

describe('Slider em motion="on"', () => {
  it('o gesto extra cresce a alça no begin e volta a 1 no fim; o gesto antigo segue chamando onChange', async () => {
    const onChange = jest.fn()
    await render(
      <Raiz>
        <Slider value={[50]} min={0} max={100} step={1} onChange={onChange} accessibilityLabel="Volume" />
      </Raiz>,
    )
    await fireEvent(await screen.findByTestId('slider-trilho'), 'layout', { nativeEvent: { layout: { width: 200, height: 8, x: 0, y: 0 } } })
    expect(transformValue('slider-thumb-0-alca', 'scale')).toBe(1)
    // `fireGestureHandler` sempre fecha com END; os handlers diretos deixam o gesto no meio do toque.
    const { handlers } = getByGestureTestId('slider-thumb-0-escala') as unknown as {
      handlers: { onBegin: () => void; onFinalize: () => void }
    }
    await act(async () => {
      handlers.onBegin()
    })
    await advance(1500)
    expect(transformValue('slider-thumb-0-alca', 'scale') as number).toBeGreaterThan(1)
    await act(async () => {
      handlers.onFinalize()
    })
    await advance(2000)
    expect(transformValue('slider-thumb-0-alca', 'scale')).toBe(1)
    fireGestureHandler(getByGestureTestId('slider-thumb-0'), [{ translationX: 0 }, { translationX: 100 }, { state: State.END, translationX: 100 }])
    await advance(50)
    expect(onChange).toHaveBeenCalledWith([100])
  })

  it('off: sem escala no transform nem gesto extra', async () => {
    await render(
      <Raiz motion="off">
        <Slider value={[50]} onChange={() => {}} accessibilityLabel="Volume" />
      </Raiz>,
    )
    expect(animated('slider-thumb-0-alca').transform).toHaveLength(1)
  })
})

describe('itens de DropdownMenu e opções de Select em motion="on"', () => {
  it('o item do menu escala no toque e o realce de fundo continua por estado', async () => {
    const onSelect = jest.fn()
    await render(
      <Raiz>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button accessibilityLabel="Abrir">Abrir</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent accessibilityLabel="Ações">
            <DropdownMenuItem onSelect={onSelect}>Editar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Raiz>,
    )
    await fireEvent.press(screen.getByLabelText('Abrir'))
    const item = await screen.findByTestId('menu-item-press')
    await fireEvent(item, 'pressIn')
    await advance(1500)
    expect(transformValue('menu-item-press-motion', 'scale') as number).toBeLessThan(1)
    expect(item.props.className).toContain('bg-accent')
    await fireEvent.press(item)
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('a opção do Select continua escolhendo', async () => {
    const onChange = jest.fn()
    await render(
      <Raiz>
        <Select options={[{ value: 'a', label: 'Alfa' }]} placeholder="Letra" onChange={onChange} />
      </Raiz>,
    )
    await fireEvent.press(await screen.findByRole('combobox'))
    await fireEvent.press(await screen.findByText('Alfa'))
    await advance(50)
    expect(onChange).toHaveBeenCalledWith('a')
  })
})

describe('radioDotTarget (o off não anima nada)', () => {
  it('off devolve null, mesmo marcado e sem movimento reduzido', () => {
    expect(radioDotTarget(false, false, true)).toBeNull()
    expect(radioDotTarget(false, false, false)).toBeNull()
    expect(radioDotTarget(false, true, true)).toBeNull()
  })
  it('on: valor final pelo estado e animação salvo movimento reduzido', () => {
    expect(radioDotTarget(true, false, true)).toEqual({ value: 1, animate: true })
    expect(radioDotTarget(true, false, false)).toEqual({ value: 0, animate: true })
    expect(radioDotTarget(true, true, true)).toEqual({ value: 1, animate: false })
  })
})
