import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { blockingViolations } from '../src/lib/axe-false-positives'
import { clients } from '../src/mocks/clients'
import { MODAL_CARD, waitForFullOpacity } from './helpers'
import { semSplash } from './splash'

// Fluxos com interação da demonstração: só nos projetos T1-C1, claro e escuro (o filtro vem do
// script `test:demo`, C3). As rotas em repouso já estão na matriz completa de `layout` e `a11y`.

async function abrir(page: import('@playwright/test').Page, rota: string) {
  await page.goto(`${rota}${rota.includes('?') ? '&' : '?'}codigo=T1-C1`)
  await page.getByTestId('rendra-T1-C1').waitFor()
  await semSplash(page)
}

// As abas do atendimento e do funil viram um `Select` quando não cabem na largura (360 px): o
// helper abre a aba pelo controle que a página tiver (mesmo padrão de `abrirSecao`, layout.spec).
async function abrirAba(page: import('@playwright/test').Page, rotulo: string, aba: string, opcao: string) {
  const seletor = page.getByRole('combobox', { name: rotulo })
  if ((await seletor.count()) > 0) {
    await seletor.click()
    await page.getByText(opcao, { exact: true }).last().click()
  } else {
    await page.getByRole('tab', { name: aba, exact: true }).click()
  }
}

test('login, verificação em duas etapas e painel', async ({ page }) => {
  await abrir(page, 'login')
  await page.getByLabel('E-mail', { exact: true }).fill('ana@exemplo.com.br')
  // D11: "Senha" também casa o botão "Mostrar senha" (aria-label); a busca é exata.
  await page.getByLabel('Senha', { exact: true }).fill('segredo123')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/verificacao/)
  // D3: o grupo "Código de verificação" é uma div; o texto entra pela primeira caixa.
  await page.getByLabel('Dígito 1 de 6', { exact: true }).fill('000000')
  await expect(page.getByText('Código inválido. Tente novamente.')).toBeVisible()
  await page.getByLabel('Dígito 1 de 6', { exact: true }).fill('123456')
  await expect(page).toHaveURL(/\/painel/)
  await expect(page.getByText('Bem-vindo de volta')).toBeVisible()
})

test('esqueci a senha, verificação, nova senha e volta ao login', async ({ page }) => {
  await abrir(page, 'esqueci-senha')
  await page.getByLabel('E-mail', { exact: true }).fill('ana@exemplo.com.br')
  await page.getByRole('button', { name: 'Enviar código' }).click()
  await expect(page).toHaveURL(/\/verificacao\?origem=senha/)
  await page.getByLabel('Dígito 1 de 6', { exact: true }).fill('123456')
  await expect(page).toHaveURL(/\/nova-senha/)
  await page.getByLabel('Nova senha', { exact: true }).fill('Abcdef12!')
  await expect(page.getByText('Força da senha: forte')).toBeVisible()
  await page.getByLabel('Confirmar senha', { exact: true }).fill('Abcdef12!')
  await page.getByRole('button', { name: 'Salvar nova senha' }).click()
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByText('Senha alterada com sucesso')).toBeVisible()
})

test('Sair no menu do usuário volta ao login', async ({ page }) => {
  await abrir(page, 'painel')
  await page.getByRole('button', { name: 'Menu de Ana Ribeiro' }).click()
  await page.getByRole('menuitem', { name: 'Sair' }).click()
  await expect(page).toHaveURL(/\/login/)
})

test('exclusão de cliente abre o modal, já visível por completo', async ({ page }) => {
  await abrir(page, 'clientes')
  await page.getByRole('button', { name: `Ações de ${clients[0]!.nome}` }).click()
  await page.getByRole('menuitem', { name: 'Excluir' }).click()
  // C4: o cartão anima por um ancestral; `toHaveCSS('opacity', '1')` no cartão não afirma nada.
  await waitForFullOpacity(page, MODAL_CARD)
  await expect(page.getByText('Excluir cliente?')).toBeVisible()
  const resultados = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const graves = blockingViolations(resultados.violations)
  expect(graves, JSON.stringify(graves, null, 2)).toEqual([])
  await page.getByRole('button', { name: 'Confirmar exclusão' }).click()
  await expect(page.getByText('Cliente excluído')).toBeVisible()
  await expect(page.getByText(clients[0]!.nome, { exact: true })).toHaveCount(0)
})

