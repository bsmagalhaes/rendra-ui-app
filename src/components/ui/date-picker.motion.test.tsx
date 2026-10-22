import { fireEvent, render, screen } from '@testing-library/react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { allNodes } from '../../test-utils/motion-style'
import { DatePicker } from './date-picker'

jest.mock('../../lib/reduced-motion', () => ({ useReducedMotion: jest.fn(() => false) }))

function Casa({ motion = 'on' }: { motion?: 'on' | 'off' }) {
  return (
    <BrandProvider motion={motion}>
      <DatePicker label="Data" />
    </BrandProvider>
  )
}

describe('DatePicker em motion="on"', () => {
  it('A3: a troca de modo (dias, meses, anos) é frequente: o conteúdo troca na hora, sem entrada nem envoltório animado', async () => {
    await render(<Casa />)
    await fireEvent.press(await screen.findByLabelText('Data'))
    expect(await screen.findByLabelText(/^Mês:/)).toBeTruthy()
    expect(allNodes((n) => n.props.entering !== undefined)).toHaveLength(0)
    await fireEvent.press(screen.getByLabelText(/^Mês:/))
    expect(await screen.findByText('Selecione o mês')).toBeTruthy()
    await fireEvent.press(screen.getByLabelText('Voltar'))
    await fireEvent.press(screen.getByLabelText(/^Ano:/))
    expect(await screen.findByText('Selecione o ano')).toBeTruthy()
    expect(allNodes((n) => n.props.entering !== undefined)).toHaveLength(0)
  })

  it('off: sem o envoltório animado', async () => {
    await render(<Casa motion="off" />)
    await fireEvent.press(await screen.findByLabelText('Data'))
    expect(await screen.findByLabelText(/^Mês:/)).toBeTruthy()
    expect(screen.queryByTestId('datepicker-conteudo')).toBeNull()
  })
})

describe('DatePicker em off', () => {
  it('trocar dias por meses não remonta nada além do conteúdo (sem envoltório com key em off)', async () => {
    await render(<Casa motion="off" />)
    await fireEvent.press(await screen.findByLabelText('Data'))
    await fireEvent.press(await screen.findByLabelText(/^Mês:/))
    expect(await screen.findByText('Selecione o mês')).toBeTruthy()
    expect(screen.queryByTestId('datepicker-conteudo')).toBeNull()
  })
})
