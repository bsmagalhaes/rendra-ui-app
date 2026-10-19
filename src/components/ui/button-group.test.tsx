import { render, fireEvent } from '@testing-library/react-native'
import { Pressable } from 'react-native'
// M3 (veredito do Fable, validação das correções da Tarefa 21): `registerCSS` roda o mesmo
// runtime nativo (`react-native-css-interop/src/runtime/native/*`) usado no aparelho, permitindo
// provar sob Jest que o upgrade de variável (o próprio gatilho do crash de navegação) não dispara,
// sem depender de comparar classNames. `cssInterop`/`resetComponents` explícitos são necessários
// porque este projeto não registra os componentes-base do React Native com o interop sob Jest (o
// app real ganha esse registro pelo import automático de
// `react-native-css-interop/dist/runtime/components` que o bundler injeta no entrypoint; sob Jest
// esse import nunca acontece, então sem `cssInterop(Pressable, ...)` o `Pressable` nunca passa por
// `renderComponent`, e o teste ficaria sempre verde, inclusive contra o código anterior ao
// `784b3c8` — confirmado nesta correção); o registro é desfeito com `resetComponents()` ao final
// do teste (dentro de `try/finally`) porque é global ao módulo `react-native-css-interop`, e sem
// desfazer quebra as outras suítes deste arquivo (que leem `className` como string literal,
// confirmado nesta correção: sem o `resetComponents`, 3 testes passam a falhar com
// "Cannot read properties of undefined (reading 'split')", porque o `Pressable` registrado passa
// a resolver `className` em `style` para todo teste do arquivo, não só o M3).
import { registerCSS, resetComponents } from 'react-native-css-interop/test'
import { cssInterop } from 'react-native-css-interop'
import { BrandProvider } from '../../brand/brand-provider'
import { ButtonGroup } from './button-group'
import { Button } from './button'
import { bordasSemCor } from '../../test-utils/bordas'
import { nodesWithCode } from '../../test-utils/rendra-code'

