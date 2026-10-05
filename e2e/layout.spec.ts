// e2e/layout.spec.ts
import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { semSplash } from './splash'

const ROUTES = [
  '/',
  '/componentes',
  '/componentes/acoes',
  '/componentes/layout',
  '/componentes/feedback',
  '/componentes/formulario',
  '/componentes/exibicao',
  '/componentes/dados',
  '/componentes/planejamento',
  '/tokens',
  '/galeria',
  '/painel',
  '/configuracoes',
  '/login',
  '/esqueci-senha',
  '/verificacao',
  '/nova-senha',
  '/cadastre-se',
  '/clientes',
  '/clientes/1000',
  '/clientes/novo',
  '/cadastro',
  '/tarefas',
  '/atendimento',
  '/atendimento/t1',
  '/agenda',
  '/kanban',
]

// Tela 404: o `serve` do Playwright só entrega o `404.html` do export dentro do prefixo
// /rendra-ui-app/ quando pedido pelo nome; o roteador não acha rota e mostra a `+not-found`.
// Numa rota não encontrada o `?codigo=` não chega ao `ModelCodeFromUrl` (o Expo Router não
// entrega os parâmetros de busca à `+not-found`), então a escolha do projeto é gravada antes,
// numa rota comum, e o app a lê do armazenamento do aparelho ao abrir o `404.html`.
async function abrir404(page: Page, codigo: string) {
  await page.goto(`galeria?codigo=${codigo}`)
  await page.getByTestId(`rendra-${codigo}`).waitFor()
  await semSplash(page)
  await page.goto('404.html')
  await page.getByTestId(`rendra-${codigo}`).waitFor()
  await semSplash(page)
}

// `route` mantém a barra inicial só para nomear o teste (`/tokens: ...`); a navegação usa
// `route.slice(1)` (sem a barra inicial), porque `baseURL` termina em barra (bug confirmado na
// Tarefa F2): um `page.goto` com barra inicial é resolvido como caminho absoluto a partir da
// origem (RFC 3986), descartando o path `/rendra-ui-app` do baseURL inteiro.
for (const route of ROUTES) {
  test(`${route}: sem rolagem horizontal`, async ({ page }, testInfo) => {
    const codigo = (testInfo.project.metadata as { codigo?: string })?.codigo ?? 'T1-C1'
    await page.goto(`${route.slice(1)}?codigo=${codigo}`)
    await page.getByTestId(`rendra-${codigo}`).waitFor() // espera hidratação (testID posto pelo BrandProvider, Tarefa B16)
    await semSplash(page)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const viewportWidth = page.viewportSize()!.width
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth)
  })

  test(`${route}: todo elemento interativo mede pelo menos 44x44 CSS px`, async ({ page }, testInfo) => {
    const codigo = (testInfo.project.metadata as { codigo?: string })?.codigo ?? 'T1-C1'
    await page.goto(`${route.slice(1)}?codigo=${codigo}`)
    await page.getByTestId(`rendra-${codigo}`).waitFor()
    await semSplash(page)
    const roles = ['button', 'link', 'checkbox', 'radio', 'switch', 'tab', 'combobox', 'slider', 'menuitem', 'textbox']
    for (const role of roles) {
      const elements = page.getByRole(role as 'button' | 'link')
      const count = await elements.count()
      for (let i = 0; i < count; i++) {
        const box = await elements.nth(i).boundingBox()
        if (!box) continue
        expect(box.width, `${route} role=${role} índice ${i}, largura`).toBeGreaterThanOrEqual(44)
        expect(box.height, `${route} role=${role} índice ${i}, altura`).toBeGreaterThanOrEqual(44)
      }
    }
  })

  // Tarefa 6.4 (achado C5 do veredito do Opus, secao 3.2 item 4 do levantamento): a raiz do
  // BrandProvider carrega data-rendra-root e data-label no export web em toda rota.
  test(`${route}: [data-rendra-root] com data-label="discreto" presente na raiz`, async ({ page }, testInfo) => {
    const codigo = (testInfo.project.metadata as { codigo?: string })?.codigo ?? 'T1-C1'
    await page.goto(`${route.slice(1)}?codigo=${codigo}`)
    await page.getByTestId(`rendra-${codigo}`).waitFor()
    await semSplash(page)
    const raiz = page.locator('[data-rendra-root]')
    await expect(raiz).toHaveAttribute('data-label', 'discreto')
  })
}

