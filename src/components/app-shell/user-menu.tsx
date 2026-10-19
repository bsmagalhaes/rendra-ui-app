import { Pressable } from 'react-native'
import { LogOut, Palette } from 'lucide-react-native'
import { Avatar } from '../ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { useRendraNavigation } from '../../navigation/rendra-navigation'
import type { ShellMenuItem, ShellUser, ShellWorkspaces } from './types'

export interface UserMenuProps {
  user: ShellUser
  userMenuItems?: ShellMenuItem[]
  onLogout?: () => void
  /** Seletor de espaço no topo do menu. */
  workspaces?: ShellWorkspaces
}

/**
 * Menu do usuário: o `Avatar` é o gatilho e abre uma folha com nome e e-mail, os itens do app,
 * "Aparência" (leva para `/configuracoes`, onde ficam modo, modelo, paleta e layout: o
 * `DropdownMenu` não tem grupo de opções) e "Sair" (destrutivo), quando há `onLogout`. Com
 * `workspaces`, o topo do menu traz o seletor de espaço (rótulo, itens com o ativo marcado e um separador).
 */
export function UserMenu({ user, userMenuItems, onLogout, workspaces }: UserMenuProps) {
  const { navigate } = useRendraNavigation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Menu de ${user.name}`}
          className="size-touch items-center justify-center"
        >
          <Avatar name={user.name} src={user.avatarUrl} />
        </Pressable>
      </DropdownMenuTrigger>
      <DropdownMenuContent accessibilityLabel={`Menu de ${user.name}`}>
        {workspaces ? (
          <>
            <DropdownMenuLabel>{workspaces.label ?? 'Espaço'}</DropdownMenuLabel>
            {workspaces.items.map((espaco) => (
              <DropdownMenuItem
                key={espaco.id}
                selected={espaco.id === workspaces.activeId}
                onSelect={() => workspaces.onSelect(espaco.id)}
              >
                {espaco.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
        {user.email ? <DropdownMenuLabel>{user.email}</DropdownMenuLabel> : null}
        <DropdownMenuSeparator />
        {userMenuItems?.map((item) => {
          const Icon = item.icon
          return (
            <DropdownMenuItem
              key={item.label}
              icon={Icon ? <Icon className="size-icon-md text-foreground" /> : undefined}
              onSelect={() => {
                if (item.to) navigate(item.to)
                item.onSelect?.()
              }}
            >
              {item.label}
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuItem
          icon={<Palette className="size-icon-md text-foreground" />}
          onSelect={() => navigate('/configuracoes')}
        >
          Aparência
        </DropdownMenuItem>
        {onLogout ? (
          <DropdownMenuItem
            destructive
            icon={<LogOut className="size-icon-md text-destructive-soft-foreground" />}
            onSelect={onLogout}
          >
            Sair
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
