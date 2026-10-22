import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { isRunningInExpoGo } from 'expo'
import * as SplashScreen from 'expo-splash-screen'
import { BrandProvider, ThemedStatusBar } from '../src/brand'
import { brandConfigs } from '../src/brand/brand.config'
import { RendraRouterBridge, ModelCodeFromUrl } from '../src/router-bridge'
import { Toaster } from '../src/components/ui'
import { RendraSplash } from '../src/components/splash/rendra-splash'
import { useRendraFonts } from '../src/theme/fonts'
import { useReducedMotion } from '../src/lib/reduced-motion'
import { screenAnimation } from '../src/lib/motion/screen-animation'
import { registerIconInterop } from '../src/lib/icon-interop'
import '../global.css'

registerIconInterop()

// Erro 500: se uma rota quebrar, o Expo Router mostra este componente no lugar do layout raiz.
export { RootErrorBoundary as ErrorBoundary } from '../src/demo/root-error-boundary'

SplashScreen.preventAutoHideAsync()
// O Expo Go não aceita `setOptions` (avisa no console); em build de desenvolvimento e de produção
// o splash nativo sai com fade para revelar o overlay animado.
if (!isRunningInExpoGo()) SplashScreen.setOptions({ fade: true, duration: 300 })

/**
 * Costura entre o splash nativo e o animado: o overlay já entrou na árvore quando este efeito
 * roda (efeito depois do commit que o desenhou), então o splash nativo só sai com o overlay
 * pronto, sem quadro em branco. Fica em `app/` para o pacote não depender do `expo-splash-screen`.
 */
function SplashGate() {
  const [visivel, setVisivel] = useState(true)

  useEffect(() => {
    SplashScreen.hideAsync()
  }, [])

  return <RendraSplash visible={visivel} onFinished={() => setVisivel(false)} />
}

export default function RootLayout() {
  const [fontsLoaded] = useRendraFonts()
  const reducedMotion = useReducedMotion()

  if (!fontsLoaded) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BrandProvider brands={brandConfigs}>
          <RendraRouterBridge>
            <ModelCodeFromUrl />
            <ThemedStatusBar />
            {/* Dentro do BrandProvider: bg-background resolve pelas vars() de tema que ele injeta.
                Sem SafeAreaView: o inset superior é do cabeçalho do AppShell (grupo `(shell)`) e,
                nas telas fora do shell, de um SafeAreaView próprio de cada tela. */}
            <View className="flex-1 bg-background" testID="raiz-rotas">
              <Stack screenOptions={{ headerShown: false, animation: screenAnimation(reducedMotion) }} />
            </View>
            <SplashGate />
            <Toaster />
          </RendraRouterBridge>
        </BrandProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
