# Prompt de migração

Prompt para orientar um assistente de IA a levar o Rendra App para dentro de um app React Native (Expo) já existente. Cole o texto abaixo numa conversa com o assistente, dentro da pasta do app-alvo.

---

## Como usar

Cole este texto completo na conversa com a IA, dentro da pasta do app-alvo. Se você já souber qual caminho quer (A pacote, B cópia, ou C refazer), diga logo no início; senão, a IA analisa o seu app e recomenda um dos três.

`[LINK DO REPOSITÓRIO]` é sempre `https://github.com/bsmagalhaes/rendra-ui-app`.

Tenha em mãos, se possível (a IA sugere um padrão para cada um se você não tiver): as 4 cores de marca mais o degradê, o modelo (`T1` Safira, `T2` Equilíbrio, `T3` Aurora, ou um modelo novo), o nome do produto, e um logotipo (opcional).

---

Você vai trazer o Rendra App (`[LINK DO REPOSITÓRIO]`) para este app React Native existente, sem tocar na lógica de negócio.

## ANTES DE ESCOLHER O CAMINHO

1. Leia, pela URL (`blob/main`), nesta ordem: `AGENTS.md`, `DESIGN_RULES.md`, este prompt (`docs/PROMPT_MIGRACAO.md`) e `docs/COMO_APLICAR.md`.
2. Analise este app antes de perguntar qualquer coisa: versões de `expo`, `react-native`, `react` e `nativewind` no `package.json`; se é um app Expo ou bare React Native; qual navegação usa (Expo Router, React Navigation, outra); onde ficam os estilos e as cores hoje (`StyleSheet.create`, `styled-components`, outro); se o código atual vale a pena manter.

## ESCOLHA O CAMINHO: recomende, não pergunte um critério

Critério, em uma frase, recomendado e nunca perguntado à pessoa: Expo SDK 57 ou mais recente com React Native 0.86 ou mais recente (os mínimos de `peerDependencies` do `package.json` do Rendra App) e a pessoa quer se manter atualizada, **CAMINHO A (pacote npm)**; Expo mais antigo, bare React Native sem NativeWind, ou uma estrutura que não recebe o pacote, mas dentro do piso real da seção "CAMINHO B" abaixo (React Native 0.83 ou mais recente) e o código atual vale a pena, **CAMINHO B (cópia dos arquivos)**; abaixo desse piso (React Native mais antigo que 0.83), decida entre atualizar o React Native primeiro (quando o código valer a pena) ou **CAMINHO C (refazer)** (quando não valer), nunca tente instalar os componentes animados direto; app que não vale a pena manter de forma nenhuma, **CAMINHO C (refazer)** direto.

Exemplo de frase por caminho: "Seu app já usa Expo 57 e React Native 0.86: o caminho mais direto é instalar o pacote e migrar tela por tela (CAMINHO A)."; "Seu app usa Expo 49 sem NativeWind, mas o código vale a pena: vamos copiar os arquivos do design system para dentro dele (CAMINHO B)."; "Seu app está com uma base muito antiga e pouco código reaproveitável: o mais rápido é recomeçar do zero trazendo as regras de negócio (CAMINHO C)."

Recomende o caminho, explique em uma frase o porquê, e peça confirmação antes de seguir.

## Regra zero, também no destino

Nenhum arquivo de levantamento, plano, spec ou rascunho de sessão de IA vai para o git deste app. Se ainda não existir, acrescente ao `.gitignore` do app-alvo os artefatos de desenvolvimento (briefing, levantamento, plano, saída de ferramenta de IA) e a pasta de configuração local do assistente de código. Antes de planejar, conduza o briefing completo pelo roteiro de `docs/BRIEFING_MODELO.md`, com o bloco 12 (migração) preenchido, e grave em `docs/BRIEFING.md`, fora do git.

## CAMINHO A: pacote npm

Para manter o app como está e migrar tela por tela.

