FROM node:26.13.0-alpine

ENV TZ=UTC
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci --ignore-scripts

COPY . .
RUN DATABASE_HOST=build DATABASE_PORT=5432 DATABASE_NAME=build DATABASE_USERNAME=build \
  DATABASE_PASSWORD=build npx prisma generate \
  && npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
