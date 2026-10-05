// e2e/ajustes-ui.spec.ts
// 1.5.0: ícone do Button ao lado do texto, bordas com a cor do token, Atendimento (abas roláveis,
// busca com filtro, folha) e cartões brancos no modo claro.
import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { semSplash } from './splash'
import AxeBuilder from '@axe-core/playwright'
import { blockingViolations } from '../src/lib/axe-false-positives'

function codigoDo(testInfo: { project: { metadata: unknown } }): string {
  return (testInfo.project.metadata as { codigo?: string })?.codigo ?? 'T1-C1'
}

async function abrir(page: Page, rota: string, codigo: string) {
  await page.goto(`${rota.replace(/^\//, '')}?codigo=${codigo}`)
  await page.getByTestId(`rendra-${codigo}`).waitFor()
  await semSplash(page)
}

type MedidaBotao = {
  texto: string
  direcao: string
  alinhado: boolean
  lado: boolean
  espaco: number
  transborda: boolean
}

// Para cada botão com ícone (svg) e texto visível: o layout em linha (ícone ao lado do texto, centros
// verticais a no máximo 4 px), o espaço ícone-texto (gap-2 = 8 px) e se o conteúdo cabe na caixa.
async function medirBotoesComIcone(page: Page): Promise<MedidaBotao[]> {
  return page.evaluate(() => {
    const saida: MedidaBotao[] = []
    for (const botao of Array.from(document.querySelectorAll<HTMLElement>('[data-rendra^="BTN-"]'))) {
      const svg = botao.querySelector('svg')
      const texto = (botao.innerText || '').trim()
      if (!svg || !texto) continue
      const percorredor = document.createTreeWalker(botao, NodeFilter.SHOW_TEXT)
      let no: Node | null = null
      while ((no = percorredor.nextNode())) {
        if ((no.textContent ?? '').trim()) break
      }
      if (!no) continue
      const faixa = document.createRange()
      faixa.selectNodeContents(no)
      const t = faixa.getBoundingClientRect()
      const i = svg.getBoundingClientRect()
      const centroT = t.top + t.height / 2
      const centroI = i.top + i.height / 2
      const esquerda = i.right <= t.left + 1
      const direita = i.left >= t.right - 1
      const linha = botao.firstElementChild?.firstElementChild as HTMLElement | null
      saida.push({
        texto,
        direcao: linha ? getComputedStyle(linha).flexDirection : 'sem-linha',
        alinhado: Math.abs(centroT - centroI) <= 4,
        lado: esquerda || direita,
        espaco: esquerda ? t.left - i.right : i.left - t.right,
        transborda: botao.scrollWidth > botao.clientWidth + 1,
      })
    }
    return saida
  })
}

const ROTAS_BOTAO: Array<{ rota: string; textos: string[] }> = [
  { rota: '/clientes', textos: ['Filtros', 'Novo cliente'] },
  { rota: '/painel', textos: ['Novo cliente'] },
  { rota: '/componentes/exibicao', textos: ['Abrir no aplicativo de PDF', 'Avançar'] },
]

for (const { rota, textos } of ROTAS_BOTAO) {
  test(`${rota}: botão com ícone tem o ícone ao lado do texto, 8 px de espaço e sem transbordo`, async ({ page }, testInfo) => {
    await abrir(page, rota, codigoDo(testInfo))
    const medidas = await medirBotoesComIcone(page)
    for (const texto of textos) {
      const alvo = medidas.find((m) => m.texto === texto)
      expect(alvo, `${rota}: botão "${texto}" com ícone não achado`).toBeDefined()
    }
    expect(medidas.length).toBeGreaterThan(0)
    for (const m of medidas) {
      expect(m.direcao, `${rota} "${m.texto}": direção`).toBe('row')
      expect(m.lado, `${rota} "${m.texto}": ícone ao lado do texto`).toBe(true)
      expect(m.alinhado, `${rota} "${m.texto}": centros verticais`).toBe(true)
      expect(Math.round(m.espaco), `${rota} "${m.texto}": espaço ícone-texto`).toBe(8)
      expect(m.transborda, `${rota} "${m.texto}": conteúdo maior que o botão`).toBe(false)
    }
  })
}

