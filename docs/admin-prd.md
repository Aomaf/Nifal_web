# Admin PRD

## Background

Nifal needs an Arabic real estate administration dashboard for managing platform operations from the same TanStack Start application that serves the public website. The canonical admin surface is the root app route `/admin`; the standalone `apps/admin/` approach is **fully decommissioned** and must not be used.

The admin is protected behind Supabase authentication and role-based database access.

## Dev Workflow

```bash
# Start the admin (canonical entry point)
npm run dev:website
# Open: http://localhost:8080/admin

# Build check
npm run build:website

# TypeScript check
npx tsc --noEmit

# Lint
npm run lint
```

The retired `apps/admin/` directory no longer exists. Do not recreate it.

## Goals

- Provide a stable Arabic admin dashboard for Nifal real estate operations.
- Keep `/admin` as the single canonical admin entry point.
- Support authenticated access to implemented operational modules.
- Keep unfinished modules visible only as clear coming-soon surfaces.
- Preserve a clean engineering baseline where lint, TypeScript, and production build checks pass.
- Implement all 231 user stories across 13 phases (see `docs/admin-phases.md`).

## Users And Roles

- **super_admin**: full access to all modules, user management, settings, audit log.
- **property_manager**: properties, rentals, owners, maintenance.
- **sales_agent**: clients (own only), leads (own only).
- **sales_manager**: clients (all), leads (all), reports.
- **accountant**: collections, reports.
- **marketing**: properties (read + feature).

Admin authorization should be enforced through Supabase RLS and server functions, not by client-only UI checks.

## Functional Scope

### Implemented (Phase 0 baseline)

- **Dashboard**: overview KPIs, recent activity, quick actions, and recent properties.
- **Properties**: create, edit, publish, feature, archive, delete, and list properties. REGA code support.
- **Clients**: manage client records, stage, contact details, budget, source, rating, and follow-up notes.
- **Leads**: manage inquiries, status, property association, and conversion to clients.
- **Owners**: manage property owner records with WhatsApp integration.
- **Rentals**: manage units, tenants, and rental contracts (3-tab UI).

### Planned (see phased plan)

- Phase 1: Property image upload, reorder, compression
- Phase 2: Bulk operations and pagination on properties
- Phase 3: Clients Kanban view and activity timeline
- Phase 4: Leads real-time notifications and WhatsApp templates
- Phase 5: Rental contract PDF upload and polish
- Phase 6: Collections / Invoices module (full)
- Phase 7: Maintenance module (full)
- Phase 8: Owners portfolio view enhancements
- Phase 9: Reports module with charts
- Phase 10: Users & Settings modules
- Phase 11: Auth RBAC enforcement
- Phase 12: Global search, mobile UX, offline, polish

### Deferred (قريباً)

These modules are intentionally deferred and must remain clearly marked:

- **Collections** — Phase 6
- **Maintenance** — Phase 7
- **Reports** — Phase 9
- **Users** — Phase 10
- **Settings** — Phase 10

## Data And Permissions

- Supabase is the source of truth for admin data.
- Admin server functions live in `src/lib/*.functions.ts` and use `requireSupabaseAuth`.
- Admin data access uses authenticated Supabase clients scoped by the signed-in user.
- RLS policies use `auth.uid()` predicates — not broad `USING (true)` policies.
- Supabase direct connection (`db.qftcyljfniomjhfmhgjn.supabase.co:5432`) for DDL; pooler (`DATABASE_URL`) for DML.

## Technical Architecture

- Admin routes: `src/routes/_authenticated/admin*.tsx`
- Auth shell: `src/routes/_authenticated/route.tsx`
- Shared admin UI components: `src/components/dashboard/`
- Shared UI primitives: `src/components/ui/`
- Supabase client: `src/integrations/supabase/`
- `src/routeTree.gen.ts` is auto-generated — never edit manually.
- Error boundaries wrap `<Outlet />` in the auth shell for per-route crash isolation.
- Session events (`SIGNED_OUT`, `TOKEN_REFRESHED`) are handled in the auth shell layout.

## Acceptance Criteria

- `/admin` is the canonical admin route.
- Unauthenticated access to `/admin` redirects to `/login`.
- Authenticated users can access implemented admin modules.
- Dashboard, Properties, Clients, Leads, Owners, and Rentals render without blank states.
- Collections, Maintenance, Reports, Users, and Settings render clear `قريباً` states.
- The sidebar visually distinguishes deferred modules with `قريباً` badge.
- `npm run lint` passes (warnings in shadcn/ui files are acceptable).
- `npx tsc --noEmit` passes with zero errors.
- `npm run build:website` passes.

## Resolved Questions

- Users and Settings will be super_admin-only modules.
- Reports will use live operational data (no separate accounting exports in Phase 9).
- Collections is a separate accounting-focused module, not part of Rentals.
- Audit trail is required for: property upsert/delete, client upsert, lead conversion, contract upsert, payment recording (Phase 10).
