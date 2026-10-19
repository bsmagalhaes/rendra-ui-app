import { useState } from 'react'
import { Text, TextInput } from 'react-native'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import { BrandProvider } from '../../brand/brand-provider'
import { Stepper, Wizard, type WizardProps, type WizardStep } from './wizard'
import { nodesWithCode } from '../../test-utils/rendra-code'

const etapas: WizardStep[] = [
  { id: 'dados', title: 'Dados da empresa' },
  { id: 'contato', title: 'Contato', description: 'Quem responde pela conta' },
  { id: 'plano', title: 'Plano' },
  { id: 'revisao', title: 'Revisão' },
]

describe('Stepper', () => {
  it('mostra "Etapa 1 de 4", o título da primeira etapa, a barra em 25% e o código WIZ-002', async () => {
    const { findByText, findByRole, container } = await render(
      <BrandProvider>
        <Stepper steps={etapas} current={0} />
      </BrandProvider>,
    )
    expect(await findByText('Etapa 1 de 4')).toBeTruthy()
    expect(await findByText('Dados da empresa')).toBeTruthy()
    expect((await findByRole('progressbar')).props.accessibilityValue.now).toBe(25)
    expect(nodesWithCode(container, 'WIZ-002')).toHaveLength(1)
  })

  it('com current = 2 mostra "Etapa 3 de 4", o título da 3ª e a barra em 75% (rótulo "Progresso")', async () => {
    const { findByText, findByRole, queryByText } = await render(
      <BrandProvider>
        <Stepper steps={etapas} current={2} />
      </BrandProvider>,
    )
    expect(await findByText('Etapa 3 de 4')).toBeTruthy()
    expect(await findByText('Plano')).toBeTruthy()
    expect(queryByText('Dados da empresa')).toBeNull()
    const barra = await findByRole('progressbar')
    expect(barra.props.accessibilityValue.now).toBe(75)
    expect(barra.props.accessibilityLabel).toBe('Progresso')
  })

  it('a última etapa fecha a barra em 100%', async () => {
    const { findByRole } = await render(
      <BrandProvider>
        <Stepper steps={etapas} current={3} />
      </BrandProvider>,
    )
    expect((await findByRole('progressbar')).props.accessibilityValue.now).toBe(100)
  })

  it('errors contendo a etapa atual mostra "Revise esta etapa"; erro em outra etapa ou sem erros não mostra', async () => {
    const { findByText, queryByText, rerender } = await render(
      <BrandProvider>
        <Stepper steps={etapas} current={1} errors={[1]} />
      </BrandProvider>,
    )
    expect(await findByText('Revise esta etapa')).toBeTruthy()
    await rerender(
      <BrandProvider>
        <Stepper steps={etapas} current={1} errors={[0]} />
      </BrandProvider>,
    )
    expect(queryByText('Revise esta etapa')).toBeNull()
    await rerender(
      <BrandProvider>
        <Stepper steps={etapas} current={1} />
      </BrandProvider>,
    )
    expect(queryByText('Revise esta etapa')).toBeNull()
  })
})

const tres: WizardStep[] = [
  { id: 'dados', title: 'Dados' },
  { id: 'contato', title: 'Contato' },
  { id: 'revisao', title: 'Revisão' },
]

// O Wizard só monta o filho da etapa atual: o estado que precisa sobreviver ao "Voltar" mora no consumidor.
function Formulario(props: Partial<WizardProps>) {
  const [nome, setNome] = useState('')
  return (
    <BrandProvider>
      <Wizard steps={tres} {...props}>
        {[
          <TextInput key="a" accessibilityLabel="Nome" value={nome} onChangeText={setNome} />,
          <Text key="b">Conteúdo do contato</Text>,
          <Text key="c">{`Revisar ${nome}`}</Text>,
        ]}
      </Wizard>
    </BrandProvider>
  )
}

