import { useState } from 'react'
import type { ReactNode } from 'react'
import { Image, KeyboardAvoidingView, Platform, View } from 'react-native'
import { Archive, Handshake, MoreHorizontal, SlidersHorizontal, UserPlus, Wallet, XCircle } from 'lucide-react-native'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Text } from '../components/internal/text'
import {
  ActionBar,
  Button,
  ButtonGroup,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  BrandFeedbackIcon,
  InfoHint,
  Modal,
  Input,
  Textarea,
  Select,
  Checkbox,
  RadioGroup,
  Switch,
  Slider,
  OtpInput,
  DatePicker,
  Field,
  Form,
  FormField,
  FormSection,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Skeleton,
  Progress,
  Spinner,
  Alert,
  toast,
  EmptyState,
  Drawer,
  Separator,
  Badge,
  Avatar,
  AvatarGroup,
  List,
  type ListItem,
  StatCard,
  Accordion,
  Tabs,
  BrandLogo,
  Timeline,
  Calendar,
  Kanban,
  moveKanbanCard,
  type KanbanCard,
  type KanbanDropTarget,
  ImageViewer,
  type ViewerImage,
  ConversationList,
  ChannelBadge,
  ChatThread,
  ChatComposer,
  type ChatMessage,
  Rating,
  Checklist,
  type ChecklistItem,
  Pagination,
  DataToolbar,
  Table,
  type TableColumn,
  Stepper,
  Wizard,
  type WizardStep,
  Sheet,
} from '../components/ui'
import { Gradient } from '../components/gradient/gradient'
import { Container, Grid, Inline, PageHeader, Section, Stack } from '../components/layout'
import { Chart } from '../chart'
import { RichTextEditor } from '../rich-text-editor'
import { DocumentViewer } from '../document-viewer'
import { zBR } from '../lib/validators'
import { formatCurrency } from '../lib/masks'
import { funilVendas, metaDoMes, porSegmento, receitaMensal } from '../mocks/charts'
import { demoCards, demoEvents, pipelineColumns, referencia } from '../mocks/planning'
import { historicoContrato } from '../mocks/timeline'
import { demoTickets, quickRepliesDemo, type Ticket } from '../mocks/chat'
import { clients, situacoes, statusTone, type Cliente } from '../mocks/clients'
import { resolveCatalogCode } from '../catalog/components'

export interface ShowcaseEntry {
  name: string
  description: string
  render: () => ReactNode
  /** Codigos do catalogo (secao 3.3) que o exemplo demonstra; sem entrada aqui, sem selo. */
  codes?: string[]
}

/** Resolve um ou mais codigos do catalogo pelas props reais do exemplo, nunca literal solto. */
function codigosPara(...variantes: [string, Record<string, unknown>?][]): string[] {
  return variantes.map(([component, props]) => resolveCatalogCode(component, props ?? {}))
}

export interface ShowcaseGroup {
  slug: string
  title: string
  entries: ShowcaseEntry[]
}

function ButtonExample() {
  return <Button onPress={() => {}}>Salvar</Button>
}

function ButtonGroupExample() {
  const [value, setValue] = useState('dia')
  return (
    <ButtonGroup
      options={[
        { value: 'dia', label: 'Dia' },
        { value: 'semana', label: 'Semana' },
        { value: 'mes', label: 'Mês' },
      ]}
      value={value}
      onChange={setValue}
    />
  )
}

function ActionBarExample() {
  return (
    <ActionBar
      sticky={false}
      primary={{ label: 'Salvar', onPress: () => {} }}
      cancel={{ label: 'Cancelar', onPress: () => {} }}
      secondary={[{ label: 'Duplicar', onPress: () => {} }]}
    />
  )
}

