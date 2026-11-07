# Workus

Workus is a web app for a company's day-to-day HR work: the employee directory, reviews and
salaries, time off, a company calendar and yearly insights. One installation hosts many
companies; each company's people and data are its own.

## Features

### For owners

Everything admins do, plus **Settings → Company** (rename the company) and **Settings →
Administrators** (make an admin an owner or an owner an admin; a company always keeps one owner).
Anyone can create a new company at `/signup` and becomes its first owner.

### For admins

| Area | What they do |
|---|---|
| **Dashboard** | See pending requests, who is out today, reviews due and people joining or leaving; below, today's events (requests made, reviews, birthdays) and events by month |
| **Employees** | Search the directory by name, category and status; add people, edit profiles (contacts, date of birth, responsible admins), terminate or cancel a termination; read each person's leave balances and activity history |
| **Reviews** | Schedule and complete reviews with salary and rich-text feedback; follow each person's salary history and its change |
| **Requests** | Review pending requests and the rest; approve, reject or cancel those they are responsible for; comment on any request |
| **Calendar** | See the whole company's approved and pending time off for a month, by person and day |
| **Insights** | Read a year at a glance for the company or one category — headcount by month, staff turnover with the people behind it, average tenure, absence leaders, average salary — each compared with the previous year |

### For employees

| Area | What they do |
|---|---|
| **Dashboard** | See their vacation, sick-day and day-off balances for the current cycles (counted from their start date) and their requests with history and comments |
| **Time off** | Request vacation, sick days or days off on a range calendar, and cancel a pending or upcoming request |
| **Calendar** | See when colleagues are away — approved and pending time off for the month |

Every change to an employee, a review or a request is kept in an append-only activity history.

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

Then sign in with one of the [demo accounts](#demo-accounts).

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

## Demo accounts

`npm run db:seed` creates two separate companies — neither sees the other's people or data.
Every seeded account uses the password **`Workus-Dev-2026!`** (fictional demo data, local only).

| Role | 🏢 OSDB — 46 people | 🌀 Vortex — 9 people |
|---|---|---|
| **Owner** — everything, plus the company and its administrators | `sophia.carter@osdb.io` | `liam.foster@vortex.io` |
| **Admin** — employees, reviews, requests, calendar, insights | `marcus.reid@osdb.io` | `hannah.brooks@vortex.io` |
| **Employee** — own time off and the calendar | `ava.thompson@osdb.io` | `ethan.cole@vortex.io` |

Every other seeded person signs in the same way: `first.last@osdb.io` or `first.last@vortex.io`.
To try a fresh, empty company, use **Create a company** on the sign-in page.
