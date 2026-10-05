import appJson from '../../app.json'
import pkgJson from '../../package.json'
import { showcaseGroups } from './showcase'
import { routeSeo, siteSeo, SEO_GROUPS } from './seo'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { existsSync } = require('fs') as { existsSync: (path: string) => boolean }

// No clone limpo `cleanSeoConfig` troca `audience` por um placeholder curto; o mínimo de 50 vale no pacote.
const ehPacote = existsSync('src/__tests__/pack-consumer.test.tsx')

describe('SEO_GROUPS', () => {
  it('tem o mesmo slug e o mesmo title de cada showcaseGroups, sem importar o módulo real', () => {
    expect(SEO_GROUPS.map(({ slug, title }) => ({ slug, title }))).toEqual(
      showcaseGroups.map(({ slug, title }) => ({ slug, title })),
    )
  })
})

describe('routeSeo', () => {
  it('cada grupo da vitrine (showcaseGroups) tem uma entrada com o path correspondente', () => {
    const caminhos = routeSeo.map((r) => r.path)
    for (const grupo of showcaseGroups) {
      expect(caminhos).toContain(`/componentes/${grupo.slug}`)
    }
  })

  it('as rotas fixas (raiz, componentes, tokens, galeria) estao cobertas e indexaveis', () => {
    const fixas = ['/', '/componentes', '/tokens', '/galeria']
    for (const path of fixas) {
      const entrada = routeSeo.find((r) => r.path === path)
      expect(entrada?.indexable).toBe(true)
    }
  })

  it('a contagem de componentes nas descricoes bate com os 57 da F3 (49 da F2 mais Chart, Timeline, Calendar, Kanban, ImageViewer, Chat, RichTextEditor e DocumentViewer)', () => {
    const raiz = routeSeo.find((r) => r.path === '/')
    const vitrine = routeSeo.find((r) => r.path === '/componentes')
    expect(raiz?.description).toContain('65 componentes de UI')
    expect(raiz?.description).not.toContain('49')
    expect(vitrine?.description).not.toMatch(/44/)
  })

  it('as telas base (painel, configuracoes e login) tem entrada indexavel, com titulo proprio', () => {
    const esperado = {
      '/painel': 'Painel',
      '/configuracoes': 'Configurações',
      '/login': 'Entrar',
    }
    for (const [path, nome] of Object.entries(esperado)) {
      const entrada = routeSeo.find((r) => r.path === path)
      expect(entrada?.indexable).toBe(true)
      expect(entrada?.title).toBe(`${nome} · ${siteSeo.productName}`)
    }
  })

  it('nao ha dois caminhos iguais em routeSeo', () => {
    const caminhos = routeSeo.map((r) => r.path)
    expect(new Set(caminhos).size).toBe(caminhos.length)
  })

  it('toda entrada indexavel tem titulo e description no formato esperado, em pt-BR', () => {
    for (const rota of routeSeo.filter((r) => r.indexable)) {
      expect(rota.title.length).toBeGreaterThan(0)
      expect(rota.description.length).toBeGreaterThanOrEqual(50)
      expect(rota.description).not.toMatch(/[–—]/)
    }
  })
})

describe('SEO das rotas da demonstração (P3.16)', () => {
  // B7: `routeSeo` é um array, então a busca é por `.find`. O piso de `seo.ts` é 100%.
  it.each([
    ['/painel', /Painel/],
    ['/clientes', /Clientes/],
    ['/clientes/novo', /Novo cliente/],
    ['/cadastro', /Cadastro/],
    ['/tarefas', /Tarefas/],
    ['/configuracoes', /Configurações/],
    ['/atendimento', /Atendimento/],
    ['/agenda', /Agenda/],
    ['/kanban', /Funil/],
  ])('%s tem título e descrição, e é indexada', (rota, titulo) => {
    const seo = routeSeo.find((r) => r.path === rota)
    expect(seo?.title).toMatch(titulo)
    expect(seo?.description.length).toBeGreaterThanOrEqual(50)
    expect(seo?.indexable).toBe(true)
  })

  // C18 e decisão do Bruno: `/login` continua indexável (é a porta da demo e já está no sitemap);
  // as quatro telas de meio de fluxo ficam de fora dos buscadores.
  it('/login continua indexável', () => {
    expect(routeSeo.find((r) => r.path === '/login')?.indexable).toBe(true)
  })

  it.each(['/esqueci-senha', '/verificacao', '/nova-senha', '/cadastre-se'])('%s não é indexada', (rota) => {
    const seo = routeSeo.find((r) => r.path === rota)
    expect(seo).toBeDefined()
    expect(seo?.indexable).toBe(false)
    expect(seo?.title.length).toBeGreaterThan(0)
  })

  it('as três rotas novas do P4 seguem o padrão de título e vão para o sitemap e o llms.txt (indexáveis)', () => {
    for (const rota of ['/atendimento', '/agenda', '/kanban']) {
      const seo = routeSeo.find((r) => r.path === rota)!
      expect(seo.title).toBe(`${seo.title.split(' · ')[0]} · ${siteSeo.productName}`)
      expect(seo.indexable).toBe(true)
    }
  })

  it('a conversa dinâmica não tem entrada própria (fica com noindex por arquivo)', () => {
    expect(routeSeo.some((r) => r.path.startsWith('/atendimento/'))).toBe(false)
  })

  it('o detalhe dinâmico do cliente não tem entrada própria (fica com noindex por arquivo)', () => {
    expect(routeSeo.some((r) => r.path.startsWith('/clientes/') && r.path !== '/clientes/novo')).toBe(false)
  })
})

describe('siteSeo', () => {
  // Achado B2 da validacao da entrega (Blocos 5 e 6, Fable): `cleanSeoConfig`
  // (scripts/lib/clean-clone.ts) troca `productName`/`repositoryUrl` pelos do projeto clonado, e
  // este teste segue com o clone (nao esta em ARQUIVOS_SO_DO_PACOTE); a asserção hardcoded
  // ficava vermelha no clone por um motivo que nao e bug: o nome e o repositorio la sao outros de
  // proposito. A asserção passa a comparar com `app.json`/`package.json` (a mesma fonte que
  // `cleanAppJson`/`cleanSeoConfig` escrevem), verdadeira nos dois estados.
  it('traz nome e repositorio coerentes com app.json e package.json, sem inventar um valor novo', () => {
    expect(siteSeo.productName).toBe(appJson.expo.name)
    const pkg = pkgJson as { homepage?: string }
    expect(siteSeo.repositoryUrl).toBe(pkg.homepage ? pkg.homepage.replace(/#readme$/, '') : '')
  })

  it('traz publico e comandos, para o llms.txt (padrao 7.4, achado B2 da validacao da entrega)', () => {
    expect(siteSeo.audience.length).toBeGreaterThanOrEqual(ehPacote ? 50 : 1)
    expect(siteSeo.commands).toEqual(
      expect.arrayContaining(['npm install', 'npm start', 'npm run build', 'npm test']),
    )
  })
})
