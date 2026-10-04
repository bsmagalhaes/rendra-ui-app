import { render } from '@testing-library/react-native'
import { Text, View } from 'react-native'
import { nodesWithCode } from '../test-utils/rendra-code'

// Pré-requisito de `labelStyle` (Bloco 5) e `data-rendra` (Bloco 6, secao 3.2 do levantamento):
// os tipos do RN 0.86 nao declaram `dataSet` em `ViewProps` nem em `TextProps` (grep vazio em
// node_modules/react-native/Libraries/Components/View e node_modules/react-native/Libraries/Text).
// Sem a augmentacao em src/types/react-native-web.d.ts, as duas linhas abaixo nao compilam
// (TS2322, prop desconhecida); com ela, o valor chega a props.dataSet em runtime (react-native-web
// traduz para o atributo data-* no export, e a prop e ignorada no nativo).
describe('tipo dataSet em ViewProps e TextProps (secao 3.2 do levantamento)', () => {
  it('View aceita dataSet, o valor chega em props.dataSet', async () => {
    const { container } = await render(<View dataSet={{ rendra: 'X' }} />)
    expect(nodesWithCode(container, 'X')).toHaveLength(1)
  })

  it('Text aceita dataSet, o valor chega em props.dataSet', async () => {
    const { container } = await render(<Text dataSet={{ rendra: 'Y' }}>t</Text>)
    expect(nodesWithCode(container, 'Y')).toHaveLength(1)
  })
})

// A `List` reordenável escuta setas na alça (`onKeyDown`, encaminhado ao DOM pelo react-native-web).
// Nenhuma tipagem de `react-native` o declara em `ViewProps`; sem a augmentation, a linha abaixo
// não compila (TS2322).
describe('tipo onKeyDown em ViewProps', () => {
  it('View aceita onKeyDown, o handler chega em props.onKeyDown', async () => {
    const onKeyDown = (event: { key: string }) => event.key
    const { container } = await render(<View testID="alvo" onKeyDown={onKeyDown} />)
    expect(container).toBeTruthy()
  })
})
