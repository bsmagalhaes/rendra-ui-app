import { fireEvent, render, screen, within } from '@testing-library/react-native'
import { Pressable, StyleSheet, View } from 'react-native'
// M3 (veredito do Fable, validação das correções da Tarefa 21): mesmo mecanismo de
// button-group.test.tsx (ver comentário lá) para provar, sob o runtime real do
// react-native-css-interop, que o upgrade de variável (gatilho do crash de navegação) não
// dispara. `cssInterop`/`resetComponents` são escopados dentro do próprio teste (`try/finally`)
// porque o registro é global ao módulo e vaza para as outras suítes deste arquivo, que leem
// `className` como string literal.
import { registerCSS, resetComponents } from 'react-native-css-interop/test'
import { cssInterop } from 'react-native-css-interop'
import { BrandProvider } from '../../brand'
import { Tabs } from './tabs'
import { bordasSemCor } from '../../test-utils/bordas'
import { nodesWithCode } from '../../test-utils/rendra-code'

const items = [
  { value: 'pedidos', label: 'Pedidos', count: 3, content: 'Lista de pedidos.' },
  { value: 'clientes', label: 'Clientes', content: 'Lista de clientes.' },
]

// B6 (veredito do Opus): `fireEvent` exige um `TestInstance` de verdade (não um objeto
// `{ props }` avulso); a cópia de medição é `aria-hidden`, então a consulta por `testID`
// precisa de `includeHiddenElements: true`.
async function medir(testID: string, width: number) {
  await fireEvent(screen.getByTestId(testID, { includeHiddenElements: true }), 'layout', {
    nativeEvent: { layout: { width, height: 44, x: 0, y: 0 } },
  })
}