function DropdownMenuExample() {
  const [open, setOpen] = useState(false)
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger>
        <Button
          variant="outline"
          iconOnly
          accessibilityLabel="Mais ações"
          icon={<MoreHorizontal className="text-foreground" />}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent accessibilityLabel="Mais ações">
        <DropdownMenuItem onSelect={() => {}}>Editar</DropdownMenuItem>
        <DropdownMenuItem destructive onSelect={() => {}}>
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function BrandFeedbackIconExample() {
  return <BrandFeedbackIcon type="success" label="Sucesso" />
}

function InfoHintExample() {
  return <InfoHint title="Sobre este campo">Este é um texto de ajuda orientativo.</InfoHint>
}

const modalExampleSchema = z.object({ nome: zBR.required('Nome') })

function ModalExample() {
  const [open, setOpen] = useState(false)
  const form = useForm({
    resolver: zodResolver(modalExampleSchema),
    mode: 'onTouched',
    defaultValues: { nome: '' },
  })
  return (
    <>
      <ButtonGroup>
        <Button onPress={() => setOpen(true)}>Abrir modal</Button>
      </ButtonGroup>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Novo contato"
        type="form"
        onConfirm={() =>
          new Promise<boolean>((resolve) => {
            form.handleSubmit(
              () => resolve(true),
              () => resolve(false),
            )()
          })
        }
      >
        <Form form={form} onSubmit={() => {}}>
          <FormField name="nome" label="Nome" required render={(f) => <Input {...f} />} />
        </Form>
      </Modal>
    </>
  )
}

function ContainerExample() {
  return (
    <Container padded className="rounded-control border border-border">
      <Text className="text-foreground">Conteúdo dentro do Container</Text>
    </Container>
  )
}

function StackExample() {
  return (
    <Stack gap="2">
      <Text className="text-foreground">Um</Text>
      <Text className="text-foreground">Dois</Text>
    </Stack>
  )
}

function InlineExample() {
  return (
    <Inline gap="2">
      <Text className="text-foreground">Um</Text>
      <Text className="text-foreground">Dois</Text>
    </Inline>
  )
}

function GridExample() {
  return (
    <Grid cols={2} gap="4">
      <Text className="text-foreground">1</Text>
      <Text className="text-foreground">2</Text>
      <Text className="text-foreground">3</Text>
      <Text className="text-foreground">4</Text>
    </Grid>
  )
}

function SectionExample() {
  return (
    <Section title="Seção" description="Descrição breve da seção.">
      <Text className="text-foreground">Conteúdo da seção</Text>
    </Section>
  )
}

function PageHeaderExample() {
  return <PageHeader title="Título da página" showTitle description="Descrição curta da tela." />
}

function InputExample() {
  const [cpf, setCpf] = useState('')
  const [valor, setValor] = useState('')
  const [telefone, setTelefone] = useState('')
  const [busca, setBusca] = useState('')
  const [filtros, setFiltros] = useState(2)
  return (
    <Stack gap="4">
      <Input mask="cpf" placeholder="000.000.000-00" value={cpf} onChange={setCpf} clearable />
      <Input mask="currency" placeholder="R$ 0,00" value={valor} onChange={setValor} clearable />
      <Input mask="phone" placeholder="(00) 00000-0000" value={telefone} onChange={setTelefone} clearable />
      <Input units={[{ id: 'percent', label: '%' }, { id: 'currency', label: 'R$' }]} unit="percent" percentMax={50} />
      <Input variant="secret" hasValue maskedHint="••••1234" onStartEdit={() => {}} onRemove={() => {}} />
      <Input
        accessibilityLabel="Buscar com filtros"
        placeholder="Buscar"
        value={busca}
        onChange={setBusca}
        clearable
        trailingAction={{
          icon: <SlidersHorizontal className="size-icon-sm" />,
          accessibilityLabel: filtros > 0 ? `Filtros, ${filtros} ${filtros === 1 ? 'ativo' : 'ativos'}` : 'Filtros',
          onPress: () => setFiltros((n) => (n + 1) % 4),
          badge: filtros,
        }}
      />
    </Stack>
  )
}

function TextareaExample() {
  const [value, setValue] = useState('')
  return <Textarea placeholder="Escreva uma mensagem" value={value} onChange={setValue} counter maxLength={200} />
}

const propostaHtml =
  '<h2>Proposta comercial</h2><p>Plano <strong>Profissional</strong>, 12 meses, por <em>R$ 1.250,00</em> ao mês.</p><ul><li>Implantação inclusa</li><li>Suporte em horário comercial</li></ul>'

function RichTextEditorExample() {
  const [html, setHtml] = useState(propostaHtml)
  return (
    <Stack gap="2">
      <RichTextEditor
        value={html}
        onChange={setHtml}
        placeholder="Escreva a proposta"
        // Simulado: o app de verdade abre o seletor de fotos e envia a imagem; aqui vale uma captura do próprio app.
        onImageUpload={async () => (Image.resolveAssetSource(require('../../assets/showcase/safira-cliente-mobile.png'))?.uri ?? 'exemplo://captura.png')}
      />
      <Text className="text-sm text-muted-foreground">{`Conteúdo: ${html.length} caracteres`}</Text>
    </Stack>
  )
}

const contratoPdf = 'https://exemplo.com.br/documentos/contrato-de-outubro.pdf'

function DocumentViewerExample() {
  const [url, setUrl] = useState<string | null>(contratoPdf)
  return (
    <Stack gap="2">
      <DocumentViewer url={url} title="Contrato de outubro" className="h-chart-md" />
      <Button variant="outline" onPress={() => setUrl((atual) => (atual ? null : contratoPdf))}>
        {url ? 'Limpar seleção' : 'Selecionar contrato'}
      </Button>
    </Stack>
  )
}

function SelectExample() {
  const [value, setValue] = useState<string[]>([])
  return (
    <Select
      multiple
      label="Categoria"
      placeholder="Selecione as categorias"
      options={[
        { value: 'a', label: 'Alfa' },
        { value: 'b', label: 'Beta' },
        { value: 'c', label: 'Gama' },
      ]}
      value={value}
      onChange={setValue}
      searchable
    />
  )
}

const ESTADOS_BRASILEIROS = [
  'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal',
  'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul',
  'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí',
  'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
  'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins',
]

function SelectListaLongaExample() {
  // Lista maior que a folha (27 estados), usada para provar que a lista rola por dentro,
  // até o último item, no export web (bloqueador do veredito do fechamento, select.tsx:301).
  const [value, setValue] = useState<string | null>(null)
  return (
    <Select
      label="Estado"
      placeholder="Selecione um estado"
      options={ESTADOS_BRASILEIROS.map((nome) => ({ value: nome, label: nome }))}
      value={value}
      onChange={setValue}
    />
  )
}

function CheckboxExample() {
  const [checked, setChecked] = useState(false)
  return <Checkbox label="Aceito os termos de uso" checked={checked} onCheckedChange={setChecked} />
}

function RadioGroupExample() {
  const [value, setValue] = useState('mensal')
  return (
    <RadioGroup
      options={[
        { value: 'mensal', label: 'Mensal' },
        { value: 'anual', label: 'Anual', description: 'Economize 20%' },
      ]}
      value={value}
      onChange={setValue}
    />
  )
}

function SwitchExample() {
  const [checked, setChecked] = useState(true)
  return <Switch label="Notificações por e-mail" checked={checked} onCheckedChange={setChecked} />
}

function SliderExample() {
  const [value, setValue] = useState([50])
  return <Slider value={value} onChange={setValue} showValue accessibilityLabel="Volume" />
}

function OtpInputExample() {
  const [value, setValue] = useState('')
  // Risco R11 do levantamento da Sincronizacao 1: o Playwright precisa medir o caso real de
  // 360px (OtpInput dentro de um Card, nunca solto), senao a conta de 6 caixas com gap-1 nao
  // prova o piso de 44px por caixa que o item D3 exige.
  return (
    <Card>
      <CardContent>
        <OtpInput value={value} onChange={setValue} />
      </CardContent>
    </Card>
  )
}

function DatePickerExample() {
  const [value, setValue] = useState<Date | null>(null)
  return <DatePicker label="Data e hora do evento" value={value} onChange={setValue} time dropdowns clearable />
}

function FieldExample() {
  const [value, setValue] = useState('')
  return (
    <Stack gap="4">
      <Field label="Nome completo" required help="Como aparece no documento">
        <Input value={value} onChange={setValue} />
      </Field>
      <Field label="E-mail" error="E-mail inválido.">
        <Input value="" onChange={() => {}} invalid />
      </Field>
    </Stack>
  )
}

const formularioRhfSchema = z.object({ nome: zBR.required('Nome'), email: zBR.email() })

function FormularioRhfExample() {
  const form = useForm({
    resolver: zodResolver(formularioRhfSchema),
    mode: 'onTouched',
    defaultValues: { nome: '', email: '' },
  })
  function onSubmit() {
    // vitrine: sem envio real, só demonstra a validação
  }
  return (
    <Form form={form} onSubmit={onSubmit}>
      <FormSection title="Dados pessoais">
        <FormField name="nome" label="Nome" required render={(f) => <Input {...f} />} />
        <FormField name="email" label="E-mail" render={(f) => <Input {...f} />} />
      </FormSection>
      <ActionBar sticky={false} primary={{ label: 'Salvar', onPress: form.handleSubmit(onSubmit) }} />
    </Form>
  )
}

function CardExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo do pedido</CardTitle>
        <CardDescription>3 itens, entrega em 25/09/2026</CardDescription>
      </CardHeader>
      <CardContent>
        <View />
      </CardContent>
    </Card>
  )
}

