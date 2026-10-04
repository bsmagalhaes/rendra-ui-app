# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [Não lançado]

## [1.4.0] - 04/10/2026

Versão aditiva sobre a 1.3.0: 75 códigos no catálogo (a `List` ganha o código `LIST-002` quando reordenável). Mudança só aditiva: nenhuma API pública existente foi removida, renomeada ou teve a assinatura alterada; sem `onReorder` a `List` é a mesma de antes.

### Adicionado

- `List.onReorder` e `List.itemLabel`: lista reordenável, com paridade com o web. Cada linha ganha uma alça de arraste (`Reordenar X`) e um botão `Mover X` com o menu "Mover para cima" e "Mover para baixo", fora da área tocável da linha. `onReorder` recebe a lista nova uma vez só, ao soltar (ou a cada movimento do menu, das ações de acessibilidade e das setas). `itemLabel` dá o nome falado de cada linha quando o título não basta. `onReorder` recebe só as linhas passadas em `items`: com busca ou filtro ativo, a tela deve mapear o resultado de volta para a lista completa ou desligar a reordenação (`onReorder={undefined}`, como faz a tela de tarefas da demo), senão as linhas ocultas se perdem.
- Código `LIST-002` no catálogo para a `List` reordenável; `LIST-001` segue valendo sem `onReorder`.
- Arraste na alça: o gesto vence a rolagem da página, o item levantado acompanha o dedo, os vizinhos abrem espaço, e a rolagem automática na borda funciona quando a `List` é rolável (`scrollEnabled`).
- Acessibilidade: ações `moveUp` e `moveDown` na alça (TalkBack e VoiceOver) e anúncio "X, posição N de M" a cada movimento. No web, setas para cima e para baixo com a alça focada movem a linha, o foco volta à alça do item movido e uma região viva (`aria-live="polite"`) repete o anúncio.
- Em linha reordenável com `leading` ou `trailing`, o título e a descrição ocupam uma linha própria, de largura inteira (o título pode ir a duas linhas), e os controles ficam na linha de baixo, para o texto continuar legível em telas estreitas.
- Vitrine: a `List` de exemplo é reordenável. Tela de tarefas da demo: reordenar pela alça e pelo menu Mover (só sem busca ativa; nada é gravado).
- Declaração de `onKeyDown` nos tipos de `View` do app (usada pelas setas no web).
- Não provado em aparelho: iOS (VoiceOver e disputa com a rolagem do `UIScrollView`), TalkBack e a rolagem automática no aparelho (não há tela de exemplo com `List` rolável; provada só em testes).
- Simulação dos dois leigos aprovada em 04/10/2026 (Regra um, item 7): começar um app novo e migrar um app existente, nos três perfis de IA (com terminal e agentes, com terminal sem agentes, chat sem terminal), com a `List` reordenável (`onReorder`, `itemLabel`; arraste, menu Mover e, no web, setas do teclado) alcançada a partir do link, sem lacuna bloqueadora.

### Alterado

- Capturas de `docs/images` agora em WebP otimizado (o menor entre sem perda e com perda, com alfa preservado), referenciadas em `docs/index.html`, na galeria `?imagem=` e no `README.md`; `docs/og-image.png` continua PNG, recomprimido sem perda. `npm run docs:images` grava nesses formatos (novo `devDependency` `sharp`) e `docs:images:check` lê o tamanho de WebP.

## [1.3.0] - 02/10/2026

Versão aditiva sobre a 1.2.0: 64 componentes de UI, com os sete da Sincronização 2. Mudança só aditiva: nenhuma API pública existente foi removida, renomeada ou teve a assinatura alterada.

### Adicionado

- `DatePicker.clearable`: botão "Limpar data" ao lado do gatilho, na forma simples e no `range`; só aparece com valor e fora de `disabled`.
- `AppShell.notifications`: sino de notificações no cabeçalho do shell, que abre a lista numa folha inferior. Tipos `ShellNotificationItem` e `ShellNotificationsConfig`. A lista é copiada uma vez, na montagem, e tocar num item o marca como lido sem fechar a folha. Sem a prop, o shell fica igual ao de antes.
- `Rating` (`RTG-001` e `RTG-002`): avaliação em estrelas ou em escala numérica.
- `Checklist` (`CKLT-001`): lista de itens que se marcam, renomeiam, adicionam e removem.
- `Pagination` (`PAG-001`): anterior e próxima com "Página X de Y", ou "Carregar mais".
- `DataToolbar` (`DTB-001`): busca, filtros e ordenação numa gaveta em tela cheia, chips dos filtros e ação principal.
- `Table` (`TAB-001`): dados em lista de cards, com busca, ordenação, seleção, ações por linha, estados de carga, erro e vazio, e paginação. Sem dependência nova.
- `Stepper` (`WIZ-002`) e `Wizard` (`WIZ-001`): indicador de etapas e fluxo em etapas com validação, Voltar e Avançar.
- Vitrine com 57 entradas: `Rating` e `Checklist` em Formulário, `Stepper` e `Wizard` em Exibição, `Pagination`, `DataToolbar` e `Table` em Dados. O exemplo do `DatePicker` passou a usar `clearable`.
- Simulação dos dois leigos aprovada em 02/10/2026 (Regra um, item 7): começar um app novo e migrar um app existente, nos três perfis de IA (com terminal e agentes, com terminal sem agentes, chat sem terminal), com os sete componentes da Sincronização 2, o `DatePicker.clearable` e o sino do `AppShell` alcançados a partir do link, sem lacuna bloqueadora.

