import { useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MoreHorizontal } from 'lucide-react-native'
import { Button } from './button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu'
import { cn } from '../../lib/cn'
import { ShellContext } from '../app-shell/shell-context'

export interface ActionBarAction {
  label: string
  onPress?: () => void
  icon?: ReactNode
  disabled?: boolean
  destructive?: boolean
  /**
   * Só vale em `secondary`. Padrão `false`: a ação vai ao menu "Mais ações", como sempre foi.
   * Com `true`, vira botão de texto. Limites: sem menu, até três botões de texto (`cancel`, uma
   * `secondary` visível e `primary`); com menu, no máximo dois. Então, com `cancel`, a visível só
   * fica à mostra se for a única `secondary`; sem `cancel`, só a primeira `visible: true` fica à
   * mostra. O resto vai ao menu "Mais ações", na ordem em que veio.
   */
  visible?: boolean
}

export interface ActionBarProps {
  primary: ActionBarAction & { loading?: boolean; loadingLabel?: string }
  cancel?: ActionBarAction
  secondary?: ActionBarAction[]
  sticky?: boolean
  className?: string
  testID?: string
}

export function ActionBar({ primary, cancel, secondary, sticky = true, className, testID }: ActionBarProps) {
  const insets = useSafeAreaInsets()
  // Dentro do shell com barra inferior, ela já é dona do inset inferior: somar de novo dobraria o respiro.
  const shell = useContext(ShellContext)
  const [menuOpen, setMenuOpen] = useState(false)
  // Com `cancel`, a visível só fica à mostra quando é a única `secondary` (sem menu): com menu, no máximo 2 botões de texto.
  const todas = secondary ?? []
  const visibleAction = cancel && todas.length > 1 ? undefined : todas.find((action) => action.visible)
  const menuActions = (secondary ?? []).filter((action) => action !== visibleAction)
  const hasMenu = menuActions.length > 0
  const sideClass = cancel || hasMenu || visibleAction ? 'flex-7' : 'flex-1'
  // Com os três botões de texto, `cancel` e a visível ficam com ~70 px em 360 px: respiro lateral menor, para o rótulo curto caber.
  const sideButtonClass = cancel && visibleAction ? 'flex-3 px-2' : 'flex-3'

  const grid = (
    <View className="flex-row gap-3">
      {hasMenu && (
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger>
            <Button variant="outline" iconOnly accessibilityLabel="Mais ações" icon={<MoreHorizontal className="text-foreground" />} />
          </DropdownMenuTrigger>
          <DropdownMenuContent accessibilityLabel="Mais ações">
            {menuActions.map((action, index) => (
              <DropdownMenuItem
                key={index}
                disabled={action.disabled}
                destructive={action.destructive}
                icon={action.icon}
                onSelect={() => action.onPress?.()}
              >
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {hasMenu && !cancel && !visibleAction && <View className="flex-3" />}
      {cancel && (
        <Button
          variant="outline"
          icon={cancel.icon}
          onPress={cancel.onPress}
          disabled={cancel.disabled || primary.loading}
          className={sideButtonClass}
        >
          {cancel.label}
        </Button>
      )}
      {visibleAction && (
        <Button
          variant={visibleAction.destructive ? 'destructive' : 'outline'}
          icon={visibleAction.icon}
          onPress={visibleAction.onPress}
          disabled={visibleAction.disabled || primary.loading}
          className={sideButtonClass}
        >
          {visibleAction.label}
        </Button>
      )}
      <Button
        variant={primary.destructive ? 'destructive' : 'primary'}
        icon={primary.icon}
        onPress={primary.onPress}
        disabled={primary.disabled}
        loading={primary.loading}
        className={sideClass}
      >
        {primary.loading ? (primary.loadingLabel ?? 'Salvando...') : primary.label}
      </Button>
    </View>
  )

  if (!sticky) {
    return (
      <View className={className} testID={testID} dataSet={{ rendra: 'ACB-001' }}>
        {grid}
      </View>
    )
  }

  return (
    <View
      className={cn('border-t border-border bg-card px-4 pt-4', className)}
      style={{ paddingBottom: shell?.layout.bottomNav ? 16 : Math.max(16, insets.bottom) }}
      testID={testID}
      dataSet={{ rendra: 'ACB-001' }}
    >
      {grid}
    </View>
  )
}
