FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/ packages/
COPY apps/telegram-bot/package.json apps/telegram-bot/
RUN pnpm install --frozen-lockfile
COPY apps/telegram-bot/ apps/telegram-bot/
COPY tsconfig.base.json ./
RUN pnpm --filter @sportsbook/telegram-bot build
CMD ["node", "apps/telegram-bot/dist/index.js"]
