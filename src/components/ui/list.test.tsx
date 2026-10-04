import { useEffect, useState, type ReactNode } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react-native'
import { renderRouter } from 'expo-router/testing-library'
import { AccessibilityInfo, FlatList, Platform, Pressable, Text, View } from 'react-native'
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils'
import { State } from 'react-native-gesture-handler'
import { BrandProvider } from '../../brand'
import { RendraNavigationProvider } from '../../navigation/rendra-navigation'
import { RendraRouterBridge } from '../../router-bridge'
import { List } from './list'
import { nodesWithCode } from '../../test-utils/rendra-code'

const items = [
  { id: '1', title: 'Ana Souza', description: 'ana@exemplo.com' },
  { id: '2', title: 'Bruno Lima', description: 'bruno@exemplo.com' },
  { id: '3', title: 'Carla Dias', description: 'carla@exemplo.com' },
]

// C3 (veredito do Opus): a asserção de efeito de `onPress` afirma um texto que muda no
// wrapper, não só a chamada do handler.
function Arquivavel() {
  const [feito, setFeito] = useState(false)
  return (
    <List
      items={[{ id: '1', title: feito ? 'Arquivado' : 'Arquivar', onPress: () => setFeito(true) }]}
    />
  )
}

describe('List', () => {
  it('com divided (padrão), rende 2 separadores para 3 itens; divided=false rende 0', async () => {
    const { getAllByRole, rerender, queryAllByRole } = await render(
      <BrandProvider><List items={items} /></BrandProvider>,
    )
    expect(getAllByRole('separator')).toHaveLength(2)
    await rerender(<BrandProvider><List items={items} divided={false} /></BrandProvider>)
    expect(queryAllByRole('separator')).toHaveLength(0)
  })

  it('sem itens, mostra empty; com itens, o empty some', async () => {
    const { findByText } = await render(
      <BrandProvider>
        <List items={[]} empty={<Text className="text-muted-foreground">Nada por aqui</Text>} />
      </BrandProvider>,
    )
    expect(await findByText('Nada por aqui')).toBeTruthy()
    const { queryByText } = await render(
      <BrandProvider>
        <List items={items} empty={<Text className="text-muted-foreground">Nada por aqui</Text>} />
      </BrandProvider>,
    )
    expect(queryByText('Nada por aqui')).toBeNull()
  })

  // B4 (veredito do Opus): `Text` interno (`src/components/internal/text.tsx`) chama `useBrand()`
  // e lança sem `BrandProvider`; a rota `index` precisa envolver o `List` no provider. Depois da
  // Tarefa 2.3, o `List` lê `navigate`/`linkComponent` do contexto de navegação, então a rota
  // também precisa do `RendraRouterBridge` (fornece o `Link` real do Expo Router, preservando o
  // `<a href>` no export web).
  it('item com href navega para a rota de destino', async () => {
    const context = await renderRouter(
      {
        index: () => (
          <BrandProvider>
            <RendraRouterBridge>
              <List items={[{ id: '1', title: 'Cliente', href: '/destino' }]} />
            </RendraRouterBridge>
          </BrandProvider>
        ),
        destino: () => <Text className="text-foreground">Tela de destino</Text>,
      },
      { initialUrl: '/' },
    )
    await fireEvent.press(await context.findByRole('link', { name: 'Cliente' }))
    expect(await context.findByText('Tela de destino')).toBeTruthy()
  })

  // B5 (veredito do Opus): sem `linkComponent` no contexto, o item com `href` cai no `Pressable`
  // que chama `navigate` do contexto (não o `Link` do Expo Router).
  it('sem linkComponent no contexto, item com href chama navigate ao tocar', async () => {
    const navigate = jest.fn()
    const { findByRole } = await render(
      <BrandProvider>
        <RendraNavigationProvider value={{ navigate }}>
          <List items={[{ id: '1', title: 'Item', href: '/destino' }]} />
        </RendraNavigationProvider>
      </BrandProvider>,
    )
    await fireEvent.press(await findByRole('link', { name: 'Item' }))
    expect(navigate).toHaveBeenCalledWith('/destino')
  })

  // B5 (veredito do Opus): com `linkComponent` no contexto, o `List` usa esse componente em vez
  // do `Pressable` com `navigate`.
  it('com linkComponent no contexto, o List usa o componente do bridge em vez de navigate', async () => {
    function LinkDeMentira({ href, children }: { href: string; children?: ReactNode }) {
      return <View testID={`link-${href}`}>{children}</View>
    }
    const { getByTestId } = await render(
      <BrandProvider>
        <RendraNavigationProvider value={{ navigate: jest.fn(), linkComponent: LinkDeMentira }}>
          <List items={[{ id: '1', title: 'Item', href: '/destino' }]} />
        </RendraNavigationProvider>
      </BrandProvider>,
    )
    const wrapper = getByTestId('link-/destino')
    expect(wrapper).toBeTruthy()
    expect(within(wrapper).getByRole('link', { name: 'Item' })).toBeTruthy()
  })

  it('item com onPress muda o texto do wrapper ao tocar (Arquivar -> Arquivado)', async () => {
    const { findByRole, findByText } = await render(<BrandProvider><Arquivavel /></BrandProvider>)
    await fireEvent.press(await findByRole('button', { name: 'Arquivar' }))
    expect(await findByText('Arquivado')).toBeTruthy()
  })

  // C3 (veredito do Opus): o chevron leva testID próprio por item; a asserção lê a presença
  // real do nó, não só a ausência do papel interativo.
  it('item sem acao nao tem papel interativo; chevron so aparece nos interativos', async () => {
    const { queryByRole, findByRole, queryByTestId, getByTestId } = await render(
      <BrandProvider>
        <List items={[{ id: '1', title: 'So leitura' }, { id: '2', title: 'Toca', onPress: () => {} }]} />
      </BrandProvider>,
    )
    expect(queryByRole('button', { name: 'So leitura' })).toBeNull()
    expect(queryByRole('link', { name: 'So leitura' })).toBeNull()
    expect(await findByRole('button', { name: 'Toca' })).toBeTruthy()
    // O ChevronRight (lucide) é decorativo (sem accessibilityLabel), então o próprio pacote
    // marca `aria-hidden="true"` por padrão; o RNTL exclui nós ocultos por padrão
    // (desvios3:36-41, mesmo achado do B7 do veredito do Opus para o BrandLogo).
    expect(queryByTestId('list-chevron-1', { includeHiddenElements: true })).toBeNull()
    expect(getByTestId('list-chevron-2', { includeHiddenElements: true })).toBeTruthy()
  })

  it('titulo trunca em 1 linha e descricao em 2', async () => {
    const { findByText } = await render(<BrandProvider><List items={items} /></BrandProvider>)
    expect((await findByText('Ana Souza')).props.numberOfLines).toBe(1)
    expect((await findByText('ana@exemplo.com')).props.numberOfLines).toBe(2)
  })

  it('item interativo com trailing tambem interativo: trailing fica fora do Pressable da linha (M4, Fable)', async () => {
    // M4 (Fable, validacao da entrega): trailing e composicao autorizada (Button), mas antes
    // desta correcao ficava dentro da Pressable da linha inteira, dando controle aninhado em
    // controle (axe nested-interactive no web). O trailing agora e irmao da Pressable, nunca
    // descendente, quando o item tem href/onPress.
    const { findByRole } = await render(
      <BrandProvider>
        <List
          items={[
            {
              id: '1',
              title: 'Pedido 42',
              onPress: () => {},
              trailing: (
                <Pressable accessibilityRole="button" testID="trailing-btn">
                  <Text>Cancelar</Text>
                </Pressable>
              ),
            },
          ]}
        />
      </BrandProvider>,
    )
    const linha = await findByRole('button', { name: 'Pedido 42' })
    expect(within(linha).queryByTestId('trailing-btn')).toBeNull()
    expect(await findByRole('button', { name: 'Cancelar' })).toBeTruthy()
  })

  it('scrollEnabled e testID sao repassados ao FlatList (scrollEnabled padrao true)', async () => {
    const { getByTestId } = await render(
      <BrandProvider><List items={items} testID="lista" scrollEnabled={false} /></BrandProvider>,
    )
    expect(getByTestId('lista').props.scrollEnabled).toBe(false)
  })

  // B1 (veredito do Fable, validacao da entrega): a correcao anterior (M4) pos `min-h-touch
  // py-3` no View externo (a linha inteira) E `min-h-touch` de novo na Pressable interna,
  // somando 68px (12+44+12) contra os 44px do contrato (secao 12.28) e contra a linha nao interativa
  // da mesma lista. `py-3` precisa estar só no nó que efetivamente vira o toque mínimo (a
  // Pressable), nunca duplicado no View externo quando o item é interativo.
  it('item interativo tem a mesma altura minima (44px) da linha nao interativa: py-3 so na Pressable, nao duplicado no View externo (B1, veredito Fable)', async () => {
    const { getByRole, getByText } = await render(
      <BrandProvider>
        <List items={[{ id: '1', title: 'So leitura' }, { id: '2', title: 'Toca', onPress: () => {} }]} />
      </BrandProvider>,
    )
    const linhaInterativa = getByRole('button', { name: 'Toca' })
    const classesInterativa = linhaInterativa.props.className.split(' ')
    expect(classesInterativa).toContain('min-h-touch')
    expect(classesInterativa).toContain('py-3')
    // O View externo da linha interativa (avô do texto do título) não pode repetir `py-3`
    // (senão soma 68px); só a Pressable interna leva o padding vertical.
    const tituloInterativo = getByText('Toca')
    const viewExternoInterativo = tituloInterativo.parent?.parent?.parent
    expect(viewExternoInterativo?.props.className.split(' ')).not.toContain('py-3')
  })

  // M1 (veredito do Fable): o contrato §12.28 põe `trailing` antes do `ChevronRight`; a
  // correção do M4 (Fable anterior) inverteu a ordem. Confirma que, quando a linha é
  // interativa e o `trailing` também é interativo (mesmo caso do teste M4 acima), o chevron
  // aparece depois do `trailing` na árvore, não antes.
  it('trailing vem antes do chevron na ordem da arvore (M1, veredito Fable)', async () => {
    const { findByRole, findByTestId } = await render(
      <BrandProvider>
        <List
          items={[
            {
              id: '1',
              title: 'Pedido 42',
              onPress: () => {},
              trailing: (
                <Pressable accessibilityRole="button" testID="trailing-btn">
                  <Text>Cancelar</Text>
                </Pressable>
              ),
            },
          ]}
        />
      </BrandProvider>,
    )
    const cancelar = await findByRole('button', { name: 'Cancelar' })
    const chevron = await findByTestId('list-chevron-1', { includeHiddenElements: true })
    // `cancelar` (o botão) é filho direto do invólucro de `trailing` (`View
    // className="shrink-0 flex-row items-center"`); o pai desse invólucro é o View externo da
    // linha inteira, o mesmo nível onde o chevron precisa estar depois da correção. Compara os
    // filhos diretos do View externo: o invólucro do trailing precisa vir antes do chevron.
    const invólucroTrailing = cancelar.parent
    const linhaExterna = invólucroTrailing?.parent
    const indiceTrailing = linhaExterna?.children.indexOf(invólucroTrailing as never) ?? -1
    const indiceChevron = linhaExterna?.children.indexOf(chevron as never) ?? -1
    expect(indiceTrailing).toBeGreaterThanOrEqual(0)
    expect(indiceChevron).toBeGreaterThanOrEqual(0)
    expect(indiceTrailing).toBeLessThan(indiceChevron)
  })

  it('sem onReorder, carrega dataSet.rendra = LIST-001 (padrao, item I do levantamento)', async () => {
    const { container } = await render(
      <BrandProvider>
        <List items={items} />
      </BrandProvider>,
    )
    expect(nodesWithCode(container, 'LIST-001')).toHaveLength(1)
  })

  it.each([
    ['success', 'Sucesso'],
    ['warning', 'Atenção'],
    ['error', 'Erro'],
    ['neutral', 'Neutro'],
  ] as const)('ListItem.tone %s mostra o selo textual %s, nunca so cor (item D8 do levantamento)', async (tone, texto) => {
    const { findByText } = await render(
      <BrandProvider>
        <List items={[{ id: '1', title: 'Item', tone }]} />
      </BrandProvider>,
    )
    expect(await findByText(texto)).toBeTruthy()
  })

  it('sem tone, nao mostra nenhum dos quatro selos', async () => {
    const { queryByText } = await render(
      <BrandProvider>
        <List items={[{ id: '1', title: 'Item' }]} />
      </BrandProvider>,
    )
    expect(queryByText('Sucesso')).toBeNull()
    expect(queryByText('Atenção')).toBeNull()
    expect(queryByText('Erro')).toBeNull()
    expect(queryByText('Neutro')).toBeNull()
  })

  it('o selo de tone vem antes do trailing na ordem da arvore', async () => {
    const { findByText } = await render(
      <BrandProvider>
        <List items={[{ id: '1', title: 'Item', tone: 'success', trailing: <Text>Fim</Text> }]} />
      </BrandProvider>,
    )
    const selo = await findByText('Sucesso')
    const fim = await findByText('Fim')
    const pai = selo.parent?.parent
    const indiceSelo = pai?.children.indexOf(selo.parent as never) ?? -1
    const indiceFim = pai?.children.indexOf(fim.parent as never) ?? -1
    expect(indiceSelo).toBeGreaterThanOrEqual(0)
    expect(indiceFim).toBeGreaterThanOrEqual(0)
    expect(indiceSelo).toBeLessThan(indiceFim)
  })
})