### Diferenças de plataforma (mantidas por decisão)

- `List.onReorder` e `itemLabel`, `AppShell.quickActions`, `RepeatableField`, `ColorPicker`, `QrCode`, `ImageCropper`, `Breadcrumb`, `Popover`, `Tooltip`, `Upload` e `WidgetGrid` seguem fora do app. `NavItem.badge` continua `string`.
- `Pagination` não traz "Itens por página", números de página nem "X a Y de Z" (só existem no desktop do web).
- `Table` não tem modo remoto (`source`), `density`, `width`, `align`, `lines` nem a barra de seleção fixa no rodapé; a barra de seleção é em linha, acima da lista. Quem precisa de servidor controla `data`, `loading`, `error` e `pageSize` por fora. Os cards são montados com `View` e `map`, sem `List` nem `FlatList` (desvio da letra de "sobre o `List`", decidido no parecer do plano: `List` segue intocado e a tabela vive dentro da rolagem da página).
- `Wizard` não é controlável (a etapa atual nasce em 0 e só muda por dentro) e não tem `orientation`; `Stepper` não tem `orientation` nem `onStepClick`. Uma `onValidateStep` que rejeita deixa a etapa marcada com erro.
- `Checklist` não põe foco automático no item novo (o `Input` do app não expõe foco) e o item marcado vira texto riscado no lugar do campo.
- `DataToolbar` não tem `selectionBar`, menu "Colunas" nem popover de filtros.

## [1.2.0] - 02/10/2026

Terceira versão sobre a 1.1.0 (ainda não publicada no npm): 57 componentes de UI, com os oito da F3. Mudança aditiva: nenhuma API pública existente foi removida ou renomeada; `a11yPresets` e `systemColors` só ganharam chaves.

### Adicionado

