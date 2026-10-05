import { useState } from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { Checkbox, CheckboxGroup, type CheckboxGroupOption } from './checkbox'
import { nodesWithCode } from '../../test-utils/rendra-code'
import { bordasSemCor, classesDo } from '../../test-utils/bordas'

function ControlledCheckbox() {
  const [checked, setChecked] = useState(false)
  return <Checkbox label="Aceito os termos" checked={checked} onCheckedChange={setChecked} />
}

describe('Checkbox', () => {
  it('checked true/false e onCheckedChange, com efeito visível de verdade no papel', async () => {
    // Achado 2 do veredito do Bloco A: `checked={false}` fixo (não controlado por
    // `useState`) fazia o teste conferir só a chamada de `onCheckedChange`; envolver num
    // componente controlado (mesmo padrão `ControlledGroup` já usado abaixo) afirma o
    // efeito visível (accessibilityState.checked) depois do toque.
    const { findByRole } = await render(
      <BrandProvider>
        <ControlledCheckbox />
      </BrandProvider>,
    )
    const caixa = await findByRole('checkbox')
    expect(caixa.props.accessibilityState.checked).toBe(false)
    await fireEvent.press(caixa)
    expect(caixa.props.accessibilityState.checked).toBe(true)
  })

  it('achado 9: hitSlop de reforço, igual ao Switch, nas duas variantes (com e sem rótulo)', async () => {
    const { findByRole, rerender } = await render(
      <BrandProvider>
        <Checkbox accessibilityLabel="Marcar item" onCheckedChange={() => {}} />
      </BrandProvider>,
    )
    expect((await findByRole('checkbox')).props.hitSlop).toBeTruthy()
    await rerender(
      <BrandProvider>
        <Checkbox label="Aceito os termos" onCheckedChange={() => {}} />
      </BrandProvider>,
    )
    expect((await findByRole('checkbox')).props.hitSlop).toBeTruthy()
  })

  it('indeterminate reflete accessibilityState.checked "mixed"', async () => {
    const { findByRole } = await render(
      <BrandProvider>
        <Checkbox label="Selecionar todos" checked="indeterminate" onCheckedChange={() => {}} />
      </BrandProvider>,
    )
    const caixa = await findByRole('checkbox')
    expect(caixa.props.accessibilityState.checked).toBe('mixed')
  })

  it('disabled não chama onCheckedChange e reflete accessibilityState.disabled', async () => {
    const onCheckedChange = jest.fn()
    const { findByRole } = await render(
      <BrandProvider>
        <Checkbox label="Indisponível" disabled onCheckedChange={onCheckedChange} />
      </BrandProvider>,
    )
    const caixa = await findByRole('checkbox')
    expect(caixa.props.accessibilityState.disabled).toBe(true)
    await fireEvent.press(caixa)
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  it('sem rótulo, o Pressable com o papel mede min-h-touch min-w-touch', async () => {
    const { findByRole } = await render(
      <BrandProvider>
        <Checkbox accessibilityLabel="Marcar item" onCheckedChange={() => {}} />
      </BrandProvider>,
    )
    const caixa = await findByRole('checkbox')
    const classes = caixa.props.className.split(' ')
    expect(classes).toEqual(expect.arrayContaining(['min-h-touch', 'min-w-touch']))
  })

  it('com rótulo, o elemento com o papel checkbox é o Pressable da linha inteira e contém min-h-touch', async () => {
    const { findByRole } = await render(
      <BrandProvider>
        <Checkbox label="Aceito os termos" checked={false} onCheckedChange={() => {}} />
      </BrandProvider>,
    )
    const caixa = await findByRole('checkbox')
    expect(caixa.props.className.split(' ')).toContain('min-h-touch')
    expect(caixa.props.accessibilityLabel).toBe('Aceito os termos')
  })

  it('defaultChecked inicia marcado sem checked controlado, e o toque desmarca de verdade', async () => {
    const onCheckedChange = jest.fn()
    const { findByRole } = await render(
      <BrandProvider>
        <Checkbox label="Aceito os termos" defaultChecked onCheckedChange={onCheckedChange} />
      </BrandProvider>,
    )
    const caixa = await findByRole('checkbox')
    expect(caixa.props.accessibilityState.checked).toBe(true)
    await fireEvent.press(caixa)
    expect(onCheckedChange).toHaveBeenCalledWith(false)
    // Efeito visível, não só a chamada: sem `checked` controlado de fora, o próprio
    // Checkbox atualiza o estado interno e o papel reflete o novo valor.
    expect(caixa.props.accessibilityState.checked).toBe(false)
  })
})

describe('CheckboxGroup', () => {
  const options: CheckboxGroupOption[] = [
    { value: 'a', label: 'Alfa' },
    { value: 'b', label: 'Beta', disabled: true },
    { value: 'c', label: 'Gama' },
  ]

  function ControlledGroup({ selectAll }: { selectAll?: boolean }) {
    const [value, setValue] = useState<string[]>([])
    return <CheckboxGroup options={options} value={value} onChange={setValue} selectAll={selectAll} />
  }

  it('"Selecionar todos" marca todos os habilitados, ignora desabilitados e reflete no papel de cada item', async () => {
    const { findByText, findAllByRole } = await render(
      <BrandProvider>
        <ControlledGroup selectAll />
      </BrandProvider>,
    )
    await fireEvent.press(await findByText('Selecionar todos'))
    const caixas = await findAllByRole('checkbox')
    // caixas[0] é "Selecionar todos"; caixas[1..3] são Alfa, Beta (desabilitada), Gama.
    expect(caixas[1].props.accessibilityState.checked).toBe(true)
    expect(caixas[2].props.accessibilityState.checked).toBe(false)
    expect(caixas[3].props.accessibilityState.checked).toBe(true)
  })

  it('alterna de volta para vazio quando já está tudo selecionado', async () => {
    const { findByText, findAllByRole } = await render(
      <BrandProvider>
        <ControlledGroup selectAll />
      </BrandProvider>,
    )
    const todos = await findByText('Selecionar todos')
    await fireEvent.press(todos)
    await fireEvent.press(todos)
    const caixas = await findAllByRole('checkbox')
    expect(caixas[1].props.accessibilityState.checked).toBe(false)
    expect(caixas[3].props.accessibilityState.checked).toBe(false)
  })
})

describe('Checkbox/CheckboxGroup: data-rendra (item D12 do levantamento da Sincronizacao 1)', () => {
  it('Checkbox carrega dataSet.rendra = CHK-001', async () => {
    const { container } = await render(
      <BrandProvider>
        <Checkbox label="Aceito" />
      </BrandProvider>,
    )
    expect(nodesWithCode(container, 'CHK-001')).toHaveLength(1)
  })

  it('CheckboxGroup carrega dataSet.rendra = CHK-002', async () => {
    const options: CheckboxGroupOption[] = [{ value: 'a', label: 'A' }]
    const { container } = await render(
      <BrandProvider>
        <CheckboxGroup options={options} />
      </BrandProvider>,
    )
    expect(nodesWithCode(container, 'CHK-002')).toHaveLength(1)
  })
})


describe('CheckboxGroup: borda com a cor do token', () => {
  it('a linha de "Selecionar todos" usa border-border (não preta)', async () => {
    const { container } = await render(
      <BrandProvider>
        <CheckboxGroup options={[{ value: 'a', label: 'A' }]} value={[]} onChange={() => {}} selectAll />
      </BrandProvider>,
    )
    expect(bordasSemCor(container)).toEqual([])
    const [linha] = container.queryAll((no) => classesDo(no).includes('border-b'))
    expect(linha).toBeDefined()
    expect(classesDo(linha)).toContain('border-border')
  })
})
