# Frontend Architecture — edahApp

> Guia oficial de arquitetura e boas práticas do frontend Next.js.  
> Leia antes de criar qualquer página, componente ou rota nova.

---

## 1. Princípios da Arquitetura

### Next.js como camada de apresentação

O frontend é responsável apenas por **exibir dados e capturar interações**. Toda lógica de negócio, validação crítica e acesso ao banco vive no NestJS. O Next.js nunca acessa o banco diretamente para operações de domínio.

### Server Components por padrão

No App Router, todo componente é um **Server Component** por padrão. Isso significa que ele roda no servidor, tem acesso direto a `fetch`, variáveis de ambiente e não envia JavaScript para o cliente.

`'use client'` é a exceção, não a regra.

### Separação por feature, não por tipo global

Errado:
```
app/
  components/
  hooks/
  services/
```

Certo:
```
app/
  dashboard/
    escalas/
      _components/
      page.tsx
    membros/
      _components/
      page.tsx
```

Cada rota carrega seus próprios componentes. Só promova para `components/` global quando for reutilizado em **3 ou mais lugares distintos**.

### Dados nascem no servidor

Prefira `async/await` direto no Server Component em vez de `useEffect` + `useState` no cliente. Menos JavaScript, melhor UX, melhor SEO.

---

## 2. Estrutura de Pastas

```
apps/web/
├── app/
│   ├── auth/                      ← rotas de autenticação (/login, /register)
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   └── _components/
│   │   └── layout.tsx
│   │
│   ├── dashboard/                 ← rotas protegidas do app
│   │   ├── escalas/
│   │   │   ├── page.tsx           ← Server Component (lista de escalas)
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   ├── loading.tsx        ← skeleton automático do Suspense
│   │   │   ├── error.tsx          ← boundary de erro da rota
│   │   │   └── _components/       ← componentes privados desta rota
│   │   │       └── EscalaCard.tsx
│   │   ├── membros/
│   │   └── layout.tsx             ← layout com sidebar/topbar
│   │
│   ├── api/                       ← Route Handlers (se necessário)
│   │   └── auth/
│   │       └── route.ts
│   │
│   ├── globals.css
│   ├── layout.tsx                 ← Root layout
│   └── middleware.ts              ← Proteção de rotas (autenticação)
│
├── components/                    ← Componentes globais reutilizados em 3+ lugares
│   └── Avatar.tsx
│
├── lib/                           ← Utilitários, helpers, clientes de API
│   ├── api.ts                     ← Cliente fetch para o NestJS
│   └── auth.ts                    ← Helpers de autenticação
│
└── types/                         ← Tipos compartilhados do frontend
    └── api.types.ts
```

### Papel de cada pasta

| Pasta | Responsabilidade |
|---|---|
| `app/grupo/rota/page.tsx` | Server Component — busca dados e renderiza a view. |
| `app/grupo/rota/_components/` | Componentes privados da rota. Não exportados para fora. |
| `app/grupo/rota/loading.tsx` | Skeleton exibido enquanto a página carrega (Suspense automático). |
| `app/grupo/rota/error.tsx` | Boundary de erro — captura exceções da rota sem derrubar o app. |
| `app/middleware.ts` | Intercepta todas as requisições — valida token e protege rotas. |
| `components/` | Componentes globais genuinamente reutilizáveis. |
| `lib/api.ts` | Wrapper de `fetch` para o NestJS com token e tratamento de erro. |

---

## 3. Server Components vs Client Components

### Server Component (padrão — sem diretiva)

Use para tudo que não precisa de interatividade no navegador.

```tsx
// app/dashboard/escalas/page.tsx
// ✓ Server Component — sem 'use client'

import { EscalaCard } from './_components/EscalaCard';

async function getEscalas(token: string) {
  const res = await fetch(`${process.env.API_URL}/api/escalas`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Falha ao carregar escalas');
  return res.json();
}

export default async function EscalasPage() {
  const token = await getTokenFromCookie(); // lê do cookie httpOnly
  const escalas = await getEscalas(token);

  return (
    <div>
      {escalas.map((e) => (
        <EscalaCard key={e.id} escala={e} />
      ))}
    </div>
  );
}
```

### Client Component (`'use client'`)

Use **apenas** quando precisar de:
- `useState`, `useEffect`, `useRef`
- Event handlers (`onClick`, `onChange`)
- APIs do navegador (`window`, `localStorage`)
- Animações interativas

