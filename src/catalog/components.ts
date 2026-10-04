/**
 * Catalogo de codigos de componente do Rendra App, paridade com o web
 * (`https://github.com/bsmagalhaes/rendra-ui-web`, `src/catalog/components.ts`).
 * O mesmo codigo significa o mesmo componente e a mesma variante em web e app (padrao dos
 * produtos Rendra, secao 4.5). `LIST-002` (lista reordenavel) entra junto do `onReorder`, na 1.4.0.
 */

export interface ComponentCatalogEntry {
  code: string
  name: string
  component: string
  file: string
  variantProps: Record<string, unknown>
  whenToUse: string
  isDefault?: true
}

export const COMPONENT_CODE_PATTERN = /^[A-Z]{3,4}-\d{3}$/

/** Arquivos internos que nunca ganham entrada no catalogo (nao sao componentes de UI publicos). */
export const CATALOG_EXCLUDED_FILES = [
  'components/internal/overlay-shell.tsx',
  'components/internal/picker-panel.tsx',
  'components/internal/bottom-sheet.tsx',
  'components/internal/text.tsx',
  'components/gradient/gradient.tsx',
  'components/ui/chat/channel-badge.tsx',
  'components/ui/document-viewer-fallback.tsx',
]

export const CATALOG: ComponentCatalogEntry[] = [
  { code: 'ACRN-001', name: 'Acordeão', component: 'Accordion', file: 'components/ui/accordion.tsx', variantProps: {}, whenToUse: 'Para agrupar conteúdo que a pessoa abre um de cada vez, como perguntas frequentes.' },
  { code: 'ACB-001', name: 'Barra de ação', component: 'ActionBar', file: 'components/ui/action-bar.tsx', variantProps: {}, whenToUse: 'Para os botões de salvar, cancelar e ações extras de um formulário, drawer ou modal.' },
  { code: 'ALRT-001', name: 'Alerta', component: 'Alert', file: 'components/ui/alert.tsx', variantProps: {}, whenToUse: 'Para um aviso de sucesso, erro, atenção ou informação dentro do corpo da tela.' },
  { code: 'AVT-001', name: 'Avatar', component: 'Avatar', file: 'components/ui/avatar.tsx', variantProps: {}, whenToUse: 'Para a foto ou as iniciais de uma pessoa.' },
  { code: 'AVT-002', name: 'Avatar em grupo', component: 'AvatarGroup', file: 'components/ui/avatar.tsx', variantProps: {}, whenToUse: 'Para mostrar várias pessoas sobrepostas, com contador do excedente.' },
  { code: 'BDG-001', name: 'Selo', component: 'Badge', file: 'components/ui/badge.tsx', variantProps: {}, whenToUse: 'Para marcar situação, categoria ou contagem curta ao lado de um texto.' },
  { code: 'BFI-001', name: 'Ícone de feedback da marca', component: 'BrandFeedbackIcon', file: 'components/ui/brand-feedback-icon.tsx', variantProps: {}, whenToUse: 'Para o símbolo da marca tingido pela cor semântica em toast, alerta e telas de status.' },
  { code: 'LOGO-001', name: 'Logotipo', component: 'BrandLogo', file: 'components/ui/brand-logo.tsx', variantProps: {}, whenToUse: 'Para o logotipo da marca na sidebar, no header ou no painel do login.' },
  { code: 'BTN-001', name: 'Botão primário', component: 'Button', file: 'components/ui/button.tsx', variantProps: { variant: 'primary' }, whenToUse: 'Para a ação principal da tela, do formulário ou da barra de ações.', isDefault: true },
  { code: 'BTN-002', name: 'Botão secundário', component: 'Button', file: 'components/ui/button.tsx', variantProps: { variant: 'secondary' }, whenToUse: 'Para uma segunda cor de destaque da marca, quando a primária já está em uso na tela.' },
  { code: 'BTN-003', name: 'Botão contornado', component: 'Button', file: 'components/ui/button.tsx', variantProps: { variant: 'outline' }, whenToUse: 'Para a ação de cancelar ou para ações secundárias ao lado de um botão primário.' },
  { code: 'BTN-004', name: 'Botão fantasma', component: 'Button', file: 'components/ui/button.tsx', variantProps: { variant: 'ghost' }, whenToUse: 'Para ações discretas dentro de cards, linhas de tabela e barras de ferramenta.' },
  { code: 'BTN-005', name: 'Botão destrutivo', component: 'Button', file: 'components/ui/button.tsx', variantProps: { variant: 'destructive' }, whenToUse: 'Para uma ação irreversível, como excluir ou encerrar.' },
  { code: 'BTN-006', name: 'Botão link', component: 'Button', file: 'components/ui/button.tsx', variantProps: { variant: 'link' }, whenToUse: 'Para uma ação com aparência de link de texto, dentro de uma frase ou de um rodapé.' },
  { code: 'BTNG-001', name: 'Grupo de botões', component: 'ButtonGroup', file: 'components/ui/button-group.tsx', variantProps: {}, whenToUse: 'Para botões encostados ou um controle segmentado de escolha única.' },
  { code: 'CAL-001', name: 'Calendário', component: 'Calendar', file: 'components/ui/calendar.tsx', variantProps: {}, whenToUse: 'Para agenda com visão de mês, semana, dia ou lista de eventos.' },
  { code: 'CARD-001', name: 'Card', component: 'Card', file: 'components/ui/card.tsx', variantProps: {}, whenToUse: 'Para agrupar conteúdo de página com borda e sem sombra pesada.' },
  { code: 'CHT-001', name: 'Gráfico de linha', component: 'Chart', file: 'components/ui/chart.tsx', variantProps: { type: 'line' }, whenToUse: 'Para mostrar a evolução de um valor ao longo do tempo.', isDefault: true },
  { code: 'CHT-002', name: 'Gráfico de barras', component: 'Chart', file: 'components/ui/chart.tsx', variantProps: { type: 'bar' }, whenToUse: 'Para comparar valores entre categorias.' },
  { code: 'CHT-003', name: 'Gráfico de área', component: 'Chart', file: 'components/ui/chart.tsx', variantProps: { type: 'area' }, whenToUse: 'Para mostrar volume acumulado ao longo do tempo.' },
  { code: 'CHT-004', name: 'Gráfico de pizza', component: 'Chart', file: 'components/ui/chart.tsx', variantProps: { type: 'pie' }, whenToUse: 'Para mostrar a proporção de poucas categorias dentro de um total.' },
  { code: 'CHT-005', name: 'Gráfico combinado', component: 'Chart', file: 'components/ui/chart.tsx', variantProps: { type: 'combo' }, whenToUse: 'Para juntar barras e linha no mesmo gráfico, como receita e meta.' },
  { code: 'CHT-006', name: 'Velocímetro de meta', component: 'Chart', file: 'components/ui/chart.tsx', variantProps: { type: 'gauge' }, whenToUse: 'Para o percentual de uma meta batida, com faixas de cor.' },
  { code: 'CHT-007', name: 'Funil', component: 'Chart', file: 'components/ui/chart.tsx', variantProps: { type: 'funnel' }, whenToUse: 'Para etapas que afunilam, com a conversão entre elas.' },
  { code: 'CHAT-001', name: 'Lista de conversas', component: 'ConversationList', file: 'components/ui/chat/conversation-list.tsx', variantProps: {}, whenToUse: 'Para a coluna de conversas do atendimento.' },
  { code: 'CHAT-002', name: 'Linha do tempo da conversa', component: 'ChatThread', file: 'components/ui/chat/chat-thread.tsx', variantProps: {}, whenToUse: 'Para o histórico de mensagens de uma conversa aberta.' },
  { code: 'CHAT-003', name: 'Campo de mensagem', component: 'ChatComposer', file: 'components/ui/chat/chat-composer.tsx', variantProps: {}, whenToUse: 'Para escrever, anexar e enviar uma mensagem no atendimento.' },
  { code: 'CHK-001', name: 'Caixa de seleção', component: 'Checkbox', file: 'components/ui/checkbox.tsx', variantProps: {}, whenToUse: 'Para uma escolha independente, ligada ou desligada (inclusive indeterminada).' },
  { code: 'CHK-002', name: 'Grupo de caixas de seleção', component: 'CheckboxGroup', file: 'components/ui/checkbox.tsx', variantProps: {}, whenToUse: 'Para uma lista de opções fixas com "selecionar todos".' },
  { code: 'DTP-001', name: 'Seletor de data', component: 'DatePicker', file: 'components/ui/date-picker.tsx', variantProps: {}, whenToUse: 'Para escolher uma data, um período ou um horário.' },
  { code: 'GAV-001', name: 'Gaveta', component: 'Drawer', file: 'components/ui/drawer.tsx', variantProps: {}, whenToUse: 'Para formulário ou detalhe de volume médio, até cerca de 12 campos.' },
  { code: 'DDM-001', name: 'Menu suspenso', component: 'DropdownMenuContent', file: 'components/ui/dropdown-menu.tsx', variantProps: {}, whenToUse: 'Para uma lista de ações ou opções que abre a partir de um botão ou de um item.' },
  { code: 'VAZ-001', name: 'Estado vazio', component: 'EmptyState', file: 'components/ui/empty-state.tsx', variantProps: {}, whenToUse: 'Para quando uma lista, busca ou seção não tem nenhum dado ainda.' },
  { code: 'ERRO-001', name: 'Tela de erro', component: 'ErrorPage', file: 'components/ui/error-page.tsx', variantProps: {}, whenToUse: 'Para página não encontrada (404) ou falha do lado do servidor (500).' },
  { code: 'FLD-001', name: 'Campo com rótulo e ajuda', component: 'Field', file: 'components/ui/field.tsx', variantProps: {}, whenToUse: 'Para envolver qualquer controle de formulário com rótulo, ajuda e erro.' },
  { code: 'FLD-002', name: 'Rótulo', component: 'Label', file: 'components/ui/field.tsx', variantProps: {}, whenToUse: 'Para um rótulo avulso, quando o Field completo não se aplica.' },
  { code: 'FORM-001', name: 'Formulário', component: 'Form', file: 'components/ui/form.tsx', variantProps: {}, whenToUse: 'Para envolver um formulário inteiro, ligado ao React Hook Form.' },
  { code: 'FORM-002', name: 'Seção de formulário', component: 'FormSection', file: 'components/ui/form.tsx', variantProps: {}, whenToUse: 'Para agrupar campos relacionados dentro de um card com título.' },
  { code: 'IMG-001', name: 'Visualizador de imagens', component: 'ImageViewer', file: 'components/ui/image-viewer.tsx', variantProps: {}, whenToUse: 'Para abrir uma ou mais imagens em tela cheia, com legenda e navegação.' },
  { code: 'INFO-001', name: 'Dica de informação', component: 'InfoHint', file: 'components/ui/info-hint.tsx', variantProps: {}, whenToUse: 'Para texto orientativo que não tem um título de tela, card ou seção ao lado.' },
  { code: 'CAMP-001', name: 'Campo de texto', component: 'Input', file: 'components/ui/input.tsx', variantProps: {}, whenToUse: 'Para texto, número, senha, telefone, moeda ou qualquer valor de uma linha.' },
  { code: 'KANB-001', name: 'Quadro kanban', component: 'Kanban', file: 'components/ui/kanban.tsx', variantProps: {}, whenToUse: 'Para um funil de etapas com cartões que se movem entre colunas.', isDefault: true },
  { code: 'KANB-002', name: 'Quadro kanban com destinos de arraste', component: 'Kanban', file: 'components/ui/kanban.tsx', variantProps: { hasDropTargets: true }, whenToUse: 'Quando o card pode ir para uma ação além de outra coluna (ex.: "Marcar como ganho"), mostrada no menu "Mover para".' },
  { code: 'LIST-001', name: 'Lista', component: 'List', file: 'components/ui/list.tsx', variantProps: {}, whenToUse: 'Para linhas simples com início, título, descrição e fim, navegáveis ou não.', isDefault: true },
  { code: 'LIST-002', name: 'Lista reordenável', component: 'List', file: 'components/ui/list.tsx', variantProps: { sortable: true }, whenToUse: 'Quando a pessoa pode mudar a ordem das linhas, por arraste ou pelo menu Mover. Escreva com a prop `onReorder` (`sortable` é só a chave interna deste catálogo, não é prop da List).' },
  { code: 'MOD-001', name: 'Modal de confirmação', component: 'Modal', file: 'components/ui/modal.tsx', variantProps: { type: 'confirm' }, whenToUse: 'Para confirmar uma ação com uma principal e uma de cancelar; type="destructive" usa o mesmo código, porque só muda a cor.', isDefault: true },
  { code: 'MOD-002', name: 'Modal de formulário', component: 'Modal', file: 'components/ui/modal.tsx', variantProps: { type: 'form' }, whenToUse: 'Para um formulário de até 3 campos simples, sem sair da tela atual.' },
  { code: 'MOD-003', name: 'Modal informativo', component: 'Modal', file: 'components/ui/modal.tsx', variantProps: { type: 'info' }, whenToUse: 'Para só informar algo, sem decisão a tomar: um botão só, de largura total, que fecha o modal.' },
  { code: 'OTP-001', name: 'Código de verificação', component: 'OtpInput', file: 'components/ui/otp-input.tsx', variantProps: {}, whenToUse: 'Para confirmar um código enviado por SMS ou e-mail (2FA).' },
  { code: 'PROG-001', name: 'Barra de progresso', component: 'Progress', file: 'components/ui/progress.tsx', variantProps: {}, whenToUse: 'Para o andamento de uma tarefa ou de um envio.' },
  { code: 'RDO-001', name: 'Opções em lista', component: 'RadioGroup', file: 'components/ui/radio-group.tsx', variantProps: { variant: 'list' }, whenToUse: 'Para poucas opções simples, uma escolha só, em lista com bolinha e texto.', isDefault: true },
  { code: 'RDO-002', name: 'Opções em cartões', component: 'RadioGroup', file: 'components/ui/radio-group.tsx', variantProps: { variant: 'cards' }, whenToUse: 'Para opções com ícone e descrição, quando cada uma merece mais destaque.' },
  { code: 'RTG-001', name: 'Avaliação em estrelas', component: 'Rating', file: 'components/ui/rating.tsx', variantProps: { variant: 'stars' }, whenToUse: 'Para uma nota rápida de satisfação, em estrelas.', isDefault: true },
  { code: 'RTG-002', name: 'Avaliação em escala', component: 'Rating', file: 'components/ui/rating.tsx', variantProps: { variant: 'scale' }, whenToUse: 'Para uma nota de 0 a 10 (NPS e pesquisas parecidas), com rótulo nas pontas.' },
  { code: 'CKLT-001', name: 'Lista de verificação', component: 'Checklist', file: 'components/ui/checklist.tsx', variantProps: {}, whenToUse: 'Para uma lista de itens que a pessoa cria, renomeia, marca e remove.' },
  { code: 'PAG-001', name: 'Paginação', component: 'Pagination', file: 'components/ui/pagination.tsx', variantProps: {}, whenToUse: 'Para navegar entre páginas de uma listagem.' },
  { code: 'DTB-001', name: 'Barra de ferramentas da listagem', component: 'DataToolbar', file: 'components/ui/data-toolbar.tsx', variantProps: {}, whenToUse: 'Para busca, filtros, ordenação e a ação Novo, sempre dentro do card da listagem.' },
  { code: 'TAB-001', name: 'Tabela', component: 'Table', file: 'components/ui/table.tsx', variantProps: {}, whenToUse: 'Para qualquer listagem de registros, com busca, filtros e paginação, em lista de cards.' },
  { code: 'WIZ-002', name: 'Indicador de etapas', component: 'Stepper', file: 'components/ui/wizard.tsx', variantProps: {}, whenToUse: 'Para mostrar o progresso em etapas por conta própria, sem o Wizard inteiro.' },
  { code: 'WIZ-001', name: 'Wizard', component: 'Wizard', file: 'components/ui/wizard.tsx', variantProps: {}, whenToUse: 'Para um cadastro longo dividido em etapas, com validação por etapa.' },
  { code: 'CRED-001', name: 'Crédito Feito com Rendra', component: 'RendraCredit', file: 'components/ui/rendra-credit.tsx', variantProps: {}, whenToUse: 'No rodapé da tela de login, discreto; pode ser removido (credit={false}) ou levado para outro lugar visível, como uma tela Sobre.' },
  { code: 'DOC-001', name: 'Visualizador de documentos', component: 'DocumentViewer', file: 'components/ui/document-viewer.tsx', variantProps: {}, whenToUse: 'Para abrir um PDF (contrato, nota fiscal, comprovante) sem sair da tela.' },
  { code: 'RTE-001', name: 'Editor de texto rico', component: 'RichTextEditor', file: 'components/ui/rich-text-editor.tsx', variantProps: {}, whenToUse: 'Para conteúdo com formatação, listas e imagens, como a descrição de um artigo.' },
  { code: 'SEL-001', name: 'Select', component: 'Select', file: 'components/ui/select.tsx', variantProps: {}, whenToUse: 'Para escolher uma ou mais opções de uma lista, com ou sem busca.' },
  { code: 'SEP-001', name: 'Separador', component: 'Separator', file: 'components/ui/separator.tsx', variantProps: {}, whenToUse: 'Para dividir conteúdo dentro de um card, no lugar de um card dentro de card.' },
  { code: 'SKEL-001', name: 'Esqueleto de carregamento', component: 'Skeleton', file: 'components/ui/skeleton.tsx', variantProps: {}, whenToUse: 'Para o estado de carregamento, com a mesma estrutura do conteúdo final.' },
  { code: 'SLD-001', name: 'Slider', component: 'Slider', file: 'components/ui/slider.tsx', variantProps: {}, whenToUse: 'Para escolher um número ou uma faixa dentro de um intervalo, arrastando.' },
  { code: 'SPIN-001', name: 'Indicador de carregamento', component: 'Spinner', file: 'components/ui/spinner.tsx', variantProps: {}, whenToUse: 'Para um carregamento breve dentro de um botão, campo ou lista, sem barra de progresso.' },
  { code: 'STAT-001', name: 'Card de indicador', component: 'StatCard', file: 'components/ui/stat-card.tsx', variantProps: {}, whenToUse: 'Para um número de destaque com variação, num painel ou dashboard.' },
  { code: 'SWT-001', name: 'Switch', component: 'Switch', file: 'components/ui/switch.tsx', variantProps: {}, whenToUse: 'Para ligar ou desligar uma opção com efeito imediato.' },
  { code: 'ABA-001', name: 'Abas em linha', component: 'Tabs', file: 'components/ui/tabs.tsx', variantProps: { variant: 'line' }, whenToUse: 'Padrão para dividir o conteúdo de uma tela em seções, com sublinhado na aba ativa.', isDefault: true },
  { code: 'ABA-002', name: 'Abas em pílula', component: 'Tabs', file: 'components/ui/tabs.tsx', variantProps: { variant: 'pill' }, whenToUse: 'Quando as abas precisam de mais destaque visual, como pílulas sobre fundo suave.' },
  { code: 'TXT-001', name: 'Área de texto', component: 'Textarea', file: 'components/ui/textarea.tsx', variantProps: {}, whenToUse: 'Para texto longo, com contador de caracteres opcional.' },
  { code: 'TLN-001', name: 'Linha do tempo', component: 'Timeline', file: 'components/ui/timeline.tsx', variantProps: {}, whenToUse: 'Para uma sequência de eventos em ordem, cada um com um tom semântico.' },
  { code: 'TST-001', name: 'Toast', component: 'toast', file: 'components/ui/toast.tsx', variantProps: {}, whenToUse: 'Para uma confirmação rápida depois de uma ação, sem interromper a tela.' },
]