describe('List reordenável: contrato aditivo (T3)', () => {
  it('com onReorder, carrega dataSet.rendra = LIST-002; sem, segue LIST-001', async () => {
    const { container, rerender } = await render(
      <BrandProvider>
        <List items={items} onReorder={() => {}} />
      </BrandProvider>,
    )
    expect(nodesWithCode(container, 'LIST-002')).toHaveLength(1)
    expect(nodesWithCode(container, 'LIST-001')).toHaveLength(0)
    await rerender(
      <BrandProvider>
        <List items={items} />
      </BrandProvider>,
    )
    expect(nodesWithCode(container, 'LIST-001')).toHaveLength(1)
    expect(nodesWithCode(container, 'LIST-002')).toHaveLength(0)
  })

  // Correção 2 do parecer: sem onReorder a árvore é a de hoje (nada novo montado).
  it('sem onReorder, a raiz é o FlatList com testID e não há nenhum controle novo', async () => {
    const { getByTestId, queryAllByRole, queryByTestId } = await render(
      <BrandProvider>
        <List testID="lista" items={items} />
      </BrandProvider>,
    )
    expect(getByTestId('lista').props.dataSet).toEqual({ rendra: 'LIST-001' })
    expect(queryAllByRole('button')).toHaveLength(0)
    expect(queryByTestId('lista-live')).toBeNull()
  })
})

