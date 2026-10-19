import { Pressable } from 'react-native'
import { Text } from '../internal/text'
import { useRendraNavigation } from '../../navigation/rendra-navigation'
import { cn } from '../../lib/cn'

export interface TextLinkProps {
  href: string
  children: string
  /** Lado em que o link fica dentro do contêiner: `'start'` (padrão, esquerda) ou `'end'` (direita). */
  align?: 'start' | 'end'
}

/**
 * Link de texto das telas de autenticação ("Esqueci a senha", "Criar conta"): usa o `Link` do
 * roteador quando há um (preserva o `<a href>` no export web) e cai em `navigate` sem ele. Alvo
 * de toque de 44px.
 */
export function TextLink({ href, children, align = 'start' }: TextLinkProps) {
  const { navigate, linkComponent: LinkComponent } = useRendraNavigation()
  const conteudo = (
    <Pressable
      accessibilityRole="link"
      onPress={LinkComponent ? undefined : () => navigate(href)}
      className={cn('min-h-touch justify-center rounded-item', align === 'end' ? 'self-end' : 'self-start')}
      dataSet={{ rendra: 'LINK-001' }}
    >
      <Text weight="medium" className="text-sm text-primary-text">
        {children}
      </Text>
    </Pressable>
  )
  return LinkComponent ? (
    <LinkComponent href={href} asChild>
      {conteudo}
    </LinkComponent>
  ) : (
    conteudo
  )
}
