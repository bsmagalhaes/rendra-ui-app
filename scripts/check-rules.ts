import { Project, SyntaxKind, Node, type JsxAttribute, type JsxOpeningElement, type JsxSelfClosingElement } from 'ts-morph'
import { isRendraOwnVar } from './lib/var-prefix'
import { helpLimit, PAGE_DESCRIPTION_LIMIT, INSTRUCTION_VERBS } from './lib/help-length'

// `tsconfig.json` restringe `types` a `["jest"]` (desvio da Tarefa A3), então `@types/node` (embora
// presente em node_modules) não entra no programa, e um `import ... from 'fs'` ESM não tipa. `require`
// já é declarado globalmente por `expo/types/metro-require.d.ts` (`RequireFunction`, retorna `any`),
// mesmo mecanismo do cast de `require.main` da Tarefa C1; usado aqui para ler os dois arquivos de
// `checkClaudeMd` sem reabrir `tsconfig.json` (fora do escopo de `Files` desta tarefa).
function readFileText(path: string): string {
  const fs = require('fs') as { readFileSync: (path: string, encoding: 'utf8') => string }
  // Normaliza CRLF: no Windows com `core.autocrlf` o CLAUDE.md sai do checkout com CRLF e o
  // arquivo de referência (LF) não bate caractere a caractere sem isto.
  return fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n')
}

// Desvio H3 (verificação de clone limpo): `module` (usado em `require.main === module`, no bloco
// `main` abaixo) não é declarado por nenhum arquivo versionado deste programa TypeScript; só vem de
// `expo/types/metro-require.d.ts` (`declare var module: NodeJS.Module`), carregado por
// `expo-env.d.ts`, que é gerado localmente por `npx expo start`/`expo prebuild` e está no
// `.gitignore` (nunca versionado; mesma causa raiz já registrada no desvio "Correção herdada da
// Tarefa A1" para `*.css`). Num clone limpo, sem nunca ter rodado `expo start`/`prebuild`,
// `expo-env.d.ts` não existe e `npx tsc --noEmit` falhava com `TS2591: Cannot find name 'module'`.
// A declaração abaixo usa o mesmo caminho de tipo (`NodeJS.Module`) que `expo/types` já declara
// (mesma forma, `{ exports: any }`), então as duas coexistem sem conflito quando `expo-env.d.ts`
// também existir (dev local que já rodou `expo start` alguma vez).
declare global {
  namespace NodeJS {
    interface Module {
      exports: any
    }
  }
  var module: NodeJS.Module
}

export interface Violation { rule: string; file: string; line: number; message: string }

/** Compara a seção "# REGRA INEGOCIÁVEL: MATRIZ DE MODELOS" de CLAUDE.md, do título até o fim do
 *  arquivo, contra o arquivo de referência caractere a caractere (spec seção 16, Tarefa G2). */
export function checkClaudeMd(claudeMdPath: string, referencePath: string): Violation[] {
  const claude = readFileText(claudeMdPath)
  const reference = readFileText(referencePath).trim()
  const marker = '# REGRA INEGOCIÁVEL: MATRIZ DE MODELOS'
  const idx = claude.indexOf(marker)
  if (idx === -1) {
    return [{ rule: 'CLAUDE.md', file: claudeMdPath, line: 1, message: 'Seção "REGRA INEGOCIÁVEL: MATRIZ DE MODELOS" não encontrada.' }]
  }
  const section = claude.slice(idx).trim()
  if (section !== reference) {
    return [{ rule: 'CLAUDE.md', file: claudeMdPath, line: 1, message: 'A seção difere do arquivo de referência caractere a caractere.' }]
  }
  return []
}

function jsxClassNameAttributes(project: Project, files: string[]) {
  const attrs: JsxAttribute[] = []
  for (const path of files) {
    const source = project.addSourceFileAtPath(path)
    for (const attr of source.getDescendantsOfKind(SyntaxKind.JsxAttribute)) {
      if (attr.getNameNode().getText() === 'className') attrs.push(attr)
    }
  }
  return attrs
}

