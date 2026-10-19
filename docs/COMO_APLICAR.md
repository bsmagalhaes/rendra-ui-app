# Como aplicar a marca

Trocar marca no Rendra App é sempre: 4 cores, degradê, modelo, nome e logotipo. Nunca mexer em componente para trocar marca.

Node 22 ou mais recente (`engines` do `package.json`; o CI usa o 24).

## Pré-requisitos

Expo SDK 57 ou mais recente, React Native 0.86 ou mais recente, NativeWind 4.2 ou mais recente (os mínimos de `peerDependencies` do pacote `@rendra-ui/app`). Abaixo disso, o piso real e o que fazer (atualizar primeiro ou refazer) estão em `docs/PROMPT_MIGRACAO.md`, CAMINHO B.

## Os três caminhos

Quem já tem um app existente migra por um de três caminhos, escolhido por um critério simples (detalhado em `docs/PROMPT_MIGRACAO.md`): **pacote npm**, para manter o app como está e migrar tela por tela; **cópia dos arquivos**, quando o app não recebe o pacote (Expo antigo, sem NativeWind), mas o código vale a pena; **refazer**, quando o app não vale a pena manter. Quem começa um projeto novo usa o clone direto (ver "Limpeza do clone" abaixo). O prompt completo, com os três caminhos detalhados, está em `docs/PROMPT_MIGRACAO.md`.

## Pelo pacote npm

Instalação e configuração, uma vez só, no app de destino:

```bash
npm install @rendra-ui/app nativewind tailwindcss@3
npx expo install react react-native react-native-reanimated react-native-gesture-handler react-native-safe-area-context react-native-svg @react-native-async-storage/async-storage expo-status-bar
```

O pacote e o Tailwind vêm pelo `npm install` comum (fixando `tailwindcss@3`: a `latest` do Tailwind é a 4, e a NativeWind só suporta Tailwind CSS v3); os peers nativos vêm pelo `npx expo install`, que escolhe sozinho a versão de cada um que o SDK do app empacota, em vez da versão mais nova do npm (que pode não bater com o Expo Go). `tailwind.config.js`: `presets: [require('@rendra-ui/app/tailwind-preset')]`, `content` incluindo `./node_modules/@rendra-ui/app/dist-lib/**/*.js`. `global.css` com as três diretivas do Tailwind. `babel.config.js` com `jsxImportSource: 'nativewind'` e o preset `nativewind/babel`. `metro.config.js` com `withNativeWind`. Na raiz do app: `<GestureHandlerRootView style={{ flex: 1 }}>` (de `react-native-gesture-handler`) por fora de tudo, exigido pelo arraste da `List` reordenável (`onReorder`), do `Slider` e do `ImageViewer`; `registerIconInterop()` uma vez (de `@rendra-ui/app`), `<BrandProvider>` envolvendo a árvore, e, com Expo Router, `<RendraRouterBridge>` de `@rendra-ui/app/router-bridge`. Gráficos vêm do subcaminho `@rendra-ui/app/chart` (`import { Chart } from '@rendra-ui/app/chart'`), que traz o `d3-shape` só para quem o importa. O editor de texto rico vem do subcaminho `@rendra-ui/app/rich-text-editor` (`import { RichTextEditor } from '@rendra-ui/app/rich-text-editor'`), que só funciona no celular com o peer opcional `react-native-webview` instalado por `npx expo install react-native-webview`; no navegador ele cai sozinho no modo HTML. O `npm install` pode mostrar o aviso `ERESOLVE overriding peer dependency` do `@10play/tentap-editor`, esperado e inofensivo. O visualizador de PDF vem do subcaminho `@rendra-ui/app/document-viewer` (`import { DocumentViewer } from '@rendra-ui/app/document-viewer'`), com o mesmo peer `react-native-webview`: no iOS o PDF abre dentro do app; no Android e no navegador abre no aplicativo de PDF.

Componentes como `Button` usam `react-native-reanimated` (`useAnimatedStyle`), que exige o plugin `react-native-worklets/plugin` no Babel para funcionar. Em app Expo, o `babel-preset-expo` já inclui esse plugin sozinho (nenhum passo extra, `expo-status-bar` acima é peer obrigatório, não opcional). Em bare React Native sem `babel-preset-expo`, acrescente `react-native-worklets/plugin` aos `plugins` do `babel.config.js` à mão; sem ele, os componentes animados quebram no primeiro toque.

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

## Navegação do app: `AppShell`

O `AppShell` entrega cabeçalho (título da tela, seta de voltar, menu do usuário), barra inferior de navegação rápida com botão central de menu e o menu em gaveta lateral ou folha inferior. Só `navigation` é obrigatório; ele nunca importa o roteador, usa `useRendraNavigation()` (o `RendraRouterBridge` ou o seu `RendraNavigationProvider`). Com Expo Router, ponha as telas que usam o shell num grupo de rotas (por exemplo `app/(shell)/`) e monte o `AppShell` no layout do grupo:

