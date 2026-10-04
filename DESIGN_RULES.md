# DESIGN_RULES.md

Regras de design do Rendra App, nativo (React Native/Expo/NativeWind). Esta entrega (F1b, mais o `Spinner` da Sincronização 1) traz os componentes de UI e a rota `/componentes` (41 entradas), a F2 acrescenta o `AppShell`, as telas base, a home e o splash, e a F3 os componentes de dados, planejamento, atendimento, editor e documento (vitrine com 57 entradas, já com os sete da Sincronização 2), num total de 64 componentes, sobre a fundação da F1a (tokens, `BrandProvider`, `Gradient`, `check:rules`); a versão corrente está em `CHANGELOG.md`. As regras abaixo valem para todo componente, e `check:rules` reserva a lista fechada de exceções de `style` por arquivo (seção "Lista fechada de exceções", abaixo).

A lista de referência de códigos de componente é `src/catalog/components.ts`, com selo na vitrine `/componentes`; o mesmo código significa o mesmo componente e a mesma variante em web e app.

## Regras mestras

1. Toque mínimo 44x44 em todo elemento interativo, mesmo quando o conteúdo visual é menor.
2. Nada depende de hover (não existe estado de hover confiável em toque).
3. Safe area em todo elemento fixo (cabeçalho, rodapé de ações, folha inferior).
4. Teclado nunca cobre o campo ativo nem o rodapé de ações.
5. Interface em pt-BR, datas em DD/MM/AAAA, valores em R$ 1.250,00.
6. Teste primeiro (TDD real): vermelho comprovado pelo motivo esperado, depois a implementação mínima, depois verde.

## Marca isolada em três camadas

- **Modelo** (`T1` Safira/Poppins, `T2` Equilíbrio/DM Sans, `T3` Aurora/Inter): define a fonte por peso e o formato de raio (`square`/`rounded`/`pill`).
- **Paleta** (`C1` Safira, `C2` Equilíbrio, `C3` Aurora, `C4` Ardósia, ou uma paleta de cliente gerada por `createPalette`): 4 cores de marca (`primary`, `primaryHover`, `secondary`, `secondaryHover`) mais um degradê de 3 paradas; todo o resto (estados hover, texto sobre cor, sidebar) é derivado por contraste, nunca escolhido à mão.
- **Sistema**: cores fixas de estado (`destructive`, `success`, `warning`, `info`, cada uma com variante `-hover`/`-soft`/`-foreground` conforme aplicável), iguais em toda paleta, claro e escuro.

Trocar marca é sempre: 4 cores, degradê, modelo, nome e logotipo. Nunca mexer em componente para trocar marca.

`palette.light`/`palette.dark` (saída de `createPalette`) usam chaves em `--rendra-kebab-case`: todo acesso é `palette.light['--rendra-primary-foreground']`, nunca `palette.light.primaryForeground`.

## Tokens