function checkR1(project: Project, files: string[], violations: Violation[]) {
  for (const attr of jsxClassNameAttributes(project, files)) {
    const init = attr.getInitializer()
    if (!init) continue
    const text = init.getText()
    const matches = text.match(/[a-z-]+-\[[^\]]+\]/g) ?? []
    for (const m of matches) {
      violations.push({
        rule: 'R1', file: attr.getSourceFile().getFilePath(), line: attr.getStartLineNumber(),
        message: `Valor arbitrário não permitido: ${m}`,
      })
    }
  }
}

const R2_EXCEPTIONS = [
  'src/theme/tokens.ts', 'src/brand/palette.ts', 'src/brand/palettes.ts',
  'src/components/gradient/gradient.tsx',
]

function checkR2(project: Project, files: string[], violations: Violation[]) {
  const colorLiteral = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/
  for (const path of files) {
    if (R2_EXCEPTIONS.some((ex) => path.endsWith(ex))) continue
    const source = project.addSourceFileAtPath(path)
    for (const attr of source.getDescendantsOfKind(SyntaxKind.JsxAttribute)) {
      const name = attr.getNameNode().getText()
      if (name !== 'style' && name !== 'color' && name !== 'stopColor' && name !== 'className') continue
      const text = attr.getInitializer()?.getText() ?? ''
      if (colorLiteral.test(text)) {
        violations.push({ rule: 'R2', file: path, line: attr.getStartLineNumber(), message: 'Cor fixa fora dos arquivos de tema/paleta.' })
      }
    }
  }
}

export const R3_ALLOWED_FILES = [
  // F1a
  'app/_layout.tsx',
  'src/brand/brand-provider.tsx',
  'src/components/internal/text.tsx',
  'app/(shell)/tokens/index.tsx',
  // F1b, reservados com antecedência (spec seção 12.1, bloqueadora C9)
  'src/components/internal/bottom-sheet.tsx',
  'src/components/internal/overlay-shell.tsx',
  'src/components/internal/picker-panel.tsx',
  'src/components/ui/action-bar.tsx',
  'src/components/ui/drawer.tsx',
  'src/components/ui/modal.tsx', // useAnimatedStyle (entrada própria do cartão: posição e opacidade)
  'src/components/layout/page-header.tsx',
  'src/components/ui/slider.tsx',
  'src/components/ui/list.tsx', // useAnimatedStyle (deslocamento, escala e opacidade da linha arrastada)
  'src/components/ui/accordion.tsx',
  'src/components/ui/switch.tsx',
  'src/components/ui/toast.tsx',
  'src/components/ui/progress.tsx',
  'src/components/ui/skeleton.tsx',
  'src/components/ui/otp-input.tsx',
  'src/components/ui/badge.tsx',
  'src/components/layout/primitives.tsx',
  'src/components/ui/textarea.tsx',
  'src/components/ui/button.tsx', // useAnimatedStyle (escala 0,98 do pressed)
  'src/components/ui/spinner.tsx', // useAnimatedStyle (rotação)
  'src/components/ui/brand-feedback-icon.tsx', // useAnimatedStyle (pop e shake)
  // F2, AppShell
  'src/components/app-shell/header.tsx', // paddingTop: insets.top (dono do inset superior)
  'src/components/app-shell/bottom-nav.tsx', // paddingBottom: insets.bottom (dono do inset inferior)
  'src/components/app-shell/nav-drawer.tsx', // useAnimatedStyle (posição e largura), flex 1 do GestureHandlerRootView, insets
  // F2, splash e home
  'src/components/splash/rendra-splash.tsx', // useAnimatedStyle (entrada do selo, do nome e do lema, fade do overlay)
  'app/index.tsx', // só backgroundColor das amostras de paleta
  // F3
  'src/components/ui/calendar.tsx', // top/height da grade de horas e da linha de agora (funcao pura)
  'src/components/ui/image-viewer.tsx', // useAnimatedStyle (pinca e arraste), largura da pagina, flex 1 do GestureHandlerRootView, safe area
  'src/components/ui/chat/chat-composer.tsx', // style={{ height }} do campo (onContentSizeChange) e paddingBottom da safe area do rodape
  // correção pós lote 1 (barra de status legível em qualquer modo): `style` aqui não é um objeto
  // de estilo React Native, é o enum de string ('light' | 'dark') do StatusBar de expo-status-bar,
  // fora do universo de valores que R3/spec 12.1 regula (nenhum token de design envolvido).
  'src/brand/themed-status-bar.tsx',
]

