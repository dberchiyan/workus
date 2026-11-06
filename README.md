# Workus

## Tech stack

| Area | Stack |
|---|---|
| Backend (`backend/`) | Node.js LTS, TypeScript, NestJS (Express), Prisma, PostgreSQL 18, Zod (nestjs-zod), pino |
| Frontend (`frontend/`) | React 19, TypeScript, Vite, MUI + Tailwind 4, TanStack Query, React Router, React Hook Form + Zod, react-i18next, Motion |
| API contract | OpenAPI generated from the backend → TypeScript types for the frontend |

## Running locally

Prerequisites: Node.js LTS, PostgreSQL 18 with an empty database.

### Backend

```bash
cd backend
cp .env.example .env
npm ci
npm run db:migrate:deploy
npm run start:dev
```

### Frontend

```bash
cd frontend
npm ci
npm run generate:api
npm run dev
```