```tsx
import { Stack } from 'expo-router'
import { LayoutDashboard } from 'lucide-react-native'
import { AppShell } from '@rendra-ui/app'

export default function ShellLayout() {
  return (
    <AppShell
      navigation={[{ title: 'Geral', items: [{ title: 'Painel', to: '/painel', icon: LayoutDashboard, bottomNav: true }] }]}
      user={{ name: 'Ana Ribeiro', email: 'ana@exemplo.com' }}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </AppShell>
  )
}
```

`bottomNav: true` põe o item na barra inferior (até 4). O layout vem do código de modelo, terceira parte `N1` a `N3` (`N1` barra inferior com menu em gaveta, `N2` barra inferior com menu em folha, `N3` só gaveta): por `?codigo=T#-C#-N#`, por `useShell().applyLayout('N2')` ou pela tela de configurações de exemplo; a escolha fica gravada no aparelho (`userConfigurable={false}` desliga). Dentro do shell, `PageHeader` e `ActionBar` se ajustam sozinhos (o título vai para o cabeçalho e os insets não se somam). Telas públicas (login, erro 404) ficam fora do grupo, em tela cheia, cada uma com o próprio `SafeAreaView`. O menu e o usuário de exemplo da vitrine (`src/config/navigation.tsx`) não fazem parte do pacote: escreva o seu.

Props opcionais do `AppShell` (todas com o padrão de sempre quando ausentes):

- `centerButton`: `{ icon?: 'brand-symbol' | ícone; accessibilityLabel?: string }`, o ícone e o rótulo do botão redondo do centro da barra inferior. `'brand-symbol'` desenha o símbolo da marca (`BrandConfig.symbol`; sem ele, fica o ícone de menu). O botão de menu do cabeçalho, sem barra inferior, não muda.
- `workspaces`: `{ items: { id, label }[]; activeId; onSelect(id); label? }`, o seletor de espaço (empresa, filial) no topo do menu do usuário, com o ativo marcado. Só aparece quando há `user`.
- `headerLogo`: um elemento (por exemplo, `<BrandLogo />`) no lugar do título no cabeçalho. O título continua lá só para o leitor de tela e o logo é decorativo para ele; a ajuda segue ao lado. Passe um elemento estável (declarado fora do componente ou memoizado). Para ter o título também no corpo da tela, use `<PageHeader bodyTitle />`.

## Crédito "Feito com Rendra"

`RendraCredit` (e o `AuthLayout`, que o traz no rodapé) vem ligado por padrão. Para tirar, `credit={false}` no `AuthLayout` ou simplesmente não renderizar o `RendraCredit`; para trocar, `creditText` e `creditHref`. O crédito na tela é opcional, mas a licença MIT continua exigindo o aviso de copyright e o arquivo `LICENSE` no código e em qualquer cópia.

## Limpeza do clone

Quem clona este repositório para começar um projeto novo (em vez de instalar o pacote) roda `npm run clean:clone -- --nome <nome>` uma única vez, logo depois do `npm install`. O script troca o nome e os campos de publicação do `package.json`, remove o workflow de publicação, o `build:lib` e o `verify:pack`, mantendo licença, crédito e autoria.

## Ordem de migração

Ao trazer o Rendra App para um app existente (caminho A ou B de `docs/PROMPT_MIGRACAO.md`), a ordem que menos quebra o app no meio do caminho: (1) tokens e tema (cores, tipografia, espaço); (2) `BrandProvider` e a ponte de navegação (`RendraRouterBridge` ou `RendraNavigationProvider` próprio); (3) formulários e ações (`Input`, `Select`, `Button`); (4) listagens (`Table` com `DataToolbar` e `Pagination`; `List`, `Card`, `StatCard` para listas simples); (5) feedback (`Toast`, `Alert`, `Modal`); (6) as demais telas; (7) limpeza dos estilos antigos que sobraram.

## 1. As 4 cores e o degradê

Toda paleta nasce de 4 cores mais um degradê de 3 paradas:

Quem instalou o pacote importa de `@rendra-ui/app`; quem clonou este repositório usa o caminho relativo `@/brand` (alias deste projeto). Os exemplos abaixo mostram o caminho relativo (clone); trocar por `@rendra-ui/app` é só a origem do import.

```ts
import type { PaletteSeeds } from '@/brand/palette'

const minhaMarca: PaletteSeeds = {
  id: 'minha-marca',
  name: 'Minha Marca',
  primary: '#ffcc00',
  primaryHover: '#e6b800',
  secondary: '#ff6699',
  secondaryHover: '#e0507f',
  gradient: ['#ffe680', '#ffcc00', '#b38f00'],
}
```