test('Wizard aberto na etapa 2: "Voltar" com ícone fica ao lado do texto e cabe no botão', async ({ page }, testInfo) => {
  await abrir(page, '/componentes/exibicao', codigoDo(testInfo))
  await page.getByRole('textbox', { name: 'Nome da empresa' }).fill('Acme')
  await page.getByRole('button', { name: 'Avançar' }).click()
  await expect(page.getByTestId('wizard-rodape').getByRole('button', { name: 'Voltar' })).toBeVisible()
  const medidas = await medirBotoesComIcone(page)
  const voltar = medidas.find((m) => m.texto === 'Voltar')
  expect(voltar, '"Voltar" com ícone').toBeDefined()
  expect(voltar!.direcao).toBe('row')
  expect(voltar!.lado).toBe(true)
  expect(voltar!.transborda).toBe(false)
})


// ---------------------------------------------------------------------------------------------
// Bordas e divisores com a cor do token (`--rendra-border`), nunca a preta do react-native-web.
// ---------------------------------------------------------------------------------------------

const PRETO = 'rgb(0, 0, 0)'
const LADOS = ['Top', 'Right', 'Bottom', 'Left'] as const

/** Elementos (e descendentes) com largura de borda maior que 0 e cor preta. Vazio = sem linha preta. */
async function bordasPretas(page: Page): Promise<string[]> {
  return page.evaluate(
    ({ preto, lados }) => {
      const achados: string[] = []
      for (const el of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
        const estilo = getComputedStyle(el)
        for (const lado of lados) {
          const largura = parseFloat(estilo.getPropertyValue(`border-${lado.toLowerCase()}-width`))
          const cor = estilo.getPropertyValue(`border-${lado.toLowerCase()}-color`)
          if (largura > 0 && cor === preto) {
            achados.push(`${el.getAttribute('data-rendra') ?? el.tagName.toLowerCase()} (${lado}) ${String(el.className).slice(0, 80)}`)
          }
        }
      }
      return achados
    },
    { preto: PRETO, lados: LADOS },
  )
}

/** Cor da borda do cabeçalho do shell, que já usa `border-border`: a referência do token. */
async function corDoToken(page: Page): Promise<string> {
  return page.getByTestId('shell-cabecalho').evaluate((el) => getComputedStyle(el).borderBottomColor)
}

const CODIGOS_POR_ROTA: Record<string, string[]> = {
  '/painel': ['BTNG-001', 'STAT-001', 'CARD-001'],
  '/clientes/novo': ['FORM-002', 'ACB-001'],
  '/clientes/1000': ['CARD-001', 'STAT-001'],
  '/tarefas': ['ACB-001'],
  '/agenda': ['CAL-001', 'BTNG-001'],
  '/configuracoes': ['FORM-002', 'ACB-001'],
  '/galeria': ['BTNG-001', 'CARD-001', 'STAT-001', 'ABA-001'],
  '/cadastro': ['CARD-001', 'ACB-001'],
  '/componentes/exibicao': ['CARD-001', 'STAT-001', 'ACRN-001', 'BTNG-001'],
  '/componentes/acoes': ['BTNG-001'],
}

for (const [rota, codigos] of Object.entries(CODIGOS_POR_ROTA)) {
  test(`${rota}: bordas dos componentes ${codigos.join(', ')} usam a cor do token, não preta`, async ({ page }, testInfo) => {
    const codigo = codigoDo(testInfo)
    await abrir(page, rota, codigo)
    const token = await corDoToken(page)
    if ((testInfo.project.metadata as { mode?: string }).mode === 'light') {
      expect(token, 'cor do token --rendra-border no claro').toBe('rgb(219, 226, 235)')
    }
    for (const codigoComponente of codigos) {
      const nos = page.locator(`[data-rendra="${codigoComponente}"]`)
      expect(await nos.count(), `${rota}: ${codigoComponente} presente`).toBeGreaterThan(0)
      const bordas = await nos.evaluateAll(
        (lista, lados) =>
          lista.flatMap((raiz) =>
            [raiz as HTMLElement, ...Array.from(raiz.querySelectorAll<HTMLElement>('*'))].flatMap((el) => {
              const estilo = getComputedStyle(el)
              return lados
                .filter((lado) => parseFloat(estilo.getPropertyValue(`border-${lado.toLowerCase()}-width`)) > 0)
                .map((lado) => ({ propria: el === raiz, cor: estilo.getPropertyValue(`border-${lado.toLowerCase()}-color`) }))
            }),
          ),
        [...LADOS],
      )
      for (const borda of bordas) {
        expect(borda.cor, `${rota} ${codigoComponente}: cor de borda`).not.toBe(PRETO)
        if (borda.propria) expect(borda.cor, `${rota} ${codigoComponente}: borda própria com a cor do token`).toBe(token)
      }
    }
  })
}

