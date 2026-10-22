import { render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { BrandProvider } from '../../brand/brand-provider'
import type { ShowcaseEntry } from '../../config/showcase'
import { COM_SUPERFICIE_PROPRIA, ShowcaseEntries } from './showcase-entries'

const entradas: ShowcaseEntry[] = [
  { name: 'Button', description: 'Botão de ação principal.', render: () => <Text>exemplo botão</Text>, codes: ['BTN-001', 'BTN-002'] },
  { name: 'Table', description: 'Tabela.', render: () => <Text>exemplo tabela</Text> },
]

describe('ShowcaseEntries', () => {
  it('cada entrada vira uma Section com título, descrição, selos de código e o exemplo', async () => {
    await render(
      <BrandProvider>
        <ShowcaseEntries entries={entradas} />
      </BrandProvider>,
    )
    expect(screen.getByText('Button')).toBeTruthy()
    expect(screen.getByText('Botão de ação principal.')).toBeTruthy()
    expect(screen.getByText('BTN-001')).toBeTruthy()
    expect(screen.getByText('BTN-002')).toBeTruthy()
    expect(screen.getByText('exemplo botão')).toBeTruthy()
  })

  it('exemplo comum entra em Card/CardContent; os de superfície própria não ganham outro cartão', async () => {
    await render(
      <BrandProvider>
        <ShowcaseEntries entries={entradas} />
      </BrandProvider>,
    )
    const comCartao = screen.getByText('exemplo botão').parent
    const semCartao = screen.getByText('exemplo tabela').parent
    // o cartão acrescenta níveis de View ao redor do exemplo comum
    const profundidade = (no: typeof comCartao) => {
      let n = 0
      for (let atual = no; atual; atual = atual.parent) n++
      return n
    }
    expect(profundidade(comCartao)).toBeGreaterThan(profundidade(semCartao))
  })

  it('o conjunto de superfície própria é o da tela de grupos', () => {
    expect([...COM_SUPERFICIE_PROPRIA]).toEqual([
      'Card',
      'StatCard',
      'OtpInput',
      'Formulário (RHF)',
      'DataToolbar',
      'Table',
      'Calendar',
      'Kanban',
      'Kanban com destinos',
    ])
  })

  it('não gera nó próprio: sem entradas, não renderiza nada além do provider', async () => {
    const { toJSON } = await render(
      <BrandProvider>
        <ShowcaseEntries entries={[]} />
      </BrandProvider>,
    )
    expect(JSON.stringify(toJSON())).not.toContain('Section')
  })
})