describe('Wizard', () => {
  it('mostra a primeira etapa, o indicador, o código WIZ-001 e o botão "Avançar"', async () => {
    const { findByText, findByLabelText, findByRole, queryByText, container } = await render(<Formulario />)
    expect(await findByLabelText('Nome')).toBeTruthy()
    expect(await findByText('Etapa 1 de 3')).toBeTruthy()
    expect(queryByText('Conteúdo do contato')).toBeNull()
    expect(await findByRole('button', { name: 'Avançar' })).toBeTruthy()
    expect(nodesWithCode(container, 'WIZ-001')).toHaveLength(1)
    expect(nodesWithCode(container, 'WIZ-002')).toHaveLength(1)
  })

  it('"Avançar" troca o conteúdo e o indicador acompanha; "Voltar" retorna e mantém os dados do consumidor', async () => {
    const { findByText, findByLabelText, findByRole, queryByLabelText } = await render(<Formulario />)
    await fireEvent.changeText(await findByLabelText('Nome'), 'Ana')
    await fireEvent.press(await findByRole('button', { name: 'Avançar' }))
    expect(await findByText('Conteúdo do contato')).toBeTruthy()
    expect(await findByText('Etapa 2 de 3')).toBeTruthy()
    expect(queryByLabelText('Nome')).toBeNull()
    await fireEvent.press(await findByRole('button', { name: 'Avançar' }))
    expect(await findByText('Revisar Ana')).toBeTruthy()
    await fireEvent.press(await findByRole('button', { name: 'Voltar' }))
    await fireEvent.press(await findByRole('button', { name: 'Voltar' }))
    expect((await findByLabelText('Nome')).props.value).toBe('Ana')
    expect(await findByText('Etapa 1 de 3')).toBeTruthy()
  })

  it('validação que devolve false mantém a etapa e mostra "Revise esta etapa"; passar a validar tira o aviso e avança', async () => {
    let valido = false
    const onValidateStep = jest.fn(() => valido)
    const { findByText, findByRole, queryByText } = await render(<Formulario onValidateStep={onValidateStep} />)
    await fireEvent.press(await findByRole('button', { name: 'Avançar' }))
    expect(await findByText('Revise esta etapa')).toBeTruthy()
    expect(await findByText('Etapa 1 de 3')).toBeTruthy()
    expect(onValidateStep).toHaveBeenCalledWith(0)
    valido = true
    await fireEvent.press(await findByRole('button', { name: 'Avançar' }))
    expect(await findByText('Etapa 2 de 3')).toBeTruthy()
    expect(queryByText('Revise esta etapa')).toBeNull()
    await fireEvent.press(await findByRole('button', { name: 'Voltar' }))
    expect(queryByText('Revise esta etapa')).toBeNull()
  })

  it('na primeira etapa, com onCancel aparece "Cancelar" e chama o retorno; sem onCancel não há botão à esquerda', async () => {
    const onCancel = jest.fn()
    const { findByRole, queryByRole, rerender } = await render(<Formulario onCancel={onCancel} />)
    await fireEvent.press(await findByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    await rerender(<Formulario />)
    expect(queryByRole('button', { name: 'Cancelar' })).toBeNull()
    expect(queryByRole('button', { name: 'Voltar' })).toBeNull()
  })

  it('na última etapa o botão vira finishLabel e dispara onFinish; sem validação por etapa tudo avança', async () => {
    const onFinish = jest.fn()
    const { findByRole, queryByRole } = await render(<Formulario onFinish={onFinish} finishLabel="Criar conta" />)
    await fireEvent.press(await findByRole('button', { name: 'Avançar' }))
    await fireEvent.press(await findByRole('button', { name: 'Avançar' }))
    expect(queryByRole('button', { name: 'Avançar' })).toBeNull()
    await fireEvent.press(await findByRole('button', { name: 'Criar conta' }))
    await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1))
  })

  it('o rótulo padrão da última etapa é "Concluir"', async () => {
    const { findByRole } = await render(<Formulario />)
    await fireEvent.press(await findByRole('button', { name: 'Avançar' }))
    await fireEvent.press(await findByRole('button', { name: 'Avançar' }))
    expect(await findByRole('button', { name: 'Concluir' })).toBeTruthy()
  })

  it('onValidateStep assíncrono mostra "Validando..." enquanto aguarda e depois avança', async () => {
    let liberar: (v: boolean) => void = () => {}
    const onValidateStep = () => new Promise<boolean>((resolve) => { liberar = resolve })
    const { findByRole, findByText, queryByText } = await render(<Formulario onValidateStep={onValidateStep} />)
    // O toque só resolve quando o `onPress` assíncrono termina: guarda a promessa e solta a validação depois.
    const toque = fireEvent.press(await findByRole('button', { name: 'Avançar' }))
    expect(await findByText('Validando...')).toBeTruthy()
    expect(queryByText('Etapa 2 de 3')).toBeNull()
    await act(async () => liberar(true))
    await toque
    expect(await findByText('Etapa 2 de 3')).toBeTruthy()
    expect(queryByText('Validando...')).toBeNull()
  })

  it('na última etapa o aguardo mostra "Concluindo..." enquanto onFinish não termina', async () => {
    let terminar: () => void = () => {}
    const onFinish = () => new Promise<void>((resolve) => { terminar = resolve })
    const { findByRole, findByText, queryByText } = await render(<Formulario onFinish={onFinish} />)
    await fireEvent.press(await findByRole('button', { name: 'Avançar' }))
    await fireEvent.press(await findByRole('button', { name: 'Avançar' }))
    const toque = fireEvent.press(await findByRole('button', { name: 'Concluir' }))
    expect(await findByText('Concluindo...')).toBeTruthy()
    await act(async () => terminar())
    await toque
    await waitFor(() => expect(queryByText('Concluindo...')).toBeNull())
  })

  it('se a validação rejeitar, o botão volta ao normal (busy sai no finally), a etapa não muda e ela fica marcada com erro', async () => {
    const onValidateStep = jest.fn(() => Promise.reject(new Error('falha de rede')))
    const { findByRole, findByText, queryByText } = await render(<Formulario onValidateStep={onValidateStep} />)
    await fireEvent.press(await findByRole('button', { name: 'Avançar' }))
    await waitFor(() => expect(queryByText('Validando...')).toBeNull())
    expect(await findByRole('button', { name: 'Avançar' })).toBeTruthy()
    expect(await findByText('Etapa 1 de 3')).toBeTruthy()
    expect(await findByText('Revise esta etapa')).toBeTruthy()
  })

  it('stickyFooter liga o rodapé fixo (borda superior); o padrão segue junto do conteúdo', async () => {
    const { findByTestId, rerender } = await render(<Formulario />)
    expect(String((await findByTestId('wizard-rodape')).props.className ?? '')).not.toContain('border-t')
    await rerender(<Formulario stickyFooter />)
    expect(String((await findByTestId('wizard-rodape')).props.className ?? '')).toContain('border-t')
  })

  it('rótulos novos: nextLabel troca "Avançar", backLabel troca "Voltar" e cancelLabel troca "Cancelar"', async () => {
    const { findByRole, queryByRole } = await render(
      <Formulario nextLabel="Continuar" backLabel="Anterior" cancelLabel="Sair" onCancel={() => {}} />,
    )
    expect(await findByRole('button', { name: 'Sair' })).toBeTruthy()
    expect(queryByRole('button', { name: 'Cancelar' })).toBeNull()
    await fireEvent.press(await findByRole('button', { name: 'Continuar' }))
    expect(queryByRole('button', { name: 'Avançar' })).toBeNull()
    expect(await findByRole('button', { name: 'Anterior' })).toBeTruthy()
    expect(queryByRole('button', { name: 'Voltar' })).toBeNull()
  })

  it('finishLabel continua valendo na última etapa com nextLabel passado', async () => {
    const { findByRole } = await render(<Formulario nextLabel="Continuar" finishLabel="Criar conta" />)
    await fireEvent.press(await findByRole('button', { name: 'Continuar' }))
    await fireEvent.press(await findByRole('button', { name: 'Continuar' }))
    expect(await findByRole('button', { name: 'Criar conta' })).toBeTruthy()
  })

  it('com onSkip, o menu "Mais ações" mostra "Pular"; skipLabel troca o texto', async () => {
    const { findByLabelText, findByText, rerender } = await render(<Formulario onSkip={() => {}} />)
    await fireEvent.press(await findByLabelText('Mais ações'))
    expect(await findByText('Pular')).toBeTruthy()
    await rerender(<Formulario onSkip={() => {}} skipLabel="Ignorar" />)
    await fireEvent.press(await findByLabelText('Mais ações'))
    expect(await findByText('Ignorar')).toBeTruthy()
  })

  it('tocar em "Pular" avança sem validar a etapa e chama onSkip uma vez', async () => {
    const onValidateStep = jest.fn(() => false)
    const onSkip = jest.fn()
    const { findByLabelText, findByText } = await render(<Formulario onValidateStep={onValidateStep} onSkip={onSkip} />)
    await fireEvent.press(await findByLabelText('Mais ações'))
    await fireEvent.press(await findByText('Pular'))
    expect(await findByText('Etapa 2 de 3')).toBeTruthy()
    expect(onValidateStep).not.toHaveBeenCalled()
    expect(onSkip).toHaveBeenCalledTimes(1)
  })

  it('sem onSkip não há menu "Mais ações"', async () => {
    const { findByRole, queryByLabelText } = await render(<Formulario />)
    expect(await findByRole('button', { name: 'Avançar' })).toBeTruthy()
    expect(queryByLabelText('Mais ações')).toBeNull()
  })

  it('"Pular" não aparece na última etapa (não há próxima etapa para avançar)', async () => {
    const { findByRole, findByLabelText, findByText, queryByLabelText } = await render(<Formulario onSkip={() => {}} />)
    await fireEvent.press(await findByLabelText('Mais ações'))
    await fireEvent.press(await findByText('Pular'))
    await fireEvent.press(await findByRole('button', { name: 'Avançar' }))
    expect(await findByRole('button', { name: 'Concluir' })).toBeTruthy()
    expect(queryByLabelText('Mais ações')).toBeNull()
  })

  it('"Pular" fica desabilitado enquanto a validação está em curso', async () => {
    let liberar: (v: boolean) => void = () => {}
    const onValidateStep = () => new Promise<boolean>((resolve) => { liberar = resolve })
    const onSkip = jest.fn()
    const { findByRole, findByLabelText, findByText } = await render(<Formulario onValidateStep={onValidateStep} onSkip={onSkip} />)
    const toque = fireEvent.press(await findByRole('button', { name: 'Avançar' }))
    expect(await findByText('Validando...')).toBeTruthy()
    await fireEvent.press(await findByLabelText('Mais ações'))
    await fireEvent.press(await findByText('Pular'))
    expect(onSkip).not.toHaveBeenCalled()
    await act(async () => liberar(true))
    await toque
  })

  it('gap: sem a prop a raiz tem gap-8 (section); gap="fields" troca por gap-4; o conteúdo interno segue gap-6', async () => {
    const { findByLabelText, rerender, container } = await render(<Formulario />)
    const raiz = () => nodesWithCode(container, 'WIZ-001')[0]!.props.className.split(' ') as string[]
    const conteudo = async () => String((await findByLabelText('Nome')).parent?.props.className).split(' ')
    expect(raiz()).toContain('gap-8')
    expect(await conteudo()).toContain('gap-6')
    await rerender(<Formulario gap="fields" />)
    expect(raiz()).toContain('gap-4')
    expect(raiz()).not.toContain('gap-8')
    expect(await conteudo()).toContain('gap-6')
    await rerender(<Formulario gap="section" />)
    expect(raiz()).toContain('gap-8')
  })
})
