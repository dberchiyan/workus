# Local run image (docker compose): the built app plus the tools to migrate and seed.
FROM node:26.13.0-alpine

ENV TZ=UTC
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
# Scripts run below once the schema is in place (postinstall = prisma generate).
RUN npm ci --ignore-scripts

COPY . .
# The Prisma config reads the DATABASE_* settings; generating the client never connects.
RUN DATABASE_HOST=build DATABASE_PORT=5432 DATABASE_NAME=build DATABASE_USERNAME=build \
  DATABASE_PASSWORD=build npx prisma generate \
  && npm run build \
  && chown -R node:node /app

USER node
ENV NODE_ENV=production
EXPOSE 3000

# Pending migrations first (deploy never changes the schema beyond committed migrations).
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
