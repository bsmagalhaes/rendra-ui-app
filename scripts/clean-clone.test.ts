// Achado M8 da validação da entrega (Blocos 5 e 6, Fable): os testes de scripts/lib/clean-clone.ts
// cobrem cada função pura isoladamente, mas nenhum exercitava a orquestração inteira da CLI
// (`orchestrate`), que é onde os achados B1, B2, M1 e M2 moravam: um clone que passava função por
// função, mas cuja árvore final tinha `scripts/lib/agent-files.test.ts` e `src/config/seo.test.ts`
// vermelhos de verdade. Este teste copia só os arquivos rastreados deste repositório
// (`git ls-files`, nunca o que já está fora do índice) para uma pasta temporária e roda
// `orchestrate` sobre a cópia, como um clone de verdade.
//
// Mesmo desvio H3 já registrado em scripts/verify-build.test.ts e scripts/lib/agent-files.test.ts:
// tsconfig.json restringe `types` a `["jest"]`, sem @types/node; `require` com cast local.
const { mkdtempSync, mkdirSync, copyFileSync, readFileSync, existsSync, rmSync, readdirSync, statSync } = require('fs') as {
  mkdtempSync: (prefix: string) => string
  mkdirSync: (path: string, options: { recursive: boolean }) => void
  copyFileSync: (src: string, dest: string) => void
  readFileSync: (path: string, encoding: 'utf8') => string
  existsSync: (path: string) => boolean
  rmSync: (path: string, options: { recursive: boolean; force: boolean }) => void
  readdirSync: (path: string) => string[]
  statSync: (path: string) => { isDirectory: () => boolean }
}
const { tmpdir } = require('os') as { tmpdir: () => string }
const { join, dirname } = require('path') as { join: (...parts: string[]) => string; dirname: (p: string) => string }
const { execSync } = require('child_process') as {
  execSync: (comando: string, opcoes: { cwd: string; encoding: 'utf8' }) => string
}

import { orchestrate, ARQUIVOS_SO_DO_PACOTE } from './clean-clone'

