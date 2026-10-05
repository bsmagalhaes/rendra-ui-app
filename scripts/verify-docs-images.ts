// Mesmo desvio H3 dos demais scripts (achado B2 do Opus): `require` com cast estrutural local.
const { existsSync, readdirSync, readFileSync } = require('fs') as {
  existsSync: (caminho: string) => boolean
  readdirSync: (caminho: string) => string[]
  readFileSync: (caminho: string) => Uint8Array
}
const { join } = require('path') as { join: (...partes: string[]) => string }

import { imagensForaDoPadrao, readImageSize } from './lib/docs-images-check'
import type { ImagemNomeada } from './lib/docs-images-check'

/**
 * Confere o tamanho de toda imagem gerada por `npm run docs:images`: capturas de celular em pé
 * (`docs/images/*.webp`) e a `og-image.jpg` em 1200x630 (`docs/og-image.jpg` e `public/og-image.jpg`).
 * Sai com código 1 se alguma imagem larga sobrar ou se uma `og-image.jpg` faltar.
 */
function main(): void {
  const raiz = process.cwd()
  const dirImagens = join(raiz, 'docs', 'images')
  const arquivos: ImagemNomeada[] = existsSync(dirImagens)
    ? readdirSync(dirImagens)
        .filter((nome) => /\.(webp|png|jpg)$/.test(nome))
        .map((nome) => ({ nome, bytes: readFileSync(join(dirImagens, nome)) }))
    : []
  // A og-image existe em duas cópias iguais: a da página (docs/) e a da demo (public/). Ambas em 1200x630.
  for (const relativo of ['docs/og-image.jpg', 'public/og-image.jpg']) {
    const caminho = join(raiz, ...relativo.split('/'))
    if (!existsSync(caminho)) {
      console.error(`verify-docs-images: ${relativo} ausente`)
      process.exit(1)
    }
    arquivos.push({ nome: 'og-image.jpg', bytes: readFileSync(caminho) })
  }

  for (const { nome, bytes } of arquivos) {
    const { width, height } = readImageSize(bytes)
    console.log(`${nome} ${width}x${height}`)
  }
  const fora = imagensForaDoPadrao(arquivos)
  if (fora.length > 0) {
    console.error(`verify-docs-images: fora do padrão (imagem larga ou og-image diferente de 1200x630): ${fora.join(', ')}`)
    process.exit(1)
  }
  console.log(`verify-docs-images: ${arquivos.length} imagem(ns) no padrão`)
}

if ((require as unknown as { main?: unknown }).main === module) main()