- Demo do app simulado (bloco P3): login com aviso de demonstração e regra de senha, verificação em duas etapas, esqueci a senha, nova senha com medidor de força, criar conta, lista de clientes (busca, filtros, paginação, exclusão), detalhe do cliente com quatro abas, novo cliente com máscaras e buscas fictícias, cadastro guiado em quatro etapas, tarefas com seleção em massa, configurações em seis seções, painel com período e cadastro rápido em gaveta, e tela de erro 500. Dados de exemplo determinísticos em `src/mocks`, sem componente novo no pacote. O menu de exemplo ganhou Clientes, Cadastros e Tarefas, e "Sair" volta ao login.
- Cinco capturas de celular novas (clientes, detalhe, cadastro guiado, verificação e tarefas) na página de apresentação e no README.
- Página de apresentação do Rendra App na raiz do GitHub Pages (`https://bsmagalhaes.github.io/rendra-ui-app/`): hero com o app rodando num celular, matriz dos 12 códigos de modelo e paleta, componentes, telas, prompts para IA, instalação, galeria com ampliação e perguntas frequentes. Identidade visual da família Rendra (tema escuro), `docs/index.html` sem dependência nem fonte externa.
- `npm run pages:stage` monta a árvore do Pages (`scripts/pages-stage.ts`): página na raiz e demo em `/demo/`, com `sitemap.xml`, `robots.txt`, `llms.txt` e um `404.html` que leva endereços antigos (fora de `/demo/`) para dentro da demo.
- `npm run test:site` (Playwright e axe sobre a página) e `npm run test:demo` (a demo em `/demo/` mantém o prefixo ao navegar e ao voltar).
- `npm run docs:images:check`: confere que toda captura é de celular em pé e que a `og-image.png` tem 1200x630.
- `robots.txt` libera de forma explícita os robôs de busca e de resposta de IA (`OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`, `Perplexity-User`).
- Demo completa (bloco P4): Atendimento (`/atendimento`, conversas por etapa URA/IA, Fila, Atendimento e Encerrado, busca, filtro por canal e a conversa em `/atendimento/[id]` com responder, reagir, editar, excluir, anexos e mensagens rápidas; a conversa da fila pede "Assumir atendimento"), Agenda (`/agenda`, mês, dia e lista, detalhe do evento e novo evento) e Funil comercial (`/kanban`, cards por etapa que se movem pelo menu). Tickets, cards e eventos vivem em stores da demo (`src/demo`), então não lidas zeradas, card movido e evento novo sobrevivem à navegação.
- Ligações entre as telas: "Enviar ao funil" no menu da tarefa, "Conversar" no detalhe do cliente que tem conversa, selo de não lidas em Atendimento no menu. Painel com dois gráficos (receita e meta, clientes por segmento) e atividade em `Timeline`; aba Atividade do cliente em `Timeline`.
- Quatro capturas novas (atendimento, agenda, funil e painel no escuro) e as telas novas na página e no README.
- `Chart` (`CHT-001` a `CHT-007`: linha, barras, área, pizza, combinado, velocímetro de meta e funil), pelo subcaminho `@rendra-ui/app/chart`, que traz o `d3-shape` só para quem o importa. Seleção por toque com aviso em voz, cores dos tokens do tema e o velocímetro como `meter` acessível.
- `Timeline` (`TLN-001`): linha do tempo vertical.
- `Calendar` (`CAL-001`): mês, semana, dia e agenda, com grade de horas de 48 px por hora, evento de dia inteiro e linha de agora.
- `Kanban` (`KANB-001` e `KANB-002`): colunas com contador e limite, movimento de card por menu (sem arrastar), paginação por coluna e, em tela estreita, colunas em abas.
- `ImageViewer` (`IMG-001`): galeria em tela cheia com pinça, arraste e navegação circular.
- Chat de atendimento: `ConversationList` (`CHAT-001`), `ChatThread` (`CHAT-002`) e `ChatComposer` (`CHAT-003`), mais o selo `ChannelBadge` e `chatChannels` (dez canais, sem logotipos de terceiros). Responder, reagir, editar e excluir mensagem, anexos, mensagens rápidas e emoji. A gravação de áudio é simulada: só o cronômetro e a duração em `audioSeconds`, sem pulso animado e sem captura real do microfone.
- `RichTextEditor` (`RTE-001`), pelo subcaminho `@rendra-ui/app/rich-text-editor`: editor visual no celular (Tiptap num WebView, pelo `@10play/tentap-editor`) e modo HTML no navegador. `onImageUpload` devolve o endereço público da imagem (no celular não há `File`; no web a função recebe um `File`). Ficam de fora alinhamento, tabela, linha divisória e limpar formatação.
- `DocumentViewer` (`DOC-001`), pelo subcaminho `@rendra-ui/app/document-viewer`: PDF dentro do app no iOS; no Android e no navegador, abre no aplicativo de PDF.
- Peer opcional `react-native-webview` (`>=13.16.0`), exigido só por `RichTextEditor` e `DocumentViewer`.
- Vitrine com 50 entradas: grupos novos Dados (2) e Planejamento (5), mais o editor em Formulário e o documento em Exibição; mocks determinísticos em `src/mocks`.
- `verify:pack` confere os três subcaminhos novos, os arquivos `.web.js` do editor e do visualizador, e que o bundle web não arrasta o WebView nativo.

### Alterado

- A demo passa a viver em `https://bsmagalhaes.github.io/rendra-ui-app/demo/` (`experiments.baseUrl` = `/rendra-ui-app/demo`); os endereços antigos, como `/rendra-ui-app/componentes`, levam à demo pelo `404.html` da raiz.
- Capturas do README e da página passam a ser de celular (390 px, escala 3, com moldura de aparelho em CSS puro), 20 imagens geradas por script, incluindo a matriz dos 12 códigos de modelo e paleta; as capturas largas de 1920x1080 saem. A `og-image.png` (1200x630) é composta por HTML com dois aparelhos.
- `clean:clone` não herda a página de apresentação, o subcaminho `/demo/` nem os testes da página; o `docs:images` do clone continua funcionando e gera a `og-image.png` sem a marca Rendra.
- O painel de exemplo deixa de aceitar `?cliente=`: as linhas de clientes recentes levam ao detalhe do cliente.
- Menu de exemplo: Atendimento, Agenda e Funil entram no grupo Geral, depois de Tarefas. `buildNavigation` recebe também o total de não lidas.
- Dados de exemplo: a receita de setembro de 2026 é a mesma nos indicadores e no gráfico, e o gráfico por segmento usa só os segmentos da carteira. A página de apresentação passa a dizer 57 componentes.
- SEO da demo: `/atendimento`, `/agenda` e `/kanban` indexáveis; as páginas de conversa (`atendimento/t1` a `t3`) saem com `noindex`.
- `Select` múltiplo: a linha "Selecionar todos" aparece sozinha com mais de 5 opções (todas as mostradas, incluindo desabilitadas e de qualquer grupo), sem passar `selectAll`. `selectAll={false}` desliga; com 5 opções ou menos continua opt-in por `selectAll`. A linha é uma só e alterna: vira "Desmarcar todos" quando todas as opções habilitadas estão marcadas. Mudança de comportamento visível sem quebra de API: quem não quer a linha em listas longas passa `selectAll={false}`.
- `DESIGN_RULES.md`: a lista fechada de exceções R3 ganha `calendar.tsx`, `image-viewer.tsx` e `chat-composer.tsx`, com os campos de `style` que cada um pode usar.
- Contagens da documentação: 57 componentes de UI e 50 entradas de vitrine.