test('estados abertos: gaveta Filtros, Select aberto e Accordion sem linha preta', async ({ page }, testInfo) => {
  const codigo = codigoDo(testInfo)
  await abrir(page, '/clientes', codigo)
  await page.getByRole('button', { name: 'Filtros' }).click()
  const dialogo = page.getByRole('dialog', { name: 'Filtros' })
  await expect(dialogo).toBeVisible()
  expect(await bordasPretas(page), 'gaveta Filtros aberta (cabeçalho, rodapé, opções)').toEqual([])
  const token = await corDoToken(page)
  const rodape = await page.getByRole('button', { name: 'Aplicar' }).evaluate((el) => {
    let no: HTMLElement | null = el as HTMLElement
    while (no && parseFloat(getComputedStyle(no).borderTopWidth) === 0) no = no.parentElement
    return no ? getComputedStyle(no).borderTopColor : null
  })
  expect(rodape, 'rodapé da gaveta com a cor do token').toBe(token)

  await abrir(page, '/componentes/formulario', codigo)
  await page.getByRole('combobox').first().click()
  await expect(page.getByRole('button', { name: /^Aplicar/ })).toBeVisible()
  expect(await bordasPretas(page), 'Select aberto (folha inferior)').toEqual([])

  await abrir(page, '/componentes/exibicao', codigo)
  const itens = page.locator('[data-rendra="ACRN-001"] [role="button"]')
  await itens.first().click()
  expect(await bordasPretas(page), 'Accordion aberto').toEqual([])
})

const ROTAS_VARRIDAS = [
  '/', '/componentes', '/componentes/acoes', '/componentes/layout', '/componentes/feedback', '/componentes/formulario',
  '/componentes/exibicao', '/componentes/dados', '/componentes/planejamento', '/tokens', '/galeria', '/painel',
  '/configuracoes', '/login', '/esqueci-senha', '/verificacao', '/nova-senha', '/cadastre-se', '/clientes', '/clientes/1000',
  '/clientes/novo', '/cadastro', '/tarefas', '/atendimento', '/atendimento/t1', '/agenda', '/kanban',
]

for (const rota of ROTAS_VARRIDAS) {
  test(`${rota}: nenhuma borda preta na página`, async ({ page }, testInfo) => {
    await abrir(page, rota, codigoDo(testInfo))
    expect(await bordasPretas(page)).toEqual([])
  })
}


// ---------------------------------------------------------------------------------------------
// Atendimento: abas roláveis, busca com botão de filtros dentro do campo, folha inferior.
// ---------------------------------------------------------------------------------------------

async function abrirAtendimento(page: Page, codigo: string) {
  await abrir(page, '/atendimento', codigo)
  await page.getByRole('tab', { name: 'Encerrado', exact: true }).waitFor()
}

