// Fechamento da F2 (Lote F): a documentação conta o que a F2 entregou (49 componentes, AppShell,
// telas base, home e splash) e o CHANGELOG da 1.1.0 está fechado. Lê os documentos reais. No clone
// (`clean:clone` troca README e CHANGELOG) a suíte não se aplica, como as do pacote.
const { readFileSync, existsSync } = require('fs') as {
  readFileSync: (path: string, encoding: 'utf8') => string
  existsSync: (path: string) => boolean
}

const ehPacote = existsSync('src/__tests__/pack-consumer.test.tsx')
const suite = ehPacote ? describe : describe.skip

const ler = (caminho: string) => (ehPacote ? readFileSync(caminho, 'utf8') : '')

const readme = ler('README.md')
const agents = ler('AGENTS.md')
const claude = ler('CLAUDE.md')
const pagina = ler('docs/index.html')
const designRules = ler('DESIGN_RULES.md')
const comoAplicar = ler('docs/COMO_APLICAR.md')
const promptMigracao = ler('docs/PROMPT_MIGRACAO.md')
const changelog = ler('CHANGELOG.md')

function entrada(versao: string, proxima: string): string {
  const inicio = changelog.indexOf(`## [${versao}]`)
  const fim = changelog.indexOf(`## [${proxima}]`)
  return changelog.slice(inicio, fim)
}

suite('contagem de componentes da F3 (49 da F2 mais Chart, Timeline, Calendar, Kanban, ImageViewer, Chat, RichTextEditor e DocumentViewer)', () => {
  it.each([
    ['README.md', readme],
    ['AGENTS.md', agents],
    ['CLAUDE.md', claude],
    ['DESIGN_RULES.md', designRules],
  ])('%s conta 68 componentes e nenhum "49 componentes"', (_nome, texto) => {
    expect(texto).toMatch(/68 componentes/)
    expect(texto).not.toMatch(/\b49 componentes/)
  })

  it('a página de apresentação conta 68 componentes e nenhum "49 componentes" (P4)', () => {
    expect(pagina).toMatch(/68 componentes/)
    expect(pagina).not.toMatch(/49 componentes/)
  })

  it('o README lista os cinco componentes novos', () => {
    for (const nome of ['RendraCredit', 'ErrorPage', 'AuthLayout', 'AppShell', 'RendraSplash']) {
      expect(readme).toContain(nome)
    }
  })
})

