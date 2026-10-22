// eslint-disable-next-line @typescript-eslint/no-require-imports -- sem @types/node no tsconfig
const fs = require('fs') as {
  readFileSync: (caminho: string, codificacao: 'utf8') => string
  existsSync: (caminho: string) => boolean
  readdirSync: (caminho: string, opcoes: { withFileTypes: true }) => { name: string; isDirectory: () => boolean }[]
}
// eslint-disable-next-line @typescript-eslint/no-require-imports -- sem @types/node no tsconfig
const path = require('path') as { join: (...partes: string[]) => string; relative: (de: string, para: string) => string }

/**
 * Linguagem única (web e app): nenhuma curva nem duração solta nos componentes. Os números moram em
 * `src/theme/motion.ts` (dados) e `src/lib/motion/tokens.ts` (execução); o resto só os importa.
 */
const RAIZ = process.cwd()

function arquivos(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e: { name: string; isDirectory: () => boolean }) => {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) return e.name === '__tests__' || e.name === 'test-utils' ? [] : arquivos(full)
    return /\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) ? [full] : []
  })
}

const rel = (f: string) => path.relative(RAIZ, f).replace(/\\/g, '/')
const fontes = [...arquivos(path.join(RAIZ, 'src')), ...arquivos(path.join(RAIZ, 'app'))].map((f) => ({
  rel: rel(f),
  texto: fs.readFileSync(f, 'utf8'),
}))
const DONOS = new Set(['src/theme/motion.ts', 'src/lib/motion/tokens.ts'])

describe('linguagem única de movimento', () => {
  it('nenhuma curva literal fora dos tokens: sem Easing.bezier, Easing.inOut, Easing.ease nem cubic-bezier', () => {
    const achados = fontes
      .filter((f) => !DONOS.has(f.rel))
      .filter((f) => /Easing\.(bezier|inOut|in\(|out\(|ease\b|quad|cubic)|cubic-bezier\(/.test(f.texto))
      .map((f) => f.rel)
    expect(achados).toEqual([])
  })

  it('nenhum componente usa as molas antigas com quique (overshoot) nem a de rigidez e amortecimento', () => {
    const achados = fontes
      .filter((f) => !DONOS.has(f.rel))
      .filter((f) => /springConfigs\.(overshoot|snappy|soft)\b|stiffness\s*:|damping\s*:/.test(f.texto))
      .map((f) => f.rel)
    expect(achados).toEqual([])
  })

  it('o toque, os overlays e o progresso não têm duração literal (só 0 do movimento reduzido)', () => {
    const lista = [
      'src/components/ui/button.tsx',
      'src/components/ui/progress.tsx',
      'src/components/ui/skeleton.tsx',
      'src/components/ui/modal.tsx',
      'src/components/ui/drawer.tsx',
      'src/components/ui/tabs.tsx',
      'src/components/ui/checkbox.tsx',
      'src/components/ui/radio-group.tsx',
      'src/components/ui/slider.tsx',
      'src/components/ui/list.tsx',
      'src/components/ui/accordion.tsx',
      'src/components/internal/bottom-sheet.tsx',
      'src/components/internal/motion-view.tsx',
      'src/components/app-shell/nav-drawer.tsx',
      'src/lib/motion/use-overlay-motion.ts',
      'src/lib/motion/use-overlay-pan.ts',
      'src/lib/motion/use-press-scale.ts',
    ]
    const achados = lista.flatMap((r) => {
      const texto = fontes.find((f) => f.rel === r)?.texto ?? ''
      // `duration: 200`, `duration: 0` é o reduzido. Em `accordion.tsx` o ramo estático (`off`) mantém o literal de sempre.
      const literais = [...texto.matchAll(/duration:\s*(\d+)/g)].map((m) => Number(m[1])).filter((n) => n !== 0)
      return r === 'src/components/ui/accordion.tsx' || r === 'src/components/ui/list.tsx' ? [] : literais.length ? [r] : []
    })
    expect(achados).toEqual([])
  })

  it('o off dos overlays (folha, gaveta, menu) usa os tokens e o mesmo gesto do on: nenhum `runOnJS(true)`', () => {
    for (const r of ['src/components/internal/bottom-sheet.tsx', 'src/components/ui/drawer.tsx', 'src/components/app-shell/nav-drawer.tsx']) {
      const texto = fontes.find((f) => f.rel === r)?.texto ?? ''
      expect(texto).not.toMatch(/runOnJS/)
      expect(texto).toContain('useOverlayPan(')
      expect(texto).toContain("timing('slow', 'drawer')")
    }
    for (const r of ['src/components/ui/list.tsx', 'src/components/ui/slider.tsx']) {
      expect(fontes.find((f) => f.rel === r)?.texto).not.toMatch(/runOnJS/)
    }
  })

  it('o progress não anima `left`', () => {
    expect(fontes.find((f) => f.rel === 'src/components/ui/progress.tsx')?.texto).not.toMatch(/\bleft\s*:/)
  })
})