test('atendimento: sem rolagem da página, abas rolam, a última aba é alcançável e não há Select de etapa', async ({ page }, testInfo) => {
  await abrirAtendimento(page, codigoDo(testInfo))
  const largura = page.viewportSize()!.width
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(largura)
  await expect(page.getByRole('combobox', { name: 'Etapa do atendimento' })).toHaveCount(0)
  const lista = page.getByRole('tablist')
  const rolagem = await lista.evaluate((el) => {
    let no: HTMLElement | null = el.parentElement
    while (no && !['auto', 'scroll'].includes(getComputedStyle(no).overflowX)) no = no.parentElement
    return no ? { rola: no.scrollWidth > no.clientWidth + 1, scrollWidth: no.scrollWidth, clientWidth: no.clientWidth } : null
  })
  expect(rolagem, 'a lista de abas fica num contêiner com rolagem horizontal').not.toBeNull()
  if (largura <= 360) expect(rolagem!.rola, 'a 360 as quatro abas não cabem e a lista rola').toBe(true)
  const ultima = page.getByRole('tab', { name: 'Encerrado', exact: true })
  await ultima.click()
  await expect(ultima).toHaveAttribute('aria-selected', 'true')
  const caixa = (await ultima.boundingBox())!
  expect(caixa.x + caixa.width, 'a última aba fica visível depois de tocar').toBeLessThanOrEqual(largura + 1)
  expect(caixa.height).toBeGreaterThanOrEqual(44)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(largura)
})

test('atendimento: o balão conta não lidas e o nome da aba diz "não lidas"', async ({ page }, testInfo) => {
  await abrirAtendimento(page, codigoDo(testInfo))
  const atendimento = page.getByRole('tab', { name: 'Atendimento 2 não lidas', exact: true })
  await expect(atendimento).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Fila 1 não lida', exact: true })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'URA/IA', exact: true })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Encerrado', exact: true })).toBeVisible()
})

test('atendimento: o botão de filtros está dentro do campo, encostado à direita, com 44x44', async ({ page }, testInfo) => {
  await abrirAtendimento(page, codigoDo(testInfo))
  const botao = (await page.getByRole('button', { name: 'Filtros', exact: true }).boundingBox())!
  const moldura = (await page.locator('[data-rendra="CAMP-001"]').first().boundingBox())!
  expect(botao.width).toBeGreaterThanOrEqual(44)
  expect(botao.height).toBeGreaterThanOrEqual(44)
  expect(botao.x).toBeGreaterThanOrEqual(moldura.x)
  expect(botao.x + botao.width).toBeLessThanOrEqual(moldura.x + moldura.width + 0.5)
  expect(moldura.x + moldura.width - (botao.x + botao.width), 'encostado à direita (recuo do campo)').toBeLessThanOrEqual(16)
  expect(botao.y).toBeGreaterThanOrEqual(moldura.y - 0.5)
  expect(botao.y + botao.height).toBeLessThanOrEqual(moldura.y + moldura.height + 0.5)
})

