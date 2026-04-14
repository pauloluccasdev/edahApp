# edahApp

Monorepo simples com:

- `apps/web`: Next.js com App Router, TypeScript e base para PWA
- `apps/api`: NestJS com `ConfigModule` e prefixo global `/api`
- `packages/config`: base compartilhada de TypeScript
- `packages/types`: espaço para tipos compartilhados
- `infra/docker`: base para expansão futura da infraestrutura

## Pré-requisitos

- Node.js 20+
- pnpm
- Docker e Docker Compose

## Setup local

```bash
pnpm install
```

## Rodar sem Docker

```bash
pnpm dev
```

Isso sobe o `web` na porta `3000` e o `api` na porta `3001`.

## Rodar com Docker

```bash
pnpm docker:up
```

Se o Docker estiver acessível apenas com privilégios elevados no WSL, o comando faz fallback para `sudo docker compose up --build`.

Para parar:

```bash
pnpm docker:down
```

## Health checks

- Web: `http://localhost:3000/api/health`
- API: `http://localhost:3001/api/health`

Respostas esperadas:

```json
{ "status": "ok", "service": "web" }
```

```json
{ "status": "ok", "service": "api" }
```

## Variáveis de ambiente

O backend já está preparado para evolução futura com Supabase, sem integração ainda.

Variáveis previstas no `apps/api`:

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## Estrutura

```txt
edahApp/
  apps/
    web/
    api/
  packages/
    config/
    types/
  infra/
    docker/
  docker-compose.yml
  package.json
  pnpm-workspace.yaml
```