const options = [
  { value: 'dia', label: 'Dia' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês', disabled: true },
]

describe('ButtonGroup: modo segmentado', () => {
  it('marca a opção ativa e chama onChange ao tocar em outra', async () => {
    const onChange = jest.fn()
    const { findByText } = await render(
      <BrandProvider>
        <ButtonGroup options={options} value="dia" onChange={onChange} />
      </BrandProvider>,
    )
    const semana = await findByText('Semana')
    await fireEvent.press(semana)
    expect(onChange).toHaveBeenCalledWith('semana')
  })

  it('opção desabilitada não chama onChange', async () => {
    const onChange = jest.fn()
    const { findByText } = await render(
      <BrandProvider>
        <ButtonGroup options={options} value="dia" onChange={onChange} />
      </BrandProvider>,
    )
    const mes = await findByText('Mês')
    await fireEvent.press(mes)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('size sm usa h-control-sm (44px), diferente de md', async () => {
    const { findAllByRole } = await render(
      <BrandProvider>
        <ButtonGroup options={options} value="dia" onChange={() => {}} size="sm" />
      </BrandProvider>,
    )
    const radios = await findAllByRole('radio')
    expect(radios[0].props.className.split(' ')).toContain('h-control-sm')
  })

  // M1/M2 (veredito do Fable, validação das correções da Tarefa 21): causa raiz do crash
  // "Couldn't find a navigation context" no nativo Android (achado do emulador, Tarefa 20) não é
  // "consumir variável de tema" (`bg-card`/`bg-muted` compilam sem `variables` no CSS nativo); é
  // a classe `shadow-sm` *declarar* `--tw-shadow-color`. A opção desmarcada não carregava nenhuma
  // classe de sombra no primeiro render (className computada como só estrutura + ''); ao ser
  // marcada depois, `shadow-sm` (que declara essa variável) aparecia pela primeira vez fora do
  // primeiro render. O react-native-css-interop trata isso como upgrade para consumidor de
  // variável e, em modo dev, loga um aviso sobre esse upgrade serializando as props da árvore
  // (`Object.entries` recursivo em render-component.tsx); esse `Object.entries` aciona os getters
  // do valor padrão (não conectado) do contexto de navegação do Expo Router presente na árvore, e
  // cada um lança "Couldn't find a navigation context" por design. Não reproduz em Jest/RNTL nem
  // em Playwright/RNW (achado do relatório do emulador, só aparece no runtime nativo Fabric
  // real). A opção desmarcada precisa de uma classe de sombra desde o primeiro render
  // (`shadow-none`, sem sombra visível, também declara `--tw-shadow-color`) e `bg-muted` (mesma
  // cor do fundo do grupo, visualmente idêntica ao vazio de antes).
  it('opção desmarcada já carrega shadow-none e bg-muted no primeiro render (evita upgrade de variável CSS fora do mount, causa raiz do crash de navegação no nativo)', async () => {
    const { findAllByRole } = await render(
      <BrandProvider>
        <ButtonGroup options={options} value="dia" onChange={() => {}} />
      </BrandProvider>,
    )
    const radios = await findAllByRole('radio')
    // radios[1] = "semana", não é o valor inicial ("dia"): está desmarcada já no primeiro render.
    const classes = radios[1].props.className.split(' ')
    expect(classes).toContain('shadow-none')
    expect(classes).toContain('bg-muted')
    expect(classes).not.toContain('shadow-sm')
  })

  // M3 (veredito do Fable): a melhor prova possível sob Jest não é a lista de classes, é o
  // próprio aviso de upgrade do react-native-css-interop (o gatilho real do crash), reproduzido
  // pelo mesmo runtime nativo que o pacote usa no aparelho (`react-native-css-interop/test`,
  // `registerCSS` compila CSS pelo mesmo `css-to-rn` e injeta no runtime real). Harness mínimo
  // (um `Pressable` isolado com exatamente as classes da opção do `ButtonGroup`, sem
  // `BrandProvider`/`ButtonGroup` inteiros): renderizar a árvore real do componente com o
  // registro de `cssInterop` ativo (necessário para o mecanismo disparar, ver import acima)
  // faz o `Object.entries` recursivo de `stringify` (render-component.tsx) percorrer toda a
  // árvore de props de cada instância (`BrandProvider`, ícones, tokens de tema), e esgota a
  // memória do worker do Jest (`JavaScript heap out of memory`, confirmado nesta correção); o
  // harness mínimo evita essa árvore grande e ainda prova o gatilho exato (mesmas classes,
  // mesma transição condicional). Vermelho com o padrão anterior a `784b3c8`
  // (`checked ? 'shadow-sm' : ''`, confirmado manualmente nesta correção); verde com o padrão
  // atual (`checked ? 'shadow-sm' : 'shadow-none'`, sempre uma classe que declara variável).
  it('não dispara o aviso de upgrade do react-native-css-interop ao trocar a opção marcada (prova do gatilho real, M3)', async () => {
    cssInterop(Pressable, { className: 'style' })
    registerCSS(`
      .shadow-sm { --tw-shadow-color: #000; shadow-color: var(--tw-shadow-color); }
      .shadow-none { --tw-shadow-color: #0000; shadow-color: var(--tw-shadow-color); }
    `)
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    try {
      function OpcaoDoGrupo({ checked }: { checked: boolean }) {
        return <Pressable testID="opcao" className={checked ? 'shadow-sm' : 'shadow-none'} />
      }
      const { rerender } = await render(<OpcaoDoGrupo checked={false} />)
      await rerender(<OpcaoDoGrupo checked={true} />)
      const upgradeWarnings = logSpy.mock.calls.filter(
        ([message]) => typeof message === 'string' && message.startsWith('CssInterop upgrade warning'),
      )
      expect(upgradeWarnings).toHaveLength(0)
    } finally {
      logSpy.mockRestore()
      // Desfaz o registro do Pressable (ver comentário do import acima): sem isso, as outras
      // suítes deste arquivo (que leem `className` como string literal) passam a falhar.
      resetComponents()
    }
  })
})

describe('ButtonGroup: modo grupo', () => {
  it('arredonda só o primeiro e o último filho, sem sombra', async () => {
    const { findAllByRole } = await render(
      <BrandProvider>
        <ButtonGroup accessibilityLabel="Ações do registro">
          <Button onPress={() => {}}>Editar</Button>
          <Button onPress={() => {}}>Excluir</Button>
        </ButtonGroup>
      </BrandProvider>,
    )
    const buttons = await findAllByRole('button')
    expect(buttons[0].props.className.split(' ')).toEqual(
      expect.arrayContaining(['rounded-l-control', 'rounded-r-none']),
    )
    expect(buttons[1].props.className.split(' ')).toEqual(
      expect.arrayContaining(['rounded-r-control', 'rounded-l-none', 'border-l-0']),
    )
  })
})

describe('ButtonGroup: orientation', () => {
  const classes = (no: { props: Record<string, unknown> }) => String(no.props.className).split(' ')

  it('horizontal explícito é igual ao padrão: contêiner flex-row e filhos com a lista de hoje', async () => {
    const montar = (orientation?: 'horizontal') => (
      <BrandProvider>
        <ButtonGroup accessibilityLabel="Ações" fullWidth orientation={orientation}>
          <Button onPress={() => {}}>Editar</Button>
          <Button onPress={() => {}}>Excluir</Button>
        </ButtonGroup>
      </BrandProvider>
    )
    const padrao = await render(montar())
    const filhosPadrao = (await padrao.findAllByRole('button')).map(classes)
    const contPadrao = classes(nodesWithCode(padrao.container, 'BTNG-001')[0]!)
    await padrao.unmount()
    const explicito = await render(montar('horizontal'))
    expect((await explicito.findAllByRole('button')).map(classes)).toEqual(filhosPadrao)
    expect(classes(nodesWithCode(explicito.container, 'BTNG-001')[0]!)).toEqual(contPadrao)
    expect(contPadrao).toContain('flex-row')
    expect(contPadrao).not.toContain('flex-col')
  })

  it('vertical, modo grupo: flex-col, cantos de cima e de baixo, border-t-0 e w-full sem flex-1', async () => {
    const { findAllByRole, container } = await render(
      <BrandProvider>
        <ButtonGroup accessibilityLabel="Ações" orientation="vertical" fullWidth>
          <Button onPress={() => {}}>Editar</Button>
          <Button onPress={() => {}}>Duplicar</Button>
          <Button onPress={() => {}}>Excluir</Button>
        </ButtonGroup>
      </BrandProvider>,
    )
    const cont = classes(nodesWithCode(container, 'BTNG-001')[0]!)
    expect(cont).toContain('flex-col')
    expect(cont).not.toContain('flex-row')
    const [primeiro, meio, ultimo] = (await findAllByRole('button')).map(classes) as [string[], string[], string[]]
    expect(primeiro).toEqual(expect.arrayContaining(['rounded-t-control', 'rounded-b-none', 'w-full']))
    expect(primeiro).not.toContain('border-t-0')
    expect(meio).toEqual(expect.arrayContaining(['rounded-none', 'border-t-0', 'w-full']))
    expect(ultimo).toEqual(expect.arrayContaining(['rounded-b-control', 'rounded-t-none', 'border-t-0', 'w-full']))
    for (const filho of [primeiro, meio, ultimo]) {
      expect(filho).not.toContain('flex-1')
      expect(filho).not.toContain('border-l-0')
    }
  })

  it('vertical com um filho só: cantos inteiros e nada que esmague a altura (sem flex-1)', async () => {
    const { findAllByRole } = await render(
      <BrandProvider>
        <ButtonGroup accessibilityLabel="Ações" orientation="vertical" fullWidth>
          <Button onPress={() => {}}>Editar</Button>
        </ButtonGroup>
      </BrandProvider>,
    )
    const unico = classes((await findAllByRole('button'))[0]!)
    expect(unico).toContain('rounded-control')
    expect(unico).not.toContain('flex-1')
    expect(unico).not.toContain('rounded-b-none')
  })

  it('vertical, modo segmentado: contêiner flex-col sem flex-wrap, opções w-full sem flex-1 e as duas classes de sombra desde o primeiro render', async () => {
    const { findByRole, container } = await render(
      <BrandProvider>
        <ButtonGroup options={options} value="dia" onChange={() => {}} orientation="vertical" accessibilityLabel="Período" />
      </BrandProvider>,
    )
    const cont = classes(nodesWithCode(container, 'BTNG-001')[0]!)
    expect(cont).toContain('flex-col')
    expect(cont).not.toContain('flex-row')
    expect(cont).not.toContain('flex-wrap')
    const dia = classes(await findByRole('radio', { name: 'Dia' }))
    const semana = classes(await findByRole('radio', { name: 'Semana' }))
    for (const opcao of [dia, semana]) {
      expect(opcao).toContain('w-full')
      expect(opcao).not.toContain('flex-1')
    }
    expect(dia).toContain('shadow-sm')
    expect(semana).toContain('shadow-none')
  })

  it('vertical: onChange e a seleção seguem iguais (valor mudado e estado marcado visíveis)', async () => {
    const onChange = jest.fn()
    const { findByRole, rerender } = await render(
      <BrandProvider>
        <ButtonGroup options={options} value="dia" onChange={onChange} orientation="vertical" />
      </BrandProvider>,
    )
    expect((await findByRole('radio', { name: 'Dia' })).props.accessibilityState.checked).toBe(true)
    await fireEvent.press(await findByRole('radio', { name: 'Semana' }))
    expect(onChange).toHaveBeenCalledWith('semana')
    await rerender(
      <BrandProvider>
        <ButtonGroup options={options} value="semana" onChange={onChange} orientation="vertical" />
      </BrandProvider>,
    )
    expect((await findByRole('radio', { name: 'Semana' })).props.accessibilityState.checked).toBe(true)
  })
})

describe('ButtonGroup: data-rendra (item D12 do levantamento da Sincronizacao 1)', () => {
  it('carrega dataSet.rendra = BTNG-001 com options', async () => {
    const { container } = await render(
      <BrandProvider>
        <ButtonGroup options={options} value="dia" onChange={() => {}} />
      </BrandProvider>,
    )
    expect(nodesWithCode(container, 'BTNG-001')).toHaveLength(1)
  })

  it('carrega dataSet.rendra = BTNG-001 com children', async () => {
    const { container } = await render(
      <BrandProvider>
        <ButtonGroup>
          <Button>Um</Button>
          <Button>Dois</Button>
        </ButtonGroup>
      </BrandProvider>,
    )
    expect(nodesWithCode(container, 'BTNG-001')).toHaveLength(1)
  })
})


describe('ButtonGroup: borda com a cor do token', () => {
  it('o grupo segmentado usa border-border (não preta)', async () => {
    const { container } = await render(
      <BrandProvider>
        <ButtonGroup options={options} value="dia" onChange={() => {}} accessibilityLabel="Período" />
      </BrandProvider>,
    )
    const [grupo] = nodesWithCode(container, 'BTNG-001')
    expect(String(grupo.props.className).split(' ')).toContain('border-border')
    expect(bordasSemCor(container)).toEqual([])
  })
})