export function getCatalogEntry(code: string): ComponentCatalogEntry | undefined {
  return CATALOG.find((entry) => entry.code === code)
}

export function catalogByComponent(component: string): ComponentCatalogEntry[] {
  return CATALOG.filter((entry) => entry.component === component)
}

/**
 * Acha o codigo cujo `variantProps` (nao vazio) casa com as props recebidas; sem casar nenhum,
 * devolve o `isDefault` do componente ou, na falta dele, o primeiro codigo cadastrado. Lanca
 * quando o componente nao tem nenhuma entrada no catalogo, igual ao contrato do web (item M1 do
 * veredito do Fable da Sincronizacao 1: quebra versionada na 1.0.0, ver CHANGELOG.md; antes
 * devolvia `undefined`, nunca chamado por um componente sem catalogo nos usos reais do pacote).
 */
export function resolveCatalogCode(component: string, props: Record<string, unknown> = {}): string {
  const entries = catalogByComponent(component)
  if (entries.length === 0) {
    throw new Error(`Catálogo: nenhum código cadastrado para o componente "${component}".`)
  }
  const match = entries.find(
    (entry) =>
      Object.keys(entry.variantProps).length > 0 &&
      Object.entries(entry.variantProps).every(([key, value]) => props[key] === value)
  )
  if (match) return match.code
  return (entries.find((entry) => entry.isDefault) ?? entries[0])!.code
}

