import {
  announcePosition,
  autoScrollDelta,
  clampScrollOffset,
  dragTarget,
  moveItem,
  reorderRowOffset,
  rowSpan,
} from './list-reorder'

describe('moveItem', () => {
  it('devolve a nova ordem sem mutar a entrada', () => {
    const entrada = ['a', 'b', 'c', 'd']
    const saida = moveItem(entrada, 0, 2)
    expect(saida).toEqual(['b', 'c', 'a', 'd'])
    expect(entrada).toEqual(['a', 'b', 'c', 'd'])
    expect(saida).not.toBe(entrada)
  })

  it('move para cima', () => {
    expect(moveItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b'])
  })

  it('mesma posicao, indice fora da faixa e lista de 1 item devolvem a mesma lista', () => {
    const lista = ['a', 'b', 'c']
    expect(moveItem(lista, 1, 1)).toBe(lista)
    expect(moveItem(lista, -1, 1)).toBe(lista)
    expect(moveItem(lista, 1, 3)).toBe(lista)
    const um = ['a']
    expect(moveItem(um, 0, 0)).toBe(um)
  })
})

describe('announcePosition', () => {
  it('monta "rotulo, posicao N de M" com N de 1 a M', () => {
    expect(announcePosition('Ana', 0, 5)).toBe('Ana, posição 1 de 5')
    expect(announcePosition('Bruno', 4, 5)).toBe('Bruno, posição 5 de 5')
  })
})

describe('dragTarget', () => {
  it('alturas iguais: desloca por linha inteira (para baixo e para cima)', () => {
    const alturas = [40, 40, 40, 40]
    expect(dragTarget(0, 0, alturas, 0)).toBe(0)
    expect(dragTarget(0, 45, alturas, 0)).toBe(1)
    expect(dragTarget(0, 85, alturas, 0)).toBe(2)
    expect(dragTarget(3, -45, alturas, 0)).toBe(2)
    expect(dragTarget(3, -85, alturas, 0)).toBe(1)
  })

  it('deslocamento zero nao muda o destino', () => {
    expect(dragTarget(2, 0, [40, 60, 40], 1)).toBe(2)
  })

  it('limita nas bordas', () => {
    const alturas = [40, 40, 40]
    expect(dragTarget(1, 5000, alturas, 0)).toBe(2)
    expect(dragTarget(1, -5000, alturas, 0)).toBe(0)
  })

  it('alturas diferentes (com e sem descricao) entram na conta', () => {
    // linhas: 0 -> 0..44, 1 -> 44..124 (80), 2 -> 124..168
    const alturas = [44, 80, 44]
    // centro da linha 0 = 22; com dy 50 centro = 72, ainda dentro da linha 1
    expect(dragTarget(0, 50, alturas, 0)).toBe(1)
    // com dy 120 centro = 142, dentro da linha 2
    expect(dragTarget(0, 120, alturas, 0)).toBe(2)
    // com dy 30 centro = 52, linha 1 ja comecou em 44
    expect(dragTarget(0, 30, alturas, 0)).toBe(1)
    // com dy 20 centro = 42, ainda na linha 0
    expect(dragTarget(0, 20, alturas, 0)).toBe(0)
  })

  it('o separador entra na conta: sem ele o destino desvia em listas longas', () => {
    // 10 linhas de 40 com separador de 1: o topo da linha 9 e 9 * 41 = 369
    const alturas = Array.from({ length: 10 }, () => 40)
    // centro da linha 0 = 20; dy = 9 * 41 = 369 leva o centro a 389 = dentro da linha 9
    expect(dragTarget(0, 369, alturas, 1)).toBe(9)
    // dy = 348 deixa o centro em 368, ainda na linha 8 (que vai de 328 a 369)
    expect(dragTarget(0, 348, alturas, 1)).toBe(8)
    // com 5 separadores acumulados a diferenca aparece: dy = 200 -> centro 220;
    // gap 1: topo da linha 5 = 205, topo da 6 = 246 -> linha 5; gap 0: topo da 5 = 200, da 6 = 240 -> linha 5
    // dy = 230 -> centro 250: gap 1 cai na linha 6 (246); gap 0 cai na linha 6 (240) tambem;
    // dy = 222 -> centro 242: gap 1 ainda na linha 5 (246), gap 0 ja na linha 6 (240)
    expect(dragTarget(0, 222, alturas, 1)).toBe(5)
    expect(dragTarget(0, 222, alturas, 0)).toBe(6)
  })

  it('linha sem medida usa a media das medidas', () => {
    // medidas: 40 e 60 (media 50); linha 1 sem medida vale 50
    const alturas = [40, undefined, 60]
    // centro da linha 0 = 20; linha 1 vai de 40 a 90; linha 2 de 90 a 150
    expect(dragTarget(0, 40, alturas, 0)).toBe(1)
    expect(dragTarget(0, 90, alturas, 0)).toBe(2)
  })

  it('a media tambem vale para a propria linha arrastada sem medida', () => {
    const alturas = [undefined, 40, 60]
    // media 50: linha 0 vai de 0 a 50, centro 25; dy 40 -> 65, dentro da linha 1 (50..90)
    expect(dragTarget(0, 40, alturas, 0)).toBe(1)
  })

  it('nenhuma medida: o destino nao muda', () => {
    expect(dragTarget(1, 500, [undefined, undefined, undefined], 0)).toBe(1)
    expect(dragTarget(1, 500, [0, 0, 0], 0)).toBe(1)
  })

  it('lista de 1 item', () => {
    expect(dragTarget(0, 300, [40], 0)).toBe(0)
  })

  it('origem fora da faixa nao quebra', () => {
    expect(dragTarget(5, 10, [40, 40], 0)).toBe(5)
  })
})

describe('autoScrollDelta', () => {
  it('zona superior rola para cima, zona inferior para baixo, meio nao rola', () => {
    expect(autoScrollDelta(5, 300, 40, 20)).toBeLessThan(0)
    expect(autoScrollDelta(295, 300, 40, 20)).toBeGreaterThan(0)
    expect(autoScrollDelta(150, 300, 40, 20)).toBe(0)
  })

  it('a velocidade cresce ate o passo cheio na borda e passa dela sem estourar', () => {
    expect(autoScrollDelta(0, 300, 40, 20)).toBe(-20)
    expect(autoScrollDelta(-50, 300, 40, 20)).toBe(-20)
    expect(autoScrollDelta(300, 300, 40, 20)).toBe(20)
    expect(autoScrollDelta(400, 300, 40, 20)).toBe(20)
    expect(Math.abs(autoScrollDelta(20, 300, 40, 20))).toBe(10)
  })

  it('zona ou area zerada nao rola', () => {
    expect(autoScrollDelta(0, 300, 0, 20)).toBe(0)
    expect(autoScrollDelta(0, 0, 40, 20)).toBe(0)
  })
})

describe('clampScrollOffset', () => {
  it('mantem o deslocamento dentro do conteudo', () => {
    expect(clampScrollOffset(-10, 1000, 300)).toBe(0)
    expect(clampScrollOffset(500, 1000, 300)).toBe(500)
    expect(clampScrollOffset(900, 1000, 300)).toBe(700)
  })

  it('conteudo menor que a area: sempre 0', () => {
    expect(clampScrollOffset(50, 200, 300)).toBe(0)
  })
})

describe('reorderRowOffset', () => {
  it('a linha arrastada acompanha o dedo', () => {
    expect(reorderRowOffset(2, 2, 4, 33, 40)).toBe(33)
  })

  it('as linhas entre a origem e o destino sobem ao arrastar para baixo', () => {
    expect(reorderRowOffset(3, 2, 4, 33, 40)).toBe(-40)
    expect(reorderRowOffset(4, 2, 4, 33, 40)).toBe(-40)
    expect(reorderRowOffset(5, 2, 4, 33, 40)).toBe(0)
    expect(reorderRowOffset(1, 2, 4, 33, 40)).toBe(0)
  })

  it('as linhas entre o destino e a origem descem ao arrastar para cima', () => {
    expect(reorderRowOffset(1, 3, 1, -20, 40)).toBe(40)
    expect(reorderRowOffset(2, 3, 1, -20, 40)).toBe(40)
    expect(reorderRowOffset(0, 3, 1, -20, 40)).toBe(0)
  })

  it('sem arraste ativo, tudo em zero', () => {
    expect(reorderRowOffset(2, -1, -1, 0, 0)).toBe(0)
  })
})

describe('rowSpan', () => {
  it('topo e altura da linha, com separador e média nas sem medida', () => {
    expect(rowSpan(0, [40, 60], 1)).toEqual({ top: 0, size: 40 })
    expect(rowSpan(1, [40, 60], 1)).toEqual({ top: 41, size: 60 })
    expect(rowSpan(1, [40, undefined, 60], 0)).toEqual({ top: 40, size: 50 })
  })

  it('sem medida nenhuma ou fora da faixa devolve null', () => {
    expect(rowSpan(0, [undefined], 0)).toBeNull()
    expect(rowSpan(3, [40, 40], 0)).toBeNull()
  })
})
