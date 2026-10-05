import { useState } from 'react'
import { Text, View } from 'react-native'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { ThemeColorProbe } from '../../test-utils/theme-color-probe'
import { Input, type InputProps } from './input'
import * as useLookupModule from '../../hooks/use-lookup'
import { nodesWithCode } from '../../test-utils/rendra-code'

function ControlledInput(props: Omit<InputProps, 'value' | 'onChange'> & { initial?: string; sync?: boolean }) {
  const { initial = '', sync = true, ...rest } = props
  const [value, setValue] = useState(initial)
  return <Input {...rest} value={value} onChange={sync ? setValue : () => {}} />
}

describe('Input com máscara', () => {
  it('cpf: changeText chama onChange e onValueChange, e o campo mostra o texto mascarado', async () => {
    const onChange = jest.fn()
    const onValueChange = jest.fn()
    const { findByTestId } = await render(
      <BrandProvider>
        <Input testID="campo" mask="cpf" onChange={onChange} onValueChange={onValueChange} />
      </BrandProvider>,
    )
    const campo = await findByTestId('campo')
    await fireEvent.changeText(campo, '12345678901')
    expect(onChange).toHaveBeenCalledWith('123.456.789-01')
    expect(onValueChange).toHaveBeenCalledWith('12345678901', '123.456.789-01')
    // Efeito visível, não só a chamada: o próprio campo passa a exibir o texto mascarado.
    expect(campo.props.value).toBe('123.456.789-01')
  })

  it('currency: onCentsChange recebe o valor em centavos e o campo mostra o texto formatado', async () => {
    const onCentsChange = jest.fn()
    const { findByTestId } = await render(
      <BrandProvider>
        <Input testID="campo" mask="currency" onCentsChange={onCentsChange} />
      </BrandProvider>,
    )
    const campo = await findByTestId('campo')
    await fireEvent.changeText(campo, '125050')
    expect(onCentsChange).toHaveBeenCalledWith(12505000)
    expect(campo.props.value).toBe('R$ 125.050,00')
  })

  it('phone: ddi 351 troca para a máscara internacional, o gatilho mostra +351 e onDdiChange é chamado', async () => {
    const onDdiChange = jest.fn()
    const onChange = jest.fn()
    const { findByTestId, findByLabelText, findByText } = await render(
      <BrandProvider>
        <Input testID="campo" mask="phone" onChange={onChange} onDdiChange={onDdiChange} />
      </BrandProvider>,
    )
    const seletor = await findByLabelText(/Código do país \(DDI\)/)
    await fireEvent.press(seletor)
    const portugal = await findByText(/Portugal/)
    await fireEvent.press(portugal)
    await waitFor(() => expect(onDdiChange).toHaveBeenCalledWith('351'))
    expect(await findByText('+351')).toBeTruthy()
    const campo = await findByTestId('campo')
    await fireEvent.changeText(campo, '912345678')
    expect(onChange).toHaveBeenCalledWith('912 345 678')
    expect(campo.props.value).toBe('912 345 678')
  })

  it('phone: o gatilho do DDI mede min-h-touch min-w-touch (achado do Playwright, altura real 24px sem a classe)', async () => {
    // Causa raiz: o gatilho do DDI (`trigger` customizado do Select dentro do Input) fica
    // dentro do `<View className="relative">` do PickerPanel (sem altura própria), então
    // `h-full` não tem uma altura de referência para resolver a porcentagem e o navegador
    // usa a altura de conteúdo (~24px), abaixo do mínimo de toque. `npm run test:layout`
    // mediu isso via `boundingBox()` real (role=button índice 0, altura 24), o que o Jest
    // (sem layout de navegador) não conseguia flagrar; comprovado com a mesma técnica de
    // asserção de classe já usada em checkbox.test.tsx/switch.test.tsx.
    const { findByLabelText } = await render(
      <BrandProvider>
        <Input testID="campo" mask="phone" />
      </BrandProvider>,
    )
    const seletor = await findByLabelText(/Código do país \(DDI\)/)
    const classes = seletor.props.className.split(' ')
    expect(classes).toEqual(expect.arrayContaining(['min-h-touch', 'min-w-touch']))
  })

  it('achado do Playwright (test:a11y): o placeholder usa placeholderTextColor com --rendra-muted-foreground (contraste)', async () => {
    // axe (WCAG "color-contrast") reprovava o placeholder no export web real mesmo depois de
    // uma primeira tentativa via className (`placeholder:text-muted-foreground`): o axe-core
    // clona o elemento para medir a cor do placeholder, e o clone não herda a variável CSS
    // `--rendra-muted-foreground` (definida só no ancestral `BrandProvider`), então `var(--rendra-muted-foreground)`
    // fica inválida no clone e a regra cai para o cinza fixo do preflight do Tailwind
    // (#9ca3af), contraste 2.34 contra o fundo do campo, abaixo do mínimo de 4,5:1 (comprovado
    // por inspeção direta com @axe-core/playwright fora do Jest, script de depuração removido
    // antes do commit). Corrigido usando a prop `placeholderTextColor` (RN/react-native-web),
    // que vira um valor INLINE no próprio elemento (sobrevive ao clone do axe), resolvido a
    // partir de `themeColorString(themeVars, '--rendra-muted-foreground')` (o mesmo valor já aplicado
    // como variável CSS pelo `BrandProvider`, garantido 4,5:1 por `reach(...)`/`systemColorsLight`).
    const capturado = { cor: '' }
    const { findByTestId } = await render(
      <BrandProvider>
        <ThemeColorProbe token="--rendra-muted-foreground" onCapture={(cor) => { capturado.cor = cor }} />
        <Input testID="campo" mask="cpf" />
      </BrandProvider>,
    )
    const campo = await findByTestId('campo')
    await waitFor(() => expect(capturado.cor).not.toBe(''))
    expect(campo.props.placeholderTextColor).toBe(capturado.cor)
  })

  it('clearable chama onChange/onValueChange/onCentsChange e reseta o texto mascarado', async () => {
    // Desvio de execução: o plano pedia `jest.spyOn(campo, 'focus')` sobre o TestInstance devolvido por
    // `findByTestId`; esse objeto não é a instância nativa do componente (não tem métodos
    // imperativos como `.focus`, só `tag/type/props/children/parent`), então o spy nunca
    // teria o que espiar. A devolução de foco (`inputRef.current?.focus()`) continua em
    // input.tsx; o teste passou a conferir os efeitos visíveis que o RNTL 14 consegue medir.
    //
    // Achado 5 do veredito do Bloco A: no modo controlado, o texto exibido passou a
    // derivar só de `controlledValue`; por isso o "pai" aqui precisa de fato aceitar a
    // mudança (`ControlledInput` com `useState`) para o texto exibido resetar de verdade,
    // em vez de depender do objeto `masked` mutável (o bug que o achado 5 corrigiu).
    const onValueChange = jest.fn()
    const onCentsChange = jest.fn()
    const { findByTestId, findByLabelText } = await render(
      <BrandProvider>
        <ControlledInput
          testID="campo"
          mask="currency"
          initial="R$ 10,00"
          clearable
          onValueChange={onValueChange}
          onCentsChange={onCentsChange}
        />
      </BrandProvider>,
    )
    const campo = await findByTestId('campo')
    const limpar = await findByLabelText('Limpar campo')
    await fireEvent.press(limpar)
    expect(onValueChange).toHaveBeenCalledWith('', '')
    expect(onCentsChange).toHaveBeenCalledWith(null)
    // Efeito visível, não só a chamada: a máscara de moeda é `lazy: false` (sempre mostra
    // o prefixo "R$ ", mesmo vazia, src/lib/masks.ts), então limpar reseta o texto exibido
    // para o prefixo sem dígitos, não para uma string vazia.
    expect(campo.props.value).toBe('R$ ')
  })

  it('achado 5: no modo controlado, se o pai não aceitar a mudança, o texto exibido não fica com o valor digitado', async () => {
    const { findByTestId } = await render(
      <BrandProvider>
        <ControlledInput testID="campo" mask="cpf" initial="123.456.789-01" sync={false} />
      </BrandProvider>,
    )
    const campo = await findByTestId('campo')
    expect(campo.props.value).toBe('123.456.789-01')
    await fireEvent.changeText(campo, '99999999999')
    // O pai (onChange vazio, `sync={false}`) não aceitou a mudança: `value` continua
    // "123.456.789-01"; o campo não deve exibir o texto recém-digitado.
    expect(campo.props.value).toBe('123.456.789-01')
  })

  it('clearable num campo sem prefixo fixo (cpf) esvazia o texto e some o botão', async () => {
    const { findByTestId, findByLabelText, queryByLabelText } = await render(
      <BrandProvider>
        <Input testID="campo" mask="cpf" defaultValue="12345678901" clearable />
      </BrandProvider>,
    )
    expect(await findByLabelText('Limpar campo')).toBeTruthy()
    const campo = await findByTestId('campo')
    expect(campo.props.value).toBe('123.456.789-01')
    await fireEvent.press(await findByLabelText('Limpar campo'))
    expect(campo.props.value).toBe('')
    expect(queryByLabelText('Limpar campo')).toBeNull()
  })

  it('secureTextEntry alterna pelo botão mostrar/ocultar senha', async () => {
    const { findByLabelText, findByTestId } = await render(
      <BrandProvider>
        <Input testID="campo" secureTextEntry />
      </BrandProvider>,
    )
    const campo = await findByTestId('campo')
    expect(campo.props.secureTextEntry).toBe(true)
    const mostrar = await findByLabelText('Mostrar senha')
    expect(mostrar.props.accessibilityRole).toBe('button')
    await fireEvent.press(mostrar)
    expect(campo.props.secureTextEntry).toBe(false)
    expect(await findByLabelText('Ocultar senha')).toBeTruthy()
  })

  it('achado do Playwright (test:a11y): os botões "Limpar campo" e "Mostrar/Ocultar senha" têm accessibilityRole="button"', async () => {
    // axe (WCAG "aria-prohibited-attr") reprovava esses adornos no export web real: sem
    // accessibilityRole, o react-native-web renderiza um <div> sem role, e aria-label num
    // elemento sem role válido é proibido pela especificação ARIA.
    const { findByLabelText } = await render(
      <BrandProvider>
        <Input testID="campo" defaultValue="teste" clearable />
      </BrandProvider>,
    )
    const limpar = await findByLabelText('Limpar campo')
    expect(limpar.props.accessibilityRole).toBe('button')
  })

  it('achado 6: digitar antes e trocar o DDI depois reaplica os dígitos sob a máscara nova', async () => {
    const { findByTestId, findByLabelText, findByText } = await render(
      <BrandProvider>
        <Input testID="campo" mask="phone" />
      </BrandProvider>,
    )
    const campo = await findByTestId('campo')
    await fireEvent.changeText(campo, '11987654321')
    expect(campo.props.value).toBe('(11) 98765-4321')
    const seletor = await findByLabelText(/Código do país \(DDI\)/)
    await fireEvent.press(seletor)
    const portugal = await findByText(/Portugal/)
    await fireEvent.press(portugal)
    // Efeito visível, não só a chamada: os dígitos já digitados ("11987654321") são
    // reaplicados sob a máscara internacional, em vez de ficar parado no formato nacional
    // antigo (achado 6 do veredito do Bloco A).
    expect(campo.props.value).toBe('119 876 543 21')
  })

  it('onLookup é chamado quando useLookup resolve um valor não nulo', async () => {
    jest.spyOn(useLookupModule, 'useLookup').mockReturnValue(async () => ({ logradouro: 'Rua Teste', cidade: 'São Paulo', uf: 'SP' }))
    const onLookup = jest.fn()
    const { findByTestId } = await render(
      <BrandProvider>
        <Input testID="campo" mask="cep" onLookup={onLookup} />
      </BrandProvider>,
    )
    const campo = await findByTestId('campo')
    await fireEvent.changeText(campo, '01310100')
    await waitFor(() => expect(onLookup).toHaveBeenCalledWith({ logradouro: 'Rua Teste', cidade: 'São Paulo', uf: 'SP' }))
  })
})

