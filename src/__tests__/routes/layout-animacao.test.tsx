import { renderRouter, waitFor } from 'expo-router/testing-library'
import { Text } from 'react-native'
import RootLayout from '../../../app/_layout'

// A15: o efeito que o usuário vê é a opção que o Stack recebe. O Stack é trocado por um espião só
// para ler `screenOptions`; o restante do layout raiz roda de verdade.
const mockStackOptions: { current?: Record<string, unknown> } = {}

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve(true)),
  setOptions: jest.fn(),
  hideAsync: jest.fn(() => Promise.resolve()),
}))
jest.mock('expo', () => ({ ...jest.requireActual('expo'), isRunningInExpoGo: () => false }))
jest.mock('expo-router', () => {
  const actual = jest.requireActual('expo-router')
  const { View } = jest.requireActual('react-native')
  return {
    ...actual,
    Stack: ({ screenOptions }: { screenOptions: Record<string, unknown> }) => {
      mockStackOptions.current = screenOptions
      return <View testID="stack-espiao" />
    },
  }
})
jest.mock('../../lib/reduced-motion', () => ({ useReducedMotion: jest.fn(() => false) }))
// eslint-disable-next-line import/first
import { useReducedMotion } from '../../lib/reduced-motion'

const mockReduced = useReducedMotion as jest.Mock

describe('RootLayout: transição de tela sob movimento reduzido (A15)', () => {
  it('sem movimento reduzido, a animação é a padrão', async () => {
    mockReduced.mockReturnValue(false)
    await renderRouter({ _layout: RootLayout, index: () => <Text>Tela</Text> }, { initialUrl: '/' })
    await waitFor(() => expect(mockStackOptions.current).toBeDefined())
    expect(mockStackOptions.current).toMatchObject({ headerShown: false, animation: 'default' })
  })

  it('com movimento reduzido, a troca de tela é fade', async () => {
    mockReduced.mockReturnValue(true)
    await renderRouter({ _layout: RootLayout, index: () => <Text>Tela</Text> }, { initialUrl: '/' })
    await waitFor(() => expect(mockStackOptions.current).toMatchObject({ animation: 'fade' }))
  })
})
