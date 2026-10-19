import { Children, cloneElement, Fragment, isValidElement, useContext, useEffect, useRef } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { View, type ViewProps } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '../internal/text'
import { InfoHint } from '../ui/info-hint'
import { ShellContext } from '../app-shell/shell-context'
import { useRendraNavigation } from '../../navigation/rendra-navigation'
import { cn } from '../../lib/cn'
import { a11yPresets } from '../../lib/a11y'

export interface PageHeaderProps extends ViewProps {
  title: ReactNode
  showTitle?: boolean
  /**
   * Dentro do `AppShell`, mostra também o título (discreto, `text-base`) no topo do corpo, para
   * quando o cabeçalho do shell o esconde (por exemplo com `headerLogo`). O título continua
   * subindo ao cabeçalho. Padrão `false`. Fora do shell não tem efeito: o título já é o do corpo.
   */
  bodyTitle?: boolean
  /** `'start'` (padrão) ou `'center'`: centraliza título e descrição. */
  align?: 'start' | 'center'
  /**
   * Fora do shell, soma o inset superior da área segura ao topo (padrão `true`). Com `false`,
   * o topo fica sem esse respiro, para quem já o reserva por fora. Dentro do shell o cabeçalho
   * dele é o dono do inset e esta prop não muda nada.
   *
   * A margem negativa de baixo (`-mb-2`) não tem prop: passe `className="mb-0"`, que vence.
   */
  inset?: boolean
  description?: ReactNode
  help?: ReactNode
  actions?: ReactNode
  children?: ReactNode
}

// Equivalente RN da técnica sr-only do web: visível a leitor de tela, invisível na tela.
// Sem opacity-0: alpha 0 também esconde o nó do TalkBack/VoiceOver, o que anularia o objetivo.
const visuallyHiddenClassName = 'absolute h-px w-px overflow-hidden'

export function PageHeader({
  title,
  showTitle = false,
  bodyTitle = false,
  align = 'start',
  inset = true,
  description,
  help,
  actions,
  children,
  className,
  ...rest
}: PageHeaderProps) {
  const insets = useSafeAreaInsets()
  // Fora do AppShell o contexto é nulo e o componente se comporta como sempre.
  const shell = useContext(ShellContext)
  const setPageMeta = shell?.setPageMeta
  const titleText = typeof title === 'string' ? title : undefined
  const helpText = typeof help === 'string' ? help : undefined

  // Dentro do shell, título e ajuda em texto vão para o cabeçalho (só strings: um `ReactNode`
  // novo a cada render entraria em laço com o estado do shell).
  // Cada tela reivindica uma rota para o título (ver R2 abaixo) e nunca a de outra tela.
  const { currentPath } = useRendraNavigation()
  // R2 (validação da entrega do P3): num push, o roteador ainda entrega o pathname antigo no
  // primeiro render da tela nova. A tela reivindica a rota da montagem e, se a rota mudar enquanto
  // ela ainda está com esse valor, adota a nova, mas só enquanto a tela é recém-montada (antes do primeiro `setTimeout`). A tela
  // que fica por baixo na pilha já passou desse ponto, então não reivindica a rota alheia.
  const mountPath = useRef(currentPath)
  const claimed = useRef<string | undefined>(undefined)
  const settled = useRef(false)
  useEffect(() => {
    const id = setTimeout(() => {
      settled.current = true
    }, 0)
    return () => clearTimeout(id)
  }, [])
  useEffect(() => {
    if (!setPageMeta) return
    if (claimed.current === undefined || (!settled.current && claimed.current === mountPath.current)) claimed.current = currentPath
    setPageMeta({ title: titleText, help: helpText, path: claimed.current })
    return () => setPageMeta(null)
  }, [setPageMeta, titleText, helpText, currentPath])

  const helpInShell = Boolean(shell) && helpText !== undefined
  const inlineHelp =
    help && !helpInShell ? (
      <InfoHint title={typeof title === 'string' ? title : 'Sobre esta tela'}>{help}</InfoHint>
    ) : null
  // No shell o título visível é o do cabeçalho; aqui fica só o título semântico, oculto.
  // Com `bodyTitle`, dentro do shell, o título também aparece no corpo, discreto.
  const shellBodyTitle = Boolean(shell) && bodyTitle
  const titleVisible = (!shell && (showTitle || Boolean(inlineHelp))) || shellBodyTitle
  const visible =
    (!shell && showTitle) ||
    shellBodyTitle ||
    Boolean(description) ||
    Boolean(actions) ||
    Boolean(children) ||
    Boolean(inlineHelp)
  const centered = align === 'center'

  return (
    <View
      className={cn('-mb-2 flex-col gap-4', !visible && visuallyHiddenClassName, className)}
      style={{ paddingTop: shell || !inset ? 0 : Math.max(0, insets.top) }}
      {...rest}
    >
      <View className="flex-col gap-4">
        <View className={cn('flex-col gap-1', centered && 'items-center')}>
          <View className={cn('flex-row min-w-0 items-center gap-1', centered && 'justify-center')}>
            <Text
              weight="semibold"
              accessibilityRole={a11yPresets.header.accessibilityRole}
              className={
                titleVisible
                  ? cn('text-foreground', shellBodyTitle ? 'text-base' : 'text-2xl')
                  : visuallyHiddenClassName
              }
            >
              {title}
            </Text>
            {inlineHelp}
          </View>
          {description && <Text className={cn('text-sm text-muted-foreground', centered && 'text-center')}>{description}</Text>}
        </View>
        {actions && (
          <View className="w-full flex-row gap-3">
            {(() => {
              const actionItems =
                isValidElement(actions) && actions.type === Fragment
                  ? (actions.props as { children?: ReactNode }).children
                  : actions
              return Children.map(actionItems, (action) =>
                isValidElement(action)
                  ? cloneElement(action as ReactElement<{ className?: string }>, {
                      className: cn((action.props as { className?: string }).className, 'flex-1'),
                    })
                  : action,
              )
            })()}
          </View>
        )}
      </View>
      {children}
    </View>
  )
}
