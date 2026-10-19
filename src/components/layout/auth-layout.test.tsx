import { Linking, Text } from 'react-native'
import { fireEvent, render } from '@testing-library/react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { RendraNavigationProvider } from '../../navigation/rendra-navigation'
import type { RendraLinkProps } from '../../navigation/rendra-navigation'
import { nodesWithCode } from '../../test-utils/rendra-code'
import { RENDRA_CREDIT_HREF } from '../ui/rendra-credit'
import { models } from '../../theme/models'
import { AuthLayout, backIconClass } from './auth-layout'

afterEach(() => {
  jest.restoreAllMocks()
})

describe('AuthLayout', () => {
  it('mostra título, conteúdo e o crédito no rodapé', async () => {
    const { container, findByText, findByRole } = await render(
      <BrandProvider>
        <AuthLayout title="Entrar">
          <Text>Formulário</Text>
        </AuthLayout>
      </BrandProvider>,
    )
    const titulo = await findByText('Entrar')
    expect(titulo.props.accessibilityRole).toBe('header')
    expect(await findByText('Formulário')).toBeTruthy()
    expect(await findByRole('link', { name: 'Feito com Rendra' })).toBeTruthy()
    expect(nodesWithCode(container, 'CRED-001')).toHaveLength(1)
  })

  it('mostra a descrição quando informada', async () => {
    const { findByText } = await render(
      <BrandProvider>
        <AuthLayout title="Entrar" description="Acesse com seu e-mail.">
          <Text>Formulário</Text>
        </AuthLayout>
      </BrandProvider>,
    )
    expect(await findByText('Acesse com seu e-mail.')).toBeTruthy()
  })

  it('o painel de marca leva o logotipo, a frase do modelo e um só degradê', async () => {
    const { container, findByText } = await render(
      <BrandProvider>
        <AuthLayout title="Entrar">
          <Text>Formulário</Text>
        </AuthLayout>
      </BrandProvider>,
    )
    await findByText('Formulário')
    expect(nodesWithCode(container, 'LOGO-001')).toHaveLength(1)
    const degrades = container.queryAll((no) => String(no.props.testID ?? '').startsWith('gradient-'))
    expect(degrades).toHaveLength(1)
  })

  it('credit={false} tira o crédito; texto e link próprios substituem os do Rendra', async () => {
    const spy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never)
    const sem = await render(
      <BrandProvider>
        <AuthLayout title="Entrar" credit={false}>
          <Text>Formulário</Text>
        </AuthLayout>
      </BrandProvider>,
    )
    await sem.findByText('Formulário')
    expect(sem.queryByRole('link', { name: 'Feito com Rendra' })).toBeNull()
    await sem.unmount()

    const proprio = await render(
      <BrandProvider>
        <AuthLayout title="Entrar" creditText="Feito com Zuper" creditHref="https://zuper.com.br">
          <Text>Formulário</Text>
        </AuthLayout>
      </BrandProvider>,
    )
    await fireEvent.press(await proprio.findByRole('link', { name: 'Feito com Zuper' }))
    expect(spy).toHaveBeenCalledWith('https://zuper.com.br')
    expect(spy).not.toHaveBeenCalledWith(RENDRA_CREDIT_HREF)
  })

  it('o rodapé (footer) aparece antes do crédito', async () => {
    const { container, findByText } = await render(
      <BrandProvider>
        <AuthLayout title="Entrar" footer={<Text>Ainda não tem conta?</Text>}>
          <Text>Formulário</Text>
        </AuthLayout>
      </BrandProvider>,
    )
    await findByText('Ainda não tem conta?')
    // ordem de leitura na árvore: conteúdo, footer, crédito
    const textos = container
      .queryAll((no) => typeof no.props.children === 'string')
      .map((no) => no.props.children as string)
    const posicao = (texto: string) => textos.indexOf(texto)
    expect(posicao('Formulário')).toBeGreaterThanOrEqual(0)
    expect(posicao('Ainda não tem conta?')).toBeGreaterThan(posicao('Formulário'))
    expect(posicao('Feito com Rendra')).toBeGreaterThan(posicao('Ainda não tem conta?'))
  })

  it('back navega para o href informado', async () => {
    const navigate = jest.fn()
    const { findByRole } = await render(
      <BrandProvider>
        <RendraNavigationProvider value={{ navigate }}>
          <AuthLayout title="Nova senha" back={{ href: '/login', label: 'Voltar ao login' }}>
            <Text>Formulário</Text>
          </AuthLayout>
        </RendraNavigationProvider>
      </BrandProvider>,
    )
    await fireEvent.press(await findByRole('link', { name: 'Voltar ao login' }))
    expect(navigate).toHaveBeenCalledWith('/login')
  })

  it('com linkComponent, o back usa o link do roteador (href de verdade) em vez de navigate', async () => {
    const navigate = jest.fn()
    function LinkFalso({ href, children }: RendraLinkProps) {
      return <Text testID="link-falso">{`${href}|`}{children}</Text>
    }
    const { findByTestId } = await render(
      <BrandProvider>
        <RendraNavigationProvider value={{ navigate, linkComponent: LinkFalso }}>
          <AuthLayout title="Nova senha" back={{ href: '/login', label: 'Voltar ao login' }}>
            <Text>Formulário</Text>
          </AuthLayout>
        </RendraNavigationProvider>
      </BrandProvider>,
    )
    const link = await findByTestId('link-falso')
    expect(String(link.props.children[0])).toBe('/login|')
    expect(navigate).not.toHaveBeenCalled()
  })

  it('sem back não mostra link de voltar', async () => {
    const { findByText, queryByRole } = await render(
      <BrandProvider>
        <AuthLayout title="Entrar">
          <Text>Formulário</Text>
        </AuthLayout>
      </BrandProvider>,
    )
    await findByText('Formulário')
    expect(queryByRole('link', { name: /Voltar/ })).toBeNull()
  })

  describe('align, gap, onBack, backHref e headerBackground', () => {
    const classesDe = (no: { props: Record<string, unknown> }) => String(no.props.className ?? '').split(' ')

    it('padrão: tudo à esquerda e os gap-6 de hoje na raiz e na coluna', async () => {
      const { findByText, container } = await render(
        <BrandProvider>
          <AuthLayout title="Entrar" description="Acesse">
            <Text>Formulário</Text>
          </AuthLayout>
        </BrandProvider>,
      )
      await findByText('Formulário')
      expect(classesDe(await findByText('Entrar'))).not.toContain('text-center')
      expect(classesDe(await findByText('Acesse'))).not.toContain('text-center')
      const comGap6 = container.queryAll((no) => classesDe(no).includes('gap-6'))
      expect(comGap6.length).toBeGreaterThanOrEqual(2)
    })

    it('align="center" centraliza título, descrição, frase do modelo e logo', async () => {
      const { findByText, container } = await render(
        <BrandProvider>
          <AuthLayout title="Entrar" description="Acesse" align="center">
            <Text>Formulário</Text>
          </AuthLayout>
        </BrandProvider>,
      )
      await findByText('Formulário')
      expect(classesDe(await findByText('Entrar'))).toContain('text-center')
      expect(classesDe(await findByText('Acesse'))).toContain('text-center')
      const bloco = classesDe((await findByText('Entrar')).parent as unknown as { props: Record<string, unknown> })
      expect(bloco).toContain('items-center')
      // o painel do logo: o contêiner do logo e da frase também centraliza
      const logo = nodesWithCode(container, 'LOGO-001')[0]!
      expect(classesDe(logo.parent as unknown as { props: Record<string, unknown> })).toContain('items-center')
    })

    it('gap="fields" dá gap-4 e gap="section" dá gap-8, na raiz e na coluna, no lugar do gap-6', async () => {
      const { findByText, container, rerender } = await render(
        <BrandProvider>
          <AuthLayout title="Entrar" gap="fields">
            <Text>Formulário</Text>
          </AuthLayout>
        </BrandProvider>,
      )
      await findByText('Formulário')
      expect(container.queryAll((no) => classesDe(no).includes('gap-4') && classesDe(no).includes('w-full')).length).toBeGreaterThanOrEqual(2)
      expect(container.queryAll((no) => classesDe(no).includes('gap-6') && classesDe(no).includes('w-full'))).toHaveLength(0)
      await rerender(
        <BrandProvider>
          <AuthLayout title="Entrar" gap="section">
            <Text>Formulário</Text>
          </AuthLayout>
        </BrandProvider>,
      )
      expect(container.queryAll((no) => classesDe(no).includes('gap-8') && classesDe(no).includes('w-full')).length).toBeGreaterThanOrEqual(2)
    })

    it('onBack: botão só com ícone, rótulo "Voltar", chama o callback ao toque', async () => {
      const onBack = jest.fn()
      const { findByRole } = await render(
        <BrandProvider>
          <AuthLayout title="Entrar" onBack={onBack}>
            <Text>Formulário</Text>
          </AuthLayout>
        </BrandProvider>,
      )
      const botao = await findByRole('button', { name: 'Voltar' })
      expect(classesDe(botao)).toContain('size-touch')
      await fireEvent.press(botao)
      expect(onBack).toHaveBeenCalledTimes(1)
    })

    it('backHref navega; com linkComponent usa o link do roteador (href de verdade)', async () => {
      const navigate = jest.fn()
      const sem = await render(
        <BrandProvider>
          <RendraNavigationProvider value={{ navigate }}>
            <AuthLayout title="Entrar" backHref="/login">
              <Text>Formulário</Text>
            </AuthLayout>
          </RendraNavigationProvider>
        </BrandProvider>,
      )
      await fireEvent.press(await sem.findByRole('link', { name: 'Voltar' }))
      expect(navigate).toHaveBeenCalledWith('/login')
      await sem.unmount()
      function LinkFalso({ href, children }: RendraLinkProps) {
        return <Text testID="link-falso">{`${href}|`}{children}</Text>
      }
      navigate.mockClear()
      const com = await render(
        <BrandProvider>
          <RendraNavigationProvider value={{ navigate, linkComponent: LinkFalso }}>
            <AuthLayout title="Entrar" backHref="/login">
              <Text>Formulário</Text>
            </AuthLayout>
          </RendraNavigationProvider>
        </BrandProvider>,
      )
      expect(String((await com.findByTestId('link-falso')).props.children[0])).toBe('/login|')
      expect(navigate).not.toHaveBeenCalled()
    })

    it('onBack e backHref juntos: onBack vence (um só botão, sem navegar)', async () => {
      const onBack = jest.fn()
      const navigate = jest.fn()
      const { findByRole, queryAllByRole } = await render(
        <BrandProvider>
          <RendraNavigationProvider value={{ navigate }}>
            <AuthLayout title="Entrar" onBack={onBack} backHref="/login">
              <Text>Formulário</Text>
            </AuthLayout>
          </RendraNavigationProvider>
        </BrandProvider>,
      )
      await fireEvent.press(await findByRole('button', { name: 'Voltar' }))
      expect(onBack).toHaveBeenCalledTimes(1)
      expect(navigate).not.toHaveBeenCalled()
      expect(queryAllByRole('link', { name: 'Voltar' })).toHaveLength(0)
    })

    it('com back, o link de texto fica acima do título e o botão só com ícone no painel: os dois coexistem', async () => {
      const { findByRole } = await render(
        <BrandProvider>
          <RendraNavigationProvider value={{ navigate: jest.fn() }}>
            <AuthLayout title="Entrar" back={{ href: '/login', label: 'Voltar ao login' }} onBack={() => {}}>
              <Text>Formulário</Text>
            </AuthLayout>
          </RendraNavigationProvider>
        </BrandProvider>,
      )
      expect(await findByRole('link', { name: 'Voltar ao login' })).toBeTruthy()
      expect(await findByRole('button', { name: 'Voltar' })).toBeTruthy()
    })

    it('sem onBack nem backHref não há botão de voltar', async () => {
      const { findByText, queryByRole } = await render(
        <BrandProvider>
          <AuthLayout title="Entrar">
            <Text>Formulário</Text>
          </AuthLayout>
        </BrandProvider>,
      )
      await findByText('Formulário')
      expect(queryByRole('button', { name: 'Voltar' })).toBeNull()
    })

    it('headerBackground="none": nenhum degradê, logo sobre a superfície e frase em muted-foreground', async () => {
      const { findByText, container } = await render(
        <BrandProvider>
          <AuthLayout title="Entrar" headerBackground="none">
            <Text>Formulário</Text>
          </AuthLayout>
        </BrandProvider>,
      )
      await findByText('Formulário')
      expect(container.queryAll((no) => String(no.props.testID ?? '').startsWith('gradient-'))).toHaveLength(0)
      // BrandLogo on="surface": selo em bg-primary (no degradê seria bg-gradient-brand-foreground)
      expect(container.queryAll((no) => classesDe(no).includes('bg-primary')).length).toBeGreaterThan(0)
      expect(container.queryAll((no) => classesDe(no).includes('bg-gradient-brand-foreground'))).toHaveLength(0)
      expect(classesDe(await findByText(models.T1.tagline))).toContain('text-muted-foreground')
    })

    it('o ícone do botão de voltar usa o texto do degradê sobre o degradê e text-foreground sem ele', async () => {
      expect(backIconClass.gradient).toBe('text-gradient-brand-foreground')
      expect(backIconClass.none).toBe('text-foreground')
      const { findByRole, rerender } = await render(
        <BrandProvider>
          <AuthLayout title="Entrar" headerBackground="none" onBack={() => {}}>
            <Text>Formulário</Text>
          </AuthLayout>
        </BrandProvider>,
      )
      expect(await findByRole('button', { name: 'Voltar' })).toBeTruthy()
      await rerender(
        <BrandProvider>
          <AuthLayout title="Entrar" onBack={() => {}}>
            <Text>Formulário</Text>
          </AuthLayout>
        </BrandProvider>,
      )
      expect(await findByRole('button', { name: 'Voltar' })).toBeTruthy()
    })
  })
})
