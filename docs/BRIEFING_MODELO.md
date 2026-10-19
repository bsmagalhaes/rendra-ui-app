# Briefing do produto

Modelo para a IA conduzir com a pessoa. As respostas vão para `docs/BRIEFING.md`, no mesmo formato deste modelo.

## Como conduzir

- Nada é construído antes de o briefing estar confirmado. A IA grava as respostas em `docs/BRIEFING.md` (fora do git), primeiro como rascunho, e só planeja depois do status confirmado. A IA que não consegue gravar arquivos (chat sem terminal) conduz tudo em texto e, ao confirmar, entrega o `docs/BRIEFING.md` inteiro num bloco de texto.
- Blocos abertos (1, 2, 7, 9, 10, 12, 13 e 14) são perguntados agrupados numa mensagem, o bloco inteiro de uma vez. O bloco 8 é uma tabela mostrada de uma vez.
- Escolhas guiadas, uma decisão por mensagem, nesta ordem e pulando o que não se aplica: 3.1 a 3.3, 4, 5, 6 e 11. Quando a pessoa der várias decisões numa resposta, aceite e siga para a próxima em aberto.
- Toda pergunta é uma mensagem com opções numeradas e o padrão marcado com "(padrão)". A pessoa responde com o número, com vários números de uma vez, ou com "não sei, sugira". Não há comando, botão, arquivo anexado nem ferramenta obrigatória para responder. Se a ferramenta oferecer botões, use-os com as mesmas opções e o mesmo padrão marcado.
- "não sei, sugira": a IA recomenda uma opção em uma frase, ancorada no negócio (bloco 1) e nos usuários (bloco 2), e a pessoa confirma.
- Nunca peça código de cor, SVG ou código de componente sem uma sugestão pronta. Nenhuma pergunta técnica: comandos, instalação, testes e capturas são da IA.
- O que a pessoa não sabe ou não tem agora vira pendência (bloco 14). A IA não inventa dado.
- Na migração, a IA analisa o sistema antes de perguntar (versões, navegação, onde ficam estilos e cores).
- Briefing com mais de 24 horas ou com commits no meio é refeito, não reaproveitado. Exceção: o briefing entregue por um chat sem terminal conta a partir do dia em que é colado; a IA mostra o resumo curto, pergunta se algo mudou e marca de novo "confirmado em" com a data do dia, sem refazer as perguntas.

## Bloco 0: Tipo de trabalho

Este trabalho é:

1. Projeto novo (a partir do clone do Rendra App).
2. Migração de um sistema existente (preencha o bloco 12).
3. Contribuição para o próprio Rendra App (ver `CONTRIBUTING.md`), que pula este briefing.

## Bloco 1: Negócio e produto

Nome do produto. Uma frase que explica o que ele faz. Quem paga e quem usa. Resultado esperado (como saber que deu certo).

## Bloco 2: Usuários e uso

Perfis de quem usa. Onde usam (na rua, no escritório, no navegador do computador). Condições de uso (sol forte, luvas, pressa, conexão ruim, baixa visão). Este bloco sustenta as sugestões da IA: sol e luvas pedem toque grande e contraste; sem sinal pede funcionar sem internet.

## Bloco 3: Plataforma e recursos do aparelho

3.1 Onde o app roda:
1. Android e iOS (padrão)
2. Só Android
3. Só iOS
4. Android, iOS e navegador (o mesmo código já exporta para web)

3.2 Tablet:
1. Só celular (padrão)
2. Celular e tablet

3.3 Orientação:
1. Só em pé (padrão)
2. Também deitado

3.4 Recursos do aparelho, perguntados por uso, agrupados numa mensagem, com sim, não ou não sei: o app precisa tirar foto ou ler código de barras? Avisar a pessoa mesmo com o app fechado? Saber onde a pessoa está? Entrar com digital ou rosto? Funcionar sem internet?

Cada "sim" vira uma linha "recurso, para quê, spec própria" em `docs/BRIEFING.md`. Nada é instalado durante o briefing, e nenhum recurso é instalado só para testar.

## Bloco 4: Navegação

