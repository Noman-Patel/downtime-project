# MECH frontend

The responsive Next.js interface for the Manufacturing Downtime & Fault Tracking System. It provides authenticated access to the operations dashboard, plant setup, user administration, machine registry and profiles, downtime reporting, and cross-machine historical fault search.

For complete database, backend, demo-data, API, and project documentation, see the [root README](../README.md).

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4

## Start the frontend

The Spring Boot API must be running on port `8080` first. Then run:

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For local development, sign in with one of the starter accounts created by the backend:

| Role | Username | Password |
| --- | --- | --- |
| Administrator | `admin` | `Admin123!` |
| Technician | `technician` | `Tech123!` |

These defaults are intended only for local development. See the root README for password overrides and the full security notes.

The local environment file contains:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Restart the development server after changing this value or `next.config.ts`.

## Available commands

```bash
npm run dev      # development server
npm run lint     # ESLint checks
npm run build    # production build and TypeScript validation
npm run start    # serve a completed production build
```

## Routes

| Route | Purpose |
| --- | --- |
| `/login` | Sign in and return to the originally requested page |
| `/` | Live dashboard summary and event distribution by machine |
| `/downtime` | Report, search, filter, edit, resolve, and reopen faults; deletion is administrator-only |
| `/machines` | Review machines; administrators can create, edit, and delete them |
| `/machines/[id]` | View one machine's metrics and searchable fault history |
| `/settings` | Administrator-only department and production-line management |
| `/users` | Administrator-only account and role management |

The machine profile links to `/downtime?machineId={id}&new=1` to open a new fault form with that machine already selected.

## Frontend architecture

```text
src/
├── app/                 routes, metadata, global styles, and root layout
├── components/
│   ├── dashboard/       reusable analytics display
│   ├── downtime/        history search and event form
│   ├── auth/            session provider, login form, and role guard
│   ├── layout/          authenticated, role-aware application shell
│   ├── machines/        registry and machine profile
│   ├── settings/        department and production-line management
│   └── users/           administrator account management
├── lib/api.ts           shared session, CSRF, fetch, and error handling
├── services/            typed functions grouped by backend resource
└── types/               frontend domain and payload types
```

Interactive managers are client components responsible for form state and mutations. Route files stay small, and dashboard data is loaded through typed service functions after the browser session has been authenticated.

## Authentication behavior

- `AuthProvider` checks `/api/auth/me` when the interface loads and keeps the current sanitized user in memory.
- Unauthenticated visitors are redirected to `/login`, including a safe return path.
- `AppShell` displays the current user's name and role and filters navigation by permission.
- `RoleGuard` protects administrator pages in the UI; Spring Security remains the authoritative enforcement layer.
- Technicians can work with downtime events and view machine history, but cannot change plant structure, machines, users, or delete history.
- Administrators receive the full interface, including Plant setup and Users.
- A `401` response expires the frontend session and returns the user to login.

## API proxy

Browser requests use relative `/api/...` paths. `next.config.ts` rewrites those calls to `NEXT_PUBLIC_API_URL`, so the browser talks to the Next.js origin and does not make a cross-origin request directly to port `8080`.

Every request includes the HTTP-only Spring session cookie. Before a state-changing request, `src/lib/api.ts` obtains the CSRF contract from `/api/auth/csrf` and sends the token using the header specified by the backend. API errors retain their HTTP status so authentication expiry and permission errors can be handled correctly.

## Event behavior

- Fault reason is required free text; the UI intentionally has no downtime-reason dropdown.
- A new event defaults to open.
- `resolvedAt: null` is sent for an open event.
- Selecting resolved reveals a required resolution time.
- The backend derives `OPEN` or `RESOLVED`; the frontend does not submit the status field.
- The form prevents a resolution time earlier than the occurrence time.
