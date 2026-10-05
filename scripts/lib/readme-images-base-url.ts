/**
 * Defeito M1 do veredito Fable sobre o pacote npm: `scripts/readme-images.ts` fixava `BASE_URL` em
 * `http://localhost:4173/rendra-ui-app`, enquanto `pages:stage`/`app.json` do clone (`clean-clone`,
 * achado B16) trocam o caminho para `/${nome}`; `npm run docs:images` do clone esperava
 * `/rendra-ui-app` responder 200 e nunca respondia, estourando em 30s.
 *
 * Deriva o caminho de `experiments.baseUrl` do `app.json` (a mesma fonte que `pages:stage`
 * usa), com `SITE_URL`/`BASE_URL` do ambiente continuando a vencer quando informado, para
 * funcionar sem ajuste manual tanto neste repositório quanto em qualquer clone.
 */
export function resolveBaseUrl(experimentsBaseUrl: string | undefined, envBaseUrl?: string, porta = '4173'): string {
  if (envBaseUrl) return envBaseUrl
  return `http://localhost:${porta}${experimentsBaseUrl ?? ''}`
}