test('criterio 7: trocar modelo pelo controle real da /galeria muda o testID da raiz', async ({ page }) => {
  // B3 (veredito do Opus): esta tarefa substitui o caso antigo, que clicava no Link de texto
  // T3-C4 (12 Links removidos pela Tarefa 10 do lote 4, /galeria agora usa ButtonGroup real).
  await page.goto('galeria?codigo=T1-C1')
  await page.getByTestId('rendra-T1-C1').waitFor()
  await semSplash(page)
  await page.getByRole('radiogroup', { name: 'Modelo' }).getByRole('radio', { name: 'Aurora' }).click()
  await page.getByTestId('rendra-T3-C1').waitFor()
  await semSplash(page)
  await expect(page.getByTestId('rendra-T1-C1')).toHaveCount(0)
})

test('tokens: ?modo=escuro/claro aplica o modo sem recarregar (critério 7, via URL nesta entrega)', async ({ page }) => {
  // C12 (veredito do Opus): a /galeria já tem controle real de modelo/paleta/modo (Tarefa 10),
  // provado pelo caso do critério 7 acima; ?modo= continua coberto por URL nesta rota (/tokens),
  // que não tem controle de UI proprio para o modo.
  // Correção da rodada 4 de validação, bloqueadora 1: mede a variável CSS --background do nó
  // com data-testid^="rendra-" (o único que o app controla de fato), nunca o fundo do body
  // (que o app não controla) nem corre contra o efeito assíncrono do ModelCodeFromUrl.
  const bg = () => page.evaluate(() =>
    getComputedStyle(document.querySelector('[data-testid^="rendra-"]')!).getPropertyValue('--rendra-background').trim())
  await page.goto('tokens?modo=claro')
  await page.getByTestId('rendra-T1-C1').waitFor()
  await semSplash(page)
  await expect.poll(bg).not.toBe('')
  const light = await bg()
  await page.goto('tokens?modo=escuro')
  await page.getByTestId('rendra-T1-C1').waitFor()
  await semSplash(page)
  await expect.poll(bg).not.toBe(light)
})

test('galeria: escolha de modelo via ?codigo= persiste depois de recarregar a página (H3 Passo 6, automatizado)', async ({ page }) => {
  await page.goto('galeria?codigo=T2-C3')
  await page.getByTestId('rendra-T2-C3').waitFor()
  await semSplash(page)
  // Melhoria da rodada 4 de validação: removido o page.reload() redundante daqui; o
  // page.goto('galeria') logo abaixo já é, sozinho, uma navegação completa sem ?codigo= na
  // URL, suficiente para provar a persistência via AsyncStorage.
  await page.goto('galeria')
  await page.getByTestId('rendra-T2-C3').waitFor()
  await semSplash(page)
})

test('componentes/acoes: selo BTN-001 do catalogo visivel ao lado do Button (Tarefa 1.3, achado C5 do Opus)', async ({ page }) => {
  await page.goto('componentes/acoes?codigo=T1-C1')
  await page.getByTestId('rendra-T1-C1').waitFor()
  await semSplash(page)
  await expect(page.getByText('BTN-001')).toBeVisible()
})

test('componentes/exibicao: selo ABA-001 do catalogo visivel ao lado do Tabs (Tarefa 1.3, achado C5 do Opus)', async ({ page }) => {
  await page.goto('componentes/exibicao?codigo=T1-C1')
  await page.getByTestId('rendra-T1-C1').waitFor()
  await semSplash(page)
  await expect(page.getByText('ABA-001')).toBeVisible()
})

