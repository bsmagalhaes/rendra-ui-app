import { renderRouter, screen } from 'expo-router/testing-library'
import { fireEvent } from '@testing-library/react-native'
import RootLayout from '../../../app/_layout'
import DashboardMotionScreen from '../../../app/(shell)/dashboard-motion'
import { motionTokens } from '../../theme/motion'
import { staggerReveal } from '../../lib/motion/reveal'
import { specOf } from '../../test-utils/motion-spec'

function routes() {
  return {
    _layout: RootLayout,
    'dashboard-motion': DashboardMotionScreen,
  }
}

jest.setTimeout(120000)

const BLOCOS = [0, 1, 2, 3, 4, 5, 6]
const bloco = (i: number) => screen.getByTestId(`dashboard-motion-bloco-${i}`)
const chave = () => screen.getByRole('switch', { name: 'Motion ligado' })

async function abrir() {
  await renderRouter(routes(), { initialUrl: '/dashboard-motion' })
  await screen.findByText('Receita do período', {}, { timeout: 60000 })
}

describe('/dashboard-motion', () => {
  it('abre em on, com a chave ligada e os blocos do dashboard', async () => {
    await abrir()
    expect(chave().props.accessibilityState.checked).toBe(true)
    for (const texto of ['Novos clientes', 'Clientes ativos', 'Receita e meta', 'Clientes por segmento', 'Clientes recentes', 'Atividade']) {
      expect(await screen.findByText(texto, {}, { timeout: 60000 })).toBeTruthy()
    }
    expect(screen.getByRole('switch', { name: 'Motion ligado' })).toBeTruthy()
  })

  it('em on os blocos entram em cascata crescente pela posição (stagger)', async () => {
    await abrir()
    const atrasos = BLOCOS.map((i) => specOf(bloco(i).props.entering)?.delay)
    expect(atrasos).toEqual(BLOCOS.map((i) => staggerReveal(i, false)))
    expect(atrasos[1]).toBe(120)
    for (let i = 1; i < atrasos.length; i += 1) expect(atrasos[i]!).toBeGreaterThan(atrasos[i - 1]!)
  })

  it('em on cada bloco entra em 600 ms (token reveal), mais lento que as interações do dia a dia', async () => {
    await abrir()
    for (const i of BLOCOS) expect(specOf(bloco(i).props.entering)?.duration).toBe(600)
    expect(motionTokens.reveal.enter).toBeGreaterThan(motionTokens.duration.slow)
  })

  it('em off os blocos saem sem nó extra e o conteúdo continua inteiro', async () => {
    await abrir()
    await fireEvent.press(chave())
    expect(chave().props.accessibilityState.checked).toBe(false)
    for (const i of BLOCOS) expect(screen.queryByTestId(`dashboard-motion-bloco-${i}`)).toBeNull()
    expect(screen.getByText('Receita do período')).toBeTruthy()
    expect(screen.getByText('Atividade')).toBeTruthy()
    expect(screen.queryByTestId('stat-valor-contador')).toBeNull()
  })

  it('religar a chave repete a entrada: blocos e contador remontados (o contador recomeça do zero)', async () => {
    await abrir()
    const antes = bloco(0)
    const contadorAntes = screen.getAllByTestId('stat-valor-contador')[0]!
    await fireEvent.press(chave())
    await fireEvent.press(chave())
    expect(chave().props.accessibilityState.checked).toBe(true)
    expect(bloco(0)).not.toBe(antes)
    const contador = screen.getAllByTestId('stat-valor-contador')[0]!
    expect(contador).not.toBe(contadorAntes)
  })
})
