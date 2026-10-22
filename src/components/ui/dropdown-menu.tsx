import { cloneElement, createContext, isValidElement, useContext, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { Platform, View } from 'react-native'
import { Check } from 'lucide-react-native'
import { Text } from '../internal/text'
import { cn } from '../../lib/cn'
import { a11yPresets } from '../../lib/a11y'
import { useControlledState } from '../../hooks/use-controlled-state'
import { BottomSheet } from '../internal/bottom-sheet'
import { PressScale } from '../internal/motion-view'

interface DropdownMenuContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null)

function useDropdownMenuContext(componentName: string): DropdownMenuContextValue {
  const context = useContext(DropdownMenuContext)
  if (!context) {
    throw new Error(`${componentName} precisa estar dentro de <DropdownMenu>.`)
  }
  return context
}

export interface DropdownMenuProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactNode
}

export function DropdownMenu({ open: controlledOpen, onOpenChange, children }: DropdownMenuProps) {
  const [open, setOpen] = useControlledState<boolean>(controlledOpen, false, onOpenChange)
  return <DropdownMenuContext.Provider value={{ open, setOpen }}>{children}</DropdownMenuContext.Provider>
}

export interface DropdownMenuTriggerProps {
  children: ReactElement<{ onPress?: () => void; accessibilityState?: Record<string, unknown> }>
}

export function DropdownMenuTrigger({ children }: DropdownMenuTriggerProps) {
  const { open, setOpen } = useDropdownMenuContext('DropdownMenuTrigger')
  if (!isValidElement(children)) return children
  return cloneElement(children, {
    onPress: () => setOpen(true),
    accessibilityState: { ...children.props.accessibilityState, expanded: open },
  })
}

export interface DropdownMenuContentProps {
  children: ReactNode
  accessibilityLabel?: string
}

export function DropdownMenuContent({ children, accessibilityLabel }: DropdownMenuContentProps) {
  const { open, setOpen } = useDropdownMenuContext('DropdownMenuContent')
  return (
    <BottomSheet open={open} onOpenChange={setOpen} accessibilityLabel={accessibilityLabel} contentContainerClassName="p-1">
      <View
        accessibilityRole={a11yPresets.menu.accessibilityRole}
        className="rounded-t-surface bg-popover p-1"
        dataSet={{ rendra: 'DDM-001' }}
      >
        {children}
      </View>
    </BottomSheet>
  )
}

export interface DropdownMenuItemProps {
  children: ReactNode
  icon?: ReactNode
  destructive?: boolean
  disabled?: boolean
  /**
   * Marca o item como o escolhido (por exemplo, o espaço ativo): mostra um `Check` e, para o leitor
   * de tela, vai como `aria-current` no web (`aria-selected` não vale em `menuitem`) e como
   * `accessibilityState.selected` no nativo. Sem a prop, nada muda.
   */
  selected?: boolean
  onSelect: () => void
}

export function DropdownMenuItem({ children, icon, destructive = false, disabled = false, selected, onSelect }: DropdownMenuItemProps) {
  const { setOpen } = useDropdownMenuContext('DropdownMenuItem')
  const [pressed, setPressed] = useState(false)
  // Mesmo precedente de shell-link.tsx: no web o estado vai como `aria-current` (o react-native-web
  // converteria `accessibilityState.selected` em `aria-selected`, proibido em `menuitem`); no nativo, em `selected`.
  const estado =
    selected === undefined
      ? { accessibilityState: { disabled } }
      : Platform.OS === 'web'
        ? { accessibilityState: { disabled }, 'aria-current': selected ? ('true' as const) : undefined }
        : { accessibilityState: { disabled, selected } }
  return (
    <PressScale
      accessibilityRole={a11yPresets.menuitem.accessibilityRole}
      {...estado}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={() => {
        onSelect()
        setOpen(false)
      }}
      className={cn(
        'min-h-touch flex-row items-center gap-2 rounded-item px-3',
        pressed && !disabled && (destructive ? 'bg-destructive-soft' : 'bg-accent'),
        disabled && 'opacity-50',
      )}
      outerClassName={cn(
        'min-h-touch justify-center rounded-item',
        pressed && !disabled && (destructive ? 'bg-destructive-soft' : 'bg-accent'),
        disabled && 'opacity-50',
      )}
      innerClassName="flex-row items-center gap-2 px-3"
      motionTestID="menu-item-press"
    >
      {icon}
      <Text
        className={cn(
          'text-sm',
          // Divergência do contrato §12.4 (que usa `text-destructive` em repouso): o axe
          // (Tarefa 15) reprovou color-contrast (2.67, abaixo de 4,5:1) para `text-destructive`
          // sobre `bg-popover`; `text-destructive-soft-foreground` já é usado com o mesmo
          // objetivo em field.tsx:80. Sem diferença visual entre repouso e pressionado no
          // destrutivo (os dois já usam este tom); o não destrutivo continua diferenciando
          // repouso de pressionado.
          destructive
            ? 'text-destructive-soft-foreground'
            : pressed && !disabled
              ? 'text-accent-foreground'
              : 'text-foreground',
        )}
      >
        {children}
      </Text>
      {selected ? <Check className="ml-auto size-icon-md text-foreground" /> : null}
    </PressScale>
  )
}

export function DropdownMenuSeparator() {
  return <View className="-mx-1 my-1 h-px bg-border" />
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return (
    <Text weight="medium" className="px-2 py-2 text-xs text-muted-foreground">
      {children}
    </Text>
  )
}
