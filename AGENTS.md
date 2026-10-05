# AGENTS.md

Autor: Bruno Magalhaes, brunomagalhaes.me, instagram.com/brunomagalhaes.me.

## Em um minuto

O Rendra App é o design system e boilerplate mobile do Rendra, em React Native (Expo) com Expo Router e NativeWind. Mesma finalidade do Rendra web (`https://github.com/bsmagalhaes/rendra-ui-web`): base para todo app novo, publicado sob licença MIT. Quem conhece o Rendra web reconhece aqui a mesma arquitetura de tokens em três camadas (modelo, paleta, sistema), os mesmos nomes de classe Tailwind, os mesmos nomes de componente e prop, e o mesmo fluxo de briefing guiado para IA, adaptado ao celular.

Este arquivo vale para qualquer IA de código: Codex, Claude Code, Cursor, GitHub Copilot, Gemini, Windsurf, Jules e outras.

O design system completo traz 65 componentes de UI (`src/components/ui`, `src/components/layout`, `src/components/app-shell`, `src/components/splash`), 58 entradas de vitrine (`/componentes`) e telas de exemplo (home, login com verificação em duas etapas, esqueci a senha, nova senha, criar conta, painel, clientes, detalhe, novo cliente, cadastro guiado, tarefas, atendimento, agenda, funil, configurações, 404 e erro 500). Os 44 primeiros existem desde a F1b (o `Spinner` entrou na Sincronização 1) e os cinco da F2 (`RendraCredit`, `ErrorPage`, `AuthLayout`, `AppShell`, `RendraSplash`) chegaram na 1.1.0, e os oito da F3 (`Chart`, `Timeline`, `Calendar`, `Kanban`, `ImageViewer`, o Chat, `RichTextEditor` e `DocumentViewer`) na 1.2.0, e os sete da Sincronização 2 (`Rating`, `Checklist`, `Pagination`, `DataToolbar`, `Table`, `Stepper` e `Wizard`) na 1.3.0, sobre a fundação da F1a: scaffold, tokens, os 3 modelos (Safira/Poppins, Equilíbrio/DM Sans, Aurora/Inter), `BrandProvider`/`useBrand`, `Gradient`, fontes, `check:rules`, e a vitrine completa (`/componentes`, `/tokens` e `/galeria`). A versão corrente está em `CHANGELOG.md`.

## Fluxo de início: descubra em qual ramo você está

Primeiro: se você não consegue rodar comandos nem gravar arquivos (chat sem terminal), vá direto ao ramo (d); nunca passe comandos para a pessoa rodar.

**(a) Já está dentro do repositório.** Confira `docs/BRIEFING.md` no disco (fora do git, `.gitignore`). Se existir e estiver marcado "confirmado", siga direto para o Passo 5; se for "rascunho", retome a partir dele; se não existir, comece o briefing (`docs/BRIEFING_MODELO.md`); se a pessoa colar um briefing pronto na conversa, grave em `docs/BRIEFING.md` com o status que ele traz. Briefing vindo de um chat sem terminal conta a partir do dia em que é colado: mostre o resumo curto, pergunte se algo mudou e marque de novo "confirmado em" com a data do dia, sem refazer as perguntas. Depois, siga do Passo 3 (rascunho ou sem briefing) ou do Passo 5 (confirmado).

**(b) Recebeu o link para começar um projeto novo.** Tudo abaixo é feito pela IA, nunca pedido à pessoa:

1. Pergunte, em uma linha, como o app se chama e derive o nome da pasta e do `--nome`: minúsculas, sem acento, com hífen no lugar de espaço (ex.: `rota-facil`). Depois, `git clone https://github.com/bsmagalhaes/rendra-ui-app.git <nome-da-pasta>`.
2. Apagar `.git` e `git init` (perguntar se a pessoa quer ligar a um repositório próprio no GitHub dela).
3. Conferir a versão do Node instalada: Node 22 ou mais recente (`engines` do `package.json`; o CI usa o 24).
4. `npm install`.
   Em seguida, `npm run clean:clone -- --nome <nome>` (troca a identidade de pacote do Rendra pela do projeto novo, mantendo licença e crédito).
5. `npx expo start --web` e informar o endereço impresso no terminal (normalmente `http://localhost:8081`, ou a porta que o Metro escolher se a 8081 estiver ocupada, ver `--port` abaixo).
6. Ver no celular: abrir o Expo Go e escanear o QR code impresso no terminal; se não conectar (rede corporativa, VPN), usar `npx expo start --tunnel`.
7. `npx playwright install chromium`, só quando for rodar `test:layout`/`test:a11y`.