- **Espaço** (`tailwind.config.ts`, `theme.spacing`): `0`, `px` (1px), `1`-`24` em passos de 4/8 (4, 8, 12, 16, 24, 32, 48, 64, 96), mais os nomeados `section` (32px), `fields` (16px), `control-sm/md/lg` (44/48/52px), `touch` (44px), `icon-sm/md/lg` (16/20/24px), `header` (56px), `chart-sm/md` (192/256px).
- **Tipografia** (`theme.fontSize`): `xs` a `3xl` (7 tamanhos, 12px a 24px), cada um com `lineHeight` e `letterSpacing` fixos; `theme.fontWeight` só `normal` (400), `medium` (500), `semibold` (600) (nunca peso "bold" via classe ou `fontWeight` numérico: o peso vem da troca de arquivo de fonte por modelo, seção 8).
- **Raio** (`theme.borderRadius`): papéis `control`, `item`, `surface`, `block`, `avatar`, mais `full`, cada um resolvido por modelo (`square`/`rounded`/`pill`) via `src/lib/shape.ts`.
- **Sombra** (`theme.boxShadow`): `sm`/`md`/`lg`, resolvidos por `--shadow-color` e `--shadow-opacity-*` (variáveis de paleta, claro e escuro), via utilitários `shadow-*` do NativeWind (nunca `boxShadow` CSS: NativeWind 4.2 traduz para `shadowColor`/`shadowOffset`/`shadowOpacity`/`shadowRadius` no iOS e `elevation` no Android).
- **Cor** (`theme.colors`): 58+ nomes, cada um resolvido como `rgb(var(--<nome>) / <alpha-value>)` (ou `var(--<nome>)` sem alfa para `sidebar-border`/`sidebar-accent`/`sidebar-active`/`overlay`, que já vêm em `rgb(r g b / a)` completo). Nomes por camada: base (`background`, `foreground`, `card`, `popover`, `muted`, `border`, `input`, `field`, `ring`), marca (`primary`, `primary-hover`, `primary-foreground`, `primary-hover-foreground`, `primary-soft`, `primary-soft-foreground`, `primary-text`, `secondary`, `secondary-hover`, `secondary-foreground`, `secondary-hover-foreground`, `accent`, `accent-foreground`), estado (`destructive`, `success`, `warning`, `info`, cada um com `-hover`/`-soft`/`-foreground` conforme aplicável), sidebar (`sidebar`, `sidebar-foreground`, `sidebar-muted-foreground`, `sidebar-active-foreground`, `sidebar-indicator`, `sidebar-border`, `sidebar-accent`, `sidebar-active`), gráfico (`chart-1` a `chart-5`), `gradient-brand-foreground`, `overlay`. Não existe o nome `danger` (proibido); `surface` não é cor, é papel de raio.
- **Degradê**: `<Gradient token="brand|soft|accent" />`, sempre em SVG, nunca CSS `background-image`.
- **Fonte**: nome de família só em `src/theme/fonts.ts`/`src/theme/models.ts`; peso via troca de arquivo de fonte, nunca `fontWeight` numérico nem classe `font-bold`.

## Composição

- Botão (`Button`) só dentro de um container autorizado: `ActionBar`, `ButtonGroup`, `PageHeader` (área de ações), rodapé de `Modal`/`Drawer`, `CardHeader` (ações), linha de `List`/`Accordion`/item de menu, `action` de `Alert` e `actions` de `EmptyState`. Nunca solto num corpo de tela.
- `Modal` nunca dentro de outro `Modal`/`Drawer`. A confirmação de descarte do `Drawer` é a única sobreposição prevista, e é sempre um `Modal` irmão do `Drawer`, nunca descendente.
- `Modal` com no máximo 3 campos diretos (`FormField`/`Input`/`Select`/`Checkbox`/`RadioGroup`/`Switch`/`Slider`/`OtpInput`/`DatePicker`/`Textarea`); mais que isso é tela, não modal.
- No máximo um `<Gradient>` por rota; nunca como filho direto de `Button`/`Input`/`Badge`.
- Texto orientativo em componente de ajuda (`help`), nunca em prosa livre solta fora de um componente com esse papel.
- `AppShell`: o título da tela vive no cabeçalho; dentro do shell o `PageHeader` mostra só descrição e ações (o título dele fica só para leitor de tela, e título e ajuda em texto sobem ao cabeçalho). A seta de voltar é automática (rota de segundo nível), o menu abre pelo botão central da barra inferior (ou pelo cabeçalho sem barra), o cabeçalho é dono do inset superior e a barra inferior do inferior. A gaveta leva um `<Gradient>` além do da tela, porque é sobreposição (`RNModal`). Item ativo de navegação usa `aria-current`, nunca `aria-selected`, e declara sempre os dois estados de classe (nada de `shadow-*`/`rotate-*`/`scale-*`/`translate-*`/`ring-*` que aparece só depois).
- Crédito `RendraCredit`: rodapé do login e da home, discreto e removível por `credit={false}`.

