// Mesmo desvio H3 dos demais scripts (achado B2 do Opus): tsconfig.json restringe `types` a
// `["jest"]`, sem @types/node no programa; `require` com cast estrutural local.
const { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } = require('fs') as {
  cpSync: (de: string, para: string, opcoes?: { recursive?: boolean }) => void
  existsSync: (caminho: string) => boolean
  mkdirSync: (caminho: string, opcoes: { recursive: boolean }) => void
  readFileSync: (caminho: string, codificacao: 'utf8') => string
  rmSync: (caminho: string, opcoes: { recursive: boolean; force: boolean }) => void
  writeFileSync: (caminho: string, dados: string) => void
}
const { join } = require('path') as { join: (...partes: string[]) => string }

import { buildLlmsTxt } from '../../src/lib/llms-txt'
import { buildRobotsTxt } from '../../src/lib/robots'
import { routeSeo, siteSeo } from '../../src/config/seo'

/** Arquivos de `docs/` que vão para a raiz do Pages (a `robots.txt` e o sitemap são gerados). */
const ARQUIVOS_DA_RAIZ = ['index.html', 'icon.svg', 'og-image.jpg', 'phone.css'] as const

export interface StageOptions {
  distDir: string
  docsDir: string
  outDir: string
  /** URL pública da raiz do site, com barra final. */
  siteUrl: string
  /** Comandos do `llms.txt` da raiz (a CLI acrescenta a instalação do pacote; D5). */
  commands: string[]
}

/**
 * Script de desvio do `404.html` da raiz (achado B10 e D6): o Pages só serve o 404 da raiz do
 * projeto, então um endereço antigo fora de `/demo/` (por exemplo `/rendra-ui-app/componentes/x`,
 * citado pelo README da 1.1.0 no npm) é levado para dentro da demo, onde o app resolve a rota.
 */
export function notFoundRedirectScript(basePath: string): string {
  return `const p=location.pathname,b='${basePath}';if(!p.startsWith(b+'demo/'))location.replace(b+'demo/'+p.slice(b.length)+location.search)`
}

function locsDoSitemap(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1] as string)
}

function sitemapDaRaiz(siteUrl: string, sitemapDaDemo: string): string {
  const urls = [siteUrl, ...locsDoSitemap(sitemapDaDemo)]
  const itens = urls.map((loc) => `  <url><loc>${loc}</loc></url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${itens}\n</urlset>\n`
}

export function stagePages({ distDir, docsDir, outDir, siteUrl, commands }: StageOptions): void {
  for (const nome of ARQUIVOS_DA_RAIZ) {
    if (!existsSync(join(docsDir, nome))) throw new Error(`docs/${nome} ausente: a página de apresentação precisa dele`)
  }
  if (!existsSync(join(docsDir, 'images'))) throw new Error('docs/images ausente: a página precisa das imagens')
  if (!existsSync(join(docsDir, 'videos'))) throw new Error('docs/videos ausente: a página precisa do vídeo de apresentação')
  for (const nome of ['index.html', '404.html', 'sitemap.xml']) {
    if (!existsSync(join(distDir, nome))) throw new Error(`dist/${nome} ausente: rode npm run build:web antes`)
  }

  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })
  for (const nome of ARQUIVOS_DA_RAIZ) cpSync(join(docsDir, nome), join(outDir, nome))
  cpSync(join(docsDir, 'images'), join(outDir, 'images'), { recursive: true })
  cpSync(join(docsDir, 'videos'), join(outDir, 'videos'), { recursive: true })
  cpSync(distDir, join(outDir, 'demo'), { recursive: true })

  const basePath = new URL(siteUrl).pathname
  const script = `<script>${notFoundRedirectScript(basePath)}</script>`
  const html404 = readFileSync(join(distDir, '404.html'), 'utf8').replace('<head>', `<head>${script}`)
  writeFileSync(join(outDir, '404.html'), html404)

  writeFileSync(join(outDir, 'sitemap.xml'), sitemapDaRaiz(siteUrl, readFileSync(join(distDir, 'sitemap.xml'), 'utf8')))
  writeFileSync(join(outDir, 'robots.txt'), buildRobotsTxt(siteUrl))
  writeFileSync(
    join(outDir, 'llms.txt'),
    buildLlmsTxt({
      ...siteSeo,
      siteUrl: `${siteUrl}demo/`,
      commands,
      routes: routeSeo.filter((r) => r.indexable).map((r) => ({ path: r.path.replace(/^\//, ''), title: r.title })),
    }),
  )
}

/** URL da raiz do site: a da demo (`.../demo/`) sem o `demo/` final. */
export function rootUrlFrom(demoUrl: string): string {
  return demoUrl.replace(/demo\/$/, '')
}

/** Pasta de saída do Pages: `.pages/<primeiro segmento do baseUrl>` (`/rendra-ui-app/demo` vira `.pages/rendra-ui-app`). */
export function stageDirFrom(baseUrl: string): string {
  return `.pages/${baseUrl.split('/')[1]}`
}
