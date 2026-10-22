import { render, screen, fireEvent } from '@testing-library/react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { Sheet } from '../ui/sheet'
import { Select } from '../ui/select'
import { DatePicker } from '../ui/date-picker'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Button } from '../ui/button'
import { advance, transformValue } from '../../test-utils/motion-style'

jest.mock('../../lib/reduced-motion', () => ({ useReducedMotion: jest.fn(() => false) }))

async function settled(testID: string) {
  await advance(2000)
  expect(transformValue(testID, 'translateY')).toBe(0)
}

beforeEach(() => jest.useFakeTimers())
afterEach(() => jest.useRealTimers())

describe('folhas dependentes herdam o preset da BottomSheet em on', () => {
  it('Sheet usa a folha com spring', async () => {
    await render(
      <BrandProvider motion="on">
        <Sheet open onOpenChange={() => {}} title="Filtros" testID="dep-sheet">
          <></>
        </Sheet>
      </BrandProvider>,
    )
    await settled('dep-sheet-sheet')
    expect(screen.getByTestId('dep-sheet-backdrop')).toBeTruthy()
  })

  it('Select abre a folha com o preset', async () => {
    await render(
      <BrandProvider motion="on">
        <Select options={[{ value: 'a', label: 'Uberlândia' }]} placeholder="Cidade" testID="dep-select" onChange={() => {}} />
      </BrandProvider>,
    )
    await fireEvent.press(await screen.findByRole('combobox'))
    expect(await screen.findByText('Uberlândia')).toBeTruthy()
    await settled('dep-select-sheet')
  })

  it('DatePicker abre a folha com o preset', async () => {
    await render(
      <BrandProvider motion="on">
        <DatePicker label="Data" testID="dep-date" />
      </BrandProvider>,
    )
    await fireEvent.press(await screen.findByLabelText('Data'))
    await settled('dep-date-sheet')
  })

  it('DropdownMenu abre a folha com os itens', async () => {
    await render(
      <BrandProvider motion="on">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button accessibilityLabel="Abrir menu">Abrir</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent accessibilityLabel="Ações">
            <DropdownMenuItem onSelect={() => {}}>Editar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </BrandProvider>,
    )
    await fireEvent.press(screen.getByLabelText('Abrir menu'))
    expect(await screen.findByText('Editar')).toBeTruthy()
  })
})
