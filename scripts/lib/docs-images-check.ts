export interface PngSize {
  width: number
  height: number
}

export interface ImagemNomeada {
  nome: string
  /** Bytes do arquivo: PNG ou JPG (`og-image`) ou WebP, PNG ou JPG (capturas de `docs/images`). */
  bytes: Uint8Array
}

const ASSINATURA = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

/** Lê largura e altura do cabeçalho IHDR (bytes 16 e 20); recusa arquivo sem a assinatura PNG. */
export function readPngSize(bytes: Uint8Array): PngSize {
  if (bytes.length < 24 || ASSINATURA.some((valor, i) => bytes[i] !== valor)) {
    throw new Error('arquivo não é um PNG válido')
  }
  const visao = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  return { width: visao.getUint32(16), height: visao.getUint32(20) }
}

const texto = (bytes: Uint8Array, de: number, ate: number): string => String.fromCharCode(...bytes.subarray(de, ate))

/**
 * Lê largura e altura de um WebP (RIFF/WEBP) nos três formatos: `VP8 ` (com perda), `VP8L` (sem perda)
 * e `VP8X` (estendido, com alfa); recusa arquivo que não é WebP.
 */
export function readWebpSize(bytes: Uint8Array): PngSize {
  if (bytes.length < 30 || texto(bytes, 0, 4) !== 'RIFF' || texto(bytes, 8, 12) !== 'WEBP') {
    throw new Error('arquivo não é um WebP válido')
  }
  const visao = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const formato = texto(bytes, 12, 16)
  if (formato === 'VP8X') {
    const uint24 = (de: number): number => bytes[de]! | (bytes[de + 1]! << 8) | (bytes[de + 2]! << 16)
    return { width: uint24(24) + 1, height: uint24(27) + 1 }
  }
  if (formato === 'VP8L') {
    const bits = visao.getUint32(21, true)
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
  }
  if (formato === 'VP8 ') return { width: visao.getUint16(26, true) & 0x3fff, height: visao.getUint16(28, true) & 0x3fff }
  throw new Error(`WebP com bloco desconhecido: ${formato}`)
}

/** Lê largura e altura de um JPEG pelo primeiro segmento SOF (SOF0 a SOF15, menos DHT, JPG e DAC); recusa arquivo que não é JPEG. */
export function readJpegSize(bytes: Uint8Array): PngSize {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('arquivo não é um JPEG válido')
  let i = 2
  while (i + 9 < bytes.length) {
    if (bytes[i] !== 0xff) throw new Error('JPEG com segmento malformado')
    const marcador = bytes[i + 1]!
    if (marcador >= 0xc0 && marcador <= 0xcf && marcador !== 0xc4 && marcador !== 0xc8 && marcador !== 0xcc) {
      return { height: (bytes[i + 5]! << 8) | bytes[i + 6]!, width: (bytes[i + 7]! << 8) | bytes[i + 8]! }
    }
    i += 2 + ((bytes[i + 2]! << 8) | bytes[i + 3]!)
  }
  throw new Error('JPEG sem segmento SOF')
}

/** Tamanho de um PNG, WebP ou JPEG, pela assinatura do arquivo. */
export function readImageSize(bytes: Uint8Array): PngSize {
  if (texto(bytes, 0, 4) === 'RIFF') return readWebpSize(bytes)
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return readJpegSize(bytes)
  return readPngSize(bytes)
}

/**
 * Nomes fora do padrão de um produto mobile: qualquer imagem que não seja a `og-image` e não
 * seja em pé (altura maior que a largura), e a `og-image` (PNG ou JPG) diferente de 1200x630.
 */
export function imagensForaDoPadrao(arquivos: ImagemNomeada[]): string[] {
  return arquivos
    .filter(({ nome, bytes }) => {
      const { width, height } = readImageSize(bytes)
      return /^og-image.(png|jpg)$/.test(nome) ? width !== 1200 || height !== 630 : height <= width
    })
    .map(({ nome }) => nome)
}