describe('Tabs', () => {
  it('aba inicial por defaultValue; onChange so dispara na troca', async () => {
    const onChange = jest.fn()
    const { getByRole, findByText } = await render(
      <BrandProvider>
        <Tabs items={items} defaultValue="clientes" onChange={onChange} accessibilityLabel="Secoes" />
      </BrandProvider>,
    )
    expect(await findByText('Lista de clientes.')).toBeTruthy()
    expect(onChange).not.toHaveBeenCalled()
    await fireEvent.press(getByRole('tab', { name: 'Pedidos 3' }))
    expect(onChange).toHaveBeenCalledWith('pedidos')
    expect(await findByText('Lista de pedidos.')).toBeTruthy()
  })

  it('disabled nao troca de aba', async () => {
    const disabledItems = [items[0], { ...items[1], disabled: true }]
    const { getByRole, queryByText } = await render(
      <BrandProvider><Tabs items={disabledItems} accessibilityLabel="Secoes" /></BrandProvider>,
    )
    const aba = getByRole('tab', { name: 'Clientes' })
    expect(aba.props.accessibilityState.disabled).toBe(true)
    await fireEvent.press(aba)
    expect(queryByText('Lista de clientes.')).toBeNull()
  })

  it('lista larga e conteiner estreito viram Select, sem abas', async () => {
    await render(
      <BrandProvider><Tabs items={items} accessibilityLabel="Secoes" testID="tabs" /></BrandProvider>,
    )
    await medir('tabs-medida', 500)
    await medir('tabs-container', 300)
    expect(await screen.findByRole('combobox')).toBeTruthy()
    expect(screen.queryAllByRole('tab')).toHaveLength(0)
  })

  it('lista cabe no conteiner: continua em abas', async () => {
    await render(
      <BrandProvider><Tabs items={items} accessibilityLabel="Secoes" testID="tabs" /></BrandProvider>,
    )
    await medir('tabs-medida', 200)
    await medir('tabs-container', 300)
    expect(screen.queryAllByRole('tab').length).toBeGreaterThan(0)
  })

  it('escolher uma opcao no Select do fallback muda o tabpanel', async () => {
    await render(
      <BrandProvider><Tabs items={items} accessibilityLabel="Secoes" testID="tabs" /></BrandProvider>,
    )
    await medir('tabs-medida', 500)
    await medir('tabs-container', 300)
    await fireEvent.press(await screen.findByRole('combobox'))
    await fireEvent.press(await screen.findByText('Clientes'))
    expect(await screen.findByText('Lista de clientes.')).toBeTruthy()
  })

  it('copia de medicao reproduz peso, pilula do count e icon da aba real (B1, veredito Fable)', async () => {
    // B1 (Fable, validacao da entrega): a copia de medicao (tabs-medida) so pode decidir abas x
    // Select certo se reproduzir a largura natural da aba real; antes desta correcao ela perdia o
    // peso da fonte (normal em vez de medium), a pilula do count (rounded-full/px-2/text-xs vira
    // um espaco solto em text-sm) e o icon inteiro, subestimando a largura em dezenas de pixels.
    const comIcone = [
      { value: 'pedidos', label: 'Pedidos', count: 3, icon: <View testID="icone-pedidos" />, content: 'Lista de pedidos.' },
      { value: 'clientes', label: 'Clientes', content: 'Lista de clientes.' },
    ]
    await render(
      <BrandProvider><Tabs items={comIcone} accessibilityLabel="Secoes" testID="tabs" /></BrandProvider>,
    )
    const abaReal = screen.getByRole('tab', { name: 'Pedidos 3' })
    const rotuloReal = within(abaReal).getByText('Pedidos')
    const medida = screen.getByTestId('tabs-medida', { includeHiddenElements: true })
    const rotuloCopia = within(medida).getByText('Pedidos', { includeHiddenElements: true })
    // `Text` (internal/text.tsx) grava `fontFamily` direto em `style` a partir de `weight`, sem
    // depender do cssInterop: comparavel sob Jest, ao contrario de className resolvido em Svg.
    expect(StyleSheet.flatten(rotuloCopia.props.style).fontFamily).toBe(
      StyleSheet.flatten(rotuloReal.props.style).fontFamily,
    )
    expect(within(medida).getByText('3', { includeHiddenElements: true })).toBeTruthy()
    expect(within(medida).getByTestId('icone-pedidos', { includeHiddenElements: true })).toBeTruthy()
  })

  it('variant pill aplica bg-muted p-1 na lista', async () => {
    const { getByTestId } = await render(
      <BrandProvider><Tabs items={items} variant="pill" accessibilityLabel="Secoes" testID="tabs" /></BrandProvider>,
    )
    expect(getByTestId('tabs-lista').props.className.split(' ')).toEqual(
      expect.arrayContaining(['bg-muted', 'p-1']),
    )
  })

  // M1/M2 (veredito do Fable, validação das correções da Tarefa 21): mesma causa raiz do crash
  // de ButtonGroup ("Couldn't find a navigation context" no nativo Android, achado do emulador,
  // Tarefa 20/21), mas o gatilho não é "consumir variável de tema" (`bg-card`/`bg-muted`
  // compilam sem `variables`); é `shadow-sm` *declarar* `--tw-shadow-color`. A aba pill não
  // selecionada não carregava nenhuma classe de sombra no primeiro render (`selected && 'bg-card
  // shadow-sm'` avaliava para `false`); ao ser selecionada depois, `shadow-sm` aparecia pela
  // primeira vez fora do primeiro render, disparando o upgrade de variável do
  // react-native-css-interop que deriva no crash de navegação (ver button-group.tsx). A aba não
  // selecionada precisa de uma classe de sombra desde o primeiro render (`shadow-none`, sem
  // sombra visível, também declara `--tw-shadow-color`). Não reproduz em Jest/RNTL (prova do
  // gatilho real sob Jest logo abaixo, M3).
  it('variant pill: aba não selecionada já carrega shadow-none no primeiro render (mesma causa raiz do crash de navegação do ButtonGroup)', async () => {
    const { getByRole } = await render(
      <BrandProvider><Tabs items={items} variant="pill" accessibilityLabel="Secoes" testID="tabs" /></BrandProvider>,
    )
    // "Clientes" não é a aba inicial (padrão é o primeiro item, "Pedidos"): não selecionada já no
    // primeiro render.
    const clientes = getByRole('tab', { name: 'Clientes' })
    const classes = clientes.props.className.split(' ')
    expect(classes).toContain('shadow-none')
    expect(classes).not.toContain('shadow-sm')
  })

  // M3 (veredito do Fable, validação das correções da Tarefa 21): mesma prova de
  // button-group.test.tsx (ver comentário do import no topo do arquivo), harness mínimo para
  // evitar o esgotamento de memória do worker do Jest que a árvore inteira do `Tabs`/
  // `BrandProvider` causa com o `cssInterop` registrado (confirmado nesta correção). Vermelho
  // com o padrão anterior a `41ba673`/`784b3c8` (`selected && 'bg-card shadow-sm'`, sem
  // `shadow-none`); verde com o padrão atual.
  it('variant pill: não dispara o aviso de upgrade do react-native-css-interop ao trocar a aba selecionada (prova do gatilho real, M3)', async () => {
    cssInterop(Pressable, { className: 'style' })
    registerCSS(`
      .shadow-sm { --tw-shadow-color: #000; shadow-color: var(--tw-shadow-color); }
      .shadow-none { --tw-shadow-color: #0000; shadow-color: var(--tw-shadow-color); }
    `)
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    try {
      function AbaPill({ selected }: { selected: boolean }) {
        return <Pressable testID="aba" className={selected ? 'shadow-sm' : 'shadow-none'} />
      }
      const { rerender } = await render(<AbaPill selected={false} />)
      await rerender(<AbaPill selected={true} />)
      const upgradeWarnings = logSpy.mock.calls.filter(
        ([message]) => typeof message === 'string' && message.startsWith('CssInterop upgrade warning'),
      )
      expect(upgradeWarnings).toHaveLength(0)
    } finally {
      logSpy.mockRestore()
      resetComponents()
    }
  })

  // M3 (veredito do Fable, validacao da entrega): a lista real em variant="pill" tem `p-1`
  // (tabs.tsx:32, "bg-muted p-1"), mas a copia de medicao so tinha `gap-1`, sem o `p-1`;
  // `listWidth` ficava 8px menor que a largura natural nessa variante (mesmo tipo de desvio do
  // B1 do veredito anterior, em escala menor), o que pode fazer a copia caber quando a lista
  // real nao caberia, atrasando a troca para o fallback Select.
  it('variant pill: a copia de medicao reproduz o p-1 da lista real (M3, veredito Fable)', async () => {
    const { getByTestId } = await render(
      <BrandProvider><Tabs items={items} variant="pill" accessibilityLabel="Secoes" testID="tabs" /></BrandProvider>,
    )
    const medida = getByTestId('tabs-medida', { includeHiddenElements: true })
    expect(medida.props.className.split(' ')).toContain('p-1')
  })
})

