import { Text } from 'react-native'
import { render } from '@testing-library/react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { nodesWithCode } from '../../test-utils/rendra-code'
import { AuthScreen } from './auth-screen'

describe('AuthScreen', () => {
  it('mostra o AuthLayout com as props repassadas (título, descrição e filhos acessíveis)', async () => {
    const { findByText } = await render(
      <BrandProvider>
        <AuthScreen title="Acesse sua conta" description="Entre para continuar">
          <Text>Formulário</Text>
        </AuthScreen>
      </BrandProvider>,
    )
    expect(await findByText('Acesse sua conta')).toBeTruthy()
    expect(await findByText('Entre para continuar')).toBeTruthy()
    expect(await findByText('Formulário')).toBeTruthy()
  })

  it('tem o próprio SafeAreaView (safe-area-tela) só com o inset superior e o código AUTH-001', async () => {
    const { findByTestId, container } = await render(
      <BrandProvider>
        <AuthScreen title="Entrar">
          <Text>Formulário</Text>
        </AuthScreen>
      </BrandProvider>,
    )
    const area = await findByTestId('safe-area-tela')
    expect(area.props.edges.top).toBe('additive')
    expect(area.props.edges.bottom).toBe('off')
    expect(nodesWithCode(container, 'AUTH-001')).toHaveLength(1)
  })

  it('rola e mantém o toque nos campos com o teclado aberto (keyboardShouldPersistTaps="handled")', async () => {
    const { container } = await render(
      <BrandProvider>
        <AuthScreen title="Entrar">
          <Text>Formulário</Text>
        </AuthScreen>
      </BrandProvider>,
    )
    expect(container.queryAll((no) => no.props.keyboardShouldPersistTaps === 'handled').length).toBeGreaterThan(0)
  })
})
