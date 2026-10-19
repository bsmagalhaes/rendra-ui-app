import { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Text } from '../src/components/internal/text'
import { useBrand } from '../src/brand'
import { ActionBar, Alert, OtpInput, toast } from '../src/components/ui'
import { AuthScreen } from '../src/components/layout'
import { useDocumentTitle } from '../src/lib/use-document-title'

const CODIGO_INVALIDO = '000000'
const ESPERA_REENVIO = 30

/**
 * Verificação em duas etapas da demonstração: qualquer código de 6 dígitos vale, menos `000000`
 * (recusado com aviso). Vindo de "Esqueci a senha" (`?origem=senha`) segue para a nova senha; do
 * login, avisa e segue para o painel. O reenvio só libera depois de 30 segundos.
 */
export default function Verificacao() {
  const { brand } = useBrand()
  const router = useRouter()
  const { origem } = useLocalSearchParams<{ origem?: string }>()
  useDocumentTitle(`Verificação · ${brand.productName}`)
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [segundos, setSegundos] = useState(ESPERA_REENVIO)
  const contando = segundos > 0

  useEffect(() => {
    if (!contando) return
    const id = setInterval(() => setSegundos((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [contando])

  function verificar(valor: string) {
    if (valor.length < 6) {
      setErro('Informe os 6 dígitos do código.')
      return
    }
    if (valor === CODIGO_INVALIDO) {
      setErro('Código inválido. Tente novamente.')
      return
    }
    setErro(null)
    if (origem === 'senha') {
      router.replace('/nova-senha')
      return
    }
    toast.success('Bem-vindo de volta')
    router.replace('/painel')
  }

  function reenviar() {
    toast.info('Código reenviado (simulado)')
    setCodigo('')
    setErro(null)
    setSegundos(ESPERA_REENVIO)
  }

  return (
    <AuthScreen
      title="Verificação em duas etapas"
      description="Digite o código de 6 dígitos que enviamos para você. Na demonstração, qualquer código vale, menos 000000."
      back={{ href: '/login', label: 'Voltar ao login' }}
    >
      {erro ? <Alert type="error" title={erro} /> : null}
      <OtpInput
        value={codigo}
        onChange={(valor) => {
          setCodigo(valor)
          if (erro) setErro(null)
        }}
        onComplete={verificar}
        invalid={erro !== null}
      />
      {contando ? (
        <Text className="text-sm text-muted-foreground">{`Reenviar em ${segundos} s`}</Text>
      ) : null}
      <ActionBar
        sticky={false}
        primary={{ label: 'Verificar', onPress: () => verificar(codigo) }}
        cancel={contando ? undefined : { label: 'Reenviar código', onPress: reenviar }}
      />
    </AuthScreen>
  )
}