// Tarefa 6.4 (achado C5 do veredito do Opus, secao 3.2 do levantamento): o data-rendra chega ao
// DOM do export web via dataSet, distinto do selo textual (Tarefa 1.3) na vitrine.
test('componentes/acoes: [data-rendra="BTN-001"] visivel (achado C5 do Opus)', async ({ page }) => {
  await page.goto('componentes/acoes?codigo=T1-C1')
  await page.getByTestId('rendra-T1-C1').waitFor()
  await semSplash(page)
  await expect(page.locator('[data-rendra="BTN-001"]').first()).toBeVisible()
})

test('componentes/exibicao: [data-rendra="ABA-001"] visivel (achado C5 do Opus)', async ({ page }) => {
  await page.goto('componentes/exibicao?codigo=T1-C1')
  await page.getByTestId('rendra-T1-C1').waitFor()
  await semSplash(page)
  await expect(page.locator('[data-rendra="ABA-001"]').first()).toBeVisible()
})

// F3 (criterio 5 do levantamento): o Chart e seus sete tipos chegam ao DOM com o codigo do catalogo.
test('componentes/dados: [data-rendra="CHT-001" a "CHT-007"] presentes e o velocimetro e um meter', async ({ page }) => {
  await page.goto('componentes/dados?codigo=T1-C1')
  await page.getByTestId('rendra-T1-C1').waitFor()
  await semSplash(page)
  for (const n of [1, 2, 3, 4, 5, 6, 7]) {
    await expect(page.locator(`[data-rendra="CHT-00${n}"]`).first()).toBeAttached()
  }
  await expect(page.getByRole('meter')).toHaveAttribute('aria-valuenow', '88')
})

test('componentes/formulario: [data-rendra="FLD-001"] visivel (achado C5 do Opus)', async ({ page }) => {
  await page.goto('componentes/formulario?codigo=T1-C1')
  await page.getByTestId('rendra-T1-C1').waitFor()
  await semSplash(page)
  await expect(page.locator('[data-rendra="FLD-001"]').first()).toBeVisible()
})

test('formulario: Select com lista maior que a folha rola até o último item, no web (bloqueador do veredito do fechamento)', async ({ page }) => {
  await page.goto('componentes/formulario')
  await page.getByTestId('rendra-T1-C1').waitFor()
  await semSplash(page)
  const trigger = page.getByRole('combobox', { name: 'Estado' })
  await trigger.click()
  const listboxId = await trigger.getAttribute('aria-controls')
  const listbox = page.locator(`#${listboxId}`)
  const lastOption = listbox.getByText('Tocantins', { exact: true })
  // Antes de rolar, a lista tem 27 estados e a folha não cabe todos: o último item ainda não
  // está visível (sem isso a asserção seguinte não provaria rolagem nenhuma).
  await expect(lastOption).not.toBeInViewport()
  await listbox.hover()
  await page.mouse.wheel(0, 4000)
  await expect(lastOption).toBeInViewport()
})

// F2, AppShell (achado B11 do Opus: escritos antes da vitrine entrar no grupo (shell); sem o
// shell os seletores abaixo não existem, e é esse o vermelho).
test('shell: o botão central "Abrir menu" abre a gaveta, tocar num item navega e fecha', async ({ page }, testInfo) => {
  const codigo = (testInfo.project.metadata as { codigo?: string })?.codigo ?? 'T1-C1'
  await page.goto(`componentes?codigo=${codigo}`)
  await page.getByTestId(`rendra-${codigo}`).waitFor()
  await semSplash(page)
  await page.getByRole('button', { name: 'Abrir menu' }).click()
  const gaveta = page.getByRole('dialog', { name: 'Menu' })
  await expect(gaveta).toBeVisible()
  await gaveta.getByRole('link', { name: 'Tokens' }).click()
  await expect(page).toHaveURL(/\/tokens/)
  await expect(page.getByRole('dialog', { name: 'Menu' })).toHaveCount(0)
})

