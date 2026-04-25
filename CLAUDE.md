# Edah — Guia para o Claude Code

Gestão de escalas e ministérios para igrejas. PWA mobile-first.

---

## Stack e como rodar

```
Next.js 15 (web, porta 3000)  →  NestJS (api, porta 3001)  →  Supabase/Postgres
```

```bash
pnpm run docker:up --build   # sobe tudo (web + api)
pnpm run docker:down         # derruba
```

Nunca use `pnpm dev` direto — o projeto roda via Docker.

---

## Estrutura de pastas relevante

```
apps/
  web/
    app/                     # Next.js App Router
      auth/login/            # Tela de login
      dashboard/             # Dashboard e futuras sub-rotas
    components/
      layout/                # AppShell, Sidebar, Topbar, BottomNav
      dashboard/             # Componentes específicos do dashboard
    lib/
      auth.ts                # getSession() — lê JWT do cookie
      nav.ts                 # NAV_ITEMS — fonte única da navegação
packages/
  ui/
    src/
      tokens/tokens.css      # Design tokens (cores, espaçamento, etc.)
      components/            # Button, Card, Input, Badge, Toast
```

---

## Design System

### Tokens
Todos os valores visuais estão em `packages/ui/src/tokens/tokens.css`.
**Nunca hardcodar cores, espaçamentos ou sombras — sempre usar tokens.**

Tokens disponíveis:
- `--color-bg-base/01/02/03/04/card` — superfícies (tema escuro navy)
- `--color-brand-navy/deep/mid/light/pale` — paleta da marca
- `--color-text-primary/secondary/tertiary` — hierarquia de texto
- `--color-border / --color-border-mid` — bordas
- `--color-success/warning/danger/info` + variantes `-bg`
- `--ministry-louvor/gc/midia/danca/disc/adol/cron` + variantes `-bg`
- `--space-1` a `--space-16` — espaçamento base 4px
- `--radius-sm/md/lg/xl/full` — bordas arredondadas (não existe `--radius-2xl`, usar `24px` fixo)
- `--shadow-card/hover/modal/tooltip`
- `--duration-micro/state/enter/exit` + `--ease-out/in/in-out`
- `--font-sans / --font-mono`

### Tema
Escuro (navy). Não trocar para light. `color-scheme: dark` no globals.css.

### Estilo visual (referência Airbnb adaptada)
- Cantos arredondados generosos (`--radius-lg`, `--radius-xl`)
- Cards com borda `--color-border` e `--shadow-card`
- Hover em cards: `transform: translateY(-2px)` + `--shadow-hover`
- Espaçamento interno dos cards: `--space-4` a `--space-5`
- Hierarquia clara: título bold + descrição `--color-text-tertiary`
- Badges de status: fundo `-bg` + texto na cor sólida + `--radius-full`

---

## Layout e Navegação

### Mobile (≤ 767px)
- **BottomNav** fixo na base — 5 itens de `NAV_ITEMS`, ícone + label
- **Topbar** mostra: logo Edah (esquerda) + nome da igreja + sino (direita)
- **Sidebar** oculta via CSS (`display: none`)
- Conteúdo tem `padding-bottom` para não ficar atrás do BottomNav
- Safe area: `env(safe-area-inset-bottom)` no BottomNav e login

### Desktop (≥ 768px)
- **Sidebar** fixa à esquerda (240px expandida, 64px colapsada)
- **Topbar** mostra: título da página (esquerda) + controles suporte + sino + avatar
- **BottomNav** oculta via CSS (`display: none`)
- Collapse handle aparece no hover da shell

### AppShell
Hierarquia: `AppShell` > `Sidebar` + `Topbar` + `{children}` + `BottomNav`
- O `AppShell` é client component (estado de collapse da sidebar)
- `DashboardLayout` busca a sessão server-side e passa para o `AppShell`

---

## Navegação — `NAV_ITEMS`

Fonte única em `apps/web/lib/nav.ts`. Toda adição de rota acontece aqui.
O `BottomNav` e a `Sidebar` consomem a mesma lista automaticamente.

```ts
{ href: '/dashboard/nova-rota', label: 'Label', Icon: IconeDoLucide, enabled: true }
```

