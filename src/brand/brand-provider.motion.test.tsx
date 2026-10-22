import { render, waitFor } from '@testing-library/react-native'
import { Text } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { BrandProvider } from './brand-provider'
import { MotionProvider, useMotion } from '../lib/motion/context'

function Sonda() {
  return <Text testID="motion">{useMotion()}</Text>
}

async function hidratado(ui: React.ReactElement) {
  const view = await render(ui)
  await waitFor(() => expect(view.getByTestId('rendra-T1-C1')).toBeTruthy(), { timeout: 30000 })
  return view
}

describe('BrandProvider e a prop motion', () => {
  beforeEach(() => AsyncStorage.clear())

  it('sem a prop, o contexto é off', async () => {
    const view = await render(
      <BrandProvider>
        <Sonda />
      </BrandProvider>,
    )
    expect(view.getByTestId('motion', { includeHiddenElements: true }).props.children).toBe('off')
  })

  it('motion="off" gera a mesma árvore da ausência da prop, sem nó novo', async () => {
    const semProp = await hidratado(
      <BrandProvider>
        <Sonda />
      </BrandProvider>,
    )
    const comOff = await hidratado(
      <BrandProvider motion="off">
        <Sonda />
      </BrandProvider>,
    )
    expect(JSON.stringify(comOff.toJSON())).toBe(JSON.stringify(semProp.toJSON()))
  })

  it('motion="on" faz useMotion() ser on dentro', async () => {
    const view = await render(
      <BrandProvider motion="on">
        <Sonda />
      </BrandProvider>,
    )
    expect(view.getByTestId('motion', { includeHiddenElements: true }).props.children).toBe('on')
  })

  it('B6: um MotionProvider on por fora continua on dentro de um BrandProvider sem a prop', async () => {
    const view = await render(
      <MotionProvider motion="on">
        <BrandProvider>
          <Sonda />
        </BrandProvider>
      </MotionProvider>,
    )
    expect(view.getByTestId('motion', { includeHiddenElements: true }).props.children).toBe('on')
  })
})