test('shell: a seta "Voltar para Componentes" existe em /componentes/acoes e não em /componentes', async ({ page }, testInfo) => {
  const codigo = (testInfo.project.metadata as { codigo?: string })?.codigo ?? 'T1-C1'
  await page.goto(`componentes/acoes?codigo=${codigo}`)
  await page.getByTestId(`rendra-${codigo}`).waitFor()
  await semSplash(page)
  await expect(page.getByRole('button', { name: 'Voltar para Componentes' })).toBeVisible()
  await page.goto(`componentes?codigo=${codigo}`)
  await page.getByTestId(`rendra-${codigo}`).waitFor()
  await semSplash(page)
  await expect(page.getByTestId('shell-cabecalho')).toBeVisible()
  await expect(page.getByRole('button', { name: /Voltar para/ })).toHaveCount(0)
})

test('shell: o título da tela aparece uma só vez, no cabeçalho', async ({ page }, testInfo) => {
  const codigo = (testInfo.project.metadata as { codigo?: string })?.codigo ?? 'T1-C1'
  await page.goto(`componentes?codigo=${codigo}`)
  await page.getByTestId(`rendra-${codigo}`).waitFor()
  await semSplash(page)
  const cabecalho = page.getByTestId('shell-cabecalho')
  await expect(cabecalho.getByText('Componentes', { exact: true })).toHaveCount(1)
  // o título do PageHeader fica só para leitor de tela (1px), nunca duplica o texto na tela
  const visiveis = await page.evaluate(() =>
    Array.from(document.querySelectorAll('h1, [role="heading"]'))
      .filter((el) => el.textContent?.trim() === 'Componentes')
      .filter((el) => {
        const caixa = el.getBoundingClientRect()
        return caixa.width > 4 && caixa.height > 4
      }).length,
  )
  expect(visiveis).toBe(0)
})

test('shell: o item ativo da barra inferior leva aria-current="page"', async ({ page }, testInfo) => {
  const codigo = (testInfo.project.metadata as { codigo?: string })?.codigo ?? 'T1-C1'
  await page.goto(`componentes/acoes?codigo=${codigo}`)
  await page.getByTestId(`rendra-${codigo}`).waitFor()
  await semSplash(page)
  const barra = page.getByRole('navigation', { name: 'Navegação rápida' })
  await expect(barra.getByRole('link', { name: 'Vitrine' })).toHaveAttribute('aria-current', 'page')
  await expect(barra.getByRole('link', { name: 'Galeria' })).not.toHaveAttribute('aria-current', 'page')
})

test('shell: ?codigo=T1-C1-N3 tira a barra inferior e leva o menu para o cabeçalho', async ({ page }) => {
  await page.goto('componentes?codigo=T1-C1-N3')
  await page.getByTestId('rendra-T1-C1').waitFor()
  await semSplash(page)
  await expect(page.getByRole('navigation', { name: 'Navegação rápida' })).toHaveCount(0)
  await page.getByTestId('shell-cabecalho').getByRole('button', { name: 'Abrir menu' }).click()
  await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()
})

test('shell: ?codigo=T1-C1-N2 abre o menu numa folha inferior', async ({ page }) => {
  await page.goto('componentes?codigo=T1-C1-N2')
  await page.getByTestId('rendra-T1-C1').waitFor()
  await semSplash(page)
  await expect(page.getByRole('navigation', { name: 'Navegação rápida' })).toBeVisible()
  await page.getByRole('button', { name: 'Abrir menu' }).click()
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Menu' })).toHaveCount(0)
})

