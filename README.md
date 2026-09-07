# Manufacturing Downtime & Fault Tracking System

A full-stack maintenance application for recording machine faults, tracking active downtime, and turning past incidents into searchable troubleshooting knowledge.

The application models a manufacturing facility from departments down to individual machines. Technicians can report a fault as it happens, resolve it later, and search historical events across the plant when similar symptoms return.

## Current capabilities

- **Operations dashboard** with total, open, and resolved event counts, total machines, resolved downtime minutes, and event distribution by machine.
- **Plant setup** for creating, editing, and deleting departments and production lines.
- **Machine registry** for creating, editing, deleting, and assigning machines to production lines.
- **Machine profiles** with machine information, fault metrics, total downtime, searchable history, status filtering, and a preselected “Report fault” workflow.
- **Downtime management** for logging, editing, resolving, reopening, and deleting events.
- **Historical fault search** across free-text fault reasons and descriptions from every machine.
- **Combined filters** for machine, production line, status, and occurrence date range.
- **Automatic status handling**: an event without a resolution time is `OPEN`; an event with one is `RESOLVED`.
- **Validation and useful API errors** for missing fields, invalid date ranges, unknown records, and delete conflicts.
- **Session-based authentication** with database-backed users, BCrypt password hashes, CSRF protection, session-expiry handling, and JSON `401`/`403` responses.
- **Role-based access control** for administrators and technicians, including role-aware navigation and controls enforced again by the backend.
- **Administrator user management** for creating accounts, assigning roles, resetting passwords, enabling or disabling access, and protecting the final administrator account.
- **Responsive interface** with desktop and mobile navigation, loading states, empty states, and backend-offline feedback.

## Why this project exists

Downtime reports are most valuable when they remain useful after the immediate repair. If one machine later develops symptoms similar to an earlier incident on another machine, a technician can search terms such as `motor overload`, `bearing`, or `jammed conveyor` and review the earlier observations and repair notes.

The goal is a maintenance knowledge base that becomes more useful as the facility records more faults.

## Architecture

```text
Browser
   |
   | Next.js pages, session cookie, CSRF header, and /api proxy
   v
Next.js frontend (port 3000)
   |
   | Authenticated REST/JSON
   v
Spring Boot API (port 8080)
   |
   | Spring Data JPA / Hibernate
   v
PostgreSQL (port 5432, Docker)
```

Browser-side requests use relative `/api/...` URLs. The rewrite in `frontend/next.config.ts` forwards them to Spring Boot, avoiding a browser cross-origin request. The current dashboard loads on the client after the authenticated session has been checked, so its requests include the same session credentials as the rest of the interface.

### Domain model

```text
Department 1 ---- * ProductionLine 1 ---- * Machine 1 ---- * DowntimeEvent
```

- A **department** describes a plant area or organizational unit.
- A **production line** belongs to one department.
- A **machine** belongs to one production line.
- A **downtime event** belongs to one machine and stores a fault reason, description, occurrence time, optional resolution time, and derived status.

The backend retains an optional legacy `DowntimeReason` relationship and REST resource, but the active frontend intentionally uses a required free-text fault reason instead of a fixed downtime-reason dropdown. This lets each machine’s distinct failures be described without maintaining a category for every possible fault.

## Technology stack

| Layer | Technologies |
| --- | --- |
| Frontend | Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Java 21, Spring Boot 4, Spring Security, Spring Web MVC, Spring Data JPA, Bean Validation |
| Database | PostgreSQL 16 |
| Local infrastructure | Docker Compose |
| Tests | JUnit 5, Mockito, Spring test utilities |

## Prerequisites

Install the following before starting:

- Java 21
- Node.js 20.9 or newer and npm
- Docker with Docker Compose

The repository includes Maven Wrapper scripts, so a separate Maven installation is not required.

## Run locally

Run each application layer in the order below.

### 1. Start PostgreSQL

From the repository root:

```bash
docker compose up -d postgres
```

This starts PostgreSQL on `localhost:5432` and stores its data in the named `downtime_postgres_data` volume.

### 2. Start the backend

In a terminal:

```bash
cd backend
./mvnw spring-boot:run
```