function SkeletonExample() {
  return (
    <Stack gap="3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="size-12 rounded-avatar" />
    </Stack>
  )
}

function ProgressExample() {
  return (
    <Stack gap="3">
      <Progress value={62} showValue accessibilityLabel="Progresso do exemplo" />
      <Progress tone="brand" value={45} accessibilityLabel="Envio em andamento" />
      <Progress accessibilityLabel="Carregando" />
    </Stack>
  )
}

function SpinnerExample() {
  return (
    <Inline gap="4">
      <Spinner size="sm" label="Carregando, pequeno" />
      <Spinner size="md" label="Carregando, médio" />
      <Spinner size="lg" label="Carregando, grande" />
    </Inline>
  )
}

function AlertExample() {
  return (
    <Stack gap="3">
      <Alert type="success" title="Cadastro salvo" description="Os dados foram atualizados." />
      <Alert
        type="info"
        title="Nova versão disponível"
        description="Atualize quando puder."
        onDismiss={() => {}}
      />
      <Alert type="warning" title="Plano perto do limite" description="Restam 2 usuários." />
      <Alert type="error" title="Falha na sincronização" description="Tente de novo em instantes." />
    </Stack>
  )
}

function ToastExample() {
  return (
    <ButtonGroup>
      <Button
        onPress={() =>
          toast.success('Cadastro salvo', { description: 'Os dados foram atualizados.' })
        }
      >
        Mostrar sucesso
      </Button>
      <Button
        variant="outline"
        onPress={() =>
          toast.error('Falha ao salvar', { action: { label: 'Tentar de novo', onPress: () => {} } })
        }
      >
        Mostrar erro
      </Button>
    </ButtonGroup>
  )
}

function EmptyStateExample() {
  return (
    <EmptyState
      title="Nenhum cliente ainda"
      description="Cadastre o primeiro cliente para começar."
      actions={
        <ActionBar
          sticky={false}
          primary={{ label: 'Adicionar cliente', onPress: () => {} }}
          cancel={{ label: 'Importar', onPress: () => {} }}
        />
      }
    />
  )
}

function DrawerExample() {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState('')
  const fechar = (next: boolean) => {
    setOpen(next)
    if (!next) setNome('')
  }
  return (
    <>
      <ButtonGroup>
        <Button onPress={() => setOpen(true)}>Abrir drawer</Button>
      </ButtonGroup>
      <Drawer
        open={open}
        onOpenChange={fechar}
        title="Editar cliente"
        description="Dados cadastrais"
        dirty={nome !== ''}
        footer={<ActionBar sticky={false} primary={{ label: 'Salvar', onPress: () => fechar(false) }} />}
      >
        <Input accessibilityLabel="Nome do cliente" placeholder="Nome" value={nome} onChange={setNome} />
      </Drawer>
    </>
  )
}

function SheetExample() {
  const [open, setOpen] = useState(false)
  const [soAtivos, setSoAtivos] = useState(false)
  const [aplicado, setAplicado] = useState(false)
  return (
    <>
      <ButtonGroup>
        <Button onPress={() => setOpen(true)}>Abrir folha</Button>
      </ButtonGroup>
      <Text className="text-sm text-muted-foreground">{aplicado ? 'Filtro aplicado: só ativos' : 'Sem filtro'}</Text>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="Filtros"
        footer={
          <ActionBar
            sticky={false}
            primary={{
              label: 'Aplicar',
              onPress: () => {
                setAplicado(soAtivos)
                setOpen(false)
              },
            }}
            cancel={{ label: 'Limpar', onPress: () => setSoAtivos(false) }}
          />
        }
      >
        <View className="gap-4 px-4 pb-4">
          <Checkbox label="Só clientes ativos" checked={soAtivos} onCheckedChange={setSoAtivos} />
        </View>
      </Sheet>
    </>
  )
}

function SeparatorExample() {
  return (
    <Stack gap="3">
      <Separator />
      <Separator label="ou" />
    </Stack>
  )
}

function BadgeExample() {
  return (
    <Inline gap="2">
      <Badge dot>Neutro</Badge>
      <Badge tone="primary" dot>
        Primario
      </Badge>
      <Badge tone="success" dot>
        Ativo
      </Badge>
      <Badge tone="warning" dot>
        Alerta
      </Badge>
      <Badge tone="error" dot>
        Critico
      </Badge>
      <Badge tone="info" dot>
        Informativo
      </Badge>
      <Badge tone="outline" dot>
        Rascunho
      </Badge>
    </Inline>
  )
}

function AvatarExample() {
  return (
    <Stack gap="3">
      <Inline gap="2">
        <Avatar name="Ana Souza" size="sm" />
        <Avatar name="Bruno Lima" size="md" />
        <Avatar name="Carla Dias" size="lg" />
      </Inline>
      <AvatarGroup
        people={[
          { name: 'Ana Souza' },
          { name: 'Bruno Lima' },
          { name: 'Carla Dias' },
          { name: 'Diego Nunes' },
          { name: 'Elis Prado' },
          { name: 'Fabio Rocha' },
        ]}
        max={4}
      />
    </Stack>
  )
}