// F2, Lote C, telas base (achado B11 do Opus: escritos antes das telas existirem).
test('login: título, crédito "Feito com Rendra" visível com 44px e fora do shell', async ({ page }, testInfo) => {
  const codigo = (testInfo.project.metadata as { codigo?: string })?.codigo ?? 'T1-C1'
  await page.goto(`login?codigo=${codigo}`)
  await page.getByTestId(`rendra-${codigo}`).waitFor()
  await semSplash(page)
  await expect(page.getByRole('heading', { name: 'Acesse sua conta' })).toBeVisible()
  const credito = page.getByRole('link', { name: 'Feito com Rendra' })
  await expect(credito).toBeVisible()
  await expect(page.locator('[data-rendra="CRED-001"]')).toHaveCount(1)
  const caixa = (await credito.boundingBox())!
  expect(caixa.height).toBeGreaterThanOrEqual(44)
  await expect(page.getByRole('navigation', { name: 'Navegação rápida' })).toHaveCount(0)
})

test('404: a tela de erro mostra o código, ERRO-001 e as duas ações', async ({ page }, testInfo) => {
  const codigo = (testInfo.project.metadata as { codigo?: string })?.codigo ?? 'T1-C1'
  await abrir404(page, codigo)
  await expect(page.locator('[data-rendra="ERRO-001"]')).toBeVisible()
  await expect(page.getByText('Erro 404')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Voltar' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ir para o início' })).toBeVisible()
})

test('404: sem rolagem horizontal, botões com 44px e a raiz com data-label discreto', async ({ page }, testInfo) => {
  const codigo = (testInfo.project.metadata as { codigo?: string })?.codigo ?? 'T1-C1'
  await abrir404(page, codigo)
  await page.locator('[data-rendra="ERRO-001"]').waitFor()
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBeLessThanOrEqual(page.viewportSize()!.width)
  for (const nome of ['Voltar', 'Ir para o início']) {
    const caixa = (await page.getByRole('button', { name: nome }).boundingBox())!
    expect(caixa.width, `${nome}, largura`).toBeGreaterThanOrEqual(44)
    expect(caixa.height, `${nome}, altura`).toBeGreaterThanOrEqual(44)
  }
  await expect(page.locator('[data-rendra-root]')).toHaveAttribute('data-label', 'discreto')
})

test('painel: abre dentro do shell, com a barra inferior e o item Painel ativo', async ({ page }, testInfo) => {
  const codigo = (testInfo.project.metadata as { codigo?: string })?.codigo ?? 'T1-C1'
  await page.goto(`painel?codigo=${codigo}`)
  await page.getByTestId(`rendra-${codigo}`).waitFor()
  await semSplash(page)
  const barra = page.getByRole('navigation', { name: 'Navegação rápida' })
  await expect(barra.getByRole('link', { name: 'Painel' })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByTestId('shell-cabecalho').getByText('Painel', { exact: true })).toHaveCount(1)
  await expect(page.locator('[data-rendra="STAT-001"]').first()).toBeVisible()
})

// P3.13 (correção D6): as seis seções de Configurações vivem em `Tabs`, que vira um `Select`
// ("Seção") quando as abas não cabem na largura (celular estreito). O helper abre a seção pelo
// controle que a página tiver, sem mudar a asserção dos casos.
async function abrirSecao(page: Page, nome: string) {
  const seletor = page.getByRole('combobox', { name: 'Seção' })
  if ((await seletor.count()) > 0) {
    await seletor.click()
    // As opções da folha não têm papel próprio (ver select.tsx); a folha é um portal no fim do DOM.
    await page.getByText(nome, { exact: true }).last().click()
  } else {
    await page.getByRole('tab', { name: nome, exact: true }).click()
  }
}

test('configuracoes: escolher "Só gaveta" tira a barra inferior e escolher Aurora troca o modelo', async ({ page }) => {
  await page.goto('configuracoes?codigo=T1-C1')
  await page.getByTestId('rendra-T1-C1').waitFor()
  await semSplash(page)
  await expect(page.getByRole('navigation', { name: 'Navegação rápida' })).toBeVisible()
  await abrirSecao(page, 'Layout')
  await page.getByRole('radiogroup', { name: 'Layout' }).getByRole('radio', { name: 'Só gaveta' }).click()
  await expect(page.getByRole('navigation', { name: 'Navegação rápida' })).toHaveCount(0)
  await abrirSecao(page, 'Aparência')
  await page.getByRole('radiogroup', { name: 'Modelo' }).getByRole('radio', { name: 'Aurora' }).click()
  await page.getByTestId('rendra-T3-C1').waitFor()
  await semSplash(page)
})