describe('List reordenável: alça e botão Mover fora da linha (T4)', () => {
  const tres = [
    { id: '1', title: 'Ana Souza' },
    { id: '2', title: 'Bruno Lima', onPress: jest.fn() },
    { id: '3', title: 'Carla Dias', href: '/destino' },
  ]

  it('os três ramos (só leitura, onPress, href) ganham alça e Mover, com os rótulos do web', async () => {
    await render(
      <BrandProvider>
        <List items={tres} onReorder={() => {}} />
      </BrandProvider>,
    )
    for (const nome of ['Ana Souza', 'Bruno Lima', 'Carla Dias']) {
      expect(screen.getByRole('button', { name: `Reordenar ${nome}` })).toBeTruthy()
      expect(screen.getByRole('button', { name: `Mover ${nome}` })).toBeTruthy()
    }
  })

  it('alça e Mover ficam fora da Pressable da linha (M4: sem controle aninhado)', async () => {
    await render(
      <BrandProvider>
        <List items={tres} onReorder={() => {}} />
      </BrandProvider>,
    )
    const linha = screen.getByRole('button', { name: 'Bruno Lima' })
    expect(within(linha).queryByRole('button', { name: /Reordenar/ })).toBeNull()
    expect(within(linha).queryByRole('button', { name: /Mover/ })).toBeNull()
    const link = screen.getByRole('link', { name: 'Carla Dias' })
    expect(within(link).queryByRole('button', { name: /Reordenar|Mover/ })).toBeNull()
  })

  it('tocar na alça não dispara o onPress da linha', async () => {
    const onPress = jest.fn()
    await render(
      <BrandProvider>
        <List items={[{ id: '1', title: 'Ana', onPress }]} onReorder={() => {}} />
      </BrandProvider>,
    )
    await fireEvent.press(screen.getByRole('button', { name: 'Reordenar Ana' }))
    expect(onPress).not.toHaveBeenCalled()
    await fireEvent.press(screen.getByRole('button', { name: 'Ana' }))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('itemLabel customizado aparece nos rótulos; o padrão usa o title e, sem title string, o id', async () => {
    await render(
      <BrandProvider>
        <List
          items={[
            { id: 'a', title: 'Ana' },
            { id: 'b', title: <Text>Bruno</Text> },
          ]}
          onReorder={() => {}}
          itemLabel={(item) => `Cliente ${item.id}`}
        />
      </BrandProvider>,
    )
    expect(screen.getByRole('button', { name: 'Reordenar Cliente a' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Mover Cliente b' })).toBeTruthy()
  })

  it('padrão do itemLabel: title string, senão id', async () => {
    await render(
      <BrandProvider>
        <List items={[{ id: 'a', title: 'Ana' }, { id: 'b', title: <Text>Bruno</Text> }]} onReorder={() => {}} />
      </BrandProvider>,
    )
    expect(screen.getByRole('button', { name: 'Reordenar Ana' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reordenar b' })).toBeTruthy()
  })

  it('a alça vem antes do título na ordem da árvore, como no web', async () => {
    await render(
      <BrandProvider>
        <List items={[{ id: '1', title: 'Ana' }]} onReorder={() => {}} />
      </BrandProvider>,
    )
    const alca = screen.getByRole('button', { name: 'Reordenar Ana' })
    const linha = alca.parent?.parent as { children: { props?: unknown }[] }
    expect(linha.children[0]).toBe(alca.parent)
    expect(within(linha.children[1] as never).getByText('Ana')).toBeTruthy()
  })
})

// Lista controlada, como quem usa a `List` faz: guarda a ordem e a devolve em `items`.
function Controlada({ inicial, onReorder, scrollEnabled = false }: { inicial: typeof items; onReorder?: (lista: typeof items) => void; scrollEnabled?: boolean }) {
  const [ordem, setOrdem] = useState(inicial)
  return (
    <List
      testID="lista"
      items={ordem}
      scrollEnabled={scrollEnabled}
      onReorder={(nova) => {
        onReorder?.(nova as typeof items)
        setOrdem(nova as typeof items)
      }}
    />
  )
}

function ordemVisivel(): string[] {
  return screen.getAllByRole('button', { name: /^Reordenar / }).map((no) => String(no.props.accessibilityLabel).replace('Reordenar ', ''))
}

async function arrastar(gesto: ReturnType<typeof getByGestureTestId>, eventos: Parameters<typeof fireGestureHandler>[1]) {
  await act(async () => {
    fireGestureHandler(gesto, eventos)
  })
}

async function medirLinhas(ids: string[], altura = 44) {
  for (const id of ids) {
    await fireEvent(screen.getByTestId(`lista-row-${id}`), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 300, height: altura } } })
  }
}

describe('List reordenável: arraste com Gesture.Pan (T5)', () => {
  it('begin, vários updates e end trocam a ordem visível e chamam onReorder uma vez com a lista nova', async () => {
    const onReorder = jest.fn()
    await render(
      <BrandProvider>
        <Controlada inicial={items} onReorder={onReorder} />
      </BrandProvider>,
    )
    await medirLinhas(['1', '2', '3'])
    expect(ordemVisivel()).toEqual(['Ana Souza', 'Bruno Lima', 'Carla Dias'])
    const gesto = getByGestureTestId('lista-handle-1')
    // O gesto completo (3 updates antes do end) prova que ele não cai no primeiro update: a linha
    // não remonta ao começar o arraste (correção 1 do parecer).
    await arrastar(gesto, [
      { translationY: 0 },
      { translationY: 20 },
      { translationY: 60 },
      { translationY: 100 },
      { state: State.END, translationY: 100 },
    ])
    expect(onReorder).toHaveBeenCalledTimes(1)
    expect((onReorder.mock.calls[0][0] as typeof items).map((i) => i.id)).toEqual(['2', '3', '1'])
    expect(ordemVisivel()).toEqual(['Bruno Lima', 'Carla Dias', 'Ana Souza'])
  })

  // Correção 1 do parecer: o que prova que a linha não remonta é um nó filho que conta as montagens.
  it('a linha não remonta ao começar, durante nem ao terminar o arraste (o filho monta uma vez só)', async () => {
    const montagens: string[] = []
    function Marca({ id }: { id: string }) {
      useEffect(() => {
        montagens.push(id)
      }, [id])
      return <Text>{`marca ${id}`}</Text>
    }
    const comMarca = items.map((i) => ({ ...i, leading: <Marca id={i.id} /> }))
    await render(
      <BrandProvider>
        <Controlada inicial={comMarca} scrollEnabled />
      </BrandProvider>,
    )
    await medirLinhas(['1', '2', '3'])
    expect(montagens).toEqual(['1', '2', '3'])
    // Meio do arraste: chama os callbacks do Pan direto, para a árvore renderizar com o gesto ativo.
    const gesto = passosDoGesto('lista-handle-1')
    await act(async () => {
      gesto.handlers.onStart?.({ translationY: 0 })
    })
    await act(async () => {
      gesto.handlers.onUpdate?.({ translationY: 100 })
    })
    expect(screen.getByTestId('lista').props.scrollEnabled).toBe(false)
    expect(montagens).toEqual(['1', '2', '3'])
    await act(async () => {
      gesto.handlers.onEnd?.({ translationY: 100 }, true)
      gesto.handlers.onFinalize?.({}, true)
    })
    expect(ordemVisivel()).toEqual(['Bruno Lima', 'Carla Dias', 'Ana Souza'])
    expect(montagens).toEqual(['1', '2', '3'])
  })

  it('arrastar para cima move a linha para cima', async () => {
    await render(
      <BrandProvider>
        <Controlada inicial={items} />
      </BrandProvider>,
    )
    await medirLinhas(['1', '2', '3'])
    await arrastar(getByGestureTestId('lista-handle-3'), [
      { translationY: 0 },
      { translationY: -30 },
      { state: State.END, translationY: -50 },
    ])
    expect(ordemVisivel()).toEqual(['Ana Souza', 'Carla Dias', 'Bruno Lima'])
  })

  it('deslocamento nulo ou menor que meia linha não chama onReorder', async () => {
    const onReorder = jest.fn()
    await render(
      <BrandProvider>
        <Controlada inicial={items} onReorder={onReorder} />
      </BrandProvider>,
    )
    await medirLinhas(['1', '2', '3'])
    await arrastar(getByGestureTestId('lista-handle-1'), [{ translationY: 0 }, { translationY: 5 }, { state: State.END, translationY: 0 }])
    await arrastar(getByGestureTestId('lista-handle-2'), [{ translationY: 0 }, { translationY: 10 }, { state: State.END, translationY: 10 }])
    expect(onReorder).not.toHaveBeenCalled()
  })

  it('gesto cancelado (FAILED/CANCELLED) não chama onReorder', async () => {
    const onReorder = jest.fn()
    await render(
      <BrandProvider>
        <Controlada inicial={items} onReorder={onReorder} />
      </BrandProvider>,
    )
    await medirLinhas(['1', '2', '3'])
    await arrastar(getByGestureTestId('lista-handle-1'), [
      { translationY: 0 },
      { translationY: 100 },
      { state: State.CANCELLED, translationY: 100 },
    ])
    expect(onReorder).not.toHaveBeenCalled()
  })

  it('sem nenhuma medida (virtualização), o destino não muda e nada é chamado', async () => {
    const onReorder = jest.fn()
    await render(
      <BrandProvider>
        <Controlada inicial={items} onReorder={onReorder} />
      </BrandProvider>,
    )
    await arrastar(getByGestureTestId('lista-handle-1'), [{ translationY: 0 }, { translationY: 200 }, { state: State.END, translationY: 200 }])
    expect(onReorder).not.toHaveBeenCalled()
  })

  it('alturas diferentes (com e sem descrição) entram na conta do destino', async () => {
    const lista = [
      { id: 'a', title: 'A' },
      { id: 'b', title: 'B', description: 'com descrição' },
      { id: 'c', title: 'C' },
    ]
    await render(
      <BrandProvider>
        <Controlada inicial={lista as never} />
      </BrandProvider>,
    )
    await fireEvent(screen.getByTestId('lista-row-a'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 44 } } })
    await fireEvent(screen.getByTestId('lista-row-b'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 80 } } })
    await fireEvent(screen.getByTestId('lista-row-c'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 44 } } })
    // O centro de A (22) mais 50 cai dentro de B (44 a 124): só uma posição.
    await arrastar(getByGestureTestId('lista-handle-a'), [{ translationY: 0 }, { translationY: 50 }, { state: State.END, translationY: 50 }])
    expect(ordemVisivel()).toEqual(['B', 'A', 'C'])
  })
})