/** Checagem pura de string contra a lista fechada, sem ts-morph nem acesso a disco: permite
 *  testar a reserva de arquivos de F1b (bloqueadora C9) mesmo antes de esses arquivos existirem. */
export function isR3Allowed(path: string): boolean {
  return R3_ALLOWED_FILES.some((allowed) => path.endsWith(allowed))
}

function checkR3(project: Project, files: string[], violations: Violation[]) {
  for (const path of files) {
    if (isR3Allowed(path)) continue
    const source = project.addSourceFileAtPath(path)
    for (const attr of source.getDescendantsOfKind(SyntaxKind.JsxAttribute)) {
      if (attr.getNameNode().getText() === 'style') {
        violations.push({ rule: 'R3', file: path, line: attr.getStartLineNumber(), message: 'style inline fora da lista fechada da spec 12.1.' })
      }
    }
  }
}

export interface CheckRulesOptions {
  r4AllowFile?: boolean; r6FileNames?: string[]; r8FileNames?: string[]; r11IsRoute?: boolean
  r12IsAppFile?: boolean; r12PathOverride?: string; r13AppTestFileNames?: string[]
  /** R15 só varre telas (`app/**`, igual ao web restringir a `src/pages/app`); `main()` passa
   *  `true` só para o lote de `appFiles`, nunca para `srcFiles` (item H2/H3 do levantamento). */
  r15IsScreen?: boolean
}

// R14: variável do tema referenciada sem o prefixo --rendra- (itens H2/H3 do levantamento da
// Sincronização 1). Varre string literal ('--foo'), template sem substituição (`--foo`) e a
// parte literal (head/middle/tail) de template com substituição (`--rendra-${nome}`, que nunca
// acusa: o pedaço literal já é "--rendra-", e "rendra-" sozinho não é nome próprio nenhum).
const VAR_NAME_RE = /--([a-zA-Z][a-zA-Z0-9-]*)/g

function checkR14(project: Project, files: string[], violations: Violation[]) {
  for (const path of files) {
    const source = project.addSourceFileAtPath(path)
    const literalNodes = [
      ...source.getDescendantsOfKind(SyntaxKind.StringLiteral),
      ...source.getDescendantsOfKind(SyntaxKind.NoSubstitutionTemplateLiteral),
      ...source.getDescendantsOfKind(SyntaxKind.TemplateHead),
      ...source.getDescendantsOfKind(SyntaxKind.TemplateMiddle),
      ...source.getDescendantsOfKind(SyntaxKind.TemplateTail),
    ]
    for (const node of literalNodes) {
      const text = node.getText()
      VAR_NAME_RE.lastIndex = 0
      let m: RegExpExecArray | null
      while ((m = VAR_NAME_RE.exec(text))) {
        const name = m[1]!
        if (name.startsWith('rendra-')) continue
        if (!isRendraOwnVar(name)) continue
        violations.push({
          rule: 'R14', file: path, line: node.getStartLineNumber(),
          message: `Variável do tema sem prefixo --rendra-: --${name}`,
        })
      }
    }
  }
}

// R15: texto orientativo fora do limite do span, ou mais da metade dos campos de uma seção com
// ajuda, ou description do PageHeader acima do limite, ou texto começando com verbo de
// instrução (item H2 do levantamento). Só mede literal (`help="..."` ou `help={"..."}`),
// nunca `help={variavel}`; escopo só telas (`options.r15IsScreen`), igual ao web restringir a
// `src/pages/app`.
function jsxElements(root: Node): (JsxOpeningElement | JsxSelfClosingElement)[] {
  return [
    ...root.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
    ...root.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
  ]
}

