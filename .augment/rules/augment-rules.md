---
type: 'always_apply'
---

# Augment Rules — TurboShop Monorepo

## Context

Nx monorepo with 7 apps: `marketplace`, `frontend-sales`, `frontend-suppliers`, `shipment-manager` (Next.js 14), `backend`, `shipment-backend` (NestJS), and `shipment-app` (Expo). Shared libs under `libs/`. All code is in TypeScript.

## Augment Behavior

- Always behave as a **senior engineer**
- **Never modify code immediately** — follow this strict protocol:

### 1. Change Proposal (Required First Step)

- Analyze the user request
- Gather all code context
- Review past Augment memory and `.augment/notes/` for patterns and decisions
- Generate a **Changes Report** including:
- Current state
- Objectives
- File-by-file plan with descriptions
- Wait for explicit user approval

### 2. Code Implementation (Only After Approval)

- Implement the plan exactly as approved
- Keep a detailed record of changes
- Save notes under `.augment/notes/<branch_name>/` to persist context
- Output a **Change Summary** with:
- List of modified files
- Suggested review order
  Repeat the process for any follow-up request.

---

## Technical Rules

### Dependencies

- Always install from the workspace root using: pnpm add -w <package>
- Never install dependencies inside individual apps.

### Next.js (Server-First Architecture)

- All route entry points (`page.tsx`) must be **server components**
- Use 'server-only' directive and fetch all initial data in parallel with Promise.all
- Use cookies/headers for user context
- Use 'use client' only when strictly necessary:
- Client-side state
- Browser APIs
- Interactive UI
- Use `useFetchData` only for:
- Filters, pagination, and user-triggered fetches
- Context-degraded data (e.g., when cookies not available)
- Never fetch DB data directly in client components

#### Data Fetching Principles

- Always follow the **server-first** principle: maximize server-side code in all pages and components, especially for data fetching.
- For all Next.js pages, prefer fetching data on the server side (in `page.tsx`) and pass data to client components via props.
- If user actions require data updates, use a hybrid approach: load data initially from the server, then invalidate and update client-side data as needed based on user actions.
- Use `domain/gateway/` for fetch functions, and the fetcher fetch wrapper for data fetching.
- Use `domain/server-actions/` to expose server-side logic.
- Only call `useFetchData` on the client, and never for static or initial data.

### Backend (NestJS)

- Follow clean layering:
- **Controller**: routing, JWT auth, DTO validation
- **Service**: business logic and orchestrations. Can only access its own repository. Must call other services to access other modules data.
- **Repository**: TypeORM-based DB access. Can only access own module data directly, can access other modules data through joins.
- Controllers must use guards like JwtAuthGuard, RolesGuard

### Type Checking

- Use `typecheck` target to detect TS issues early: nx run <app>:typecheck
- To check all apps at once: nx run-many --target=typecheck --all
- Do **not** use builds to surface type errors — always typecheck directly

### Notes & Memory

- Always review Augment memory and `.augment/notes/` before suggesting changes
- Store implementation context and notes in `.augment/notes/<branch_name>/`
- Keep track of rationale, edge cases, and decision history

### Internationalization

- All user-facing text must be in **Spanish**

---

## Summary

| Rule                 | Enforced                               |
| -------------------- | -------------------------------------- |
| Workspace installs   | pnpm add -w only                       |
| Routing              | All page.tsx = server                  |
| Data fetching        | Server first, client via useFetchData  |
| DB access            | Via gateway or server-actions          |
| NestJS layering      | Controller → Service → Repo            |
| i18n                 | User-visible text = Spanish            |
| Type validation      | Use nx run <app>:typecheck             |
| Global validation    | nx run-many --target=typecheck --all   |
| No build for errors  | Never use build to find TS errors      |
| Memory review        | Always check Augment memory            |
| Implementation notes | Save to .augment/notes/<branch_name>   |
| Server-first         | Maximize server-side code in Next.js   |
| Hybrid data update   | Use hybrid approach for client updates |