1. Instale o pacote e o Tailwind pelo npm, não são módulos nativos: `npm install @rendra-ui/app nativewind tailwindcss@3` (fixe `tailwindcss@3`: a versão `latest` do Tailwind é a 4, e a NativeWind só suporta Tailwind CSS v3). Os peers nativos que faltarem, instale com `npx expo install` em vez de `npm install`: em app Expo, ele escolhe sozinho a versão de cada pacote que o SDK do app empacota, evitando que a versão mais nova do npm quebre o Expo Go: `npx expo install react react-native react-native-reanimated react-native-gesture-handler react-native-safe-area-context react-native-svg @react-native-async-storage/async-storage expo-status-bar` (`expo-status-bar` incluso, peer obrigatório; mais `expo-font`/`react-native-web`, opcionais, pelo mesmo `npx expo install`). `react-native-reanimated` >=4 exige `react-native-worklets` como dependência dele mesmo, e componentes como `Button` usam `useAnimatedStyle`: em app Expo, o `babel-preset-expo` já adiciona o plugin `react-native-worklets/plugin` sozinho (nenhum passo extra); em bare React Native sem esse preset, acrescente `react-native-worklets/plugin` aos `plugins` do `babel.config.js` à mão, senão os componentes animados quebram no primeiro toque.
2. `tailwind.config.js` do app-alvo: `presets: [require('@rendra-ui/app/tailwind-preset')]`, e `content` incluindo `./node_modules/@rendra-ui/app/dist-lib/**/*.js`, além dos caminhos do próprio app.
3. `global.css` com as três diretivas do Tailwind; `babel.config.js` com `jsxImportSource: 'nativewind'` e o preset `nativewind/babel`; `metro.config.js` com `withNativeWind`.
4. Na raiz do app: `<GestureHandlerRootView style={{ flex: 1 }}>` (de `react-native-gesture-handler`) por fora de tudo, exigido pelo arraste da `List` reordenável (`onReorder`), do `Slider` e do `ImageViewer`; sem ele, em desenvolvimento no aparelho, a tela com um desses componentes cai com o erro do gesture handler; `registerIconInterop()` uma vez (de `@rendra-ui/app`), `<BrandProvider>` envolvendo a árvore, e, com Expo Router, `<RendraRouterBridge>` de `@rendra-ui/app/router-bridge` (com outro roteador, um `RendraNavigationProvider` próprio, alimentado pelas funções de navegação do roteador que o app já usa).
5. Fontes dos três modelos: `useRendraFonts()` de `@rendra-ui/app/fonts`, ou as fontes que o app já carrega. Gráficos: `import { Chart } from '@rendra-ui/app/chart'` (subcaminho à parte, com `d3-shape`). Editor de texto rico: `import { RichTextEditor } from '@rendra-ui/app/rich-text-editor'` (subcaminho à parte; rode `npx expo install react-native-webview`, peer opcional; no navegador vale só o modo HTML). Visualizador de PDF: `import { DocumentViewer } from '@rendra-ui/app/document-viewer'` (subcaminho à parte, mesmo peer `react-native-webview`; o PDF abre dentro do app só no iOS, nos demais abre no aplicativo de PDF).
6. Se o app tem navegação própria de cabeçalho, barra inferior ou menu lateral, considere trocá-la pelo `AppShell` (só `navigation` é obrigatório; ele usa `useRendraNavigation()`, nunca o roteador): as telas que entram no shell ficam num grupo de rotas com o `AppShell` no layout, e telas públicas (login, erro 404) ficam fora dele, cada uma com o próprio `SafeAreaView`. O layout vem do código `N1` a `N3` (`?codigo=T#-C#-N#`).
7. Migre tela por tela: troque cada elemento montado à mão pelo componente equivalente do design system (`Button`, `Input`, `Card`, `List`, etc.), cor fixa por classe Tailwind com nome de token (`bg-primary`, `text-foreground`), espaçamento fixo pela escala do preset, fonte fixa pelo mecanismo de fontes acima.
8. Preserve toda lógica de negócio (chamada de API, validação, navegação, estado) exatamente como está; só a camada visual muda.
9. Verificação: como o `check:rules` deste repositório não roda no app-alvo, aplique as regras de `DESIGN_RULES.md` por leitura a cada tela migrada; rode o `typecheck`/lint do próprio app-alvo a cada arquivo migrado, zero violação antes de seguir para o próximo. Uma CLI `auditar`/`trocar` para o app instalado ainda não existe (fica registrada como pendência).

