import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// Mesmo desvio H3 dos demais scripts: tsconfig.json restringe `types` a `["jest"]`.
const { existsSync } = require('fs') as { existsSync: (caminho: string) => boolean }
const { join } = require('path') as { join: (...partes: string[]) => string }

const DESKTOP_MIN = 900

test.describe('página de apresentação', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./')
  })

  test('não tem rolagem horizontal', async ({ page }) => {
    const largo = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(largo).toBe(false)
  })

  test('metadados de SEO e AEO', async ({ page }) => {
    await expect(page).toHaveTitle(/Rendra App/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://bsmagalhaes.github.io/rendra-ui-app/',
    )
    const robots = await page.locator('meta[name="robots"]').evaluateAll((ms) => ms.map((m) => m.getAttribute('content')))
    expect(robots).toEqual(expect.arrayContaining(['index, follow', 'noai, noimageai']))
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og-image\.png$/)
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents()
    const tipos = ld.flatMap((t) => {
      const j = JSON.parse(t) as { '@type': string } | Array<{ '@type': string }>
      return (Array.isArray(j) ? j : [j]).map((x) => x['@type'])
    })
    expect(tipos).toContain('SoftwareSourceCode')
  })

  test('iframe da demo só a partir de 900 px; abaixo, imagem com link', async ({ page }) => {
    const largura = page.viewportSize()!.width
    const frame = page.locator('iframe[name="demo"]')
    if (largura >= DESKTOP_MIN) {
      await expect(frame).toHaveAttribute('title', /Demonstração do Rendra App/)
      await expect(frame).toHaveAttribute('src', /demo\/painel\?codigo=T1-C1-N1/)
      const dentro = page.frameLocator('iframe[name="demo"]')
      await expect(dentro.getByTestId('rendra-T1-C1')).toBeVisible()
      // Abre no Painel, dentro do shell: a barra inferior existe e o item Painel está ativo.
      const barra = dentro.getByRole('navigation', { name: 'Navegação rápida' })
      await expect(barra).toBeVisible()
      await expect(barra.getByRole('link', { name: 'Painel' })).toHaveAttribute('aria-current', 'page')
      // O endereço do iframe não passa pelo teste de links: confere que o Painel existe como o Pages o resolve.
      expect(existsSync(join(process.cwd(), '.pages', 'rendra-ui-app', 'demo', 'painel.html'))).toBe(true)
    } else {
      await expect(frame).toHaveCount(0)
      const imagem = page.locator('a.phone-link[href="demo/"] img')
      await expect(imagem).toBeVisible()
      await expect(imagem).toHaveAttribute('src', 'images/safira-home-mobile.webp')
      await expect(page.getByRole('group', { name: 'Modelo', exact: true })).toBeHidden()
      await expect(page.getByRole('group', { name: 'Paleta', exact: true })).toBeHidden()
      // A reserva de caixa do simulador não vale para a imagem estática: a imagem cabe inteira no slot.
      const caixas = await page.evaluate(() => {
        const r = (el: Element | null) => el!.getBoundingClientRect()
        const img = r(document.querySelector('#phone-slot img'))
        const slot = r(document.getElementById('phone-slot'))
        return { img: { l: img.left, r: img.right, t: img.top, b: img.bottom }, slot: { l: slot.left, r: slot.right, t: slot.top, b: slot.bottom } }
      })
      expect(caixas.img.l).toBeGreaterThanOrEqual(caixas.slot.l - 1)
      expect(caixas.img.r).toBeLessThanOrEqual(caixas.slot.r + 1)
      expect(caixas.img.t).toBeGreaterThanOrEqual(caixas.slot.t - 1)
      expect(caixas.img.b).toBeLessThanOrEqual(caixas.slot.b + 1)
    }
  })

  test('hero: seletor de modelo e paleta', async ({ page }) => {
    test.skip(page.viewportSize()!.width < DESKTOP_MIN, 'sem simulador no celular')
    await page.setViewportSize({ width: 1280, height: 800 })
    const modelo = page.getByRole('group', { name: 'Modelo', exact: true })
    const paleta = page.getByRole('group', { name: 'Paleta', exact: true })
    await expect(modelo).toBeVisible()
    await expect(paleta).toBeVisible()
    const nomesModelo = ['Modelo Safira', 'Modelo Equilíbrio', 'Modelo Aurora']
    const nomesPaleta = ['Paleta Safira', 'Paleta Equilíbrio', 'Paleta Aurora', 'Paleta Ardósia']
    await expect(modelo.getByRole('button')).toHaveCount(3)
    await expect(paleta.getByRole('button')).toHaveCount(4)
    for (const nome of nomesModelo) await expect(modelo.getByRole('button', { name: nome, exact: true })).toBeVisible()
    for (const nome of nomesPaleta) await expect(paleta.getByRole('button', { name: nome, exact: true })).toBeVisible()
    // Dentro da coluna do texto, nunca dentro do aparelho.
    for (const grupo of [modelo, paleta]) {
      const lugar = await grupo.evaluate((el) => ({
        naColuna: document.getElementById('titulo')!.parentElement!.contains(el),
        noAparelho: el.closest('#phone-slot, .phone') !== null,
      }))
      expect(lugar).toEqual({ naColuna: true, noAparelho: false })
    }
    // Estado inicial e sinal não cromático do botão ativo (peso da fonte), além da cor da borda.
    for (const [grupo, nomes] of [[modelo, nomesModelo], [paleta, nomesPaleta]] as const) {
      for (const [i, nome] of nomes.entries()) {
        await expect(grupo.getByRole('button', { name: nome, exact: true })).toHaveAttribute('aria-pressed', i === 0 ? 'true' : 'false')
      }
      const pesos = await grupo.getByRole('button').evaluateAll((bs) => bs.map((b) => Number(getComputedStyle(b).fontWeight)))
      expect(pesos[0]).toBeGreaterThan(pesos[1]!)
      expect(pesos[1]).toBe(pesos[2])
    }
    // Toque mínimo 44x44.
    for (const botao of await modelo.getByRole('button').or(paleta.getByRole('button')).all()) {
      const caixa = (await botao.boundingBox())!
      expect(caixa.width, await botao.innerText()).toBeGreaterThanOrEqual(44)
      expect(caixa.height, await botao.innerText()).toBeGreaterThanOrEqual(44)
    }
    // Amostra decorativa, com a cor do botão e contorno de pelo menos 3:1 contra o fundo do botão.
    const amostras = await paleta.getByRole('button').evaluateAll((bs) =>
      bs.map((b) => {
        const am = b.querySelector('span[aria-hidden="true"]') as HTMLElement | null
        const cs = am ? getComputedStyle(am) : null
        const luz = (rgb: number[]) => {
          const [r, g, bl] = rgb.map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 })
          return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!
        }
        const nums = (txt: string) => (txt.match(/rgba?\([^)]*\)/)?.[0].match(/[\d.]+/g) ?? []).map(Number)
        const contorno = cs ? nums(cs.boxShadow) : []
        const fundoBotao = nums(getComputedStyle(b).backgroundColor)
        const [l1, l2] = [luz(contorno.slice(0, 3)), luz(fundoBotao.slice(0, 3))]
        return {
          existe: !!am,
          fundo: cs?.backgroundColor,
          cor: b.getAttribute('data-cor'),
          contraste: contorno.length ? (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05) : 0,
          largura: am ? am.getBoundingClientRect().width : 0,
        }
      }),
    )
    expect(amostras).toHaveLength(4)
    for (const am of amostras) {
      expect(am.existe).toBe(true)
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(am.cor!.slice(i, i + 2), 16))
      expect(am.fundo).toBe(`rgb(${r}, ${g}, ${b})`)
      expect(am.contraste).toBeGreaterThanOrEqual(3)
      expect(am.largura).toBeGreaterThanOrEqual(16)
    }
    // Atalho para a demo em tela cheia continua na coluna do texto.
    await expect(page.getByRole('link', { name: 'Abrir em tela cheia' })).toHaveAttribute('href', 'demo/')
  })

  test('hero: botões recarregam o iframe', async ({ page }) => {
    test.skip(page.viewportSize()!.width < DESKTOP_MIN, 'sem iframe no celular')
    const modelo = page.getByRole('group', { name: 'Modelo', exact: true })
    const paleta = page.getByRole('group', { name: 'Paleta', exact: true })
    const frame = page.locator('iframe[name="demo"]')
    const dentro = page.frameLocator('iframe[name="demo"]')
    const marcados = async (grupo: typeof modelo) =>
      grupo.getByRole('button').evaluateAll((bs) => bs.filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.getAttribute('aria-label') ?? b.textContent!.trim()))

    await modelo.getByRole('button', { name: 'Modelo Aurora', exact: true }).click()
    await expect(frame).toHaveAttribute('src', /demo\/painel\?codigo=T3-C1-N1/)
    expect(await marcados(modelo)).toEqual(['Modelo Aurora'])
    expect(await marcados(paleta)).toEqual(['Paleta Safira'])

    await paleta.getByRole('button', { name: 'Paleta Ardósia', exact: true }).click()
    await expect(frame).toHaveAttribute('src', /demo\/painel\?codigo=T3-C4-N1/)
    expect(await marcados(modelo)).toEqual(['Modelo Aurora'])
    expect(await marcados(paleta)).toEqual(['Paleta Ardósia'])
    await expect(dentro.getByTestId('rendra-T3-C4')).toBeVisible()
    await expect(dentro.getByRole('navigation', { name: 'Navegação rápida' })).toBeVisible()

    await paleta.getByRole('button', { name: 'Paleta Safira', exact: true }).click()
    await modelo.getByRole('button', { name: 'Modelo Safira', exact: true }).click()
    await expect(frame).toHaveAttribute('src', /demo\/painel\?codigo=T1-C1-N1/)
    await expect(dentro.getByTestId('rendra-T1-C1')).toBeVisible()
  })

  test('hero: grupos e iframe acompanham a largura (900 px)', async ({ page }) => {
    test.skip(page.viewportSize()!.width < DESKTOP_MIN, 'a troca de viewport só é confiável no desktop')
    const modelo = page.getByRole('group', { name: 'Modelo', exact: true })
    const paleta = page.getByRole('group', { name: 'Paleta', exact: true })
    await expect(modelo).toBeVisible()
    await page.setViewportSize({ width: DESKTOP_MIN - 1, height: 800 })
    await expect(modelo).toBeHidden()
    await expect(paleta).toBeHidden()
    await expect(page.locator('iframe[name="demo"]')).toHaveCount(0)
    await expect(page.locator('#phone-slot a.phone-link img')).toBeVisible()
    // A reserva de caixa do simulador sai junto: a imagem estática volta ao tamanho cheio.
    await expect(page.locator('#phone-slot')).not.toHaveClass(/ao-vivo/)
    const imagem = (await page.locator('#phone-slot a.phone-link img').boundingBox())!
    expect(imagem.width).toBeGreaterThanOrEqual(413)
    expect(imagem.height).toBeGreaterThanOrEqual(867)
    await page.setViewportSize({ width: 1280, height: 800 })
    await expect(page.locator('#phone-slot')).toHaveClass(/ao-vivo/)
    await expect(modelo).toBeVisible()
    await expect(paleta).toBeVisible()
    await expect(page.locator('iframe[name="demo"]')).toHaveCount(1)
  })

  test('hero: simulador cabe na janela', async ({ page }) => {
    test.skip(page.viewportSize()!.width < DESKTOP_MIN, 'sem simulador no celular')
    for (const tamanho of [{ width: 1280, height: 800 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
      await page.setViewportSize(tamanho)
      const medidas = await page.evaluate(() => {
        const caixa = (el: Element | null) => {
          const r = el!.getBoundingClientRect()
          return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, height: r.height }
        }
        return {
          rolagem: window.scrollY,
          janela: { w: window.innerWidth, h: window.innerHeight },
          phone: caixa(document.querySelector('#phone-slot .phone')),
          slot: caixa(document.getElementById('phone-slot')),
          titulo: caixa(document.getElementById('titulo')),
          grupos: [...document.querySelectorAll('[role="group"][aria-label="Modelo"], [role="group"][aria-label="Paleta"]')].map(caixa),
        }
      })
      const dentroDaJanela = (c: { top: number; bottom: number; left: number; right: number }) =>
        c.top >= 0 && c.bottom <= medidas.janela.h && c.left >= 0 && c.right <= medidas.janela.w
      const rotulo = `${tamanho.width}x${tamanho.height}`
      expect(medidas.rolagem, `rolagem ${rotulo}`).toBe(0)
      expect(dentroDaJanela(medidas.phone), `aparelho inteiro ${rotulo}: ${JSON.stringify(medidas.phone)}`).toBe(true)
      expect(dentroDaJanela(medidas.titulo), `título inteiro ${rotulo}`).toBe(true)
      expect(medidas.grupos).toHaveLength(2)
      for (const g of medidas.grupos) expect(dentroDaJanela(g), `grupos inteiros ${rotulo}`).toBe(true)
      // A caixa reservada acompanha o aparelho reduzido, sem vão.
      expect(Math.abs(medidas.slot.height - medidas.phone.height), `vão sob o aparelho ${rotulo}`).toBeLessThanOrEqual(2)
      // A redução é só visual: o app dentro do iframe segue com 390 px de viewport.
      const interna = await page.frameLocator('iframe[name="demo"]').locator('body').evaluate(() => window.innerWidth)
      expect(interna, `viewport interno ${rotulo}`).toBe(390)
    }
  })

  test('miniaturas das telas e da matriz ficam limitadas', async ({ page }) => {
    test.skip(page.viewportSize()!.width < DESKTOP_MIN, 'medida em tela larga')
    await page.setViewportSize({ width: 1920, height: 1080 })
    const larguras = await page.evaluate(() => ({
      imagens: [...document.querySelectorAll('figure img')].map((i) => i.getBoundingClientRect().width),
      grades: [...document.querySelectorAll('.matriz, .prints, .gallery')].map((g) => g.getBoundingClientRect().width),
    }))
    expect(larguras.imagens.length).toBeGreaterThan(20)
    for (const w of larguras.imagens) expect(w).toBeLessThanOrEqual(300)
    for (const w of larguras.grades) expect(w).toBeLessThanOrEqual(1200)
  })

  test('conteúdo centralizado e limitado em tela larga; "Abrir em tela cheia" em linha própria', async ({ page }) => {
    test.skip(page.viewportSize()!.width < DESKTOP_MIN, 'medida em tela larga')
    await page.setViewportSize({ width: 1920, height: 1080 })
    const m = await page.evaluate(() => {
      const r = (el: Element | null) => el!.getBoundingClientRect()
      const wraps = [...document.querySelectorAll('.wrap')].map((w) => ({ l: r(w).left, r: r(w).right, w: r(w).width }))
      const grade = r(document.querySelector('.matriz'))
      return {
        janela: window.innerWidth,
        wraps,
        marca: r(document.querySelector('.topo .brand')).left,
        titulo: r(document.getElementById('titulo')).left,
        grade: { l: grade.left, r: grade.right },
        paleta: r(document.querySelector('[role="group"][aria-label="Paleta"]')).bottom,
        telaCheia: r(document.querySelector('.tela-cheia')).top,
      }
    })
    for (const w of m.wraps) {
      expect(w.w).toBeLessThanOrEqual(1200)
      expect(Math.abs(w.l - (m.janela - w.r))).toBeLessThanOrEqual(1)
      expect(Math.abs(w.l - m.wraps[0]!.l)).toBeLessThanOrEqual(1)
    }
    expect(Math.abs(m.marca - m.wraps[0]!.l)).toBeLessThanOrEqual(1)
    expect(Math.abs(m.titulo - m.wraps[0]!.l)).toBeLessThanOrEqual(1)
    expect(Math.abs(m.grade.l - (m.janela - m.grade.r))).toBeLessThanOrEqual(1)
    expect(m.telaCheia).toBeGreaterThanOrEqual(m.paleta)
  })

  test('hero: título em duas linhas', async ({ page }) => {
    const h1 = page.locator('h1#titulo')
    const texto = await h1.evaluate((el) => (el as HTMLElement).innerText)
    expect(texto).toBe('Design system mobile em React Native,\npronto para usar.')
    await expect(h1.locator('span')).toHaveText('pronto para usar')
    const cores = await h1.evaluate((el) => ({
      span: getComputedStyle(el.querySelector('span')!).color,
      raiz: getComputedStyle(document.documentElement).getPropertyValue('--site-primary').trim(),
    }))
    expect(cores.raiz).toBe('#e8650a')
    expect(cores.span).toBe('rgb(232, 101, 10)')
    if (page.viewportSize()!.width >= DESKTOP_MIN) {
      for (const tamanho of [{ width: 1280, height: 800 }, { width: 1440, height: 900 }]) {
        await page.setViewportSize(tamanho)
        const linhas = await h1.evaluate((el) => {
          const cs = getComputedStyle(el)
          return Math.round(el.getBoundingClientRect().height / parseFloat(cs.lineHeight))
        })
        expect(linhas, `linhas do título em ${tamanho.width}`).toBe(2)
      }
    }
  })

  test('sem violação séria ou crítica de acessibilidade', async ({ page }) => {
    await page.waitForLoadState('load')
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('.phone iframe')
      .analyze()
    expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([])
  })

  test('toda seção tem "Ver demo" e todo link interno responde 200 e existe como o Pages resolve', async ({ page, request }) => {
    const secoes = page.locator('main > section')
    const total = await secoes.count()
    expect(total).toBeGreaterThanOrEqual(8)
    for (let i = 0; i < total; i += 1) {
      await expect(secoes.nth(i).locator('a.ver-demo').first()).toBeAttached()
    }
    const origem = new URL(page.url()).origin
    const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href))
    const internos = [...new Set(hrefs.filter((h) => h.startsWith(origem)).map((h) => h.split('#')[0]!))]
    for (const href of internos) {
      const resposta = await request.get(href)
      expect(resposta.status(), href).toBe(200)
      // O `serve` responde `x/` com `x.html`; o GitHub Pages não. Confere a semântica do Pages no disco (achado B11).
      const caminho = decodeURIComponent(new URL(href).pathname).replace(/^\//, '')
      const noDisco = join(process.cwd(), '.pages', caminho)
      const existe =
        caminho.endsWith('/') || caminho === ''
          ? existsSync(join(noDisco, 'index.html'))
          : existsSync(`${noDisco}.html`) || existsSync(join(noDisco, 'index.html')) || existsSync(noDisco)
      expect(existe, `${href} não existe como o GitHub Pages resolve`).toBe(true)
    }
  })

  test('links que saem da página abrem em nova aba; os da própria demo ficam na mesma aba', async ({ page }) => {
    const origem = new URL(page.url()).origin
    const links = await page
      .locator('a[href]')
      .evaluateAll((as) => as.map((a) => ({ href: (a as HTMLAnchorElement).href, alvo: a.getAttribute('target'), rel: a.getAttribute('rel') })))
    for (const l of links.filter((x) => x.href.startsWith('http') && !x.href.startsWith(origem))) {
      expect(l.alvo, l.href).toBe('_blank')
      expect(l.rel ?? '', l.href).toContain('noopener')
    }
    for (const l of links.filter((x) => x.href.startsWith(origem))) {
      expect(l.alvo, l.href).toBeNull()
    }
  })

  test('nenhum texto público promete preço ou gratuidade futura', async ({ page }) => {
    const texto = (await page.locator('body').innerText()).toLowerCase()
    for (const proibido of ['sem versão paga', 'sempre gratuito', 'sem assinatura', 'grátis', 'para sempre']) {
      expect(texto, proibido).not.toContain(proibido)
    }
  })

  test('lightbox abre pela galeria e fecha com Esc', async ({ page }) => {
    await page.locator('#galeria button.thumb').first().click()
    const dialogo = page.getByRole('dialog')
    await expect(dialogo).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialogo).toBeHidden()
  })

  test('deep link ?imagem= abre o lightbox', async ({ page }) => {
    await page.goto('./?imagem=safira-home-mobile')
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('FAQ espelhada no JSON-LD', async ({ page }) => {
    const perguntas = await page.locator('#faq details summary').allTextContents()
    expect(perguntas.length).toBeGreaterThanOrEqual(4)
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents()
    const faq = ld
      .map((t) => JSON.parse(t) as { '@type'?: string; mainEntity?: Array<{ name: string }> })
      .find((j) => j['@type'] === 'FAQPage')
    expect(faq?.mainEntity?.map((q) => q.name)).toEqual(perguntas.map((p) => p.trim()))
  })
})