describe('Input: data-rendra (item D7/B9 do levantamento da Sincronizacao 1)', () => {
  it('carrega dataSet.rendra = CAMP-001 na raiz', async () => {
    const { container } = await render(
      <BrandProvider>
        <Input testID="campo" />
      </BrandProvider>,
    )
    expect(nodesWithCode(container, 'CAMP-001')).toHaveLength(1)
  })
})

describe('Input: busca usa Spinner (item D10/F2 da Sincronizacao 1)', () => {
  it('buscando (cep) usa Spinner com label "Buscando..." e o codigo SPIN-001', async () => {
    jest.spyOn(useLookupModule, 'useLookup').mockReturnValue(
      () => new Promise(() => {}), // nunca resolve: mantem o estado "buscando" durante a asserção
    )
    const { container, findByText, findByTestId } = await render(
      <BrandProvider>
        <Input testID="campo" mask="cep" onLookup={jest.fn()} />
      </BrandProvider>,
    )
    const campo = await findByTestId('campo')
    await fireEvent.changeText(campo, '01310100')
    expect(await findByText('Buscando...')).toBeTruthy()
    expect(nodesWithCode(container, 'SPIN-001')).toHaveLength(1)
  })
})

describe('Input: units (item D7 do levantamento da Sincronizacao 1)', () => {
  const UNITS = [
    { id: 'percent', label: '%' },
    { id: 'currency', label: 'R$' },
  ]

  // Desvio de execucao (achado proprio): o plano original pedia `getByLabelText('R$')` para
  // selecionar a opcao no seletor aberto, mas as opcoes do Select (select.tsx:353-385) nao
  // recebem accessibilityLabel proprio (o nome acessivel vem so do texto visivel, conferido em
  // node_modules/@testing-library/react-native "computeAriaLabel": nao ha fallback para texto);
  // por isso a selecao usa findByText, no mesmo padrao ja usado pelo seletor de DDI
  // (input.test.tsx:53-58). O gatilho da unidade, por outro lado, tem accessibilityLabel proprio
  // (`Unidade: ...`, o mesmo padrao do gatilho do DDI), entao esse sim usa findByLabelText.
  it('mostra o gatilho com accessibilityLabel "Unidade: %"', async () => {
    const { findByLabelText } = await render(
      <BrandProvider>
        <Input units={UNITS} unit="percent" />
      </BrandProvider>,
    )
    expect(await findByLabelText('Unidade: %')).toBeTruthy()
  })

  it('trocar de unidade limpa o valor na tela, nao so a chamada de onChange (achado M4 do veredito do Fable)', async () => {
    const onUnitChange = jest.fn()
    const { findByLabelText, findByText, findByTestId } = await render(
      <BrandProvider>
        <ControlledInput testID="campo" units={UNITS} unit="percent" initial="10,00 %" onUnitChange={onUnitChange} />
      </BrandProvider>,
    )
    const campo = await findByTestId('campo')
    expect(campo.props.value).toBe('10,00 %')
    await fireEvent.press(await findByLabelText('Unidade: %'))
    await fireEvent.press(await findByText('R$'))
    expect(onUnitChange).toHaveBeenCalledWith('currency')
    // Efeito visível na tela, não só a chamada do mock: o próprio campo passa a mostrar o texto
    // limpo sob a máscara ainda ativa (a máscara percent é `lazy: false`, mesmo padrão do teste
    // "clearable" de moeda acima, que também espera o sufixo/prefixo fixo, não uma string vazia).
    expect((await findByTestId('campo')).props.value).toBe(' %')
  })

  it('percentMax limita a mascara da unidade percent (teto configuravel)', async () => {
    const { findByTestId } = await render(
      <BrandProvider>
        <Input testID="campo" units={[{ id: 'percent', label: '%' }]} unit="percent" percentMax={50} />
      </BrandProvider>,
    )
    const campo = await findByTestId('campo')
    await fireEvent.changeText(campo, '6')
    await fireEvent.changeText(campo, '60')
    // Teto 50: o digito que faria passar de 50 e rejeitado (mesmo motor de src/lib/masks.test.ts).
    expect(campo.props.value).toBe('6,00 %')
  })
})

