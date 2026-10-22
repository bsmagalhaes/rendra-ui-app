// eslint-disable-next-line @typescript-eslint/no-require-imports -- sem @types/node no tsconfig
const fs = require('fs') as {
  readFileSync: (caminho: string, codificacao: 'utf8') => string
  existsSync: (caminho: string) => boolean
  readdirSync: (caminho: string, opcoes: { withFileTypes: true }) => { name: string; isDirectory: () => boolean }[]
}
// eslint-disable-next-line @typescript-eslint/no-require-imports -- sem @types/node no tsconfig
const path = require('path') as { join: (...partes: string[]) => string; relative: (de: string, para: string) => string }

/**
 * Prova estática de UI thread (T2.3, e a metade "sem aparelho" do animation-performance): nada de
 * `PanResponder`, nada de `setState` nem `scheduleOnRN` por quadro, nenhum `runOnJS`. O que
 * esta varredura aceita como exceção está listado aqui, com o motivo.
 */
const RAIZ = process.cwd()

function arquivos(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e: { name: string; isDirectory: () => boolean }) => {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) return e.name === '__tests__' || e.name === 'test-utils' ? [] : arquivos(full)
    return /\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) ? [full] : []
  })
}

const fontes = [...arquivos(path.join(RAIZ, 'src')), ...arquivos(path.join(RAIZ, 'app'))].map((file) => ({
  rel: path.relative(RAIZ, file).replace(/\\/g, '/'),
  texto: fs.readFileSync(file, 'utf8'),
}))

/** Texto entre os parênteses que abrem em `abre` (balanceado), para isolar o corpo de `.onUpdate(...)`. */
function corpo(texto: string, abre: number): string {
  let profundidade = 0
  for (let i = abre; i < texto.length; i++) {
    if (texto[i] === '(') profundidade++
    else if (texto[i] === ')' && --profundidade === 0) return texto.slice(abre, i + 1)
  }
  return texto.slice(abre)
}

function porQuadro(texto: string): string[] {
  const out: string[] = []
  for (const marcador of ['.onUpdate(', '.onChange(', 'useAnimatedScrollHandler(', 'useFrameCallback(']) {
    let i = texto.indexOf(marcador)
    while (i >= 0) {
      out.push(corpo(texto, i + marcador.length - 1))
      i = texto.indexOf(marcador, i + 1)
    }
  }
  return out
}

/**
 * `runOnJS(true)` na JS: o `ImageViewer` (fora dos 30 componentes e da tabela B3) fica de pendência;
 * o gesto dele só chama `setZoomed` no `onEnd`, nunca por quadro.
 */
const RUN_ON_JS_PERMITIDO = new Set(['src/components/ui/image-viewer.tsx'])

describe('UI thread (prova estática)', () => {
  it('nenhum PanResponder: gesto é Gesture.Pan', () => {
    expect(fontes.filter((f) => f.texto.includes('PanResponder')).map((f) => f.rel)).toEqual([])
  })

  it('nenhum runOnJS(fn) (deprecado no Reanimated 4): a volta ao JS é scheduleOnRN', () => {
    expect(fontes.filter((f) => /(^|[^.\w])runOnJS\(/m.test(f.texto)).map((f) => f.rel)).toEqual([])
  })

  it('gesto na JS (.runOnJS(true)) só onde a lista de exceções deixa', () => {
    const achados = fontes.filter((f) => /\.runOnJS\(true\)/.test(f.texto)).map((f) => f.rel)
    expect(achados.filter((rel) => !RUN_ON_JS_PERMITIDO.has(rel))).toEqual([])
  })

  it('nenhum setState, scheduleOnRN nem runOnJS dentro de onUpdate, onChange ou de handler de rolagem (por quadro)', () => {
    const quadros = fontes.flatMap((f) => porQuadro(f.texto).map((c) => ({ rel: f.rel, c })))
    expect(quadros.length).toBeGreaterThan(0)
    const violacoes = quadros.filter(({ c }) => /\bset[A-Z]\w*\(|scheduleOnRN\(|runOnJS\(/.test(c)).map(({ rel }) => rel)
    expect(violacoes).toEqual([])
  })

  it('nenhum Animated do núcleo do React Native nem useNativeDriver', () => {
    const nucleo = fontes.filter((f) => /import\s*\{[^}]*\bAnimated\b[^}]*\}\s*from\s*'react-native'/.test(f.texto) || f.texto.includes('useNativeDriver'))
    expect(nucleo.map((f) => f.rel)).toEqual([])
  })

  it('o worklet do overlay só volta à JS no fim do gesto (scheduleOnRN no onEnd, nunca no onUpdate)', () => {
    const pan = fontes.find((f) => f.rel === 'src/lib/motion/use-overlay-pan.ts')
    expect(pan?.texto).toContain('scheduleOnRN(')
    const fim = pan?.texto.indexOf('.onEnd(') ?? -1
    expect(fim).toBeGreaterThan(0)
    expect(pan?.texto.indexOf('scheduleOnRN(')).toBeGreaterThan(fim)
  })
})
