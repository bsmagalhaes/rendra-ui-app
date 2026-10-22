import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import type { ReactNode } from 'react'
import { MotionPresence } from '../../src/components/internal/motion-view'
import { Container, PageHeader, Stack } from '../../src/components/layout'
import { Avatar, Card, CardContent, CardHeader, CardTitle, List, StatCard, Switch, Timeline } from '../../src/components/ui'
import { Chart } from '../../src/chart'
import { useClientes } from '../../src/demo/clients-store'
import { formatCurrency } from '../../src/lib/masks'
import { MotionProvider } from '../../src/lib/motion/context'
import { RevealScope } from '../../src/lib/motion/reveal-scope'
import { revealIn } from '../../src/lib/motion/reveal'
import { useDocumentTitle } from '../../src/lib/use-document-title'
import { porSegmento, receitaMensal } from '../../src/mocks/charts'
import { filterClients, resumoPeriodo } from '../../src/mocks/clients'
import { notifications } from '../../src/mocks/notifications'
import { motionTokens } from '../../src/theme/motion'
import type { MotionMode } from '../../src/theme/motion'

const emMil = (n: number) => `R$ ${(n / 1000).toLocaleString('pt-BR')} mil`

const receitaEMeta = [
  { key: 'receita', label: 'Receita' },
  { key: 'meta', label: 'Meta', color: 3 as const },
]

const eventosAtividade = notifications.map((n) => ({
  id: String(n.id),
  title: n.titulo,
  description: n.descricao,
  date: n.data,
}))

/** Cada bloco entra subindo, em cascata pela posição (`reveal`: 600 ms, passo de 120 ms); em `off` não há nó extra. */
function Bloco({ index, children }: { index: number; children: ReactNode }) {
  return (
    <MotionPresence
      webEnter
      testID={`dashboard-motion-bloco-${index}`}
      enter={(reduced) => revealIn('up', reduced, index, motionTokens.distance.sm)}
    >
      {children}
    </MotionPresence>
  )
}

/**
 * Dashboard experimental com motion: os mesmos componentes do `/painel`, sem a lógica de período e
 * de cadastro, entrando em cascata. A chave liga e desliga o motion só aqui; ligar de novo remonta o
 * conteúdo (em `off` os blocos saem do caminho animado, então a árvore muda) e a entrada se repete,
 * com os contadores recomeçando.
 */
export default function DashboardMotionScreen() {
  useDocumentTitle('Dashboard com motion')
  const [motion, setMotion] = useState<MotionMode>('on')
  const carteira = useClientes()
  const resumo = resumoPeriodo(6)
  const ativos = carteira.filter((c) => c.situacao === 'Ativo').length
  const recentes = filterClients({ porPagina: 3, base: carteira }).itens

  return (
    <ScrollView tabIndex={0} className="flex-1 bg-background" contentContainerClassName="flex-grow">
      <Container padded>
        <Stack gap="8">
          <PageHeader
            title="Dashboard com motion"
            description="Dashboard de exemplo com entrada em cascata e contadores. A chave liga e desliga o motion só aqui."
          />
          <Switch
            id="motion-seletor"
            checked={motion === 'on'}
            onCheckedChange={(ligado) => setMotion(ligado ? 'on' : 'off')}
            label="Motion ligado"
            description="Ligar de novo repete a entrada."
          />
          <MotionProvider motion={motion}>
            <RevealScope>
              <View className="gap-6">
                <View className="gap-4">
                  <Bloco index={0}>
                    <StatCard label="Receita do período" value={formatCurrency(resumo.receita)} change={resumo.variacaoReceita} highlight />
                  </Bloco>
                  <Bloco index={1}>
                    <StatCard label="Novos clientes" value={String(resumo.novosClientes)} />
                  </Bloco>
                  <Bloco index={2}>
                    <StatCard label="Clientes ativos" value={String(ativos)} />
                  </Bloco>
                </View>

                <Bloco index={3}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Receita e meta</CardTitle>
                    </CardHeader>
                    <CardContent noTopPadding>
                      <Chart
                        type="line"
                        aria-label="Receita e meta dos últimos 12 meses"
                        data={receitaMensal}
                        xKey="mes"
                        series={receitaEMeta}
                        valueFormatter={emMil}
                      />
                    </CardContent>
                  </Card>
                </Bloco>

                <Bloco index={4}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Clientes por segmento</CardTitle>
                    </CardHeader>
                    <CardContent noTopPadding>
                      <Chart
                        type="pie"
                        aria-label="Clientes por segmento"
                        data={porSegmento}
                        xKey="segmento"
                        series={[{ key: 'clientes', label: 'Clientes' }]}
                      />
                    </CardContent>
                  </Card>
                </Bloco>

                <Bloco index={5}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Clientes recentes</CardTitle>
                    </CardHeader>
                    <CardContent noTopPadding>
                      <List
                        scrollEnabled={false}
                        items={recentes.map((c) => ({
                          id: String(c.id),
                          title: c.nome,
                          description: `${c.segmento} · ${c.cidade}`,
                          leading: <Avatar name={c.nome} />,
                          href: `/clientes/${c.id}`,
                        }))}
                      />
                    </CardContent>
                  </Card>
                </Bloco>

                <Bloco index={6}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Atividade</CardTitle>
                    </CardHeader>
                    <CardContent noTopPadding>
                      <Timeline events={eventosAtividade} />
                    </CardContent>
                  </Card>
                </Bloco>
              </View>
            </RevealScope>
          </MotionProvider>
        </Stack>
      </Container>
    </ScrollView>
  )
}
