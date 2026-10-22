export interface RouteSeo {
  path: string
  title: string
  description: string
  indexable: boolean
}

export const siteSeo = {
  productName: 'Rendra App',
  tagline: 'Design system e boilerplate mobile do Rendra, em React Native (Expo) com Expo Router e NativeWind.',
  audience:
    'Quem começa um app novo em React Native (Expo) e quer um design system pronto, ou quem já tem um app e quer migrar a camada visual para o Rendra.',
  repositoryUrl: 'https://github.com/bsmagalhaes/rendra-ui-app',
  commands: ['npm install', 'npm start', 'npm run build', 'npm test'],
}

/**
 * Espelha `showcaseGroups` de `./showcase` (slug e title de cada grupo), sem importar o módulo:
 * `showcase.tsx` importa `react-native`/`lucide-react-native`/`react-hook-form` e todos os
 * componentes, o que quebra quando este módulo é carregado por um script Node puro fora do
 * Jest, como o gerador de SEO do build. A paridade com o módulo real é conferida por teste
 * (`seo.test.ts`, que importa `showcase` só para o teste).
 */
export const SEO_GROUPS = [
  { slug: 'acoes', title: 'Ações' },
  { slug: 'formulario', title: 'Formulário' },
  { slug: 'feedback', title: 'Feedback' },
  { slug: 'exibicao', title: 'Exibição' },
  { slug: 'layout', title: 'Layout' },
  { slug: 'dados', title: 'Dados' },
  { slug: 'planejamento', title: 'Planejamento' },
] as const

const rotasFixas: RouteSeo[] = [
  {
    path: '/',
    title: `${siteSeo.productName}`,
    description: 'Design system e boilerplate mobile do Rendra, com 68 componentes de UI, tokens em três camadas e três modelos de marca, em React Native e Expo.',
    indexable: true,
  },
  {
    path: '/componentes',
    title: `Componentes · ${siteSeo.productName}`,
    description: 'Vitrine dos componentes de UI do Rendra App, organizados por ações, formulário, feedback, exibição, layout, dados e planejamento.',
    indexable: true,
  },
  {
    path: '/tokens',
    title: `Tokens · ${siteSeo.productName}`,
    description: 'Escala de espaço, tipografia, raio, sombra e cor do Rendra App, com os três modelos de marca lado a lado.',
    indexable: true,
  },
  {
    path: '/galeria',
    title: `Galeria · ${siteSeo.productName}`,
    description: 'Galeria ao vivo do Rendra App, com troca de modelo, paleta e modo claro/escuro em tempo real.',
    indexable: true,
  },
  {
    path: '/painel',
    title: `Painel · ${siteSeo.productName}`,
    description: 'Painel de exemplo do Rendra App, com indicadores, clientes recentes e atividade, dentro do menu de navegação do AppShell.',
    indexable: true,
  },
  {
    path: '/configuracoes',
    title: `Configurações · ${siteSeo.productName}`,
    description: 'Configurações de exemplo do Rendra App, em seis seções: perfil, empresa, notificações, segurança, aparência e layout do menu.',
    indexable: true,
  },
  {
    path: '/login',
    title: `Entrar · ${siteSeo.productName}`,
    description: 'Tela de entrada de exemplo do Rendra App, com painel de marca, formulário validado e o crédito Feito com Rendra.',
    indexable: true,
  },
  {
    path: '/clientes',
    title: `Clientes · ${siteSeo.productName}`,
    description: 'Lista de clientes de exemplo do Rendra App, com busca, filtros de situação e segmento, paginação e exclusão com confirmação.',
    indexable: true,
  },
  {
    path: '/clientes/novo',
    title: `Novo cliente · ${siteSeo.productName}`,
    description: 'Formulário completo de novo cliente do Rendra App, com máscaras de CNPJ, CEP e telefone, validação e busca fictícia.',
    indexable: true,
  },
  {
    path: '/cadastro',
    title: `Cadastro guiado · ${siteSeo.productName}`,
    description: 'Cadastro guiado do Rendra App em quatro etapas, com progresso, validação por etapa e revisão antes de concluir.',
    indexable: true,
  },
  {
    path: '/tarefas',
    title: `Tarefas · ${siteSeo.productName}`,
    description: 'Tarefas de exemplo do Rendra App, com busca, seleção de várias linhas, prioridade, prazo e conclusão em massa.',
    indexable: true,
  },
  {
    path: '/atendimento',
    title: `Atendimento · ${siteSeo.productName}`,
    description: 'Atendimento de exemplo do Rendra App, com conversas por etapa, busca, filtro por canal, chat completo e assumir da fila.',
    indexable: true,
  },
  {
    path: '/agenda',
    title: `Agenda · ${siteSeo.productName}`,
    description: 'Agenda de exemplo do Rendra App, com calendário em mês, dia e lista, detalhe do evento e criação de novos compromissos.',
    indexable: true,
  },
  {
    path: '/kanban',
    title: `Funil comercial · ${siteSeo.productName}`,
    description: 'Funil comercial de exemplo do Rendra App, com cards por etapa, totais de P&S e MRR, alerta de limite e mover pelo menu.',
    indexable: true,
  },
  {
    path: '/esqueci-senha',
    title: `Esqueci a senha · ${siteSeo.productName}`,
    description: 'Recuperação de senha de exemplo do Rendra App: pede o e-mail e segue para a verificação em duas etapas.',
    indexable: false,
  },
  {
    path: '/verificacao',
    title: `Verificação em duas etapas · ${siteSeo.productName}`,
    description: 'Verificação em duas etapas de exemplo do Rendra App, com código de seis dígitos e reenvio depois de 30 segundos.',
    indexable: false,
  },
  {
    path: '/nova-senha',
    title: `Nova senha · ${siteSeo.productName}`,
    description: 'Nova senha de exemplo do Rendra App, com medidor de força e confirmação da senha.',
    indexable: false,
  },
  {
    path: '/cadastre-se',
    title: `Criar conta · ${siteSeo.productName}`,
    description: 'Criação de conta de exemplo do Rendra App, com máscara de telefone e aceite dos termos de uso.',
    indexable: false,
  },
  {
    path: '/componentes-motion',
    title: `Componentes com motion · ${siteSeo.productName}`,
    description: 'Tela experimental de comparação dos 30 componentes com movimento, com chave para ligar e desligar o motion.',
    indexable: false,
  },
  {
    path: '/dashboard-motion',
    title: `Dashboard com motion · ${siteSeo.productName}`,
    description: 'Tela experimental de dashboard com entrada em cascata e contadores, com chave para ligar e desligar o motion.',
    indexable: false,
  },
]

const rotasDeGrupo: RouteSeo[] = SEO_GROUPS.map((grupo) => ({
  path: `/componentes/${grupo.slug}`,
  title: `${grupo.title} · Componentes · ${siteSeo.productName}`,
  description: `Componentes de ${grupo.title.toLowerCase()} do Rendra App, com exemplos ao vivo e os três modelos de marca.`,
  indexable: true,
}))

export const routeSeo: RouteSeo[] = [...rotasFixas, ...rotasDeGrupo]