// Chama os callbacks do Pan direto (sem o END automático do `fireGestureHandler`) para observar o
// meio do arraste.
function passosDoGesto(id: string) {
  const gesto = getByGestureTestId(id) as unknown as {
    handlers: {
      onStart?: (e: object) => void
      onUpdate?: (e: object) => void
      onEnd?: (e: object, success: boolean) => void
      onFinalize?: (e: object, success: boolean) => void
    }
    config: Record<string, unknown>
  }
  return gesto
}

describe('List reordenável: a alça não disputa a rolagem (T6)', () => {
  it('no meio do arraste a prévia mexe e nada é chamado; só ao soltar a ordem muda', async () => {
    const onReorder = jest.fn()
    await render(
      <BrandProvider>
        <Controlada inicial={items} onReorder={onReorder} />
      </BrandProvider>,
    )
    await medirLinhas(['1', '2', '3'])
    const gesto = passosDoGesto('lista-handle-1')
    await act(async () => {
      gesto.handlers.onStart?.({ translationY: 0 })
      gesto.handlers.onUpdate?.({ translationY: 100 })
    })
    expect(onReorder).not.toHaveBeenCalled()
    expect(ordemVisivel()).toEqual(['Ana Souza', 'Bruno Lima', 'Carla Dias'])
    await act(async () => {
      gesto.handlers.onEnd?.({ translationY: 100 }, true)
      gesto.handlers.onFinalize?.({}, true)
    })
    expect(onReorder).toHaveBeenCalledTimes(1)
    expect(ordemVisivel()).toEqual(['Bruno Lima', 'Carla Dias', 'Ana Souza'])
  })

  it('o FlatList rola sozinho só fora do arraste: scrollEnabled vai a falso durante e volta ao soltar', async () => {
    await render(
      <BrandProvider>
        <Controlada inicial={items} scrollEnabled />
      </BrandProvider>,
    )
    await medirLinhas(['1', '2', '3'])
    expect(screen.getByTestId('lista').props.scrollEnabled).toBe(true)
    const gesto = passosDoGesto('lista-handle-1')
    await act(async () => {
      gesto.handlers.onStart?.({ translationY: 0 })
    })
    expect(screen.getByTestId('lista').props.scrollEnabled).toBe(false)
    await act(async () => {
      gesto.handlers.onEnd?.({ translationY: 0 }, true)
      gesto.handlers.onFinalize?.({}, true)
    })
    expect(screen.getByTestId('lista').props.scrollEnabled).toBe(true)
  })

  it('com scrollEnabled falso (dentro da ScrollView da página) permanece falso o tempo todo', async () => {
    await render(
      <BrandProvider>
        <Controlada inicial={items} scrollEnabled={false} />
      </BrandProvider>,
    )
    const gesto = passosDoGesto('lista-handle-1')
    await act(async () => {
      gesto.handlers.onStart?.({ translationY: 0 })
    })
    expect(screen.getByTestId('lista').props.scrollEnabled).toBe(false)
    await act(async () => {
      gesto.handlers.onFinalize?.({}, false)
    })
    expect(screen.getByTestId('lista').props.scrollEnabled).toBe(false)
  })

  it('o gesto cancelado devolve a rolagem sem chamar onReorder', async () => {
    const onReorder = jest.fn()
    await render(
      <BrandProvider>
        <Controlada inicial={items} onReorder={onReorder} scrollEnabled />
      </BrandProvider>,
    )
    await medirLinhas(['1', '2', '3'])
    const gesto = passosDoGesto('lista-handle-1')
    await act(async () => {
      gesto.handlers.onStart?.({ translationY: 0 })
      gesto.handlers.onUpdate?.({ translationY: 100 })
      gesto.handlers.onEnd?.({ translationY: 100 }, false)
      gesto.handlers.onFinalize?.({}, false)
    })
    expect(onReorder).not.toHaveBeenCalled()
    expect(screen.getByTestId('lista').props.scrollEnabled).toBe(true)
  })

  // Mecanismo escolhido (correção 3 do parecer): o Pan só ativa com arraste vertical de poucos
  // pixels (activeOffsetY), curto o bastante para tomar o gesto da rolagem da página; a prova real
  // é a do emulador e a do Playwright.
  it('o Pan ativa com arraste vertical curto', async () => {
    await render(
      <BrandProvider>
        <Controlada inicial={items} />
      </BrandProvider>,
    )
    const { config } = passosDoGesto('lista-handle-1')
    expect(config.activeOffsetYStart).toBe(-2)
    expect(config.activeOffsetYEnd).toBe(2)
  })
})