// F2, Lote D, home (achado B11 do Opus: escritos antes da tela; a raiz ainda redirecionava).
test('home: apresenta o projeto, os 3 modelos, as 4 paletas e o crédito, fora do shell', async ({ page }, testInfo) => {
  const codigo = (testInfo.project.metadata as { codigo?: string })?.codigo ?? 'T1-C1'
  await page.goto(`?codigo=${codigo}`)
  await page.getByTestId(`rendra-${codigo}`).waitFor()
  await semSplash(page)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('radiogroup', { name: 'Modelo' }).getByRole('radio')).toHaveCount(3)
  await expect(page.getByRole('radiogroup', { name: 'Paleta' }).getByRole('radio')).toHaveCount(4)
  for (const nome of ['Componentes', 'Tokens', 'Galeria', 'Painel de exemplo', 'Tela de entrada']) {
    await expect(page.getByRole('link', { name: new RegExp(nome) })).toBeVisible()
  }
  await expect(page.getByRole('link', { name: 'Feito com Rendra' })).toBeVisible()
  await expect(page.locator('[data-rendra="CRED-001"]')).toHaveCount(1)
  await expect(page.getByRole('navigation', { name: 'Navegação rápida' })).toHaveCount(0)
})

test('home: trocar modelo e paleta pelos cartões muda a raiz e não é revertido pelo ?codigo= da URL', async ({ page }) => {
  await page.goto('?codigo=T1-C1')
  await page.getByTestId('rendra-T1-C1').waitFor()
  await semSplash(page)
  await page.getByRole('radiogroup', { name: 'Modelo' }).getByRole('radio', { name: 'Aurora' }).click()
  await page.getByTestId('rendra-T3-C1').waitFor()
  await semSplash(page)
  await page.getByRole('radiogroup', { name: 'Paleta' }).getByRole('radio', { name: 'Ardósia' }).click()
  await page.getByTestId('rendra-T3-C4').waitFor()
  await semSplash(page)
  await expect(page.getByTestId('rendra-T1-C1')).toHaveCount(0)
  await expect(page.getByRole('radiogroup', { name: 'Modelo' }).getByRole('radio', { name: 'Aurora' })).toBeChecked()
})

test('home: o link Componentes leva à vitrine dentro do shell', async ({ page }) => {
  await page.goto('?codigo=T1-C1')
  await page.getByTestId('rendra-T1-C1').waitFor()
  await semSplash(page)
  await page.getByRole('link', { name: /Componentes/ }).click()
  await expect(page).toHaveURL(/\/componentes/)
  await expect(page.getByTestId('shell-cabecalho')).toBeVisible()
})

