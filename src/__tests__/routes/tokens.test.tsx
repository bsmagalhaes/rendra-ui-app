import { render, screen, within } from '@testing-library/react-native'
import { BrandProvider } from '../../brand'
import TokensIndex from '../../../app/(shell)/tokens/index'
import { nodesWithCode } from '../../test-utils/rendra-code'

describe('/tokens', () => {
  it('mostra a seção de paleta com o selo de contraste AA', async () => {
    await render(<BrandProvider><TokensIndex /></BrandProvider>)
    expect(await screen.findByText('Paleta')).toBeTruthy()
    expect(screen.getAllByText(/AA/).length).toBeGreaterThan(0)
  })
  it('mostra tipografia, espaço, raio e sombra, sem classe dinâmica interpolada', async () => {
    await render(<BrandProvider><TokensIndex /></BrandProvider>)
    expect(await screen.findByText('Tipografia')).toBeTruthy()
    expect(screen.getByText('Espaço')).toBeTruthy()
    expect(screen.getByText('Raio')).toBeTruthy()
    expect(screen.getByText('Sombra')).toBeTruthy()
    expect(screen.getByText('text-xs')).toBeTruthy()
  })

  it('amostra de "Espaço" tem largura igual ao degrau da escala (achado do emulador, correção pós-validação)', async () => {
    await render(<BrandProvider><TokensIndex /></BrandProvider>)
    await screen.findByText('Espaço')
    const classesOf = (testId: string) => screen.getByTestId(testId).props.className.split(' ')
    expect(classesOf('espaco-1')).toContain('w-1')
    expect(classesOf('espaco-24')).toContain('w-24')
  })
})


describe('/tokens: seções em cartões', () => {
  it('cada seção (Paleta, Tipografia, Espaço, Raio e Sombra) fica no próprio cartão, com o título dentro', async () => {
    const { container } = await render(<BrandProvider><TokensIndex /></BrandProvider>)
    await screen.findByText('Paleta')
    const cartoes = nodesWithCode(container, 'CARD-001')
    expect(cartoes).toHaveLength(5)
    const titulos = ['Paleta', 'Tipografia', 'Espaço', 'Raio', 'Sombra']
    cartoes.forEach((cartao, i) => {
      expect(within(cartao).getByText(titulos[i]!)).toBeTruthy()
    })
  })
})