describe('Tabs: data-rendra por variante (item D12 do levantamento da Sincronizacao 1)', () => {
  it('variant line (padrao) carrega dataSet.rendra = ABA-001', async () => {
    const { container } = await render(
      <BrandProvider><Tabs items={items} accessibilityLabel="Secoes" /></BrandProvider>,
    )
    expect(nodesWithCode(container, 'ABA-001')).toHaveLength(1)
  })

  it('variant pill carrega dataSet.rendra = ABA-002', async () => {
    const { container } = await render(
      <BrandProvider><Tabs items={items} variant="pill" accessibilityLabel="Secoes" /></BrandProvider>,
    )
    expect(nodesWithCode(container, 'ABA-002')).toHaveLength(1)
  })
})


describe('Tabs: borda com a cor do token', () => {
  it('a variante line desenha a linha da lista com border-border (não preta)', async () => {
    const { container } = await render(
      <BrandProvider>
        <Tabs items={items} variant="line" accessibilityLabel="Secoes" />
      </BrandProvider>,
    )
    expect(bordasSemCor(container)).toEqual([])
    expect(container.queryAll((no) => String(no.props.className ?? '').split(' ').includes('border-border'))).not.toHaveLength(0)
  })
})


describe('Tabs: rolagem horizontal (overflow="scroll") e countLabel', () => {
  const quatro = [
    { value: 'ura', label: 'URA/IA', content: 'Conteúdo da URA.' },
    { value: 'fila', label: 'Fila', count: 1, content: 'Conteúdo da fila.' },
    { value: 'atendimento', label: 'Atendimento', count: 2, content: 'Conteúdo do atendimento.' },
    { value: 'encerrado', label: 'Encerrado', content: 'Conteúdo do encerrado.' },
  ]
  const naoLidas = (n: number) => (n === 1 ? '1 não lida' : `${n} não lidas`)

  it('com overflow="scroll" e contêiner estreito, as quatro abas continuam abas (sem Select) e a lista rola', async () => {
    const { container } = await render(
      <BrandProvider>
        <Tabs items={quatro} variant="pill" overflow="scroll" accessibilityLabel="Etapas" testID="tabs" />
      </BrandProvider>,
    )
    await medir('tabs-container', 120)
    expect(screen.queryByRole('combobox')).toBeNull()
    for (const nome of [/^URA\/IA$/, /^Fila/, /^Atendimento/, /^Encerrado$/]) {
      expect(screen.getByRole('tab', { name: nome })).toBeTruthy()
    }
    // a aba inicial (a primeira) está selecionada
    expect(screen.getByRole('tab', { name: 'URA/IA' }).props.accessibilityState.selected).toBe(true)
    // a lista fica dentro de um ScrollView horizontal, sem barra de rolagem
    const rolagens = container.queryAll((no) => no.props.horizontal === true)
    expect(rolagens).toHaveLength(1)
    expect(rolagens[0].props.showsHorizontalScrollIndicator).toBe(false)
    // sem a cópia de medição
    expect(screen.queryByTestId('tabs-medida', { includeHiddenElements: true })).toBeNull()
  })

  it('tocar na última aba, que só se alcança rolando, troca o painel', async () => {
    await render(
      <BrandProvider>
        <Tabs items={quatro} overflow="scroll" accessibilityLabel="Etapas" testID="tabs" />
      </BrandProvider>,
    )
    await medir('tabs-container', 120)
    await fireEvent.press(screen.getByRole('tab', { name: 'Encerrado' }))
    expect(await screen.findByText('Conteúdo do encerrado.')).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Encerrado' }).props.accessibilityState.selected).toBe(true)
  })

  it('variant line em scroll: a linha de baixo fica no contêiner da rolagem, não no conteúdo rolável', async () => {
    const { container } = await render(
      <BrandProvider>
        <Tabs items={quatro} variant="line" overflow="scroll" accessibilityLabel="Etapas" testID="tabs" />
      </BrandProvider>,
    )
    const [rolagem] = container.queryAll((no) => no.props.horizontal === true)
    const dentro = rolagem.queryAll((no) => String(no.props.className ?? '').split(' ').includes('border-b'))
    expect(dentro).toHaveLength(0)
    const fora = container.queryAll((no) => {
      const classes = String(no.props.className ?? '').split(' ')
      return classes.includes('border-b') && classes.includes('border-border')
    })
    expect(fora).toHaveLength(1)
  })

  it('o padrão não mudou: sem overflow, lista larga e contêiner estreito continuam virando Select', async () => {
    await render(
      <BrandProvider><Tabs items={quatro} accessibilityLabel="Etapas" testID="tabs" /></BrandProvider>,
    )
    await medir('tabs-medida', 500)
    await medir('tabs-container', 300)
    expect(await screen.findByRole('combobox')).toBeTruthy()
  })

  it('countLabel entra no nome acessível, com a regra de singular do chamador, e a pílula mostra só o número', async () => {
    await render(
      <BrandProvider>
        <Tabs
          items={quatro.map((i) => ({ ...i, countLabel: naoLidas }))}
          overflow="scroll"
          accessibilityLabel="Etapas"
          testID="tabs"
        />
      </BrandProvider>,
    )
    expect(screen.getByRole('tab', { name: 'Atendimento 2 não lidas' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Fila 1 não lida' })).toBeTruthy()
    // sem count, sem nome acessível próprio
    expect(screen.getByRole('tab', { name: 'URA/IA' })).toBeTruthy()
    expect(within(screen.getByRole('tab', { name: 'Atendimento 2 não lidas' })).getByText('2')).toBeTruthy()
  })

  it('sem countLabel o nome acessível continua "rótulo número"', async () => {
    await render(
      <BrandProvider><Tabs items={quatro} overflow="scroll" accessibilityLabel="Etapas" testID="tabs" /></BrandProvider>,
    )
    expect(screen.getByRole('tab', { name: 'Atendimento 2' })).toBeTruthy()
  })
})
