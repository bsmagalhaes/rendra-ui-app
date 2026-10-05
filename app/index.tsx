import { Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Circle, CircleCheck, Images, LayoutDashboard, LayoutGrid, LogIn, Palette } from 'lucide-react-native'
import { Text } from '../src/components/internal/text'
import { useBrand } from '../src/brand'
import { paletteSeeds } from '../src/brand/palettes'
import { colorCodes, themeCodes } from '../src/config/presets'
import { isModelId } from '../src/config/appearance'
import { Gradient } from '../src/components/gradient/gradient'
import { Badge, BrandLogo, Card, CardContent, List, RendraCredit } from '../src/components/ui'
import { useDocumentTitle } from '../src/lib/use-document-title'
import { a11yPresets } from '../src/lib/a11y'
import { cn } from '../src/lib/cn'

// Uma fonte so para o numero: o cartao e o texto da apresentacao nao podem divergir (eram 49 e 57).
const totalComponentes = 65

const fatos = [
  { valor: String(totalComponentes), rotulo: 'componentes' },
  { valor: '3', rotulo: 'modelos' },
  { valor: '4', rotulo: 'paletas' },
]

const explorar = [
  { id: 'componentes', title: 'Componentes', description: 'A vitrine dos componentes, com exemplos vivos.', href: '/componentes', icon: LayoutGrid },
  { id: 'tokens', title: 'Tokens', description: 'Espaço, tipografia, raio, sombra e cor.', href: '/tokens', icon: Palette },
  { id: 'galeria', title: 'Galeria', description: 'Troque modelo, paleta e modo ao vivo.', href: '/galeria', icon: Images },
  { id: 'painel', title: 'Painel de exemplo', description: 'Indicadores e listas dentro do menu do app.', href: '/painel', icon: LayoutDashboard },
  { id: 'login', title: 'Tela de entrada', description: 'Formulário com validação e crédito.', href: '/login', icon: LogIn },
]

function Titulo({ children, apoio }: { children: string; apoio: string }) {
  return (
    <View className="gap-1">
      <Text weight="semibold" accessibilityRole={a11yPresets.header.accessibilityRole} aria-level={2} className="text-xl text-foreground">
        {children}
      </Text>
      <Text className="text-sm text-muted-foreground">{apoio}</Text>
    </View>
  )
}

// Os dois estados são sempre um ícone com classes de cor próprias (nada de classe que só aparece
// depois do primeiro render, lição do css-interop no Android).
function Marca({ ativo }: { ativo: boolean }) {
  return ativo ? (
    <CircleCheck aria-hidden className="size-icon-lg shrink-0 text-primary" />
  ) : (
    <Circle aria-hidden className="size-icon-lg shrink-0 text-border" />
  )
}

/**
 * Tela inicial: apresenta o projeto, os três modelos e as quatro paletas, e dá acesso às demais
 * áreas. Fica fora do grupo `(shell)` (tela cheia, como o login) e tem o próprio `SafeAreaView`
 * (só o inset superior). O único degradê da rota é o do cabeçalho; os cartões de modelo e de
 * paleta são radios (um só marcado por grupo), nunca `Button` solto.
 */
