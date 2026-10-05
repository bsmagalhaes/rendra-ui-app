// Mesmo desvio H3 já registrado em check-rules.ts/add-banner.ts (tsconfig.json restringe `types`
// a `["jest"]`, sem @types/node no programa): `require` com cast estrutural local.
const { readFileSync, writeFileSync, existsSync } = require('fs') as {
  readFileSync: (path: string, encoding: 'utf8') => string
  writeFileSync: (path: string, data: string, encoding: 'utf8') => void
  existsSync: (path: string) => boolean
}
const { join } = require('path') as { join: (...parts: string[]) => string }
import { applyRouteSeo } from './lib/seo-html'
import { siteUrlFrom, routeUrl, isDirectoryRoute, distFileFor, buildSitemapXml, NOINDEX_FILES, groupVariationFiles, clientDetailFiles, conversationFiles } from './lib/seo-paths'
import { buildRobotsTxt } from '../src/lib/robots'
import { buildLlmsTxt } from '../src/lib/llms-txt'
import { routeSeo, siteSeo } from '../src/config/seo'

function readAppJsonBaseUrl(): string {
  const appJson = JSON.parse(readFileSync(join(process.cwd(), 'app.json'), 'utf8')) as {
    expo: { experiments?: { baseUrl?: string } }
  }
  return appJson.expo.experiments?.baseUrl ?? ''
}

/** Achado M6: `homepage` do `package.json` do projeto que está rodando o build, não o do Rendra. */
function readPackageHomepage(): string | undefined {
  const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as { homepage?: string }
  return pkg.homepage
}

function main(): void {
  const distDir = join(process.cwd(), 'dist')
  const url = siteUrlFrom(readAppJsonBaseUrl(), process.env.SITE_URL, readPackageHomepage())
  const ogImageUrl = `${url}og-image.jpg`

  // Canonical e sitemap usam a mesma URL: rota que é pasta termina em barra (no Pages, sem ela é 301).
  const rotas = routeSeo.map((r) => ({ ...r, directory: isDirectoryRoute(distDir, r.path, existsSync) }))

  for (const rota of rotas) {
    const arquivo = distFileFor(distDir, rota.path, existsSync)
    const html = readFileSync(arquivo, 'utf8')
    const saida = applyRouteSeo({
      html,
      title: rota.title,
      description: rota.description,
      url: routeUrl(url, rota.path, rota.directory),
      siteName: siteSeo.productName,
      ogImageUrl,
      indexable: rota.indexable,
    })
    writeFileSync(arquivo, saida, 'utf8')
  }

  const notFound = join(distDir, '+not-found.html')
  if (existsSync(notFound)) {
    const html = readFileSync(notFound, 'utf8')
    const saida = applyRouteSeo({
      html,
      title: `Página não encontrada · ${siteSeo.productName}`,
      description: 'Página não encontrada. Volte para a página inicial ou para a vitrine de componentes.',
      url: `${url}404`,
      siteName: siteSeo.productName,
      ogImageUrl,
      indexable: false,
    })
    writeFileSync(join(distDir, '404.html'), saida, 'utf8')
  }

  for (const nome of NOINDEX_FILES) {
    const arquivo = join(distDir, nome)
    if (!existsSync(arquivo)) continue
    const html = readFileSync(arquivo, 'utf8')
    const saida = applyRouteSeo({
      html,
      title: `Página interna · ${siteSeo.productName}`,
      description: 'Página interna gerada pelo Expo Router, fora do mapa do site.',
      url: `${url}${nome}`,
      siteName: siteSeo.productName,
      ogImageUrl,
      indexable: false,
    })
    writeFileSync(arquivo, saida, 'utf8')
  }

  // Achado C8 (Opus): o export estático grava também `dist/(shell)/...`; cópias sem `index`.
  const { globSync } = require('glob') as typeof import('glob')
  const paginas = globSync('**/*.html', { cwd: distDir, posix: true })
  for (const nome of [...groupVariationFiles(paginas), ...clientDetailFiles(paginas), ...conversationFiles(paginas)]) {
    const arquivo = join(distDir, nome)
    const html = readFileSync(arquivo, 'utf8')
    const saida = applyRouteSeo({
      html,
      title: `Página interna · ${siteSeo.productName}`,
      description: 'Página interna gerada pelo Expo Router, fora do mapa do site.',
      url: `${url}${nome}`,
      siteName: siteSeo.productName,
      ogImageUrl,
      indexable: false,
    })
    writeFileSync(arquivo, saida, 'utf8')
  }

  writeFileSync(join(distDir, 'sitemap.xml'), buildSitemapXml(url, rotas), 'utf8')
  writeFileSync(join(distDir, 'robots.txt'), buildRobotsTxt(url), 'utf8')
  writeFileSync(
    join(distDir, 'llms.txt'),
    buildLlmsTxt({
      productName: siteSeo.productName,
      tagline: siteSeo.tagline,
      audience: siteSeo.audience,
      repositoryUrl: siteSeo.repositoryUrl,
      siteUrl: url,
      commands: siteSeo.commands,
      routes: routeSeo.filter((r) => r.indexable).map((r) => ({ path: r.path.replace(/^\//, ''), title: r.title })),
    }),
    'utf8',
  )

  console.log('seo-build: OK')
}

if ((require as unknown as { main?: unknown }).main === module) main()
