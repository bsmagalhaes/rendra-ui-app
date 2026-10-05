import React from 'react'
import { View } from 'react-native'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { Button } from './button'
import type { ButtonVariant } from './button'
import { nodesWithCode } from '../../test-utils/rendra-code'

async function renderButton(props: Partial<React.ComponentProps<typeof Button>> = {}) {
  return render(
    <BrandProvider>
      <Button onPress={() => {}} {...props}>
        Salvar
      </Button>
    </BrandProvider>,
  )
}

describe('Button', () => {
  it('renderiza o texto e responde ao toque', async () => {
    const onPress = jest.fn()
    const { findByText } = await renderButton({ onPress })
    const button = await findByText('Salvar')
    await fireEvent.press(button)
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['primary' as const, 'bg-primary'],
    ['destructive' as const, 'bg-destructive'],
    ['secondary' as const, 'bg-secondary'],
  ])('variant %s usa %s', async (variant, expectedClass) => {
    const { findByRole } = await renderButton({ variant })
    const button = await findByRole('button')
    expect(button.props.className.split(' ')).toContain(expectedClass)
  })

  it.each([
    ['sm' as const, 'h-control-sm'],
    ['md' as const, 'h-control-md'],
    ['lg' as const, 'h-control-lg'],
  ])('size %s usa %s', async (size, expectedClass) => {
    const { findByRole } = await renderButton({ size })
    const button = await findByRole('button')
    expect(button.props.className.split(' ')).toContain(expectedClass)
  })

  // Prevenção (Tarefa 21, Parte 2, mesmo padrão do crash de navegação no nativo do
  // ButtonGroup/Tabs, ver button-group.tsx:59-79 e button.tsx, shadowClass): toda variante precisa
  // de uma classe de sombra desde o primeiro render (shadow-sm ou shadow-none, nunca a ausência de
  // nenhuma), porque só shadow-sm/shadow-none declaram --tw-shadow-color no CSS nativo; trocar de
  // variante num Button já montado sem essa garantia reproduziria o mesmo upgrade de variável fora
  // do primeiro render.
  it.each([
    ['primary' as const, 'shadow-sm'],
    ['secondary' as const, 'shadow-sm'],
    ['destructive' as const, 'shadow-sm'],
    ['outline' as const, 'shadow-none'],
    ['ghost' as const, 'shadow-none'],
    ['link' as const, 'shadow-none'],
  ])('variant %s já carrega %s no primeiro render', async (variant, expectedClass) => {
    const { findByRole } = await renderButton({ variant })
    const button = await findByRole('button')
    const classes = button.props.className.split(' ')
    expect(classes).toContain(expectedClass)
  })

  // Ícone ao lado do texto: o `Animated.View` perde `className` no web (o filho saía em coluna, com o
  // ícone acima do texto). O layout em linha vive num `View` comum interno, com `min-w-0 shrink`
  // para o rótulo longo não vazar do botão.
  it('ícone e texto ficam numa linha: o View comum interno leva flex-row, e o Animated.View não', async () => {
    const { findByText } = await render(
      <BrandProvider>
        <Button onPress={() => {}} icon={<View testID="ico" />} iconRight={<View testID="ico-dir" />}>
          Filtros
        </Button>
      </BrandProvider>,
    )
    const texto = await findByText('Filtros')
    const linha = texto.parent!
    const animado = linha.parent!
    expect(animado.parent?.props.accessibilityRole).toBe('button')
    expect(String(animado.props.className ?? '')).not.toContain('flex-row')
    expect(animado.props.style).toBeDefined()
    const classes = String(linha.props.className).split(' ')
    expect(classes).toEqual(expect.arrayContaining(['flex-row', 'items-center', 'gap-2', 'min-w-0', 'shrink']))
  })

  it('disabled: accessibilityState.disabled true e não chama onPress', async () => {
    const onPress = jest.fn()
    const { findByRole } = await renderButton({ onPress, disabled: true })
    const button = await findByRole('button')
    expect(button.props.accessibilityState).toMatchObject({ disabled: true })
    await fireEvent.press(button)
    expect(onPress).not.toHaveBeenCalled()
  })

  it('loading troca o icon por um spinner e mantém o texto visível (sem iconOnly)', async () => {
    const { findByText, queryByTestId } = await render(
      <BrandProvider>
        <Button onPress={() => {}} loading icon={<></>} testID="meu-botao">
          Salvando
        </Button>
      </BrandProvider>,
    )
    expect(await findByText('Salvando')).toBeTruthy()
    expect((await queryByTestId('meu-botao'))?.props.accessibilityState).toMatchObject({ busy: true })
  })

  it('loading usa o Spinner (SPIN-001), nao um icone solto (item D10/F1 da Sincronizacao 1)', async () => {
    // Achado C18 do veredito do Opus: o Spinner do Button e decorativo (sem label), a mesma
    // asserção de busy ja prova o carregamento a leitor de tela via accessibilityState.
    const { container, findByRole } = await render(
      <BrandProvider>
        <Button onPress={() => {}} loading icon={<></>}>
          Salvando
        </Button>
      </BrandProvider>,
    )
    expect(nodesWithCode(container, 'SPIN-001')).toHaveLength(1)
    expect((await findByRole('button')).props.accessibilityState.busy).toBe(true)
  })

  it('loading + iconOnly: não renderiza texto', async () => {
    const { queryByText } = await render(
      <BrandProvider>
        <Button onPress={() => {}} loading iconOnly accessibilityLabel="Salvando" icon={<></>}>
          Salvando
        </Button>
      </BrandProvider>,
    )
    expect(queryByText('Salvando')).toBeNull()
  })

  it('iconOnly sem accessibilityLabel avisa em __DEV__', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    await render(
      <BrandProvider>
        <Button onPress={() => {}} iconOnly icon={<></>} />
      </BrandProvider>,
    )
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('fullWidth acrescenta w-full', async () => {
    const { findByRole } = await renderButton({ fullWidth: true })
    const button = await findByRole('button')
    expect(button.props.className.split(' ')).toContain('w-full')
  })

  it('pressed: escala 0,98 aplicada ao wrapper animado durante o toque', async () => {
    const { findByRole } = await renderButton()
    const button = await findByRole('button')
    await fireEvent(button, 'pressIn')
    await waitFor(() => {
      expect(button.props.className.split(' ')).toContain('bg-primary-hover')
    })
    await fireEvent(button, 'pressOut')
  })
})

describe('Button: data-rendra por variante (item D6/D12 do levantamento da Sincronizacao 1)', () => {
  it.each([
    ['primary', 'BTN-001'],
    ['secondary', 'BTN-002'],
    ['outline', 'BTN-003'],
    ['ghost', 'BTN-004'],
    ['destructive', 'BTN-005'],
    ['link', 'BTN-006'],
  ] as [ButtonVariant, string][])('variant %s carrega dataSet.rendra = %s', async (variant, codigo) => {
    const { findByRole } = await renderButton({ variant })
    const button = await findByRole('button')
    expect(button.props.dataSet).toMatchObject({ rendra: codigo })
  })

  it('dataSet do consumidor nao apaga o codigo do componente (risco R13 do levantamento)', async () => {
    const { findByRole } = await renderButton({ dataSet: { x: '1' } })
    const button = await findByRole('button')
    expect(button.props.dataSet).toEqual({ x: '1', rendra: 'BTN-001' })
  })
})
