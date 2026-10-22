// CLI fina: só lê `argv`, chama as funções puras de `./lib/clean-clone.ts` e escreve em disco.
// Sem @types/node no programa (tsconfig.json restringe `types` a `["jest"]`, mesmo desvio de
// scripts/add-banner.ts e scripts/check-rules.ts): `require` com cast local.
const fs = require('fs') as {
  readFileSync: (p: string, e: 'utf8') => string
  writeFileSync: (p: string, c: string) => void
  rmSync: (p: string, o: { recursive: boolean; force: boolean }) => void
  existsSync: (p: string) => boolean
}
const path = require('path') as { join: (...p: string[]) => string }

import {
  cleanPackageJson,
  cleanAppJson,
  isAlreadyClean,
  cleanCiYml,
  cleanPlaywrightConfig,
  stripPackageCommands,
  buildCloneReadme,
  buildCloneChangelog,
  cleanSeoConfig,
  isNomeValido,
  type PackageJsonLike,
} from './lib/clean-clone'

function lerArg(nomeFlag: string): string | undefined {
  const indice = process.argv.indexOf(nomeFlag)
  return indice === -1 ? undefined : process.argv[indice + 1]
}

function dataHoje(): string {
  const agora = new Date()
  const dia = String(agora.getDate()).padStart(2, '0')
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  return `${dia}/${mes}/${agora.getFullYear()}`
}

const ARQUIVOS_DE_AGENTE = [
  'AGENTS.md',
  'CLAUDE.md',
  'GEMINI.md',
  '.github/copilot-instructions.md',
  '.cursor/rules/rendra.mdc',
  '.windsurfrules',
]

// Achado M2 da validação da entrega (Blocos 5 e 6, Fable): `verify-pack.jest.config.js` só serve
// a `scripts/verify-pack.ts` (já removido aqui embaixo); e `CONTRIBUTING.md` (levantamento seção
// 2, item 5, "recomendação: remover") fala de fork do Rendra, TDD do próprio Rendra App e da
// seção "Antes de cada versão" (tag, `verify:pack -- --publicacao`), processo de publicação que o
// clone não tem: sai inteiro, a IA cria um `CONTRIBUTING.md` do projeto se pedirem.
export const ARQUIVOS_SO_DO_PACOTE = [
  '.github/workflows/publish.yml',
  'tsconfig.lib.json',
  'scripts/verify-pack.ts',
  'scripts/verify-pack.jest.config.js',
  'scripts/lib/verify-pack-checks.ts',
  'scripts/lib/verify-pack-checks.test.ts',
  'src/__tests__/pack-consumer.test.tsx',
  // Lê a seção "## Créditos" do README do pacote, que o README do clone não tem.
  'src/__tests__/creditos.test.ts',
  'src/index.ts',
  'src/index.test.ts',
  // Testes dos subcaminhos da F3: importam `./index`, que o clone não tem.
  'src/chart.test.ts',
  'src/rich-text-editor.test.ts',
  'src/document-viewer.test.ts',
  'CONTRIBUTING.md',
]

// Achado B5 (Opus, páginas e demo): a página de apresentação do Rendra, a montagem do Pages com `/demo/`
// e os testes que só existem por causa dela não fazem parte do produto de quem clona. Ficam:
// `docs/phone.css`, `scripts/lib/phone-frame.ts` e `scripts/lib/og-html.ts`, que o `docs:images` do clone usa.
export const ARQUIVOS_DA_PAGINA = [
  'docs/index.html',
  'docs/icon.svg',
  'docs/og-image.jpg',
  'docs/videos',
  'e2e/site.spec.ts',
  'e2e/demo-subcaminho.spec.ts',
  'e2e/demo-fluxos.spec.ts',
  'scripts/pages-stage.ts',
  'scripts/lib/pages-stage.ts',
  'scripts/lib/pages-stage.test.ts',
  'scripts/lib/site-tokens.test.ts',
  'scripts/lib/site-images.test.ts',
  'scripts/lib/readme-links.test.ts',
  'scripts/lib/icon-svg.test.ts',
  'scripts/lib/site-hero-cores.test.ts',
  'scripts/lib/imagens-referencias.test.ts',
  'scripts/lib/f2-docs.test.ts',
]