## Proibido

- Valor arbitrário em classe Tailwind (`p-[13px]`, `w-[220px]`).
- Cor fixa (`#`, `rgb(`, `rgba(`) fora de `src/theme/tokens.ts`, `src/brand/palette.ts`, `src/brand/palettes.ts` e `src/components/gradient/gradient.tsx`.
  - Exceção documentada, em JSON: o `backgroundColor` do plugin `expo-splash-screen` em `app.json` (claro `#f5f6f7`, escuro `#07142a`). O `check:rules` não varre JSON, e o splash nativo não conhece a paleta escolhida, por isso é neutro; `src/__tests__/app-json.test.ts` prova que os dois valores acompanham o tema padrão.
- `style` inline fora da lista fechada abaixo.
- Degrau de espaço fora da escala de `tailwind.config.ts`.
- Nome de fonte fixo fora de `src/theme/fonts.ts`/`src/theme/models.ts`.
- Arquivo `*Mobile`/`*Simples`/`*Grande`/`*ComBusca` em `src/components` (variante paralela em vez de prop).
- Componente paralelo (dois arquivos com o mesmo prefixo semântico em `src/components/ui`, tipo `select.tsx` e `select-v2.tsx`).
- Botão solto fora de um container autorizado (ver Composição).

### Lista fechada de exceções à regra "nenhum `style` inline" (R3)

React Native não tem `vars()`/CSS custom properties como mecanismo de estilo dinâmico universal: alguns valores só existem em tempo de execução (percentual calculado, resultado de gesto, inset de safe area, nome de fonte resolvido pelo modelo ativo). `style={...}` só é permitido nos arquivos abaixo, e só para os campos indicados; qualquer outro uso é violação (`check:rules` R3).

