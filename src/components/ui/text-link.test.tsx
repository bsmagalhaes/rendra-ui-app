import { render, fireEvent } from '@testing-library/react-native'
import { Text } from 'react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { RendraNavigationProvider } from '../../navigation/rendra-navigation'
import type { RendraLinkProps } from '../../navigation/rendra-navigation'
import { nodesWithCode } from '../../test-utils/rendra-code'
import { TextLink } from './text-link'

function classesDe(no: { props: Record<string, unknown> }) {
  return String(no.props.className ?? '').split(' ')
}

describe('TextLink', () => {
  it('é um link com o rótulo, com alvo de toque de 44 px e o código LINK-001', async () => {
    const { findByRole, container } = await render(
      <BrandProvider>
        <RendraNavigationProvider value={{ navigate: () => {} }}>
          <TextLink href="/esqueci-senha">Esqueci a senha</TextLink>
        </RendraNavigationProvider>
      </BrandProvider>,
    )
    const link = await findByRole('link', { name: 'Esqueci a senha' })
    expect(classesDe(link)).toContain('min-h-touch')
    expect(nodesWithCode(container, 'LINK-001')).toHaveLength(1)
  })

  it('sem roteador no contexto de links, o toque chama navigate(href)', async () => {
    const navigate = jest.fn()
    const { findByRole } = await render(
      <BrandProvider>
        <RendraNavigationProvider value={{ navigate }}>
          <TextLink href="/cadastre-se">Criar conta</TextLink>
        </RendraNavigationProvider>
      </BrandProvider>,
    )
    await fireEvent.press(await findByRole('link', { name: 'Criar conta' }))
    expect(navigate).toHaveBeenCalledWith('/cadastre-se')
  })

  it('com linkComponent usa o link do roteador com o href e não chama navigate', async () => {
    const navigate = jest.fn()
    function LinkFalso({ href, children }: RendraLinkProps) {
      return <Text testID="link-falso">{`${href}|`}{children}</Text>
    }
    const { findByTestId, findByRole } = await render(
      <BrandProvider>
        <RendraNavigationProvider value={{ navigate, linkComponent: LinkFalso }}>
          <TextLink href="/login">Entrar</TextLink>
        </RendraNavigationProvider>
      </BrandProvider>,
    )
    expect(String((await findByTestId('link-falso')).props.children[0])).toBe('/login|')
    await fireEvent.press(await findByRole('link', { name: 'Entrar' }))
    expect(navigate).not.toHaveBeenCalled()
  })

  it('align: o padrão fica à esquerda (self-start) e "end" vai para a direita (self-end)', async () => {
    const { findByRole, rerender } = await render(
      <BrandProvider>
        <RendraNavigationProvider value={{ navigate: () => {} }}>
          <TextLink href="/x">Padrão</TextLink>
        </RendraNavigationProvider>
      </BrandProvider>,
    )
    const padrao = classesDe(await findByRole('link', { name: 'Padrão' }))
    expect(padrao).toContain('self-start')
    expect(padrao).not.toContain('self-end')
    await rerender(
      <BrandProvider>
        <RendraNavigationProvider value={{ navigate: () => {} }}>
          <TextLink href="/x" align="end">
            Direita
          </TextLink>
        </RendraNavigationProvider>
      </BrandProvider>,
    )
    const direita = classesDe(await findByRole('link', { name: 'Direita' }))
    expect(direita).toContain('self-end')
    expect(direita).not.toContain('self-start')
  })

  it('o texto usa a cor de texto da primária (primary-text)', async () => {
    const { findByText } = await render(
      <BrandProvider>
        <RendraNavigationProvider value={{ navigate: () => {} }}>
          <TextLink href="/x">Cor</TextLink>
        </RendraNavigationProvider>
      </BrandProvider>,
    )
    expect(classesDe(await findByText('Cor'))).toContain('text-primary-text')
  })
})
