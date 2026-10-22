import { act, render, screen } from '@testing-library/react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { specOf } from '../../test-utils/motion-spec'
import { staggerDelay } from '../../lib/motion/stagger'
import { Alert } from './alert'
import { EmptyState } from './empty-state'
import { toast, Toaster } from './toast'

jest.mock('../../lib/reduced-motion', () => ({ useReducedMotion: jest.fn(() => false) }))
// eslint-disable-next-line import/first
import { useReducedMotion } from '../../lib/reduced-motion'

const mockReduced = useReducedMotion as jest.Mock

beforeEach(() => {
  jest.useFakeTimers()
  mockReduced.mockReturnValue(false)
  toast.dismiss()
})
afterEach(() => jest.useRealTimers())

describe('Alert em motion="on"', () => {
  it('entra com slide curto mais fade e sai com fade quando o pai desmonta', async () => {
    await render(
      <BrandProvider motion="on">
        <Alert type="info" title="Aviso" testID="alerta" />
      </BrandProvider>,
    )
    const pai = screen.getByTestId('alerta').parent
    expect(pai).toBeTruthy()
    const entering = specOf(pai?.props.entering)
    const exiting = specOf(pai?.props.exiting)
    expect(entering).toMatchObject({ opacity: true, translateY: -8 })
    expect(exiting).toMatchObject({ opacity: true })
    expect(exiting?.translateY).toBeUndefined()
  })

  it('com movimento reduzido entra só com fade', async () => {
    mockReduced.mockReturnValue(true)
    await render(
      <BrandProvider motion="on">
        <Alert type="info" title="Aviso" testID="alerta" />
      </BrandProvider>,
    )
    expect(specOf(screen.getByTestId('alerta').parent?.props.entering)?.translateY).toBeUndefined()
  })

  it('off: sem props de Layout Animation', async () => {
    await render(
      <BrandProvider>
        <Alert type="info" title="Aviso" testID="alerta" />
      </BrandProvider>,
    )
    expect(screen.getByTestId('alerta').parent?.props.entering).toBeUndefined()
    expect(screen.getByText('Aviso')).toBeTruthy()
  })
})

describe('EmptyState em motion="on"', () => {
  it('título, descrição e ação entram em cascata (stagger)', async () => {
    await render(
      <BrandProvider motion="on">
        <EmptyState title="Nada aqui" description="Crie o primeiro item." actions={<></>} testID="vazio" />
      </BrandProvider>,
    )
    const titulo = screen.getByText('Nada aqui').parent
    const descricao = screen.getByText('Crie o primeiro item.').parent
    expect(specOf(titulo?.props.entering)?.delay).toBe(staggerDelay(1))
    expect(specOf(descricao?.props.entering)?.delay).toBe(staggerDelay(2))
  })

  it('off: o texto de sempre, sem entering', async () => {
    await render(
      <BrandProvider>
        <EmptyState title="Nada aqui" description="Crie o primeiro item." />
      </BrandProvider>,
    )
    expect(screen.getByText('Nada aqui').parent?.props.entering).toBeUndefined()
  })
})

describe('Toast em motion="on" (depende da raiz)', () => {
  it('com a raiz em on, a pilha usa slide e layout dos presets', async () => {
    await render(
      <BrandProvider motion="on">
        <Toaster />
      </BrandProvider>,
    )
    await act(async () => {
      toast.success('Salvo')
    })
    const cartao = (await screen.findByText('Salvo')).parent
    let no = cartao
    while (no && !no.props.entering) no = no.parent
    expect(specOf(no?.props.entering)).toMatchObject({ translateY: 16, opacity: true })
    expect(specOf(no?.props.exiting)).toMatchObject({ translateY: 16 })
    expect(no?.props.layout).toBeDefined()
  })

  it('com a raiz em off, continua o FadeInUp de sempre, sem layout', async () => {
    await render(
      <BrandProvider>
        <Toaster />
      </BrandProvider>,
    )
    await act(async () => {
      toast.success('Salvo')
    })
    let no = (await screen.findByText('Salvo')).parent
    while (no && !no.props.entering) no = no.parent
    expect(no?.props.entering).toBeDefined()
    expect(specOf(no?.props.entering)).toBeUndefined()
    expect(no?.props.layout).toBeUndefined()
  })
})