`createPalette` (`src/brand/palette.ts`) deriva o resto (estados hover, texto sobre cor, sidebar) por contraste, sempre garantindo AA (>= 4.5:1) nos pares texto/fundo. Se uma cor de origem não passar AA com texto branco ou preto, `createPalette` ajusta automaticamente e registra o ajuste em `palette.adjustments`.

## 2. Modelo (fonte e formato de raio)

3 modelos prontos: `T1` Safira (Poppins, raio arredondado), `T2` Equilíbrio (DM Sans), `T3` Aurora (Inter). Um modelo personalizado segue a mesma forma, em `src/theme/models.ts`.

## 3. Aplicar em runtime, sem mexer em componente

```tsx
import { useBrand } from '@/brand'

function TrocarMarca() {
  const { applyPalette, setPaletteId, setModelCode, setMode } = useBrand()

  function aplicarMinhaMarca() {
    applyPalette(minhaMarca)   // registra a paleta (createPalette por baixo)
    setPaletteId('minha-marca') // ativa a paleta registrada
    setModelCode('T1')          // troca o modelo (fonte + raio)
    setMode('system')           // claro, escuro ou 'system' (segue o SO)
  }

  return null
}
```

`useBrand().setModelAndPalette(codigo, paletteId)` troca os dois numa escrita só, quando as duas mudanças acontecem juntas (evita duas re-renderizações). Toda troca persiste localmente (`AsyncStorage`) e reflete imediatamente em `themeVars` (a mesma saída que alimenta `vars()` na `View` raiz do `BrandProvider`), sem recarregar o app.

O `BrandProvider` aceita ainda quatro props opcionais, todas com o padrão de sempre quando ausentes:

- `defaultModelCode` (um modelo, como `'T2'`; não é a constante exportada `defaultModelCode`, que é o código completo `'T1-C1-N1'`) e `defaultPaletteId` (como `'aurora'`): valem já na primeira pintura e quando nada está salvo. Uma escolha salva no armazenamento vence depois de hidratar. Um `defaultPaletteId` que não está na lista cai na primeira paleta dela.
- `palettes` (lista de `PaletteSeeds`): substitui as quatro paletas prontas, em vez de somar. O código da paleta própria é o `id` em maiúsculas. Se a paleta salva não está na lista, o registro salvo inteiro é descartado: modelo, paleta e modo voltam aos padrões (`defaultModelCode`, `defaultPaletteId` e `'system'`). Passe uma lista estável, declarada fora do componente.
- `storage={false}`: desliga a persistência (nada é lido nem gravado no `AsyncStorage`, e o provider já nasce hidratado).

## 4. Nome do produto

`BrandConfig.productName` (`src/brand/types.ts`), junto de `companyName` e `tagline`. Cada marca configurada em `src/brand/brand.config.ts` tem seu próprio `BrandConfig`.

## 5. Logotipo

`BrandConfig.symbol` (selo/símbolo) e `BrandConfig.logo` (`{ light, dark }`, logotipo completo) são campos opcionais: nenhuma arte própria é obrigatória, e o `BrandLogo` (`src/components/ui/brand-logo.tsx`) já usa um símbolo genérico interno quando `symbol` não existe. Quem for aplicar a marca pode deixar os dois campos vazios; o `BrandProvider` funciona normalmente sem eles (cor, fonte e raio já trocam de ponta a ponta pelas etapas 1-3 acima).

Com `BrandConfig.logoMode: 'image'` e `BrandConfig.logo` definido, o `BrandLogo` desenha a arte oficial (a `light` no modo claro, a `dark` no escuro e sobre o degradê, e a variante da paleta sobre a sidebar), com 32 px de altura e 96 px de largura, preservando a proporção; sem `logo`, ou com `symbolOnly`, continua o desenho atual. No `AuthLayout`, `headerBackground="none"` tira o degradê do painel de marca (o logotipo oficial vai sobre a superfície); `align="center"` centraliza, `gap` (`'fields'` ou `'section'`) troca o espaço entre os blocos e `onBack` ou `backHref` põem um botão só com ícone ("Voltar") ao lado do logotipo.

## Verificação via seletor real ou por URL

Na `/galeria`, os três `ButtonGroup` (Modelo, Paleta, Modo) trocam ao vivo pelo controle real, sem recarregar. Como alternativa (ou em qualquer outra rota), a troca de modelo/paleta/modo é verificável por parâmetro de URL: `?codigo=T#-C#` (modelo e paleta) e `?modo=claro|escuro|sistema` (modo), lidos por `ModelCodeFromUrl` dentro do `BrandProvider`. Exemplo: `/galeria?codigo=T3-C4`. A terceira parte `N1` a `N3` (`?codigo=T3-C4-N2`) escolhe o layout do `AppShell`, aplicado depois que o layout salvo é lido. O roteiro `docs/BRIEFING_MODELO.md` é o que coleta esses códigos e as escolhas de tema, cor e navegação com a pessoa, uma decisão por mensagem.
