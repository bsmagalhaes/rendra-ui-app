// Correção de execução da Tarefa F3: `tabIndex` já é encaminhado pelo `View`/`ScrollView` do
// react-native-web até o elemento DOM
// (react-native-web/src/modules/forwardedProps), mas nenhuma tipagem de `react-native`/`expo`
// declara essa prop em `ViewProps` (só em `TextProps`, ver node_modules/expo/types/react-native-web.d.ts).
// `ScrollViewProps` estende `ViewProps` (node_modules/react-native/Libraries/Components/ScrollView/ScrollView.d.ts),
// então esta única declaração cobre `View` e `ScrollView`. Necessário para corrigir uma violação
// real do axe (regra scrollable-region-focusable): uma região rolável sem nenhum conteúdo focável
// dentro precisa ser focável ela mesma via teclado.
import 'react-native'

declare module 'react-native' {
  interface ViewProps {
    /** @platform web */
    tabIndex?: number
    /** @platform web. Encaminhado pelo react-native-web ao DOM; marca o link do destino ativo (`'page'`) e o item escolhido de um menu (`'true'`). */
    'aria-current'?: 'page' | 'true'
    /**
     * @platform web
     * `dataSet` chega ao DOM como atributos `data-*` (react-native-web,
     * `modules/createDOMProps/index.js`, `hyphenateString`): `dataSet={{ rendra: 'BTN-001' }}`
     * vira `data-rendra="BTN-001"`. Fora do web, a prop é ignorada. Nenhuma tipagem de
     * `react-native`/`expo` a declara (grep vazio em
     * `node_modules/react-native/Libraries/Components/View`); pré-requisito de `labelStyle`
     * (Bloco 5) e `data-rendra` (Bloco 6, seção 3.2 do levantamento da Sincronização 1).
     */
    dataSet?: Record<string, string | number>
    /**
     * @platform web
     * Teclas na `View` focavel (`tabIndex`). O react-native-web encaminha `onKeyDown` ao DOM
     * (`modules/forwardedProps`, `keyboardProps`); `PressableProps` estende `ViewProps` e herda a
     * declaracao. Usado pela alca da `List` reordenavel (setas para cima e para baixo). So os
     * tipos estritos do RN (`react-native-strict-api`) declaram `onKeyDown`; os tipos usados pelo
     * app nao.
     */
    onKeyDown?: (event: { key: string; preventDefault: () => void }) => void
  }

  interface TextProps {
    /**
     * @platform web
     * `TextProps` não estende `ViewProps` (só `TextPropsIOS`, `TextPropsAndroid`,
     * `AccessibilityProps`), por isso precisa da própria declaração; mesmo mecanismo de
     * `ViewProps.dataSet` acima (usado pelo `Label`, que é `Text`, Bloco 5).
     */
    dataSet?: Record<string, string | number>
  }
}
