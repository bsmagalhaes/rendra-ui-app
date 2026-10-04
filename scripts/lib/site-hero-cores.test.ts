// Amarra as cores das amostras do hero da página (`docs/index.html`) à fonte de verdade das paletas do app,
// para o HTML estático não divergir de `src/brand/palettes.ts`. Também confere que os botões de modelo
// existem em `themeCodes`.
import { paletteSeeds } from '../../src/brand/palettes'
import { colorCodes, themeCodes } from '../../src/config/presets'

const { readFileSync } = require('fs') as { readFileSync: (caminho: string, codificacao: 'utf8') => string }
const { join } = require('path') as { join: (...partes: string[]) => string }

const html = readFileSync(join(process.cwd(), 'docs', 'index.html'), 'utf8')

function atributos(tag: string): Record<string, string> {
  return Object.fromEntries([...tag.matchAll(/([a-z-]+)="([^"]*)"/g)].map((m) => [m[1] as string, m[2] as string]))
}

function botoes(atributo: string): Array<Record<string, string>> {
  return [...html.matchAll(/<button\b[^>]*>/g)]
    .map((m) => atributos(m[0]))
    .filter((a) => atributo in a)
}

describe('hero da página: botões de modelo e de paleta', () => {
  const paletas = botoes('data-paleta')
  const modelos = botoes('data-modelo')

  it('tem exatamente 4 botões de paleta e 3 de modelo', () => {
    expect(paletas).toHaveLength(4)
    expect(modelos).toHaveLength(3)
  })

  it('cada botão de modelo aponta para um código que existe em themeCodes', () => {
    const codigos = themeCodes.map((t) => t.code)
    for (const m of modelos) expect(codigos).toContain(m['data-modelo'])
    expect(modelos.map((m) => m['data-modelo'])).toEqual(codigos)
  })

  it('data-cor de cada paleta é o primary da semente correspondente de palettes.ts', () => {
    for (const cor of colorCodes) {
      const botao = paletas.find((p) => p['data-paleta'] === cor.code)
      const semente = paletteSeeds.find((x) => x.id === cor.palette)
      expect({ codigo: cor.code, cor: botao?.['data-cor'] }).toEqual({ codigo: cor.code, cor: semente?.primary })
    }
  })

  it('a amostra de cada botão de paleta pinta o mesmo hex de data-cor', () => {
    const blocos = [...html.matchAll(/<button\b[^>]*data-paleta="(C\d)"[^>]*>([\s\S]*?)<\/button>/g)]
    expect(blocos).toHaveLength(4)
    for (const m of blocos) {
      const botao = atributos(m[0].match(/<button\b[^>]*>/)![0])
      const amostra = (m[2] as string).match(/<span\b[^>]*style="[^"]*background:\s*(#[0-9a-fA-F]{6})/)
      expect({ codigo: m[1], amostra: amostra?.[1]?.toLowerCase() }).toEqual({ codigo: m[1], amostra: botao['data-cor'] })
    }
  })
})
