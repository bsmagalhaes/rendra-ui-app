# Rendra App

**Design system e boilerplate mobile em React Native (Expo), com Expo Router e NativeWind, para todo app novo em português do Brasil.** Traz 68 componentes de UI prontos, com navegação do app pronta (cabeçalho, barra inferior e menu), telas de exemplo, 3 modelos de marca e 4 paletas, para quem precisa sair do zero com um app funcionando e trocar marca sem mexer em componente.

![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=white)
![Expo SDK](https://img.shields.io/badge/Expo%20SDK-57-000020?logo=expo&logoColor=white)
![Expo Router](https://img.shields.io/badge/Expo%20Router-file--based-000020?logo=expo&logoColor=white)
![NativeWind](https://img.shields.io/badge/NativeWind-4.2-38BDF8?logo=tailwindcss&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-29-C21325?logo=jest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-1.63-2EAD33?logo=playwright&logoColor=white)
[![CI](https://github.com/bsmagalhaes/rendra-ui-app/actions/workflows/ci.yml/badge.svg)](https://github.com/bsmagalhaes/rendra-ui-app/actions/workflows/ci.yml)

## Veja funcionando, sem instalar nada

Página de apresentação: [`https://bsmagalhaes.github.io/rendra-ui-app/`](https://bsmagalhaes.github.io/rendra-ui-app/), com o app rodando num celular, os 12 códigos de modelo e paleta, a galeria de telas e o passo a passo de instalação. A demo completa fica em [`/demo/`](https://bsmagalhaes.github.io/rendra-ui-app/demo/) (atualizada a cada push em `main` com CI verde).

- [Início da demo](https://bsmagalhaes.github.io/rendra-ui-app/demo/) (home: apresenta o projeto, os 3 modelos e as 4 paletas, com troca ao vivo)
- [Componentes](https://bsmagalhaes.github.io/rendra-ui-app/demo/componentes/) (58 entradas)
- [Tokens](https://bsmagalhaes.github.io/rendra-ui-app/demo/tokens/) (paleta com AA ao vivo, tipografia, espaço, raio, sombra)
- [Galeria](https://bsmagalhaes.github.io/rendra-ui-app/demo/galeria/) (troca ao vivo de modelo, paleta e modo pelo controle real)
- Telas de exemplo, com dados fictícios e fluxos que funcionam: [Entrar](https://bsmagalhaes.github.io/rendra-ui-app/demo/login) (formulário com validação e crédito, segue para a verificação em duas etapas), [Painel](https://bsmagalhaes.github.io/rendra-ui-app/demo/painel) (indicadores por período e cadastro rápido), [Clientes](https://bsmagalhaes.github.io/rendra-ui-app/demo/clientes/) (busca, filtros, paginação e exclusão), [Novo cliente](https://bsmagalhaes.github.io/rendra-ui-app/demo/clientes/novo), [Cadastro guiado](https://bsmagalhaes.github.io/rendra-ui-app/demo/cadastro) (quatro etapas), [Tarefas](https://bsmagalhaes.github.io/rendra-ui-app/demo/tarefas) (com "Enviar ao funil"), [Atendimento](https://bsmagalhaes.github.io/rendra-ui-app/demo/atendimento/) (conversas por etapa, busca, filtro por canal e chat), [Agenda](https://bsmagalhaes.github.io/rendra-ui-app/demo/agenda) (mês, dia e lista, com novo evento), [Funil](https://bsmagalhaes.github.io/rendra-ui-app/demo/kanban) (cards por etapa) e [Configurações](https://bsmagalhaes.github.io/rendra-ui-app/demo/configuracoes) (seis seções). Na tela de entrada vale qualquer e-mail com senha de 6 ou mais caracteres; na verificação vale qualquer código de 6 dígitos, menos `000000`.
- Exemplo com modelo e modo escolhidos por URL: [`/demo/galeria/?codigo=T3-C3&modo=escuro`](https://bsmagalhaes.github.io/rendra-ui-app/demo/galeria/?codigo=T3-C3&modo=escuro)

## Prints de destaque

Telas de celular (390 px, com moldura de aparelho), geradas por script a partir do app real. Toque numa imagem para vê-la ampliada na página de apresentação.

<p align="center">
  <a href="https://bsmagalhaes.github.io/rendra-ui-app/?imagem=safira-home-mobile"><img src="docs/images/safira-home-mobile.webp" alt="Início, modelo Safira" width="200" height="419"></a>
  <a href="https://bsmagalhaes.github.io/rendra-ui-app/?imagem=safira-componentes-mobile"><img src="docs/images/safira-componentes-mobile.webp" alt="Vitrine de componentes, modelo Safira" width="200" height="419" loading="lazy"></a>
  <a href="https://bsmagalhaes.github.io/rendra-ui-app/?imagem=aurora-escuro-mobile"><img src="docs/images/aurora-escuro-mobile.webp" alt="Vitrine de componentes em modo escuro, modelo Aurora" width="200" height="419" loading="lazy"></a>
  <a href="https://bsmagalhaes.github.io/rendra-ui-app/?imagem=equilibrio-painel-mobile"><img src="docs/images/equilibrio-painel-mobile.webp" alt="Painel, modelo Equilíbrio" width="200" height="419" loading="lazy"></a>
  <a href="https://bsmagalhaes.github.io/rendra-ui-app/?imagem=safira-atendimento-mobile"><img src="docs/images/safira-atendimento-mobile.webp" alt="Atendimento: chat completo com histórico, anexo e reações" width="200" height="419" loading="lazy"></a>
  <a href="https://bsmagalhaes.github.io/rendra-ui-app/?imagem=equilibrio-agenda-mobile"><img src="docs/images/equilibrio-agenda-mobile.webp" alt="Agenda: calendário com os compromissos do dia" width="200" height="419" loading="lazy"></a>
  <a href="https://bsmagalhaes.github.io/rendra-ui-app/?imagem=aurora-funil-mobile"><img src="docs/images/aurora-funil-mobile.webp" alt="Funil comercial: quadro de negócios com P&amp;S e MRR por coluna" width="200" height="419" loading="lazy"></a>
</p>

## O que é

Mesma finalidade do [Rendra web](https://github.com/bsmagalhaes/rendra-ui-web): base para todo app novo, publicado sob licença MIT. Quem conhece o Rendra web reconhece aqui a mesma arquitetura de tokens em três camadas (modelo, paleta, sistema), os mesmos nomes de classe Tailwind, os mesmos nomes de componente e prop, e o mesmo fluxo de briefing guiado para IA, adaptado ao celular: tipo de trabalho, briefing conduzido uma decisão por mensagem, `docs/BRIEFING.md` gravado e plano em etapas.

Critério de sucesso: trocar marca continua sendo 4 cores, degradê, modelo, nome e logotipo, sem mexer em componente.

## Galeria

Galeria de telas na página de apresentação, [`https://bsmagalhaes.github.io/rendra-ui-app/`](https://bsmagalhaes.github.io/rendra-ui-app/), e galeria ao vivo (troca de modelo, paleta e modo pelo controle real) na demo: [`https://bsmagalhaes.github.io/rendra-ui-app/demo/galeria/`](https://bsmagalhaes.github.io/rendra-ui-app/demo/galeria/).

## Códigos de modelo e de componente

Cada combinação de modelo e paleta tem um código `T#-C#` (por exemplo, `T1-C1` é o modelo Safira com a paleta Safira; `T1-C4` é o modelo Safira com a paleta Ardósia). Uma terceira parte opcional, `N1` a `N3`, escolhe o layout de navegação do `AppShell` (`T1-C1-N2`): `N1` barra inferior com menu em gaveta, `N2` barra inferior com menu em folha, `N3` só gaveta. Os 3 modelos são `T1` Safira/Poppins, `T2` Equilíbrio/DM Sans e `T3` Aurora/Inter; as 4 paletas são `C1` Safira, `C2` Equilíbrio, `C3` Aurora e `C4` Ardósia. Cada componente e cada variante tem um código no formato `SIGLA-000` (por exemplo, `BTN-001` é o botão primário, `ABA-002` são as abas em pílula), igual em web e app: o catálogo é `src/catalog/components.ts`, com o selo do código ao lado do título de cada exemplo em [`/componentes`](https://bsmagalhaes.github.io/rendra-ui-app/demo/componentes/).

## O que tem dentro

- Scaffold Expo Router + TypeScript estrito + NativeWind.
- Tokens de cor, tipografia, espaço, raio e sombra.
- 3 modelos prontos (Safira/Poppins, Equilíbrio/DM Sans, Aurora/Inter) e 4 paletas prontas (Safira, Equilíbrio, Aurora, Ardósia).
- `BrandProvider`/`useBrand`, com persistência local e troca em tempo de execução (e, desde a 1.6.0, `palettes`, `defaultPaletteId`, `defaultModelCode` e `storage={false}`, descritos em `docs/COMO_APLICAR.md`).
- `Gradient` em SVG.
- Os 68 componentes de UI (`src/components/ui`, `src/components/layout`, `src/components/app-shell`, `src/components/splash`), listados abaixo.
- `AppShell`: cabeçalho com título e seta de voltar, barra inferior de navegação rápida com botão central de menu, menu em gaveta ou folha, menu do usuário e sino de avisos opcional (`notifications`); só `navigation` é obrigatório, sem depender do roteador.
- Telas de exemplo prontas: home (`/`), `/login`, `/painel`, `/clientes`, `/cadastro`, `/tarefas`, `/atendimento`, `/agenda`, `/kanban`, `/configuracoes` e a página 404; abertura animada (`RendraSplash`) ligada ao splash nativo; crédito discreto "Feito com Rendra" (`RendraCredit`), opcional.
- `check:rules`, verificação estática das regras de `DESIGN_RULES.md`.
- Piso de cobertura (`coverageThreshold`): 90% em `src/lib`, 80% em `src/components` e `src/theme`, além do piso por arquivo nos módulos de contrato (`src/lib/masks.ts`, `src/lib/validators.ts`, `src/brand/palette.ts`, `src/theme/vars.ts`, `src/config/presets.ts`, `src/config/showcase.tsx`, `src/lib/robots.ts`, `src/lib/llms-txt.ts`, `src/config/seo.ts`).
- Rotas `/componentes` (vitrine completa, 58 entradas), `/tokens` (paleta com AA ao vivo, tipografia, espaço, raio, sombra) e `/galeria` (troca ao vivo de modelo, paleta e modo pelo controle real).
- Export web com SEO por rota (título, description, canonical, Open Graph, `sitemap.xml`, `robots.txt`, `llms.txt`), testado por Playwright (layout e toque) e axe (WCAG 2.1 AA).
- CI (GitHub Actions), fluxo de IA e documentação completos.

### Os 68 componentes de UI (disponíveis)

- **Ações (5):** Button, ButtonGroup, ActionBar, DropdownMenu, TextLink (link de texto, desde a 1.6.0).
- **Formulário (16):** Input (com `trailingAction`, o botão de ação dentro do campo, desde a 1.5.0), Textarea, Select, Checkbox, CheckboxGroup, RadioGroup, Switch, Slider, OtpInput, DatePicker, Field, Form, FormField, FormSection, Rating e Checklist (os dois últimos, da Sincronização 2).
- **Feedback (13):** BrandFeedbackIcon, Alert, Toast, Progress, Skeleton, Spinner, EmptyState, InfoHint, Modal, Drawer, Sheet (folha inferior, só no app, desde a 1.5.0), ErrorPage, RendraSplash.
- **Exibição (14):** Card, Badge, Avatar, AvatarGroup, List (reordenável com `onReorder`, desde a 1.4.0), StatCard, Accordion, Tabs (com `overflow="scroll"` e `countLabel`, desde a 1.5.0), Separator, BrandLogo, RendraCredit, Stepper e Wizard (os dois últimos, da Sincronização 2) e Text (o texto com a fonte do modelo, exportado desde a 1.6.0; usa `useBrand()`, então só funciona dentro do `BrandProvider`).
- **Layout (9):** Container, Stack, Inline, Grid, Section, PageHeader, AuthLayout, AuthScreen (a tela cheia de autenticação, desde a 1.6.0), AppShell.
- **Dados (5):** Chart (linha, barras, área, pizza, combinado, velocímetro de meta e funil; subcaminho `@rendra-ui/app/chart`) e Timeline, da F3, mais Pagination, DataToolbar e Table (lista de cards), da Sincronização 2.
- **Planejamento e atendimento (4), da F3:** Calendar, Kanban, ImageViewer e o Chat de atendimento (`ConversationList`, `ChatThread` e `ChatComposer`, contados como um, mais o selo `ChannelBadge`).
- **Editor e documentos (2), da F3:** RichTextEditor (`@rendra-ui/app/rich-text-editor`) e DocumentViewer (`@rendra-ui/app/document-viewer`).

A vitrine em `/componentes` mostra 58 entradas reais (Ações 4, Formulário 15, Feedback 11, Exibição 12,
Layout 6, Dados 5, Planejamento 5): `FormField`/`FormSection` entram compostos nos exemplos de `Form`, e `'Select (lista
longa)'` conta como entrada própria (decisão do fechamento da F1b), por isso a contagem da vitrine
difere da contagem por exportação acima. Os cinco componentes da F2 (`RendraCredit`, `ErrorPage`,
`AuthLayout`, `AppShell` e `RendraSplash`) não têm entrada própria na vitrine: aparecem em uso
nas telas de exemplo (home, login, painel, atendimento, agenda, funil, configurações e 404). Os três da 1.6.0 (`AuthScreen`, `TextLink` e `Text`) também não têm entrada própria: `AuthScreen` e `TextLink` aparecem nas telas de login, cadastro e recuperação de senha, e o `Text` em todas.

## Stack

- React Native 0.86, Expo SDK 57, Expo Router (roteamento por arquivo, export estático)
- NativeWind 4.2 (Tailwind para React Native)
- TypeScript 6, modo estrito
- Jest 29 + jest-expo + React Native Testing Library 14
- Playwright 1.63 + axe-core (WCAG 2.1 AA)

## Começar com IA

Cole o link deste repositório numa IA de código (Claude Code, Codex, Cursor, Gemini, Copilot) e diga o que quer em uma frase: `AGENTS.md` é o ponto único de entrada, lido primeiro por qualquer uma delas. Os demais arquivos abaixo só resumem e apontam para ele, com o mesmo conteúdo:

**Projeto novo**, cole:

```text
Clone https://github.com/bsmagalhaes/rendra-ui-app e use como base do meu novo app. Siga o AGENTS.md do repositório.
```

Só tem um chat sem terminal? Cole o link mesmo assim: a IA conduz o briefing e entrega o `docs/BRIEFING.md` para você levar a uma IA com terminal.

**Migração de um app existente**, abra a IA na pasta do seu app e cole:

```text
Aplique neste app o design system https://github.com/bsmagalhaes/rendra-ui-app. Leia, nesta ordem: https://github.com/bsmagalhaes/rendra-ui-app/blob/main/AGENTS.md, https://github.com/bsmagalhaes/rendra-ui-app/blob/main/DESIGN_RULES.md, https://github.com/bsmagalhaes/rendra-ui-app/blob/main/docs/PROMPT_MIGRACAO.md e https://github.com/bsmagalhaes/rendra-ui-app/blob/main/docs/COMO_APLICAR.md, e siga o fluxo de migração, começando pelo briefing.
```

O prompt completo (`docs/PROMPT_MIGRACAO.md`) escolhe entre pacote npm, cópia dos arquivos ou refazer do zero, por um critério simples, e recomenda um caminho em vez de perguntar qual dos três; abaixo do piso real dos componentes animados (React Native 0.83 ou mais recente, pela Reanimated 4), o mesmo documento explica se atualizar o React Native primeiro ou refazer.

| Arquivo | Ferramenta |
|---|---|
| `AGENTS.md` | Ponto de entrada (todas as IAs) |
| `CLAUDE.md` | Claude Code |
| `GEMINI.md` | Gemini |
| `.github/copilot-instructions.md` | GitHub Copilot |
| `.cursor/rules/rendra.mdc` | Cursor |
| `.windsurfrules` | Windsurf |

`.claude/settings.json` (plugin `expo` do Claude Code) não está versionado: é conveniência opcional de quem já usa o Claude Code, não faz parte do fluxo obrigatório.

## Como rodar

Node 22 ou mais recente (`engines` do `package.json`; o CI usa o 24).

```bash
npm install
npm start
```

```bash
npx expo start
```

Abre o Metro (dev server) e imprime um QR code no terminal. Se a porta padrão (`8081`) já estiver
ocupada (por exemplo, por um container Docker), passe outra porta:

```bash
npx expo start --port 8090
```

As rotas do app ficam na raiz do dev server, sem o prefixo `/rendra-ui-app` (esse prefixo
só existe no export estático publicado no GitHub Pages, ver abaixo): com o Metro em `8090`,
`/tokens` e `/galeria` abrem em `http://localhost:8090/tokens` e `http://localhost:8090/galeria`.

- **Celular físico, com Expo Go:** escaneie o QR code impresso no terminal. Se o celular não
  conseguir conectar (rede corporativa, VPN, ou celular numa rede Wi-Fi diferente da do
  computador), rode com túnel: `npx expo start --tunnel`.
- **Emulador Android:** `npx expo start --android` abre o app direto num emulador já em execução
  (ou inicia um, se o Android Studio tiver um AVD configurado). Exige a variável de ambiente
  `ANDROID_HOME` apontando para o SDK do Android (`%LOCALAPPDATA%\Android\Sdk` no Windows por
  padrão) e o emulador/`adb` no `PATH`.
- **Navegador:** `npx expo start --web`, ou pressione `w` no terminal do Metro depois de
  `npx expo start`.

Export estático (o que a demo publicada e os testes Playwright usam) leva o prefixo
`/rendra-ui-app/demo` em todo link e asset, configurado em `experiments.baseUrl` de
`app.json`; é só o `expo export --platform web` (via `npm run build`) que aplica esse prefixo,
não o dev server do Metro. A árvore do GitHub Pages é montada por `npm run pages:stage`: a página de
apresentação (`docs/index.html`) em `/rendra-ui-app/` e a demo em `/rendra-ui-app/demo/`.

```bash
npm run typecheck      # tsc --noEmit
npm run lint           # expo lint
npm run check:rules    # R1-R15, mais a checagem de CLAUDE.md
npm run test:coverage  # Jest + jest-expo + RNTL
npm run build          # expo export --platform web (alias: build:web)
npm run build:lib      # tsc -p tsconfig.lib.json + cabeçalho de autoria (dist-lib/)
npm run verify:pack    # npm pack real, instala num projeto temporário, renderiza um componente
npm run test:layout    # Playwright, layout e toque
npm run test:a11y      # Playwright + axe, WCAG 2.1 AA
npm run test:site      # Playwright, a página de apresentação (SEO, iframe, links, axe)
npm run test:demo      # Playwright, a demo em /demo/ (prefixo mantido ao navegar e ao voltar)
npm run docs:images    # capturas de celular do README e da página (WebP otimizado), e a og-image.jpg (rode npm run build antes)
npm run docs:images:check # confere que toda captura é de celular e a og-image tem 1200x630
```

## Formas de uso e comandos

### Clone (boilerplate)

Para começar um app novo a partir deste repositório.

```bash
git clone https://github.com/bsmagalhaes/rendra-ui-app.git meu-app
cd meu-app
npm install
npm run clean:clone -- --nome meu-app
npm start
```

### Pacote npm

Para usar os componentes num app que já existe, sem copiar arquivos.

```bash
npm install @rendra-ui/app nativewind tailwindcss@3
npx expo install react react-native react-native-reanimated react-native-gesture-handler react-native-safe-area-context react-native-svg @react-native-async-storage/async-storage expo-status-bar
```

```ts
import { BrandProvider, Button, registerIconInterop } from '@rendra-ui/app'
import { RendraRouterBridge } from '@rendra-ui/app/router-bridge'
import { Chart } from '@rendra-ui/app/chart'
import { RichTextEditor } from '@rendra-ui/app/rich-text-editor'
import { DocumentViewer } from '@rendra-ui/app/document-viewer'
```

O pacote e o Tailwind pelo `npm install` comum, fixando `tailwindcss@3` (a `latest` é a 4, fora da faixa que a NativeWind suporta); os peers nativos pelo `npx expo install`, que escolhe a versão que o SDK do app empacota, em vez da versão mais nova do npm. `tailwind.config.js` com `presets: [require('@rendra-ui/app/tailwind-preset')]` e `content` incluindo `./node_modules/@rendra-ui/app/dist-lib/**/*.js`; `babel.config.js`/`metro.config.js` com NativeWind; `<GestureHandlerRootView style={{ flex: 1 }}>` (de `react-native-gesture-handler`) por fora de tudo, exigido pelo arraste da `List` reordenável, do `Slider` e do `ImageViewer`; `registerIconInterop()` e `<BrandProvider>` na raiz; `<RendraRouterBridge>` (Expo Router) ou um `RendraNavigationProvider` próprio. Componentes com `useAnimatedStyle` (`Button`, entre outros) exigem o plugin `react-native-worklets/plugin` no Babel: em app Expo, `babel-preset-expo` já inclui esse plugin sozinho; em bare React Native sem esse preset, acrescente à mão. Passo a passo completo em `docs/COMO_APLICAR.md`, seção "Pelo pacote npm". O `Chart` (linha, barra, área, pizza, combinado, velocímetro de meta e funil) mora no subcaminho `@rendra-ui/app/chart`, porque carrega o `d3-shape`: quem não importa o subcaminho não paga o peso dele.

Testes do app que consome o pacote (Jest): o `dist-lib` já vem compilado pelo `tsc` e nunca passa pelo Babel, então, sob Jest, o `useAnimatedStyle` roda sem a lista de dependências e dá o erro "useAnimatedStyle was used without a dependency array". A saída é deixar o `transformIgnorePatterns` do preset do seu `jest.config.js` aceitar `@rendra-ui/.*`: some `|@rendra-ui/.*` ao fim do grupo do primeiro padrão, assim.

```js
// jest.config.js do app
transformIgnorePatterns: [
  'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|react-native-svg|nativewind|react-native-css-interop|lucide-react-native|@rendra-ui/.*)',
],
```

O Metro não precisa disso: o app em execução transforma todo módulo pelo `babel-preset-expo`. Só o Jest pula `node_modules`.

Se o seu `jest.config.js` não mapeia o `lucide-react-native`, acrescente também o `moduleNameMapper` abaixo. Sob Jest, o `import { icons } from 'lucide-react-native'` resolve para o `.mjs` do pacote, que o transform do `jest-expo` não cobre, e o teste cai em `SyntaxError: Unexpected token 'export'`. O mapeamento aponta para a build CJS, que expõe o mesmo `icons`.

```js
// jest.config.js do app
moduleNameMapper: {
  '^lucide-react-native$': '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
},
```

Editor de texto rico: `import { RichTextEditor } from '@rendra-ui/app/rich-text-editor'` (subcaminho à parte, fora da entrada principal). Instale também o peer opcional `react-native-webview` com `npx expo install react-native-webview`. No celular é um editor visual (Tiptap dentro de um WebView, pelo `@10play/tentap-editor`); no navegador, só o modo HTML. O `npm install` pode mostrar o aviso `ERESOLVE overriding peer dependency` do `@10play/tentap-editor` (ele traz um `react-dom` 18 usado só dentro do WebView): é esperado e inofensivo. Por ora ficam de fora alinhamento de texto, tabela, linha divisória e limpar formatação. O botão "Inserir imagem" só aparece com `onImageUpload`, que no celular não recebe arquivo: o app abre o seletor, envia a imagem e devolve o endereço público (no web a função recebe um `File`).

Visualizador de documentos: `import { DocumentViewer } from '@rendra-ui/app/document-viewer'` (subcaminho à parte, com o mesmo peer opcional `react-native-webview`). No iOS o PDF abre dentro do app, sem zoom nem paginação próprios; no Android e no navegador o botão abre o arquivo no aplicativo de PDF do aparelho.

Atendimento (chat): `ConversationList`, `ChatThread` e `ChatComposer` vêm da entrada principal `@rendra-ui/app`. A gravação de áudio do `ChatComposer` é simulada: só o cronômetro e o envio da duração em `audioSeconds`, sem pulso animado e sem captura real do microfone.

Registry, CLI e skill: não existem no app; ver `CHANGELOG.md`.

## Estrutura

```
app/                 # Expo Router (file-based)
  _layout.tsx         # SafeAreaProvider, GestureHandlerRootView, BrandProvider
  +html.tsx           # modelo raiz do export estático (lang, metas de política, reset de layout)
  index.tsx            # home (fora do shell, com SafeAreaView próprio)
  login.tsx            # tela de entrada (AuthLayout), fora do shell
  +not-found.tsx       # página 404 (ErrorPage)
  (shell)/             # grupo com o AppShell, sem entrar na URL
    _layout.tsx         # AppShell com o menu de exemplo (src/config/navigation.tsx)
    componentes/        # vitrine (grupos, [slug])
    tokens/index.tsx    # paleta, tipografia, espaço, raio, sombra, pares AA ao vivo
    galeria/index.tsx   # troca ao vivo de modelo/paleta/modo pelo controle real
    painel.tsx          # painel de exemplo
    atendimento/        # lista e conversa de atendimento (Chat)
    agenda.tsx          # agenda de exemplo (Calendar)
    kanban.tsx          # funil de exemplo (Kanban)
    configuracoes.tsx   # aparência, layout do menu e perfil
src/
  index.ts             # entrada principal do pacote @rendra-ui/app
  router-bridge.tsx    # subcaminho ./router-bridge, único ponto com expo-router
  chart.ts             # subcaminho ./chart (Chart, com d3-shape), fora da entrada principal
  rich-text-editor.ts  # subcaminho ./rich-text-editor (RichTextEditor, com tentap e WebView), fora da entrada principal
  document-viewer.ts   # subcaminho ./document-viewer (DocumentViewer, com WebView), fora da entrada principal
  navigation/           # contexto de navegação sem roteador (RendraNavigationProvider)
  brand/               # BrandProvider, useBrand, palette.ts, palettes.ts (4 paletas prontas)
  theme/               # tokens.ts, models.ts, vars.ts, fonts.ts, tailwind-preset.ts
  components/
    internal/           # Text base, primitivas internas
    gradient/            # <Gradient token="brand|soft|accent" />
    ui/                  # os componentes de UI (Button, Input, Card, ErrorPage, RendraCredit, ...)
    layout/              # Container, Stack, Inline, Grid, Section, PageHeader, AuthLayout
    app-shell/           # AppShell, ShellProvider, cabeçalho, barra inferior, gaveta, menu do usuário
    splash/              # RendraSplash, overlay animado de abertura
  hooks/               # useControlledState, useLookup, usePlaceholderColor
  lib/                 # cn, masks, validators, shape, a11y, robots, llms-txt
  config/              # presets.ts (parseModelCode/formatModelCode), showcase.tsx (vitrine), seo.ts, navigation.tsx (menu de exemplo)
scripts/
  check-rules.ts        # R1-R15 (ts-morph) + checagem de CLAUDE.md
  seo-build.ts          # title/description/og por rota, sitemap, robots.txt, llms.txt, 404
  readme-images.ts       # capturas de celular com moldura e og-image.jpg, por script
  pages-stage.ts         # monta a árvore do Pages: página na raiz e demo em /demo/
  verify-pack.ts        # npm pack real, instala num projeto temporário, renderiza um componente
  clean-clone.ts        # troca a identidade de pacote do Rendra pela do projeto clonado
tsconfig.lib.json       # tsconfig do build:lib (dist-lib/)
e2e/                   # Playwright (layout, acessibilidade, página de apresentação e demo)
docs/index.html        # página de apresentação (raiz do GitHub Pages), com docs/images/ e docs/og-image.jpg
```

## Como trocar a marca

Trocar marca é sempre: 4 cores, degradê, modelo, nome e logotipo, nunca componente. Resumo (guia completo em `docs/COMO_APLICAR.md`):

1. Defina as 4 cores e o degradê (`PaletteSeeds`), e gere a paleta com `createPalette` (`src/brand/palette.ts`), que deriva o resto por contraste (AA garantido).
2. Escolha o modelo (fonte e formato de raio): `T1` Safira, `T2` Equilíbrio, `T3` Aurora, ou um modelo próprio em `src/theme/models.ts`.
3. Aplique em runtime com `useBrand()` (`applyPalette`, `setPaletteId`, `setModelCode`, `setMode`), sem recarregar o app.
4. Defina o nome do produto em `BrandConfig.productName` (`src/brand/types.ts`).
5. Logotipo é opcional: sem `symbol`/`logo`, o `BrandLogo` usa um símbolo genérico interno.

## Documentação

- `AGENTS.md`: fluxo de trabalho para assistentes de IA.
- `DESIGN_RULES.md`: regras de design e `check:rules`.
- `docs/BRIEFING_MODELO.md`: roteiro do briefing guiado que a IA conduz com a pessoa, uma decisão por mensagem; as respostas vão para `docs/BRIEFING.md` (fora do git).
- `docs/COMO_APLICAR.md`: como trocar marca sem mexer em componente.
- `docs/PROMPT_MIGRACAO.md`: prompt para migrar um app existente para este design system.
- `CONTRIBUTING.md`, `CHANGELOG.md`.
- Design system web (referência pública): [`https://github.com/bsmagalhaes/rendra-ui-web`](https://github.com/bsmagalhaes/rendra-ui-web).

## Perguntas frequentes

**O que é o Rendra App?** Um design system e boilerplate mobile (React Native/Expo), espelho do Rendra web, com os mesmos tokens, nomes de componente e fluxo de marca.

**Preciso do Rendra web para usar o app?** Não. O app é independente: nenhum arquivo dele importa ou referencia caminho local do web, só cita a URL pública dele como referência.

**Como troco a marca?** 4 cores, degradê, modelo, nome e logotipo, sem mexer em componente. Ver "Como trocar a marca" acima e `docs/COMO_APLICAR.md`.

**O app roda no navegador?** Sim, via `expo export --platform web` (export estático, é o que a vitrine publicada usa) ou `npx expo start --web` em desenvolvimento.

**Qual a licença? Preciso manter o crédito "Feito com Rendra"?** MIT. O crédito na interface é opcional e pode ser removido, mas a licença MIT sempre exige manter o aviso de copyright e o arquivo `LICENSE`.

**Este projeto vira um pacote npm instalável?** Sim, e já está publicado: `npm install @rendra-ui/app` (ver "Formas de uso e comandos" acima). A primeira publicação saiu na versão 0.3.0; as seguintes saem pelo GitHub Actions ao empurrar a tag `vX.Y.Z`, por trusted publishing do npm (sem token guardado no repositório) e com procedência (`--provenance`).

**Uso outro roteador, e agora?** Sem Expo Router, forneça seu próprio `RendraNavigationProvider` (de `@rendra-ui/app`) alimentado pelas funções de navegação do seu roteador, em vez do `RendraRouterBridge` (que é específico do Expo Router).

**Preciso do NativeWind no meu app?** Sim, é peer obrigatório: os componentes usam classes Tailwind resolvidas em tempo de execução pelo NativeWind (`className`), não há alternativa sem ele.

## Autor

Criado e mantido por **Bruno Magalhaes**.

- Site: [www.brunomagalhaes.me](https://www.brunomagalhaes.me)
- E-mail: [contato@brunomagalhaes.me](mailto:contato@brunomagalhaes.me)
- Instagram: [@brunomagalhaes.me](https://www.instagram.com/brunomagalhaes.me/)

## Licença

[MIT](LICENSE) © 2026 Bruno Magalhaes. Pode usar, copiar, alterar e distribuir, inclusive em projetos comerciais, mantendo o aviso de copyright.

## Créditos

Construído com [Expo](https://expo.dev/), [Expo Router](https://docs.expo.dev/router/introduction/), [NativeWind](https://www.nativewind.dev/), [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/), [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/), [React Native Safe Area Context](https://github.com/th3rdwave/react-native-safe-area-context), [react-native-svg](https://github.com/software-mansion/react-native-svg), [Lucide](https://lucide.dev/), [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/), [IMask](https://imask.js.org/), [date-fns](https://date-fns.org/), [Jest](https://jestjs.io/), [React Native Testing Library](https://callstack.github.io/react-native-testing-library/) e [Playwright](https://playwright.dev/) (com [axe-core](https://github.com/dequelabs/axe-core)). Fontes Poppins, Inter e DM Sans, sob licença SIL Open Font License.
