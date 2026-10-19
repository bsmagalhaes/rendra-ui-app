import { useRouter } from 'expo-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useBrand } from '../src/brand'
import { ActionBar, Checkbox, Form, FormField, Input } from '../src/components/ui'
import { AuthScreen } from '../src/components/layout'
import { useDocumentTitle } from '../src/lib/use-document-title'
import { zBR } from '../src/lib/validators'

const schema = z
  .object({
    nome: zBR.required('Nome completo'),
    email: zBR.email(),
    telefone: zBR.phone(),
    empresa: z.string().trim().min(1, 'Informe o nome da empresa.'),
    senha: z.string().min(1, 'Senha é obrigatória.').min(8, 'A senha deve ter pelo menos 8 caracteres.'),
    confirmar: z.string().min(1, 'Confirme a senha.'),
    termos: z.boolean().refine((aceito) => aceito, 'É preciso aceitar os termos.'),
  })
  .refine((v) => v.senha === v.confirmar, { message: 'As senhas não conferem.', path: ['confirmar'] })

/**
 * Criar conta da demonstração: seis campos em coluna única (telefone com máscara) e o aceite dos
 * termos. Nada é gravado: o envio segue para a verificação em duas etapas.
 */
export default function CadastreSe() {
  const { brand } = useBrand()
  const router = useRouter()
  useDocumentTitle(`Criar conta · ${brand.productName}`)
  const form = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { nome: '', email: '', telefone: '', empresa: '', senha: '', confirmar: '', termos: false },
  })

  function onSubmit() {
    router.push('/verificacao')
  }

  return (
    <AuthScreen
      title="Crie sua conta"
      description="Preencha os dados abaixo para começar a usar a demonstração."
      back={{ href: '/login', label: 'Voltar ao login' }}
    >
      <Form form={form} onSubmit={onSubmit} className="gap-4">
        <FormField name="nome" label="Nome completo" required render={(f) => <Input {...f} />} />
        <FormField name="email" label="E-mail" required render={(f) => <Input {...f} />} />
        <FormField name="telefone" label="Telefone" required render={(f) => <Input {...f} mask="phone" hideDdi />} />
        <FormField name="empresa" label="Empresa" required render={(f) => <Input {...f} />} />
        <FormField name="senha" label="Senha" required render={(f) => <Input {...f} secureTextEntry />} />
        <FormField name="confirmar" label="Confirmar senha" required render={(f) => <Input {...f} secureTextEntry />} />
        <FormField
          name="termos"
          render={(f) => (
            <Checkbox
              label="Aceito os termos de uso"
              checked={Boolean(f.value)}
              onCheckedChange={f.onChange}
              invalid={f.invalid}
            />
          )}
        />
      </Form>
      <ActionBar sticky={false} primary={{ label: 'Criar conta', onPress: form.handleSubmit(onSubmit) }} />
    </AuthScreen>
  )
}
