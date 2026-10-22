import { dragOffset, project, rubberband, shouldDismiss } from './drag'

describe('project (receita do animate-expo)', () => {
  it('((v / 1000) * 0,998) / (1 - 0,998): cerca de 0,499 de cada px/s', () => {
    expect(project(1000)).toBeCloseTo(499, 5)
    expect(project(-2000)).toBeCloseTo(-998, 5)
    expect(project(0)).toBe(0)
  })
})

describe('rubberband', () => {
  it('quanto mais além, menos acompanha o dedo, e nunca passa da dimensão', () => {
    const perto = rubberband(20, 300)
    const longe = rubberband(200, 300)
    expect(perto).toBeGreaterThan(0)
    expect(perto).toBeLessThan(20)
    expect(longe / 200).toBeLessThan(perto / 20)
    expect(rubberband(100000, 300)).toBeLessThan(300 + 0.001)
  })
  it('é simétrica: o sinal do deslocamento é mantido', () => {
    expect(rubberband(-50, 300)).toBeCloseTo(-rubberband(50, 300), 10)
  })
})

describe('dragOffset', () => {
  it('no sentido de abrir não é um muro: puxa um pouco, com resistência (A5)', () => {
    const puxado = dragOffset(-100, 300)
    expect(puxado).toBeLessThan(0)
    expect(puxado).toBeGreaterThan(-100)
    expect(dragOffset(-10, 300)).toBeLessThan(0)
    expect(dragOffset(0, 300)).toBe(0)
  })
  it('a resistência cresce: o dobro do puxão rende menos que o dobro do deslocamento', () => {
    expect(Math.abs(dragOffset(-200, 300))).toBeLessThan(2 * Math.abs(dragOffset(-100, 300)))
  })
  it('acompanha o dedo até o limite, no sentido de fechar', () => {
    expect(dragOffset(100, 300)).toBe(100)
  })
  it('depois do tamanho, aplica resistência', () => {
    const past = dragOffset(400, 300)
    expect(past).toBeGreaterThan(300)
    expect(past).toBeLessThan(400)
  })
})

describe('shouldDismiss (por projeção)', () => {
  it('fecha quando a posição projetada passa de 40% do tamanho: arrastou mais de 40% mesmo parado', () => {
    expect(shouldDismiss(130, 0, 300)).toBe(true)
    expect(shouldDismiss(100, 0, 300)).toBe(false)
  })
  it('um arremesso curto e rápido fecha, um lento e curto volta', () => {
    expect(shouldDismiss(30, 1200, 300)).toBe(true)
    expect(shouldDismiss(30, 50, 300)).toBe(false)
  })
  it('velocidade para o lado de abrir não fecha, nem somada a um arraste médio', () => {
    expect(shouldDismiss(0, -2000, 300)).toBe(false)
    expect(shouldDismiss(100, -800, 300)).toBe(false)
  })
})
