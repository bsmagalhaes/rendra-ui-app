import { Stack, useRouter } from 'expo-router'
import { AppShell, type ShellNotificationsConfig } from '../../src/components/app-shell'
import { buildNavigation, exampleUser } from '../../src/config/navigation'
import { useClientes } from '../../src/demo/clients-store'
import { useNaoLidas } from '../../src/demo/tickets-store'
import { notifications } from '../../src/mocks/notifications'
import { useReducedMotion } from '../../src/lib/reduced-motion'
import { screenAnimation } from '../../src/lib/motion/screen-animation'

// Fora do componente: um objeto novo a cada render recalcularia o contexto do shell. O sino copia a
// lista só na montagem, então uma constante de módulo deixa isso explícito. O mock não tem tipo nem
// lida: todas entram como informação ainda não lidas.
const notificacoesDoShell: ShellNotificationsConfig = {
  items: notifications.map((n) => ({ id: String(n.id), type: 'info', title: n.titulo, time: n.data, read: false })),
}

/**
 * Rotas com o AppShell (cabeçalho, barra inferior e menu). O grupo entre parênteses não entra na
 * URL: `/componentes`, `/tokens` e `/galeria` continuam nos mesmos endereços. Home, login e
 * `+not-found` ficam fora do grupo, em tela cheia. "Sair" no menu do usuário volta ao login (o
 * `router.replace` vem do `expo-router` porque `useRendraNavigation` não tem `replace`).
 */
export default function ShellLayout() {
  const router = useRouter()
  const total = useClientes().length
  const naoLidas = useNaoLidas()
  const reducedMotion = useReducedMotion()
  return (
    <AppShell navigation={buildNavigation(total, naoLidas)} user={exampleUser} notifications={notificacoesDoShell} onLogout={() => router.replace('/login')}>
      <Stack screenOptions={{ headerShown: false, animation: screenAnimation(reducedMotion) }} />
    </AppShell>
  )
}
