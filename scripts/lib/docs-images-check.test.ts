import { imagensForaDoPadrao, readImageSize, readJpegSize, readPngSize, readWebpSize } from './docs-images-check'

/** JPEG mínimo: SOI, um segmento APP0 e o SOF0 com altura e largura. */
function jpeg(largura: number, altura: number): Uint8Array {
  const app0 = [0xff, 0xe0, 0x00, 0x04, 0x00, 0x00]
  const sof = [0xff, 0xc0, 0x00, 0x0b, 0x08, altura >> 8, altura & 0xff, largura >> 8, largura & 0xff, 0x01, 0x01, 0x11, 0x00]
  return Uint8Array.from([0xff, 0xd8, ...app0, ...sof, 0xff, 0xd9])
}

function png(largura: number, altura: number): Uint8Array {
  const bytes = new Uint8Array(24)
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0)
  const visao = new DataView(bytes.buffer)
  visao.setUint32(8, 13)
  bytes.set([0x49, 0x48, 0x44, 0x52], 12)
  visao.setUint32(16, largura)
  visao.setUint32(20, altura)
  return bytes
}

function webp(formato: 'VP8 ' | 'VP8L' | 'VP8X', largura: number, altura: number): Uint8Array {
  const bytes = new Uint8Array(40)
  bytes.set(Array.from('RIFF', (c) => c.charCodeAt(0)), 0)
  bytes.set(Array.from('WEBP', (c) => c.charCodeAt(0)), 8)
  bytes.set(Array.from(formato, (c) => c.charCodeAt(0)), 12)
  const visao = new DataView(bytes.buffer)
  if (formato === 'VP8X') {
    for (let i = 0; i < 3; i++) {
      bytes[24 + i] = ((largura - 1) >> (8 * i)) & 0xff
      bytes[27 + i] = ((altura - 1) >> (8 * i)) & 0xff
    }
  } else if (formato === 'VP8L') {
    visao.setUint32(21, (largura - 1) | ((altura - 1) << 14), true)
  } else {
    visao.setUint16(26, largura, true)
    visao.setUint16(28, altura, true)
  }
  return bytes
}

describe('docs-images-check', () => {
  it.each(['VP8 ', 'VP8L', 'VP8X'] as const)('lê largura e altura de um WebP %s', (formato) => {
    expect(readWebpSize(webp(formato, 1242, 2604))).toEqual({ width: 1242, height: 2604 })
    expect(readImageSize(webp(formato, 1242, 2604))).toEqual({ width: 1242, height: 2604 })
  })

  it('recusa arquivo que não é WebP e bloco desconhecido', () => {
    expect(() => readWebpSize(new TextEncoder().encode('isto não é um webp de verdade, nem de longe'))).toThrow(/não é um WebP/)
    const estranho = webp('VP8X', 10, 10)
    estranho.set(Array.from('ABCD', (c) => c.charCodeAt(0)), 12)
    expect(() => readWebpSize(estranho)).toThrow(/bloco desconhecido/)
  })

  it('lê largura e altura do cabeçalho do PNG', () => {
    expect(readPngSize(png(1170, 2532))).toEqual({ width: 1170, height: 2532 })
  })

  it('recusa arquivo que não é PNG', () => {
    expect(() => readPngSize(new TextEncoder().encode('isto não é um png de verdade'))).toThrow(/não é um PNG/)
  })

  it('acusa imagem larga (1920x1080) e aceita celular em pé e a og-image 1200x630', () => {
    const lista = [
      { nome: 'safira-componentes.webp', bytes: webp('VP8L', 1920, 1080) },
      { nome: 'safira-home-mobile.webp', bytes: webp('VP8X', 1194, 2556) },
      { nome: 'og-image.png', bytes: png(1200, 630) },
    ]
    expect(imagensForaDoPadrao(lista)).toEqual(['safira-componentes.webp'])
  })

  it('lê o tamanho de um JPEG e confere a og-image.jpg em 1200x630', () => {
    expect(readJpegSize(jpeg(1200, 630))).toEqual({ width: 1200, height: 630 })
    expect(readImageSize(jpeg(1200, 630))).toEqual({ width: 1200, height: 630 })
    expect(imagensForaDoPadrao([{ nome: 'og-image.jpg', bytes: jpeg(1200, 630) }])).toEqual([])
    expect(imagensForaDoPadrao([{ nome: 'og-image.jpg', bytes: jpeg(1200, 600) }])).toEqual(['og-image.jpg'])
    expect(() => readJpegSize(Uint8Array.from([1, 2, 3]))).toThrow(/JPEG/)
  })

  it('acusa og-image fora de 1200x630', () => {
    expect(imagensForaDoPadrao([{ nome: 'og-image.png', bytes: png(1200, 600) }])).toEqual(['og-image.png'])
  })
})