```tsx
// app/dashboard/escalas/_components/PublicarButton.tsx
'use client';

import { useState } from 'react';
import { Button } from '@edah/ui';

interface Props {
  escalaId: string;
}

export function PublicarButton({ escalaId }: Props) {
  const [loading, setLoading] = useState(false);

  async function handlePublicar() {
    setLoading(true);
    await fetch(`/api/escalas/${escalaId}/publicar`, { method: 'POST' });
    setLoading(false);
  }

  return (
    <Button variant="primary" loading={loading} onClick={handlePublicar}>
      Publicar Escala
    </Button>
  );
}
```

### Regra de composição

Mantenha o `'use client'` o mais baixo possível na árvore. O Server Component pai passa dados; o Client Component filho só gerencia interatividade.

```
EscalasPage (Server)          ← busca dados
  └── EscalaCard (Server)     ← renderiza o card
        └── PublicarButton (Client) ← só o botão é interativo
```

---

## 4. Busca de Dados (Data Fetching)

### Padrão — async/await no Server Component

```tsx
// ✓ Correto — dados buscados no servidor
export default async function MembrosPage() {
  const membros = await getMembros();
  return <MembrosLista membros={membros} />;
}
```

### Errado — useEffect no cliente

```tsx
// ✗ Errado — desnecessário em Server Component
'use client';

export default function MembrosPage() {
  const [membros, setMembros] = useState([]);

  useEffect(() => {
    fetch('/api/membros').then(r => r.json()).then(setMembros);
  }, []);

  return <MembrosLista membros={membros} />;
}
```

### Quando usar `useEffect` para dados

Somente quando a busca depende de **interação do usuário** que acontece no cliente (ex: busca ao digitar, filtros dinâmicos sem reload de página).

### Cache e revalidação

| Estratégia | Quando usar |
|---|---|
| `cache: 'no-store'` | Dados em tempo real: escalas, conflitos, presença. |
| `next: { revalidate: 60 }` | Dados que mudam pouco: lista de ministérios, perfil. |
| `cache: 'force-cache'` | Dados estáticos: configurações públicas, onboarding. |

---

## 5. Estrutura de Rotas e Grupos

### Pastas por contexto de rota

```
app/
  auth/login/page.tsx        → URL: /auth/login
  dashboard/escalas/         → URL: /dashboard/escalas
```

As pastas de contexto deixam a organização explícita e os segmentos passam a refletir a URL final.

### `loading.tsx` — skeleton automático

```tsx
// app/dashboard/escalas/loading.tsx
export default function Loading() {
  return (
    <div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="skeleton-card" />
      ))}
    </div>
  );
}
```

O Next.js envolve a `page.tsx` em um `<Suspense>` automaticamente e exibe este componente enquanto os dados carregam.

### `error.tsx` — boundary de erro da rota

```tsx
// app/dashboard/escalas/error.tsx
'use client'; // obrigatório — error boundaries são client components

interface Props {
  error: Error;
  reset: () => void;
}

export default function Error({ error, reset }: Props) {
  return (
    <div>
      <p>Erro ao carregar escalas: {error.message}</p>
      <button onClick={reset}>Tentar novamente</button>
    </div>
  );
}
```

---

## 6. Segurança e Autenticação

### `middleware.ts` — proteção de rotas

O middleware intercepta toda requisição e redireciona para `/login` se não houver token válido.

```ts
// apps/web/app/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get('edah_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### Tokens em cookies `httpOnly`

Tokens JWT **nunca** ficam no `localStorage`. Sempre em cookie `httpOnly`, que é inacessível via JavaScript do navegador.

```ts
// apps/web/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const res = await fetch(`${process.env.API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
  }

  const { token } = await res.json();

  const response = NextResponse.json({ ok: true });
  response.cookies.set('edah_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });

  return response;
}
```

### Validação de entrada no cliente

Formulários validam no cliente para UX, mas a **validação autoritativa** é sempre o NestJS.

```tsx
// Validação client-side é para feedback imediato, não para segurança.
// O backend valida novamente — nunca confie só no frontend.
function validateEmail(value: string): string | null {
  if (!value) return 'E-mail obrigatório';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'E-mail inválido';
  return null;
}
```

### Variáveis de ambiente

| Prefixo | Visível no cliente? | Uso |
|---|---|---|
| `API_URL` | Não | URL do NestJS — só no servidor |
| `NEXT_PUBLIC_*` | Sim | Apenas dados não sensíveis |

Nunca exponha chaves de API, tokens ou URLs internas com `NEXT_PUBLIC_`.

---

## 7. Otimização de Imagens e Fontes

### `next/image` — obrigatório para imagens

```tsx
import Image from 'next/image';

// ✓ Correto — lazy load, resize automático, WebP
<Image
  src="/avatar-placeholder.png"
  alt="Foto do membro"
  width={32}
  height={32}
  className="avatar"
