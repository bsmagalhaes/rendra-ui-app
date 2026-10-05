import { render } from '@testing-library/react-native'
import { View } from 'react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card'
import { nodesWithCode } from '../../test-utils/rendra-code'
import { bordasSemCor, classesDo } from '../../test-utils/bordas'

describe('Card', () => {
  it('CardContent logo após CardHeader não tem padding superior', async () => {
    const { findByTestId } = await render(
      <BrandProvider>
        <Card>
          <CardHeader>
            <CardTitle>Título</CardTitle>
          </CardHeader>
          <CardContent testID="conteudo">
            <View />
          </CardContent>
        </Card>
      </BrandProvider>,
    )
    const content = await findByTestId('conteudo')
    expect(content.props.className.split(' ')).toContain('pb-4')
    expect(content.props.className.split(' ')).not.toContain('p-4')
  })

  it('CardContent sem CardHeader antes mantém padding em todos os lados', async () => {
    const { findByTestId } = await render(
      <BrandProvider>
        <Card>
          <CardContent testID="conteudo">
            <View />
          </CardContent>
        </Card>
      </BrandProvider>,
    )
    const content = await findByTestId('conteudo')
    expect(content.props.className.split(' ')).toContain('p-4')
  })

  it('CardTitle help renderiza InfoHint com accessibilityLabel "Sobre: Título"', async () => {
    const { findByLabelText } = await render(
      <BrandProvider>
        <Card>
          <CardHeader>
            <CardTitle help="Texto de ajuda">Título</CardTitle>
          </CardHeader>
        </Card>
      </BrandProvider>,
    )
    expect(await findByLabelText('Sobre: Título')).toBeTruthy()
  })

  it('CardHeader actions renderiza as ações ao lado do título', async () => {
    const { findByText } = await render(
      <BrandProvider>
        <Card>
          <CardHeader actions={<View />}>
            <CardTitle>Título</CardTitle>
            <CardDescription>Descrição</CardDescription>
          </CardHeader>
        </Card>
      </BrandProvider>,
    )
    expect(await findByText('Descrição')).toBeTruthy()
  })

  it('CardFooter renderiza com border-t', async () => {
    const { findByTestId } = await render(
      <BrandProvider>
        <Card>
          <CardFooter testID="rodape">
            <View />
          </CardFooter>
        </Card>
      </BrandProvider>,
    )
    const footer = await findByTestId('rodape')
    expect(footer.props.className.split(' ')).toContain('border-t')
  })

  it('sem prop code, carrega dataSet.rendra = CARD-001 (item D4 do levantamento da Sincronizacao 1)', async () => {
    const { container } = await render(
      <BrandProvider>
        <Card>
          <View />
        </Card>
      </BrandProvider>,
    )
    expect(nodesWithCode(container, 'CARD-001')).toHaveLength(1)
  })
})


describe('Card: borda com a cor do token', () => {
  // Largura de borda sem cor sai preta no web e no nativo; o `Card` (e por ele o `StatCard` e o
  // `FormSection`) e o `CardFooter` precisam de `border-border` no mesmo literal.
  it('Card e CardFooter trazem border-border e nenhuma borda sem cor', async () => {
    const { container } = await render(
      <BrandProvider>
        <Card>
          <CardFooter testID="rodape">
            <View />
          </CardFooter>
        </Card>
      </BrandProvider>,
    )
    const [cartao] = nodesWithCode(container, 'CARD-001')
    expect(classesDo(cartao)).toEqual(expect.arrayContaining(['border', 'border-border']))
    const [rodape] = container.queryAll((no) => no.props.testID === 'rodape')
    expect(classesDo(rodape)).toEqual(expect.arrayContaining(['border-t', 'border-border']))
    expect(bordasSemCor(container)).toEqual([])
  })
})