suite('README descreve as telas, o shell e a estrutura de app/', () => {
  it('lista as telas base e a home entre as rotas publicadas', () => {
    for (const rota of ['/login', '/painel', '/configuracoes']) {
      expect(readme).toContain(`rendra-ui-app/demo/${rota.slice(1)}`)
    }
    expect(readme).toMatch(/home/i)
  })

  it('a árvore de app/ tem o grupo (shell) e a home própria, não mais o redirecionamento', () => {
    expect(readme).toContain('(shell)/')
    expect(readme).toContain('app-shell/')
    expect(readme).toContain('splash/')
    expect(readme).not.toMatch(/index\.tsx\s+# redireciona para \/componentes/)
  })
})

suite('AGENTS.md orienta a IA sobre as telas e o shell do boilerplate', () => {
  it('cita o grupo (shell), o menu de exemplo, os códigos N e o SafeAreaView das telas fora do shell', () => {
    expect(agents).toContain('app/(shell)')
    expect(agents).toContain('src/config/navigation.tsx')
    expect(agents).toMatch(/N1.*N3/)
    expect(agents).toContain('SafeAreaView')
  })
})

suite('COMO_APLICAR.md e PROMPT_MIGRACAO.md cobrem o AppShell e o crédito', () => {
  it('COMO_APLICAR explica AppShell, código N na URL e credit={false}', () => {
    expect(comoAplicar).toContain('AppShell')
    expect(comoAplicar).toContain('?codigo=T#-C#-N#')
    expect(comoAplicar).toContain('credit={false}')
  })

  it('COMO_APLICAR não diz mais que o pacote ainda não foi publicado', () => {
    expect(comoAplicar).not.toMatch(/ainda não foi publicado/)
  })

  it('PROMPT_MIGRACAO cita o AppShell na migração das telas', () => {
    expect(promptMigracao).toContain('AppShell')
  })
})

suite('CHANGELOG 1.1.0 fechado', () => {
  const versao = entrada('1.1.0', '1.0.0')

  it('lista tudo o que a F2 entregou', () => {
    for (const item of [
      'RendraCredit',
      'AppShell',
      'AuthLayout',
      'ErrorPage',
      'RendraSplash',
      '`/login`',
      '`/painel`',
      '`/configuracoes`',
      'goBack',
      'N1',
      '`defaultModelCode`',
    ]) {
      expect(versao).toContain(item)
    }
  })

  it('registra o endereço novo, sem texto de entrada em construção', () => {
    expect(versao).toContain('rendra-ui-app')
    expect(versao).not.toMatch(/em construção/)
    expect(versao).not.toContain('Telas base, home e splash animado desta versão')
  })

  it('registra a simulação dos leigos aprovada para esta versão', () => {
    expect(versao).toContain('Simulação dos dois leigos aprovada em 30/09/2026')
    expect(versao).not.toMatch(/Simulação dos dois leigos: pendente/)
  })
})

suite('CHANGELOG 1.4.0 fechado (List.onReorder)', () => {
  const versao = entrada('1.4.0', '1.3.0')
  it('descreve a List reordenável e o que não foi provado', () => {
    for (const item of ['List.onReorder', 'itemLabel', 'LIST-002', 'Mover', 'moveUp', 'aria-live', 'scrollEnabled', 'iOS']) {
      expect(versao).toContain(item)
    }
  })

  it('avisa que onReorder recebe só as linhas de items (busca ou filtro)', () => {
    expect(versao).toContain('onReorder` recebe só as linhas passadas em `items`')
    expect(versao).toContain('busca ou filtro ativo')
  })

  it('registra a simulação dos leigos aprovada para esta versão', () => {
    expect(versao).toMatch(/Simulação dos dois leigos aprovada em 04\/10\/2026/)
  })

  it('não cita o processo interno', () => {
    expect(versao).not.toMatch(/processo\/|docs\/superpowers/)
  })
})

suite('CHANGELOG 1.5.0 (ajustes de UI do app)', () => {
  const versao = entrada('1.5.0', '1.4.0')
  it('a entrada abre com a data e fica acima da 1.4.0', () => {
    expect(changelog.indexOf('## [1.5.0] - 05/10/2026')).toBeGreaterThan(-1)
    expect(changelog.indexOf('## [1.5.0]')).toBeLessThan(changelog.indexOf('## [1.4.0]'))
  })

  it('diz o efeito visual para quem já usa o pacote: bordas e ícone do Button', () => {
    expect(versao).toMatch(/bordas e divisores passam de pretos para a cor do token nos 13 pontos/)
    expect(versao).toMatch(/ícone do `Button` sai de cima do texto e fica ao lado/)
  })

  it('lista o que é aditivo: Tabs, Input, Sheet e o gerador de imagens', () => {
    for (const item of ['overflow="scroll"', 'countLabel', 'trailingAction', 'Sheet', 'FOL-001', 'PNG']) {
      expect(versao).toContain(item)
    }
  })

  it('põe os cartões em Alterado (telas de exemplo), não em Corrigido', () => {
    const corrigido = versao.slice(versao.indexOf('### Corrigido'), versao.indexOf('### Alterado'))
    const alterado = versao.slice(versao.indexOf('### Alterado'))
    expect(corrigido).not.toMatch(/cartões/)
    expect(alterado).toMatch(/cartões/)
  })

  it('registra as divergências com o web e o que não foi provado', () => {
    expect(versao).toMatch(/web/)
    expect(versao).toMatch(/só do app/)
    expect(versao).toMatch(/Não provado/)
  })

  it('registra a simulação dos leigos aprovada em 05/10/2026', () => {
    expect(versao).toMatch(/Simulação dos dois leigos aprovada em 05\/10\/2026/)
  })

  it('o JSDoc da Sheet avisa do pano de fundo que também fecha e documenta os testID de teste', () => {
    const jsdoc = ler('src/components/ui/sheet.tsx')
    expect(jsdoc).toContain('pano de fundo')
    expect(jsdoc).toContain('${testID}-fechar')
    expect(jsdoc).toContain('${testID}-overlay')
  })

  it('registra a List com título em até 2 linhas, o gerador que grava o vencedor e o período ancorado', () => {
    expect(versao).toMatch(/`List` com `leading` ou `trailing`.*até 2 linhas.*todo chamador/)
    expect(versao).toMatch(/grava o vencedor e reescreve as referências/)
    expect(versao).not.toMatch(/o script para antes de gravar/)
    expect(versao).toMatch(/período.*ancora.*conversa mais recente/)
  })

  it('descreve os candidatos do gerador e a og-image em JPG', () => {
    expect(versao).toMatch(/WebP sem perda, WebP com perda, PNG sem perda.*JPG/)
    expect(versao).toContain('og-image.jpg')
    expect(versao).toMatch(/PNG sem perda e JPG/)
  })

  it('o DESIGN_RULES conta as 58 entradas de vitrine', () => {
    expect(designRules).toContain('58 entradas')
    expect(designRules).not.toMatch(/57 entradas/)
  })

  it('não cita o processo interno nem promete que não haverá versão paga', () => {
    expect(versao).not.toMatch(/processo\/|docs\/superpowers/)
    expect(versao).not.toMatch(/versão paga/i)
  })
})

suite('migração 1.4.0: raiz de gestos, README e briefing da List reordenável', () => {
  it.each([
    ['README.md', readme],
    ['docs/COMO_APLICAR.md', comoAplicar],
    ['docs/PROMPT_MIGRACAO.md', promptMigracao],
  ])('%s manda montar o GestureHandlerRootView (List, Slider, ImageViewer)', (_nome, texto) => {
    expect(texto).toContain('GestureHandlerRootView')
  })

  it('o JSDoc da List avisa do filtro e não cita arquivos fora do pacote', () => {
    const jsdoc = ler('src/components/ui/list.tsx')
    expect(jsdoc).toContain('onReorder` recebe só as linhas passadas em `items`')
    expect(jsdoc).toContain('onReorder={undefined}')
    expect(jsdoc).not.toMatch(/tarefas\.tsx|PROMPT_MIGRACAO/)
  })

  it('o catálogo descreve LIST-002 com a prop onReorder', () => {
    const catalogo = ler('src/catalog/components.ts')
    expect(catalogo).toContain('Escreva com a prop `onReorder`')
  })

  it('o README diz que a List reordena', () => {
    expect(readme).toContain('List (reordenável com `onReorder`')
  })

  it('o briefing pergunta pela ordem dos itens e cita o Wizard', () => {
    const briefing = ler('docs/BRIEFING_MODELO.md')
    expect(briefing).toContain('escolhe a ordem dos itens')
    expect(briefing).toContain('WIZ-001')
    expect(briefing).not.toContain('assistente passo a passo fica fora do escopo')
  })
})

suite('CHANGELOG 1.3.0 fechado (Sincronização 2)', () => {
  const versao = entrada('1.3.0', '1.2.0')
  it('a entrada 1.3.0 existe e leva os sete componentes da Sincronização 2', () => {
    for (const item of ['Rating', 'Checklist', 'Pagination', 'DataToolbar', 'Table', 'Stepper', 'Wizard']) {
      expect(versao).toContain(item)
    }
  })

  it('registra a simulação dos leigos aprovada para esta versão', () => {
    expect(versao).toContain('Simulação dos dois leigos aprovada em 02/10/2026')
  })
})

suite('CHANGELOG 1.2.0 fechado (F3)', () => {
  const versao = entrada('1.2.0', '1.1.0')
  it('lista os oito componentes e os três subcaminhos da F3', () => {
    for (const item of ['Chart', 'Timeline', 'Calendar', 'Kanban', 'ImageViewer', 'Chat', 'RichTextEditor', 'DocumentViewer', '@rendra-ui/app/chart', '@rendra-ui/app/rich-text-editor', '@rendra-ui/app/document-viewer']) {
      expect(versao).toContain(item)
    }
  })

  it('leva o P3 e o P4 (demo com atendimento, agenda, funil, painel com gráficos e Timeline) e não tem mais "Não publicado"', () => {
    expect(changelog).not.toContain('## [Não publicado]')
    for (const item of ['Atendimento', 'Agenda', 'Funil', 'Timeline', 'gráficos', 'Enviar ao funil', 'Conversar']) {
      expect(versao).toContain(item)
    }
  })

  it('registra a simulação dos leigos aprovada para esta versão', () => {
    expect(versao).toContain('Simulação dos dois leigos aprovada em 02/10/2026')
    expect(versao).not.toMatch(/Simulação dos dois leigos: pendente/)
  })
})

suite('guia de teste de quem consome o pacote (item 32, 1.6.0)', () => {
  it.each([
    ['README.md', readme],
    ['docs/COMO_APLICAR.md', comoAplicar],
    ['docs/PROMPT_MIGRACAO.md', promptMigracao],
  ])('%s diz que, sob Jest, o transformIgnorePatterns do app precisa deixar @rendra-ui/ passar pelo Babel', (_nome, texto) => {
    expect(texto).toContain('transformIgnorePatterns')
    expect(texto).toContain('@rendra-ui/')
    expect(texto).toContain('useAnimatedStyle')
  })

  it.each([
    ['README.md', readme],
    ['docs/COMO_APLICAR.md', comoAplicar],
  ])('%s traz o exemplo literal do padrão (|@rendra-ui/.*) e diz que o Metro não precisa disso', (_nome, texto) => {
    expect(texto).toContain('|@rendra-ui/.*')
    expect(texto).toMatch(/Metro n[ãa]o precisa/)
  })
  it.each([
    ['README.md', readme],
    ['docs/COMO_APLICAR.md', comoAplicar],
  ])('%s traz o moduleNameMapper do lucide-react-native (build CJS), sem o qual o .mjs quebra o Jest', (_nome, texto) => {
    expect(texto).toContain('moduleNameMapper')
    expect(texto).toContain("'^lucide-react-native$'")
    expect(texto).toContain('lucide-react-native/dist/cjs/lucide-react-native.js')
    expect(texto).toContain("Unexpected token 'export'")
  })
})

suite('CHANGELOG 1.6.0 (melhorias do uso em outros projetos)', () => {
  const versao = entrada('1.6.0', '1.5.0')
  it('a versão gravada é a 1.6.0 nos dois manifestos', () => {
    const pacote = JSON.parse(ler('package.json')) as { version: string }
    const app = JSON.parse(ler('app.json')) as { expo: { version: string } }
    expect(pacote.version).toBe('1.6.0')
    expect(app.expo.version).toBe('1.6.0')
  })

  it('a entrada abre com a data, fica acima da 1.5.0 e a seção Não lançado fica vazia acima dela', () => {
    expect(changelog.indexOf('## [1.6.0] - 19/10/2026')).toBeGreaterThan(-1)
    expect(changelog.indexOf('## [1.6.0]')).toBeLessThan(changelog.indexOf('## [1.5.0]'))
    expect(changelog.indexOf('## [Não lançado]')).toBeLessThan(changelog.indexOf('## [1.6.0]'))
  })

  it('registra a simulação dos leigos aprovada para esta versão', () => {
    expect(versao).toMatch(/Simulação dos dois leigos aprovada em 19\/10\/2026/)
  })

  it('não cita o processo interno', () => {
    expect(versao).not.toMatch(/processo\/|docs\/superpowers/)
  })
})
