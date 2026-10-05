// Mesmo desvio H3 dos demais scripts: `require` com cast estrutural local.
const { existsSync, readdirSync, readFileSync } = require('fs') as {
  existsSync: (caminho: string) => boolean
  readdirSync: (caminho: string) => string[]
  readFileSync: (caminho: string, codificacao: 'utf8') => string
}
const { join } = require('path') as { join: (...partes: string[]) => string }

import { CAPTURAS } from './readme-images-list'
import { extensoesDe, nomesCitados, reescreverReferencias } from './imagens-referencias'

const raiz = process.cwd()
const html = readFileSync(join(raiz, 'docs', 'index.html'), 'utf8')
const readme = readFileSync(join(raiz, 'README.md'), 'utf8')
const dir = join(raiz, 'docs', 'images')

describe('reescreverReferencias (pura)', () => {
  const formatos = { 'safira-login-mobile': 'png', 'safira-home-mobile': 'webp' }
  it('troca a extensão de cada imagem citada, estática, e deixa as outras como estão', () => {
    const entrada = '<img src="images/safira-login-mobile.webp"><img src="docs/images/safira-home-mobile.png"><img src="images/outra.webp">'
    expect(reescreverReferencias(entrada, formatos)).toBe(
      '<img src="images/safira-login-mobile.png"><img src="docs/images/safira-home-mobile.webp"><img src="images/outra.webp">',
    )
  })
  it('reescreve o mapa de formatos usado pela galeria e pelo lightbox', () => {
    const entrada = "const FORMATOS = /*formatos*/{}/*fim*/;"
    expect(reescreverReferencias(entrada, formatos)).toBe(
      'const FORMATOS = /*formatos*/{"safira-login-mobile":"png","safira-home-mobile":"webp"}/*fim*/;',
    )
  })
  it('nomesCitados lista nome e extensão de cada imagem de images/', () => {
    expect(nomesCitados('a images/x-mobile.png b docs/images/y-mobile.webp')).toEqual(['x-mobile.png', 'y-mobile.webp'])
  })
  it('extensoesDe lê as extensões dos arquivos de uma pasta', () => {
    expect(extensoesDe(['a.webp', 'b.png', 'LEIA.txt'])).toEqual({ a: 'webp', b: 'png' })
  })
})

describe('referências de imagem do site e do README (nenhuma quebrada)', () => {
  const arquivos = readdirSync(dir)
  const formatos = extensoesDe(arquivos)

  it('toda captura da lista tem exatamente um arquivo em docs/images, em WebP ou PNG', () => {
    for (const { nome } of CAPTURAS) {
      const dele = arquivos.filter((a) => a.replace(/\.(webp|png|jpg)$/, '') === nome)
      expect(dele).toHaveLength(1)
    }
  })

  it('nenhum arquivo sobra em docs/images sem captura que o gere', () => {
    const nomes = new Set(CAPTURAS.map((c) => c.nome))
    expect(arquivos.filter((a) => !nomes.has(a.replace(/\.(webp|png|jpg)$/, '')))).toEqual([])
  })

  it('toda imagem citada na página e no README existe, com a extensão do arquivo gravado', () => {
    const citadas = [...nomesCitados(html), ...nomesCitados(readme)]
    expect(citadas.length).toBeGreaterThan(20)
    for (const c of citadas) {
      expect(existsSync(join(dir, c))).toBe(true)
      expect(formatos[c.replace(/\.(webp|png|jpg)$/, '')]).toBe(c.split('.').pop())
    }
  })

  it('a miniaturas da galeria e lightbox usam o mapa de formatos, nunca uma extensão fixa', () => {
    expect(html).toMatch(/const FORMATOS = \/\*formatos\*\/\{.*\}\/\*fim\*\//)
    // nenhuma montagem em JS com extensão fixa, em aspas simples ou duplas (galeria, miniaturas e lightbox)
    expect(html).not.toMatch(/\+\s*'\.(?:webp|png|jpg)['"]/)
    expect(html).not.toMatch(/\+\s*"\.(?:webp|png|jpg)['"]/)
    expect(html.match(/' \+ id \+ '\.' \+ FORMATOS\[id\]/g)?.length).toBe(2)
    for (const { nome } of CAPTURAS) expect(JSON.parse(html.match(/\/\*formatos\*\/(\{.*\})\/\*fim\*\//)![1]!)[nome]).toBe(formatos[nome])
  })

  it('cada <img> do README tem width e height, e lazy fora da primeira', () => {
    const tags = readme.match(/<img [^>]*docs\/images\/[^>]*>/g) ?? []
    expect(tags.length).toBeGreaterThanOrEqual(7)
    tags.forEach((tag, i) => {
      expect(tag).toMatch(/width="\d+"/)
      expect(tag).toMatch(/height="\d+"/)
      if (i > 0) expect(tag).toContain('loading="lazy"')
    })
  })

  it('cada <img> de imagem da página tem width e height, e lazy fora da primeira dobra (a primeira, no hero, é eager)', () => {
    const tags = html.match(/<img [^>]*images\/[^>]*>/g) ?? []
    expect(tags.length).toBeGreaterThan(20)
    for (const tag of tags) {
      expect(tag).toMatch(/width="\d+"/)
      expect(tag).toMatch(/height="\d+"/)
    }
    expect(tags.slice(1).every((t) => t.includes('loading="lazy"'))).toBe(true)
  })
})