function literalAttrValue(el: JsxOpeningElement | JsxSelfClosingElement, name: string): string | undefined {
  for (const attr of el.getAttributes()) {
    if (!Node.isJsxAttribute(attr) || attr.getNameNode().getText() !== name) continue
    const init = attr.getInitializer()
    if (!init) return undefined
    if (Node.isStringLiteral(init)) return init.getLiteralText()
    if (Node.isJsxExpression(init)) {
      const expr = init.getExpression()
      if (expr && (Node.isStringLiteral(expr) || Node.isNoSubstitutionTemplateLiteral(expr))) {
        return expr.getLiteralText()
      }
    }
    return undefined // expressão dinâmica (variável, template com substituição etc.): não medido
  }
  return undefined
}

function checkR15(project: Project, files: string[], violations: Violation[], options: CheckRulesOptions) {
  if (!options.r15IsScreen) return
  for (const path of files) {
    const source = project.addSourceFileAtPath(path)

    for (const el of jsxElements(source)) {
      const tag = el.getTagNameNode().getText()
      if (tag === 'Field' || tag === 'FormField') {
        const help = literalAttrValue(el, 'help')
        if (help === undefined) continue
        const span = literalAttrValue(el, 'span')
        const limit = helpLimit(span)
        if (help.length > limit) {
          violations.push({
            rule: 'R15', file: path, line: el.getStartLineNumber(),
            message: `Texto de ajuda com ${help.length} caracteres, acima do limite de ${limit} do span.`,
          })
        }
      }
      if (tag === 'PageHeader') {
        const description = literalAttrValue(el, 'description')
        if (description !== undefined && description.length > PAGE_DESCRIPTION_LIMIT) {
          violations.push({
            rule: 'R15', file: path, line: el.getStartLineNumber(),
            message: `description do PageHeader com ${description.length} caracteres, acima de ${PAGE_DESCRIPTION_LIMIT}.`,
          })
        }
      }
    }

    for (const el of source.getDescendantsOfKind(SyntaxKind.JsxElement)) {
      const tag = el.getOpeningElement().getTagNameNode().getText()
      if (tag === 'FormSection') {
        const fields = jsxElements(el).filter((f) => f.getTagNameNode().getText() === 'Field' || f.getTagNameNode().getText() === 'FormField')
        const comHelp = fields.filter((f) => literalAttrValue(f, 'help') !== undefined)
        if (fields.length > 0 && comHelp.length > fields.length / 2) {
          violations.push({
            rule: 'R15', file: path, line: el.getStartLineNumber(),
            message: `${comHelp.length} de ${fields.length} campos da seção têm texto de ajuda, mais da metade.`,
          })
        }
      }
      if (tag === 'CardDescription') {
        const children = el.getJsxChildren()
        const text = children.length === 1 && Node.isJsxText(children[0]!) ? children[0]!.getText().trim() : undefined
        if (text && INSTRUCTION_VERBS.some((verb) => text.startsWith(verb))) {
          violations.push({
            rule: 'R15', file: path, line: el.getStartLineNumber(),
            message: 'Texto começa com verbo de instrução proibido.',
          })
        }
      }
    }
  }
}

// R13: nenhum arquivo de teste dentro de app/. O Expo Router trata todo arquivo de app/ como
// rota candidata (inclusive *.test.ts(x)), o que gera rotas fantasma no export web e, sob o
// Metro dev server (`expo start --web`), HTTP 500 em qualquer rota real ("Metro error:
// ReferenceError: expect is not defined"), porque o bundle tenta empacotar o teste como se
// fosse tela. Bug confirmado na execução do Marco F (Tarefas E1-E3/F2); testes de rota agora vivem em
// src/__tests__/routes/.
function checkR13(violations: Violation[], appTestFileNames: string[]) {
  for (const path of appTestFileNames) {
    violations.push({
      rule: 'R13', file: path, line: 1,
      message: 'Arquivo de teste dentro de app/ vira rota do Expo Router; mova para src/__tests__/routes/.',
    })
  }
}
const GRADIENT_FORBIDDEN_PARENTS = new Set(['Button', 'Input', 'Badge'])
const BUTTON_ALLOWED_ANCESTORS = new Set([
  'ActionBar', 'ButtonGroup', 'PageHeader', 'Modal', 'Drawer', 'CardHeader', 'List', 'Accordion', 'DropdownMenuItem',
  'Alert', 'EmptyState',
])