export function findDuplicateCodes(catalog: ComponentCatalogEntry[] = CATALOG): string[] {
  const seen = new Set<string>()
  const duplicated = new Set<string>()
  for (const entry of catalog) {
    if (seen.has(entry.code)) duplicated.add(entry.code)
    seen.add(entry.code)
  }
  return [...duplicated]
}

export function findInvalidFormatCodes(catalog: ComponentCatalogEntry[] = CATALOG): string[] {
  return catalog.filter((entry) => !COMPONENT_CODE_PATTERN.test(entry.code)).map((entry) => entry.code)
}

const PRESET_CODE_PATTERN = /[TCMN]\d+/

/** Nenhum codigo de componente pode colidir com os codigos de modelo (`T1`, `C4`, `M5`...). */
export function findPresetCollisions(catalog: ComponentCatalogEntry[] = CATALOG): string[] {
  return catalog.filter((entry) => PRESET_CODE_PATTERN.test(entry.code)).map((entry) => entry.code)
}

export function filesMissingCatalogEntry(realFiles: string[], catalog: ComponentCatalogEntry[] = CATALOG): string[] {
  const cataloged = new Set(catalog.map((entry) => entry.file))
  return realFiles.filter((file) => !cataloged.has(file) && !CATALOG_EXCLUDED_FILES.includes(file))
}