function ListExample() {
  const [items, setItems] = useState<ListItem[]>([
    { id: '1', title: 'Ana Souza', description: 'ana@exemplo.com', href: '/componentes/exibicao', tone: 'success' },
    { id: '2', title: 'Bruno Lima', description: 'bruno@exemplo.com', onPress: () => {} },
    { id: '3', title: 'Carla Dias', description: 'carla@exemplo.com', tone: 'error' },
  ])
  return <List scrollEnabled={false} items={items} onReorder={setItems} />
}

function StatCardExample() {
  return (
    <StatCard
      label="Receita mensal"
      value="R$ 12.480,00"
      change={8.2}
      icon={<Wallet />}
      highlight
    />
  )
}

function AccordionExample() {
  return (
    <Accordion
      defaultValue={['envio']}
      items={[
        { value: 'envio', title: 'Envio', content: 'Prazo de 5 dias úteis para todo o Brasil.' },
        { value: 'pagamento', title: 'Pagamento', content: 'Aceita Pix, boleto e cartão em até 12x.' },
        { value: 'trocas', title: 'Trocas e devoluções', content: 'Até 30 dias após o recebimento.' },
      ]}
    />
  )
}

function TabsExample() {
  const naoLidas = (n: number) => (n === 1 ? '1 não lida' : `${n} não lidas`)
  return (
    <Stack gap="6">
    <Tabs
      accessibilityLabel="Seções do exemplo"
      items={[
        { value: 'visao-geral', label: 'Visão geral', content: 'Resumo consolidado do período selecionado.' },
        { value: 'pedidos', label: 'Pedidos', count: 12, content: 'Lista de pedidos em aberto.' },
        { value: 'pagamentos', label: 'Pagamentos', content: 'Histórico de pagamentos recebidos.' },
        { value: 'configuracoes', label: 'Configurações', content: 'Preferências gerais da conta.' },
        { value: 'relatorios', label: 'Relatórios', content: 'Exportação de dados em PDF ou CSV.' },
      ]}
    />
    {/* Abas demais para a largura: com overflow="scroll" elas continuam abas e a lista rola, em vez de virar um Select. */}
    <Tabs
      variant="pill"
      overflow="scroll"
      accessibilityLabel="Etapas com rolagem"
      items={[
        { value: 'ura', label: 'URA/IA', content: 'Conversas com o assistente virtual.' },
        { value: 'fila', label: 'Fila', count: 3, countLabel: naoLidas, content: 'Conversas esperando uma pessoa.' },
        { value: 'atendimento', label: 'Atendimento', count: 1, countLabel: naoLidas, content: 'Conversas em andamento.' },
        { value: 'encerrado', label: 'Encerrado', content: 'Conversas finalizadas.' },
      ]}
    />
    </Stack>
  )
}

// C8 (veredito do Opus): exemplo exato do achado, um degradê por variante sobre o fundo que ela
// pressupõe (sidebar, degradê de marca), único <Gradient> literal deste arquivo.
function BrandLogoExample() {
  return (
    <Stack gap="3">
      <BrandLogo />
      <View className="rounded-surface bg-sidebar p-4">
        <BrandLogo on="sidebar" size="sm" />
      </View>
      <View className="relative overflow-hidden rounded-surface p-4">
        <View
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="absolute inset-0"
        >
          <Gradient token="brand" className="size-full" />
        </View>
        <BrandLogo on="brand" />
      </View>
      <BrandLogo symbolOnly />
    </Stack>
  )
}

const emMil = (n: number) => `R$ ${(n / 1000).toLocaleString('pt-BR')} mil`

function ChartExample() {
  const receitaEMeta = [
    { key: 'receita', label: 'Receita' },
    { key: 'meta', label: 'Meta', color: 3 as const },
  ]
  return (
    <Stack gap="6">
      <Stack gap="2">
        <Text weight="medium" className="text-sm text-foreground">Linha</Text>
        <Chart type="line" aria-label="Receita e meta em linha" data={receitaMensal} xKey="mes" series={receitaEMeta} valueFormatter={emMil} />
      </Stack>
      <Stack gap="2">
        <Text weight="medium" className="text-sm text-foreground">Barras</Text>
        <Chart type="bar" aria-label="Receita por mês" data={receitaMensal} xKey="mes" series={[{ key: 'receita', label: 'Receita' }]} valueFormatter={emMil} />
      </Stack>
      <Stack gap="2">
        <Text weight="medium" className="text-sm text-foreground">Área</Text>
        <Chart type="area" aria-label="Receita e meta por mês" data={receitaMensal} xKey="mes" series={receitaEMeta} valueFormatter={emMil} />
      </Stack>
      <Stack gap="2">
        <Text weight="medium" className="text-sm text-foreground">Pizza</Text>
        <Chart type="pie" aria-label="Clientes por segmento" data={porSegmento} xKey="segmento" series={[{ key: 'clientes', label: 'Clientes' }]} />
      </Stack>
      <Stack gap="2">
        <Text weight="medium" className="text-sm text-foreground">Combinado (barra e linha)</Text>
        <Chart
          type="combo"
          aria-label="Receita em barras e meta em linha"
          data={receitaMensal}
          xKey="mes"
          series={[
            { key: 'receita', label: 'Receita', kind: 'bar' },
            { key: 'meta', label: 'Meta', kind: 'line', color: 3 },
          ]}
          valueFormatter={emMil}
        />
      </Stack>
      <Stack gap="2">
        <Text weight="medium" className="text-sm text-foreground">Velocímetro de meta</Text>
        <Chart type="gauge" aria-label="Meta do mês" valueFormatter={formatCurrency} {...metaDoMes} />
      </Stack>
      <Stack gap="2">
        <Text weight="medium" className="text-sm text-foreground">Funil</Text>
        <Chart type="funnel" aria-label="Funil de vendas" stages={funilVendas} />
      </Stack>
    </Stack>
  )
}

function TimelineExample() {
  return <Timeline events={historicoContrato} />
}

function CalendarExample() {
  const [ultimo, setUltimo] = useState<string | null>(null)
  return (
    <Stack gap="3">
      <Calendar events={demoEvents} defaultDate={referencia} onEventClick={(e) => setUltimo(e.title)} />
      {ultimo ? <Text className="text-sm text-muted-foreground">{`Evento aberto: ${ultimo}`}</Text> : null}
    </Stack>
  )
}

const camposKanban = [
  { key: 'ps', label: 'P&S' },
  { key: 'mrr', label: 'MRR' },
]