### Corrigido

- `OtpInput`: no web só uma das seis caixas do código cabia na tela do celular (o `<input>` de cada caixa não encolhia); a caixa ganha `min-w-0` e as seis cabem em 360 px e em 390 px.
- `PageHeader` dentro do `AppShell`: numa tela com título dinâmico alcançada por navegação (por exemplo o detalhe de um cliente aberto pela lista), o cabeçalho mostrava o título da tela de origem; a tela passa a adotar a rota nova logo depois de montar.

### Pendente

- Simulação dos dois leigos aprovada em 02/10/2026 (Regra um, item 7): começar um app novo e migrar um app existente, nos três perfis de IA (com terminal e agentes, com terminal sem agentes, chat sem terminal), com os oito componentes da F3, o Select e as telas do P4 alcançados a partir do link, sem lacuna bloqueadora.
- Verificação em aparelho (Tarefa 8.3): gesto do `ImageViewer` no Android real, gesto e teclado do Chat, e o editor visual no Expo Go.

## [1.1.0] - 29/09/2026

Segunda versão sobre a base da 1.0.0: navegação do app pronta (`AppShell`), telas base, home e abertura animada, num total de 49 componentes de UI (os 44 anteriores mais `RendraCredit`, `ErrorPage`, `AuthLayout`, `AppShell` e `RendraSplash`). Mudança aditiva: nenhuma API pública existente foi removida ou renomeada.

### Adicionado

- `RendraCredit` (`CRED-001`): crédito discreto "Feito com Rendra", ligado por padrão e removível com `credit={false}`; texto e link substituíveis; exportado pela entrada principal do pacote e registrado no catálogo de códigos.
- Códigos de navegação `N1` a `N3` (`navCodes`, tipo `NavCode`): terceira parte do código de modelo (`T#-C#-N#`), lida por `parseModelCode` e devolvida por `formatModelCode`. `N1` barra inferior com menu em gaveta, `N2` barra inferior com menu em folha, `N3` só gaveta.
- `RendraNavigationValue` ganha `goBack?` e `canGoBack?` (campos opcionais); `RendraRouterBridge` os alimenta com `router.back()` e `router.canGoBack()`. Sem provider, `goBack` lança o mesmo erro de `navigate` e `canGoBack` responde `false`.
- `AppShell` (`src/components/app-shell`, exportado com `ShellProvider`, `ShellContext`, `useShell`, `defaultShellLayout`, `layoutOptions` e as funções puras de navegação): cabeçalho com título da tela, seta de voltar e menu do usuário; barra inferior de navegação rápida com botão central de menu; menu em gaveta lateral (`N1`, `N3`) ou folha inferior (`N2`); layout escolhido pelo código `?codigo=T#-C#-N#` ou pelo `applyLayout`, gravado em `AsyncStorage` (`rendra:shell-layout`, desligável por `userConfigurable={false}`). Só `navigation` é obrigatório; nunca importa o roteador, usa `useRendraNavigation()`.
- `AuthLayout` (`src/components/layout`): moldura pública de entrada, com painel de marca (único degradê), título, descrição, link de voltar (`back`), rodapé e o crédito `RendraCredit` ligado por padrão (`credit`, `creditText`, `creditHref`).
- `ErrorPage` (`ERRO-001`): página de erro `404` ou `500`, com títulos e textos em pt-BR, botão de voltar (sem histórico, leva à raiz) e `fullScreen` para ocupar a tela; registrada no catálogo de códigos.
- `RendraSplash`: overlay animado de abertura (Reanimated), que respeita "reduzir movimento", some sozinho por `onFinished` e é exportado pela entrada principal do pacote; o boilerplate o liga ao splash nativo em `app/_layout.tsx` (o pacote não depende de `expo-splash-screen`).
- Telas de exemplo do boilerplate: home (`/`, apresenta o projeto, os 3 modelos e as 4 paletas, com troca ao vivo), `/login` (formulário com validação e crédito), `/painel` (indicadores, lista de clientes e atividade, dentro do shell), `/configuracoes` (aparência, layout do menu e perfil, dentro do shell) e a página 404 (`+not-found`). As três primeiras entram no SEO (título, descrição, canonical, `sitemap.xml`).
- Splash nativo neutro em `app.json` (`expo-splash-screen`, fundo claro e escuro) para o Expo Go e as builds, sem quadro em branco antes do overlay.