test('componentes/exibicao: DocumentViewer no navegador mostra o painel de abrir fora, sem o aviso do WebView', async ({ page }) => {
  await page.goto('componentes/exibicao?codigo=T1-C1')
  await page.getByTestId('rendra-T1-C1').waitFor()
  await semSplash(page)
  await expect(page.locator('[data-rendra="DOC-001"]')).toBeVisible()
  await expect(page.getByText('React Native WebView does not support this platform.')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Abrir no aplicativo de PDF' })).toBeVisible()
  await page.getByRole('button', { name: 'Limpar seleção' }).click()
  await expect(page.getByText('Nenhum documento selecionado')).toBeVisible()
})

test('componentes/formulario: RichTextEditor no navegador cai no modo HTML e digitar atualiza o contador', async ({ page }) => {
  await page.goto('componentes/formulario?codigo=T1-C1')
  await page.getByTestId('rendra-T1-C1').waitFor()
  await semSplash(page)
  await expect(page.locator('[data-rendra="RTE-001"]')).toBeVisible()
  // Sem a variante .web o react-native-webview mostraria este aviso no lugar do editor.
  await expect(page.getByText('React Native WebView does not support this platform.')).toHaveCount(0)
  await page.getByLabel('Código HTML do conteúdo').fill('<p>curto</p>')
  await expect(page.getByText('Conteúdo: 12 caracteres')).toBeVisible()
})

// Correção 11 do parecer (List.onReorder): em /tarefas a linha tem alça, Mover, marcador, selo e
// menu. O título fica em linha própria, de largura inteira (até duas linhas, sem corte), e a data
// nunca quebra no meio. Roda em 360 e 390 (matriz de projetos).
test('/tarefas: título legível e data sem quebra no meio com a lista reordenável', async ({ page }, testInfo) => {
  const codigo = (testInfo.project.metadata as { codigo?: string })?.codigo ?? 'T1-C1'
  await page.goto(`tarefas?codigo=${codigo}`)
  await page.getByTestId(`rendra-${codigo}`).waitFor()
  await semSplash(page)
  const alcas = page.getByRole('button', { name: /^Reordenar / })
  expect(await alcas.count()).toBeGreaterThan(5)
  const titulos = await alcas.evaluateAll((nos) => nos.map((no) => (no.getAttribute('aria-label') ?? '').replace('Reordenar ', '')))
  for (const titulo of titulos) {
    const el = page.getByText(titulo, { exact: true })
    const caixa = (await el.boundingBox())!
    const info = await el.evaluate((no) => {
      const estilo = getComputedStyle(no)
      // A lista fica dentro de um cartão: a largura útil do título é a do conteúdo do cartão, medida
      // na página (bordas e recuos de cada ancestral até o cartão), não a da janela menos a página.
      let recuo = 0
      let cartao: HTMLElement | null = no.parentElement
      while (cartao && cartao.getAttribute('data-rendra') !== 'CARD-001') {
        const e = getComputedStyle(cartao)
        recuo += parseFloat(e.paddingLeft) + parseFloat(e.paddingRight) + parseFloat(e.borderLeftWidth) + parseFloat(e.borderRightWidth)
        cartao = cartao.parentElement
      }
      const ec = cartao ? getComputedStyle(cartao) : null
      const larguraDoCartao = cartao ? cartao.getBoundingClientRect().width : 0
      const bordas = ec ? parseFloat(ec.borderLeftWidth) + parseFloat(ec.borderRightWidth) : 0
      return {
        corte: no.scrollHeight > no.clientHeight + 1,
        linha: parseFloat(estilo.lineHeight),
        noCartao: cartao !== null,
        util: larguraDoCartao - bordas - recuo,
      }
    })
    expect(info.corte, `${titulo}: texto cortado`).toBe(false)
    expect(caixa.height, `${titulo}: no máximo duas linhas`).toBeLessThanOrEqual(info.linha * 2 + 1)
    // Largura inteira da linha: o título não divide a linha com a alça nem com o menu. A largura útil é
    // a do conteúdo do cartão (medida acima), menos os 24 px de folga do critério original.
    expect(info.noCartao, `${titulo}: a lista fica dentro de um cartão`).toBe(true)
    expect(caixa.width, `${titulo}: largura`).toBeGreaterThanOrEqual(info.util - 24)
  }
  const datas = page.getByText(/^\d{2}\/\d{2}\/\d{4}$/)
  const total = await datas.count()
  expect(total).toBeGreaterThan(5)
  for (let i = 0; i < total; i++) {
    const info = await datas.nth(i).evaluate((no) => ({ altura: no.getBoundingClientRect().height, linha: parseFloat(getComputedStyle(no).lineHeight) }))
    expect(info.altura, `data ${i} em uma linha só`).toBeLessThanOrEqual(info.linha + 1)
  }
})
