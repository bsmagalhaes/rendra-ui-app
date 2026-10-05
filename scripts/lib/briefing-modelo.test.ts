// Amarra `docs/BRIEFING_MODELO.md` ao que o código realmente oferece: catálogo, códigos de modelo,
// cor e navegação, modelos com fonte e paletas. O briefing é o que a pessoa leiga lê pela IA, então
// cada asserção confere o texto que ela vê, nunca uma chamada. No clone (`clean:clone` troca o
// `name`, o README e as paletas), a suíte não se aplica, como as do pacote (`f2-docs.test.ts`).
import { CATALOG } from '../../src/catalog/components'
import { colorCodes, navCodes, themeCodes } from '../../src/config/presets'
import { paletteSeeds } from '../../src/brand/palettes'
import { models } from '../../src/theme/models'

const { readFileSync, existsSync } = require('fs') as {
  readFileSync: (caminho: string, codificacao: 'utf8') => string
  existsSync: (caminho: string) => boolean
}

const ehPacote = existsSync('src/__tests__/pack-consumer.test.tsx')
const suite = ehPacote ? describe : describe.skip

const briefing = ehPacote ? readFileSync('docs/BRIEFING_MODELO.md', 'utf8') : ''

type Item = { code: string; label: string }

// Aceita lista ou objeto por código (a forma real varia: `models` é objeto, o resto é lista).
function normalizar(fonte: unknown): Item[] {
  const lista: Record<string, unknown>[] = Array.isArray(fonte)
    ? (fonte as Record<string, unknown>[])
    : Object.entries(fonte as Record<string, Record<string, unknown>>).map(([code, valor]) => ({
        code,
        ...valor,
      }))
  return lista.map((entrada) => ({
    code: String(entrada.code ?? entrada.id ?? ''),
    label: String(entrada.name ?? entrada.description ?? ''),
  }))
}

const sem = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
const briefingSem = sem(briefing)

const BLOCOS = [
  'Bloco 0: Tipo de trabalho',
  'Bloco 1: Negócio e produto',
  'Bloco 2: Usuários e uso',
  'Bloco 3: Plataforma e recursos do aparelho',
  'Bloco 4: Navegação',
  'Bloco 5: Tema',
  'Bloco 6: Cores',
  'Bloco 7: Telas',
  'Bloco 8: Componentes',
  'Bloco 9: Dados',
  'Bloco 10: Acesso e integrações',
  'Bloco 11: Publicação',
  'Bloco 12: Somente para migração',
  'Bloco 13: Prazo e entrega',
  'Bloco 14: Pendências',
]

const FRASES_DE_CONDUCAO = [
  'Nada é construído antes de o briefing estar confirmado',
  'docs/BRIEFING.md',
  'agrupados numa mensagem',
  'uma decisão por mensagem',
  'não sei, sugira',
  '(padrão)',
  'responde com o número',
  'Se a ferramenta oferecer botões',
  'sem uma sugestão pronta',
  'mais de 24 horas',
  'conta a partir do dia em que é colado',
  'Migração de um sistema existente',
  'caminho A (pacote npm)',
  'caminho B (cópia dos arquivos)',
  'caminho C (refazer)',
  'spec própria',
  'fora do boilerplate',
]

const PROIBIDOS: [string, RegExp][] = [
  ['pergunta técnica: cobertura, matriz, ferramentas de checagem', /cobertura|Matriz|Fable|Sonnet|Opus|subagente|check:rules/i],
  ['pergunta técnica: formato de raio', /\braio\b|\bsquare\b|\brounded\b|\bpill\b/i],
  ['opções de layout antigas', /Tabs|Stack|Pilha|Combinação/],
  ['promessa falsa da galeria', /mostra o próprio código/i],
  ['opção sem suporte no app', /só claro/i],
  ['número fixo de componentes', /\b\d+ componentes\b/i],
  ['comando dentro do briefing', /npm run|npx /],
  ['caminho interno da máquina do autor', /docs\/superpowers/],
]

