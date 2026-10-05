// Mesmo desvio H3 dos demais scripts: `require` com cast estrutural local (tsconfig.json restringe `types` a `["jest"]`).
interface Pipeline {
  webp: (opcoes: { lossless?: boolean; quality?: number; alphaQuality?: number; effort?: number }) => Pipeline
  png: (opcoes: { compressionLevel: number }) => Pipeline
  jpeg: (opcoes: { quality: number; mozjpeg?: boolean }) => Pipeline
  metadata: () => Promise<{ hasAlpha?: boolean }>
  toBuffer: () => Promise<Uint8Array>
}
const sharp = require('sharp') as (entrada: Uint8Array) => Pipeline

export type FormatoDeImagem = 'webp' | 'png' | 'jpg'

export interface CandidatoDeImagem {
  /** Nome legível do jeito de gravar, para a mensagem de erro (ex.: "webp sem perda"). */
  rotulo: string
  formato: FormatoDeImagem
  bytes: Uint8Array
}

/**
 * Escolhe o menor candidato (empate fica com o primeiro, que é o WebP sem perda). Função pura: nunca
 * devolve um arquivo maior que o menor candidato calculado (regra 9 do guarda-chuva).
 */
export function escolherMenor(candidatos: CandidatoDeImagem[]): CandidatoDeImagem {
  if (candidatos.length === 0) throw new Error('escolherMenor: nenhum candidato')
  return candidatos.reduce((menor, atual) => (atual.bytes.length < menor.bytes.length ? atual : menor))
}

/**
 * Todos os jeitos de gravar uma captura de tela: WebP sem perda, WebP com perda (qualidade 90, alfa sem
 * perda), PNG sem perda (nível 9, sem paleta: o `effort` do sharp quantiza em paleta e perde cor) e JPG (qualidade 90, só para imagem sem transparência, porque o JPG
 * perderia o alfa da moldura).
 */
export async function candidatosDeImagem(png: Uint8Array): Promise<CandidatoDeImagem[]> {
  const { hasAlpha } = await sharp(png).metadata()
  const [webpSemPerda, webpComPerda, pngSemPerda, jpg] = await Promise.all([
    sharp(png).webp({ lossless: true, effort: 6 }).toBuffer(),
    sharp(png).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toBuffer(),
    sharp(png).png({ compressionLevel: 9 }).toBuffer(),
    hasAlpha ? Promise.resolve(null) : sharp(png).jpeg({ quality: 90, mozjpeg: true }).toBuffer(),
  ])
  const candidatos: CandidatoDeImagem[] = [
    { rotulo: 'webp sem perda', formato: 'webp', bytes: webpSemPerda },
    { rotulo: 'webp com perda', formato: 'webp', bytes: webpComPerda },
    { rotulo: 'png sem perda', formato: 'png', bytes: pngSemPerda },
  ]
  if (jpg) candidatos.push({ rotulo: 'jpg qualidade 90', formato: 'jpg', bytes: jpg })
  return candidatos
}

export interface ImagemOtimizada {
  vencedor: CandidatoDeImagem
  candidatos: CandidatoDeImagem[]
}

/** Compara os candidatos de uma captura e devolve o menor, junto com a lista para o relatório. */
export async function otimizarImagem(
  png: Uint8Array,
  gerarCandidatos: (png: Uint8Array) => Promise<CandidatoDeImagem[]> = candidatosDeImagem,
): Promise<ImagemOtimizada> {
  const candidatos = await gerarCandidatos(png)
  return { vencedor: escolherMenor(candidatos), candidatos }
}

/** "nome: webp sem perda 12345 B, png sem perda 11000 B, ...": os bytes de cada candidato. */
export function descreverCandidatos(nome: string, candidatos: CandidatoDeImagem[]): string {
  return `${nome}: ${candidatos.map((c) => `${c.rotulo} ${c.bytes.length} B`).join(', ')}`
}

/**
 * `og-image` (PNG ou JPG, porque os rastreadores sociais não leem WebP): compara PNG sem perda e JPG
 * qualidade 90 (a imagem não tem transparência) e devolve o menor.
 */
export async function otimizarOg(png: Uint8Array): Promise<ImagemOtimizada> {
  const [semPerda, jpg] = await Promise.all([
    sharp(png).png({ compressionLevel: 9 }).toBuffer(),
    sharp(png).jpeg({ quality: 90, mozjpeg: true }).toBuffer(),
  ])
  const candidatos: CandidatoDeImagem[] = [
    { rotulo: 'png sem perda', formato: 'png', bytes: semPerda },
    { rotulo: 'jpg qualidade 90', formato: 'jpg', bytes: jpg },
  ]
  return { vencedor: escolherMenor(candidatos), candidatos }
}

/** As metatags e as listas de arquivos citam `og-image.jpg`: se o PNG vencer, para antes de gravar, com os bytes de cada candidato. */
export function exigirOgEmJpg(og: ImagemOtimizada): void {
  if (og.vencedor.formato === 'jpg') return
  throw new Error(`readme-images: o PNG da og-image venceu (${descreverCandidatos('og-image', og.candidatos)}); as metatags citam og-image.jpg`)
}

/** PNG recomprimido sem perda. */
export function otimizarPng(png: Uint8Array): Promise<Uint8Array> {
  return sharp(png).png({ compressionLevel: 9 }).toBuffer()
}