## CAMINHO B: cópia dos arquivos

Quando a estrutura do app-alvo não recebe o pacote (Expo antigo sem NativeWind, ou abaixo do piso do item 1 abaixo), mas o código vale a pena manter.

1. **Piso real, antes de instalar qualquer coisa** (nunca invente, decida por este critério): os componentes animados (`useAnimatedStyle`, em `Button` e outros) exigem `react-native-reanimated` 4.5 ou mais recente, que por sua vez exige **React Native 0.83 ou mais recente** (peer da própria Reanimated 4) e `react-native-worklets` (peer dela mesma, instalado junto). `ThemedStatusBar` usa `expo-status-bar`, peer obrigatório do Rendra App (não opcional): num app Expo isso já vem de graça; num **app bare**, instale os módulos do Expo primeiro, com `npx install-expo-modules@latest` (traz `expo`/`expo-modules-core` sem virar Expo Router nem tirar o app do bare workflow).
   - **Dentro do piso** (React Native 0.83 ou mais recente): instale as dependências do `package.json` deste repositório (as de `dependencies`) mais os peers reais (`react`, `react-native`, `nativewind`, `react-native-reanimated`, `react-native-gesture-handler`, `react-native-safe-area-context`, `react-native-svg`, `@react-native-async-storage/async-storage`, `tailwindcss@3`, `expo-status-bar`, e `expo`/`expo-modules-core` num bare, como acima) e siga os passos 2-6 abaixo. A faixa de peer da Reanimated muda a cada versão dela (confira sempre com `npm view react-native-reanimated@4 peerDependencies` antes de instalar sem versão): para **React Native 0.83 a 0.85**, a versão `latest` de hoje já exige React Native 0.86 ou mais recente, então fixe a versão compatível, `react-native-reanimated@4.6` e o `react-native-worklets@0.12` que é peer dela (em vez de `react-native-reanimated` sem versão), senão o `npm install` cai em `ERESOLVE`.
   - **Abaixo do piso** (React Native mais antigo que 0.83): não instale os peers acima, o `npm install` falha com `ERESOLVE` (a Reanimated 4 recusa `react-native` abaixo de 0.83) e, mesmo forçando, os componentes animados quebram no primeiro toque. Duas saídas, e quem decide é você: recomende uma, explique em uma frase e peça confirmação, sem perguntar qual a pessoa prefere: **(a) atualizar o React Native primeiro**, para 0.86 (a versão testada por este repositório), pelo [React Native Upgrade Helper](https://react-native-community.github.io/upgrade-helper/) ou `npx react-native upgrade`, depois `npx install-expo-modules@latest`, e só então voltar ao início deste item; vale quando o app é grande ou o código atual vale o esforço da atualização. **(b) CAMINHO C (refazer)**, quando o app é pequeno ou o código não compensa a atualização. Frase para a pessoa, adaptando a versão: "Seu React Native (`<versão atual>`) está abaixo do que os componentes animados exigem (0.83, pela Reanimated 4): recomendo <atualizar o React Native primeiro, porque o seu código vale o esforço> ou <recomeçar do zero trazendo suas regras de negócio, porque a atualização não compensa>. Posso seguir assim?"
2. Copie para dentro do app-alvo: `src/components` (inclui `app-shell/` e `splash/`), `src/brand`, `src/theme`, `src/lib`, `src/hooks`, `src/navigation`, `src/router-bridge.tsx`, `src/config/presets.ts`, `tailwind.config.ts`, `global.css`, `nativewind-env.d.ts`, `src/types/`, `scripts/check-rules.ts` (com `scripts/__fixtures__` e o teste), `jest.setup.js`/`jest.css-mock.js`, `DESIGN_RULES.md` e os scripts correspondentes do `package.json`. Não copie `CLAUDE.md` (a matriz de modelos é deste repositório), `app/`, nem os três arquivos de configuração abaixo (adapte-os, não copie tal qual: eles são feitos para Expo).
3. **Adapte `babel.config.js`, `metro.config.js` e `jest.config.js` ao bare** (copiá-los tal qual falha, porque dependem de pacotes só do Expo):
   - `babel.config.js`: troque o preset `babel-preset-expo` por `module:@react-native/babel-preset`, mantendo `nativewind/babel` e `jsxImportSource: 'nativewind'`.
   - `metro.config.js`: troque `require('expo/metro-config')` por `require('@react-native/metro-config')` (mesmo `getDefaultConfig`), com `withNativeWind` por cima do resultado, do jeito que este repositório já faz.
   - `jest.config.js`: troque `preset: 'jest-expo'` por `preset: 'react-native'`, mantendo `jest.setup.js` e o mapeamento de CSS iguais.
4. Ajuste `check:rules` ao `app/` do destino (o `checkClaudeMd` compara com um arquivo de referência que não existe no destino; torne essa checagem opcional ou remova essa regra específica no destino).
5. Convivência com estilos antigos: a escala do Tailwind deste repositório é zerada (`theme` sem `extend`), então classes como `p-5` ou `bg-blue-500` deixam de existir; migre gradualmente ou mantenha uma segunda config temporária.
6. Verificação completa (`typecheck`, `lint`, `check:rules` ajustado, testes) a cada arquivo migrado.

## CAMINHO C: refazer

Quando o app-alvo não vale a pena manter.

1. `git clone https://github.com/bsmagalhaes/rendra-ui-app.git <nome-da-pasta>`, apagar `.git`, `git init`.
2. `npm run clean:clone -- --nome <nome>` (troca a identidade de pacote do Rendra pela do projeto novo, mantendo licença e crédito).
3. Aplique a marca (`docs/COMO_APLICAR.md`).
4. Recrie as telas a partir da vitrine (`/componentes`, `/galeria`), trazendo as regras de negócio do app antigo (dados, validações, integrações), nunca o código visual antigo.
5. Verificação completa (`typecheck`, `lint`, `check:rules`, testes).

## Regras, crédito, licença, forma de trabalho

Regras de `DESIGN_RULES.md` valem sem exceção nos três caminhos: toque mínimo 44x44, cor em três camadas, nenhum valor arbitrário, `check:rules` limpo (ou a leitura equivalente, no CAMINHO A). Licença MIT do Rendra App continua com o crédito de copyright em qualquer cópia (ver `AGENTS.md`, seção de licença e crédito); o crédito visível "Feito com Rendra" na tela é opcional. Rode `npm run check:rules` (ou a leitura das regras) a cada arquivo migrado, zero violação antes de seguir para o próximo. Escreva ou adapte um teste para cada tela migrada, confirmando que ela renderiza sem erro com o `BrandProvider` real. Mostre o resultado em duas larguras, 360px e 390px (celular), claro e escuro.

## Checklist de verificação

- [ ] Nenhuma cor fixa fora de `src/theme/tokens.ts`/`src/brand/palette.ts`/`src/brand/palettes.ts` (ou dos módulos equivalentes do pacote instalado).
- [ ] Nenhum valor arbitrário de espaço/tamanho fora da escala do preset do Tailwind.
- [ ] Nenhum `style` inline fora da lista fechada de `DESIGN_RULES.md`.
- [ ] Toque mínimo 44x44 em todo elemento interativo.
- [ ] `npm run typecheck`, `npm run lint`, `npm run check:rules` e `npm run test:coverage` (ou os equivalentes do app-alvo) limpos.
- [ ] Nenhum import apontando para fora do app-alvo além do pacote `@rendra-ui/app` (CAMINHO A) ou dos arquivos copiados (CAMINHO B).
