import { AccessibilityInfo, View } from 'react-native'
import { act, render } from '@testing-library/react-native'
import * as Reanimated from 'react-native-reanimated'
import { BrandProvider } from '../../brand/brand-provider'
import type { BrandConfig, FeedbackType } from '../../brand/types'
import { BrandFeedbackIcon, animationTimings, colorClass, feedbackLabels } from './brand-feedback-icon'
import { nodesWithCode } from '../../test-utils/rendra-code'

// Espia as chamadas de `withTiming` (duração de cada trilha) sem trocar o comportamento do módulo.
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated')
  return { ...actual, __esModule: true, withTiming: jest.fn(actual.withTiming) }
})
const withTimingMock = Reanimated.withTiming as unknown as jest.Mock
const duracoes = () => withTimingMock.mock.calls.map((chamada) => (chamada[1] as { duration: number }).duration)

// Símbolo falso da marca: recebe a `className` de verdade (o `Svg` interno a consome no cssInterop).
function SimboloFalso({ className }: { className?: string }) {
  return <View testID="simbolo-falso" className={className} />
}
const marcaComSimbolo: Partial<Record<'T1', BrandConfig>> = {
  T1: {
    id: 'teste',
    productName: 'Teste',
    companyName: 'Teste',
    tagline: 'x',
    shape: 'square',
    sidebarLogo: 'dark',
    symbol: SimboloFalso as unknown as BrandConfig['symbol'],
  },
}
const tipos: FeedbackType[] = ['success', 'error', 'warning', 'info']
const classesDe = (no: { props: Record<string, unknown> }) => String(no.props.className ?? '').split(' ')

beforeEach(() => {
  withTimingMock.mockClear()
})