| Arquivo | Uso autorizado | Entrega |
|---|---|---|
| `app/_layout.tsx` | `style={{ flex: 1 }}` no `GestureHandlerRootView` raiz | F1a |
| `src/brand/brand-provider.tsx` | `style={vars(buildThemeVars(...))}` na `View` raiz | F1a |
| `src/components/internal/text.tsx` | `style={{ fontFamily: ... }}` (fonte resolvida em runtime) | F1a |
| `app/(shell)/tokens/index.tsx` | `style={{ backgroundColor, color }}` só nos pares de contraste AA | F1a |
| `src/components/internal/bottom-sheet.tsx` | `style` de `useAnimatedStyle` (posição da folha) | F1b |
| `src/components/internal/overlay-shell.tsx`, `src/components/internal/picker-panel.tsx` | `style={{ paddingTop/paddingBottom: insets.* }}` (safe area) | F1b |
| `src/components/ui/action-bar.tsx`, `src/components/layout/page-header.tsx` | safe area do rodapé/topo | F1b |
| `src/components/ui/drawer.tsx` | `style` de `useAnimatedStyle` (`translateX` de entrada e de arraste do painel) e `style={{ flex: 1 }}` no `GestureHandlerRootView` dentro do `RNModal` (mesma exceção de `bottom-sheet.tsx`); a safe area vem do `OverlayShell` | F1b |
| `src/components/ui/modal.tsx` | `style` de `useAnimatedStyle` (entrada própria do cartão: posição e opacidade, mesmo padrão de `bottom-sheet.tsx`/`drawer.tsx`; necessária porque `animationType="none"` tira a transição nativa do `RNModal`) | F1b |
| `src/components/ui/slider.tsx`, `src/components/ui/accordion.tsx`, `src/components/ui/switch.tsx`, `src/components/ui/skeleton.tsx` | `style` de `useAnimatedStyle` (gesto/medição/transição); em `slider.tsx`, também a faixa preenchida percentual (`style={{ left, width }}` calculados a partir do valor) | F1b |
| `src/components/ui/list.tsx` | `style` de `useAnimatedStyle` da linha reordenável (deslocamento vertical, escala e opacidade durante o arraste; só com `onReorder`, e sem `className` no nó animado) | 1.4.0 |
| `src/components/ui/toast.tsx` | `style={{ paddingBottom: Math.max(16, insets.bottom) }}` no host do `Toaster` (safe area inferior); entrada e saída por `entering`/`exiting` do Reanimated, sem `style` | F1b |
| `src/components/ui/progress.tsx` | `style` de `useAnimatedStyle` da barra (`position`, `left`, `top`, `height` e `width` percentual calculado do valor; vaivém do indeterminado) | F1b |
| `src/components/ui/otp-input.tsx`, `src/components/ui/badge.tsx`, `src/components/layout/primitives.tsx` (`Grid`) | larguras percentuais equivalentes a `field-sizing`/grade | F1b |
| `src/components/ui/textarea.tsx` | `style={{ height }}` (altura calculada, 96 a 256px) | F1b |
| `src/components/ui/spinner.tsx` | `style` de `useAnimatedStyle` da rotação | Sincronização 1 |
| `src/components/app-shell/header.tsx` | `style={{ paddingTop: insets.top }}` (o cabeçalho do shell é o único dono do inset superior) | F2 |
| `src/components/app-shell/bottom-nav.tsx` | `style={{ paddingBottom: Math.max(0, insets.bottom) }}` (a barra inferior é dona do inset inferior) | F2 |
| `src/components/app-shell/nav-drawer.tsx` | `style` de `useAnimatedStyle` (`translateX` e largura do painel), `style={{ flex: 1 }}` no `GestureHandlerRootView` dentro do `RNModal` e `style={{ paddingTop, paddingBottom }}` com os insets (mesmo padrão de `drawer.tsx`) | F2 |
| `src/components/splash/rendra-splash.tsx` | `style` de `useAnimatedStyle` (entrada do selo, do nome e do lema, anel e fade do overlay, com `pointerEvents: 'none'`) | F2 |
| `app/index.tsx` | `style={{ backgroundColor }}` só nas amostras de paleta da home (cor de uma paleta que não é a ativa, vinda de `paletteSeeds`) | F2 |
| `src/components/ui/calendar.tsx` | `style={{ height }}` do contêiner da grade (`horas × HOUR_HEIGHT`) e `style={{ top, height }}` dos eventos da grade de horas e da linha de agora, calculados por função pura (`src/lib/calendar-grid.ts`); minuto exato, sem número literal no `style` | F3 |
| `src/components/ui/image-viewer.tsx` | `style` de `useAnimatedStyle` (escala e translação da pinça e do arraste), `style={{ width, height }}` de cada página da galeria (medidas da janela), `style={{ width: '100%', height: '100%' }}` da `Image` dentro da página animada, `style={{ flex: 1 }}` no `GestureHandlerRootView` dentro do `RNModal` e `style={{ paddingTop, paddingBottom }}` com os insets do cabeçalho e do rodapé (o visualizador não usa o corpo do `OverlayShell`, que é um `ScrollView` com `p-4`) | F3 |
| `src/components/ui/chat/chat-composer.tsx` | `style={{ height }}` do campo de mensagem (calculada por `onContentSizeChange`, entre `control-md` e `chart-sm`, mesmo padrão de `textarea.tsx`) e `style={{ paddingBottom }}` com o inset inferior, salvo dentro do `AppShell` com barra inferior (mesmo padrão de `action-bar.tsx`) | F3 |

Qualquer outro componente que precisar de um valor dinâmico fora desta lista pede alteração desta regra antes da implementação (nunca `style` "só desta vez").

## `check:rules` (`scripts/check-rules.ts`, `ts-morph`, varre `app/**/*.tsx` e `src/**/*.tsx`)

