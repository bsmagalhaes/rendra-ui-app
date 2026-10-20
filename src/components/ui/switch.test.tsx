import { useState } from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { StyleSheet, AccessibilityInfo } from 'react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { Switch } from './switch'
import { nodesWithCode } from '../../test-utils/rendra-code'

function ControlledSwitch({ onCheckedChange }: { onCheckedChange: (checked: boolean) => void }) {
  const [checked, setChecked] = useState(false)
  return (
    <Switch
      checked={checked}
      accessibilityLabel="Notificações"
      onCheckedChange={(next) => {
        setChecked(next)
        onCheckedChange(next)
      }}
    />
  )
}

describe('Switch', () => {
  it('findByRole switch, onCheckedChange e accessibilityState.checked, com efeito visível de verdade', async () => {
    // Achado 2 do veredito do Bloco A: `checked={false}` fixo fazia o teste conferir só a
    // chamada de `onCheckedChange`; envolvido num componente controlado por `useState`, o
    // teste passa a afirmar o efeito visível (accessibilityState.checked) depois do toque.
    const onCheckedChange = jest.fn()
    const { findByRole } = await render(
      <BrandProvider>
        <ControlledSwitch onCheckedChange={onCheckedChange} />
      </BrandProvider>,
    )
    const chave = await findByRole('switch')
    expect(chave.props.accessibilityState.checked).toBe(false)
    await fireEvent.press(chave)
    expect(onCheckedChange).toHaveBeenCalledWith(true)
    expect(chave.props.accessibilityState.checked).toBe(true)
  })

  it('mede min-h-touch min-w-touch no Pressable com o papel', async () => {
    const { findByRole } = await render(
      <BrandProvider>
        <Switch accessibilityLabel="Notificações" onCheckedChange={() => {}} />
      </BrandProvider>,
    )
    const chave = await findByRole('switch')
    const classes = chave.props.className.split(' ')
    expect(classes).toEqual(expect.arrayContaining(['min-h-touch', 'min-w-touch']))
  })

  it('com reducedMotion, o polegar chega na posição final (translateX 24)', async () => {
    // Desvio de execução: o plano previa espionar `Reanimated.withTiming` (`jest.spyOn` lança "Cannot redefine
    // property: withTiming", export somente leitura sob o transform deste projeto) e um
    // `jest.mock('react-native-reanimated', ...)` por spread quebra `Animated.View` (perde
    // propriedades internas que `react-native-css-interop` usa para resolver o `className`,
    // "Cannot read properties of undefined (reading 'displayName')"). Adotada a alternativa
    // que o próprio plano já previa (v2, melhoria 2): conferir o estado final do polegar.
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true)
    const { findByTestId } = await render(
      <BrandProvider>
        <Switch id="notificacoes" checked accessibilityLabel="Notificações" onCheckedChange={() => {}} />
      </BrandProvider>,
    )
    const polegar = await findByTestId('notificacoes-thumb')
    await waitFor(() => {
      const style = StyleSheet.flatten(polegar.props.style) as { transform?: { translateX?: number }[] }
      expect(style.transform?.[0]?.translateX).toBe(24)
    })
  })

  it('estrutura do polegar: o nó animado leva só testID e style; as classes vivem no View filho (web perde className no Animated.View)', async () => {
    const { findByTestId } = await render(
      <BrandProvider>
        <Switch id="estrutura" checked accessibilityLabel="Notificações" onCheckedChange={() => {}} />
      </BrandProvider>,
    )
    const animado = await findByTestId('estrutura-thumb')
    expect(animado.props.className).toBeUndefined()
    const filho = animado.children[0] as unknown as { props: { className?: string } }
    const classes = String(filho.props.className ?? '').split(' ')
    expect(classes).toEqual(expect.arrayContaining(['size-icon-md', 'rounded-full', 'bg-card', 'shadow-sm']))
  })

  it('com rótulo, o Pressable externo tem hitSlop de reforço', async () => {
    const { findByRole } = await render(
      <BrandProvider>
        <Switch label="Notificações push" onCheckedChange={() => {}} />
      </BrandProvider>,
    )
    const chave = await findByRole('switch')
    expect(chave.props.hitSlop).toBeTruthy()
  })

  it('com rótulo, o elemento com o papel switch é o Pressable da linha inteira e contém min-h-touch', async () => {
    const { findByRole } = await render(
      <BrandProvider>
        <Switch label="Notificações push" onCheckedChange={() => {}} />
      </BrandProvider>,
    )
    const chave = await findByRole('switch')
    expect(chave.props.className.split(' ')).toContain('min-h-touch')
    expect(chave.props.accessibilityLabel).toBe('Notificações push')
  })

  it('defaultChecked inicia ligado sem checked controlado, e o toque desliga de verdade', async () => {
    const onCheckedChange = jest.fn()
    const { findByRole } = await render(
      <BrandProvider>
        <Switch defaultChecked accessibilityLabel="Notificações" onCheckedChange={onCheckedChange} />
      </BrandProvider>,
    )
    const chave = await findByRole('switch')
    expect(chave.props.accessibilityState.checked).toBe(true)
    await fireEvent.press(chave)
    expect(onCheckedChange).toHaveBeenCalledWith(false)
    // Efeito visível, não só a chamada: sem `checked` controlado de fora, o próprio Switch
    // atualiza o estado interno.
    expect(chave.props.accessibilityState.checked).toBe(false)
  })

  it('carrega dataSet.rendra = SWT-001 na raiz (item D12 do levantamento da Sincronizacao 1)', async () => {
    const { container } = await render(
      <BrandProvider>
        <Switch label="Notificações" checked onCheckedChange={() => {}} />
      </BrandProvider>,
    )
    expect(nodesWithCode(container, 'SWT-001')).toHaveLength(1)
  })
})