### Alterado

- Briefing guiado para qualquer IA: modelo reescrito, `AGENTS.md` com condução e ramo sem terminal, teste que amarra o briefing ao catálogo, aos modelos e às paletas.
- `PageHeader` e `ActionBar` reconhecem o `AppShell` (dentro dele o `PageHeader` não soma o inset superior e leva título e ajuda em texto ao cabeçalho; o `ActionBar` fixo não soma o inset inferior quando há barra inferior). Fora do shell o comportamento é o de sempre.
- Rotas da vitrine (`/componentes`, `/tokens`, `/galeria`) agora ficam no grupo `app/(shell)/`, sem mudar as URLs; a raiz de rotas deixou de ter `SafeAreaView` (o inset superior é do cabeçalho do shell). O export estático grava também cópias em `dist/(shell)/`, marcadas `noindex`.
- `defaultModelCode` passa de `'T1-C1'` para `'T1-C1-N1'`; `parseModelCode('T1-C1')` continua válido (a parte `N` é opcional).
- `Input variant="secret"` com `clearable`: o botão "Limpar campo" passa a olhar o que foi digitado nesta edição (antes aparecia com base no `value` do consumidor, o valor salvo) e esvazia o campo; o valor salvo continua nunca chegando ao campo.
- A rota `/` deixa de redirecionar para `/componentes` e passa a ser a home; home, login e a página 404 ficam fora do `AppShell`, em tela cheia, cada uma com o próprio `SafeAreaView`.
- Publicação por trusted publishing do npm (`publish.yml` sem `NPM_TOKEN`, com `id-token`, `--provenance` e conferência do npm 11.5.1 ou mais recente no runner), o mesmo modelo do Rendra web; os portões antes de publicar continuam.
- Divergência registrada com o design system web: o catálogo do app acusa colisão de código de componente com `[TCMN]\d+` (o web para em `[TCM]\d+`), porque o `N` é exclusivo do app.
- Endereço novo: o repositório passa de `bsmagalhaes/rendra-app` para `bsmagalhaes/rendra-ui-app` e a vitrine de `https://bsmagalhaes.github.io/rendra-app/` para `https://bsmagalhaes.github.io/rendra-ui-app/` (o GitHub Pages não redireciona: links antigos da vitrine dão 404). O design system web passa a ser citado como `bsmagalhaes/rendra-ui-web`. O nome do pacote npm (`@rendra-ui/app`) não muda. Quem clonou o repositório pode atualizar com `git remote set-url origin https://github.com/bsmagalhaes/rendra-ui-app.git`.

### Conhecido

- Com o `AppShell` e a barra inferior ligada, o `Toaster` (montado na raiz, fora do shell) aparece sobre a barra inferior; ele soma só o inset inferior do aparelho. Quem precisar do toast acima da barra deve envolvê-lo com o próprio deslocamento.
- `?codigo=T#-C#-N#` não vale na página 404: o Expo Router não entrega a busca à rota `+not-found`. Nas demais rotas o código continua lido normalmente.

### Validação

- Simulação dos dois leigos aprovada em 30/09/2026 (Regra um, item 7): começar um app novo e migrar um app existente, nos três perfis de IA (com terminal e agentes, com terminal sem agentes, chat sem terminal), sem lacuna bloqueadora.

## [1.0.0] - 28/09/2026

Sincronização 1 com o design system web (levantamento do Fable, web `fb19143`, app `afd6be0`; validação do plano pelo Opus). Renomear uma variável `--rendra-*` é sempre mudança major (padrão dos produtos Rendra, seção 5.6); como a 0.3.0 já está publicada no npm, a 1.0.0 é a próxima versão de verdade, com o guia de migração abaixo para quem já instalou o pacote.

### Adicionado