4.0 Código. Tem um código de modelo, de outro projeto Rendra ou de quem indicou (por exemplo `T1-C4-N2`)? Pode ser parte (`T2`, `C4-N3`). Para ver um modelo, uma paleta e o menu, abra `https://bsmagalhaes.github.io/rendra-ui-app/demo/galeria/?codigo=T1-C4-N2` trocando o código (a galeria não mostra o código, só aplica). "Não sei": siga as perguntas abaixo.

| Parte | Códigos e o que definem | Perguntas que pula |
|---|---|---|
| T | `T1` Safira, fonte Poppins: Tudo quadrado, preciso. | 5.1 |
| T | `T2` Equilíbrio, fonte DM Sans: Cantos levemente arredondados, o mais neutro. | 5.1 |
| T | `T3` Aurora, fonte Inter: 100% arredondado, amigável. | 5.1 |
| C | `C1` Safira: Azul e verde. | 6.1 e 6.3 |
| C | `C2` Equilíbrio: Violeta e ciano. | 6.1 e 6.3 |
| C | `C3` Aurora: Verde-petróleo e laranja. | 6.1 e 6.3 |
| C | `C4` Ardósia: Grafite e laranja. | 6.1 e 6.3 |
| N | `N1` Gaveta e barra: Barra inferior com menu em gaveta. | 4.1 e 4.2 |
| N | `N2` Folha e barra: Barra inferior com menu em folha. | 4.1 e 4.2 |
| N | `N3` Só gaveta: Só gaveta, menu no cabeçalho. | 4.1 e 4.2 |

4.1 Barra inferior com até 4 atalhos:
1. Sim (padrão)
2. Não, só o menu (é o N3)

4.2 Como o menu completo abre (só se 4.1 for sim):
1. Gaveta lateral, entra pela esquerda (padrão, é o N1)
2. Folha que sobe de baixo (é o N2)

4.3 A pessoa que usa o app pode mudar isso nas configurações:
1. Sim (padrão)
2. Não

4.4 Conteúdo do menu, pergunta aberta: grupos e itens com ícone; os até 4 atalhos da barra; itens do menu do usuário além de Sair; se a tela de abertura fica no menu como "Início".

4.5 Sino de avisos no cabeçalho:
1. Não (padrão)
2. Sim, diga o que avisa (vem de exemplo no clone)

Não pergunte posição do menu, estado da barra lateral, hover, tipo de submenu nem busca global: não existem no app.

## Bloco 5: Tema

5.1 Modelo, pulado se o código trouxe o T:
1. Safira, fonte Poppins: combina com financeiro, jurídico e dados
2. Equilíbrio, fonte DM Sans: combina com uso geral e neutro
3. Aurora, fonte Inter: combina com saúde, educação e varejo

5.2 Fonte:
1. A do modelo (padrão)
2. Outra: a pessoa diz o nome da fonte, ou "não sei, sugira"; a IA instala e registra

5.3 Rótulo dos campos:
1. Discreto, em letras maiúsculas e menores (padrão)
2. Normal, no tamanho do texto comum

## Bloco 6: Cores

6.1 De onde vêm as cores, pulado se o código trouxe o C:
1. As do tema (padrão)
2. Uma paleta pronta
3. As cores da marca da pessoa

6.2 Identidade (só se 6.1 for 3): a pessoa diz a cor em palavras, mostra o logotipo ou o site. A IA propõe as 4 cores de marca, o degradê de 3 paradas e a cor do texto sobre a principal e sobre a secundária, mostra e pede confirmação. Não pergunte cor de erro, sucesso, fundo, cartão, borda nem modo escuro: são derivadas.

6.3 Paleta pronta (só se 6.1 for 2):
1. Safira (C1), azul e verde
2. Equilíbrio (C2), violeta e ciano
3. Aurora (C3), verde-petróleo e laranja
4. Ardósia (C4), grafite e laranja

6.4 Logotipo:
1. Montado pelo tema (padrão)
2. Arte oficial em SVG, versão clara, escura e símbolo (se não tem agora, vira pendência)

Modo de cor: o app segue o aparelho, e quem usa troca entre claro e escuro nas configurações. Outro comportamento vira pendência (bloco 14), com spec própria.

