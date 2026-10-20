// Mesmo desvio H3 dos demais scripts (achado B2 do Opus): tsconfig.json restringe `types` a
// `["jest"]`, sem @types/node no programa; `require` com cast estrutural local.
const { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } = require('fs') as {
  existsSync: (caminho: string) => boolean
  mkdirSync: (caminho: string, opcoes: { recursive: boolean }) => void
  mkdtempSync: (prefixo: string) => string
  readFileSync: (caminho: string, codificacao: 'utf8') => string
  rmSync: (caminho: string, opcoes: { recursive?: boolean; force?: boolean }) => void
  writeFileSync: (caminho: string, dados: string) => void
}
const { tmpdir } = require('os') as { tmpdir: () => string }
const { join } = require('path') as { join: (...partes: string[]) => string }

import { notFoundRedirectScript, rootUrlFrom, stageDirFrom, stagePages } from './pages-stage'

const SITE = 'https://bsmagalhaes.github.io/rendra-ui-app/'
const ARQUIVOS = ['index.html', 'icon.svg', 'og-image.jpg', 'phone.css']
const COMANDOS = ['npm install', 'npm install @rendra-ui/app']
const HTML_404 = '<!doctype html><html><head><title>Página não encontrada</title></head><body>404 da demo</body></html>'
const SITEMAP_DEMO = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset><url><loc>${SITE}demo/componentes</loc></url></urlset>\n`

function arranjo() {
  const raiz = mkdtempSync(join(tmpdir(), 'rendra-stage-'))
  const dist = join(raiz, 'dist')
  const docs = join(raiz, 'docs')
  mkdirSync(join(dist, '_expo'), { recursive: true })
  writeFileSync(join(dist, 'index.html'), '<html>demo</html>')
  writeFileSync(join(dist, '404.html'), HTML_404)
  writeFileSync(join(dist, 'sitemap.xml'), SITEMAP_DEMO)
  writeFileSync(join(dist, '_expo', 'app.js'), 'x')
  mkdirSync(join(docs, 'images'), { recursive: true })
  writeFileSync(join(docs, 'images', 'safira-home-mobile.webp'), 'webp')
  mkdirSync(join(docs, 'videos'), { recursive: true })
  writeFileSync(join(docs, 'videos', 'rendra-app-apresentacao.mp4'), 'mp4')
  for (const nome of ARQUIVOS) writeFileSync(join(docs, nome), `raiz:${nome}`)
  return { dist, docs, out: join(raiz, '.pages', 'rendra-ui-app') }
}

function montar(a: ReturnType<typeof arranjo>) {
  stagePages({ distDir: a.dist, docsDir: a.docs, outDir: a.out, siteUrl: SITE, commands: COMANDOS })
}

describe('stagePages', () => {
  it('põe a página na raiz e a demo em /demo/', () => {
    const a = arranjo()
    montar(a)
    expect(readFileSync(join(a.out, 'index.html'), 'utf8')).toBe('raiz:index.html')
    expect(readFileSync(join(a.out, 'icon.svg'), 'utf8')).toBe('raiz:icon.svg')
    expect(readFileSync(join(a.out, 'phone.css'), 'utf8')).toBe('raiz:phone.css')
    expect(readFileSync(join(a.out, 'demo', 'index.html'), 'utf8')).toBe('<html>demo</html>')
    expect(existsSync(join(a.out, 'demo', '_expo', 'app.js'))).toBe(true)
    expect(existsSync(join(a.out, 'images', 'safira-home-mobile.webp'))).toBe(true)
    expect(readFileSync(join(a.out, 'videos', 'rendra-app-apresentacao.mp4'), 'utf8')).toBe('mp4')
  })

  it('o 404 da raiz é o 404 da demo com o script de desvio; o da demo fica intacto (D6)', () => {
    const a = arranjo()
    montar(a)
    const raiz404 = readFileSync(join(a.out, '404.html'), 'utf8')
    expect(raiz404).toContain('404 da demo')
    expect(raiz404).toContain(notFoundRedirectScript('/rendra-ui-app/'))
    expect(raiz404.indexOf('<script>')).toBeGreaterThan(raiz404.indexOf('<head>'))
    expect(raiz404.indexOf('<script>')).toBeLessThan(raiz404.indexOf('<title>'))
    expect(readFileSync(join(a.out, 'demo', '404.html'), 'utf8')).toBe(HTML_404)
  })

  it('gera sitemap, robots e llms.txt da raiz, com a página e as telas da demo', () => {
    const a = arranjo()
    montar(a)
    const sitemap = readFileSync(join(a.out, 'sitemap.xml'), 'utf8')
    expect(sitemap).toContain(`<loc>${SITE}</loc>`)
    expect(sitemap).toContain(`<loc>${SITE}demo/componentes</loc>`)
    const robots = readFileSync(join(a.out, 'robots.txt'), 'utf8')
    expect(robots).toContain(`Sitemap: ${SITE}sitemap.xml`)
    expect(robots).toContain('User-agent: GPTBot\nDisallow: /')
    const llms = readFileSync(join(a.out, 'llms.txt'), 'utf8')
    expect(llms).toContain('# Rendra App')
    expect(llms).toContain(`${SITE}demo/`)
    expect(llms).toContain('npm install @rendra-ui/app')
  })

  it('o llms.txt lista só as telas indexáveis: as de autenticação do meio do fluxo ficam de fora (P3.16, D10)', () => {
    const a = arranjo()
    montar(a)
    const llms = readFileSync(join(a.out, 'llms.txt'), 'utf8')
    expect(llms).toContain(`${SITE}demo/login`)
    expect(llms).toContain(`${SITE}demo/clientes`)
    for (const oculta of ['esqueci-senha', 'verificacao', 'nova-senha', 'cadastre-se']) {
      expect(llms).not.toContain(oculta)
    }
  })

  it('apaga a saída anterior', () => {
    const a = arranjo()
    mkdirSync(a.out, { recursive: true })
    writeFileSync(join(a.out, 'velho.txt'), 'x')
    montar(a)
    expect(existsSync(join(a.out, 'velho.txt'))).toBe(false)
  })

  it('falha com mensagem clara quando falta docs/index.html', () => {
    const a = arranjo()
    rmSync(join(a.docs, 'index.html'), {})
    expect(() => montar(a)).toThrow(/docs\/index\.html ausente/)
  })

  it('falha quando falta docs/videos', () => {
    const a = arranjo()
    rmSync(join(a.docs, 'videos'), { recursive: true })
    expect(() => montar(a)).toThrow(/docs\/videos ausente/)
  })

  it('falha quando falta docs/images', () => {
    const a = arranjo()
    rmSync(join(a.docs, 'images'), { recursive: true })
    expect(() => montar(a)).toThrow(/docs\/images ausente/)
  })

  it('falha quando falta o export da demo', () => {
    const a = arranjo()
    rmSync(join(a.dist, 'index.html'), {})
    expect(() => montar(a)).toThrow(/dist\/index\.html ausente/)
  })

  it('falha quando falta o 404 ou o sitemap do export', () => {
    const a = arranjo()
    rmSync(join(a.dist, '404.html'), {})
    expect(() => montar(a)).toThrow(/dist\/404\.html ausente/)
    const b = arranjo()
    rmSync(join(b.dist, 'sitemap.xml'), {})
    expect(() => montar(b)).toThrow(/dist\/sitemap\.xml ausente/)
  })
})

describe('notFoundRedirectScript', () => {
  it('leva o endereço fora de /demo/ para dentro dele, preservando a busca', () => {
    const js = notFoundRedirectScript('/rendra-ui-app/')
    expect(js).toContain("b='/rendra-ui-app/'")
    expect(js).toContain("!p.startsWith(b+'demo/')")
    expect(js).toContain("location.replace(b+'demo/'+p.slice(b.length)+location.search)")
  })
})

describe('rootUrlFrom e stageDirFrom (usados pela CLI)', () => {
  it('a URL da raiz é a da demo sem o /demo/ final', () => {
    expect(rootUrlFrom('https://bsmagalhaes.github.io/rendra-ui-app/demo/')).toBe('https://bsmagalhaes.github.io/rendra-ui-app/')
    expect(rootUrlFrom('https://exemplo.com/x/')).toBe('https://exemplo.com/x/')
  })

  it('a pasta de saída é .pages/<primeiro segmento do baseUrl>', () => {
    expect(stageDirFrom('/rendra-ui-app/demo')).toBe('.pages/rendra-ui-app')
    expect(stageDirFrom('/meu-app')).toBe('.pages/meu-app')
  })
})
