# Workus

## Tech stack

| Area | Stack |
|---|---|
| Backend (`backend/`) | Node.js 26 LTS, TypeScript, NestJS 11 (Express), Prisma 7, PostgreSQL 18, Zod (nestjs-zod), pino |
| Frontend (`frontend/`) | React 19, TypeScript, Vite, MUI + Tailwind 4, TanStack Query, React Router, React Hook Form + Zod, react-i18next, Motion |
| API contract | OpenAPI generated from the backend (`backend/openapi.json`) → TypeScript types for the frontend |

## Running locally

Prerequisites: Node.js 26 (`.nvmrc`), PostgreSQL 18 with an empty database.

### Backend — http://localhost:3000

```bash
cd backend
cp .env.example .env        # fill in the values
npm ci
npm run db:migrate:deploy
npm run db:seed             # 2 admins + 10 employees, password from SEED_USER_PASSWORD
npm run start:dev
```

API docs (dev only): http://localhost:3000/docs

### Frontend — http://localhost:5173

```bash
cd frontend
cp .env.example .env
npm ci
npm run generate:api
npm run dev
```

The dev server proxies `/api` to the backend on port 3000.