On Windows, run `mvnw.cmd spring-boot:run` instead. The API is available at [http://localhost:8080](http://localhost:8080).

### 3. Configure and start the frontend

In another terminal:

```bash
cd frontend
cp .env.example .env.local
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The default frontend environment value is:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8080
```

After changing `NEXT_PUBLIC_API_URL` or `next.config.ts`, restart the frontend server so the rewrite is reloaded.

### 4. Sign in

For local development, the backend creates these starter accounts when the `app_users` table is empty:

| Role | Username | Password |
| --- | --- | --- |
| Administrator | `admin` | `Admin123!` |
| Technician | `technician` | `Tech123!` |

> These credentials are for local development and portfolio demonstrations only. Change both passwords before sharing an environment. The starter-account initializer is disabled when the `prod` Spring profile is active.

The local passwords and initializer can be controlled without editing source code:

```bash
BOOTSTRAP_ADMIN_PASSWORD='choose-a-new-admin-password' \
BOOTSTRAP_TECHNICIAN_PASSWORD='choose-a-new-technician-password' \
./mvnw spring-boot:run
```

Set `BOOTSTRAP_USERS_ENABLED=false` to prevent starter accounts from being created. Once any application user exists, the initializer leaves all user records unchanged.

### Stop local services

Stop the frontend and backend with `Ctrl+C`, then stop PostgreSQL from the repository root:

```bash
docker compose down
```

This leaves the named database volume intact.

## Load demonstration data

The optional Spring `demo` profile loads 3 departments, 4 production lines, 8 machines, and 14 realistic fault events for portfolio demonstrations. Start PostgreSQL, then run this command **instead of** the normal backend command:

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=demo
```

The initializer runs only when the core application tables are empty. It leaves existing application data unchanged, so use an empty local database when you want the full sample dataset. User accounts are initialized separately, which means an existing plant database can gain its first local administrator without altering plant or downtime records.

To keep your regular `downtime_app` records separate, create a dedicated demo database once:

```bash
docker exec downtime-postgres createdb -U noman downtime_demo
```

Then start the demo backend against it:

```bash
cd backend
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/downtime_demo \
./mvnw spring-boot:run -Dspring-boot.run.profiles=demo
```

If `downtime_demo` already exists, skip the `createdb` command. The frontend continues to use port `8080`, so no frontend configuration change is required.

With the backend running in the demo profile, start the frontend normally and explore this workflow:

1. Review the plant metrics on the dashboard.
2. Search the downtime page for terms such as `motor overload`, `bearing`, or `sensor`.
3. Open a machine from the registry to review its individual fault history.
4. Log an open fault, then edit it and supply a resolution time to mark it resolved.

## Authentication and roles

The application uses a database-backed Spring Security session. The browser receives an HTTP-only `JSESSIONID` cookie after login. State-changing requests also require a CSRF token; the shared frontend API client obtains and sends that token automatically.

| Capability | Technician | Administrator |
| --- | :---: | :---: |
| View dashboard, machines, and fault history | Yes | Yes |
| Search, create, edit, resolve, and reopen downtime events | Yes | Yes |
| Delete downtime history | No | Yes |
| Create, edit, or delete machines | No | Yes |
| Manage departments and production lines | No | Yes |
| Create, edit, disable, or delete users | No | Yes |

The frontend hides controls that are unavailable to the current role, while the backend independently enforces every permission. Direct navigation to `/settings` or `/users` as a technician displays an access-denied page, and direct API calls return `403 Forbidden`.

Administrator safeguards prevent a signed-in user from deleting, disabling, or changing the role of their own account. The final enabled administrator also cannot be disabled, demoted, or deleted.

## REST API

The API base URL is `http://localhost:8080/api` during local development.

All endpoints require authentication except the CSRF-token and login endpoints.

### Authentication and users

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/auth/csrf` | Public | Issue the CSRF cookie and return its token/header contract |
| `POST` | `/api/auth/login` | Public | Authenticate a username and password and create a session |
| `GET` | `/api/auth/me` | Signed-in user | Return the current sanitized user profile |
| `POST` | `/api/auth/logout` | Signed-in user | Invalidate the current session |
| `GET` | `/api/users` | Administrator | List application users |
| `POST` | `/api/users` | Administrator | Create an administrator or technician |
| `PUT` | `/api/users/{id}` | Administrator | Update display name, role, enabled status, or password |
| `DELETE` | `/api/users/{id}` | Administrator | Delete an account when administrator safeguards allow it |

API clients that do not use the frontend proxy must first call `/api/auth/csrf`, retain the returned `XSRF-TOKEN` cookie, and send the returned token using the `X-XSRF-TOKEN` header with every `POST`, `PUT`, `PATCH`, or `DELETE` request.

### Dashboard

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/summary` | Counts events and machines and sums resolved downtime minutes |
| `GET` | `/api/dashboard/downtime-by-machine` | Returns event counts grouped by machine |
| `GET` | `/api/dashboard/downtime-by-reason` | Returns counts for events with an optional legacy downtime reason |

### Departments, production lines, and machines

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/departments` | List departments |
| `GET` | `/api/departments/{id}` | Get one department |
| `POST` | `/api/departments` | Create a department |
| `PUT` | `/api/departments/{id}` | Update a department |
| `DELETE` | `/api/departments/{id}` | Delete an unreferenced department |
| `GET` | `/api/production-lines` | List production lines |
| `GET` | `/api/production-lines/{id}` | Get one production line |
| `POST` | `/api/production-lines` | Create a production line |
| `PUT` | `/api/production-lines/{id}` | Update a production line |
| `DELETE` | `/api/production-lines/{id}` | Delete an unreferenced production line |
| `GET` | `/api/machines` | List machines |
| `GET` | `/api/machines/{id}` | Get one machine |
| `POST` | `/api/machines` | Create a machine |
| `PUT` | `/api/machines/{id}` | Update a machine |
| `DELETE` | `/api/machines/{id}` | Delete a machine without fault history |

### Downtime events

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/downtime-events` | Search and filter events; results are newest first |
| `GET` | `/api/downtime-events/{id}` | Get one event |
| `POST` | `/api/downtime-events` | Create an event |
| `PUT` | `/api/downtime-events/{id}` | Update, resolve, or reopen an event |
| `DELETE` | `/api/downtime-events/{id}` | Delete an event |

The list endpoint accepts any combination of these query parameters:

| Parameter | Meaning | Example |
| --- | --- | --- |
| `q` | Case-insensitive search of fault reason and description | `motor overload` |
| `machineId` | Restrict results to one machine | `4` |
| `productionLineId` | Restrict results to one production line | `2` |
| `status` | `OPEN` or `RESOLVED` | `OPEN` |
| `start` | Occurred on or after an ISO local date-time | `2026-09-01T00:00:00` |
| `end` | Occurred on or before an ISO local date-time | `2026-09-30T23:59:59` |
| `downtimeReasonId` | Optional legacy backend filter; not used by the frontend | `3` |

Example:

```text
GET /api/downtime-events?q=motor&productionLineId=2&status=RESOLVED
```

A typical event request is:

```json
{
  "machineId": 4,
  "faultReason": "Main drive motor overload",
  "description": "Motor became hot and tripped after 15 minutes.",
  "occurredAt": "2026-09-06T10:30:00",
  "resolvedAt": null
}
```

Do not send an event status. The backend derives it from `resolvedAt`: `null` produces `OPEN`, while a valid resolution time produces `RESOLVED`. A resolution time earlier than the occurrence time is rejected with `400 Bad Request`.

### Legacy downtime-reason resource

The backend still exposes CRUD endpoints at `/api/downtime-reasons` and `/api/downtime-reasons/{id}` for backward compatibility. The current frontend does not load or manage this resource.

### Error responses

Handled API errors use a consistent JSON shape:

```json
{
  "status": 409,
  "error": "Conflict",
  "message": "This machine cannot be deleted because downtime events still reference it."
}
```

- `400 Bad Request` covers request validation, invalid enum/ID formats, and invalid time ranges.
- `401 Unauthorized` indicates that a valid signed-in session is required.
- `403 Forbidden` indicates a missing CSRF token or an action outside the current user's role.
- `404 Not Found` covers missing departments, lines, machines, downtime events, and legacy reasons.
- `409 Conflict` protects records that are still referenced by other data.

## Verification commands

Start PostgreSQL first with `docker compose up -d postgres`; the backend context test uses the configured database.

Run backend tests:

```bash
cd backend
./mvnw test
```

Create a backend package:

```bash
cd backend
./mvnw clean package
```

Install and run the verified frontend production build:

```bash
cd frontend
npm ci
npm run build
```

Preview a completed frontend build with `npm run start` while the backend is running.

## Project structure

```text
downtime-project/
├── backend/
│   ├── src/main/java/com/example/downtime/
│   │   ├── Config/           security, CORS, CSRF, and local/demo initializers
│   │   ├── Controller/       REST endpoints
│   │   ├── DTO/              API request, user, and dashboard response models
│   │   ├── Entities/         JPA domain and application-user entities
│   │   ├── Exception/        Consistent HTTP error handling
│   │   ├── Repository/       Spring Data repositories
│   │   └── Service/          Business logic, validation, and search
│   └── src/test/             Backend tests
├── frontend/
│   ├── src/app/              App Router pages and global layout
│   ├── src/components/       Auth, dashboard, downtime, machine, setup, user, and layout UI
│   ├── src/lib/              Shared API client
│   ├── src/services/         Typed backend service functions
│   └── src/types/            Shared frontend domain types
└── docker-compose.yml        Local PostgreSQL service
```

## Roadmap

The current application is a functional portfolio MVP. Logical next improvements are:

- Add frontend component tests and a browser-level end-to-end workflow.
- Add pagination for large fault histories and server-side dashboard aggregation.
- Preserve audit history with archival or soft deletion instead of deleting downtime events.
- Move database credentials to environment variables before publishing or deploying.
- Add audit attribution so fault records show who created and last updated them.
- Add production containers, continuous integration, deployment configuration, and monitoring.
- Add repository screenshots after the final visual review.