6.5 A pessoa que usa o app troca modelo e paleta nas configurações:
1. Não (padrão)
2. Sim

6.6 Marcas:
1. Uma marca só (padrão)
2. Várias marcas, conhecidas agora
3. Marcas que mudam conforme o cliente que entra

Referências visuais, pergunta aberta: apps ou sites que a pessoa admira.

## Bloco 7: Telas

Pergunta aberta, uma tabela: nome, objetivo, como abre e prioridade (1 é a primeira a fazer). Como abre: tela (rota), tela cheia que sobe sobre a tela (`GAV-001`), ou janela de confirmação (`MOD-001`, `MOD-002`, `MOD-003`). Janela com mais de 3 campos vira tela. A IA propõe a lista a partir do menu do bloco 4 e a pessoa ajusta. Já vêm prontas no boilerplate: a tela de abertura (hoje apresenta o Rendra e passa a ser a inicial do produto), login, painel, configurações e tela de erro, mais as telas de exemplo de clientes, cadastro, tarefas, atendimento, agenda e funil, para trocar pelas do produto.

## Bloco 8: Componentes

O código de catálogo, como `BTN-001`, diz qual componente e qual variante; o código de modelo, como `T1-C1-N1`, diz a marca. A vitrine publicada mostra cada componente ao vivo: `https://bsmagalhaes.github.io/rendra-ui-app/demo/componentes/`.

"não sei, sugira": a IA marca o padrão de cada situação e mostra só as situações que as telas do bloco 7 usam.

| Situação | Padrão | Alternativas |
|---|---|---|
| Botão de ação | `BTN-001` Botão primário | `BTN-002` secundário, `BTN-003` contornado, `BTN-004` fantasma, `BTN-005` destrutivo, `BTN-006` link |
| Abas | `ABA-001` Abas em linha | `ABA-002` Abas em pílula |
| Abas demais para a largura do celular | `ABA-001` ou `ABA-002` com `overflow="scroll"`: as abas rolam na horizontal; `countLabel` diz o número por extenso para leitor de tela (ex.: "Fila 3 não lidas") | Sem `overflow`, a lista vira um Select (`SEL-001`) |
| Busca com filtros | `CAMP-001` Campo de texto com `trailingAction` (botão de filtros dentro do campo, com selo do número de filtros) e `FOL-001` Folha inferior com as opções e Limpar e Aplicar no rodapé | `DTB-001` Barra de ferramentas da listagem, quando a listagem é uma tabela |
| Janela de confirmação | `MOD-001` Modal de confirmação (serve também para ação destrutiva) | `MOD-002` Modal de formulário (até 3 campos), `MOD-003` Modal informativo |
| Escolha de uma opção entre poucas | `RDO-001` Opções em lista | `RDO-002` Opções em cartões |
| Foto de perfil | `AVT-001` Avatar | `AVT-002` Avatar em grupo |
| Marcar opções | `CHK-001` Caixa de seleção | `CHK-002` Grupo de caixas de seleção |
| Escolher uma opção numa lista longa | `SEL-001` Select, abre numa folha inferior | |
| Código recebido por SMS ou e-mail | `OTP-001` Código de verificação | |
| Tela cheia para editar sem sair do fluxo | `GAV-001` Gaveta | |
| Filtros ou opções rápidas que sobem de baixo | `FOL-001` Folha inferior (só no app), com título, Fechar e rodapé de ações | |
| Ação no aparelho fora da tela | `DDM-001` Menu suspenso, abre como folha | |
| Lista de itens | `LIST-001` Lista | `LIST-002` Lista reordenável (com `onReorder`: alça de arraste e menu Mover) |
| Gráfico de dados (import de `@rendra-ui/app/chart`) | `CHT-002` Gráfico de barras | `CHT-001` linha, `CHT-003` área, `CHT-004` pizza, `CHT-005` combinado, `CHT-006` velocímetro de meta, `CHT-007` funil |
| Carregando | `SPIN-001` Indicador de carregamento | `SKEL-001` Esqueleto de carregamento, `PROG-001` Barra de progresso |
| Rodapé "Feito com Rendra" | `CRED-001` Crédito Feito com Rendra | Pode ser removido ou levado para uma tela Sobre |
| Tela de erro | `ERRO-001` Tela de erro | |

