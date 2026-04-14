FROM node:22-slim

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/types/package.json packages/types/package.json

RUN pnpm install

EXPOSE 3001

CMD ["pnpm", "--filter", "api", "start:dev"]