test('atendimento: a folha sobe de baixo, com Canal, Período e rodapé visíveis, e um único diálogo', async ({ page }, testInfo) => {
  await abrirAtendimento(page, codigoDo(testInfo))
  await page.getByRole('button', { name: 'Filtros', exact: true }).click()
  const folha = page.getByTestId('atendimento-filtros')
  await expect(folha).toBeVisible()
  const janela = page.viewportSize()!
  const painel = page.getByTestId('atendimento-filtros-sheet')
  // espera a entrada terminar (a folha anima de baixo para cima)
  await expect.poll(async () => Math.round((await painel.boundingBox())!.y + (await painel.boundingBox())!.height)).toBeGreaterThanOrEqual(janela.height - 20)
  const caixa = (await painel.boundingBox())!
  expect(caixa.height, 'altura no máximo 80% da janela').toBeLessThanOrEqual(janela.height * 0.8 + 1)
  expect(caixa.y, 'a folha não ocupa a tela toda').toBeGreaterThan(janela.height * 0.1)
  // título, Fechar (44x44), Canal, Período, Limpar e Aplicar, tudo visível sem rolar a página
  await expect(folha.getByText('Filtros', { exact: true })).toBeVisible()
  // espera a animação terminar (a escala/posição da folha muda o tamanho medido em frações de pixel) e dá a
  // mesma folga de 0,5 px das medidas vizinhas
  const botaoFechar = page.getByTestId('atendimento-filtros-fechar')
  await expect.poll(async () => (await botaoFechar.boundingBox())!.height).toBeGreaterThanOrEqual(43.5)
  const fechar = (await botaoFechar.boundingBox())!
  expect(fechar.width).toBeGreaterThanOrEqual(43.5)
  expect(fechar.height).toBeGreaterThanOrEqual(43.5)
  await expect(folha.getByText('Canal', { exact: true })).toBeVisible()
  await expect(folha.getByText('Período', { exact: true })).toBeVisible()
  await expect(folha.getByRole('checkbox', { name: 'WhatsApp', exact: true })).toBeVisible()
  await expect(folha.getByRole('radio', { name: 'Hoje' })).toBeVisible()
  // o rodapé fica fixo abaixo da rolagem: Aplicar cabe na janela assim que a entrada termina
  await expect
    .poll(async () => {
      const aplicar = (await folha.getByRole('button', { name: 'Aplicar' }).boundingBox())!
      return Math.round(aplicar.y + aplicar.height)
    }, { message: 'Aplicar visível dentro da janela' })
    .toBeLessThanOrEqual(janela.height)
  await expect(folha.getByRole('button', { name: 'Limpar' })).toBeVisible()
  // sem Select nem DatePicker: nada de segunda folha por cima, um único diálogo nomeado
  await expect(page.getByRole('combobox')).toHaveCount(0)
  await expect(page.locator('[role="dialog"]')).toHaveCount(1)
  // topo com a borda do token, nunca preta
  expect(await bordasPretas(page), 'folha aberta sem linha preta').toEqual([])
  const token = await corDoToken(page)
  const borda = await folha.evaluate((el) => {
    const alvo = el.querySelector<HTMLElement>('[class*="rounded-t-surface"]')
    return alvo ? { largura: getComputedStyle(alvo).borderTopWidth, cor: getComputedStyle(alvo).borderTopColor } : null
  })
  expect(borda, 'a folha tem o painel com cantos de cima arredondados').not.toBeNull()
  expect(borda!.largura).not.toBe('0px')
  expect(borda!.cor, 'borda de cima da folha com a cor do token').toBe(token)
})

test('atendimento: Escape fecha a folha e o foco volta ao botão Filtros', async ({ page }, testInfo) => {
  await abrirAtendimento(page, codigoDo(testInfo))
  const botao = page.getByRole('button', { name: 'Filtros', exact: true })
  await botao.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('atendimento-filtros')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('atendimento-filtros')).toHaveCount(0)
  await expect(botao).toBeFocused()
})

test('atendimento: o foco vai para dentro da folha ao abrir e Fechar é alcançável pelo teclado', async ({ page }, testInfo) => {
  await abrirAtendimento(page, codigoDo(testInfo))
  await page.getByRole('button', { name: 'Filtros', exact: true }).click()
  const folha = page.getByTestId('atendimento-filtros')
  await expect(folha).toBeVisible()
  let achouFechar = false
  for (let i = 0; i < 12 && !achouFechar; i++) {
    await page.keyboard.press('Tab')
    achouFechar = await page.evaluate(() => document.activeElement?.getAttribute('data-testid') === 'atendimento-filtros-fechar')
  }
  expect(achouFechar, '"Fechar" recebe o foco pelo teclado').toBe(true)
})

test('atendimento: axe sem violações com a folha fechada, com busca e filtro ativos, e com a folha aberta', async ({ page }, testInfo) => {
  await abrirAtendimento(page, codigoDo(testInfo))
  // Com a folha aberta o axe varre só o diálogo modal: a página atrás fica sob o fundo escuro e não é alcançável.
  const varrer = async (rotulo: string, soDialogo = false) => {
    const construtor = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    const resultado = await (soDialogo ? construtor.include('[data-testid="atendimento-filtros"]') : construtor).analyze()
    const bloqueantes = blockingViolations(resultado.violations)
    expect(bloqueantes, `${rotulo}: ${JSON.stringify(bloqueantes, null, 2)}`).toEqual([])
  }
  await varrer('folha fechada')
  await page.getByRole('button', { name: 'Filtros', exact: true }).click()
  await expect(page.getByTestId('atendimento-filtros')).toBeVisible()
  await page.waitForTimeout(500)
  await varrer('folha aberta', true)
  await page.getByRole('checkbox', { name: 'WhatsApp', exact: true }).click()
  await page.getByRole('radio', { name: '7 dias' }).click()
  await varrer('folha aberta com filtros marcados', true)
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByTestId('atendimento-filtros')).toHaveCount(0)
  await page.getByRole('textbox', { name: 'Buscar conversa' }).fill('ana')
  await expect(page.getByRole('button', { name: 'Filtros, 2 ativos' })).toBeVisible()
  await varrer('busca preenchida e dois filtros ativos (selo do botão)')
})

