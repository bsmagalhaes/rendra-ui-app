import {
  candidatosDeImagem,
  descreverCandidatos,
  escolherMenor,
  otimizarImagem,
  exigirOgEmJpg,
  otimizarOg,
  otimizarPng,
  type CandidatoDeImagem,
} from './image-optimize'

// Só para montar um PNG sem alfa no teste do JPG (mesmo desvio H3 do script).
const sharp = require('sharp') as (entrada: unknown, opcoes?: unknown) => {
  png: () => { toBuffer: () => Promise<Uint8Array> }
  ensureAlpha: () => { raw: () => { toBuffer: () => Promise<Uint8Array> } }
}

// PNG 8x8 laranja com alfa, em bytes fixos (gerar o PNG com o próprio sharp tornaria o teste circular).
const PNG_8X8 = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEklEQVQYlWN4kcr1Hx9mGBkKAB5LlYGV/Y/PAAAAAElFTkSuQmCC'), (c) => c.charCodeAt(0))

const candidato = (rotulo: string, formato: CandidatoDeImagem['formato'], tamanho: number): CandidatoDeImagem => ({
  rotulo,
  formato,
  bytes: new Uint8Array(tamanho),
})

describe('escolherMenor (função pura, candidatos injetados)', () => {
  it('escolhe o de menos bytes, seja qual for o formato', () => {
    const lista = [candidato('webp sem perda', 'webp', 900), candidato('png sem perda', 'png', 500), candidato('jpg', 'jpg', 700)]
    expect(escolherMenor(lista).formato).toBe('png')
    expect(escolherMenor([...lista].reverse()).formato).toBe('png')
  })

  it('o escolhido nunca é maior que nenhum candidato', () => {
    const lista = [candidato('a', 'webp', 40), candidato('b', 'webp', 30), candidato('c', 'png', 35)]
    const escolhido = escolherMenor(lista)
    for (const outro of lista) expect(escolhido.bytes.length).toBeLessThanOrEqual(outro.bytes.length)
  })

  it('empate fica com o primeiro (o WebP sem perda)', () => {
    const lista = [candidato('webp sem perda', 'webp', 10), candidato('png sem perda', 'png', 10)]
    expect(escolherMenor(lista).formato).toBe('webp')
  })

  it('lista vazia lança', () => {
    expect(() => escolherMenor([])).toThrow(/nenhum candidato/)
  })

  it('descreverCandidatos traz os bytes de cada candidato', () => {
    expect(descreverCandidatos('tela', [candidato('webp sem perda', 'webp', 900), candidato('png sem perda', 'png', 500)])).toBe(
      'tela: webp sem perda 900 B, png sem perda 500 B',
    )
  })
})

