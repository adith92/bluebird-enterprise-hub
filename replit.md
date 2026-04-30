# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/scripts run seed-bluebird` — seed Bluebird Hub demo data

## Artifacts

- **bluebird-hub** (`/`) — Bluebird B2B Enterprise Hub. Internal management web app for fleet/operations: GM Dashboard, Sales (orders), Operations (vehicles + drivers), Finance (invoices), Clients. React+Vite, Shadcn UI, Bluebird Blue (#0054A6) accent.
- **api-server** (`/api`) — Express backend. Routes: clients, vehicles (with `/available` availability search and maintenance enforcement), drivers, orders (auto-generates invoices on completion + syncs vehicle/driver status), invoices, dashboard (summary, maintenance-alerts, recent-activity), search.

## Bluebird Hub Domain Notes

- Vehicle statuses: `available | booked | maintenance`. `maintenance` requires `maintenanceCompletionDate`.
- Driver statuses: `available | on_trip | off_duty`.
- Order statuses: `draft | active | completed | cancelled`. Marking `completed` auto-issues an invoice (30-day terms) and frees vehicle/driver if no other active orders.
- Invoice statuses: `paid | outstanding`.
- Order numbers: `BB-{year}-{seq}`. Invoice numbers: `INV-{year}-{seq}`.
- Availability check overlaps non-cancelled orders (`startDate <= end AND endDate >= start`) and excludes `maintenance` vehicles.
- Numeric DB columns return as strings; serializers in `artifacts/api-server/src/lib/serialize.ts` convert via `Number()`.
- Date query params: the only date-query endpoint is `GET /vehicles/available`; that route hand-coerces `startDate`/`endDate` strings before zod validation since the generated `zod.date()` schema doesn't auto-coerce. Body schemas use `zod.coerce.date()` and parse fine.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