describe('Input: variant secret (item D7 do levantamento da Sincronizacao 1)', () => {
  it('sem valor salvo, mostra o texto e o botao Trocar', async () => {
    const { findByText } = await render(
      <BrandProvider>
        <Input variant="secret" hasValue={false} onStartEdit={jest.fn()} />
      </BrandProvider>,
    )
    expect(await findByText('Nenhum valor salvo')).toBeTruthy()
    expect(await findByText('Trocar')).toBeTruthy()
  })

  it('com valor salvo, mostra o maskedHint e o botao Remover', async () => {
    const { findByText } = await render(
      <BrandProvider>
        <Input variant="secret" hasValue maskedHint="••••1234" onRemove={jest.fn()} onStartEdit={jest.fn()} />
      </BrandProvider>,
    )
    expect(await findByText('••••1234')).toBeTruthy()
    expect(await findByText('Remover')).toBeTruthy()
  })

  it('com valor salvo mas sem onRemove, nao mostra o botao Remover', async () => {
    const { queryByText } = await render(
      <BrandProvider>
        <Input variant="secret" hasValue maskedHint="••••1234" onStartEdit={jest.fn()} />
      </BrandProvider>,
    )
    expect(queryByText('Remover')).toBeNull()
  })

  it('sem maskedHint, usa o padrao "••••••••"', async () => {
    const { findByText } = await render(
      <BrandProvider>
        <Input variant="secret" hasValue onStartEdit={jest.fn()} />
      </BrandProvider>,
    )
    expect(await findByText('••••••••')).toBeTruthy()
  })

  it('em edicao, campo vazio com secureTextEntry e botao Cancelar, nunca mostra o valor salvo', async () => {
    const { getByText, getByDisplayValue, findByTestId } = await render(
      <BrandProvider>
        <Input testID="campo" variant="secret" isEditing onCancelEdit={jest.fn()} />
      </BrandProvider>,
    )
    expect(getByText('Cancelar')).toBeTruthy()
    expect(() => getByDisplayValue(/./)).toThrow()
    expect((await findByTestId('campo')).props.secureTextEntry).toBe(true)
  })

  it('em edicao, mesmo com value controlado pelo consumidor, nunca mostra o valor salvo (achado B2 do veredito do Fable)', async () => {
    const { queryByDisplayValue } = await render(
      <BrandProvider>
        <Input variant="secret" isEditing value="segredo-salvo" onChange={jest.fn()} onCancelEdit={jest.fn()} />
      </BrandProvider>,
    )
    expect(queryByDisplayValue('segredo-salvo')).toBeNull()
  })

  it('em edicao, mesmo com defaultValue do consumidor, nunca mostra o valor salvo (achado B2 do veredito do Fable)', async () => {
    const { queryByDisplayValue } = await render(
      <BrandProvider>
        <Input variant="secret" isEditing defaultValue="segredo-salvo" onCancelEdit={jest.fn()} />
      </BrandProvider>,
    )
    expect(queryByDisplayValue('segredo-salvo')).toBeNull()
  })

  it('em edicao, digitar atualiza o campo na tela e chama onChange/onValueChange (achado M8 do veredito do Fable)', async () => {
    const onChange = jest.fn()
    const onValueChange = jest.fn()
    const { findByTestId } = await render(
      <BrandProvider>
        <Input testID="campo" variant="secret" isEditing onChange={onChange} onValueChange={onValueChange} onCancelEdit={jest.fn()} />
      </BrandProvider>,
    )
    const campo = await findByTestId('campo')
    await fireEvent.changeText(campo, 'novo-valor')
    expect(campo.props.value).toBe('novo-valor')
    expect(onChange).toHaveBeenCalledWith('novo-valor')
    expect(onValueChange).toHaveBeenCalledWith('novo-valor', 'novo-valor')
  })

  it('cancelar a edicao e abrir de novo comeca vazio, mesmo depois de ter digitado antes (achado M8 do veredito do Fable)', async () => {
    const { findByTestId, rerender } = await render(
      <BrandProvider>
        <Input testID="campo" variant="secret" isEditing onCancelEdit={jest.fn()} />
      </BrandProvider>,
    )
    const campo = await findByTestId('campo')
    await fireEvent.changeText(campo, 'rascunho')
    expect((await findByTestId('campo')).props.value).toBe('rascunho')
    await rerender(
      <BrandProvider>
        <Input testID="campo" variant="secret" hasValue maskedHint="••••1234" onStartEdit={jest.fn()} />
      </BrandProvider>,
    )
    await rerender(
      <BrandProvider>
        <Input testID="campo" variant="secret" isEditing onCancelEdit={jest.fn()} />
      </BrandProvider>,
    )
    expect((await findByTestId('campo')).props.value).toBe('')
  })

  it('clearable em edicao nao aparece so porque o consumidor passou value do valor salvo (observacao 1 do Fable)', async () => {
    const { findByTestId, queryByLabelText } = await render(
      <BrandProvider>
        <Input testID="campo" variant="secret" isEditing clearable value="segredo-salvo" onChange={jest.fn()} onCancelEdit={jest.fn()} />
      </BrandProvider>,
    )
    expect((await findByTestId('campo')).props.value).toBe('')
    expect(queryByLabelText('Limpar campo')).toBeNull()
  })

  it('clearable em edicao aparece so depois de digitar e Limpar campo esvazia o rascunho e avisa o consumidor', async () => {
    const onChange = jest.fn()
    const onValueChange = jest.fn()
    const { findByTestId, findByLabelText, queryByLabelText } = await render(
      <BrandProvider>
        <Input testID="campo" variant="secret" isEditing clearable onChange={onChange} onValueChange={onValueChange} onCancelEdit={jest.fn()} />
      </BrandProvider>,
    )
    const campo = await findByTestId('campo')
    expect(queryByLabelText('Limpar campo')).toBeNull()
    await fireEvent.changeText(campo, 'novo-valor')
    await fireEvent.press(await findByLabelText('Limpar campo'))
    expect((await findByTestId('campo')).props.value).toBe('')
    expect(queryByLabelText('Limpar campo')).toBeNull()
    expect(onChange).toHaveBeenLastCalledWith('')
    expect(onValueChange).toHaveBeenLastCalledWith('', '')
  })

  it('Trocar chama onStartEdit e Remover chama onRemove', async () => {
    const onStartEdit = jest.fn()
    const onRemove = jest.fn()
    const { findByText } = await render(
      <BrandProvider>
        <Input variant="secret" hasValue maskedHint="••••1234" onStartEdit={onStartEdit} onRemove={onRemove} />
      </BrandProvider>,
    )
    await fireEvent.press(await findByText('Trocar'))
    expect(onStartEdit).toHaveBeenCalledTimes(1)
    await fireEvent.press(await findByText('Remover'))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })
})