Itens com `enabled: false` aparecem com badge "Em breve" na sidebar e opacidade reduzida no BottomNav.

---

## Autenticação

- Cookie `edah_token` (JWT, validado pelo middleware do NestJS)
- `getSession()` em `lib/auth.ts` — decodifica o JWT client-side sem verificar assinatura (já validado pelo middleware)
- Middleware em `apps/web/middleware.ts` protege todas as rotas `/dashboard/*`
- Login: POST `/api/auth/login` → seta cookie → redirect para `/dashboard`
- Logout: POST `/api/auth/logout` → limpa cookie → redirect para `/auth/login`

### TokenPayload
```ts
{ sub, email, name, avatarUrl, churchId, churchName, role, isSuporte }
```

### Roles disponíveis
`pastor_central | pastor_auxiliar | lider | membro`

---

## Componentes de Layout existentes

| Componente | Onde | Descrição |
|---|---|---|
| `AppShell` | `components/layout/` | Container principal do dashboard |
| `Sidebar` | `components/layout/` | Navegação desktop |
| `Topbar` | `components/layout/` | Cabeçalho com avatar e user menu |
| `BottomNav` | `components/layout/` | Navegação mobile fixada na base |
| `SupportContextCard` | `components/dashboard/` | Card mobile para simular contexto de suporte |

---

## Padrões de CSS

- **CSS Modules** em todos os componentes (`.module.css`)
- Sem Tailwind, sem styled-components
- Mobile-first: estilos base para mobile, `@media (min-width: 768px)` para desktop
- Breakpoints: mobile `≤ 767px`, desktop `≥ 768px`, wide `≥ 1440px`
- Animações: usar `--duration-*` e `--ease-*` dos tokens, nunca valores fixos
- `@media (prefers-reduced-motion: reduce)` em todo componente com animação

---

## Novos módulos / telas

Ao criar uma nova página dentro de `/dashboard`:

1. **Adicionar a rota em `NAV_ITEMS`** (`lib/nav.ts`) — sidebar e bottom nav atualizam automaticamente
2. **Criar em `app/dashboard/[modulo]/page.tsx`** como server component (use `getSession()` se precisar da sessão)
3. **Layout do conteúdo** segue o padrão do dashboard: `padding: var(--space-6) var(--space-5)`, `max-width: 900px`
4. **Cards** usam `background: var(--color-bg-card)`, `border: 1px solid var(--color-border)`, `border-radius: var(--radius-xl)`
5. **Mobile**: testar sempre com BottomNav visível (60px de altura fixa na base)

### Estrutura de página padrão
```tsx
// app/dashboard/[modulo]/page.tsx
import { getSession } from '@/lib/auth';
import styles from './page.module.css';

export default async function ModuloPage() {
  const session = await getSession();
  // ...
  return (
    <div className={styles.root}>
      {/* conteúdo */}
    </div>
  );
}
```

```css
/* page.module.css */
.root {
  padding: var(--space-6) var(--space-5);
  max-width: 900px;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

@media (max-width: 767px) {
  .root {
    padding: var(--space-5) var(--space-4);
    gap: var(--space-5);
  }
}
```

---

## Ministérios e suas cores

| Ministério | Token texto | Token fundo |
|---|---|---|
| Louvor | `--ministry-louvor` | `--ministry-louvor-bg` |
| Grupos de Célula | `--ministry-gc` | `--ministry-gc-bg` |
| Mídia | `--ministry-midia` | `--ministry-midia-bg` |
| Dança | `--ministry-danca` | `--ministry-danca-bg` |
| Discipulado | `--ministry-disc` | `--ministry-disc-bg` |
| Adolescentes | `--ministry-adol` | `--ministry-adol-bg` |
| Cronos | `--ministry-cron` | `--ministry-cron-bg` |

---

## Regras de arquitetura (ver ARCHITECTURE.md)

- Frontend **nunca** acessa o banco diretamente
- Toda regra de negócio vive no NestJS
- Multi-tenant: `church_id` sempre vem do JWT, nunca do cliente
- Cross-tenant = 403