export function findComponentsWithoutDefault(catalog: ComponentCatalogEntry[] = CATALOG): string[] {
  const byComponent = new Map<string, ComponentCatalogEntry[]>()
  for (const entry of catalog) {
    byComponent.set(entry.component, [...(byComponent.get(entry.component) ?? []), entry])
  }
  const semPadrao: string[] = []
  for (const [component, entries] of byComponent) {
    if (entries.length > 1 && !entries.some((entry) => entry.isDefault)) semPadrao.push(component)
  }
  return semPadrao
}

export function findComponentsWithMultipleDefaults(catalog: ComponentCatalogEntry[] = CATALOG): string[] {
  const byComponent = new Map<string, ComponentCatalogEntry[]>()
  for (const entry of catalog) {
    byComponent.set(entry.component, [...(byComponent.get(entry.component) ?? []), entry])
  }
  const comMaisDeUm: string[] = []
  for (const [component, entries] of byComponent) {
    if (entries.filter((entry) => entry.isDefault).length > 1) comMaisDeUm.push(component)
  }
  return comMaisDeUm
}

export function assertCatalogIntegrity(catalog: ComponentCatalogEntry[] = CATALOG): void {
  const duplicados = findDuplicateCodes(catalog)
  if (duplicados.length > 0) throw new Error(`Codigo de componente duplicado: ${duplicados.join(', ')}`)

  const colisoes = findPresetCollisions(catalog)
  if (colisoes.length > 0) throw new Error(`Codigo de componente colide com codigo de modelo: ${colisoes.join(', ')}`)

  const invalidos = findInvalidFormatCodes(catalog)
  if (invalidos.length > 0) throw new Error(`Codigo de componente fora do formato: ${invalidos.join(', ')}`)

  const semPadrao = findComponentsWithoutDefault(catalog)
  if (semPadrao.length > 0) throw new Error(`Componente com mais de uma variante sem isDefault: ${semPadrao.join(', ')}`)

  const comMaisDeUm = findComponentsWithMultipleDefaults(catalog)
  if (comMaisDeUm.length > 0) throw new Error(`Componente com mais de um isDefault: ${comMaisDeUm.join(', ')}`)
}