- Catálogo de códigos de componente (`src/catalog/components.ts`), com a mesma interface e as mesmas funções do design system web: 47 entradas (os 34 componentes catalogáveis do app, incluindo `SPIN-001`/`Spinner`; `LIST-002`, lista reordenável, fica para quando `onReorder` entrar), exportado pela entrada principal do pacote (`CATALOG`, `resolveCatalogCode`, `getCatalogEntry`, `catalogByComponent`, tipo `ComponentCatalogEntry`).
- `Spinner` (`SPIN-001`): indicador de carregamento único do sistema, giro por Reanimated parado no reduce motion, decorativo sem `label` e anunciado (`role="status"`) com `label`; extraído do giro que antes vivia solto dentro de `Button`. Entrada de vitrine no grupo Feedback de `/componentes`.
- `Input` ganha unidades embutidas (`units`, `unit`, `onUnitChange`, `percentMax`): seletor à direita no mesmo padrão do seletor de DDI; trocar de unidade sempre limpa o valor; `percentMask(max)` em `src/lib/masks.ts` (teto configurável, padrão 100).
- `Input` ganha `variant="secret"` (`hasValue`, `maskedHint`, `isEditing`, `onStartEdit`, `onCancelEdit`, `onRemove`, `removing`): modo leitura com texto mascarado e botões "Trocar"/"Remover"; modo edição sempre com campo vazio (o valor salvo nunca chega a existir no campo).
- `List` ganha `ListItem.tone` (`'success' | 'warning' | 'error' | 'neutral'`): selo textual (`Badge`) antes do `trailing`, nunca só cor.
- Selo do código do catálogo ao lado do título de cada exemplo na vitrine `/componentes`.
- Tokens de rótulo e orientação do campo (`--rendra-label-color`, `--rendra-help-color`, `fontSize.label`/`fontSize.help`, `colors['label-foreground']`/`colors['help-foreground']`), com teste de contraste AA nas 4 paletas, claro e escuro.
- `BrandConfig.labelStyle` (`'discreto'` padrão, `'normal'` opcional), exposto por `useBrand()` e refletido em `dataSet.label` na raiz do `BrandProvider` (chega ao export web como `data-label`).
- `dataSet.rendra` (`data-rendra` no export web) na raiz dos 34 componentes catalogáveis, lido de `resolveCatalogCode` nos componentes com variante (`Button`, `Modal`, `Tabs`, `RadioGroup`); `Card` ganha o campo interno `code` (usado por `FormSection`/`STAT-001`); `InfoHint` ganha raiz `View` própria (antes um fragmento); `BrandProvider` completa o `dataSet` da raiz com `rendraRoot`, `brand`, `shape` e `palette` (`data-rendra-root` no export web).
- `check:rules` ganha as regras R14 (variável do tema referenciada sem o prefixo `--rendra-`) e R15 (texto orientativo fora do limite do `span`, ou com verbo de instrução, nas telas de `app/`), com fixtures que comprovam os dois lados de cada regra.

### Alterado

- Raio do modelo Equilíbrio (T2) de 10px para 8px, igual ao design system web (fórmulas por papel inalteradas: control raio-2, item raio-4, surface raio, block raio-4, avatar 9999px; Safira e Aurora sem mudança).
- `Label` troca de classe fixa por `labelStyle` (discreto: `text-label text-label-foreground uppercase`; normal: `text-sm text-foreground`), com código `FLD-002`.
- `Field`: mensagem de ajuda troca de `text-muted-foreground` para `text-help text-help-foreground` (mesmos números de `text-xs`, nome semântico do contrato); código `FLD-001` na raiz. A cor do erro continua `text-destructive-soft-foreground` (divergência pré-existente contra o web, registrada, não corrigida nesta sincronização).
- `OtpInput` usa `gap-1` sempre (era `gap-2`), garantindo 44px por caixa a 360px dentro de um `Card`; código `OTP-001`.
- `Button`, `Select` e `Input` (busca de CEP/CNPJ) passam a usar o `Spinner` no lugar de um `Loader2 animate-spin` solto e giro manual próprio.

### Quebras e guia de migração

