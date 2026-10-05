// Mesmo desvio H3 dos demais scripts (achado B2 do Opus): `require` com cast estrutural local.
const { existsSync, readFileSync } = require('fs') as {
  existsSync: (caminho: string) => boolean
  readFileSync: (caminho: string, codificacao: 'utf8') => string
}
const { join } = require('path') as { join: (...partes: string[]) => string }

const readme = readFileSync(join(process.cwd(), 'README.md'), 'utf8')
const PAGINA = 'https://bsmagalhaes.github.io/rendra-ui-app/'

describe('README', () => {
  it('só cita a página e a demo do rendra-ui-app', () => {
    // Endereço antigo da vitrine, montado em duas partes para o `grep` do critério 1 (nenhum arquivo
    // do projeto cita o endereço antigo) não achar o próprio teste.
    const enderecoAntigo = `bsmagalhaes.github.io/${'rendra'}-app`
    expect(readme).not.toContain(enderecoAntigo)
    const urls = readme.match(/https:\/\/bsmagalhaes\.github\.io\/rendra-ui-app\/[^\s)"`]*/g) ?? []
    expect(urls.length).toBeGreaterThan(0)
    for (const url of urls) {
      expect(url).toMatch(/^https:\/\/bsmagalhaes\.github\.io\/rendra-ui-app\/(demo\/[^\s]*|\?imagem=[a-z0-9-]+)?$/)
    }
  })

  it('o primeiro link de "Veja funcionando" é a página de apresentação', () => {
    const trecho = readme.split(/Veja funcionando/i)[1] ?? ''
    const primeiro = trecho.match(/https:\/\/bsmagalhaes\.github\.io\/rendra-ui-app\/[^\s)"`]*/)?.[0]
    expect(primeiro).toBe(PAGINA)
  })

  it('as quatro imagens de destaque são de celular e todas existem', () => {
    const imagens = [...readme.matchAll(/docs\/images\/([a-z0-9-]+\.(?:webp|png|jpg))/g)].map((m) => m[1] as string)
    expect(imagens.length).toBeGreaterThanOrEqual(4)
    for (const nome of imagens.slice(0, 4)) expect(nome).toMatch(/-mobile\.(webp|png|jpg)$/)
    for (const nome of imagens) expect(existsSync(join(process.cwd(), 'docs', 'images', nome))).toBe(true)
  })

  it('documenta a geração das imagens e os testes da página e da demo', () => {
    expect(readme).toContain('npm run docs:images')
    expect(readme).toContain('npm run test:site')
    expect(readme).toContain('npm run test:demo')
  })

  it('o prefixo do export estático é o da demo, /rendra-ui-app/demo', () => {
    expect(readme).toContain('/rendra-ui-app/demo')
  })
})
