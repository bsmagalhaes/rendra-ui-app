import {
  Blocks,
  CalendarDays,
  Headset,
  House,
  Images,
  LayoutDashboard,
  ListChecks,
  Palette,
  Settings,
  Sparkles,
  SquareKanban,
  UserPlus,
  Users,
} from 'lucide-react-native'
import type { NavGroup, ShellUser } from '../components/app-shell/types'

/**
 * Menu e usuário de exemplo da vitrine (mesmo papel de `brand.config.ts`): ficam em `src/config`
 * e NÃO são exportados por `src/index.ts`. Quem instala o pacote escreve o próprio menu.
 * Painel, Componentes, Galeria e Configurações aparecem na barra inferior (no máximo 4). Clientes,
 * Cadastros, Tarefas, Atendimento, Agenda e Funil são as telas de exemplo da demonstração (mocks em
 * `src/mocks`). O selo de Clientes leva o total da carteira visível, que muda com a exclusão e o
 * cadastro da demonstração, e o de Atendimento leva as mensagens não lidas, que zeram ao abrir a
 * conversa (o layout do shell chama `buildNavigation` com `useClientes` e `useNaoLidas`).
 */
export function buildNavigation(totalClientes: number, naoLidas = 0): NavGroup[] {
  return [
    {
      title: 'Geral',
      items: [
        { title: 'Início', to: '/', icon: House },
        { title: 'Painel', to: '/painel', icon: LayoutDashboard, bottomNav: true },
        { title: 'Clientes', to: '/clientes', icon: Users, badge: String(totalClientes) },
        {
          title: 'Cadastros',
          icon: UserPlus,
          children: [
            { title: 'Novo cliente', to: '/clientes/novo' },
            { title: 'Cadastro guiado', to: '/cadastro' },
          ],
        },
        { title: 'Tarefas', to: '/tarefas', icon: ListChecks },
        {
          title: 'Atendimento',
          to: '/atendimento',
          icon: Headset,
          badge: naoLidas > 0 ? String(naoLidas) : undefined,
        },
        { title: 'Agenda', to: '/agenda', icon: CalendarDays },
        { title: 'Funil', to: '/kanban', icon: SquareKanban },
      ],
    },
    {
      title: 'Sistema',
      items: [
        { title: 'Componentes', to: '/componentes', icon: Blocks, bottomNav: true, shortTitle: 'Vitrine' },
        { title: 'Componentes com motion', to: '/componentes-motion', icon: Sparkles },
        { title: 'Dashboard com motion', to: '/dashboard-motion', icon: LayoutDashboard },
        { title: 'Tokens', to: '/tokens', icon: Palette },
        { title: 'Galeria', to: '/galeria', icon: Images, bottomNav: true },
        { title: 'Configurações', to: '/configuracoes', icon: Settings, bottomNav: true, shortTitle: 'Ajustes' },
      ],
    },
  ]
}

export const exampleUser: ShellUser = { name: 'Ana Ribeiro', email: 'ana@exemplo.com' }
