import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useBrand } from '../src/brand'
import { ActionBar, Form, FormField, Input } from '../src/components/ui'
import { AuthScreen } from '../src/components/layout'
import { useRendraNavigation } from '../src/navigation/rendra-navigation'
import { useDocumentTitle } from '../src/lib/use-document-title'
import { zBR } from '../src/lib/validators'

const schema = z.object({ email: zBR.email() })

/**
 * Recuperar a senha da demonstração: pede o e-mail e segue para a verificação em duas etapas com
 * `?origem=senha`, que depois leva à nova senha. Nada é enviado de verdade.
 */
export default function EsqueciSenha() {
  const { brand } = useBrand()
  const { navigate } = useRendraNavigation()
  useDocumentTitle(`Esqueci a senha · ${brand.productName}`)
  const form = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { email: '' },
  })

  function onSubmit() {
    navigate('/verificacao?origem=senha')
  }

  return (
    <AuthScreen
      title="Esqueci a senha"
      description="Informe o e-mail da conta e enviaremos um código para você criar uma nova senha."
      back={{ href: '/login', label: 'Voltar ao login' }}
    >
      <Form form={form} onSubmit={onSubmit} className="gap-4">
        <FormField name="email" label="E-mail" required render={(f) => <Input {...f} />} />
      </Form>
      <ActionBar sticky={false} primary={{ label: 'Enviar código', onPress: form.handleSubmit(onSubmit) }} />
    </AuthScreen>
  )
}