test('atendimento: filtrar por WhatsApp e por período muda a lista, o selo e o nome do botão', async ({ page }, testInfo) => {
  // relógio do aparelho em 2031: o período se ancora na conversa mais recente da demo (05/10/2026)
  await page.clock.setFixedTime(new Date('2031-01-15T12:00:00'))
  await abrirAtendimento(page, codigoDo(testInfo))
  await page.getByRole('tab', { name: 'Atendimento 2 não lidas', exact: true }).click()
  await expect(page.getByText('Carlos Dias')).toBeVisible()
  await page.getByRole('button', { name: 'Filtros', exact: true }).click()
  await page.getByRole('checkbox', { name: 'WhatsApp', exact: true }).click()
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByText('Ana Souza')).toBeVisible()
  await expect(page.getByText('Carlos Dias')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Filtros, 1 ativo' })).toBeVisible()
  await page.getByRole('button', { name: 'Filtros, 1 ativo' }).click()
  await page.getByRole('radio', { name: 'Hoje' }).click()
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByText('Ana Souza')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Filtros, 2 ativos' })).toBeVisible()
  await page.getByRole('tab', { name: 'Fila', exact: true }).click()
  await expect(page.getByText('Nenhuma conversa com essa busca ou filtros.')).toBeVisible()
  await page.getByRole('button', { name: 'Filtros, 2 ativos' }).click()
  await page.getByRole('button', { name: 'Limpar' }).click()
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByRole('button', { name: 'Filtros', exact: true })).toBeVisible()
  await page.getByRole('tab', { name: 'Atendimento 2 não lidas', exact: true }).click()
  await expect(page.getByText('Carlos Dias')).toBeVisible()
})


// ---------------------------------------------------------------------------------------------
// Cartões brancos com borda cinza clara nas telas de exemplo, sobre o fundo cinza do modo claro.
// ---------------------------------------------------------------------------------------------

const TELAS_COM_CARTAO: Array<{ rota: string; texto: string }> = [
  { rota: '/tarefas', texto: 'Enviar proposta para a Padaria Estrela' },
  { rota: '/clientes', texto: 'Padaria Estrela' },
  { rota: '/atendimento', texto: 'Diana Melo' },
  { rota: '/tokens', texto: 'Paleta' },
  { rota: '/componentes/acoes', texto: 'Salvar' },
]

for (const { rota, texto } of TELAS_COM_CARTAO) {
  test(`${rota}: o conteúdo fica num cartão (branco no claro, borda cinza clara) sobre o fundo da página`, async ({ page }, testInfo) => {
    await abrir(page, rota, codigoDo(testInfo))
    const cartao = page.locator('[data-rendra="CARD-001"]').filter({ has: page.getByText(texto, { exact: true }).first() }).first()
    await expect(cartao).toBeVisible()
    const medida = await cartao.evaluate((el) => {
      const estilo = getComputedStyle(el)
      let fundo = 'rgba(0, 0, 0, 0)'
      for (let no = el.parentElement; no; no = no.parentElement) {
        const cor = getComputedStyle(no).backgroundColor
        if (cor !== 'rgba(0, 0, 0, 0)') {
          fundo = cor
          break
        }
      }
      return { fundoDoCartao: estilo.backgroundColor, borda: estilo.borderTopColor, larguraBorda: estilo.borderTopWidth, fundoDaPagina: fundo }
    })
    expect(medida.larguraBorda).not.toBe('0px')
    expect(medida.borda).not.toBe(PRETO)
    if ((testInfo.project.metadata as { mode?: string }).mode === 'light') {
      expect(medida.fundoDoCartao, `${rota}: cartão branco`).toBe('rgb(255, 255, 255)')
      expect(medida.borda, `${rota}: borda cinza clara`).toBe('rgb(219, 226, 235)')
      expect(medida.fundoDaPagina, `${rota}: o fundo da página continua cinza`).toBe('rgb(245, 246, 247)')
    } else {
      expect(medida.fundoDoCartao, `${rota}: no escuro o cartão se distingue do fundo`).not.toBe(medida.fundoDaPagina)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `${rota}: sem rolagem horizontal`).toBeLessThanOrEqual(page.viewportSize()!.width)
  })
}