describe('BrandFeedbackIcon', () => {
  it('feedbackLabels tem as 4 chaves em pt-BR', () => {
    expect(feedbackLabels).toEqual({ success: 'Sucesso', error: 'Erro', warning: 'Atenção', info: 'Informação' })
  })

  it('com label: role img e accessibilityLabel', async () => {
    const { findByRole } = await render(
      <BrandProvider>
        <BrandFeedbackIcon type="success" label="Sucesso" />
      </BrandProvider>,
    )
    const node = await findByRole('img')
    expect(node.props.accessibilityLabel).toBe('Sucesso')
  })

  it('sem label: decorativo (accessibilityElementsHidden)', async () => {
    const { findByTestId } = await render(
      <BrandProvider>
        <BrandFeedbackIcon type="info" testID="icone" />
      </BrandProvider>,
    )
    // includeHiddenElements: true porque o próprio elemento sob teste é decorativo
    // (accessibilityElementsHidden), e @testing-library/react-native exclui elementos
    // ocultos da árvore de acessibilidade das consultas por padrão (defaultIncludeHiddenElements: false).
    const node = await findByTestId('icone', { includeHiddenElements: true })
    expect(node.props.accessibilityElementsHidden).toBe(true)
  })

  it('cor por tipo: error usa text-destructive (mapa colorClass; className não é observável no Svg depois do cssInterop)', async () => {
    // O cssInterop(Svg, { className: 'style' }) (nota do próprio componente) consome a prop
    // className do Svg e a substitui por um style computado; o nó renderizado não tem mais
    // `className` para inspecionar (confirmado: symbol.props.className é undefined em runtime de
    // teste). A resolução de cor via variável CSS (`rgb(var(--rendra-destructive) / <alpha-value>)`,
    // tailwind.config.ts) também não aparece no style resolvido sob Jest (mesma classe de risco já
    // registrada em tailwind.config.ts para --rendra-shadow-color/--rendra-shadow-opacity-*): o style resolvido é
    // idêntico entre type="error" e type="success", só a largura/altura de size-full aparece.
    // A parte observável e estável é o mapa `colorClass` que o componente usa para montar essa
    // className, exportado só para este teste; o render confirma que o tipo não quebra a montagem.
    expect(colorClass.error).toBe('text-destructive')
    const { findByTestId } = await render(
      <BrandProvider>
        <BrandFeedbackIcon type="error" testID="icone" />
      </BrandProvider>,
    )
    expect(await findByTestId('icone-symbol', { includeHiddenElements: true })).toBeTruthy()
  })

  it('tamanho xl usa size-12', async () => {
    const { findByTestId } = await render(
      <BrandProvider>
        <BrandFeedbackIcon type="warning" size="xl" testID="icone" />
      </BrandProvider>,
    )
    const node = await findByTestId('icone', { includeHiddenElements: true })
    expect(node.props.className.split(' ')).toContain('size-12')
  })

  it('animated não lança e renderiza o glifo', async () => {
    const { findByTestId } = await render(
      <BrandProvider>
        <BrandFeedbackIcon type="success" animated testID="icone" />
      </BrandProvider>,
    )
    expect(await findByTestId('icone-glyph', { includeHiddenElements: true })).toBeTruthy()
  })

  it('carrega dataSet.rendra = BFI-001 na raiz (item D12 do levantamento da Sincronizacao 1)', async () => {
    const { container } = await render(
      <BrandProvider>
        <BrandFeedbackIcon type="success" />
      </BrandProvider>,
    )
    expect(nodesWithCode(container, 'BFI-001')).toHaveLength(1)
  })

  it.each(tipos)('symbolTone="brand" tinge o símbolo com a cor primária da marca (%s), e o padrão segue a cor do estado', async (tipo) => {
    const { findByTestId, rerender } = await render(
      <BrandProvider brands={marcaComSimbolo}>
        <BrandFeedbackIcon type={tipo} />
      </BrandProvider>,
    )
    expect(classesDe(await findByTestId('simbolo-falso', { includeHiddenElements: true }))).toContain(colorClass[tipo])
    await rerender(
      <BrandProvider brands={marcaComSimbolo}>
        <BrandFeedbackIcon type={tipo} symbolTone="brand" />
      </BrandProvider>,
    )
    const simbolo = classesDe(await findByTestId('simbolo-falso', { includeHiddenElements: true }))
    expect(simbolo).toContain('text-primary')
    expect(simbolo).not.toContain(colorClass[tipo])
  })

  it('symbolTone="brand" mantém o selo na cor do estado', async () => {
    const { container } = await render(
      <BrandProvider brands={marcaComSimbolo}>
        <BrandFeedbackIcon type="error" symbolTone="brand" />
      </BrandProvider>,
    )
    expect(container.queryAll((no) => classesDe(no).includes('bg-destructive')).length).toBeGreaterThan(0)
  })

  it('sem statusBadge, o selo sobreposto de sempre fica no canto (absolute right-0 bottom-0) e não há selo ao lado', async () => {
    const { container, queryByTestId } = await render(
      <BrandProvider>
        <BrandFeedbackIcon type="success" testID="icone" />
      </BrandProvider>,
    )
    expect(container.queryAll((no) => classesDe(no).includes('absolute') && classesDe(no).includes('right-0')).length).toBe(1)
    expect(queryByTestId('icone-estado', { includeHiddenElements: true })).toBeNull()
  })

  it.each(tipos)('statusBadge (%s): o ícone do estado aparece ao lado, na cor do estado, e o selo sobreposto some', async (tipo) => {
    const { container, findByTestId } = await render(
      <BrandProvider>
        <BrandFeedbackIcon type={tipo} statusBadge testID="icone" />
      </BrandProvider>,
    )
    const estado = await findByTestId('icone-estado', { includeHiddenElements: true })
    expect(classesDe(estado)).toEqual(expect.arrayContaining(['aspect-square', 'h-1/2']))
    // O ícone do estado é um Lucide dentro do selo (a cor, `colorClass[tipo]`, vira variável CSS e não aparece sob Jest; a captura confere).
    expect(estado.queryAll((no) => String(no.type) === 'RNSVGSvgView')).toHaveLength(1)
    expect(container.queryAll((no) => classesDe(no).includes('absolute') && classesDe(no).includes('right-0'))).toHaveLength(0)
  })

  it('statusBadge: a raiz ocupa a altura do tamanho (h-icon-md) com o selo ao lado, em linha, sem size-icon-md quadrado', async () => {
    const { findByTestId } = await render(
      <BrandProvider>
        <BrandFeedbackIcon type="info" size="lg" statusBadge testID="icone" />
      </BrandProvider>,
    )
    const raiz = classesDe(await findByTestId('icone', { includeHiddenElements: true }))
    expect(raiz).toEqual(expect.arrayContaining(['flex-row', 'items-end', 'h-icon-lg']))
    expect(raiz).not.toContain('size-icon-lg')
  })

  it('statusBadge com símbolo da marca em tom "brand": símbolo primário e selo na cor do estado, juntos', async () => {
    const { findByTestId } = await render(
      <BrandProvider brands={marcaComSimbolo}>
        <BrandFeedbackIcon type="warning" statusBadge symbolTone="brand" testID="icone" />
      </BrandProvider>,
    )
    expect(classesDe(await findByTestId('simbolo-falso', { includeHiddenElements: true }))).toContain('text-primary')
    const estado = await findByTestId('icone-estado', { includeHiddenElements: true })
    expect(estado).toBeTruthy()
  })

  it('animation: "encaixe" dura 240 ms com curva sem quique (diferente da spring do "pop", de 420 ms)', () => {
    expect(animationTimings.encaixe.duration).toBe(240)
    expect(animationTimings.pop.duration).toBe(420)
    expect(animationTimings.encaixe.easing).not.toBe(animationTimings.pop.easing)
    expect(animationTimings.encaixe.easing).toBe('ease-out')
  })

  it('animation="encaixe": nenhuma trilha passa de 240 ms e o erro não treme', async () => {
    await render(
      <BrandProvider>
        <BrandFeedbackIcon type="error" animated animation="encaixe" />
      </BrandProvider>,
    )
    const tempos = duracoes()
    expect(tempos.length).toBeGreaterThan(0)
    expect(Math.max(...tempos)).toBeLessThanOrEqual(240)
    expect(tempos).not.toContain(84)
  })

  it('animation="pop" (padrão) mantém os 420 ms e o tremor do erro', async () => {
    await render(
      <BrandProvider>
        <BrandFeedbackIcon type="error" animated />
      </BrandProvider>,
    )
    const tempos = duracoes()
    expect(tempos).toContain(420)
    expect(tempos).toContain(84)
  })

  it('animated={false} não anima em nenhum dos dois valores de animation', async () => {
    await render(
      <BrandProvider>
        <BrandFeedbackIcon type="success" animation="encaixe" />
        <BrandFeedbackIcon type="success" animation="pop" />
      </BrandProvider>,
    )
    expect(withTimingMock).not.toHaveBeenCalled()
  })

  it('com movimento reduzido ligado, as trilhas deixam de rodar (encaixe e pop)', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true)
    const { rerender } = await render(
      <BrandProvider>
        <BrandFeedbackIcon type="success" animated animation="encaixe" />
      </BrandProvider>,
    )
    await act(async () => {})
    withTimingMock.mockClear()
    // Muda o tipo para o efeito rodar de novo: com movimento reduzido, nenhuma trilha é iniciada.
    await rerender(
      <BrandProvider>
        <BrandFeedbackIcon type="error" animated animation="encaixe" />
      </BrandProvider>,
    )
    await rerender(
      <BrandProvider>
        <BrandFeedbackIcon type="info" animated animation="pop" />
      </BrandProvider>,
    )
    expect(withTimingMock).not.toHaveBeenCalled()
  })
})