suite('docs/BRIEFING_MODELO.md amarrado ao código real', () => {
  it.each(BLOCOS)('tem o título "## %s"', (bloco) => {
    expect(briefing).toContain(`## ${bloco}`)
  })

  it('os blocos aparecem na ordem 0 a 14', () => {
    const posicoes = BLOCOS.map((bloco) => briefing.indexOf(`## ${bloco}`))
    expect(posicoes.every((posicao) => posicao >= 0)).toBe(true)
    expect([...posicoes].sort((a, b) => a - b)).toEqual(posicoes)
  })

  it('termina com a linha de status rascunho ou confirmado', () => {
    const linhas = briefing.split(/\r?\n/).filter((linha) => linha.trim() !== '')
    const ultima = linhas[linhas.length - 1]!
    expect(ultima.trim()).toBe('Status do briefing: rascunho | confirmado em DD/MM/AAAA')
  })

  it.each(FRASES_DE_CONDUCAO)('contém "%s"', (frase) => {
    expect(briefing).toContain(frase)
  })

  it('orienta abas demais (overflow="scroll") e oferece busca com filtros (trailingAction e Sheet)', () => {
    expect(briefing).toContain('overflow="scroll"')
    expect(briefing).toContain('countLabel')
    expect(briefing).toContain('Busca com filtros')
    expect(briefing).toContain('trailingAction')
    expect(briefing).toContain('FOL-001')
  })

  it('todo código do CATALOG aparece no briefing', () => {
    const ausentes = CATALOG.map((entrada) => entrada.code).filter((code) => !briefing.includes(code))
    expect(ausentes).toEqual([])
  })

  it('todo código de componente citado existe no CATALOG', () => {
    // Formato real do catálogo: COMPONENT_CODE_PATTERN em src/catalog/components.ts (3 a 4 letras).
    const reais = new Set(CATALOG.map((entrada) => entrada.code))
    const citados = briefing.match(/\b[A-Z]{2,5}-\d{3}\b/g) ?? []
    expect(citados.filter((code) => !reais.has(code))).toEqual([])
  })

  it.each([
    ['themeCodes', themeCodes],
    ['colorCodes', colorCodes],
    ['navCodes', navCodes],
  ])('todo item de %s aparece no briefing com código e nome', (_nome, fonte) => {
    const itens = normalizar(fonte)
    expect(itens.length).toBeGreaterThan(0)
    for (const item of itens) {
      expect(item.label).not.toBe('')
      expect(briefing).toContain(item.code)
      expect(briefingSem).toContain(sem(item.label))
    }
  })

  it('todo T#, C# e N# citado existe nos códigos reais', () => {
    const reais = new Set(
      [themeCodes, colorCodes, navCodes].flatMap((fonte) => normalizar(fonte)).map((item) => item.code),
    )
    const citados = briefing.match(/\b[TCN]\d\b/g) ?? []
    expect(citados.filter((code) => !reais.has(code))).toEqual([])
  })

  it('todo modelo aparece com o nome e a fonte do código na mesma linha', () => {
    const linhas = briefing.split(/\r?\n/)
    for (const modelo of Object.values(models)) {
      const familia = modelo.fontFamily.normal.split('_')[0]! // Poppins, DMSans, Inter
      const linha = linhas.find(
        (l) => sem(l).includes(sem(modelo.name)) && l.replace(/\s/g, '').includes(familia),
      )
      expect(linha).toBeDefined()
    }
  })

  it('toda paleta pronta aparece pelo nome', () => {
    const itens = normalizar(paletteSeeds)
    expect(itens.length).toBeGreaterThan(0)
    for (const item of itens) {
      expect(item.label).not.toBe('')
      expect(briefingSem).toContain(sem(item.label))
    }
  })

  it.each(PROIBIDOS)('não tem %s', (_motivo, padrao) => {
    expect(briefing).not.toMatch(padrao)
  })
})
