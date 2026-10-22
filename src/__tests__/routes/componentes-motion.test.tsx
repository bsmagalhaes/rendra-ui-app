import { renderRouter, screen } from 'expo-router/testing-library'
import { fireEvent } from '@testing-library/react-native'
import RootLayout from '../../../app/_layout'
import ComponentesMotionScreen from '../../../app/(shell)/componentes-motion'
import ComponentesLayout from '../../../app/(shell)/componentes/_layout'
import ComponentesSlugScreen from '../../../app/(shell)/componentes/[slug]'

function routes() {
  return {
    _layout: RootLayout,
    'componentes-motion': ComponentesMotionScreen,
  }
}

jest.setTimeout(120000)

describe('/componentes-motion', () => {
  it('abre em on, mostra só os 30 componentes e as seções da vitrine', async () => {
    await renderRouter(routes(), { initialUrl: '/componentes-motion' })
    expect(await screen.findByText('Os 30 componentes com movimento, lado a lado com a vitrine. A chave liga e desliga o motion só aqui.', {}, { timeout: 60000 })).toBeTruthy()
    for (const nome of ['Modal', 'Drawer', 'Sheet', 'Tabs', 'Chart', 'Alert', 'EmptyState', 'Pagination']) {
      expect(await screen.findByText(nome, {}, { timeout: 60000 })).toBeTruthy()
    }
    expect(screen.queryByText('Container')).toBeNull()
    expect(screen.queryByText('BrandLogo')).toBeNull()
    const chave = screen.getByRole('switch', { name: 'Motion ligado' })
    expect(chave.props.accessibilityState.checked).toBe(true)
  })

  it('o seletor muda o useMotion() visto pelos exemplos (o Accordion troca de caminho)', async () => {
    await renderRouter(routes(), { initialUrl: '/componentes-motion' })
    await screen.findByText('Motion ligado', {}, { timeout: 60000 })
    expect(await screen.findByTestId('acordeao-conteudo-envio', {}, { timeout: 60000 })).toBeTruthy()
    await fireEvent.press(screen.getByRole('switch', { name: 'Motion ligado' }))
    expect(screen.getByRole('switch', { name: 'Motion ligado' }).props.accessibilityState.checked).toBe(false)
    expect(screen.queryByTestId('acordeao-conteudo-envio')).toBeNull()
    await fireEvent.press(screen.getByRole('switch', { name: 'Motion ligado' }))
    expect(await screen.findByTestId('acordeao-conteudo-envio')).toBeTruthy()
  })

  it('/componentes continua com as seções de sempre', async () => {
    await renderRouter(
      {
        _layout: RootLayout,
        'componentes/_layout': ComponentesLayout,
        'componentes/[slug]': ComponentesSlugScreen,
      },
      { initialUrl: '/componentes/layout' },
    )
    expect(await screen.findByText('Container', {}, { timeout: 60000 })).toBeTruthy()
    expect(screen.queryByTestId('acordeao-conteudo-envio')).toBeNull()
  })
})
