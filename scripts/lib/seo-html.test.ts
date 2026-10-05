import { applyRouteSeo } from './seo-html'

const fixture = '<html  lang="en"><head><meta charset="utf-8"/><title data-rh="true"></title></head><body><div id="root"></div></body></html>'

describe('applyRouteSeo', () => {
  it('troca o title vazio (mesmo com atributos) pelo titulo da rota', () => {
    const saida = applyRouteSeo({
      html: fixture,
      title: 'Componentes · Rendra App',
      description: 'Vitrine dos 43 componentes de UI do Rendra App.',
      url: 'https://bsmagalhaes.github.io/rendra-ui-app/componentes',
      siteName: 'Rendra App',
      ogImageUrl: 'https://bsmagalhaes.github.io/rendra-ui-app/og-image.jpg',
    })
    expect(saida).toContain('<title>Componentes · Rendra App</title>')
    expect(saida).not.toContain('data-rh')
  })

  it('injeta description, canonical, robots de indexacao e og antes de </head>', () => {
    const saida = applyRouteSeo({
      html: fixture, title: 't', description: 'd'.repeat(60),
      url: 'https://bsmagalhaes.github.io/rendra-ui-app/componentes',
      siteName: 'Rendra App',
      ogImageUrl: 'https://bsmagalhaes.github.io/rendra-ui-app/og-image.jpg',
    })
    expect(saida).toContain('name="description" content="' + 'd'.repeat(60) + '"')
    expect(saida).toContain('rel="canonical" href="https://bsmagalhaes.github.io/rendra-ui-app/componentes"')
    expect(saida).toContain('name="robots" content="index, follow"')
    expect(saida.match(/name="robots" content="index, follow"/g)).toHaveLength(1)
    expect(saida).toContain('property="og:image" content="https://bsmagalhaes.github.io/rendra-ui-app/og-image.jpg"')
    expect(saida).toContain('property="og:locale" content="pt_BR"')
  })

  it('rota nao indexavel usa robots noindex,nofollow no lugar de index,follow', () => {
    const saida = applyRouteSeo({
      html: fixture, title: 't', description: 'd'.repeat(60),
      url: 'https://bsmagalhaes.github.io/rendra-ui-app/_sitemap',
      siteName: 'Rendra App',
      ogImageUrl: 'https://bsmagalhaes.github.io/rendra-ui-app/og-image.jpg',
      indexable: false,
    })
    expect(saida).toContain('name="robots" content="noindex, nofollow"')
  })

  it('troca a tag html por <html lang="pt-BR">', () => {
    const saida = applyRouteSeo({
      html: fixture, title: 't', description: 'd'.repeat(60),
      url: 'https://bsmagalhaes.github.io/rendra-ui-app/',
      siteName: 'Rendra App',
      ogImageUrl: 'https://bsmagalhaes.github.io/rendra-ui-app/og-image.jpg',
    })
    expect(saida).toContain('<html lang="pt-BR">')
  })

  it('escapa & em title e description (escapeAttr)', () => {
    const saida = applyRouteSeo({
      html: fixture, title: 'A & B', description: 'd'.repeat(58) + ' & X',
      url: 'https://bsmagalhaes.github.io/rendra-ui-app/',
      siteName: 'Rendra App',
      ogImageUrl: 'https://bsmagalhaes.github.io/rendra-ui-app/og-image.jpg',
    })
    expect(saida).toContain('<title>A &amp; B</title>')
    expect(saida).toContain('name="description" content="' + 'd'.repeat(58) + ' &amp; X"')
  })

  it('aplicar duas vezes deixa so um bloco de SEO (idempotente)', () => {
    const entrada = {
      html: fixture,
      title: 't',
      description: 'd'.repeat(60),
      url: 'https://bsmagalhaes.github.io/rendra-ui-app/',
      siteName: 'Rendra App',
      ogImageUrl: 'https://bsmagalhaes.github.io/rendra-ui-app/og-image.jpg',
    }
    const primeira = applyRouteSeo(entrada)
    const segunda = applyRouteSeo({ ...entrada, html: primeira })
    expect(segunda.match(/rel="canonical"/g) ?? []).toHaveLength(1)
    expect(segunda.match(/name="description"/g) ?? []).toHaveLength(1)
    expect(segunda.match(/name="robots"/g) ?? []).toHaveLength(1)
  })
})