export default function Index() {
  const { brand, modelCode, paletteId, setModelAndPalette, setPaletteId } = useBrand()
  useDocumentTitle(brand.productName)

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background" testID="safe-area-tela">
      <ScrollView tabIndex={0} className="flex-1" contentContainerClassName="p-4 pb-12">
        <View className="w-full max-w-3xl gap-8 self-center">
          <View className="relative overflow-hidden rounded-block p-6">
            <View
              aria-hidden
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              className="absolute inset-0"
            >
              <Gradient token="brand" className="size-full" />
            </View>
            <View className="gap-6">
              <BrandLogo on="brand" />
              <View className="gap-3">
                <Text
                  weight="semibold"
                  accessibilityRole={a11yPresets.header.accessibilityRole}
                  aria-level={1}
                  className="text-3xl text-gradient-brand-foreground"
                >
                  {brand.tagline}
                </Text>
                <Text className="text-base text-gradient-brand-foreground">
                  Rendra App é a base para o seu próximo app: {totalComponentes} componentes, três modelos de marca e quatro paletas, em React Native e Expo.
                </Text>
              </View>
              <View className="flex-row gap-6">
                {fatos.map((f) => (
                  <View key={f.rotulo}>
                    <Text weight="semibold" className="text-2xl text-gradient-brand-foreground">
                      {f.valor}
                    </Text>
                    <Text className="text-xs text-gradient-brand-foreground">{f.rotulo}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View className="gap-4">
            <Titulo apoio="Define a fonte e o formato dos cantos. A troca vale para o app inteiro.">Escolha um modelo</Titulo>
            <View accessibilityRole="radiogroup" accessibilityLabel="Modelo" className="gap-3">
              {themeCodes.map((t) => {
                const ativo = t.code === modelCode
                return (
                  <Pressable
                    key={t.code}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: ativo }}
                    aria-checked={ativo}
                    accessibilityLabel={t.name}
                    accessibilityHint={t.description}
                    onPress={() => {
                      if (isModelId(t.code)) setModelAndPalette(t.code, undefined)
                    }}
                    className={cn(
                      'min-h-touch flex-row items-center gap-4 rounded-surface border-2 bg-card p-4',
                      ativo ? 'border-primary' : 'border-border',
                    )}
                  >
                    <View className="min-w-0 flex-1 gap-1">
                      <View className="flex-row items-center gap-2">
                        <Text weight="semibold" className="text-base text-foreground">
                          {t.name}
                        </Text>
                        <Badge tone="outline">{t.code}</Badge>
                      </View>
                      <Text className="text-sm text-muted-foreground">{t.description}</Text>
                    </View>
                    <Marca ativo={ativo} />
                  </Pressable>
                )
              })}
            </View>
          </View>

          <View className="gap-4">
            <Titulo apoio="Quatro cores de marca e um degradê. O resto do tema nasce delas.">Escolha uma paleta</Titulo>
            <View accessibilityRole="radiogroup" accessibilityLabel="Paleta" className="gap-3">
              {colorCodes.map((c) => {
                const ativo = c.palette === paletteId
                const sementes = paletteSeeds.find((s) => s.id === c.palette)
                return (
                  <Pressable
                    key={c.code}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: ativo }}
                    aria-checked={ativo}
                    accessibilityLabel={c.name}
                    accessibilityHint={c.description}
                    onPress={() => setPaletteId(c.palette)}
                    className={cn(
                      'min-h-touch flex-row items-center gap-4 rounded-surface border-2 bg-card p-4',
                      ativo ? 'border-primary' : 'border-border',
                    )}
                  >
                    <View
                      aria-hidden
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                      className="flex-row gap-1"
                    >
                      {[sementes?.primary, sementes?.secondary, sementes?.gradient[0]].map((cor, i) => (
                        <View key={i} className="size-8 rounded-item" style={{ backgroundColor: cor }} />
                      ))}
                    </View>
                    <View className="min-w-0 flex-1 gap-1">
                      <Text weight="semibold" className="text-base text-foreground">
                        {c.name}
                      </Text>
                      <Text className="text-sm text-muted-foreground">{c.description}</Text>
                    </View>
                    <Marca ativo={ativo} />
                  </Pressable>
                )
              })}
            </View>
          </View>

          <View className="gap-4">
            <Titulo apoio="Cada tela abaixo já usa o modelo e a paleta que você escolheu.">Explore o projeto</Titulo>
            <Card className="border-border">
              <CardContent>
                <List
                  scrollEnabled={false}
                  items={explorar.map(({ icon: Icone, ...item }) => ({
                    ...item,
                    leading: <Icone aria-hidden className="size-icon-md text-primary" />,
                  }))}
                />
              </CardContent>
            </Card>
          </View>

          <RendraCredit />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