Demais componentes do catálogo:

| Código | Nome | Quando usar |
|---|---|---|
| `ACRN-001` | Acordeão | Para agrupar conteúdo que a pessoa abre um de cada vez, como perguntas frequentes. |
| `ACB-001` | Barra de ação | Para os botões de salvar, cancelar e ações extras de um formulário, gaveta ou janela. |
| `ALRT-001` | Alerta | Para um aviso de sucesso, erro, atenção ou informação dentro da tela. |
| `BDG-001` | Selo | Para marcar situação, categoria ou contagem curta ao lado de um texto. |
| `BFI-001` | Ícone de feedback da marca | Para o símbolo da marca colorido conforme o resultado (sucesso, erro, aviso) em avisos e telas de status. |
| `LOGO-001` | Logotipo | Para o logotipo da marca no menu, no cabeçalho ou no painel do login. |
| `BTNG-001` | Grupo de botões | Para botões encostados ou um controle de escolha única. |
| `CAL-001` | Calendário | Para agenda com visão de mês, semana, dia ou lista de eventos. |
| `CHAT-001` | Lista de conversas | Para a coluna de conversas do atendimento. |
| `CHAT-002` | Linha do tempo da conversa | Para o histórico de mensagens de uma conversa aberta. |
| `CHAT-003` | Campo de mensagem | Para escrever, anexar e enviar uma mensagem no atendimento. |
| `RTE-001` | Editor de texto rico | Para conteúdo com formatação, listas e imagens, como a descrição de um artigo. |
| `DOC-001` | Visualizador de documentos | Para abrir um PDF (contrato, nota fiscal, comprovante) sem sair da tela. |
| `CARD-001` | Card | Para agrupar conteúdo da tela com borda e sem sombra pesada. |
| `DTP-001` | Seletor de data | Para escolher uma data, um período ou um horário. |
| `VAZ-001` | Estado vazio | Para quando uma lista, busca ou seção ainda não tem nenhum dado. |
| `FLD-001` | Campo com rótulo e ajuda | Para envolver qualquer campo de formulário com rótulo, ajuda e mensagem de erro. |
| `FLD-002` | Rótulo | Para um rótulo avulso, quando o campo completo com ajuda não se aplica. |
| `FORM-001` | Formulário | Para envolver um formulário inteiro, com validação dos campos. |
| `FORM-002` | Seção de formulário | Para agrupar campos relacionados dentro de um card com título. |
| `IMG-001` | Visualizador de imagens | Para abrir uma ou mais imagens em tela cheia, com legenda e navegação. |
| `INFO-001` | Dica de informação | Para um texto orientativo que não tem título de tela, card ou seção ao lado. |
| `KANB-001` | Quadro kanban | Para um funil de etapas com cartões que se movem entre colunas. |
| `KANB-002` | Quadro kanban com destinos | Quando o cartão pode ir para uma ação além de outra coluna, como "Marcar como ganho", pelo menu "Mover para". |
| `CAMP-001` | Campo de texto | Para texto, número, senha, telefone, moeda ou qualquer valor de uma linha. |
| `FOL-001` | Folha inferior | Para filtros, opções e ações rápidas que sobem de baixo no celular, com título, botão Fechar e rodapé de ações, sem sair da tela. Só existe no app. |
| `SEP-001` | Separador | Para dividir conteúdo dentro de um card, no lugar de um card dentro de outro. |
| `SLD-001` | Slider | Para escolher um número ou uma faixa dentro de um intervalo, arrastando. |
| `STAT-001` | Card de indicador | Para um número de destaque com variação, num painel. |
| `SWT-001` | Switch | Para ligar ou desligar uma opção com efeito imediato. |
| `AUTH-001` | Tela de autenticação | Para a tela cheia de login, criar conta, recuperar senha e verificação, com teclado e rolagem tratados. Só existe no app. |
| `LINK-001` | Link de texto | Para um link curto dentro de um formulário, como "Esqueci a senha" ou "Criar conta". Só existe no app. |
| `TEXT-001` | Texto | Para qualquer texto que precisa da fonte do modelo de marca, com peso normal, médio ou seminegrito. Só existe no app. |
| `TXT-001` | Área de texto | Para texto longo, com contador de caracteres opcional. |
| `TLN-001` | Linha do tempo | Para uma sequência de eventos em ordem, cada um com um tom semântico. |
| `RTG-001` | Avaliação em estrelas | Para uma nota rápida de satisfação, em estrelas. |
| `RTG-002` | Avaliação em escala | Para uma nota de 0 a 10 (NPS e pesquisas parecidas), com rótulo nas pontas. |
| `CKLT-001` | Lista de verificação | Para uma lista de itens que a pessoa cria, renomeia, marca e remove. |
| `PAG-001` | Paginação | Para navegar entre páginas de uma listagem, ou carregar mais itens. |
| `DTB-001` | Barra de ferramentas da listagem | Para busca, filtros, ordenação e a ação Novo, dentro do card da listagem. |
| `TAB-001` | Tabela | Para qualquer listagem de registros, em lista de cards, com busca, ordenação, seleção e paginação. |
| `WIZ-001` | Wizard | Para um cadastro longo dividido em etapas, com validação por etapa. |
| `WIZ-002` | Indicador de etapas | Para mostrar o progresso em etapas por conta própria, sem o Wizard inteiro. |
| `TST-001` | Toast | Para uma confirmação rápida depois de uma ação, sem interromper a tela. |