function checkR4(project: Project, files: string[], violations: Violation[], options: CheckRulesOptions) {
  const SCALE = new Set([0, 1, 4, 8, 12, 16, 24, 32, 44, 48, 52, 56, 64, 96, 192, 256])
  for (const path of files) {
    const allowed = options.r4AllowFile || R3_ALLOWED_FILES.some((f) => path.endsWith(f))
    if (!allowed) continue
    const source = project.addSourceFileAtPath(path)
    for (const attr of source.getDescendantsOfKind(SyntaxKind.JsxAttribute)) {
      if (attr.getNameNode().getText() !== 'style') continue
      const props = ['padding', 'margin', 'gap', 'width', 'height', 'top', 'bottom', 'left', 'right']
      for (const prop of props) {
        const re = new RegExp(`${prop}\\w*:\\s*(-?\\d+(\\.\\d+)?)`, 'g')
        let m: RegExpExecArray | null
        const text = attr.getInitializer()?.getText() ?? ''
        while ((m = re.exec(text))) {
          const n = Math.abs(Number(m[1]))
          if (!SCALE.has(n)) {
            violations.push({ rule: 'R4', file: path, line: attr.getStartLineNumber(), message: `Degrau fora da escala: ${prop} ${m[1]}` })
          }
        }
      }
    }
  }
}

const R5_EXCEPTIONS = ['src/theme/fonts.ts', 'src/theme/models.ts']
const FONT_NAME_RE = /(Poppins|DMSans|Inter)_\d{3}(Regular|Medium|SemiBold)/

function checkR5(project: Project, files: string[], violations: Violation[]) {
  for (const path of files) {
    if (R5_EXCEPTIONS.some((f) => path.endsWith(f))) continue
    const source = project.addSourceFileAtPath(path)
    for (const lit of source.getDescendantsOfKind(SyntaxKind.StringLiteral)) {
      if (FONT_NAME_RE.test(lit.getLiteralText())) {
        violations.push({ rule: 'R5', file: path, line: lit.getStartLineNumber(), message: 'Nome de fonte fixo fora de theme/fonts.ts ou theme/models.ts.' })
      }
    }
  }
}

function checkR6(violations: Violation[], fileNames: string[]) {
  const suffixRe = /(Mobile|Simples|Grande|ComBusca)\.tsx?$/i
  for (const path of fileNames) {
    if (!path.includes('src/components')) continue
    if (suffixRe.test(path)) {
      violations.push({ rule: 'R6', file: path, line: 1, message: 'Nome de arquivo paralelo proibido.' })
    }
  }
}

function checkR7(project: Project, files: string[], violations: Violation[]) {
  for (const path of files) {
    const source = project.addSourceFileAtPath(path)
    for (const attr of source.getDescendantsOfKind(SyntaxKind.JsxAttribute)) {
      const name = attr.getNameNode().getText()
      const text = attr.getInitializer()?.getText() ?? ''
      if (name === 'style' && /fontWeight/.test(text)) {
        violations.push({ rule: 'R7', file: path, line: attr.getStartLineNumber(), message: 'fontWeight numérico proibido; troque o peso do arquivo de fonte.' })
      }
      if (name === 'className' && /\bfont-bold\b/.test(text)) {
        violations.push({ rule: 'R7', file: path, line: attr.getStartLineNumber(), message: 'font-bold não existe; troque o peso do arquivo de fonte.' })
      }
    }
  }
}