test('/componentes: nenhum exemplo da vitrine tem cartão dentro de cartão', async ({ page }, testInfo) => {
  for (const grupo of ['acoes', 'formulario', 'feedback', 'exibicao', 'layout', 'dados', 'planejamento']) {
    await abrir(page, `/componentes/${grupo}`, codigoDo(testInfo))
    const aninhados = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll('[data-rendra="CARD-001"]')).filter((el) => el.parentElement?.closest('[data-rendra="CARD-001"]')).length,
    )
    expect(aninhados, `/componentes/${grupo}: cartões dentro de cartão`).toBe(0)
  }
})

test('atendimento: Canal em chips que quebram em linhas, 44 px, e Canal e Período cabem na folha sem rolar em 390x844', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await abrirAtendimento(page, codigoDo(testInfo))
  await page.getByRole('button', { name: 'Filtros', exact: true }).click()
  const folha = page.getByTestId('atendimento-filtros')
  await expect(folha).toBeVisible()
  const whats = folha.getByRole('checkbox', { name: 'WhatsApp', exact: true })
  await expect(whats).toHaveAttribute('aria-checked', 'false')
  await whats.click()
  await expect(whats).toHaveAttribute('aria-checked', 'true')
  const chips = await folha.getByRole('checkbox').evaluateAll((nos) => nos.map((n) => { const b = n.getBoundingClientRect(); return { y: Math.round(b.top), h: b.height } }))
  expect(chips.length).toBeGreaterThan(5)
  expect(Math.min(...chips.map((c) => c.h))).toBeGreaterThanOrEqual(44)
  expect(new Set(chips.map((c) => c.y)).size, 'os chips quebram em mais de uma linha').toBeGreaterThan(1)
  const periodo = folha.getByRole('radio', { name: 'Tudo' })
  await expect(periodo).toHaveAttribute('aria-checked', 'true')
  const rolagem = await page.getByTestId('atendimento-filtros-rolagem').evaluate((el) => ({ rola: el.scrollHeight > el.clientHeight + 1 }))
  const altura = page.viewportSize()!.height
  expect(altura).toBe(844)
  expect(rolagem.rola, 'sem rolar a 844 de altura').toBe(false)
  const box = (await folha.getByRole('radio', { name: '30 dias' }).boundingBox())!
  const apl = (await folha.getByRole('button', { name: 'Aplicar' }).boundingBox())!
  expect(box.y + box.height).toBeLessThanOrEqual(apl.y)
})

test('clientes: o nome pode ir a 2 linhas, sem cortar e sem esconder o selo nem o menu', async ({ page }, testInfo) => {
  await abrir(page, '/clientes', codigoDo(testInfo))
  const linhas = page.getByText(/Estrela$/)
  expect(await linhas.count()).toBeGreaterThan(3)
  for (const nome of ['Metalúrgica Estrela', 'Padaria Estrela']) {
    const el = page.getByText(nome, { exact: true }).first()
    const info = await el.evaluate((no) => ({ corte: no.scrollHeight > no.clientHeight + 1, h: no.getBoundingClientRect().height, linha: parseFloat(getComputedStyle(no).lineHeight) }))
    expect(info.corte, nome + ': texto cortado').toBe(false)
    expect(info.h, nome + ': no máximo 2 linhas').toBeLessThanOrEqual(info.linha * 2 + 1)
  }
  const larg = page.viewportSize()!.width
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(larg)
  await expect(page.getByRole('button', { name: /^Ações de Metalúrgica Estrela/ })).toBeVisible()
})
