import { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import { SlidersHorizontal } from 'lucide-react-native'
import { useBrand } from '../../../src/brand'
import { PageHeader } from '../../../src/components/layout'
import { Text } from '../../../src/components/internal/text'
import {
  ActionBar,
  Card,
  ConversationList,
  Input,
  Sheet,
  Tabs,
  chatChannels,
} from '../../../src/components/ui'
import { useTickets } from '../../../src/demo/tickets-store'
import { cn } from '../../../src/lib/cn'
import { useDocumentTitle } from '../../../src/lib/use-document-title'
import type { TicketStage } from '../../../src/mocks/chat'

const etapas: { value: TicketStage; label: string }[] = [
  { value: 'ura', label: 'URA/IA' },
  { value: 'fila', label: 'Fila' },
  { value: 'atendimento', label: 'Atendimento' },
  { value: 'encerrado', label: 'Encerrado' },
]

const opcoesCanal = Object.entries(chatChannels).map(([value, canal]) => ({ value, label: canal.label }))

type Periodo = 'tudo' | 'hoje' | '7dias' | '30dias'

const opcoesPeriodo: { value: Periodo; label: string }[] = [
  { value: 'tudo', label: 'Tudo' },
  { value: 'hoje', label: 'Hoje' },
  { value: '7dias', label: '7 dias' },
  { value: '30dias', label: '30 dias' },
]

interface Filtros {
  canais: string[]
  periodo: Periodo
}

const SEM_FILTROS: Filtros = { canais: [], periodo: 'tudo' }

const DIA_EM_MS = 24 * 60 * 60 * 1000

/** "Hoje" é o dia de `agora`; "7 dias" e "30 dias" contam para trás a partir dele. */
function dentroDoPeriodo(hora: Date, periodo: Periodo, agora: Date): boolean {
  if (periodo === 'tudo') return true
  if (periodo === 'hoje') return hora.toDateString() === agora.toDateString()
  const dias = periodo === '7dias' ? 7 : 30
  return agora.getTime() - hora.getTime() <= dias * DIA_EM_MS
}

/** Opção compacta e marcável (44 px de toque): várias por linha, quebrando para a seguinte. */
function Chip({ label, selected, role, onPress }: { label: string; selected: boolean; role: 'checkbox' | 'radio'; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      onPress={onPress}
      className={cn(
        'min-h-touch justify-center rounded-full border px-4',
        selected ? 'border-primary bg-primary-soft' : 'border-border bg-card',
      )}
    >
      <Text weight={selected ? 'semibold' : 'medium'} className={cn('text-sm', selected ? 'text-primary-soft-foreground' : 'text-foreground')}>
        {label}
      </Text>
    </Pressable>
  )
}

function rotuloDeNaoLidas(n: number): string {
  return n === 1 ? '1 não lida' : `${n} não lidas`
}

function nomeDoBotaoDeFiltros(ativos: number): string {
  if (ativos === 0) return 'Filtros'
  return `Filtros, ${ativos} ${ativos === 1 ? 'ativo' : 'ativos'}`
}

/**
 * Atendimento da demonstração: as conversas por etapa (URA/IA, Fila, Atendimento e Encerrado), com
 * busca pelo nome ou pela última mensagem e, no botão de filtros dentro do campo, uma folha inferior
 * com canal e período. O balão de cada etapa conta as mensagens não lidas e some quando é zero. Tocar
 * numa conversa abre a conversa dela. Os tickets vêm do `tickets-store`, o mesmo estado da conversa e
 * do selo do menu.
 */
export default function Atendimento() {
  const { brand } = useBrand()
  const router = useRouter()
  useDocumentTitle(`Atendimento · ${brand.productName}`)
  const tickets = useTickets()
  const [busca, setBusca] = useState('')
  const [aplicados, setAplicados] = useState<Filtros>(SEM_FILTROS)
  const [rascunho, setRascunho] = useState<Filtros>(SEM_FILTROS)
  const [folhaAberta, setFolhaAberta] = useState(false)

  const termo = busca.trim().toLowerCase()
  // Só nos dados de demonstração: o "agora" do período é a conversa mais recente dos mocks (as datas são
  // fixas), para "Hoje" e "7 dias" mostrarem resultado em qualquer dia em que a demo seja aberta.
  const agora = new Date(Math.max(...tickets.map((t) => t.time.getTime())))
  const filtrados = tickets.filter(
    (t) =>
      (!termo || t.name.toLowerCase().includes(termo) || t.lastMessage.toLowerCase().includes(termo)) &&
      (aplicados.canais.length === 0 || aplicados.canais.includes(t.channel)) &&
      dentroDoPeriodo(t.time, aplicados.periodo, agora),
  )
  const ativos = aplicados.canais.length + (aplicados.periodo === 'tudo' ? 0 : 1)
  const filtrando = termo.length > 0 || ativos > 0

  function abrirFiltros() {
    setRascunho(aplicados)
    setFolhaAberta(true)
  }

  function aplicarFiltros() {
    setAplicados(rascunho)
    setFolhaAberta(false)
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView tabIndex={0} className="flex-1" contentContainerClassName="gap-6 p-4" keyboardShouldPersistTaps="handled">
        <PageHeader title="Atendimento" description="Acompanhe as conversas por etapa e assuma as da fila." />
        <Input
          value={busca}
          onChange={setBusca}
          accessibilityLabel="Buscar conversa"
          placeholder="Buscar conversa"
          clearable
          trailingAction={{
            icon: <SlidersHorizontal className="size-icon-sm" />,
            accessibilityLabel: nomeDoBotaoDeFiltros(ativos),
            onPress: abrirFiltros,
            badge: ativos,
          }}
        />
        <Tabs
          variant="pill"
          overflow="scroll"
          defaultValue="fila"
          accessibilityLabel="Etapa do atendimento"
          items={etapas.map((etapa) => {
            const daEtapa = filtrados.filter((t) => t.stage === etapa.value)
            const naoLidas = daEtapa.reduce((soma, t) => soma + (t.unread ?? 0), 0)
            return {
              value: etapa.value,
              label: etapa.label,
              count: naoLidas > 0 ? naoLidas : undefined,
              countLabel: rotuloDeNaoLidas,
              content: (
                <Card>
                  <ConversationList
                    items={daEtapa}
                    empty={filtrando ? 'Nenhuma conversa com essa busca ou filtros.' : 'Nenhuma conversa aqui.'}
                    onSelect={(id) => router.push(`/atendimento/${id}`)}
                  />
                </Card>
              ),
            }
          })}
        />
      </ScrollView>

      {/* Fora do ScrollView com `gap`: a folha deixa um contêiner vazio no lugar onde está. */}
      <Sheet
        open={folhaAberta}
        onOpenChange={setFolhaAberta}
        title="Filtros"
        testID="atendimento-filtros"
        footer={
          <ActionBar
            sticky={false}
            primary={{ label: 'Aplicar', onPress: aplicarFiltros }}
            cancel={{ label: 'Limpar', onPress: () => setRascunho(SEM_FILTROS) }}
          />
        }
      >
        <View className="gap-6 px-4 pb-4">
          <View className="gap-2">
            <Text weight="medium" className="text-sm text-foreground">
              Canal
            </Text>
            <View role="group" accessibilityLabel="Canal" className="flex-row flex-wrap gap-2">
              {opcoesCanal.map((o) => (
                <Chip
                  key={o.value}
                  role="checkbox"
                  label={o.label}
                  selected={rascunho.canais.includes(o.value)}
                  onPress={() =>
                    setRascunho((r) => ({
                      ...r,
                      canais: r.canais.includes(o.value) ? r.canais.filter((c) => c !== o.value) : [...r.canais, o.value],
                    }))
                  }
                />
              ))}
            </View>
          </View>
          <View className="gap-2">
            <Text weight="medium" className="text-sm text-foreground">
              Período
            </Text>
            <View role="radiogroup" accessibilityLabel="Período" className="flex-row flex-wrap gap-2">
              {opcoesPeriodo.map((o) => (
                <Chip
                  key={o.value}
                  role="radio"
                  label={o.label}
                  selected={rascunho.periodo === o.value}
                  onPress={() => setRascunho((r) => ({ ...r, periodo: o.value }))}
                />
              ))}
            </View>
          </View>
        </View>
      </Sheet>
    </View>
  )
}