/>

// ✗ Errado — sem otimização
<img src="/avatar-placeholder.png" alt="Foto do membro" />
```

### `next/font` — fonte carregada no servidor

```tsx
// apps/web/app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

A fonte é baixada em build time e servida localmente — sem requisições externas ao Google Fonts em runtime.

---

## 8. Tipagem com TypeScript

### Tipos de resposta da API

Defina tipos para cada resposta da API. Nunca use `any`.

```ts
// apps/web/types/api.types.ts

export type Escala = {
  id: string;
  eventoId: string;
  ministerioId: string;
  status: 'rascunho' | 'publicada';
  membros: MembroEscala[];
  criadaEm: string;
};

export type MembroEscala = {
  membroId: string;
  nome: string;
  ministerio: string;
  status: 'confirmado' | 'pendente' | 'conflito';
};
```

### Props de componentes

Sempre tipadas — nunca `props: any`.

```tsx
// ✓ Correto
interface EscalaCardProps {
  escala: Escala;
  onPublicar?: (id: string) => void;
}

export function EscalaCard({ escala, onPublicar }: EscalaCardProps) { ... }
```

### Inferência vs anotação explícita

```ts
// Deixe o TypeScript inferir quando é óbvio
const nome = 'Paulo'; // string — inferido

// Anote quando o tipo não é obvio ou é retorno de função
async function getMembro(id: string): Promise<Membro | null> { ... }
```

---

## 9. Padrões de Nomeação

| O que | Padrão | Exemplo |
|---|---|---|
| Página | `page.tsx` | `app/dashboard/escalas/page.tsx` |
| Layout | `layout.tsx` | `app/dashboard/layout.tsx` |
| Loading | `loading.tsx` | `app/dashboard/escalas/loading.tsx` |
| Error | `error.tsx` | `app/dashboard/escalas/error.tsx` |
| Componente privado | PascalCase em `_components/` | `EscalaCard.tsx` |
| Componente global | PascalCase em `components/` | `Avatar.tsx` |
| Hook customizado | `use` + PascalCase | `useEscalaForm.ts` |
| Utilitário / helper | camelCase | `formatDate.ts` |
| Tipo de API | PascalCase em `types/api.types.ts` | `Escala`, `MembroEscala` |
| Route Handler | `route.ts` dentro da pasta | `app/api/auth/login/route.ts` |

---

## 10. Anti-patterns — Proibido

| Anti-pattern | Por quê é um problema |
|---|---|
| `'use client'` no topo do layout raiz | Transforma toda a árvore em client — elimina os benefícios do RSC. |
| `useEffect` para busca de dados inicial | Dados buscados no cliente aumentam JavaScript, pioram SEO e adicionam loading states desnecessários. |
| Token JWT no `localStorage` | Acessível via JavaScript — vulnerável a XSS. Sempre usar cookie `httpOnly`. |
| `<img>` em vez de `<Image />` | Sem lazy load, sem resize automático, piora Core Web Vitals. |
| Lógica de negócio no frontend | Frontend valida para UX — nunca para segurança. O NestJS é o dono da regra. |
| Variável sensível com prefixo `NEXT_PUBLIC_` | Expõe segredos no bundle do cliente. |
| Componente `'use client'` alto na árvore | Força todos os filhos a serem client components desnecessariamente. |
| `any` em tipos de resposta da API | Remove a segurança de tipos — erros em runtime que TypeScript poderia ter capturado. |
| Fetch de dados em `useEffect` sem Server Component alternativo | Conteúdo não renderizado no servidor — prejudica SEO e aumenta TTFB. |

---

## 11. Fluxo de uma página autenticada

```
Requisição → middleware.ts
  ├── Sem cookie 'edah_token' → redireciona /login
  └── Token presente → continua

page.tsx (Server Component)
  └── Lê token do cookie (httpOnly — server only)
  └── fetch(API_URL/recurso, { Authorization: Bearer token })
  └── Renderiza HTML com dados já preenchidos
        └── _components/BotaoInterativo.tsx ('use client')
              └── Gerencia estado local, eventos de clique
```

---

## 12. Regra de Ouro

> **Se é apresentação, fica no Next.js. Se é regra de negócio, fica no NestJS.**
>
> O frontend é um espelho dos dados — ele exibe, coleta e envia.  
> Nunca calcula, nunca decide, nunca valida com autoridade.

---

*Dúvidas sobre onde colocar algo? Pergunte: "isso precisa de interatividade no navegador?" → `'use client'`. "Isso busca dados?" → Server Component + `async/await`. "Isso valida dados com autoridade?" → NestJS.*