describe('List reordenável: rolagem automática na borda (T7)', () => {
  const oito = Array.from({ length: 8 }, (_, i) => ({ id: String(i + 1), title: `Item ${i + 1}` }))
  let rolar: jest.SpyInstance

  beforeEach(() => {
    jest.useFakeTimers()
    rolar = jest.spyOn(FlatList.prototype, 'scrollToOffset').mockImplementation(() => {})
  })
  afterEach(() => {
    rolar.mockRestore()
    jest.useRealTimers()
  })

  async function montar(scrollEnabled: boolean, onReorder?: (lista: typeof items) => void) {
    await render(
      <BrandProvider>
        <Controlada inicial={oito as never} scrollEnabled={scrollEnabled} onReorder={onReorder} />
      </BrandProvider>,
    )
    await medirLinhas(oito.map((i) => i.id))
    await fireEvent(screen.getByTestId('lista'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 200 } } })
    await fireEvent(screen.getByTestId('lista'), 'contentSizeChange', 300, 352)
  }

  it('com a lista rolável e o dedo parado na borda inferior, rola várias vezes e para ao soltar', async () => {
    await montar(true)
    const gesto = passosDoGesto('lista-handle-1')
    await act(async () => {
      gesto.handlers.onStart?.({ translationY: 0 })
      gesto.handlers.onUpdate?.({ translationY: 150 })
    })
    expect(rolar).not.toHaveBeenCalled()
    await act(async () => {
      jest.advanceTimersByTime(160)
    })
    // Dedo parado (nenhum update novo) e a lista continua rolando.
    expect(rolar.mock.calls.length).toBeGreaterThan(1)
    const antes = rolar.mock.calls.length
    await act(async () => {
      gesto.handlers.onEnd?.({ translationY: 150 }, true)
      gesto.handlers.onFinalize?.({}, true)
    })
    await act(async () => {
      jest.advanceTimersByTime(500)
    })
    expect(rolar.mock.calls.length).toBe(antes)
  })

  it('a rolagem soma ao deslocamento: o destino final reflete a rolagem', async () => {
    const onReorder = jest.fn()
    await montar(true, onReorder)
    const gesto = passosDoGesto('lista-handle-1')
    await act(async () => {
      gesto.handlers.onStart?.({ translationY: 0 })
      gesto.handlers.onUpdate?.({ translationY: 150 })
    })
    // Sem rolar, 150 px levariam o item 1 à linha 4 (centro em 172, linhas de 44).
    await act(async () => {
      jest.advanceTimersByTime(2000)
    })
    await act(async () => {
      gesto.handlers.onEnd?.({ translationY: 150 }, true)
      gesto.handlers.onFinalize?.({}, true)
    })
    expect(onReorder).toHaveBeenCalledTimes(1)
    const ids = (onReorder.mock.calls[0][0] as typeof items).map((i) => i.id)
    expect(ids.indexOf('1')).toBeGreaterThan(4)
    // O máximo rolado é conteúdo menos área (352 - 200), então nunca passa disso.
    const ultimo = rolar.mock.calls[rolar.mock.calls.length - 1][0] as { offset: number }
    expect(ultimo.offset).toBeLessThanOrEqual(152)
    expect(ultimo.offset).toBeGreaterThan(0)
  })

  it('o dedo na borda superior rola para cima, até o início', async () => {
    await montar(true)
    await fireEvent(screen.getByTestId('lista'), 'scroll', { nativeEvent: { contentOffset: { x: 0, y: 150 }, contentSize: { width: 300, height: 352 }, layoutMeasurement: { width: 300, height: 200 } } })
    const gesto = passosDoGesto('lista-handle-8')
    await act(async () => {
      gesto.handlers.onStart?.({ translationY: 0 })
      gesto.handlers.onUpdate?.({ translationY: -250 })
      jest.advanceTimersByTime(2000)
    })
    const ultimo = rolar.mock.calls[rolar.mock.calls.length - 1][0] as { offset: number }
    expect(ultimo.offset).toBe(0)
    await act(async () => {
      gesto.handlers.onFinalize?.({}, false)
    })
  })

  it('com scrollEnabled falso não há rolagem automática nem chamada a scrollToOffset', async () => {
    await montar(false)
    const gesto = passosDoGesto('lista-handle-1')
    await act(async () => {
      gesto.handlers.onStart?.({ translationY: 0 })
      gesto.handlers.onUpdate?.({ translationY: 150 })
      jest.advanceTimersByTime(2000)
    })
    expect(rolar).not.toHaveBeenCalled()
    await act(async () => {
      gesto.handlers.onFinalize?.({}, false)
    })
  })

  it('dedo no meio da área não rola', async () => {
    await montar(true)
    const gesto = passosDoGesto('lista-handle-3')
    await act(async () => {
      gesto.handlers.onStart?.({ translationY: 0 })
      gesto.handlers.onUpdate?.({ translationY: 0 })
      jest.advanceTimersByTime(500)
    })
    expect(rolar).not.toHaveBeenCalled()
    await act(async () => {
      gesto.handlers.onFinalize?.({}, false)
    })
  })
})

