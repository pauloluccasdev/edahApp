# Edah Design System

**Guia de identidade visual, componentes e padrões de interface**

> Versão 1.0 · Abril 2026 · Comunidade Cristã — Duque de Caxias, RJ

---

## Índice

1. [Princípios de Design](#01--princípios-de-design)
2. [Paleta de Cores](#02--paleta-de-cores)
3. [Tipografia](#03--tipografia)
4. [Espaçamento e Grid](#04--espaçamento-e-grid)
5. [Elevação e Sombras](#05--elevação-e-profundidade)
6. [Iconografia](#06--iconografia)
7. [Componentes — Fundação](#07--componentes--fundação)
8. [Componentes — Navegação](#08--componentes--navegação)
9. [Componentes — Dados e Cards](#09--componentes--dados-e-cards)
10. [Componentes — Formulários](#10--componentes--formulários)
11. [Componentes — Feedback](#11--componentes--feedback)
12. [Badges de Ministério](#12--badges-de-ministério)
13. [Telas — Anatomia](#13--telas--anatomia)
14. [Motion e Animação](#14--motion-e-animação)
15. [Acessibilidade](#15--acessibilidade)
16. [Tokens de Design](#16--tokens-de-design)

---

## 01 — Princípios de Design

O Edah é uma ferramenta de trabalho. Cada tela deve reduzir a carga cognitiva do líder ou membro, nunca aumentá-la. Os quatro princípios abaixo guiam todas as decisões de interface.

| Princípio | Descrição | Anti-padrão a evitar |
| --- | --- | --- |
| **Clareza antes de estética** | Informação crítica — quem está escalado, conflitos pendentes, disponibilidade — nunca deve ser obscurecida por decoração. UI dark serve ao conteúdo, não ao visual. | Gradientes e glassmorphism que dificultam leitura de texto sobre fundo. |
| **Ação contextual** | O próximo passo óbvio deve estar sempre visível. Líder que abre o painel vê conflitos pendentes com CTA. Membro que abre escala vê botão de substituição. | Menus ocultos, ações enterradas em submenus de três níveis. |
| **Densidade controlada** | Dashboard é denso por natureza. Usar hierarquia visual para que o olho encontre o dado certo primeiro. Nunca esconder informação — compactar com inteligência. | Cards espaçosos que cabem apenas 2 eventos em tela. Scroll desnecessário para ações frequentes. |
| **Feedback imediato** | Toda ação — publicar escala, marcar presença, solicitar substituição — deve retornar estado visual em ≤ 200ms. O usuário nunca deve perguntar "funcionou?" | Botões sem estado de loading. Ações sem confirmação visual. |

---

## 02 — Paleta de Cores

Interface totalmente dark. O fundo base é quase preto com leve tom azul — não cinza puro. Isso mantém coerência com a identidade da marca e reduz o contraste excessivo em ambientes escuros.

### Superfícies (Backgrounds)

Cinco níveis de superfície criam profundidade sem sombras. A regra: cada camada acima da anterior é ~10% mais clara.

| Token | Hex | Uso |
| --- | --- | --- |
| `bg-base` | `#080E18` | Fundo da página |
| `bg-01` | `#0F1824` | Sidebar, topbar |
| `bg-02` | `#151F2E` | Cards hover, dropdowns |
| `bg-03` | `#1C2A3E` | Modais, drawers |
| `bg-04` | `#243248` | Tooltips, popovers |
| `bg-card` | `#111A27` | Cards padrão, rows de tabela |

### Marca (Brand)

| Token | Hex |
| --- | --- |
| `brand-navy` | `#0D1B2E` |
| `brand-deep` | `#1B3A6B` |
| `brand-mid` | `#2E5FA3` |
| `brand-light` | `#4A8FD4` |
| `brand-pale` | `#C8DDF5` |

### Texto

| Token | Hex | Uso |
| --- | --- | --- |
| `text-primary` | `#F0F4FA` | Títulos de cards, nomes de membros, dados principais |
| `text-secondary` | `#8A9BB5` | Labels, metadados, descrições, timestamps |
| `text-tertiary` | `#4E6080` | Placeholders, hints, informações auxiliares |

### Status

Cada cor de status possui variante de fundo (`bg`) para uso em badges e áreas de destaque. O texto sobre `bg` sempre usa a versão sólida da cor.

| Token | Hex | Bg Token | Bg Hex |
| --- | --- | --- | --- |
| `success` | `#1A7A4A` | `success-bg` | `#0D2E1E` |
| `warning` | `#B87000` | `warning-bg` | `#2A1E00` |
| `danger` | `#B83232` | `danger-bg` | `#2A0D0D` |
| `info` | `#4A8FD4` | `info-bg` | `#0D1E2E` |

### Regras de Uso de Cor

| Propriedade | Valor | Uso |
| --- | --- | --- |
| Texto primário | `#F0F4FA` | Títulos de cards, nomes de membros, dados principais |
| Texto secundário | `#8A9BB5` | Labels, metadados, descrições, timestamps |
| Texto terciário | `#4E6080` | Placeholders, hints, informações auxiliares |
| Azul interativo | `#4A8FD4` | Links, botões secundários, ícones ativos |
| Borda padrão | `#1E2E42` | Separadores de cards, linhas de tabela |
| Borda destaque | `#2A3E58` | Cards hover, inputs focused, seções ativas |
| Nunca usar | `#000000` | Fundos — usar `bg-base #080E18` no lugar |

---

## 03 — Tipografia

Fonte principal: **Inter** (Google Fonts, variável). Fallback: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`. Fonte mono: **JetBrains Mono** para tokens, IDs e códigos.

| Estilo | Tamanho | Peso | Exemplo |
| --- | --- | --- | --- |
| Display | 24px | Bold | Próximas Escalas |
| H1 | 18px | Bold | Dashboard do Líder |
| H2 | 14px | Semibold | Ministério de Louvor |
| H3 | 12px | Semibold | Escalados neste culto |
| Body Large | 10.5px | Regular | Selecione os membros disponíveis para a escala |
| Body | 9.5px | Regular | João Silva — disponível 3 domingos este mês |
| Caption | 8.5px | Regular | Última atualização há 5 minutos |
| Label | 8.5px | Semibold | CONFLITO PENDENTE |
| Code | 9px | Regular | `church_id: edah_cc_duquecaxias` |
| Overline | 8px | Semibold | MINISTÉRIO · 4 MEMBROS |

### Regras Tipográficas

| Propriedade | Valor | Uso |
| --- | --- | --- |
| Line-height body | 1.6 | Parágrafos e descrições |
| Line-height heading | 1.2 | Títulos e displays |
| Letter-spacing label | 0.08em | Labels, overlines, badges em maiúsculas |
| Letter-spacing body | 0 | Todo texto corrido |
| Max-width parágrafo | 640px | Evita linhas longas demais em telas grandes |
| Nunca usar | weight < 400 | Texto muito leve some no fundo dark |

---

## 04 — Espaçamento e Grid

Sistema baseado em múltiplos de **4px**. Todos os espaçamentos, padding, margin e gap são valores desta escala.

| Token | px | Uso principal |
| --- | --- | --- |
| `space-1` | 4px | Espaço interno mínimo, gap entre ícone e label |
| `space-2` | 8px | Padding interno de badges, gap entre chips |
| `space-3` | 12px | Padding de items de lista, gap entre campos de formulário |
| `space-4` | 16px | Padding padrão de cards, gap entre colunas próximas |
| `space-5` | 20px | Padding interno de modais e drawers |
| `space-6` | 24px | Gap entre cards no grid, padding de seções |
| `space-8` | 32px | Margem entre blocos principais, padding de painéis |
| `space-10` | 40px | Separação entre seções de dashboard |
| `space-12` | 48px | Margem superior de páginas, altura de seção |
| `space-16` | 64px | Espaços grandes, hero sections |

### Grid de Layout

| Breakpoint | Colunas | Gutter | Uso |
| --- | --- | --- | --- |
| Mobile `< 768px` | 4 | 16px | App mobile — foco principal do Edah |
| Tablet `768–1024px` | 8 | 20px | iPad, tablets Android |
| Desktop `> 1024px` | 12 | 24px | Painel do líder/pastor em desktop |

### Border Radius

| Token | Valor | Uso |
| --- | --- | --- |
| `radius-sm` | 4px | Badges, chips, tags |
| `radius-md` | 8px | Botões, inputs, items de lista |
| `radius-lg` | 12px | Cards, modais, drawers |
| `radius-xl` | 16px | Painéis, sidebars, containers grandes |
| `radius-full` | 9999px | Avatares, toggles, loaders circulares |

---

## 05 — Elevação e Profundidade

Em UI dark não usamos `box-shadow` com cor escura — elas somem. Elevação é comunicada por cor de superfície: quanto mais alto o elemento, mais clara a superfície. Sombras usam azul muito escuro com baixa opacidade.

| Nível | Superfície | Sombra CSS | Uso |
| --- | --- | --- | --- |
| `elevation-0` | `bg-base #080E18` | none | Fundo da página |
| `elevation-1` | `bg-01 #0F1824` | none | Sidebar, topbar |
| `elevation-2` | `bg-card #111A27` | `0 1px 4px rgba(0,0,0,0.4)` | Cards padrão, rows de tabela |
| `elevation-3` | `bg-02 #151F2E` | `0 2px 8px rgba(0,0,0,0.5)` | Cards hover, dropdowns |
| `elevation-4` | `bg-03 #1C2A3E` | `0 4px 16px rgba(0,0,0,0.6)` | Modais, drawers |
| `elevation-5` | `bg-04 #243248` | `0 8px 32px rgba(8,14,24,0.8)` | Tooltips, popovers, toasts |

---

## 06 — Iconografia

Biblioteca: **Lucide Icons** (outline, `stroke-width: 1.5`). Tamanhos padronizados. Nunca usar ícones filled e outline misturados na mesma interface.

| Token | px | Uso |
| --- | --- | --- |
| `icon-xs` | 12px | Ícones dentro de badges e chips |
| `icon-sm` | 16px | Ícones inline em texto, labels |
| `icon-md` | 20px | Ícones de botão, items de menu, list items |
| `icon-lg` | 24px | Ícones de navegação principal (bottom nav, sidebar) |
| `icon-xl` | 32px | Ícones de empty state, ilustrações simples |
| `icon-2xl` | 48px | Ícones de onboarding, estados de erro grandes |

### Mapeamento de Ícones por Contexto

| Contexto | Ícone Lucide | Cor padrão |
| --- | --- | --- |
| Ministério — Louvor | `Music` | `#5B2DA8` (purple) |
| Ministério — GC | `Users` | `#0F6E56` (teal) |
| Ministério — Mídia | `Video` | `#0F5FA3` (blue) |
| Ministério — Dança | `Star` | `#A82D7A` (pink) |
| Ministério — Discipulado | `BookOpen` | `#A85B0D` (amber) |
| Ministério — Adolescentes | `Zap` | `#2D7A1A` (green) |
| Ministério — Cronograma | `Clock` | `#7A5B1A` (gold) |
| Conflito de escala | `AlertTriangle` | `#B83232` (danger) |
| Substituição pendente | `RefreshCw` | `#B87000` (warning) |
| Disponibilidade | `Calendar` | `#4A8FD4` (blue-light) |
| Notificação | `Bell` | `#4A8FD4` (blue-light) |
| Presença confirmada | `CheckCircle` | `#1A7A4A` (success) |
| Ausente | `XCircle` | `#B83232` (danger) |
| Publicar escala | `Send` | `#4A8FD4` (blue-light) |
| WhatsApp | `MessageCircle` | `#1A7A4A` (success) |

---

## 07 — Componentes — Fundação

### Botões

Três variantes principais. Nunca misturar `primary` e `ghost` na mesma linha de ação — escolha hierarquia clara.

| Variante | Aparência | Estado Hover | Uso |
| --- | --- | --- | --- |
| **Primary** | `bg: #2E5FA3 · text: #F0F4FA · radius: 8px · h: 40px · px: 20px` | `bg: #4A8FD4` | Ação principal da tela: Publicar Escala, Confirmar, Salvar |
| **Secondary** | `bg: #1C2A3E · text: #4A8FD4 · border: #2A3E58 · radius: 8px` | `bg: #243248 · border: #4A8FD4` | Ações secundárias: Editar, Ver detalhes, Cancelar |
| **Ghost** | `bg: transparent · text: #8A9BB5 · sem borda` | `text: #F0F4FA · bg: #151F2E` | Ações terciárias: Fechar, Limpar filtro |
| **Danger** | `bg: #2A0D0D · text: #B83232 · border: #B83232 · radius: 8px` | `bg: #B83232 · text: #F0F4FA` | Ações destrutivas: Remover membro, Cancelar ensaio |
| **Icon-only** | `bg: #1C2A3E · w/h: 40px · ícone centralizado · radius: 8px` | `bg: #243248` | Ações rápidas em cards: editar, excluir, reordenar |

### Estados de Botão

| Estado | Propriedade | Uso |
| --- | --- | --- |
| `default` | Cor base conforme variante | Estado normal de repouso |
| `hover` | +10% lightness no background | Cursor sobre o botão |
| `active` | +5% mais escuro que hover | Clique/toque no botão |
| `focus` | `outline: 2px solid #4A8FD4, offset: 2px` | Foco via teclado (acessibilidade) |
| `disabled` | `opacity: 0.4, cursor: not-allowed` | Ação não disponível naquele contexto |
| `loading` | Spinner 16px à esquerda do label | Operação em andamento (submit, publish) |

### Inputs e Campos de Formulário

| Estado | Aparência |
| --- | --- |
| `default` | `bg: #111A27 · border: #1E2E42 · text: #F0F4FA · placeholder: #4E6080 · h: 40px · px: 14px · radius: 8px` |
| `focus` | `border: #4A8FD4 · box-shadow: 0 0 0 3px rgba(74,143,212,0.15)` |
| `error` | `border: #B83232 · box-shadow: 0 0 0 3px rgba(184,50,50,0.15)` |
| `success` | `border: #1A7A4A · box-shadow: 0 0 0 3px rgba(26,122,74,0.15)` |
| `disabled` | `opacity: 0.5 · cursor: not-allowed · bg: #0F1824` |

---

## 08 — Componentes — Navegação

### Sidebar (Desktop / Tablet)

| Elemento | Especificação |
| --- | --- |
| Logo area | Edah wordmark + chevron collapse. Largura: 240px expandida / 64px colapsada. `bg: bg-01 #0F1824`. |
| Nav items | `h: 44px, px: 16px`, ícone 20px + label, `radius: 8px` no item ativo. Ativo: `bg-03` + `text-primary` + borda esquerda 3px azul. |
| Badge de count | Pill compacto à direita do label. `bg: danger-bg, text: danger`. Ex: "Conflitos 3". |
| Seção divider | Label overline 11px `text-tertiary` + linha `border-color`. Ex: "MINISTÉRIOS". |
| User area | Avatar 32px + nome + role. Fixo no rodapé. Abre dropdown com perfil e logout. |

### Bottom Navigation (Mobile)

4 tabs fixos: Início, Escalas, Calendário, Perfil. Altura: 64px + safe area. `bg-01`. Tab ativo: ícone + label azul. Inativo: ícone + label `text-tertiary`.

| Tab | Ícone | Badge |
| --- | --- | --- |
| Início | `Home` | Ponto vermelho se houver conflito ou notificação não lida |
| Escalas | `Calendar` | Count de escalas com publicação pendente |
| Calendário | `CalendarDays` | — |
| Perfil | `User` | — |

### Topbar

| Elemento | Especificação |
| --- | --- |
| Altura | 56px desktop / 52px mobile. `bg: bg-01`. Borda inferior: `1px border-color`. |
| Breadcrumb | Page title 18px semibold + path secundário 14px `text-secondary`. |
| Search | Input compacto `h: 36px`, placeholder: "Buscar membro, evento...". Ativa modal de busca global. |
| Ações globais | Sino de notificações (badge count), avatar do usuário (abre dropdown). |
| Church badge | Nome da igreja em pill compacto. Verifica isolamento visual do tenant ativo. |

---

## 09 — Componentes — Dados e Cards

### Card Base

| Elemento | Especificação |
| --- | --- |
| Container | `bg-card #111A27 · border: 1px #1E2E42 · radius: 12px · padding: 16px` |
| Card header | Título 14px semibold `text-primary` + metadado 12px `text-secondary`. Ícone opcional 16px à esquerda. |
| Card body | Conteúdo principal. Densidade variável conforme tipo. |
| Card footer | Separado por borda `1px border-color`. Ações secundárias ou metadado extra. |
| Hover state | `border-color: #2A3E58 · bg: #151F2E · transition: 150ms` |

### Card de Membro na Escala

| Elemento | Especificação |
| --- | --- |
| Avatar | 32px circular, fallback: iniciais em `bg-03` + `text-secondary` |
| Nome | 14px semibold `text-primary` |
| Badge de ministério | Pill 11px semibold, cor do ministério (ver seção 12) |
| Status na escala | Dot 8px: verde = confirmado, amber = pendente, vermelho = conflito |
| Indicador de disp. | Ícone `Calendar` 14px + data. Verde se disponível, cinza se não confirmado |

### Card de Conflito (destaque)

Uso: painel do líder e notificação do membro. Deve ser imediatamente reconhecível como urgente.

| Elemento | Especificação |
| --- | --- |
| Container | `border-left: 3px solid #B83232 · bg: #2A0D0D · radius: 12px` |
| Ícone | `AlertTriangle` 20px · `color: #B83232` |
| Título | "Conflito de escala" · 14px semibold · `color: #B83232` |
| Descrição | "[Nome] está escalado em [Ministério A] e [Ministério B] no mesmo dia." · 13px `text-secondary` |
| Contador de prazo | Pill amber: "XX horas restantes" · pisca quando < 6h |
| CTA — Membro | Botão primary + botão secondary: Confirmar os dois / Ficar só em [Ministério A] |
| CTA — Líder | Botão secondary: Ver conflito. Link para painel de conflitos. |

### Heatmap de Disponibilidade

Exibido no painel do líder. Calendário mensal com células coloridas por intensidade de disponibilidade.

| Intensidade | Cor da célula | Significado |
| --- | --- | --- |
| 0 membros | `#080E18` (bg-base) | Nenhum membro disponível — alerta ao líder |
| 1–2 membros | `#0F2A1E` | Poucos membros — planejamento difícil |
| 3–5 membros | `#1A5A3A` | Disponibilidade razoável |
| 6–9 membros | `#1A7A4A` | Boa disponibilidade |
| 10+ membros | `#22AA66` | Excelente — dia ideal para evento grande |

---

## 10 — Componentes — Formulários

### Componentes de Input

| Componente | Altura | Uso no Edah |
| --- | --- | --- |
| Text input | 40px | Nome do evento, título do louvor, local do ensaio |
| Textarea | auto min 80px | Informativo da escala, observações de presença, notas de ensaio |
| Select / Dropdown | 40px | Ministério, status de presença, tipo de recorrência |
| Multi-select | 40px + chips | Seleção de ministérios num evento, seleção de membros |
| Date picker | 40px | Data de evento, ensaio, disponibilidade |
| Time picker | 40px | Horário de início/fim, duração de momento no cronograma |
| Toggle | 24px h / 44px w | Ativar/desativar lembretes de ensaio individualmente |
| Checkbox | 20px | Seleção múltipla de membros na escala |
| Radio | 20px | Escolha única: aprovar / recusar substituição |
| Search input | 40px | Busca de membro ao adicionar na escala, busca global |
| File upload | auto | Import de `.xlsx` e `.docx` de eventos anuais |

### Validação e Mensagens de Erro

| Tipo | Aparência | Exemplo |
| --- | --- | --- |
| Erro inline | Texto 12px `#B83232` abaixo do campo, ícone `XCircle` 12px | "Link do YouTube inválido. Use youtube.com/watch?v= ou youtu.be/" |
| Erro de form | Banner `danger-bg` no topo do form com lista de erros | "Corrija os campos destacados antes de publicar a escala." |
| Aviso | Texto 12px `#B87000` abaixo do campo, ícone `AlertCircle` 12px | "Menos de 24h para o evento. Somente o líder pode editar a disponibilidade." |
| Sucesso | Texto 12px `#1A7A4A` abaixo do campo, ícone `CheckCircle` 12px | "Link validado com sucesso." |

---

## 11 — Componentes — Feedback

### Toast / Notificação Global

| Tipo | Visual | Duração | Exemplo |
| --- | --- | --- | --- |
| Success | `bg: #0D2E1E · borda esquerda 3px #1A7A4A · ícone Check` | 4s auto-dismiss | "Escala publicada. 8 membros notificados." |
| Error | `bg: #2A0D0D · borda esquerda 3px #B83232 · ícone XCircle` | persiste até fechar | "Falha ao enviar WhatsApp. Tentando SMS..." |
| Warning | `bg: #2A1E00 · borda esquerda 3px #B87000 · ícone AlertTriangle` | 6s auto-dismiss | "Escala editada a menos de 2h do evento." |
| Info | `bg: #0D1E2E · borda esquerda 3px #4A8FD4 · ícone Info` | 4s auto-dismiss | "Conflito criado. Aguardando resposta do membro." |

### Empty States

Toda tela que pode estar vazia deve ter um estado específico — nunca deixar área em branco. Estrutura: ícone xl + título + descrição + CTA.

| Contexto | Ícone | Título | CTA |
| --- | --- | --- | --- |
| Sem membros na escala | `Users` | Nenhum membro selecionado ainda | Adicionar membros → |
| Sem disponibilidade preenchida | `CalendarX` | Disponibilidade não informada este mês | Preencher agora → |
| Sem conflitos pendentes | `CheckCircle` | Nenhum conflito pendente | — |
| Sem louvores cadastrados | `Music` | Lista de louvores ainda não publicada | Adicionar louvor → |
| Sem eventos no calendário | `CalendarDays` | Nenhum evento cadastrado | Criar evento → / Importar → |
| Sem ensaios | `Clock` | Nenhum ensaio agendado para esta escala | Criar ensaio → |

### Loading States

| Componente | Skeleton / Loader |
| --- | --- |
| Card de membro | Retângulo `bg-02` animado (shimmer) nas dimensões exatas do card |
| Lista de escalas | 3 rows skeleton, altura 56px cada, gap 8px |
| Heatmap | Grid 7×5 de células `bg-02` shimmer |
| Dados do dashboard | Spinner 24px centralizado no painel, fundo `bg-card` |
| Botão submit | Spinner 16px inline + label "Publicando..." desabilitado |

---

## 12 — Badges de Ministério

Cada ministério tem sua cor exclusiva. Badges aparecem em listas de membros, cards de escala e perfis de usuário.

**Dimensões:** `height: 20px · padding-x: 8px · radius: 4px · font: 11px semibold · letter-spacing: 0.06em`

| Ministério | Cor | Bg | Ícone | Uso adicional |
| --- | --- | --- | --- | --- |
| Louvor | `#5B2DA8` | `#1E0D3A` | `Music` | Sidebar item, header de escala de louvor |
| GC / Células | `#0F6E56` | `#042E24` | `Users` | Relatório de presença |
| Mídia | `#0F5FA3` | `#04213A` | `Video` | Equipamentos |
| Dança | `#A82D7A` | `#3A0D2A` | `Star` | Campo de informativo de traje |
| Discipulado | `#A85B0D` | `#3A1E04` | `BookOpen` | Relatório de presença |
| Adolescentes | `#2D7A1A` | `#0D2A04` | `Zap` | — |
| Cronograma | `#7A5B1A` | `#2A1E04` | `Clock` | Timeline do culto |

---

## 13 — Telas — Anatomia

### Dashboard do Líder

| Região | Especificação |
| --- | --- |
| Topbar | Título "Dashboard" · Seletor de ministério · Sino de notificações |
| Faixa de alertas | Horizontal scroll de cards urgentes: conflitos pendentes (vermelho) + substituições (amarelo) + membros sem disponibilidade (azul). Visível só se houver itens. |
| Heatmap calendário | Calendário mensal compacto. Células com intensidade de disponibilidade. Dia selecionado abre lista de disponíveis. |
| Próximos eventos | Lista vertical. Cada item: data · título do evento · badges dos ministérios · status da escala (rascunho/publicada). |
| Escalas em rascunho | Cards compactos com botão "Publicar" inline. Destaque se evento em < 48h. |
| FAB | Botão `+` 56px fixo no bottom-right. Abre: Nova escala / Novo ensaio / Importar eventos. |

### Construtor de Escala

| Região | Especificação |
| --- | --- |
| Header | Nome do evento + data + ministério. Botões: Salvar rascunho / Publicar. |
| Seletor de disponíveis | Grid ou lista de membros filtrados por disponibilidade naquela data. Verde = disponível, cinza = sem resposta, vermelho outline = indisponível (pode forçar com aviso). |
| Escala montada | Lista drag-drop dos membros adicionados. Cada item tem: avatar, nome, badge, botão remover, botão "Tornar responsável". |
| Responsável destaque | Borda dourada + badge "Responsável do dia". |
| Informativo livre | Textarea colapsável no rodapé. Max 1000 caracteres. |
| Painel de conflito | Banner danger que aparece ao adicionar membro com conflito. Cria `conflict_request` automaticamente. |

### Cronograma do Culto

| Região | Especificação |
| --- | --- |
| Header | Título do evento + data. Total de duração calculado em tempo real. Botão Publicar. |
| Lista de momentos | Rows drag-drop ordenados. Cada row: handle · número de ordem · tipo (chip colorido) · responsável (avatar + nome) · duração (input numérico) · notas (tooltip). |
| Tipos de momento | Louvor, Oração, Oferta, Palavra, Aviso, Encerramento — cada tipo tem cor/ícone próprio. |
| Barra de duração | Barra horizontal no rodapé mostrando proporção de cada momento. Visual tipo timeline horizontal. |
| Adicionar momento | Botão `+` no rodapé. Abre inline form: tipo · responsável · duração · notas. |

### Registro de Presença

| Região | Especificação |
| --- | --- |
| Header | Evento + data + ministério. Contador: "X de Y presentes". |
| Lista de membros | Cada row: avatar · nome · três botões toggle: ✓ Presente / ✗ Ausente / ~ Justificado. |
| Campo de obs. | Textarea colapsável por membro. Aparece ao marcar Ausente ou Justificado. |
| Resumo | Rodapé: percentual de presença geral + breakdown por status. |
| Exportar | Botão no header: Download PDF / Download XLSX. |

---

## 14 — Motion e Animação

Animações servem à orientação, não à decoração. Toda transição deve ajudar o usuário a entender o que mudou ou para onde foi.

| Tipo | Duração | Easing | Uso |
| --- | --- | --- | --- |
| Micro-interação | 100–150ms | ease-out | Hover de botão, toggle, checkbox, tab ativo |
| Transição de estado | 200ms | ease-in-out | Mudança de status em card, loading spinner |
| Entrada de elemento | 250ms | ease-out | Toast, dropdown, modal abrindo |
| Saída de elemento | 150ms | ease-in | Toast fechando, dropdown fechando |
| Page transition | 200ms | ease-in-out | Fade entre rotas |
| Skeleton shimmer | 1.5s loop | linear | Loading placeholders |
| Badge de conflito | 800ms loop | ease-in-out | Pulse em cards de conflito urgente (< 6h) |

### Regras de Motion

- Nunca animar só para parecer bonito. Se remover a animação não prejudica a compreensão, remova.
- Respeitar `prefers-reduced-motion`: desativar todas as animações não essenciais.
- Duração máxima de qualquer animação não-loop: **300ms**.
- Não usar bouncing ou spring exagerado — a interface é uma ferramenta profissional.

---

## 15 — Acessibilidade

| Requisito | Especificação | Verificação |
| --- | --- | --- |
| Contraste de texto | WCAG AA: ≥ 4.5:1 para texto normal, ≥ 3:1 para texto grande | `text-primary #F0F4FA` sobre `bg-card #111A27` = 13.4:1 ✓ |
| Contraste de UI | ≥ 3:1 para bordas de input, ícones interativos | `border #2A3E58` sobre `bg-card #111A27` = 3.2:1 ✓ |
| Foco visível | `outline: 2px solid #4A8FD4` em todos os elementos interativos | Nunca usar `outline: none` sem alternativa visível |
| Tamanho de toque | Mínimo 44×44px em todos os elementos tocáveis (mobile) | Botões, checkboxes, nav items, list rows |
| ARIA labels | Ícones sem texto devem ter `aria-label` descritivo | Ex: `<button aria-label="Publicar escala">` |
| Status dinâmicos | Mudanças de estado críticas anunciadas via `aria-live` | Publicação de escala, resultado de conflito, toast de erro |
| Ordem de foco | Tab navigation segue ordem visual lógica da esquerda para a direita | Verificar com Tab em cada tela principal |
| Reduced motion | `@media (prefers-reduced-motion)` desativa shimmer e transições de página | Testar nas configurações de acessibilidade do SO |

---

## 16 — Tokens de Design

Tokens são as variáveis CSS que implementam este design system. **Sempre usar tokens — nunca hardcodar valores de cor, espaçamento ou tipografia diretamente no componente.**

### CSS Custom Properties — Cores

```css
/* Superfícies */
--color-bg-base:     #080E18;
--color-bg-01:       #0F1824;
--color-bg-02:       #151F2E;
--color-bg-03:       #1C2A3E;
--color-bg-04:       #243248;
--color-bg-card:     #111A27;

/* Marca */
--color-brand-navy:  #0D1B2E;
--color-brand-deep:  #1B3A6B;
--color-brand-mid:   #2E5FA3;
--color-brand-light: #4A8FD4;
--color-brand-pale:  #C8DDF5;

/* Texto */
--color-text-primary:   #F0F4FA;
--color-text-secondary: #8A9BB5;
--color-text-tertiary:  #4E6080;

/* Status */
--color-success:     #1A7A4A;   --color-success-bg: #0D2E1E;
--color-warning:     #B87000;   --color-warning-bg: #2A1E00;
--color-danger:      #B83232;   --color-danger-bg:  #2A0D0D;
--color-info:        #4A8FD4;   --color-info-bg:    #0D1E2E;

/* Bordas */
--color-border:      #1E2E42;
--color-border-mid:  #2A3E58;
```

### CSS Custom Properties — Tipografia e Espaçamento

```css
/* Tipografia */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Espaçamento */
--space-1:  4px;   --space-2:  8px;   --space-3:  12px;  --space-4:  16px;
--space-5:  20px;  --space-6:  24px;  --space-8:  32px;  --space-10: 40px;
--space-12: 48px;  --space-16: 64px;

/* Border radius */
--radius-sm:   4px;
--radius-md:   8px;
--radius-lg:   12px;
--radius-xl:   16px;
--radius-full: 9999px;
```

### Tokens de Ministério

```css
/* Louvor */
--ministry-louvor:    #5B2DA8;   --ministry-louvor-bg:   #1E0D3A;
/* GC */
--ministry-gc:        #0F6E56;   --ministry-gc-bg:       #042E24;
/* Mídia */
--ministry-midia:     #0F5FA3;   --ministry-midia-bg:    #04213A;
/* Dança */
--ministry-danca:     #A82D7A;   --ministry-danca-bg:    #3A0D2A;
/* Discipulado */
--ministry-disc:      #A85B0D;   --ministry-disc-bg:     #3A1E04;
/* Adolescentes */
--ministry-adol:      #2D7A1A;   --ministry-adol-bg:     #0D2A04;
/* Cronograma */
--ministry-cron:      #7A5B1A;   --ministry-cron-bg:     #2A1E04;
```

---

*Edah Design System v1.0 · Abril 2026 · Confidencial*
