# End-to-end tests

Playwright tests of the main flows, run against the whole stack: the built backend on a fresh database and the
built frontend served by `vite preview`, exactly as a browser sees them.

| Spec                | Flow                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------- |
| `auth.spec.ts`      | Sign-in returns to the page asked for (desktop and phone) · a wrong password · sign-out      |
| `sign-up.spec.ts`   | A new company waits for approval, a platform admin approves it, the owner gets in            |
| `employees.spec.ts` | An owner adds an employee, who signs in with the one-time password                           |
| `time-off.spec.ts`  | An employee asks for days off, the responsible admin approves, the employee sees it          |
| `reviews.spec.ts`   | An admin records a completed review with a new salary                                        |
| `billing.spec.ts`   | Starter locks paid features · upgrade through checkout · scheduled downgrade · keep the plan |
| `access.spec.ts`    | Another company's record answers like a missing one · an employee sees only their sections   |

## Run

```bash
cd e2e
npm ci
npm run browsers   # once: Chromium for Playwright
npm test           # builds both apps, rebuilds the e2e database, runs every spec
npm run test:ui    # the same in Playwright's UI mode
npm run report     # the last HTML report
```

Locally the database is `workus_e2e` on the server and with the credentials from `backend/.env`; create it once:

```bash
createdb -O workus workus_e2e
```

Each run wipes and reseeds it, so it never touches your development data. Ports: backend 3100, frontend 4173
(`E2E_API_PORT`, `E2E_WEB_PORT`, `E2E_DATABASE_NAME` override them). Sign-up is rate-limited to three companies an
hour per network, and every run creates two — run the suite again after a reset rather than repeating it in a loop.

## Structure

```
config/stack.ts        ports, URLs, database, the backend's environment for the run
setup/reset-database.ts wipe → migrate → seed (runs before the backend starts)
support/               accounts, unique people, UTC dates, an API session for arranging data, fixtures
pages/                 page objects — every selector lives here, by role and accessible name
tests/                 one spec per flow, steps named after what the user does
```

- Arrange through the API (`apiAs(account).hire(…)`), act and assert through the UI.
- Each actor gets its own browser context (`signInAs(account)`), so flows between people run side by side.
- Selectors are roles and accessible names — a broken label fails a test, as it would fail a screen-reader user.
- Every test creates its own people and companies with unique names; nothing depends on test order.

CI runs the suite in the `e2e` job after the backend and frontend jobs, with PostgreSQL as a service; a failed run
uploads the HTML report, traces, screenshots and videos as the `playwright-report` artifact.