| Regra | O que barra |
|---|---|
| R1 valor arbitrário | Classe Tailwind com colchetes (`p-[13px]`, `w-[220px]`), sem exceção. |
| R2 cor fixa | Literal de cor (`#`, `rgb(`, `rgba(`) em `style`, `color=`, `stopColor=`, fora dos arquivos de tema/paleta. |
| R3 `style` inline | Prop `style={...}` fora da lista fechada acima. |
| R4 degrau fora da escala | Número em `padding`/`margin`/`gap`/`width`/`height` (via `style` autorizado) que não corresponde a um token. |
| R5 nome de fonte fixo | String literal de família de fonte fora de `src/theme/fonts.ts`/`src/theme/models.ts`. |
| R6 arquivo paralelo | Nome terminando em `Mobile`/`Simples`/`Grande`/`ComBusca` em `src/components`. |
| R7 peso via `fontWeight` | `fontWeight` numérico/string ou classe `font-bold`. |
| R8 componente paralelo | Dois arquivos em `src/components/ui` com o mesmo prefixo semântico. |
| R9 modal dentro de modal | `<Modal>`/`<Drawer>` dentro de outro `<Modal>`. |
| R10 modal com mais de 3 campos | `<Modal>` com mais de 3 campos diretos. |
| R11 degradê fora das regras | Mais de um `<Gradient>` por rota, ou como filho direto de `Button`/`Input`/`Badge`. |
| R12 botão solto | `<Button>` fora de um container autorizado (`R12` ignora `src/components/**`, onde os próprios containers usam `Button` internamente). |
| R13 teste dentro de `app/` | Arquivo `*.test.ts(x)` sob `app/` (o Expo Router trata todo arquivo de `app/` como rota candidata); testes de rota vivem em `src/__tests__/routes/`. |
| R14 variável do tema sem prefixo | String literal `'--<nome>'` ou `var(--<nome>)` (inclusive dentro de template) com `<nome>` num nome próprio do tema (`scripts/lib/var-prefix.ts`) sem o prefixo `--rendra-`; nunca acusa `--tw-*` nem variável de terceiro. |
| R15 texto orientativo fora do limite | `help` literal de `Field`/`FormField` acima do limite do `span` (tabela abaixo; sem `span`, `md` = 40); mais da metade dos `Field`/`FormField` de uma `FormSection` com `help`; `description` literal do `PageHeader` acima de 150; `description`/`CardDescription` literal começando com verbo de instrução (`Comece, Clique, Toque, Arraste, Preencha, Use, Escolha, Selecione, Digite, Informe, Veja, Confira`); só em `app/**` (telas), nunca `help={variável}`. |

Limite do texto de ajuda por `span` (regra R15, `scripts/lib/help-length.ts`):

| `span` | Limite de caracteres |
|---|---|
| `full` | 150 |
| `xl` | 100 |
| `lg` | 70 |
| `md`/`half` (padrão sem `span`) | 40 |
| `sm` | 30 |
| `xs` | 20 |

Regras que dependem de comportamento em tempo de execução (toque mínimo real, safe area cobrindo elemento fixo, teclado não cobrir campo ativo) ficam nos testes de Playwright, não em `check:rules`.

## Checklist final

- [ ] Toque mínimo 44x44 em todo elemento interativo.
- [ ] Safe area respeitada em todo elemento fixo.
- [ ] Teclado não cobre campo ativo nem rodapé de ações.
- [ ] `npm run check:rules` limpo (R1-R15, mais a checagem de `CLAUDE.md`).
- [ ] Testes cobrindo o piso de cobertura da estratégia de testes (o piso está ativo, `coverageThreshold` em `jest.config.js`: 90% em `src/lib`, 80% em `src/components` e `src/theme`, além do piso por arquivo nos módulos de contrato: `src/lib/masks.ts`, `src/lib/validators.ts`, `src/brand/palette.ts`, `src/theme/vars.ts`, `src/config/presets.ts`, `src/config/showcase.tsx`).
