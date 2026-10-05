import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { MoreHorizontal } from 'lucide-react-native'
import { Text } from '../../src/components/internal/text'
import { useBrand } from '../../src/brand'
import { PageHeader } from '../../src/components/layout'
import {
  ActionBar,
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  Input,
  List,
  toast,
} from '../../src/components/ui'
import type { BadgeTone } from '../../src/components/ui/badge'
import { adicionarCard } from '../../src/demo/planning-store'
import { cardDaTarefa } from '../../src/demo/tarefa-card'
import { useDocumentTitle } from '../../src/lib/use-document-title'
import { tasks, type Prioridade, type Tarefa } from '../../src/mocks/tasks'

const toneDaPrioridade: Record<Prioridade, BadgeTone> = { Alta: 'error', Média: 'warning', Baixa: 'neutral' }

/**
 * Tarefas da demonstração: busca, seleção por `Checkbox` (o rótulo é "Selecionar <título>"),
 * conclusão em massa pelo `ActionBar` e conclusão individual pelo menu da linha, que também envia
 * ao funil a tarefa que cita um cliente (o card entra na primeira coluna do `/kanban`). As linhas não
 * têm `href` nem `onPress`: o `Checkbox` do `leading` dentro de uma linha interativa viraria
 * controle dentro de controle (axe `nested-interactive`). O estado mora na tela; nada é gravado.
 */
export default function Tarefas() {
  const { brand } = useBrand()
  useDocumentTitle(`Tarefas · ${brand.productName}`)
  const [busca, setBusca] = useState('')
  // Ordem das tarefas na tela; o reordenar mexe aqui e a busca só filtra por cima dela.
  const [ordem, setOrdem] = useState<Tarefa[]>(tasks)
  const [concluidas, setConcluidas] = useState<ReadonlySet<number>>(
    () => new Set(tasks.filter((t) => t.concluida).map((t) => t.id)),
  )
  const [selecionadas, setSelecionadas] = useState<ReadonlySet<number>>(new Set())

  const termo = busca.trim().toLowerCase()
  const visiveis = ordem.filter((t) => !termo || t.titulo.toLowerCase().includes(termo))

  // A `List` devolve a lista inteira na nova ordem. Com a busca ativa o reordenar fica desligado
  // (as linhas ocultas ficariam fora da conta), então aqui `lista` sempre traz todas as tarefas.
  function reordenar(lista: { id: string }[]) {
    const porId = new Map(ordem.map((t) => [String(t.id), t]))
    setOrdem(lista.map((linha) => porId.get(linha.id)!))
  }

  function alternarSelecao(id: number, marcada: boolean) {
    setSelecionadas((atual) => {
      const proxima = new Set(atual)
      if (marcada) proxima.add(id)
      else proxima.delete(id)
      return proxima
    })
  }

  function alternarConclusao(id: number, concluida: boolean) {
    setConcluidas((atual) => {
      const proxima = new Set(atual)
      if (concluida) proxima.add(id)
      else proxima.delete(id)
      return proxima
    })
    if (concluida) toast.success('Tarefa concluída')
    else toast.info('Tarefa reaberta')
  }

  function enviarAoFunil(tarefa: Tarefa) {
    const card = cardDaTarefa(tarefa)
    if (!card) return
    adicionarCard(card)
    toast.success('Tarefa enviada ao funil')
  }

  function concluirSelecionadas() {
    const total = selecionadas.size
    if (total === 0) return
    setConcluidas((atual) => new Set([...atual, ...selecionadas]))
    setSelecionadas(new Set())
    toast.success(total === 1 ? 'Tarefa concluída' : 'Tarefas concluídas')
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView tabIndex={0} className="flex-1" contentContainerClassName="gap-6 p-4" keyboardShouldPersistTaps="handled">
        <PageHeader title="Tarefas" description="Marque as tarefas e conclua várias de uma vez." />
        <Input value={busca} onChange={setBusca} accessibilityLabel="Buscar tarefa" placeholder="Buscar tarefa" clearable />
        <Text className="text-sm text-muted-foreground">{`Selecionadas: ${selecionadas.size}`}</Text>
        <Card>
          <CardContent className="p-2">
            <List
              scrollEnabled={false}
              onReorder={termo ? undefined : reordenar}
              empty={<EmptyState title="Nenhuma tarefa encontrada" description="Nenhuma tarefa combina com a busca." />}
              items={visiveis.map((t) => {
                const concluida = concluidas.has(t.id)
                return {
                  id: String(t.id),
                  title: t.titulo,
                  description: t.prazo,
                  leading: (
                    <Checkbox
                      accessibilityLabel={`Selecionar ${t.titulo}`}
                      checked={selecionadas.has(t.id)}
                      disabled={concluida}
                      onCheckedChange={(marcada) => alternarSelecao(t.id, marcada)}
                    />
                  ),
                  trailing: (
                    <View className="flex-row items-center gap-1">
                      {concluida ? (
                        <Badge tone="success">Concluída</Badge>
                      ) : (
                        <Badge tone={toneDaPrioridade[t.prioridade]}>{t.prioridade}</Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button
                            variant="ghost"
                            iconOnly
                            accessibilityLabel={`Ações de ${t.titulo}`}
                            icon={<MoreHorizontal className="text-foreground" />}
                          />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent accessibilityLabel={`Ações de ${t.titulo}`}>
                          <DropdownMenuItem onSelect={() => alternarConclusao(t.id, !concluida)}>
                            {concluida ? 'Reabrir tarefa' : 'Concluir tarefa'}
                          </DropdownMenuItem>
                          {t.clienteId !== undefined ? (
                            <DropdownMenuItem onSelect={() => enviarAoFunil(t)}>Enviar ao funil</DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </View>
                  ),
                }
              })}
            />
          </CardContent>
        </Card>
      </ScrollView>
      <ActionBar
        primary={{ label: 'Concluir selecionadas', onPress: concluirSelecionadas, disabled: selecionadas.size === 0 }}
      />
    </View>
  )
}