Se o projeto for publicar em domínio próprio (GitHub Pages ou outro), defina `homepage` no
`package.json` (ou a variável `SITE_URL` no comando de build) com o endereço público real: sem
isso, `npm run build` gera `sitemap.xml`, `robots.txt` e `og:url` apontando para o domínio do
Rendra, não para o do projeto novo.

Depois, siga para o "Passo 2" e o briefing (`docs/BRIEFING_MODELO.md`); se a pessoa avisou que já tem o briefing pronto (ramo d), peça para colar, grave em `docs/BRIEFING.md` e siga do Passo 5.

**(c) Recebeu o link dentro de um sistema que já existe.** Leia pela URL, nesta ordem: `AGENTS.md`, `DESIGN_RULES.md`, `docs/PROMPT_MIGRACAO.md`, `docs/COMO_APLICAR.md`. Analise o sistema antes de perguntar: versões de `react-native`/`expo`/`react`/`nativewind` no `package.json`; se é Expo ou bare React Native; qual navegação (Expo Router, React Navigation, outro); onde ficam estilos e cores hoje; se o código vale a pena manter.

Critério de escolha, em uma frase, recomendado e nunca perguntado à pessoa: Expo SDK 57 ou mais recente com React Native 0.86 ou mais recente (os mínimos de `peerDependencies` do `package.json`) e quer se manter atualizado, **pacote npm**; Expo mais antigo, bare React Native sem NativeWind, ou estrutura que não recebe o pacote, mas dentro do piso real dos componentes animados (**React Native 0.83 ou mais recente**, pela Reanimated 4; `expo`/`expo-modules-core` via `npx install-expo-modules` num bare, detalhado em `docs/PROMPT_MIGRACAO.md`, CAMINHO B) e o código vale a pena, **cópia dos arquivos**; abaixo desse piso, atualize o React Native primeiro (passos no CAMINHO B) quando o código valer a pena, senão **refazer**; sistema que não vale manter de forma nenhuma, **refazer** direto. Recomende o caminho e peça confirmação, nunca pergunte qual dos três. Depois, briefing com o bloco 12 ("Somente para migração") preenchido (`docs/BRIEFING_MODELO.md`); se a pessoa avisou que já tem o briefing pronto (ramo d), peça para colar, grave em `docs/BRIEFING.md` com o bloco 12 e siga do Passo 5, sem refazer as perguntas; briefing vindo de um chat sem terminal conta a partir do dia em que é colado: mostre o resumo curto, pergunte se algo mudou e marque de novo "confirmado em" com a data do dia.

**(d) Chat sem terminal.** Se você não consegue rodar `git clone` nem gravar arquivos, diga em uma linha ("Vou conduzir o briefing aqui; a instalação fica para uma IA com terminal, no fim eu explico"), leia `AGENTS.md` e `docs/BRIEFING_MODELO.md` pelas URLs `https://raw.githubusercontent.com/bsmagalhaes/rendra-ui-app/main/AGENTS.md` e `https://raw.githubusercontent.com/bsmagalhaes/rendra-ui-app/main/docs/BRIEFING_MODELO.md`, faça o "Passo 2" e o briefing completo em texto puro e, ao confirmar, entregue o `docs/BRIEFING.md` inteiro num bloco de texto, com o status, mais as linhas de continuação para a pessoa, conforme o tipo de trabalho do briefing.

Projeto novo:

1. Instale uma IA de código com terminal (Claude Code, Codex, Cursor, Gemini CLI ou Copilot).
2. Cole nela: `Clone https://github.com/bsmagalhaes/rendra-ui-app e use como base do meu novo app. Siga o AGENTS.md do repositório. Meu briefing já está pronto, vou colar.`
3. Cole o briefing na mensagem seguinte; a IA salva em `docs/BRIEFING.md` e segue do Passo 5.

Migração de um sistema que já existe:

1. Instale uma IA de código com terminal (Claude Code, Codex, Cursor, Gemini CLI ou Copilot).
2. Abra essa IA dentro da pasta do seu app e cole: `Aplique neste app o design system https://github.com/bsmagalhaes/rendra-ui-app. Siga o AGENTS.md do repositório. Meu briefing já está pronto, vou colar.`
3. Cole o briefing na mensagem seguinte; a IA salva em `docs/BRIEFING.md` e segue o ramo (c), do Passo 5.

Na migração pelo chat, peça em uma mensagem as linhas de `expo` e `react-native` do `package.json`, recomende o caminho e entregue o briefing com o bloco 12.

