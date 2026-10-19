import { View } from 'react-native'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useBrand } from '../src/brand'
import { ActionBar, Alert, Checkbox, Form, FormField, Input, TextLink } from '../src/components/ui'
import { AuthScreen } from '../src/components/layout'
import { useRendraNavigation } from '../src/navigation/rendra-navigation'
import { useDocumentTitle } from '../src/lib/use-document-title'
import { zBR } from '../src/lib/validators'

const schema = z.object({
  email: zBR.email(),
  senha: z.string().min(1, 'Senha é obrigatória.').min(6, 'A senha deve ter pelo menos 6 caracteres.'),
  lembrar: z.boolean(),
})

/**
 * Tela de entrada de exemplo, fora do grupo `(shell)`: tela cheia (a casca `AuthScreen` traz o
 * `SafeAreaView` só com o inset superior; o rodapé é do `ActionBar`). Na demonstração qualquer
 * e-mail válido com senha de 6 ou mais caracteres segue para a verificação em duas etapas: quem
 * usa o boilerplate troca `onSubmit` pela chamada da própria API.
 */
export default function Login() {
  const { brand } = useBrand()
  const { navigate } = useRendraNavigation()
  useDocumentTitle(`Entrar · ${brand.productName}`)
  const form = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { email: '', senha: '', lembrar: false },
  })

  function onSubmit() {
    navigate('/verificacao')
  }

  return (
    <AuthScreen
      title="Acesse sua conta"
      description="Entre com seu e-mail e senha para continuar."
      footer={
        <View className="items-start">
          <TextLink href="/esqueci-senha">Esqueci a senha</TextLink>
          <TextLink href="/cadastre-se">Criar conta</TextLink>
        </View>
      }
    >
      <Alert
        type="info"
        title="Modo demonstração"
        description="Use qualquer e-mail e uma senha com 6 ou mais caracteres."
      />
      <Form form={form} onSubmit={onSubmit} className="gap-4">
        <FormField name="email" label="E-mail" required render={(f) => <Input {...f} />} />
        <FormField name="senha" label="Senha" required render={(f) => <Input {...f} secureTextEntry />} />
        <FormField
          name="lembrar"
          render={(f) => <Checkbox label="Lembrar de mim" checked={Boolean(f.value)} onCheckedChange={f.onChange} />}
        />
      </Form>
      <ActionBar sticky={false} primary={{ label: 'Entrar', onPress: form.handleSubmit(onSubmit) }} />
    </AuthScreen>
  )
}
