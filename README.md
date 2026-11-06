# Workus

Workus is a web app for a company's day-to-day HR work. Admins keep the employee directory and
profiles, run reviews with salary and feedback, see each person's salary history and terminate
employment; every change is kept in an append-only activity history.

Employees request vacation, sick days and days off, see their balances per cycle and follow each
request until their responsible people decide. Dashboards show each role what matters today:
admins see pending requests, who is out, reviews due and people joining or leaving; employees see
their own time off.

## Tech stack

#### Backend

- Node.js 26, TypeScript
- NestJS 11 — modular monolith
- Prisma 7, PostgreSQL 18
- Zod — validation and the OpenAPI spec
- Sessions in PostgreSQL, argon2

#### Frontend

- React 19, TypeScript, Vite
- MUI 9 + Tailwind CSS 4
- TanStack Query, React Router
- React Hook Form + Zod
- react-i18next
- API types generated from OpenAPI

## Environment variables

Each `.env.example` lists its variables with what they do; copy it to `.env` next to it.

| File | Used by | Required |
|---|---|---|
| `.env.example` | Docker Compose | `DATABASE_PASSWORD` |
| `backend/.env.example` | Backend without Docker | `DATABASE_PASSWORD` |
| `frontend/.env.example` | Frontend build | — |

## Running with Docker

The database, backend and frontend in one command (Docker with Compose v2):

```bash
cp .env.example .env    # set DATABASE_PASSWORD
docker compose up --build
```

The app is at http://localhost:8080 — nginx serves the frontend and proxies `/api` to the backend,
which applies pending migrations on start. Seed development data once the backend is up:

```bash
docker compose exec backend npm run db:seed
```

Every seeded account signs in with the password `Workus-Dev-2026!` (e.g. `olivia.bennett@workus.dev`, admin).

Data lives in the `db-data` volume; `docker compose down -v` removes it.

## Running locally

Prerequisites: Node.js 26 (`.nvmrc`), PostgreSQL 18 with an empty database.

### Backend — http://localhost:3000

```bash
cd backend
cp .env.example .env
npm ci
npm run db:migrate:deploy
npm run db:seed
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