Em qualquer ramo: comandos, instalação, testes e capturas de tela são sempre feitos pela IA; à pessoa cabe só decidir e aprovar. Quando alguma etapa exigir uma ação dela (login, confirmação no navegador, código de verificação), a IA explica exatamente o que fazer em uma linha. Só anuncie conclusão com tudo passando.

### Passo 2: perguntar o tipo de trabalho

Antes do briefing, pergunte em uma mensagem, com opções numeradas:

1. Projeto novo (ramo b).
2. Migração de um sistema existente (ramo c).
3. Contribuição para o próprio Rendra App (ramo a, ver `CONTRIBUTING.md`): pule o briefing.

### Passo 3: conduzir o briefing

Siga `docs/BRIEFING_MODELO.md` na ordem dos blocos. Escolhas guiadas (3.1 a 3.3, 4, 5, 6 e 11), uma por mensagem, com opções numeradas e o padrão marcado; blocos abertos, agrupados numa mensagem. Nunca decida sozinho modelo, paleta nem navegação. Aceite "não sei, sugira" e recomende pelo negócio e pelos usuários, em uma frase. Não invente dado: o que faltar vira pendência (bloco 14). Na migração, analise o sistema antes de perguntar. Nada é pedido à pessoa que seja técnico: comandos, instalação, testes e capturas são seus.

### Passo 4: registrar e confirmar

Grave `docs/BRIEFING.md` como rascunho (fora do git), mostre um resumo curto, peça confirmação e marque `confirmado em DD/MM/AAAA`. Nada é planejado nem construído antes disso.

### Passo 5: planejar em etapas

Planeje na ordem do produto; cada etapa passa pelas cinco etapas do "Fluxo de desenvolvimento" abaixo:

1. **Marca:** `src/brand/brand.config.ts` (nome, tipo de logotipo, rótulo), `src/brand/palettes.ts` ou `registerPalette` (cores), `src/theme/fonts.ts` (só se a fonte for outra) e `app.json` (nome, `slug` e `scheme`). Suba `npx expo start --web` e confira `/tokens` sem selo "falha".
2. **Navegação:** o menu em `src/config/navigation.tsx` e as props do `AppShell` em `app/(shell)/_layout.tsx`, com o `N` do briefing (seção "Telas e navegação do boilerplate").
3. **Telas base:** `app/index.tsx` (troque a apresentação do Rendra pela abertura do produto), `app/login.tsx`, `app/(shell)/painel.tsx`, `app/(shell)/configuracoes.tsx` e `app/+not-found.tsx` (seção "Telas e navegação do boilerplate").
4. **Telas do produto**, por prioridade.
5. **Limpeza:** decida com a pessoa se a vitrine (`/componentes`, `/tokens` e `/galeria`) fica como referência do time ou sai.

Ao fim de cada etapa: os comandos da seção "Comandos", capturas em 360 e 390, claro e escuro, no navegador (emulador só se você tiver e a etapa mexer em tela), e espere a aprovação da pessoa. Na migração, o plano segue o caminho escolhido em `docs/PROMPT_MIGRACAO.md`, tela por tela, na ordem do bloco 12.

## Fluxo de desenvolvimento

1. **Levantamento**: entender o pedido, o estado atual do repositório e o que já existe em `CHANGELOG.md`.
2. **Spec e plano**: escrever a partir do briefing, sem confrontar código de repositório nenhum.
3. **Validação do plano**: confrontar o plano contra a spec e o contrato de origem, arquivo por arquivo do escopo declarado.
4. **Execução**: implementar tarefa a tarefa, teste primeiro, sempre TDD real (vermelho comprovado, depois verde).
5. **Validação da entrega**: revisar o diff e a saída dos testes, nunca confiar só na leitura do código.

Se a sua ferramenta tem subagentes ou vários modelos e o trabalho é manutenção do próprio Rendra App, leia também `CLAUDE.md`, seção "REGRA INEGOCIÁVEL: MATRIZ DE MODELOS" (verificada por `npm run check:rules`): cada etapa fica com o modelo indicado e nenhum modelo valida o que escreveu. Em qualquer outra ferramenta, ou em projeto novo ou migração, cumpra as mesmas etapas em sequência, sem subagentes: valide rodando os comandos e lendo o próprio diff, e nunca finja chamar outro modelo.

## Telas e navegação do boilerplate

O clone já traz telas de exemplo, para serem trocadas pelas do produto (nunca apagadas às cegas: o teste de cada rota mostra o que ela promete):