function checkR8(violations: Violation[], fileNames: string[]) {
  const bases = new Map<string, string[]>()
  for (const path of fileNames) {
    if (!path.includes('src/components/ui/') || path.endsWith('.test.tsx')) continue
    const base = path.split('/').pop()!.replace(/\.tsx?$/, '').replace(/-v\d+$/, '').replace(/\d+$/, '')
    const list = bases.get(base) ?? []
    list.push(path)
    bases.set(base, list)
  }
  for (const [base, list] of bases) {
    if (list.length > 1) {
      violations.push({ rule: 'R8', file: list.join(', '), line: 1, message: `Componente paralelo com o prefixo "${base}".` })
    }
  }
}

const FIELD_TAGS = new Set(['FormField', 'Input', 'Select', 'Checkbox', 'RadioGroup', 'Switch', 'Slider', 'OtpInput', 'DatePicker', 'Textarea'])

function checkR9(project: Project, files: string[], violations: Violation[]) {
  for (const path of files) {
    const source = project.addSourceFileAtPath(path)
    for (const el of source.getDescendantsOfKind(SyntaxKind.JsxOpeningElement)) {
      if (el.getTagNameNode().getText() !== 'Modal') continue
      const jsxEl = el.getParentIfKindOrThrow(SyntaxKind.JsxElement)
      const innerModals = jsxEl.getDescendantsOfKind(SyntaxKind.JsxOpeningElement)
        .filter((e) => e !== el && (e.getTagNameNode().getText() === 'Modal' || e.getTagNameNode().getText() === 'Drawer'))
      const innerModalsSelfClosing = jsxEl.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)
        .filter((e) => e.getTagNameNode().getText() === 'Modal' || e.getTagNameNode().getText() === 'Drawer')
      if (innerModals.length > 0 || innerModalsSelfClosing.length > 0) {
        violations.push({ rule: 'R9', file: path, line: el.getStartLineNumber(), message: 'Modal ou Drawer dentro de Modal.' })
      }
    }
  }
}

function checkR10(project: Project, files: string[], violations: Violation[]) {
  for (const path of files) {
    const source = project.addSourceFileAtPath(path)
    for (const el of source.getDescendantsOfKind(SyntaxKind.JsxOpeningElement)) {
      if (el.getTagNameNode().getText() !== 'Modal') continue
      const jsxEl = el.getParentIfKindOrThrow(SyntaxKind.JsxElement)
      const fieldCount = jsxEl.getJsxChildren().filter((child) => {
        if (Node.isJsxSelfClosingElement(child)) return FIELD_TAGS.has(child.getTagNameNode().getText())
        if (Node.isJsxElement(child)) return FIELD_TAGS.has(child.getOpeningElement().getTagNameNode().getText())
        return false
      }).length
      if (fieldCount > 3) {
        violations.push({ rule: 'R10', file: path, line: el.getStartLineNumber(), message: `Modal com ${fieldCount} campos diretos, máximo 3.` })
      }
    }
  }
}

function checkR11(project: Project, files: string[], violations: Violation[], options: CheckRulesOptions) {
  for (const path of files) {
    const source = project.addSourceFileAtPath(path)
    const gradientSelfClosing = source.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)
      .filter((e) => e.getTagNameNode().getText() === 'Gradient')
    const gradientOpenClose = source.getDescendantsOfKind(SyntaxKind.JsxElement)
      .filter((e) => e.getOpeningElement().getTagNameNode().getText() === 'Gradient')
    const gradientEls = [...gradientSelfClosing, ...gradientOpenClose].sort(
      (a, b) => a.getStartLineNumber() - b.getStartLineNumber(),
    )

    const isRoute = options.r11IsRoute || path.startsWith('app/')
    if (isRoute && gradientEls.length > 1) {
      violations.push({ rule: 'R11', file: path, line: gradientEls[1]!.getStartLineNumber(), message: 'Mais de um Gradient na mesma rota.' })
    }

    for (const el of gradientEls) {
      const parent = el.getParent()
      const parentName = Node.isJsxElement(parent) ? parent.getOpeningElement().getTagNameNode().getText() : undefined
      if (parentName && GRADIENT_FORBIDDEN_PARENTS.has(parentName)) {
        violations.push({ rule: 'R11', file: path, line: el.getStartLineNumber(), message: `Gradient como filho direto de ${parentName}.` })
      }
    }
  }
}