test('o Novo cliente do painel abre o drawer e salva', async ({ page }) => {
  await abrir(page, 'painel')
  await page.getByRole('button', { name: 'Novo cliente' }).click()
  await page.getByLabel('Razão social', { exact: true }).fill('Padaria Estrela Ltda')
  await page.getByLabel('E-mail', { exact: true }).fill('contato@exemplo.com.br')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByText('Cliente cadastrado (simulado)')).toBeVisible()
})

test('cadastro guiado: quatro etapas até concluir', async ({ page }) => {
  await abrir(page, 'cadastro')
  await expect(page.getByText('Etapa 1 de 4')).toBeVisible()
  await page.getByLabel('Razão social', { exact: true }).fill('Padaria Estrela Ltda')
  await page.getByLabel('CNPJ', { exact: true }).fill('11222333000181')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByLabel('Nome do contato', { exact: true }).fill('Ana Ribeiro')
  await page.getByLabel('E-mail', { exact: true }).fill('ana@exemplo.com.br')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('radio', { name: /^Profissional/ }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByText('Etapa 4 de 4')).toBeVisible()
  await page.getByRole('button', { name: 'Concluir cadastro' }).click()
  await expect(page).toHaveURL(/\/clientes/)
  await expect(page.getByText('Cadastro concluído (simulado)')).toBeVisible()
})

test('tarefas: selecionar e concluir', async ({ page }) => {
  await abrir(page, 'tarefas')
  await page.getByRole('checkbox', { name: /^Selecionar Enviar proposta/ }).click()
  await expect(page.getByText('Selecionadas: 1')).toBeVisible()
  await page.getByRole('button', { name: 'Concluir selecionadas' }).click()
  await expect(page.getByText('Selecionadas: 0')).toBeVisible()
  await expect(page.getByText('Tarefa concluída')).toBeVisible()
})

test('configurações: encerrar sessões só depois de confirmar', async ({ page }) => {
  await abrir(page, 'configuracoes')
  const seletor = page.getByRole('combobox', { name: 'Seção' })
  if ((await seletor.count()) > 0) {
    await seletor.click()
    await page.getByText('Segurança', { exact: true }).last().click()
  } else {
    await page.getByRole('tab', { name: 'Segurança', exact: true }).click()
  }
  await page.getByRole('button', { name: 'Encerrar sessões' }).click()
  await waitForFullOpacity(page, MODAL_CARD)
  await expect(page.getByText('Encerrar todas as sessões?')).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar encerramento' }).click()
  await expect(page.getByText('Sessões encerradas (simulado)')).toBeVisible()
})

// P4: cada fluxo recomeça do zero (o estado da demonstração só vive na página), então são independentes.
test('atendimento: abrir a conversa do Carlos, enviar uma mensagem e ver a bolha', async ({ page }) => {
  await abrir(page, 'atendimento')
  await abrirAba(page, 'Etapa do atendimento', 'Atendimento 2 não lidas', 'Atendimento (2)')
  await page.getByRole('button', { name: /Carlos Dias/ }).click()
  await expect(page).toHaveURL(/\/atendimento\/t2/)
  await page.getByLabel('Mensagem', { exact: true }).fill('Posso ajudar em algo mais?')
  await page.getByRole('button', { name: 'Enviar', exact: true }).click()
  await expect(page.getByText('Posso ajudar em algo mais?')).toBeVisible()
})

test('funil: mover o card Padaria Estrela para Qualificado', async ({ page }) => {
  await abrir(page, 'kanban')
  await page.getByRole('button', { name: 'Ações do card Padaria Estrela' }).click()
  await page.getByRole('menuitem', { name: 'Qualificado' }).click()
  await expect(page.getByText('Padaria Estrela', { exact: true })).toHaveCount(0)
  await abrirAba(page, 'Colunas', 'Qualificado 2', 'Qualificado (2)')
  await expect(page.getByText('Padaria Estrela', { exact: true })).toBeVisible()
})