describe('image-optimize (integração com o sharp)', () => {
  it('com transparência (a moldura do aparelho), o JPG não entra: perderia o alfa', async () => {
    const candidatos = await candidatosDeImagem(PNG_8X8)
    expect(candidatos.map((c) => c.formato).sort()).toEqual(['png', 'webp', 'webp'])
  })

  it('calcula WebP sem e com perda, PNG e, sem transparência, JPG', async () => {
    const opaco = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#ff8800' } }).png().toBuffer()
    const candidatos = await candidatosDeImagem(opaco)
    expect(candidatos.map((c) => c.formato).sort()).toEqual(['jpg', 'png', 'webp', 'webp'])
    const webp = candidatos.find((c) => c.formato === 'webp')!
    expect(String.fromCharCode(...webp.bytes.subarray(0, 4))).toBe('RIFF')
    expect(String.fromCharCode(...webp.bytes.subarray(8, 12))).toBe('WEBP')
    const png = candidatos.find((c) => c.formato === 'png')!
    expect(Array.from(png.bytes.subarray(1, 4))).toEqual([0x50, 0x4e, 0x47])
    const jpg = candidatos.find((c) => c.formato === 'jpg')!
    expect(Array.from(jpg.bytes.subarray(0, 2))).toEqual([0xff, 0xd8])
  })

  it('o vencedor gravado não é maior que nenhum candidato calculado', async () => {
    const { vencedor, candidatos } = await otimizarImagem(PNG_8X8)
    for (const c of candidatos) expect(vencedor.bytes.length).toBeLessThanOrEqual(c.bytes.length)
  })

  it('otimizarImagem devolve o vencedor entre os candidatos que o gerador der, mesmo que não seja o primeiro', async () => {
    const gerar = async () => [candidato('webp sem perda', 'webp', 900), candidato('png sem perda', 'png', 500)]
    const { vencedor, candidatos } = await otimizarImagem(PNG_8X8, gerar)
    expect(vencedor.formato).toBe('png')
    expect(candidatos).toHaveLength(2)
  })

  it('o candidato PNG é sem perda de verdade: um degradê com milhares de cores volta pixel a pixel (sem paleta)', async () => {
    const w = 128
    const h = 64
    const pixels = new Uint8Array(w * h * 4)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) pixels.set([x * 2, y * 4, (x + y) % 256, 255], (y * w + x) * 4)
    const png = await sharp(pixels, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer()
    const candidatos = await candidatosDeImagem(png)
    expect(candidatos.map((c) => c.rotulo)).toEqual(['webp sem perda', 'webp com perda', 'png sem perda'])
    const candidatoPng = candidatos.find((c) => c.formato === 'png')!
    const volta = await sharp(candidatoPng.bytes).ensureAlpha().raw().toBuffer()
    expect(volta.length).toBe(pixels.length)
    expect(volta.every((valor, i) => valor === pixels[i])).toBe(true)
  })

  it('otimizarOg compara PNG sem perda e JPG q90 e grava o menor, sem transparência', async () => {
    const opaco = await sharp({ create: { width: 64, height: 32, channels: 3, background: '#112233' } }).png().toBuffer()
    const og = await otimizarOg(opaco)
    expect(og.candidatos.map((c) => c.formato).sort()).toEqual(['jpg', 'png'])
    for (const c of og.candidatos) expect(og.vencedor.bytes.length).toBeLessThanOrEqual(c.bytes.length)
    expect(['png', 'jpg']).toContain(og.vencedor.formato)
  })

  it('otimizarOg: numa imagem de ruído o JPG vence e é o gravado; num bloco liso o PNG vence', async () => {
    const w = 96
    const h = 64
    const ruido = new Uint8Array(w * h * 3)
    let semente = 12345
    for (let i = 0; i < ruido.length; i++) {
      semente = (semente * 1103515245 + 12345) & 0x7fffffff
      ruido[i] = semente >> 16
    }
    const png = await sharp(ruido, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer()
    const og = await otimizarOg(png)
    const [pngSemPerda, jpg] = [og.candidatos.find((c) => c.formato === 'png')!, og.candidatos.find((c) => c.formato === 'jpg')!]
    expect(jpg.bytes.length).toBeLessThan(pngSemPerda.bytes.length)
    expect(og.vencedor.formato).toBe('jpg')
    expect(og.vencedor.bytes).toBe(jpg.bytes)
    const liso = await sharp({ create: { width: 64, height: 32, channels: 3, background: '#000000' } }).png().toBuffer()
    expect((await otimizarOg(liso)).vencedor.formato).toBe('png')
  })

  it('exigirOgEmJpg: com o JPG vencedor não lança; se o PNG vencer, lança dizendo os bytes de cada candidato', () => {
    const png = candidato('png sem perda', 'png', 100)
    const jpg = candidato('jpg qualidade 90', 'jpg', 300)
    expect(() => exigirOgEmJpg({ vencedor: jpg, candidatos: [png, jpg] })).not.toThrow()
    expect(() => exigirOgEmJpg({ vencedor: png, candidatos: [png, jpg] })).toThrow(/PNG da og-image venceu.*png sem perda 100 B, jpg qualidade 90 300 B.*og-image.jpg/)
  })

  it('otimizarPng continua devolvendo PNG', async () => {
    const saida = await otimizarPng(PNG_8X8)
    expect(Array.from(saida.subarray(1, 4))).toEqual([0x50, 0x4e, 0x47])
  })
})