function checkR12(project: Project, files: string[], violations: Violation[], options: CheckRulesOptions) {
  for (const path of files) {
    const effectivePath = options.r12PathOverride ?? path
    if (effectivePath.includes('src/components/')) continue // R12 não varre a própria definição dos containers
    const isApp = options.r12IsAppFile || effectivePath.startsWith('app/')
    if (!isApp) continue
    const source = project.addSourceFileAtPath(path)
    for (const el of source.getDescendantsOfKind(SyntaxKind.JsxOpeningElement)
      .concat(source.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement) as any)) {
      const tagNode = (el as any).getTagNameNode?.()
      if (!tagNode || tagNode.getText() !== 'Button') continue
      let ok = false
      let current: any = el.getParent()
      while (current) {
        const tag = current.getOpeningElement?.()?.getTagNameNode?.()?.getText?.()
          ?? current.getTagNameNode?.()?.getText?.()
        if (tag && BUTTON_ALLOWED_ANCESTORS.has(tag)) { ok = true; break }
        current = current.getParent?.()
      }
      if (!ok) {
        violations.push({ rule: 'R12', file: path, line: (el as any).getStartLineNumber(), message: 'Button fora de um container autorizado.' })
      }
    }
  }
}

export function runCheckRules(files: string[], options: CheckRulesOptions = {}): Violation[] {
  files = files.map((p) => p.replace(/\\/g, '/')) // normaliza separador de caminho (Windows/POSIX)
  const project = new Project({ useInMemoryFileSystem: false })
  const violations: Violation[] = []
  checkR1(project, files, violations)
  checkR2(project, files, violations)
  checkR3(project, files, violations)
  checkR4(project, files, violations, options)
  checkR5(project, files, violations)
  checkR6(violations, options.r6FileNames ?? files)
  checkR7(project, files, violations)
  checkR8(violations, options.r8FileNames ?? files)
  checkR9(project, files, violations)
  checkR10(project, files, violations)
  checkR11(project, files, violations, options)
  checkR12(project, files, violations, options)
  checkR13(violations, options.r13AppTestFileNames ?? [])
  checkR14(project, files, violations)
  checkR15(project, files, violations, options)
  return violations
}

// `require.main`: tsconfig.json restringe `types` a `["jest"]` (desvio da Tarefa A3), então
// @types/node não entra no programa; `expo/types/metro-require.d.ts` declara seu próprio
// `NodeJS.Require` (só a assinatura de função, sem `.main`), que "vence" por ser o único no
// programa. Cast local em vez de tocar tsconfig.json (fora do escopo desta tarefa).
if ((require as unknown as { main?: unknown }).main === module) {
  const { globSync } = require('glob') as typeof import('glob')
  const appFiles = globSync('app/**/*.tsx', { ignore: ['app/**/*.test.tsx'], posix: true })
  const srcFiles = globSync('src/**/*.{ts,tsx}', { ignore: ['src/**/*.test.{ts,tsx}', 'src/**/__canary__/**'], posix: true })
  const appTestFiles = globSync('app/**/*.test.{ts,tsx}', { posix: true })
  const violations = [
    ...runCheckRules(appFiles, { r11IsRoute: true, r12IsAppFile: true, r13AppTestFileNames: appTestFiles, r15IsScreen: true }),
    ...runCheckRules(srcFiles),
    ...checkClaudeMd('CLAUDE.md', 'docs/reference/claude-md-matriz-modelos.txt'),
  ]
  if (violations.length > 0) {
    for (const v of violations) console.error(`${v.file}:${v.line} [${v.rule}] ${v.message}`)
    process.exit(1)
  }
  console.log('check:rules: OK')
}
