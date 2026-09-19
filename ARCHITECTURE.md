# Socialcraft ONYX Studio — Architecture & Technical Standards

This document describes the architectural layers, patterns, and development conventions governing the **Socialcraft ONYX Studio** codebase.

---

## 1. System Overview

Socialcraft ONYX Studio is a high-performance, local-first social media content creation suite and carousel engine built on **TanStack Start**, **React 19**, **Tailwind CSS v4**, and **TypeScript 5.8**.

The platform operates on a **Local-First with Cloud-Sync** paradigm:
- User assets, briefs, drafts, and queue states are stored immediately in browser storage for instant responsiveness.
- Background services synchronize state with **Mega S4 Object Storage** (S3-compatible bucket) and the **Socialcraft MCP Store** (Model Context Protocol).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Presentation Layer (React 19)                    │
│   Landing View  │  Studio Workspace  │  Admin Control  │  Modals / HUD  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
┌────────────────────────────────────▼───────────────────────────────────┐
│                        Domain Hooks Layer                              │
│   useStudioNavigation   │   useStudioModals   │   useMcpSync          │
└───────────┬────────────────────────┬────────────────────────┬──────────┘
            │                        │                        │
┌───────────▼───────────┐ ┌──────────▼───────────┐ ┌──────────▼──────────┐
│  State & Persistence  │ │   Configuration      │ │  MCP Live-Sync      │
│  src/onyx/storage.ts  │ │   src/lib/config.ts  │ │  src/mcp/store.ts   │
│  (LocalStorage)       │ │  (.env validation)   │ │  (/api/mcp/sync)    │
└───────────┬───────────┘ └──────────┬───────────┘ └──────────┬──────────┘
            │                        │                        │
┌───────────▼────────────────────────▼────────────────────────▼──────────┐
│                     Server Middleware & API Proxy                      │
│                  src/server/cloud-api-router.ts                        │
│    Mega S4 S3 Proxy   │   Post For Me Proxy   │   KIE.AI Proxy         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure

```
src/
├── lib/
│   ├── config.ts              # Centralized, strongly-typed environment configuration
│   └── utils.ts               # UI & styling utility helpers (clsx, tailwind-merge)
├── onyx/
│   ├── hooks/                 # Cohesive domain hooks
│   │   ├── useStudioNavigation.ts  # View routing, tab matching, URL popstate
│   │   ├── useStudioModals.ts      # Consolidated state dictionary for all 12 modals
│   │   └── useMcpSync.ts           # Bidirectional sync loop with the MCP store
│   ├── components/            # Workspace views & UI modules
│   │   ├── views/             # Workspace views (StudioCarouselWorkspace, PostSchedulerView, AiCloneView, etc.)
│   │   ├── modals/            # Studio modals (ThirtyDayBatchModal, BrandKitModal, SettingsModal, etc.)
│   │   ├── layout/            # Layout shells (CryptoxNavbar, Sidebar, ViewBoundary)
│   │   └── widgets/           # Sub-components (SlideCard, EngineSelector, scheduler-utils)
│   ├── postforme/             # Post For Me API integration
│   │   ├── client.ts          # Typed Post For Me HTTP client (with proxy fallback)
│   │   └── types.ts           # Post For Me data transfer objects & interfaces
│   ├── s4-storage.ts          # Client-side S4 cloud storage SDK
│   ├── defaults.ts            # Default presets, brand kits, and theme configurations
│   ├── scheduling.ts          # Unified slot collision calculation (computeNextSlots)
│   ├── storage.ts             # Local-first typed persistent state hooks
│   └── types.ts               # Core domain types (Slide, Carousel, BrandKit, StoryBrief, Job, etc.)
├── server/
│   ├── story/
│   │   └── story-service.ts   # AI Storyboard & dynamic carousel narrative generator
│   ├── jobs/
│   │   ├── orchestrator.ts    # Background job queue, deduplication & pipeline chaining
│   │   ├── render-worker.ts   # Node-side KIE.AI Nano-Banana 2 slide renderer
│   │   └── publish-worker.ts  # Automated Post for Me scheduling worker
│   ├── cloud-api-router.ts    # Unified Nitro/Vite server API router
│   ├── cloud-storage.ts       # Server-side AWS S3 SDK wrapper for Mega S4
│   ├── cloud-identity.ts      # Multi-tenant user isolation and path scoping
│   └── vite-cloud-plugin.ts   # Vite dev middleware hook for local development
├── routes/
│   ├── index.tsx              # Declarative root orchestrator
│   └── ...                    # Route declarations (/admin, /terms, etc.)
└── mcp/                       # Model Context Protocol server & store
    ├── store.ts               # MCP filesystem persistence & Job Queue storage
    ├── tools.ts               # 15 MCP tools (including generate_storyboard, produce_and_schedule, get_job_status)
    └── http-server.ts         # MCP SSE and Streamable HTTP bridge
```

---

## 3. Core Architectural Patterns

### 3.1 Centralized Runtime Configuration (`src/lib/config.ts`)
- Access to runtime variables is centralized in `src/lib/config.ts`.
- Automatically differentiates between **client-side Vite** (`import.meta.env['VITE_*']`) and **server-side Node/Nitro** (`process.env['*']`).
- No raw environment lookups should be scattered across components.

### 3.2 God-Component Decomposition
- Route layout components (e.g., `src/routes/index.tsx`) must remain **declarative layout orchestrators**.
- Navigation logic is encapsulated in `useStudioNavigation`.
- Modal state management is encapsulated in `useStudioModals`.
- Periodic background polling and synchronization are encapsulated in `useMcpSync`.

### 3.3 Strict TypeScript & Zero-Any Policy
- The codebase enforces `noPropertyAccessFromIndexSignature` and strict null checks.
- Avoid loose `any` casts. Explicitly define typed interfaces or use `unknown` with runtime type narrowing.
- All `catch` blocks must use `catch (err: unknown)` with the `getErrorMessage(err)` utility from `src/lib/config.ts`.

### 3.4 Local-First with Optimistic Updates
- User changes are applied to local state immediately via `usePersistentState`.
- S4 image archiving and MCP synchronization execute in the background with non-blocking error handling and toast notifications.

---

## 4. Security & Secrets Isolation

1. **Zero Hardcoded Secrets**: No secret keys, credentials, or authentication tokens may be hardcoded into the source code.
2. **Server-Side API Proxying**:
   - Third-party endpoints with sensitive credentials (Post For Me API, KIE.AI Nano-Banana, Mega S4 Access Keys) are routed through `src/server/cloud-api-router.ts`.
   - The browser never directly exposes upstream secret credentials.
3. **Environment Template**: All required environment variables are documented in `.env.example`. The `.env` file is strictly ignored by Git.

---

## 5. Development & Verification Workflow

Before committing or pushing changes:
```bash
# 1. Typecheck
npx tsc --noEmit

# 2. Automated Test Suite
npm run test

# 3. Linter Check
npx eslint . --quiet

# 4. Production Build Verification
npm run build
```

> **Lovable Git History Notice**: Never force push (`git push -f`) or rebase published history on the `main` branch.