// Achado M8 da validação da entrega (Blocos 5 e 6, Fable): a orquestração inteira ganha `raiz`
// como parâmetro e devolve um resultado em vez de chamar `process.exit`, para ser exercitada por
// teste (`scripts/clean-clone.test.ts`) sobre uma cópia de verdade dos arquivos rastreados, não só
// função pura por função pura.
export function orchestrate(raiz: string, nome: string | undefined): { codigo: number; mensagem: string } {
  if (!nome) {
    return { codigo: 1, mensagem: 'clean-clone: passe --nome <nome-do-projeto>' }
  }
  if (!isNomeValido(nome)) {
    return {
      codigo: 1,
      mensagem: 'clean-clone: --nome precisa ser minúsculo, começar com letra ou número, só letras/números/hífen.',
    }
  }
  const pkgPath = path.join(raiz, 'package.json')
  const pkgOriginal = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as PackageJsonLike
  if (isAlreadyClean(pkgOriginal)) {
    return { codigo: 0, mensagem: 'clean-clone: projeto já limpo, nada a fazer.' }
  }
  const versaoDeOrigem = String(pkgOriginal.version ?? '0.0.0')

  fs.writeFileSync(pkgPath, `${JSON.stringify(cleanPackageJson(pkgOriginal, nome), null, 2)}\n`)

  const appJsonPath = path.join(raiz, 'app.json')
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'))
  fs.writeFileSync(appJsonPath, `${JSON.stringify(cleanAppJson(appJson, nome), null, 2)}\n`)

  const ciPath = path.join(raiz, '.github', 'workflows', 'ci.yml')
  if (fs.existsSync(ciPath)) fs.writeFileSync(ciPath, cleanCiYml(fs.readFileSync(ciPath, 'utf8'), nome))

  const playwrightPath = path.join(raiz, 'playwright.config.ts')
  if (fs.existsSync(playwrightPath)) {
    fs.writeFileSync(playwrightPath, cleanPlaywrightConfig(fs.readFileSync(playwrightPath, 'utf8'), nome))
  }

  for (const relativo of ARQUIVOS_DE_AGENTE) {
    const alvo = path.join(raiz, relativo)
    if (fs.existsSync(alvo)) fs.writeFileSync(alvo, stripPackageCommands(fs.readFileSync(alvo, 'utf8')))
  }

  // Achado do veredito Fable v2: docs/BRIEFING_MODELO.md não é um "arquivo de agente" (não repete
  // o bloco espelhado de AGENTS.md), mas cita CONTRIBUTING.md do mesmo jeito (Passo "Tipo de
  // trabalho", item 3); sem esta linha, o clone ficava com a mesma citação a um arquivo removido.
  const briefingModeloPath = path.join(raiz, 'docs', 'BRIEFING_MODELO.md')
  if (fs.existsSync(briefingModeloPath)) {
    fs.writeFileSync(briefingModeloPath, stripPackageCommands(fs.readFileSync(briefingModeloPath, 'utf8')))
  }

  fs.writeFileSync(path.join(raiz, 'README.md'), buildCloneReadme(nome))
  fs.writeFileSync(path.join(raiz, 'CHANGELOG.md'), buildCloneChangelog(versaoDeOrigem, dataHoje()))

  const seoPath = path.join(raiz, 'src', 'config', 'seo.ts')
  if (fs.existsSync(seoPath)) fs.writeFileSync(seoPath, cleanSeoConfig(fs.readFileSync(seoPath, 'utf8'), nome))

  for (const relativo of [...ARQUIVOS_SO_DO_PACOTE, ...ARQUIVOS_DA_PAGINA]) {
    const alvo = path.join(raiz, relativo)
    if (fs.existsSync(alvo)) fs.rmSync(alvo, { recursive: true, force: true })
  }

  for (const relativo of [
    'scripts/clean-clone.ts',
    'scripts/clean-clone.test.ts',
    'scripts/lib/clean-clone.ts',
    'scripts/lib/clean-clone.test.ts',
  ]) {
    const alvo = path.join(raiz, relativo)
    if (fs.existsSync(alvo)) fs.rmSync(alvo, { recursive: true, force: true })
  }

  return {
    codigo: 0,
    mensagem: `clean-clone: projeto renomeado para ${nome}, identidade de pacote do Rendra removida.`,
  }
}

function main(): void {
  const resultado = orchestrate(process.cwd(), lerArg('--nome'))
  if (resultado.codigo === 0) console.log(resultado.mensagem)
  else console.error(resultado.mensagem)
  if (resultado.codigo !== 0) process.exit(resultado.codigo)
}

if ((require as unknown as { main?: unknown }).main === module) main()