describe('Input com botão de ação à direita (trailingAction)', () => {
  function CampoComFiltro({ filtros = 0 }: { filtros?: number }) {
    const [aberto, setAberto] = useState(false)
    return (
      <BrandProvider>
        <ControlledInput
          testID="campo"
          clearable
          initial="ana"
          trailingAction={{
            icon: <View testID="icone-filtro" />,
            accessibilityLabel: filtros > 0 ? `Filtros, ${filtros} ${filtros === 1 ? 'ativo' : 'ativos'}` : 'Filtros',
            onPress: () => setAberto(true),
            badge: filtros,
          }}
        />
        {aberto ? <Text>Filtros abertos</Text> : null}
      </BrandProvider>
    )
  }

  it('o botão fica dentro da moldura do campo, com o nome informado, e tocar nele produz efeito visível', async () => {
    const { findByRole, findByText, container } = await render(<CampoComFiltro filtros={2} />)
    const botao = await findByRole('button', { name: 'Filtros, 2 ativos' })
    // dentro da moldura CAMP-001, não solto ao lado
    const [moldura] = nodesWithCode(container, 'CAMP-001')
    expect(moldura.queryAll((no) => no === botao)).toHaveLength(1)
    await fireEvent.press(botao)
    expect(await findByText('Filtros abertos')).toBeTruthy()
  })

  it('o selo mostra o número de filtros e some com 0 ou sem a prop', async () => {
    const { findByText, rerender, queryByText, findByRole } = await render(<CampoComFiltro filtros={2} />)
    expect(await findByText('2')).toBeTruthy()
    await rerender(<CampoComFiltro filtros={0} />)
    expect(queryByText('2')).toBeNull()
    expect(queryByText('0')).toBeNull()
    expect(await findByRole('button', { name: 'Filtros' })).toBeTruthy()
  })

  it('com um filtro, o nome acessível diz "1 ativo" (singular)', async () => {
    const { findByRole } = await render(<CampoComFiltro filtros={1} />)
    expect(await findByRole('button', { name: 'Filtros, 1 ativo' })).toBeTruthy()
  })

  it('com clearable e valor digitado, "Limpar campo" vem antes da ação e os dois existem', async () => {
    const { findByRole, findAllByRole } = await render(<CampoComFiltro filtros={1} />)
    expect(await findByRole('button', { name: 'Limpar campo' })).toBeTruthy()
    const nomes = (await findAllByRole('button')).map((b) => b.props.accessibilityLabel)
    expect(nomes.indexOf('Limpar campo')).toBeGreaterThanOrEqual(0)
    expect(nomes.indexOf('Limpar campo')).toBeLessThan(nomes.indexOf('Filtros, 1 ativo'))
  })

  it('o botão mantém o alvo de 44 px (size-control-sm) e o selo não o reduz', async () => {
    const { findByRole } = await render(<CampoComFiltro filtros={3} />)
    const botao = await findByRole('button', { name: 'Filtros, 3 ativos' })
    expect(botao.props.className.split(' ')).toEqual(expect.arrayContaining(['size-control-sm', 'shrink-0']))
  })

  it('desabilitado, o botão de ação não responde ao toque', async () => {
    const onPress = jest.fn()
    const { findByRole } = await render(
      <BrandProvider>
        <Input
          disabled
          trailingAction={{ icon: <View />, accessibilityLabel: 'Filtros', onPress }}
        />
      </BrandProvider>,
    )
    const botao = await findByRole('button', { name: 'Filtros' })
    await fireEvent.press(botao)
    expect(onPress).not.toHaveBeenCalled()
  })
})
