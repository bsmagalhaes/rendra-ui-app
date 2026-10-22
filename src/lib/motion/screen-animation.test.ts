import { screenAnimation } from './screen-animation'

describe('screenAnimation (A15)', () => {
  it('com movimento reduzido a troca de tela vira fade; sem, fica a animação padrão da plataforma', () => {
    expect(screenAnimation(true)).toBe('fade')
    expect(screenAnimation(false)).toBe('default')
  })
})
