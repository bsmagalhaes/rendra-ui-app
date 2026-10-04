import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { semSplash } from './splash'

// List reordenável (LIST-002): arraste real com o mouse na alça, setas do teclado com o foco no
// mesmo item, região viva e menu Mover, na vitrine e na tela de tarefas. Só nos projetos T1-C1
// (script `test:demo`); toque mínimo e axe da lista reordenável já rodam na matriz completa de
// `layout.spec.ts` e `a11y.spec.ts`, que cobrem `/componentes/exibicao` e `/tarefas`.

async function abrir(page: Page, rota: string) {
  await page.goto(`${rota}?codigo=T1-C1`)
  await page.getByTestId('rendra-T1-C1').waitFor()
  await semSplash(page)
}

async function ordem(page: Page): Promise<string[]> {
  return page.getByRole('button', { name: /^Reordenar / }).evaluateAll((nos) => nos.map((no) => (no.getAttribute('aria-label') ?? '').replace('Reordenar ', '')))
}

test('vitrine: arrastar a alça com o mouse troca a ordem ao soltar', async ({ page }) => {
  await abrir(page, 'componentes/exibicao')
  const alca = page.getByRole('button', { name: 'Reordenar Ana Souza' })
  await alca.scrollIntoViewIfNeeded()
  expect(await ordem(page)).toEqual(['Ana Souza', 'Bruno Lima', 'Carla Dias'])
  // Correção 3 do parecer: a alça tem de segurar o gesto (sem rolar a página pelo toque).
  expect(await alca.evaluate((no) => getComputedStyle(no).touchAction)).toBe('none')
  const caixa = (await alca.boundingBox())!
  const x = caixa.x + caixa.width / 2
  const y = caixa.y + caixa.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x, y + 40, { steps: 5 })
  // Durante o arraste a ordem ainda é a antiga (só a prévia mexe); onReorder só ao soltar.
  expect(await ordem(page)).toEqual(['Ana Souza', 'Bruno Lima', 'Carla Dias'])
  await page.mouse.move(x, y + 300, { steps: 15 })
  await page.mouse.up()
  await expect.poll(() => ordem(page)).toEqual(['Bruno Lima', 'Carla Dias', 'Ana Souza'])
  await expect(page.getByTestId('list-live')).toHaveText('Ana Souza, posição 3 de 3')
  // Região viva só no web (correção 8): o nó existe com aria-live polite.
  await expect(page.getByTestId('list-live')).toHaveAttribute('aria-live', 'polite')
})

test('vitrine: setas com a alça focada movem o mesmo item e o foco acompanha', async ({ page }) => {
  await abrir(page, 'componentes/exibicao')
  const alca = page.getByRole('button', { name: 'Reordenar Ana Souza' })
  await alca.scrollIntoViewIfNeeded()
  await alca.focus()
  await page.keyboard.press('ArrowDown')
  await expect.poll(() => ordem(page)).toEqual(['Bruno Lima', 'Ana Souza', 'Carla Dias'])
  await expect(page.getByRole('button', { name: 'Reordenar Ana Souza' })).toBeFocused()
  await expect(page.getByTestId('list-live')).toHaveText('Ana Souza, posição 2 de 3')
  // Segunda seta seguida: o mesmo item desce mais uma posição e o foco segue nele (correção 7).
  await page.keyboard.press('ArrowDown')
  await expect.poll(() => ordem(page)).toEqual(['Bruno Lima', 'Carla Dias', 'Ana Souza'])
  await expect(page.getByRole('button', { name: 'Reordenar Ana Souza' })).toBeFocused()
  await expect(page.getByTestId('list-live')).toHaveText('Ana Souza, posição 3 de 3')
  // Na borda a seta não faz nada.
  await page.keyboard.press('ArrowDown')
  expect(await ordem(page)).toEqual(['Bruno Lima', 'Carla Dias', 'Ana Souza'])
  await page.keyboard.press('ArrowUp')
  await expect.poll(() => ordem(page)).toEqual(['Bruno Lima', 'Ana Souza', 'Carla Dias'])
  await expect(page.getByRole('button', { name: 'Reordenar Ana Souza' })).toBeFocused()
})

test('vitrine: o menu Mover para baixo troca a ordem', async ({ page }) => {
  await abrir(page, 'componentes/exibicao')
  await page.getByRole('button', { name: 'Mover Bruno Lima' }).scrollIntoViewIfNeeded()
  await page.getByRole('button', { name: 'Mover Bruno Lima' }).click()
  await page.getByRole('menuitem', { name: 'Mover para baixo' }).click()
  await expect.poll(() => ordem(page)).toEqual(['Ana Souza', 'Carla Dias', 'Bruno Lima'])
})

test('tarefas: o menu Mover para baixo troca a ordem e a busca desliga o reordenar', async ({ page }) => {
  await abrir(page, 'tarefas')
  const primeira = 'Enviar proposta para a Padaria Estrela'
  const segunda = 'Renovar contrato da Clínica Aurora'
  await expect(page.getByRole('button', { name: `Reordenar ${primeira}` })).toBeVisible()
  await page.getByRole('button', { name: `Mover ${primeira}` }).click()
  await page.getByRole('menuitem', { name: 'Mover para baixo' }).click()
  await expect.poll(async () => (await ordem(page)).slice(0, 2)).toEqual([segunda, primeira])
  await page.getByLabel('Buscar tarefa').fill('Padaria')
  await expect(page.getByRole('button', { name: /^Reordenar / })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^Mover / })).toHaveCount(0)
  await page.getByLabel('Buscar tarefa').fill('')
  await expect.poll(async () => (await ordem(page)).slice(0, 2)).toEqual([segunda, primeira])
})