describe('List reordenável: menu Mover para cima e para baixo (T8)', () => {
  it('abrir o menu e escolher "Mover para baixo" troca a ordem visível e chama onReorder uma vez', async () => {
    const onReorder = jest.fn()
    await render(
      <BrandProvider>
        <Controlada inicial={items} onReorder={onReorder} />
      </BrandProvider>,
    )
    await fireEvent.press(screen.getByRole('button', { name: 'Mover Ana Souza' }))
    await fireEvent.press(screen.getByRole('menuitem', { name: 'Mover para baixo' }))
    expect(onReorder).toHaveBeenCalledTimes(1)
    expect((onReorder.mock.calls[0][0] as typeof items).map((i) => i.id)).toEqual(['2', '1', '3'])
    expect(ordemVisivel()).toEqual(['Bruno Lima', 'Ana Souza', 'Carla Dias'])
  })

  it('"Mover para cima" sobe a linha', async () => {
    await render(
      <BrandProvider>
        <Controlada inicial={items} />
      </BrandProvider>,
    )
    await fireEvent.press(screen.getByRole('button', { name: 'Mover Carla Dias' }))
    await fireEvent.press(screen.getByRole('menuitem', { name: 'Mover para cima' }))
    expect(ordemVisivel()).toEqual(['Ana Souza', 'Carla Dias', 'Bruno Lima'])
  })

  it('primeira linha com "Mover para cima" desabilitado; última com "Mover para baixo" desabilitado', async () => {
    await render(
      <BrandProvider>
        <Controlada inicial={items} />
      </BrandProvider>,
    )
    await fireEvent.press(screen.getByRole('button', { name: 'Mover Ana Souza' }))
    expect(screen.getByRole('menuitem', { name: 'Mover para cima' }).props.accessibilityState.disabled).toBe(true)
    expect(screen.getByRole('menuitem', { name: 'Mover para baixo' }).props.accessibilityState.disabled).toBe(false)
    await fireEvent.press(screen.getByRole('menuitem', { name: 'Mover para cima' }))
    expect(ordemVisivel()).toEqual(['Ana Souza', 'Bruno Lima', 'Carla Dias'])
  })

  it('a última linha não desce', async () => {
    const onReorder = jest.fn()
    await render(
      <BrandProvider>
        <Controlada inicial={items} onReorder={onReorder} />
      </BrandProvider>,
    )
    await fireEvent.press(screen.getByRole('button', { name: 'Mover Carla Dias' }))
    expect(screen.getByRole('menuitem', { name: 'Mover para baixo' }).props.accessibilityState.disabled).toBe(true)
    await fireEvent.press(screen.getByRole('menuitem', { name: 'Mover para baixo' }))
    expect(onReorder).not.toHaveBeenCalled()
  })

  it('sem onReorder o botão Mover não existe', async () => {
    await render(
      <BrandProvider>
        <List items={items} />
      </BrandProvider>,
    )
    expect(screen.queryByRole('button', { name: /Mover/ })).toBeNull()
  })
})