- Toda variável própria do tema ganha o prefixo `--rendra-`: as chaves de `Palette.light`/`Palette.dark` (devolvidas por `createPalette`), de `buildThemeVars()` e de `useBrand().themeVars` mudam de nome (por exemplo, `'--primary'` vira `'--rendra-primary'`).
- `themeColorString(vars, '--muted-foreground')` vira `themeColorString(vars, '--rendra-muted-foreground')`: o segundo argumento (a chave) também precisa do prefixo.
- O preset do Tailwind/NativeWind (`@rendra-ui/app/tailwind-preset`) passa a resolver `var(--rendra-*)`; CSS próprio de quem consome o pacote e lia `var(--primary)` direto no seu próprio stylesheet precisa acrescentar o prefixo.
- Classes JSX (`bg-primary`, `rounded-control`, `text-muted-foreground`) **não mudam**: a tradução para o nome prefixado acontece só dentro do preset, nunca no código de quem consome.
- `npm run check:rules` (regra R14) passa a acusar toda variável própria do tema citada sem o prefixo `--rendra-`, para quem esquecer algum lugar.
- Nota: `--radius-control`/`-item`/`-surface`/`-block`/`-avatar` foram renomeadas para `--rendra-shape-control`/`-item`/`-surface`/`-block`/`-avatar` (mesmo nome do design system web), no mesmo commit do prefixo; as fórmulas por papel não mudaram, só o nome.
- `resolveCatalogCode(component, props)` passa a lançar (`throw`) quando o componente não tem nenhuma entrada no catálogo, igual ao design system web, em vez de devolver `undefined`; o tipo de retorno muda de `string | undefined` para `string`. Quem chamava a função esperando `undefined` como valor de erro precisa envolver a chamada num `try/catch` (ou conferir o componente antes, com `catalogByComponent(component).length > 0`).

### Pendente

- Simulação dos dois leigos: pendente da validação da entrega (a simulação aprovada em 27/09/2026, registrada na versão 0.3.0, não cobre a 1.0.0; `verify:pack -- --publicacao` exige a frase por versão).

## [0.3.0] - 27/09/2026

### Alterado

