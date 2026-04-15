FROM node:22-slim

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/ui/package.json packages/ui/package.json

RUN pnpm install

EXPOSE 3001

# prisma generate roda no startup: nesse momento as env vars e o volume já estão disponíveis
CMD ["sh", "-c", "pnpm --filter api prisma:generate && pnpm --filter api start:dev"]