- **Dentro do `AppShell`**, em `app/(shell)/` (o grupo entre parênteses não entra na URL): `/componentes`, `/tokens`, `/galeria`, `/painel`, `/clientes`, `/clientes/[id]`, `/clientes/novo`, `/cadastro`, `/tarefas`, `/atendimento`, `/atendimento/[id]`, `/agenda`, `/kanban` e `/configuracoes` (seis seções em abas). Os dados de exemplo vêm de `src/mocks/` e os auxiliares da demo de `src/demo/`, ambos fora do pacote. O `app/(shell)/_layout.tsx` monta o `AppShell` com o menu e o usuário de exemplo de `src/config/navigation.tsx`; em projeto novo, troque esse menu pelo do produto (`title`, `to`, `icon`, `bottomNav` até 4 itens na barra inferior) e o sino de avisos (`notifications`, de `src/mocks/notifications.ts`): retire a prop se o produto não tiver avisos, ou ligue-a aos dados reais.
- **Fora do shell**, em tela cheia: `/` (home), `/login`, `/esqueci-senha`, `/verificacao`, `/nova-senha` e `/cadastre-se` (`AuthLayout`) e `+not-found` (`ErrorPage`); o erro 500 é o `ErrorBoundary` exportado por `app/_layout.tsx`. Cada uma tem o próprio `SafeAreaView`, porque o inset superior do shell é do cabeçalho dele.
- **Layout do menu** pelo código de modelo: `N1` barra inferior com menu em gaveta (padrão), `N2` barra inferior com menu em folha, `N3` só gaveta (`?codigo=T1-C1-N2`, `useShell().applyLayout('N2')` ou a tela `/configuracoes`); a escolha fica gravada no aparelho.
- **Crédito "Feito com Rendra"** (`RendraCredit`) vem ligado no login e na home; `credit={false}` no `AuthLayout` (ou não renderizar o `RendraCredit`) o remove, com o aviso de licença descrito abaixo.
- **Abertura** animada (`RendraSplash`) montada em `app/_layout.tsx` junto do splash nativo (`app.json`); o pacote não depende do `expo-splash-screen`.

## Leitura obrigatória antes de qualquer tarefa

1. `DESIGN_RULES.md`: regras mestras de design, tokens, composição e a lista fechada de exceções de `style` inline.
2. A spec ativa da fase em execução (quando houver uma, registrada localmente, fora deste repositório).
3. O briefing do produto ou da mudança em questão: `docs/BRIEFING.md` (gravado no disco, fora do git), quando existir; `docs/BRIEFING_MODELO.md` é o roteiro que conduz a construção dele.

## Regras que não podem ser quebradas

- **Independência de repositório**: nenhum arquivo deste repositório contém import, `require`, symlink, workspace, path alias ou caminho relativo apontando para o repositório do design system web ou qualquer pasta fora deste projeto. Todo valor de origem no design system web é copiado para dentro deste repositório, nunca referenciado em build ou runtime. Documentação cita o web só pela URL pública `https://github.com/bsmagalhaes/rendra-ui-web`.
- **Cor em três camadas**: modelo (fonte e formato de raio), paleta (4 cores de marca mais degradê, geram todo o resto por contraste), sistema (cores fixas de estado, iguais em toda paleta). Nenhuma cor fixa em componente, fora de `src/theme/tokens.ts`, `src/brand/palette.ts`, `src/brand/palettes.ts` e `src/components/gradient/gradient.tsx`.
- **Chaves de paleta sempre `--kebab-case`**: todo acesso a `palette.light`/`palette.dark` usa `palette.light['--rendra-primary-foreground']`, nunca `palette.light.primaryForeground`.
- **Toque mínimo 44x44** em todo elemento interativo, mesmo quando o conteúdo visual é menor.
- **Nenhum valor arbitrário** fora da escala do `tailwind.config.ts`, nenhum `style` inline fora da lista fechada de `DESIGN_RULES.md`, nenhum nome de fonte fixo fora de `src/theme/fonts.ts`/`src/theme/models.ts`.
- **TDD real**: teste escrito primeiro, rodado e confirmado vermelho pelo motivo esperado, só então a implementação mínima, rodada de novo até verde.
- **`check:rules` limpo** (R1-R15, mais a checagem de `CLAUDE.md`) antes de qualquer commit.
- **Licença e crédito**: MIT em todo o projeto. Se pedirem para tirar o crédito visível ("Feito com Rendra") da tela, tire, mas avise sempre as duas coisas juntas: (1) a licença MIT exige manter o aviso de copyright e o arquivo `LICENSE` no código e em qualquer cópia, com ou sem crédito visível; (2) o crédito na interface é opcional, a preferência é mantê-lo onde está ou mover para uma tela "Sobre". Nunca afirme que a MIT obriga crédito visível na interface, ela não obriga.