## Bloco 9: Dados

Pergunta aberta. O que o app guarda (entidades e campos principais). Listagens: o que aparece em cada linha, filtros e ações, e se a pessoa escolhe a ordem dos itens (lista reordenável, `LIST-002`, com a ordem gravada pelo app); no app a listagem é uma lista de cartões (`LIST-001`, `CARD-001`), não uma tabela. Formulários longos: viram uma tela em seções (`FORM-002`) ou um assistente em etapas (`WIZ-001`).

## Bloco 10: Acesso e integrações

Pergunta aberta. Como a pessoa entra: e-mail e senha, código por SMS ou e-mail (`OTP-001`), os dois, ou sem login. Perfis e o que cada um pode ver ou fazer. Regra de negócio fora do comum (fluxo de aprovação, papel especial). Integrações com outros sistemas (pagamento, mapa, cadastro existente).

## Bloco 11: Publicação

11.1 Como o app chega às pessoas:
1. Google Play e App Store (padrão, se 3.1 incluir Android e iOS)
2. Só instalação interna (arquivo de teste ou convite de teste)
3. Só navegador

11.2 Já existe conta de desenvolvedor (Google Play, Apple Developer)? Sim, não ou não sei. Se não: a IA explica em uma linha o que é e que a pessoa precisa criar a conta; a IA nunca cria por ela.

11.3 Nome curto que aparece sob o ícone, e ícone: arquivo oficial ou montado pelo tema (padrão).

Registrar em `docs/BRIEFING.md` como "publicação: spec própria, fora do boilerplate".

## Bloco 12: Somente para migração

Preencher só se o bloco 0 for migração. A IA analisa o sistema antes de perguntar e recomenda o caminho, sem perguntar qual: caminho A (pacote npm), caminho B (cópia dos arquivos) ou caminho C (refazer). A pessoa só confirma. A IA levanta sozinha, no código, o que não pode mudar (endereços de abertura de tela, esquema de links, identificadores já publicados nas lojas). À pessoa, pergunta aberta: onde está o projeto; telas prioritárias, em ordem; fluxos, integrações e textos que precisam continuar iguais. No caminho C, "o que precisa continuar igual" vira "regras de negócio a trazer".

## Bloco 13: Prazo e entrega

Pergunta aberta. Etapas, data desejada para cada uma (DD/MM/AAAA) e quem aprova.

## Bloco 14: Pendências

Lista aberta do que faltou (arte do logotipo, contas de loja, dados, decisões em espera). Cada item diz quem traz e para quando.

Status do briefing: rascunho | confirmado em DD/MM/AAAA
