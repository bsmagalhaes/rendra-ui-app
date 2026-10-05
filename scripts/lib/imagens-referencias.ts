/**
 * Referências às capturas de `docs/images`: cada imagem sai no formato mais leve (WebP ou PNG, regra 9
 * do guarda-chuva), então a extensão varia por imagem e as páginas que a citam precisam acompanhar.
 */

const CITACAO = /((?:docs\/)?images\/)([a-z0-9-]+)\.(webp|png|jpg)/g

/** Troca a extensão de cada imagem citada (`images/x.webp`) pela do arquivo gravado e reescreve o mapa da galeria. */
export function reescreverReferencias(texto: string, formatos: Record<string, string>): string {
  const comMapa = texto.replace(/\/\*formatos\*\/\{.*?\}\/\*fim\*\//, () => `/*formatos*/${JSON.stringify(formatos)}/*fim*/`)
  return comMapa.replace(CITACAO, (inteiro, prefixo: string, nome: string) => (formatos[nome] ? `${prefixo}${nome}.${formatos[nome]}` : inteiro))
}

/** Nome com extensão de cada imagem de `images/` citada no texto (sem a de og-image). */
export function nomesCitados(texto: string): string[] {
  return [...texto.matchAll(CITACAO)].map((m) => `${m[2]}.${m[3]}`)
}

/** `{ nome: extensão }` dos arquivos `.webp` e `.png` de uma lista de nomes. */
export function extensoesDe(arquivos: string[]): Record<string, string> {
  const saida: Record<string, string> = {}
  for (const arquivo of arquivos) {
    const m = arquivo.match(/^(.+)\.(webp|png|jpg)$/)
    if (m) saida[m[1]!] = m[2]!
  }
  return saida
}