function KanbanExample() {
  const [cards, setCards] = useState<KanbanCard[]>(demoCards)
  return (
    <Kanban
      aria-label="Funil comercial"
      columns={pipelineColumns}
      cards={cards}
      valueFields={camposKanban}
      scrollEnabled={false}
      onCardMove={(id, para, indice) => setCards((lista) => moveKanbanCard(lista, id, para, indice))}
      onAddCard={(coluna) =>
        setCards((lista) => [...lista, { id: `novo-${lista.length + 1}`, columnId: coluna, title: `Novo card ${lista.length + 1}` }])
      }
    />
  )
}

const destinosKanban: KanbanDropTarget[] = [
  { id: 'ganho', label: 'Marcar como ganho', icon: <Handshake className="size-icon-sm text-success-soft-foreground" />, tone: 'success' },
  { id: 'perdido', label: 'Marcar como perdido', hint: 'Encerra o negócio', icon: <XCircle className="size-icon-sm text-destructive-soft-foreground" /> },
  {
    id: 'arquivar',
    label: 'Arquivar',
    icon: <Archive className="size-icon-sm text-muted-foreground" />,
    disabled: true,
    disabledReason: 'Só depois de ganho ou perdido',
  },
]

function KanbanDestinosExample() {
  const [cards, setCards] = useState<KanbanCard[]>(demoCards)
  const [ultimo, setUltimo] = useState<string | null>(null)
  return (
    <Stack gap="3">
      <Kanban
        aria-label="Funil comercial com destinos"
        columns={pipelineColumns}
        cards={cards}
        valueFields={camposKanban}
        scrollEnabled={false}
        dropTargets={destinosKanban}
        onCardMove={(id, para, indice) => setCards((lista) => moveKanbanCard(lista, id, para, indice))}
        onDropTarget={(id, alvo) => {
          const card = cards.find((c) => c.id === id)
          setUltimo(`${card?.title ?? id}: ${destinosKanban.find((d) => d.id === alvo)?.label ?? alvo}`)
          if (alvo === 'ganho') setCards((lista) => moveKanbanCard(lista, id, 'fechamento', 0))
        }}
      />
      {ultimo ? <Text className="text-sm text-muted-foreground">{`Destino escolhido: ${ultimo}`}</Text> : null}
    </Stack>
  )
}

const capturasDeExemplo: ViewerImage[] = [
  {
    src: require('../../assets/showcase/safira-componentes-mobile.png'),
    alt: 'Captura da vitrine de componentes no modelo Safira, em tela de celular',
    caption: 'Componentes, Safira',
  },
  {
    src: require('../../assets/showcase/aurora-galeria-mobile.png'),
    alt: 'Captura da galeria no modelo Aurora, em tela de celular',
    caption: 'Galeria, Aurora',
  },
  {
    src: require('../../assets/showcase/equilibrio-tokens-mobile.png'),
    alt: 'Captura dos tokens no modelo Equilíbrio, em tela de celular',
    caption: 'Tokens, Equilíbrio',
  },
  {
    src: require('../../assets/showcase/safira-cliente-mobile.png'),
    alt: 'Captura do detalhe de um cliente no modelo Safira, em tela de celular',
  },
]

function ImageViewerExample() {
  const [index, setIndex] = useState<number | null>(null)
  return (
    <>
      <Button variant="outline" onPress={() => setIndex(0)}>
        Abrir galeria de exemplo
      </Button>
      <ImageViewer images={capturasDeExemplo} index={index} onIndexChange={setIndex} />
    </>
  )
}

