import { useState } from 'react'
import { fireEvent, render } from '@testing-library/react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { Text } from '../internal/text'
import { Sheet } from './sheet'
import { nodesWithCode } from '../../test-utils/rendra-code'
import { bordasSemCor } from '../../test-utils/bordas'

function Controlada({ aberta = true }: { aberta?: boolean }) {
  const [open, setOpen] = useState(aberta)
  return (
    <BrandProvider>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="Filtros"
        footer={<Text className="text-foreground">Rodapé da folha</Text>}
        testID="folha"
      >
        <Text className="text-foreground">Conteúdo da folha</Text>
      </Sheet>
    </BrandProvider>
  )
}

describe('Sheet (FOL-001)', () => {
  it('aberta, mostra o título, o conteúdo e o rodapé, e carrega o código do catálogo', async () => {
    const { findByText, container } = await render(<Controlada />)
    expect(await findByText('Filtros')).toBeTruthy()
    expect(await findByText('Conteúdo da folha')).toBeTruthy()
    expect(await findByText('Rodapé da folha')).toBeTruthy()
    expect(nodesWithCode(container, 'FOL-001')).toHaveLength(1)
  })

  it('"Fechar" muda para fechada e o conteúdo some da tela', async () => {
    const { findByTestId, queryByText } = await render(<Controlada />)
    await fireEvent.press(await findByTestId('folha-fechar'))
    expect(queryByText('Conteúdo da folha')).toBeNull()
    expect(queryByText('Filtros')).toBeNull()
    expect(queryByText('Rodapé da folha')).toBeNull()
  })

  it('fechada, não renderiza o conteúdo', async () => {
    const { queryByText } = await render(<Controlada aberta={false} />)
    expect(queryByText('Conteúdo da folha')).toBeNull()
  })

  it('sem rodapé, não desenha a área de rodapé', async () => {
    const { queryByText } = await render(
      <BrandProvider>
        <Sheet open onOpenChange={() => {}} title="Sem rodapé">
          <Text className="text-foreground">Só conteúdo</Text>
        </Sheet>
      </BrandProvider>,
    )
    expect(await queryByText('Só conteúdo')).toBeTruthy()
    expect(queryByText('Rodapé da folha')).toBeNull()
  })

  it('as linhas da folha usam a cor do token, nunca a preta', async () => {
    const { container } = await render(<Controlada />)
    expect(bordasSemCor(container)).toEqual([])
  })
})