describe('List reordenável: acessibilidade nativa (T9)', () => {
  let anunciar: jest.SpyInstance
  beforeEach(() => {
    anunciar = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {})
  })
  afterEach(() => {
    anunciar.mockRestore()
  })

  it('a alça expõe as ações moveUp e moveDown com rótulo', async () => {
    await render(
      <BrandProvider>
        <Controlada inicial={items} />
      </BrandProvider>,
    )
    const alca = screen.getByRole('button', { name: 'Reordenar Ana Souza' })
    expect(alca.props.accessibilityActions).toEqual([
      { name: 'moveUp', label: 'Mover para cima' },
      { name: 'moveDown', label: 'Mover para baixo' },
    ])
  })

  it('a ação moveDown troca a ordem visível e anuncia a nova posição', async () => {
    await render(
      <BrandProvider>
        <Controlada inicial={items} />
      </BrandProvider>,
    )
    await fireEvent(screen.getByRole('button', { name: 'Reordenar Ana Souza' }), 'accessibilityAction', { nativeEvent: { actionName: 'moveDown' } })
    expect(ordemVisivel()).toEqual(['Bruno Lima', 'Ana Souza', 'Carla Dias'])
    expect(anunciar).toHaveBeenCalledTimes(1)
    expect(anunciar).toHaveBeenCalledWith('Ana Souza, posição 2 de 3')
  })

  it('a ação moveUp sobe; nas bordas não muda a ordem nem anuncia', async () => {
    await render(
      <BrandProvider>
        <Controlada inicial={items} />
      </BrandProvider>,
    )
    await fireEvent(screen.getByRole('button', { name: 'Reordenar Carla Dias' }), 'accessibilityAction', { nativeEvent: { actionName: 'moveUp' } })
    expect(ordemVisivel()).toEqual(['Ana Souza', 'Carla Dias', 'Bruno Lima'])
    expect(anunciar).toHaveBeenLastCalledWith('Carla Dias, posição 2 de 3')
    anunciar.mockClear()
    await fireEvent(screen.getByRole('button', { name: 'Reordenar Ana Souza' }), 'accessibilityAction', { nativeEvent: { actionName: 'moveUp' } })
    await fireEvent(screen.getByRole('button', { name: 'Reordenar Bruno Lima' }), 'accessibilityAction', { nativeEvent: { actionName: 'moveDown' } })
    expect(ordemVisivel()).toEqual(['Ana Souza', 'Carla Dias', 'Bruno Lima'])
    expect(anunciar).not.toHaveBeenCalled()
  })

  it('ação desconhecida é ignorada', async () => {
    await render(
      <BrandProvider>
        <Controlada inicial={items} />
      </BrandProvider>,
    )
    await fireEvent(screen.getByRole('button', { name: 'Reordenar Ana Souza' }), 'accessibilityAction', { nativeEvent: { actionName: 'activate' } })
    expect(ordemVisivel()).toEqual(['Ana Souza', 'Bruno Lima', 'Carla Dias'])
    expect(anunciar).not.toHaveBeenCalled()
  })

  it('o menu Mover anuncia a nova posição uma vez', async () => {
    await render(
      <BrandProvider>
        <Controlada inicial={items} />
      </BrandProvider>,
    )
    await fireEvent.press(screen.getByRole('button', { name: 'Mover Ana Souza' }))
    await fireEvent.press(screen.getByRole('menuitem', { name: 'Mover para baixo' }))
    // A folha do menu anuncia o próprio rótulo ao abrir (BottomSheet); a posição sai uma vez só.
    const posicoes = anunciar.mock.calls.filter(([texto]) => String(texto).includes('posição'))
    expect(posicoes).toEqual([['Ana Souza, posição 2 de 3']])
  })

  it('o arraste anuncia a nova posição uma vez ao soltar, e não anuncia quando a posição não muda', async () => {
    await render(
      <BrandProvider>
        <Controlada inicial={items} />
      </BrandProvider>,
    )
    await medirLinhas(['1', '2', '3'])
    await arrastar(getByGestureTestId('lista-handle-1'), [{ translationY: 0 }, { translationY: 60 }, { translationY: 100 }, { state: State.END, translationY: 100 }])
    expect(anunciar).toHaveBeenCalledTimes(1)
    expect(anunciar).toHaveBeenCalledWith('Ana Souza, posição 3 de 3')
    anunciar.mockClear()
    await arrastar(getByGestureTestId('lista-handle-1'), [{ translationY: 0 }, { translationY: 3 }, { state: State.END, translationY: 3 }])
    expect(anunciar).not.toHaveBeenCalled()
  })

  it('no nativo não existe região viva (a fala vem só do announceForAccessibility)', async () => {
    await render(
      <BrandProvider>
        <Controlada inicial={items} />
      </BrandProvider>,
    )
    await fireEvent(screen.getByRole('button', { name: 'Reordenar Ana Souza' }), 'accessibilityAction', { nativeEvent: { actionName: 'moveDown' } })
    expect(screen.queryByTestId('lista-live')).toBeNull()
  })
})

describe('List reordenável: teclado e região viva no web (T10)', () => {
  let anunciar: jest.SpyInstance
  beforeEach(() => {
    anunciar = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {})
  })
  afterEach(() => {
    anunciar.mockRestore()
    jest.restoreAllMocks()
  })

  async function tecla(nome: string, key: string) {
    const preventDefault = jest.fn()
    await fireEvent(screen.getByRole('button', { name: `Reordenar ${nome}` }), 'keyDown', { key, preventDefault })
    return preventDefault
  }

  it('a alça é focável (tabIndex 0) e ArrowDown troca a ordem visível', async () => {
    await render(
      <BrandProvider>
        <Controlada inicial={items} />
      </BrandProvider>,
    )
    expect(screen.getByRole('button', { name: 'Reordenar Ana Souza' }).props.tabIndex).toBe(0)
    const preventDefault = await tecla('Ana Souza', 'ArrowDown')
    expect(preventDefault).toHaveBeenCalled()
    expect(ordemVisivel()).toEqual(['Bruno Lima', 'Ana Souza', 'Carla Dias'])
  })

  it('ArrowUp sobe; nas bordas nada muda', async () => {
    await render(
      <BrandProvider>
        <Controlada inicial={items} />
      </BrandProvider>,
    )
    await tecla('Carla Dias', 'ArrowUp')
    expect(ordemVisivel()).toEqual(['Ana Souza', 'Carla Dias', 'Bruno Lima'])
    await tecla('Ana Souza', 'ArrowUp')
    await tecla('Bruno Lima', 'ArrowDown')
    expect(ordemVisivel()).toEqual(['Ana Souza', 'Carla Dias', 'Bruno Lima'])
  })

  it('outras teclas não fazem nada e não seguram o evento', async () => {
    await render(
      <BrandProvider>
        <Controlada inicial={items} />
      </BrandProvider>,
    )
    const preventDefault = await tecla('Ana Souza', 'Tab')
    expect(preventDefault).not.toHaveBeenCalled()
    expect(ordemVisivel()).toEqual(['Ana Souza', 'Bruno Lima', 'Carla Dias'])
  })

  it('no web a região viva (polite, fora das células) traz o mesmo texto do anúncio', async () => {
    jest.replaceProperty(Platform, 'OS', 'web')
    await render(
      <BrandProvider>
        <Controlada inicial={items} />
      </BrandProvider>,
    )
    const regiao = screen.getByTestId('lista-live')
    expect(regiao.props.accessibilityLiveRegion).toBe('polite')
    expect(regiao.props.className).toContain('absolute')
    await tecla('Ana Souza', 'ArrowDown')
    expect(screen.getByTestId('lista-live')).toHaveTextContent('Ana Souza, posição 2 de 3')
    // O mesmo texto vai ao announceForAccessibility (vazio no web) uma única vez por movimento.
    expect(anunciar).toHaveBeenCalledTimes(1)
  })

  it('depois de mover pelo teclado, o foco volta à alça do mesmo item', async () => {
    await render(
      <BrandProvider>
        <Controlada inicial={items} />
      </BrandProvider>,
    )
    // O `View` do ambiente de teste do RN traz `focus` como `jest.fn()` compartilhado.
    const foco = (View as unknown as { prototype: { focus: jest.Mock } }).prototype.focus
    foco.mockClear()
    await tecla('Ana Souza', 'ArrowDown')
    expect(foco).toHaveBeenCalledTimes(1)
    // Movimento pelo menu não rouba o foco para a alça.
    foco.mockClear()
    await fireEvent.press(screen.getByRole('button', { name: 'Mover Ana Souza' }))
    await fireEvent.press(screen.getByRole('menuitem', { name: 'Mover para baixo' }))
    expect(foco).not.toHaveBeenCalled()
  })

  it('no nativo não há região viva; sem onReorder também não, nem no web', async () => {
    await render(
      <BrandProvider>
        <Controlada inicial={items} />
      </BrandProvider>,
    )
    expect(screen.queryByTestId('lista-live')).toBeNull()
    jest.replaceProperty(Platform, 'OS', 'web')
    await render(
      <BrandProvider>
        <List testID="outra" items={items} />
      </BrandProvider>,
    )
    expect(screen.queryByTestId('outra-live')).toBeNull()
  })
})