function ChatExample() {
  // A espera na fila e contada a partir de agora, senao o exemplo diria "Esperando ha 0 min" (as datas dos mocks sao fixas).
  const [tickets, setTickets] = useState<Ticket[]>(() =>
    demoTickets.map((t) => (t.waitingSince ? { ...t, waitingSince: new Date(Date.now() - 12 * 60000) } : t)),
  )
  const [activeId, setActiveId] = useState(demoTickets[0]!.id)
  const [quote, setQuote] = useState<ChatMessage | null>(null)
  const [editing, setEditing] = useState<ChatMessage | null>(null)
  const ativo = tickets.find((t) => t.id === activeId) ?? tickets[0]!

  const mudarMensagens = (fn: (lista: ChatMessage[]) => ChatMessage[]) =>
    setTickets((ts) => ts.map((t) => (t.id === ativo.id ? { ...t, messages: fn(t.messages) } : t)))

  return (
    <Stack gap="3">
      <ConversationList
        items={tickets}
        activeId={ativo.id}
        onSelect={(id) => {
          setActiveId(id)
          setQuote(null)
          setEditing(null)
          setTickets((ts) => ts.map((t) => (t.id === id ? { ...t, unread: undefined } : t)))
        }}
      />
      <View testID="chat-canal-ativo" className="flex-row items-center gap-2">
        <Text className="text-sm text-muted-foreground">Canal da conversa aberta</Text>
        <ChannelBadge channel={ativo.channel} />
      </View>
      <View className="h-chart-md overflow-hidden rounded-surface border border-border">
        <ChatThread
          messages={ativo.messages}
          onReply={(m) => {
            setEditing(null)
            setQuote(m)
          }}
          onReact={(m, emoji) =>
            mudarMensagens((lista) =>
              lista.map((x) => {
                if (x.id !== m.id) return x
                const reacoes = x.reactions ?? []
                return { ...x, reactions: reacoes.includes(emoji) ? reacoes.filter((r) => r !== emoji) : [...reacoes, emoji] }
              }),
            )
          }
          onEdit={(m) => {
            setQuote(null)
            setEditing(m)
          }}
          onDelete={(m) => mudarMensagens((lista) => lista.map((x) => (x.id === m.id ? { ...x, deleted: true } : x)))}
        />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="overflow-hidden rounded-surface border border-border">
          <ChatComposer
            quote={quote ? { author: quote.author, text: quote.text } : null}
            onCancelQuote={() => setQuote(null)}
            editing={editing ? { id: editing.id, text: editing.text } : null}
            onCancelEdit={() => setEditing(null)}
            quickReplies={quickRepliesDemo}
            onPickFiles={async () => [{ name: 'Orçamento.pdf', uri: 'exemplo://orcamento.pdf', type: 'application/pdf', size: 184320 }]}
            onPickMedia={async () => [{ name: 'Foto da vitrine.jpg', uri: 'exemplo://vitrine.jpg', type: 'image/jpeg', size: 921600 }]}
            onSend={({ text, files, audioSeconds }) => {
              if (editing) {
                mudarMensagens((lista) => lista.map((x) => (x.id === editing.id ? { ...x, text, editedFrom: x.editedFrom ?? x.text } : x)))
                setEditing(null)
                return
              }
              const nova: ChatMessage = {
                id: `nova-${ativo.messages.length + 1}`,
                from: 'agent',
                author: 'Bruno Lima',
                text: text || undefined,
                time: new Date(2026, 9, 5, 10, 0 + ativo.messages.length),
                status: 'sent',
                replyTo: quote ? { id: quote.id, author: quote.author, text: quote.text } : undefined,
                attachments: files.map((f) => ({ name: f.name, type: f.type, size: f.size, duration: audioSeconds })),
              }
              mudarMensagens((lista) => [...lista, nova])
              setQuote(null)
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </Stack>
  )
}

function RatingExample() {
  const [estrelas, setEstrelas] = useState<number | null>(4)
  const [nps, setNps] = useState<number | null>(null)
  return (
    <Stack gap="6">
      <Rating accessibilityLabel="Avaliação do atendimento" value={estrelas} onChange={setEstrelas} />
      <Rating
        variant="scale"
        min={0}
        accessibilityLabel="Chance de recomendar"
        lowLabel="Nada provável"
        highLabel="Muito provável"
        value={nps}
        onChange={setNps}
      />
    </Stack>
  )
}

function ChecklistExample() {
  const [itens, setItens] = useState<ChecklistItem[]>([
    { id: 'c1', label: 'Conferir o contrato', checked: true },
    { id: 'c2', label: 'Enviar a proposta', checked: false },
  ])
  return <Checklist accessibilityLabel="Passos do onboarding" value={itens} onChange={setItens} />
}

function PaginationExample() {
  const [paginas, setPaginas] = useState(3)
  const [carregadas, setCarregadas] = useState(1)
  return (
    <Stack gap="6">
      <Pagination page={paginas} pageSize={10} total={248} onPageChange={setPaginas} />
      <Pagination mobileMode="loadMore" page={carregadas} pageSize={10} total={248} onPageChange={setCarregadas} />
    </Stack>
  )
}

function DataToolbarExample() {
  const [busca, setBusca] = useState('')
  const [situacao, setSituacao] = useState<string | null>(null)
  const [ordem, setOrdem] = useState<string | null>(null)
  const [mostraEmail, setMostraEmail] = useState(true)
  return (
    <Card className="border-border">
      <DataToolbar
        search={{ value: busca, onChange: setBusca, placeholder: 'Buscar cliente' }}
        filters={
          <Select
            label="Situação"
            placeholder="Todas"
            clearable
            value={situacao}
            onChange={setSituacao}
            options={situacoes.map((s) => ({ value: s, label: s }))}
          />
        }
        filterCount={situacao ? 1 : 0}
        chips={situacao ? [{ id: 'situacao', label: situacao, onRemove: () => setSituacao(null) }] : []}
        onClearFilters={() => setSituacao(null)}
        sort={
          <Select
            label="Ordenar por"
            placeholder="Ordem padrão"
            clearable
            value={ordem}
            onChange={setOrdem}
            options={[
              { value: 'nome', label: 'Nome' },
              { value: 'mrr', label: 'Mensalidade' },
            ]}
          />
        }
        columns={[{ id: 'email', label: 'E-mail', visible: mostraEmail, onToggle: setMostraEmail }]}
        primaryAction={<Button icon={<UserPlus className="text-primary-foreground" />} onPress={() => {}}>Novo cliente</Button>}
      />
    </Card>
  )
}

const colunasClientes: TableColumn<Cliente>[] = [
  { id: 'nome', header: 'Nome', accessor: (c) => c.nome, mobile: 'primary' },
  { id: 'situacao', header: 'Situação', accessor: (c) => c.situacao, kind: 'badge', badgeTone: (c) => statusTone[c.situacao], mobile: 'primary' },
  { id: 'segmento', header: 'Segmento', accessor: (c) => c.segmento },
  { id: 'cidade', header: 'Cidade', accessor: (c) => c.cidade },
  { id: 'mrr', header: 'Mensalidade', accessor: (c) => c.mrr, kind: 'currency' },
  { id: 'email', header: 'E-mail', accessor: (c) => c.email },
]

function TableExample() {
  const [busca, setBusca] = useState('')
  return (
    <Table<Cliente>
      accessibilityLabel="Clientes"
      data={clients}
      columns={colunasClientes}
      getRowId={(c) => String(c.id)}
      globalFilter={busca}
      selectable
      columnVisibility
      pageSize={5}
      toolbar={{ search: { value: busca, onChange: setBusca, placeholder: 'Buscar cliente' } }}
      rowActions={[
        { label: 'Editar', onPress: () => {} },
        { label: 'Excluir', destructive: true, onPress: () => {} },
      ]}
      bulkActions={(_, limpar) => (
        <Button size="sm" variant="outline" onPress={limpar}>
          Arquivar
        </Button>
      )}
    />
  )
}

const etapasCadastro: WizardStep[] = [
  { id: 'empresa', title: 'Dados da empresa' },
  { id: 'contato', title: 'Contato' },
  { id: 'revisao', title: 'Revisão' },
]

function StepperExample() {
  const [atual, setAtual] = useState(1)
  return (
    <Stack gap="4">
      <Stepper steps={etapasCadastro} current={atual} />
      <ButtonGroup
        options={etapasCadastro.map((_, i) => ({ value: String(i), label: String(i + 1) }))}
        value={String(atual)}
        onChange={(v) => setAtual(Number(v))}
      />
    </Stack>
  )
}

function WizardExample() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  return (
    <Wizard
      steps={etapasCadastro}
      onValidateStep={(i) => (i === 0 ? nome.trim().length > 0 : true)}
      onFinish={() => {
        toast.success('Cadastro concluído')
      }}
    >
      {[
        <Field key="empresa" label="Nome da empresa" required help="Preencha para avançar.">
          <Input value={nome} onChange={setNome} />
        </Field>,
        <Field key="contato" label="E-mail de contato">
          <Input value={email} onChange={setEmail} />
        </Field>,
        <Text key="revisao" className="text-sm text-foreground">
          {`Empresa: ${nome}. Contato: ${email || 'não informado'}.`}
        </Text>,
      ]}
    </Wizard>
  )
}

export const showcaseGroups: ShowcaseGroup[] = [
  {
    slug: 'acoes',
    title: 'Ações',
    entries: [
      { name: 'Button', description: 'Botão de ação principal.', render: () => <ButtonExample />, codes: codigosPara(['Button']) },
      {
        name: 'ButtonGroup',
        description: 'Grupo segmentado ou grupo de botões encostados.',
        render: () => <ButtonGroupExample />,
        codes: codigosPara(['ButtonGroup']),
      },
      { name: 'ActionBar', description: 'Barra de ações de rodapé.', render: () => <ActionBarExample />, codes: codigosPara(['ActionBar']) },
      {
        name: 'DropdownMenu',
        description: 'Menu de ações em folha inferior.',
        render: () => <DropdownMenuExample />,
        codes: codigosPara(['DropdownMenuContent']),
      },
    ],
  },
  {
    slug: 'formulario',
    title: 'Formulário',
    entries: [
      { name: 'Input', description: 'Campo de texto com máscara e adornos.', render: () => <InputExample />, codes: codigosPara(['Input']) },
      {
        name: 'Textarea',
        description: 'Campo de texto multilinha com auto-crescimento.',
        render: () => <TextareaExample />,
        codes: codigosPara(['Textarea']),
      },
      { name: 'Select', description: 'Seletor em folha inferior com busca.', render: () => <SelectExample />, codes: codigosPara(['Select']) },
      {
        name: 'Select (lista longa)',
        description: 'Mesmo Select, com lista maior que a folha, rolável até o último item.',
        render: () => <SelectListaLongaExample />,
        codes: codigosPara(['Select']),
      },
      { name: 'Checkbox', description: 'Caixa de marcação isolada.', render: () => <CheckboxExample />, codes: codigosPara(['Checkbox']) },
      {
        name: 'RadioGroup',
        description: 'Escolha única entre opções.',
        render: () => <RadioGroupExample />,
        codes: codigosPara(['RadioGroup']),
      },
      { name: 'Switch', description: 'Alternância ligado/desligado.', render: () => <SwitchExample />, codes: codigosPara(['Switch']) },
      {
        name: 'Slider',
        description: 'Seleção de valor numérico por arraste.',
        render: () => <SliderExample />,
        codes: codigosPara(['Slider']),
      },
      {
        name: 'OtpInput',
        description: 'Código de verificação por dígitos.',
        render: () => <OtpInputExample />,
        codes: codigosPara(['OtpInput']),
      },
      {
        name: 'DatePicker',
        description: 'Seleção de data em calendário.',
        render: () => <DatePickerExample />,
        codes: codigosPara(['DatePicker']),
      },
      {
        name: 'Field',
        description: 'Rótulo, ajuda e erro ao redor de um campo.',
        render: () => <FieldExample />,
        codes: codigosPara(['Field']),
      },
      {
        name: 'Formulário (RHF)',
        description: 'Formulário completo com react-hook-form e validação.',
        render: () => <FormularioRhfExample />,
        codes: codigosPara(['Form'], ['FormSection']),
      },
      {
        name: 'RichTextEditor',
        description: 'Editor de texto rico: visual no celular (WebView), só o modo HTML no navegador (subcaminho @rendra-ui/app/rich-text-editor).',
        render: () => <RichTextEditorExample />,
        codes: codigosPara(['RichTextEditor']),
      },
      {
        name: 'Rating',
        description: 'Avaliação em estrelas ou em escala, com rótulo nas pontas.',
        render: () => <RatingExample />,
        codes: codigosPara(['Rating', { variant: 'stars' }], ['Rating', { variant: 'scale' }]),
      },
      {
        name: 'Checklist',
        description: 'Lista de itens que se marcam, renomeiam, adicionam e removem.',
        render: () => <ChecklistExample />,
        codes: codigosPara(['Checklist']),
      },
    ],
  },
  {
    slug: 'feedback',
    title: 'Feedback',
    entries: [
      {
        name: 'BrandFeedbackIcon',
        description: 'Ícone de retorno com o símbolo da marca.',
        render: () => <BrandFeedbackIconExample />,
        codes: codigosPara(['BrandFeedbackIcon']),
      },
      { name: 'Alert', description: 'Aviso em linha com tom, ação e fechar.', render: () => <AlertExample />, codes: codigosPara(['Alert']) },
      { name: 'Toast', description: 'Notificação temporária no rodapé.', render: () => <ToastExample />, codes: codigosPara(['toast']) },
      {
        name: 'Progress',
        description: 'Barra de progresso determinada ou indeterminada.',
        render: () => <ProgressExample />,
        codes: codigosPara(['Progress']),
      },
      { name: 'Skeleton', description: 'Marcador de carregamento.', render: () => <SkeletonExample />, codes: codigosPara(['Skeleton']) },
      {
        name: 'Spinner',
        description: 'Indicador de carregamento breve, em botão, campo ou lista.',
        render: () => <SpinnerExample />,
        codes: codigosPara(['Spinner']),
      },
      {
        name: 'EmptyState',
        description: 'Estado vazio com ícone, texto e ações.',
        render: () => <EmptyStateExample />,
        codes: codigosPara(['EmptyState']),
      },
      { name: 'InfoHint', description: 'Ajuda contextual em modal.', render: () => <InfoHintExample />, codes: codigosPara(['InfoHint']) },
      {
        name: 'Modal',
        description: 'Diálogo de confirmação, exclusão, informação ou formulário.',
        render: () => <ModalExample />,
        codes: codigosPara(['Modal', { type: 'form' }]),
      },
      {
        name: 'Drawer',
        description: 'Painel lateral em tela cheia com confirmação de descarte.',
        render: () => <DrawerExample />,
        codes: codigosPara(['Drawer']),
      },
      {
        name: 'Sheet',
        description: 'Folha inferior com título, Fechar e rodapé de ações.',
        render: () => <SheetExample />,
        codes: codigosPara(['Sheet']),
      },
    ],
  },
  {
    slug: 'exibicao',
    title: 'Exibição',
    entries: [
      { name: 'Card', description: 'Contêiner com cabeçalho, conteúdo e rodapé.', render: () => <CardExample />, codes: codigosPara(['Card']) },
      { name: 'Badge', description: 'Selo de status em 7 tons.', render: () => <BadgeExample />, codes: codigosPara(['Badge']) },
      {
        name: 'Avatar',
        description: 'Foto ou iniciais, isolado ou em grupo.',
        render: () => <AvatarExample />,
        codes: codigosPara(['Avatar'], ['AvatarGroup']),
      },
      {
        name: 'List',
        description: 'Lista de itens com navegação, ação ou só leitura, e reordenável pela alça de cada linha.',
        render: () => <ListExample />,
        codes: codigosPara(['List'], ['List', { sortable: true }]),
      },
      {
        name: 'StatCard',
        description: 'Cartão de indicador com variação.',
        render: () => <StatCardExample />,
        codes: codigosPara(['StatCard']),
      },
      {
        name: 'Accordion',
        description: 'Conteúdo recolhível em seções.',
        render: () => <AccordionExample />,
        codes: codigosPara(['Accordion']),
      },
      {
        name: 'Tabs',
        description: 'Seções alternadas por abas ou seletor.',
        render: () => <TabsExample />,
        codes: codigosPara(['Tabs']),
      },
      {
        name: 'Separator',
        description: 'Linha divisória, com ou sem rótulo.',
        render: () => <SeparatorExample />,
        codes: codigosPara(['Separator']),
      },
      {
        name: 'BrandLogo',
        description: 'Selo e nome da marca ativa.',
        render: () => <BrandLogoExample />,
        codes: codigosPara(['BrandLogo']),
      },
      {
        name: 'DocumentViewer',
        description: 'PDF dentro do app no iOS; no Android e no navegador abre no aplicativo de PDF (subcaminho @rendra-ui/app/document-viewer).',
        render: () => <DocumentViewerExample />,
        codes: codigosPara(['DocumentViewer']),
      },
      {
        name: 'Stepper',
        description: 'Indicador de etapas: "Etapa 2 de 3", barra de progresso e nome da etapa.',
        render: () => <StepperExample />,
        codes: codigosPara(['Stepper']),
      },
      {
        name: 'Wizard',
        description: 'Cadastro em etapas com validação, Voltar e Avançar.',
        render: () => <WizardExample />,
        codes: codigosPara(['Wizard']),
      },
    ],
  },
  {
    slug: 'layout',
    title: 'Layout',
    entries: [
      { name: 'Container', description: 'Largura máxima e respiro lateral da tela.', render: () => <ContainerExample /> },
      { name: 'Stack', description: 'Empilhamento vertical com espaçamento.', render: () => <StackExample /> },
      { name: 'Inline', description: 'Disposição horizontal com quebra de linha.', render: () => <InlineExample /> },
      { name: 'Grid', description: 'Grade de colunas fixas.', render: () => <GridExample /> },
      { name: 'Section', description: 'Bloco de conteúdo com título e descrição.', render: () => <SectionExample /> },
      { name: 'PageHeader', description: 'Cabeçalho de tela com título, descrição e ajuda.', render: () => <PageHeaderExample /> },
    ],
  },
  {
    slug: 'dados',
    title: 'Dados',
    entries: [
      {
        name: 'Chart',
        description: 'Gráficos de linha, barra, área, pizza, combinado, velocímetro de meta e funil (subcaminho @rendra-ui/app/chart).',
        render: () => <ChartExample />,
        codes: codigosPara(
          ['Chart', { type: 'line' }],
          ['Chart', { type: 'bar' }],
          ['Chart', { type: 'area' }],
          ['Chart', { type: 'pie' }],
          ['Chart', { type: 'combo' }],
          ['Chart', { type: 'gauge' }],
          ['Chart', { type: 'funnel' }],
        ),
      },
      {
        name: 'Timeline',
        description: 'Eventos em ordem, com tom semântico, data curta e resultado com ícone e texto.',
        render: () => <TimelineExample />,
        codes: codigosPara(['Timeline']),
      },
      {
        name: 'Pagination',
        description: 'Anterior e próxima com "Página X de Y", ou "Carregar mais".',
        render: () => <PaginationExample />,
        codes: codigosPara(['Pagination']),
      },
      {
        name: 'DataToolbar',
        description: 'Busca, filtros em gaveta, chips dos filtros e ação principal acima de uma listagem.',
        render: () => <DataToolbarExample />,
        codes: codigosPara(['DataToolbar']),
      },
      {
        name: 'Table',
        description: 'Dados em lista de cards, com busca, ordenação, seleção, ações por linha e paginação.',
        render: () => <TableExample />,
        codes: codigosPara(['Table']),
      },
    ],
  },
  {
    slug: 'planejamento',
    title: 'Planejamento',
    entries: [
      {
        name: 'Calendar',
        description: 'Agenda com visão de mês, dia e lista de eventos; toque no dia e no evento.',
        render: () => <CalendarExample />,
        codes: codigosPara(['Calendar']),
      },
      {
        name: 'Kanban',
        description: 'Funil em colunas, uma por vez; o menu do card move para outra coluna ou reordena.',
        render: () => <KanbanExample />,
        codes: codigosPara(['Kanban']),
      },
      {
        name: 'Kanban com destinos',
        description: 'Mesmo funil, com destinos além das colunas no menu Mover para (ganho, perdido, arquivar).',
        render: () => <KanbanDestinosExample />,
        codes: codigosPara(['Kanban', { hasDropTargets: true }]),
      },
      {
        name: 'ImageViewer',
        description: 'Galeria em tela cheia: arraste para trocar, pinça para ampliar, toque duplo para alternar o zoom.',
        render: () => <ImageViewerExample />,
        codes: codigosPara(['ImageViewer']),
      },
      {
        name: 'Atendimento (chat)',
        description: 'Lista de conversas, histórico e campo de mensagem; pressão longa no balão abre as ações.',
        render: () => <ChatExample />,
        codes: codigosPara(['ConversationList'], ['ChatThread'], ['ChatComposer']),
      },
    ],
  },
]