function copiarArquivosRastreados(raizOrigem: string, destino: string): void {
  const lista = execSync('git ls-files', { cwd: raizOrigem, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
  for (const relativo of lista) {
    const alvo = join(destino, relativo)
    mkdirSync(dirname(alvo), { recursive: true })
    copyFileSync(join(raizOrigem, relativo), alvo)
  }
}

describe('orchestrate (scripts/clean-clone.ts), sobre uma cópia real dos arquivos rastreados', () => {
  it('limpa um clone de verdade: arquivos só do pacote somem, LICENSE fica idêntico, AGENTS.md sem build:lib/verify:pack/clean:clone mas com docs:images, seo.ts coerente com app.json', () => {
    const dir = mkdtempSync(join(tmpdir(), 'clean-clone-orquestracao-'))
    copiarArquivosRastreados(process.cwd(), dir)

    const resultado = orchestrate(dir, 'meu-app')
    expect(resultado.codigo).toBe(0)
    expect(resultado.mensagem).toContain('meu-app')

    for (const relativo of ARQUIVOS_SO_DO_PACOTE) {
      expect(existsSync(join(dir, relativo))).toBe(false)
    }
    // B1 da simulação dos leigos: teste que lê `docs/index.html` some junto com a página; nenhum teste que
    // sobra no clone pode ler esse arquivo, senão o `npm test` do clone nasce vermelho.
    for (const relativo of ['scripts/lib/site-hero-cores.test.ts', 'scripts/lib/imagens-referencias.test.ts', 'scripts/lib/f2-docs.test.ts']) {
      expect(existsSync(join(dir, relativo))).toBe(false)
    }
    const restantes: string[] = []
    const varrer = (pasta: string): void => {
      for (const nome of readdirSync(pasta)) {
        const caminho = join(pasta, nome)
        if (nome === 'node_modules' || nome === '.git') continue
        if (statSync(caminho).isDirectory()) varrer(caminho)
        else if (/\.test\.[jt]sx?$/.test(nome) && /docs['"`,\s/\\]+index\.html/.test(readFileSync(caminho, 'utf8'))) restantes.push(caminho.slice(dir.length + 1))
      }
    }
    for (const pasta of ['scripts', 'src', 'e2e']) if (existsSync(join(dir, pasta))) varrer(join(dir, pasta))
    expect(restantes).toEqual([])
    // Nomes fixos, não a variável importada: uma futura edição que tire um nome da lista por
    // engano (como aconteceu com `CONTRIBUTING.md`/`verify-pack.jest.config.js`, achado M2) não
    // engana o teste acima, que só prova o que já está na lista.
    expect(existsSync(join(dir, '.github/workflows/publish.yml'))).toBe(false)
    expect(existsSync(join(dir, 'scripts/verify-pack.jest.config.js'))).toBe(false)
    expect(existsSync(join(dir, 'CONTRIBUTING.md'))).toBe(false)
    expect(existsSync(join(dir, 'tsconfig.lib.json'))).toBe(false)
    expect(existsSync(join(dir, 'src/index.ts'))).toBe(false)
    // Lacuna 1 da simulação dos leigos da 1.2.0: os testes dos subcaminhos importam `./index`, que o clone não tem.
    for (const teste of ['src/chart.test.ts', 'src/rich-text-editor.test.ts', 'src/document-viewer.test.ts']) {
      expect(existsSync(join(dir, teste))).toBe(false)
    }

    const licencaOriginal = readFileSync(join(process.cwd(), 'LICENSE'), 'utf8')
    expect(readFileSync(join(dir, 'LICENSE'), 'utf8')).toBe(licencaOriginal)

    const agents = readFileSync(join(dir, 'AGENTS.md'), 'utf8')
    expect(agents).not.toContain('npm run build:lib')
    expect(agents).not.toContain('npm run verify:pack')
    expect(agents).not.toContain('npm run clean:clone')
    expect(agents).toContain('npm run docs:images')
    expect(agents).toContain('Leia e siga o `AGENTS.md`')
    // Lacuna não bloqueadora do veredito Fable v2: AGENTS.md e docs/BRIEFING_MODELO.md citavam
    // CONTRIBUTING.md (removido em todo clone, ver ARQUIVOS_SO_DO_PACOTE acima).
    expect(agents).not.toContain('CONTRIBUTING.md')

    const briefingModelo = readFileSync(join(dir, 'docs/BRIEFING_MODELO.md'), 'utf8')
    expect(briefingModelo).not.toContain('CONTRIBUTING.md')
    expect(briefingModelo).toContain('Migração de um sistema existente')

    const seoTs = readFileSync(join(dir, 'src/config/seo.ts'), 'utf8')
    expect(seoTs).toContain("productName: 'meu-app'")
    expect(seoTs).toContain("repositoryUrl: ''")
    // Lacuna não bloqueadora do veredito Fable v2: llms.txt (buildLlmsTxt, gerado no build a
    // partir de siteSeo.tagline/audience) não pode herdar a tagline/audience do Rendra App. Só o
    // campo `tagline` de `siteSeo` está em escopo aqui (não as `description` de cada rota, usadas
    // nas meta tags do build, fora do pedido desta rodada).
    expect(seoTs).toContain("tagline: 'Descreva aqui o que meu-app faz.',")
    expect(seoTs).not.toMatch(/tagline: 'Design system e boilerplate mobile do Rendra/)

    const appJson = JSON.parse(readFileSync(join(dir, 'app.json'), 'utf8')) as { expo: { name: string } }
    expect(appJson.expo.name).toBe('meu-app')

    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as {
      private?: boolean
      homepage?: string
    }
    expect(pkg.private).toBe(true)
    expect(pkg.homepage).toBeUndefined()

    // Achado B5: o clone não herda a página de apresentação nem o subcaminho /demo/ do Rendra.
    // Nomes fixos, não a variável importada.
    for (const relativo of [
      'docs/index.html',
      'docs/icon.svg',
      'docs/og-image.jpg',
      'e2e/site.spec.ts',
      'e2e/demo-subcaminho.spec.ts',
      'scripts/pages-stage.ts',
      'scripts/lib/pages-stage.ts',
      'scripts/lib/pages-stage.test.ts',
      'scripts/lib/site-tokens.test.ts',
      'scripts/lib/site-images.test.ts',
      'scripts/lib/icon-svg.test.ts',
    ]) {
      expect([relativo, existsSync(join(dir, relativo))]).toEqual([relativo, false])
    }
    // A moldura e a geração das imagens ficam: o docs:images do clone as usa.
    for (const relativo of ['docs/phone.css', 'scripts/lib/phone-frame.ts', 'scripts/lib/og-html.ts', 'scripts/readme-images.ts']) {
      expect([relativo, existsSync(join(dir, relativo))]).toEqual([relativo, true])
    }
    const pkgLimpo = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { scripts: Record<string, string> }
    expect(pkgLimpo.scripts['pages:stage']).toContain(".pages/meu-app'")
    expect(pkgLimpo.scripts['pages:stage']).not.toContain('demo')
    expect(pkgLimpo.scripts['pages:stage']).not.toContain('pages-stage.ts')
    expect(pkgLimpo.scripts['test:site']).toBeUndefined()
    expect(pkgLimpo.scripts['test:demo']).toBeUndefined()
    expect(pkgLimpo.scripts['docs:images']).toBeDefined()
    const app = JSON.parse(readFileSync(join(dir, 'app.json'), 'utf8')) as { expo: { experiments: { baseUrl: string } } }
    expect(app.expo.experiments.baseUrl).toBe('/meu-app')
    const playwright = readFileSync(join(dir, 'playwright.config.ts'), 'utf8')
    expect(playwright).not.toMatch(/demo\/|site-desktop|site-mobile|testIgnore/)
    expect(playwright).toContain('http://localhost:4173/meu-app/')
    const ci = readFileSync(join(dir, '.github/workflows/ci.yml'), 'utf8')
    expect(ci).not.toMatch(/test:site|test:demo|pages:stage|docs:images:check/)
    expect(ci).toContain('path: .pages/meu-app')
    expect(readFileSync(join(dir, 'AGENTS.md'), 'utf8')).not.toMatch(/npm run test:(site|demo)/)

    rmSync(dir, { recursive: true, force: true })
  })

  it('recusa --nome ausente ou inválido, com código 1, sem escrever nada', () => {
    const dir = mkdtempSync(join(tmpdir(), 'clean-clone-erro-'))
    copiarArquivosRastreados(process.cwd(), dir)
    const pkgAntes = readFileSync(join(dir, 'package.json'), 'utf8')

    expect(orchestrate(dir, undefined).codigo).toBe(1)
    expect(orchestrate(dir, 'Meu App').codigo).toBe(1)
    expect(orchestrate(dir, '-meu-app').codigo).toBe(1)

    expect(readFileSync(join(dir, 'package.json'), 'utf8')).toBe(pkgAntes)

    rmSync(dir, { recursive: true, force: true })
  })
})
