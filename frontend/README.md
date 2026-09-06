# MECH frontend

The responsive Next.js interface for the Manufacturing Downtime & Fault Tracking System. It provides the operations dashboard, plant setup, machine registry and profiles, downtime reporting, and cross-machine historical fault search.

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
| `/` | Live dashboard summary and event distribution by machine |
| `/downtime` | Report, search, filter, edit, resolve, reopen, and delete faults |
| `/machines` | Manage the machine registry |
| `/machines/[id]` | View one machine's metrics and searchable fault history |
| `/settings` | Manage departments and production lines |

The machine profile links to `/downtime?machineId={id}&new=1` to open a new fault form with that machine already selected.

## Frontend architecture

```text
src/
├── app/                 routes, metadata, global styles, and root layout
├── components/
│   ├── dashboard/       reusable analytics display
│   ├── downtime/        history search and event form
│   ├── layout/          responsive application shell
│   ├── machines/        registry and machine profile
│   └── settings/        department and production-line management
├── lib/api.ts           shared fetch and error handling
├── services/            typed functions grouped by backend resource
└── types/               frontend domain and payload types
```

Interactive managers are client components responsible for form state and mutations. Route files stay small, and server-rendered dashboard data is loaded through typed service functions.

## API proxy

Browser requests use relative `/api/...` paths. `next.config.ts` rewrites those calls to `NEXT_PUBLIC_API_URL`, so the browser talks to the Next.js origin and does not make a cross-origin request directly to port `8080`.

When rendering on the server, `src/lib/api.ts` uses the full backend URL. Errors returned by Spring are converted into readable messages for the UI.

## Event behavior

- Fault reason is required free text; the UI intentionally has no downtime-reason dropdown.
- A new event defaults to open.
- `resolvedAt: null` is sent for an open event.
- Selecting resolved reveals a required resolution time.
- The backend derives `OPEN` or `RESOLVED`; the frontend does not submit the status field.
- The form prevents a resolution time earlier than the occurrence time.
