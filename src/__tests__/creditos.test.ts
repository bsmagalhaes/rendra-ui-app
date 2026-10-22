// eslint-disable-next-line @typescript-eslint/no-require-imports -- sem @types/node no tsconfig
const { existsSync, readFileSync } = require('fs') as {
  existsSync: (caminho: string) => boolean
  readFileSync: (caminho: string, codificacao: 'utf8') => string
}
// eslint-disable-next-line @typescript-eslint/no-require-imports -- sem @types/node no tsconfig
const path = require('path') as { join: (...partes: string[]) => string }

/*
 * Créditos do motion no README: quem desenhou as regras, a licença e o link de origem. As skills não
 * são commitadas (o Rendra não as redistribui), então não há NOTICE a manter: o aviso da Apache 2.0
 * (§4d) vale para quem redistribui a obra, e aqui há só a menção.
 */
const RAIZ = process.cwd()
const readme = readFileSync(path.join(RAIZ, 'README.md'), 'utf8')
const secao = readme.slice(readme.indexOf('## Créditos'))

describe('README: seção Créditos das ferramentas de movimento', () => {
  it('cita Emil Kowalski, a licença MIT e o repositório de origem', () => {
    expect(secao).toContain('Emil Kowalski')
    expect(secao).toMatch(/MIT/)
    expect(secao).toContain('https://github.com/emilkowalski/skills')
  })

  it('cita a Impeccable, a licença Apache 2.0 e o repositório de origem', () => {
    expect(secao).toContain('Impeccable')
    expect(secao).toMatch(/Apache 2\.0/)
    expect(secao).toContain('https://github.com/pbakaus/impeccable')
  })

  it('não inventa NOTICE nem linha de copyright de terceiros', () => {
    expect(existsSync(path.join(RAIZ, 'NOTICE'))).toBe(false)
    expect(secao).not.toMatch(/Copyright\s*(\(c\)|©)/i)
  })

  it('as skills ficam fora do repositório (.gitignore protege .claude) e o README não cita pastas privadas', () => {
    expect(readFileSync(path.join(RAIZ, '.gitignore'), 'utf8')).toMatch(/^\.claude\/$/m)
    expect(readme).not.toContain('docs/superpowers')
    expect(readme).not.toContain('processo/')
  })
})