test('agenda: criar um evento e vê-lo na lista do dia', async ({ page }) => {
  await abrir(page, 'agenda')
  await page.getByRole('button', { name: 'Novo evento neste dia' }).click()
  await page.getByLabel('Título do evento', { exact: true }).fill('Visita ao cliente')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByText('Visita ao cliente', { exact: true })).toBeVisible()
})

// R1 (validação da entrega): no web o <input> de cada caixa do código tem min-width automático e
// só 1 das 6 cabia no celular. O teste mede as seis caixas dentro do viewport.
for (const largura of [390, 360]) {
  test(`verificação: as seis caixas do código cabem em ${largura}px`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: 800 })
    await abrir(page, 'verificacao')
    const caixas = page.getByRole('textbox', { name: /Dígito \d de 6/ })
    await expect(caixas).toHaveCount(6)
    for (let i = 0; i < 6; i++) {
      const box = (await caixas.nth(i).boundingBox())!
      expect(box.x, `caixa ${i + 1}, início`).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width, `caixa ${i + 1}, fim`).toBeLessThanOrEqual(largura)
      expect(box.width, `caixa ${i + 1}, largura`).toBeGreaterThanOrEqual(44)
    }
  })
}

test('vitrine: as seis caixas do OtpInput cabem em 390px', async ({ page }) => {
  await page.goto('componentes/formulario?codigo=T1-C1')
  await page.getByTestId('rendra-T1-C1').waitFor()
  await semSplash(page)
  const grupo = page.locator('[data-rendra="OTP-001"]').first()
  const caixas = grupo.getByRole('textbox')
  await expect(caixas).toHaveCount(6)
  for (let i = 0; i < 6; i++) {
    const box = (await caixas.nth(i).boundingBox())!
    expect(box.x + box.width, `caixa ${i + 1}`).toBeLessThanOrEqual(390)
  }
})

// R2: o nome do cliente precisa estar no cabeçalho do shell também quando o detalhe é alcançado
// por navegação (antes só na carga direta; pela lista o cabeçalho dizia "Clientes").
test('detalhe alcançado pela lista mostra o nome do cliente no cabeçalho', async ({ page }) => {
  await abrir(page, 'clientes')
  await page.getByRole('link', { name: new RegExp(clients[1]!.nome) }).click()
  await expect(page).toHaveURL(/\/clientes\/1001/)
  await expect(page.getByTestId('shell-cabecalho').last()).toContainText(clients[1]!.nome)
})

test('detalhe alcançado pelo painel mostra o nome do cliente no cabeçalho', async ({ page }) => {
  await abrir(page, 'painel')
  await page.getByRole('link', { name: new RegExp(clients[2]!.nome) }).first().click()
  await expect(page).toHaveURL(/\/clientes\/1002/)
  await expect(page.getByTestId('shell-cabecalho').last()).toContainText(clients[2]!.nome)
})

test('voltar do detalhe à lista devolve o título Clientes', async ({ page }) => {
  await abrir(page, 'clientes')
  await page.getByRole('link', { name: new RegExp(clients[1]!.nome) }).click()
  await expect(page.getByTestId('shell-cabecalho').last()).toContainText(clients[1]!.nome)
  await page.goBack()
  await expect(page).toHaveURL(/\/clientes(\?[^/]*)?$/)
  await expect(page.getByTestId('shell-cabecalho').last()).toContainText('Clientes')
})

// R3: a contagem regressiva é texto, não rótulo de botão (estourava a pílula do cancel).
test('verificação: a contagem do reenvio é um texto e cabe na tela', async ({ page }) => {
  await abrir(page, 'verificacao')
  const contagem = page.getByText(/Reenviar em \d+ s/)
  await expect(contagem).toBeVisible()
  await expect(page.getByRole('button', { name: /Reenviar em/ })).toHaveCount(0)
  const box = (await contagem.boundingBox())!
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width)
})