describe('List reordenável: título em linha própria quando a linha tem leading ou trailing (correção 11)', () => {
  type No = { parent: No | null; props: { className?: string } }
  // Menor ancestral que contém os dois nós: é o contêiner que decide se ficam na mesma linha.
  function ancestralComum(a: No, b: No): No | null {
    const doA = new Set<No>()
    for (let n: No | null = a; n; n = n.parent) doA.add(n)
    for (let n: No | null = b; n; n = n.parent) if (doA.has(n)) return n
    return null
  }
  const classes = (no: No | null) => (no?.props.className ?? '').split(' ')

  const cheia = [
    {
      id: '1',
      title: 'Enviar proposta para a Padaria Estrela',
      description: '02/10/2026',
      leading: <Text>marca</Text>,
      trailing: <Text>menu</Text>,
    },
  ]
  const simples = [{ id: '1', title: 'Ana Souza', description: 'ana@exemplo.com' }]

  it('com leading e trailing, título e controles ficam em linhas diferentes (contêiner comum em coluna)', async () => {
    await render(
      <BrandProvider>
        <List items={cheia} onReorder={() => {}} />
      </BrandProvider>,
    )
    const titulo = screen.getByText('Enviar proposta para a Padaria Estrela') as unknown as No
    for (const alvo of [
      screen.getByRole('button', { name: /^Reordenar / }),
      screen.getByRole('button', { name: /^Mover / }),
      screen.getByText('marca'),
      screen.getByText('menu'),
    ]) {
      expect(classes(ancestralComum(titulo, alvo as unknown as No))).toContain('flex-col')
    }
    // Nenhum controle some: todos seguem na árvore.
    expect(screen.getByText('02/10/2026')).toBeTruthy()
  })

  it('o título ocupa a largura inteira da linha (sem encolher ao lado dos controles)', async () => {
    await render(
      <BrandProvider>
        <List items={cheia} onReorder={() => {}} />
      </BrandProvider>,
    )
    const titulo = screen.getByText('Enviar proposta para a Padaria Estrela') as unknown as No
    expect(classes(titulo.parent?.parent ?? null)).not.toContain('flex-row')
  })

  it('linhas interativas empilhadas (onPress e href): o título fica na Pressable, os controles fora dela', async () => {
    const aoTocar = jest.fn()
    await render(
      <BrandProvider>
        <List
          items={[
            { id: '1', title: 'Tocar', onPress: aoTocar, leading: <Text>marca 1</Text>, trailing: <Text>fim 1</Text> },
            { id: '2', title: 'Abrir', href: '/destino', leading: <Text>marca 2</Text>, tone: 'success' },
          ]}
          onReorder={() => {}}
        />
      </BrandProvider>,
    )
    const botao = screen.getByRole('button', { name: 'Tocar' })
    expect(within(botao).queryByText('marca 1')).toBeNull()
    expect(within(botao).queryByRole('button', { name: /Reordenar|Mover/ })).toBeNull()
    await fireEvent.press(botao)
    expect(aoTocar).toHaveBeenCalledTimes(1)
    const link = screen.getByRole('link', { name: 'Abrir' })
    expect(within(link).queryByText('marca 2')).toBeNull()
    for (const nome of ['Tocar', 'Abrir']) {
      expect(screen.getByRole('button', { name: `Reordenar ${nome}` })).toBeTruthy()
      expect(screen.getByRole('button', { name: `Mover ${nome}` })).toBeTruthy()
    }
    expect(screen.getByText('fim 1')).toBeTruthy()
    expect(screen.getByText('Sucesso')).toBeTruthy()
  })

  it('o título pode ir a duas linhas (não é cortado) só na linha empilhada', async () => {
    await render(
      <BrandProvider>
        <List items={[...cheia, { id: '2', title: 'Ana Souza' }]} onReorder={() => {}} />
      </BrandProvider>,
    )
    expect(screen.getByText('Enviar proposta para a Padaria Estrela').props.numberOfLines).toBe(2)
    expect(screen.getByText('Ana Souza').props.numberOfLines).toBe(1)
  })

  it('sem leading nem trailing, a linha segue numa linha só (alça, Mover e título lado a lado)', async () => {
    await render(
      <BrandProvider>
        <List items={simples} onReorder={() => {}} />
      </BrandProvider>,
    )
    const titulo = screen.getByText('Ana Souza') as unknown as No
    const alca = screen.getByRole('button', { name: /^Reordenar / }) as unknown as No
    expect(classes(ancestralComum(titulo, alca))).toContain('flex-row')
  })

  it('sem onReorder, leading e trailing ficam na mesma linha do título, como hoje', async () => {
    await render(
      <BrandProvider>
        <List items={cheia} />
      </BrandProvider>,
    )
    const titulo = screen.getByText('Enviar proposta para a Padaria Estrela') as unknown as No
    expect(classes(ancestralComum(titulo, screen.getByText('marca') as unknown as No))).toContain('flex-row')
  })
})
