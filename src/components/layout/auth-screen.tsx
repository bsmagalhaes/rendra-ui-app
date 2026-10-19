import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthLayout, type AuthLayoutProps } from './auth-layout'

export type AuthScreenProps = AuthLayoutProps

/**
 * Casca das telas de autenticação (login, recuperar senha, verificação, nova senha e criar
 * conta): tela cheia fora do `AppShell`, com o próprio `SafeAreaView` (só o inset superior; o
 * rodapé de ações é do `ActionBar` da tela), o teclado que não cobre o campo ativo e a rolagem.
 * Recebe as mesmas props do `AuthLayout`.
 */
export function AuthScreen(props: AuthScreenProps) {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background" testID="safe-area-tela" dataSet={{ rendra: 'AUTH-001' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView
          tabIndex={0}
          className="flex-1"
          contentContainerClassName="flex-grow"
          keyboardShouldPersistTaps="handled"
        >
          <AuthLayout {...props} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
