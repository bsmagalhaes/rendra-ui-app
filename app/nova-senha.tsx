import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Text } from '../src/components/internal/text'
import { useBrand } from '../src/brand'
import { ActionBar, Form, FormField, Input, Progress, toast } from '../src/components/ui'
import type { ProgressTone } from '../src/components/ui/progress'
import { AuthScreen } from '../src/components/layout'
import { passwordStrength, type NivelSenha } from '../src/demo/password-strength'
import { useDocumentTitle } from '../src/lib/use-document-title'

const schema = z
  .object({
    senha: z.string().min(1, 'Nova senha é obrigatória.').min(8, 'A senha deve ter pelo menos 8 caracteres.'),
    confirmar: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((v) => v.senha === v.confirmar, { message: 'As senhas não conferem.', path: ['confirmar'] })

const toneDoNivel: Record<NivelSenha, ProgressTone> = { fraca: 'error', média: 'warning', forte: 'success' }

/**
 * Definir a nova senha da demonstração (destino de "Esqueci a senha" depois da verificação): o
 * medidor de força é um `Progress` que muda de tom com o nível. Salvar avisa e volta ao login.
 */
export default function NovaSenha() {
  const { brand } = useBrand()
  const router = useRouter()
  useDocumentTitle(`Nova senha · ${brand.productName}`)
  const form = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { senha: '', confirmar: '' },
  })
  const senha = useWatch({ control: form.control, name: 'senha' })
  const forca = passwordStrength(senha)

  function onSubmit() {
    toast.success('Senha alterada com sucesso')
    router.replace('/login')
  }

  return (
    <AuthScreen
      title="Crie uma nova senha"
      description="Escolha uma senha que você ainda não usou neste app."
      back={{ href: '/login', label: 'Voltar ao login' }}
    >
      <Form form={form} onSubmit={onSubmit} className="gap-4">
        <FormField name="senha" label="Nova senha" required render={(f) => <Input {...f} secureTextEntry />} />
        {senha.length > 0 ? (
          <View className="gap-2">
            <Progress value={forca.percentual} tone={toneDoNivel[forca.nivel]} accessibilityLabel="Força da senha" />
            <Text className="text-sm text-muted-foreground">{`Força da senha: ${forca.nivel}`}</Text>
          </View>
        ) : null}
        <FormField name="confirmar" label="Confirmar senha" required render={(f) => <Input {...f} secureTextEntry />} />
      </Form>
      <ActionBar sticky={false} primary={{ label: 'Salvar nova senha', onPress: form.handleSubmit(onSubmit) }} />
    </AuthScreen>
  )
}
