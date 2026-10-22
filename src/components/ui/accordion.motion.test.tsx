import { fireEvent, render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { advance, animated, transformValue } from '../../test-utils/motion-style'
import { Accordion } from './accordion'

jest.mock('../../lib/reduced-motion', () => ({ useReducedMotion: jest.fn(() => false) }))
// eslint-disable-next-line import/first
import { useReducedMotion } from '../../lib/reduced-motion'

const mockReduced = useReducedMotion as jest.Mock
const items = [{ value: 'a', title: 'Pergunta A', content: <Text>Resposta A</Text> }]

function Casa({ motion = 'on' }: { motion?: 'on' | 'off' }) {
  return (
    <BrandProvider motion={motion}>
      <Accordion items={items} />
    </BrandProvider>
  )
}

beforeEach(() => {
  jest.useFakeTimers()
  mockReduced.mockReturnValue(false)
})
afterEach(() => jest.useRealTimers())

describe('Accordion em motion="on"', () => {
  it('A7: fechado não monta o conteúdo; aberto monta com fade de entrada e seta em 180deg', async () => {
    await render(<Casa />)
    expect(screen.queryByTestId('acordeao-conteudo-a')).toBeNull()
    expect(transformValue('acordeao-seta-a', 'rotate')).toBe('0deg')
    await fireEvent.press(screen.getByText('Pergunta A'))
    await advance(2000)
    expect(screen.getByText('Resposta A')).toBeTruthy()
    expect(transformValue('acordeao-seta-a', 'rotate')).toBe('180deg')
    const conteudo = screen.getByTestId('acordeao-conteudo-a')
    expect(conteudo.props.entering).toBeDefined()
    expect(conteudo.props.exiting).toBeDefined()
  })

  it('A7: nenhum estilo animado do conteúdo toca `height` (a LINHA é quem desliza, por layout animation)', async () => {
    await render(<Casa />)
    await fireEvent.press(screen.getByText('Pergunta A'))
    await advance(2000)
    expect(animated('acordeao-conteudo-a').height).toBeUndefined()
    // a linha leva a transição de layout (o Reanimated anima a posição das de baixo por transformação)
    expect(screen.getByTestId('acordeao-linha-a').props.layout).toBeDefined()
  })

  it('com movimento reduzido não há rotação nem deslocamento de linha, só o fade em base', async () => {
    mockReduced.mockReturnValue(true)
    await render(<Casa />)
    await fireEvent.press(screen.getByText('Pergunta A'))
    await advance(2000)
    expect(transformValue('acordeao-seta-a', 'rotate')).toBe('0deg')
    expect(screen.getByTestId('acordeao-linha-a').props.layout).toBeUndefined()
    expect(animated('acordeao-conteudo-a').height).toBeUndefined()
    expect(screen.getByText('Resposta A')).toBeTruthy()
  })

  it('off: sem os testIDs do caminho on', async () => {
    await render(<Casa motion="off" />)
    expect(screen.queryByTestId('acordeao-conteudo-a')).toBeNull()
  })
})
