import type { ComponentType } from 'react'
import type { FeedbackType } from '../../brand/types'

/** Ícone de item de navegação: qualquer componente que aceite `className` (ícones do `lucide-react-native`). */
export type NavIcon = ComponentType<{ className?: string }>

export interface NavChild {
  title: string
  to: string
  description?: string
}

export interface NavItem {
  title: string
  to?: string
  icon: NavIcon
  badge?: string
  /** Aparece na barra inferior (no máximo 4 itens marcados). */
  bottomNav?: boolean
  /** Rótulo curto da barra inferior; sem ele usa `title`. */
  shortTitle?: string
  description?: string
  children?: NavChild[]
}

export interface NavGroup {
  title: string
  description?: string
  items: NavItem[]
}

export interface ShellUser {
  name: string
  email?: string
  avatarUrl?: string
}

export interface ShellMenuItem {
  label: string
  to?: string
  onSelect?: () => void
  icon?: NavIcon
}

/**
 * Botão redondo do centro da barra inferior. Sem a prop, é o ícone de menu com o rótulo "Abrir
 * menu". `icon: 'brand-symbol'` desenha o símbolo da marca (`BrandConfig.symbol`; sem símbolo,
 * cai no ícone de menu); um componente de ícone (como os do `lucide-react-native`) desenha esse
 * ícone. O botão do cabeçalho (sem barra inferior) não muda.
 */
export interface ShellCenterButton {
  icon?: 'brand-symbol' | NavIcon
  /** Rótulo acessível do botão. Padrão "Abrir menu". */
  accessibilityLabel?: string
}

/**
 * Seletor de espaço (empresa, filial, workspace) no topo do menu do usuário: um item por espaço,
 * com o ativo marcado. Só aparece quando há `user` (o menu do usuário é o gatilho). Tocar num
 * espaço, inclusive no ativo, chama `onSelect(id)` e fecha o menu.
 */
export interface ShellWorkspaces {
  items: { id: string; label: string }[]
  activeId: string
  onSelect: (id: string) => void
  /** Rótulo do grupo no menu. Padrão "Espaço". */
  label?: string
}

/** Notificação do sino do cabeçalho. */
export interface ShellNotificationItem {
  id: string
  type: FeedbackType
  title: string
  time: string
  read: boolean
}

/**
 * Sino de notificações do cabeçalho. A lista `items` é copiada uma vez, na montagem: marcar como
 * lida muda só a cópia interna, e os retornos avisam o consumidor.
 */
export interface ShellNotificationsConfig {
  items: ShellNotificationItem[]
  onMarkAllRead?: () => void
  onItemClick?: (id: string) => void
}
