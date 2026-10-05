import { AccessibilityInfo, Text as RNText } from 'react-native'
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { BottomSheet, bottomSheetTranslateY } from './bottom-sheet'
import { bordasSemCor } from '../../test-utils/bordas'
import { Text } from './text'
import { BrandProvider } from '../../brand/brand-provider'
import * as ReducedMotionModule from '../../lib/reduced-motion'

jest.mock('../../lib/reduced-motion', () => ({ useReducedMotion: jest.fn(() => false) }))

describe('BottomSheet', () => {
  it('não renderiza os filhos quando fechado', async () => {
    const { queryByText } = await render(
      <BottomSheet open={false} onOpenChange={() => {}}>
        <RNText>Conteúdo</RNText>
      </BottomSheet>,
    )
    expect(queryByText('Conteúdo')).toBeNull()
  })

  it('renderiza os filhos quando aberto', async () => {
    const { findByText } = await render(
      <BottomSheet open onOpenChange={() => {}}>
        <RNText>Conteúdo</RNText>
      </BottomSheet>,
    )
    expect(await findByText('Conteúdo')).toBeTruthy()
  })

  it('toque fora fecha (chama onOpenChange(false))', async () => {
    const onOpenChange = jest.fn()
    const { findByTestId } = await render(
      <BottomSheet open onOpenChange={onOpenChange} testID="folha">
        <RNText>Conteúdo</RNText>
      </BottomSheet>,
    )
    const overlay = await findByTestId('folha-overlay')
    await fireEvent.press(overlay)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('achado do Playwright (test:a11y): o overlay de fechar tem accessibilityRole button', async () => {
    // axe (WCAG "aria-prohibited-attr") reprovava esse overlay no export web real: sem
    // accessibilityRole, o react-native-web renderiza um <div> sem role, e aria-label num
    // elemento sem role válido é proibido pela especificação ARIA (mesmo achado já corrigido
    // no Input/Select, Tarefa 22/24).
    const { findByTestId } = await render(
      <BottomSheet open onOpenChange={() => {}} testID="folha">
        <RNText>Conteúdo</RNText>
      </BottomSheet>,
    )
    const overlay = await findByTestId('folha-overlay')
    expect(overlay.props.accessibilityRole).toBe('button')
  })

  it('arrastar a folha para baixo além do limite fecha', async () => {
    const onOpenChange = jest.fn()
    await render(
      <BottomSheet open onOpenChange={onOpenChange} testID="folha">
        <RNText>Conteúdo</RNText>
      </BottomSheet>,
    )
    const gesture = getByGestureTestId('folha-drag-handle')
    fireGestureHandler(gesture, [{ translationY: 0 }, { translationY: 120 }, { state: 5, translationY: 140 }])
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it('anuncia a abertura para o leitor de tela', async () => {
    const announceSpy = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {})
    await render(
      <BottomSheet open onOpenChange={() => {}} accessibilityLabel="Menu de ações">
        <RNText>Conteúdo</RNText>
      </BottomSheet>,
    )
    expect(announceSpy).toHaveBeenCalledWith('Menu de ações')
    announceSpy.mockRestore()
  })

  it('não dispara a entrada de novo quando reducedMotion muda com a folha já aberta (melhoria do veredito do fechamento)', async () => {
    // reducedMotion resolve de forma assíncrona na vida real (AccessibilityInfo.isReduceMotionEnabled
    // é uma Promise, useReducedMotion.ts:9): o valor pode mudar depois que a folha já está aberta e
    // assentada, sem que o usuário tenha reaberto nada. Antes da correção, reducedMotion nas
    // dependências do useEffect de entrada disparava a animação e o anúncio de novo nesse
    // momento; a folha deve continuar como estava.
    const useReducedMotionMock = ReducedMotionModule.useReducedMotion as jest.Mock
    useReducedMotionMock.mockReturnValue(false)
    const announceSpy = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {})
    const { rerender } = await render(
      <BottomSheet open onOpenChange={() => {}} accessibilityLabel="Painel">
        <RNText>Conteúdo</RNText>
      </BottomSheet>,
    )
    await waitFor(() => expect(announceSpy).toHaveBeenCalledTimes(1))

    useReducedMotionMock.mockReturnValue(true)
    await rerender(
      <BottomSheet open onOpenChange={() => {}} accessibilityLabel="Painel">
        <RNText>Conteúdo</RNText>
      </BottomSheet>,
    )

    expect(announceSpy).toHaveBeenCalledTimes(1)
    announceSpy.mockRestore()
    useReducedMotionMock.mockReturnValue(false)
  })

  it('renderiza header e footer fora da área rolável', async () => {
    const { findByText } = await render(
      <BrandProvider>
        <BottomSheet
          open
          onOpenChange={() => {}}
          testID="folha"
          header={<Text className="text-popover-foreground">Cabeçalho</Text>}
          footer={<Text className="text-popover-foreground">Rodapé</Text>}
        >
          <Text className="text-popover-foreground">Conteúdo</Text>
        </BottomSheet>
      </BrandProvider>,
    )
    expect(await findByText('Cabeçalho')).toBeTruthy()
    expect(await findByText('Rodapé')).toBeTruthy()
    expect(await findByText('Conteúdo')).toBeTruthy()
  })

  it('com scrollable padrão, a área rolável tem tabIndex 0', async () => {
    const { findByTestId } = await render(
      <BrandProvider>
        <BottomSheet open onOpenChange={() => {}} testID="folha">
          <Text className="text-popover-foreground">Conteúdo</Text>
        </BottomSheet>
      </BrandProvider>,
    )
    const rolagem = await findByTestId('folha-rolagem')
    expect(rolagem.props.tabIndex).toBe(0)
  })

  it('com scrollable={false} não renderiza a área rolável própria, o children é quem rola', async () => {
    const { queryByTestId } = await render(
      <BrandProvider>
        <BottomSheet open onOpenChange={() => {}} testID="folha" scrollable={false}>
          <Text className="text-popover-foreground">Lista própria</Text>
        </BottomSheet>
      </BrandProvider>,
    )
    expect(queryByTestId('folha-rolagem')).toBeNull()
  })

  it('envolve o conteúdo em KeyboardAvoidingView com behavior padding', async () => {
    const { findByTestId } = await render(
      <BrandProvider>
        <BottomSheet open onOpenChange={() => {}} testID="folha">
          <Text className="text-popover-foreground">Conteúdo</Text>
        </BottomSheet>
      </BrandProvider>,
    )
    expect(await findByTestId('folha-teclado')).toBeTruthy()
  })

  describe('bottomSheetTranslateY (bloqueador 2 do veredito do fechamento)', () => {
    // Função pura com 'worklet', mesmo padrão de `thumbTranslateX` (Slider, Tarefa 24): o
    // antigo `translateY.set(0)` da entrada colocava a folha direto na posição final, sem
    // nenhuma entrada de fato (o valor já nascia em 0). Testar a fórmula isolada evita uma
    // limitação já enfrentada no Slider: consultar `.props.style`/`getAnimatedStyle()` de um
    // `Animated.View` via RNTL depois que um `useEffect` muda o `SharedValue` num render já
    // montado não reflete o valor novo sob o mock de `useAnimatedStyle`.
    it('fase "closed": fica na altura da janela, fora da tela (posição inicial da entrada)', () => {
      expect(bottomSheetTranslateY('closed', 812)).toBe(812)
      expect(bottomSheetTranslateY('closed', 0)).toBe(0)
    })

    it('fase "settled": fica em 0, assentada no lugar (posição final da entrada)', () => {
      expect(bottomSheetTranslateY('settled', 812)).toBe(0)
      expect(bottomSheetTranslateY('settled', 0)).toBe(0)
    })
  })

  it('animationType continua "none" no RNModal (achado do veredito: necessário para role="dialog" no export web, ModalAnimation.js)', async () => {
    const { findByTestId } = await render(
      <BottomSheet open onOpenChange={() => {}} testID="folha">
        <RNText>Conteúdo</RNText>
      </BottomSheet>,
    )
    const modal = await findByTestId('folha')
    expect(modal.props.animationType).toBe('none')
  })
})


describe('BottomSheet: borda com a cor do token', () => {
  it('a borda superior da folha usa border-border (não preta)', async () => {
    const { container } = await render(
      <BottomSheet open onOpenChange={() => {}}>
        <RNText>Conteúdo</RNText>
      </BottomSheet>,
    )
    expect(bordasSemCor(container)).toEqual([])
    expect(container.queryAll((no) => String(no.props.className ?? '').split(' ').includes('border-border'))).toHaveLength(1)
  })
})
