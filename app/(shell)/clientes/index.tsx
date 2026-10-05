import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import { MoreHorizontal, SlidersHorizontal, UserPlus } from 'lucide-react-native'
import { Text } from '../../../src/components/internal/text'
import { useBrand } from '../../../src/brand'
import { PageHeader } from '../../../src/components/layout'
import {
  ActionBar,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  Drawer,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  Input,
  List,
  Modal,
  RadioGroup,
  toast,
} from '../../../src/components/ui'
import { excluirCliente, useClientes } from '../../../src/demo/clients-store'
import { useDocumentTitle } from '../../../src/lib/use-document-title'
import {
  filterClients,
  segmentos,
  situacoes,
  statusTone,
  type Cliente,
  type Situacao,
} from '../../../src/mocks/clients'

const POR_PAGINA = 10
const TODOS = 'todos'

const opcoesSituacao = [{ value: TODOS, label: 'Todas' }, ...situacoes.map((s) => ({ value: s, label: s }))]
const opcoesSegmento = [{ value: TODOS, label: 'Todos' }, ...segmentos.map((s) => ({ value: s, label: s }))]

interface Filtros {
  situacao: string
  segmento: string
}

const SEM_FILTROS: Filtros = { situacao: TODOS, segmento: TODOS }

/**
 * Lista de clientes da demonstração: busca por nome, filtros de situação e segmento num
 * `Drawer`, "Carregar mais" de 10 em 10, menu de ações por linha e exclusão com confirmação. O
 * `Modal` de exclusão é irmão do `Drawer` e da lista (nunca descendente). Os dados vêm de
 * `src/mocks/clients.ts`; "excluir" só marca o cliente como excluído nesta sessão.
 */
export default function Clientes() {
  const { brand } = useBrand()
  const router = useRouter()
  useDocumentTitle(`Clientes · ${brand.productName}`)
  const carteira = useClientes()
  const [busca, setBusca] = useState('')
  const [aplicados, setAplicados] = useState<Filtros>(SEM_FILTROS)
  const [rascunho, setRascunho] = useState<Filtros>(SEM_FILTROS)
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const [paginas, setPaginas] = useState(1)
  const [alvo, setAlvo] = useState<Cliente | null>(null)

  const { itens, total } = filterClients({
    busca,
    situacao: aplicados.situacao === TODOS ? undefined : (aplicados.situacao as Situacao),
    segmento: aplicados.segmento === TODOS ? undefined : aplicados.segmento,
    pagina: 1,
    porPagina: paginas * POR_PAGINA,
    base: carteira,
  })

  function limpar() {
    setBusca('')
    setAplicados(SEM_FILTROS)
    setRascunho(SEM_FILTROS)
    setPaginas(1)
  }

  function abrirFiltros() {
    setRascunho(aplicados)
    setFiltrosAbertos(true)
  }

  function aplicarFiltros() {
    setAplicados(rascunho)
    setPaginas(1)
    setFiltrosAbertos(false)
  }

  function confirmarExclusao() {
    if (!alvo) return
    excluirCliente(alvo.id)
    setAlvo(null)
    toast.success('Cliente excluído')
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView tabIndex={0} className="flex-1" contentContainerClassName="gap-6 p-4" keyboardShouldPersistTaps="handled">
        <PageHeader
          title="Clientes"
          description="Busque, filtre e acompanhe a carteira de clientes."
          actions={
            <>
              <Button variant="outline" icon={<SlidersHorizontal className="text-foreground" />} onPress={abrirFiltros}>
                Filtros
              </Button>
              <Button icon={<UserPlus className="text-primary-foreground" />} onPress={() => router.push('/clientes/novo')}>
                Novo cliente
              </Button>
            </>
          }
        />

        <Input
          value={busca}
          onChange={(valor) => {
            setBusca(valor)
            setPaginas(1)
          }}
          accessibilityLabel="Buscar cliente"
          placeholder="Buscar cliente"
          clearable
        />

        <Text className="text-sm text-muted-foreground">
          {`Mostrando ${itens.length} de ${total} ${total === 1 ? 'cliente' : 'clientes'}`}
        </Text>

        <Card>
          <CardContent className="gap-4 p-2">
            <List
              scrollEnabled={false}
              empty={
                <EmptyState
                  title="Nenhum cliente encontrado"
                  description="Nenhum cliente combina com a busca e os filtros."
                  actions={<Button onPress={limpar}>Limpar filtros</Button>}
                />
              }
              items={itens.map((c) => ({
                id: String(c.id),
                title: c.nome,
                description: `${c.segmento} · ${c.cidade}`,
                leading: <Avatar name={c.nome} />,
                href: `/clientes/${c.id}`,
                trailing: (
                  <View className="flex-row items-center gap-1">
                    <Badge tone={statusTone[c.situacao]}>{c.situacao}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button
                          variant="ghost"
                          iconOnly
                          accessibilityLabel={`Ações de ${c.nome}`}
                          icon={<MoreHorizontal className="text-foreground" />}
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent accessibilityLabel={`Ações de ${c.nome}`}>
                        <DropdownMenuItem onSelect={() => router.push(`/clientes/${c.id}`)}>Ver detalhes</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => toast.info('Edição simulada nesta demonstração')}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => toast.info('Cliente arquivado (simulado)')}>
                          Arquivar
                        </DropdownMenuItem>
                        <DropdownMenuItem destructive onSelect={() => setAlvo(c)}>
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </View>
                ),
              }))}
            />

            {itens.length < total ? (
              <ActionBar sticky={false} primary={{ label: 'Carregar mais', onPress: () => setPaginas((p) => p + 1) }} />
            ) : null}
          </CardContent>
        </Card>
      </ScrollView>

      <Drawer
        open={filtrosAbertos}
        onOpenChange={setFiltrosAbertos}
        title="Filtros"
        description="Refine a lista por situação e segmento."
        footer={
          <ActionBar
            sticky={false}
            primary={{ label: 'Aplicar', onPress: aplicarFiltros }}
            cancel={{ label: 'Limpar', onPress: () => setRascunho(SEM_FILTROS) }}
          />
        }
      >
        <View className="gap-6 p-4">
          <View className="gap-2">
            <Text weight="medium" className="text-sm text-foreground">
              Situação
            </Text>
            <RadioGroup
              accessibilityLabel="Situação"
              options={opcoesSituacao}
              value={rascunho.situacao}
              onChange={(situacao) => setRascunho((r) => ({ ...r, situacao }))}
            />
          </View>
          <View className="gap-2">
            <Text weight="medium" className="text-sm text-foreground">
              Segmento
            </Text>
            <RadioGroup
              accessibilityLabel="Segmento"
              options={opcoesSegmento}
              value={rascunho.segmento}
              onChange={(segmento) => setRascunho((r) => ({ ...r, segmento }))}
            />
          </View>
        </View>
      </Drawer>

      <Modal
        open={alvo !== null}
        onOpenChange={(aberto) => {
          if (!aberto) setAlvo(null)
        }}
        type="destructive"
        title="Excluir cliente?"
        description={alvo ? `${alvo.nome} sai da lista desta demonstração.` : undefined}
        confirmLabel="Confirmar exclusão"
        onConfirm={confirmarExclusao}
      />
    </View>
  )
}