## Resumo e verificação

Mesmo bloco em `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, `.cursor/rules/rendra.mdc` e `.windsurfrules` (provado igual por `scripts/lib/agent-files.test.ts`).

<!-- rendra:verificacao:inicio -->
Leia e siga o `AGENTS.md` na raiz, inteiro, antes de qualquer coisa.

Regras que não podem ser quebradas, resumidas (texto completo em `AGENTS.md`):

1. Independência de repositório: nenhum import, `require`, symlink, workspace, path alias ou caminho relativo aponta para o design system web ou qualquer pasta fora deste projeto; citação só pela URL pública `https://github.com/bsmagalhaes/rendra-ui-web`.
2. Cor em três camadas (modelo, paleta, sistema), chaves de paleta sempre `--rendra-kebab-case`, nenhuma cor fixa fora de `src/theme/tokens.ts`, `src/brand/palette.ts`, `src/brand/palettes.ts` e `src/components/gradient/gradient.tsx`.
3. Toque mínimo 44x44 em todo elemento interativo, mesmo quando o conteúdo visual é menor.
4. Nenhum valor arbitrário fora da escala do `tailwind.config.ts`, nenhum `style` inline fora da lista fechada de `DESIGN_RULES.md`, nenhum nome de fonte fixo fora de `src/theme/fonts.ts`/`src/theme/models.ts`.
5. TDD real: teste escrito primeiro, rodado e confirmado vermelho pelo motivo esperado, só então a implementação mínima, rodada de novo até verde.
6. `check:rules` limpo (R1-R15, mais a checagem de `CLAUDE.md`) antes de qualquer commit; licença MIT em todo o projeto, crédito "Feito com Rendra" opcional (ver `AGENTS.md`).

Comandos:

```bash
npm run typecheck
npm run lint
npm run check:rules
npm run test:coverage
npm run build
npm run build:lib
npm run verify:pack
npm run test:layout
npm run test:a11y
```
<!-- rendra:verificacao:fim -->

## Comandos

```bash
npm run typecheck      # tsc --noEmit
npm run lint           # expo lint
npm run check:rules    # R1-R15 + diff de CLAUDE.md
npm run test:coverage  # Jest + jest-expo + RNTL
npm run build           # expo export --platform web (alias: build:web)
npm run build:lib      # tsc -p tsconfig.lib.json + cabeçalho de autoria (dist-lib/)
npm run verify:pack    # npm pack real, instala num projeto temporário, renderiza um componente
npm run test:layout    # Playwright, layout e toque
npm run test:a11y      # Playwright + axe, WCAG 2.1 AA
npm run test:site      # Playwright, a página de apresentação (raiz do Pages): SEO, iframe, links e axe
npm run test:demo      # Playwright, a demo em /demo/: prefixo mantido ao navegar e ao voltar
npm run docs:images    # capturas de celular do README e da página (WebP otimizado), e og-image.jpg (rode npm run build antes)
npm run docs:images:check # confere que toda captura é de celular e a og-image tem 1200x630
```

## Rodar o app em desenvolvimento

```bash
npx expo start                  # dev server (Metro); porta padrão 8081
npx expo start --port <porta>   # se a 8081 estiver ocupada (ex.: Docker)
npx expo start --tunnel         # se o Expo Go não conseguir conectar por rede local
npx expo start --android        # abre num emulador Android (exige ANDROID_HOME configurado)
npx expo start --web            # abre no navegador
```

As rotas ficam na raiz do dev server, sem prefixo (`http://localhost:<porta>/tokens`,
`http://localhost:<porta>/galeria`). O prefixo `/rendra-ui-app/demo` (`app.json`,
`experiments.baseUrl`) só existe no export estático (`npm run build:web`), consumido pela demo
publicada no GitHub Pages (a página de apresentação fica em `/rendra-ui-app/`, a demo em
`/rendra-ui-app/demo/`) e pelos testes Playwright (`npm run test:layout`/`test:a11y`/`test:demo`),
nunca pelo `expo start`.

## Conduta

Português do Brasil, sem travessão (use vírgula), datas em DD/MM/AAAA, valores em R$ 1.250,00. Toda tarefa termina com commit próprio; toda mudança de comportamento tem teste que comprova.