- `@rendra-ui/app` vira um pacote npm de verdade (padrão dos produtos Rendra, seção 5): `exports` com `.`, `./router-bridge`, `./fonts` e `./tailwind-preset`; `peerDependencies` reais (`react`, `react-native`, `expo`, `nativewind`, `react-native-reanimated`, `react-native-gesture-handler`, `react-native-safe-area-context`, `react-native-svg`, `@react-native-async-storage/async-storage`, `tailwindcss`, `expo-status-bar`, mais `expo-font`/`react-native-web` opcionais; `expo-status-bar` é peer obrigatório, não opcional, porque `ThemedStatusBar` o importa sem checagem na entrada principal); `sideEffects` com os três arquivos que chamam `cssInterop` no topo; `expo-router` sai de `dependencies` (fica só em `devDependencies`, nunca publicado como dependência do pacote).
- `expo-router` isolado do núcleo em `src/router-bridge.tsx` (subcaminho `./router-bridge`): nenhum outro arquivo de `src/` importa o roteador direto; `List` usa `linkComponent`/`navigate` do novo contexto de navegação (`src/navigation/rendra-navigation.tsx`).
- `ModelCodeFromUrl` sai do barrel `src/brand/index.ts` e passa a ser exportado só por `./router-bridge` (única assinatura pública alterada neste lote; continua documentado em `docs/COMO_APLICAR.md`).
- `BrandProvider` aceita `brands`/`brand` opcional, com um padrão interno mínimo derivado dos 3 modelos, sem a marca de demonstração da vitrine (`children` continua obrigatório).
- `src/index.ts` (entrada principal do pacote) e `src/theme/tailwind-preset.ts` (preset do Tailwind/NativeWind, também consumido por `tailwind.config.ts` da raiz).
- `build:lib` (`npm run build:lib`) gera `dist-lib/` com o cabeçalho de autoria em cada arquivo, com `jsxImportSource: nativewind` (o `className` dos componentes chega ao runtime do NativeWind em quem instala).
- `verify:pack` (`npm run verify:pack`) empacota o `package.json` real (`npm pack`, tarball de verdade, nunca `--dry-run`), instala o tarball num projeto temporário e renderiza um componente de verdade (com hook) a partir do `dist-lib/` instalado, nunca do fonte.
- CI roda `build:lib` e `verify:pack` em todo push/PR; workflow `publish.yml` publica por tag (`v*`), com procedência (`--provenance`), só no repositório oficial.
- Regra um ("o link basta", padrão dos produtos Rendra, seção 1): `AGENTS.md` ganha o fluxo de início com os três ramos (dentro do repositório, projeto novo, migração) e o "Passo 2" (tipo de trabalho); os demais arquivos de agente (`CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, `.cursor/rules/rendra.mdc`, `.windsurfrules`) passam a só resumir e apontar para o `AGENTS.md`, com o mesmo bloco de verificação provado igual por teste; `npm run clean:clone -- --nome <nome>` troca a identidade de pacote do Rendra pela do projeto clonado, mantendo licença e crédito; `docs/PROMPT_MIGRACAO.md`, `docs/COMO_APLICAR.md` e `README.md` passam a apresentar os três caminhos (pacote npm, cópia dos arquivos, refazer), com o mesmo critério de escolha e a mesma versão mínima de Node nos quatro documentos.
- Simulação dos dois leigos aprovada em 27/09/2026 (Regra um, item 7): os dois perfis (começar um projeto novo e migrar um sistema existente) percorridos de ponta a ponta, sem lacuna bloqueadora no repositório (detalhe na validação da entrega). `private` sai de `true`: a trava contra publicação acidental fica no `publish.yml` (só dispara por tag `v*`, com guarda de repositório) e em `npm run verify:pack -- --publicacao`.

### Pendente

- Publicação em si: `npm publish` continua manual, num terminal interativo, feito pelo Bruno (padrão dos produtos Rendra, seção 1, item 5); nenhuma tarefa deste lote cria tag nem publica. Enquanto a tag não sai, `npm install @rendra-ui/app` não funciona; use "cópia dos arquivos".
- CLI (`rendra-app`), registry de componentes e skill de IA (padrão dos produtos Rendra, seção 5.7 e seção 1 item 3): fora do escopo deste lote, sem desenho ainda; o app não tem `bin`.
- Sincronização 1 com o web (prefixo `--rendra-*`/`data-rendra`, catálogo de códigos de componente): fora do escopo deste lote, aguarda levantamento próprio sobre o repositório web.

## [0.2.0] - 26/09/2026

### Adicionado

- Os 43 componentes de UI da F1b, em 4 lotes: Ações (Button, ButtonGroup, ActionBar, DropdownMenu); Formulário (Input, Textarea, Select, Checkbox, CheckboxGroup, RadioGroup, Switch, Slider, OtpInput, DatePicker, Field, Form); Feedback e overlays (BrandFeedbackIcon, Alert, Toast, Progress, Skeleton, EmptyState, InfoHint, Modal, Drawer); Exibição composta e Layout (Card, Badge, Avatar, AvatarGroup, List, StatCard, Accordion, Tabs, Separator, BrandLogo, Container, Stack, Inline, Grid, Section, PageHeader).
- Rota `/componentes` (vitrine completa, 40 entradas reais em 5 grupos: Ações 4, Formulário 12, Feedback 9, Exibição 9, Layout 6); raiz do app redireciona para ela.
- `/galeria` completa: troca ao vivo de modelo, paleta e modo pelo controle real (`ButtonGroup`), sem recarregar e sem reverter a troca manual.
- Piso de cobertura (`coverageThreshold`, `jest.config.js`): 90% em `src/lib`, 80% em `src/components` e `src/theme`.
- `a11yPresets` completo (`tabpanel`, `link`, mais os papéis já existentes).
- Correção da armadilha do `ModelCodeFromUrl` (troca ao vivo revertida pela reaplicação de `?codigo=`/`?modo=`).

## [0.1.0] - 24/09/2026

### Adicionado

- Scaffold Expo Router + TypeScript estrito + NativeWind 4.2.7.
- Tokens de cor, tipografia, espaço, raio e sombra (`tailwind.config.ts`), zerados e sem `theme.extend`.
- `src/brand/palette.ts` portado do web, 4 paletas prontas (Safira, Equilíbrio, Aurora, Ardósia).
- 3 modelos (Safira/Poppins, Equilíbrio/DM Sans, Aurora/Inter), `BrandProvider`/`useBrand`, persistência em `AsyncStorage`.
- `Gradient` em SVG (brand, soft, accent).
- `check:rules` (R1-R13) com `ts-morph`, já reservando exceções de `style` para os componentes da próxima entrega.
- Rotas `/tokens` (paleta com AA ao vivo, tipografia, espaço, raio, sombra) e `/galeria` (leitura de `?codigo=`, links de combinação T#-C#).
- Export web (`experiments.baseUrl`), Playwright + axe sobre `/tokens` e `/galeria` (2 larguras, claro/escuro, 4 paletas).
- CI (GitHub Actions): typecheck, lint, check:rules, testes, export, Playwright; publicação no GitHub Pages em push para `main`.
- Documentação e fluxo de IA completos (`AGENTS.md`, `CLAUDE.md` com matriz de modelos verbatim, `GEMINI.md`, instruções de Copilot/Cursor/Windsurf, `DESIGN_RULES.md`, `README.md`, `docs/BRIEFING_MODELO.md`, `docs/COMO_APLICAR.md`, `docs/PROMPT_MIGRACAO.md`, `CONTRIBUTING.md`).
