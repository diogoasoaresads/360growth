# AgencyHub - Developer Guide

## Project Overview

AgencyHub is a **multi-tenant SaaS platform** for digital agencies. It provides CRM, client portal, and ticketing system capabilities with a 3-level hierarchical user system.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | NextAuth v5 (Credentials provider) |
| ORM | Drizzle ORM |
| Database | PostgreSQL |
| Cache | Redis (ioredis) |
| Payments | Stripe |
| Email | Resend |
| Validation | Zod |

## Architecture

### Multi-tenancy Model

Each **Agency** is a tenant. All data is scoped to an `agencyId` foreign key. The middleware and server-side auth checks enforce tenant isolation.

```
SUPER_ADMIN (platform owner)
    └── Agency 1
        ├── AGENCY_ADMIN (can manage agency settings, members, clients)
        ├── AGENCY_MEMBER (can manage clients and tickets)
        └── CLIENT (portal access only - their own tickets)
    └── Agency 2
        └── ...
```

### Route Structure

```
/login              → Public auth page
/register           → Public registration (creates agency)
/super-admin/*      → Platform admin (SUPER_ADMIN only)
/agency/*           → Agency management (AGENCY_ADMIN | AGENCY_MEMBER)
/portal/*           → Client portal (CLIENT only)
/api/auth/*         → NextAuth handlers
/api/webhooks/*     → Stripe webhooks
```

### Key Directories

```
src/
├── app/
│   ├── (auth)/             # Auth pages (no layout)
│   ├── (super-admin)/      # Super admin area
│   ├── (agency)/           # Agency management area
│   ├── (portal)/           # Client portal area
│   └── api/                # API routes
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── shared/             # Shared layout components (sidebars)
└── lib/
    ├── db/
    │   ├── index.ts        # Drizzle DB instance
    │   └── schema.ts       # All table definitions
    ├── actions/            # Server Actions (mutations)
    ├── validations/        # Zod schemas
    ├── auth.ts             # NextAuth config
    ├── redis.ts            # Redis client + helpers
    ├── stripe.ts           # Stripe client + helpers
    └── resend.ts           # Email helpers
```

## Running Locally

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### Setup

```bash
# 1. Clone and install
npm install

# 2. Copy and fill environment variables
cp .env.example .env.local

# 3. Run database migrations
npx drizzle-kit push

# 4. (Optional) Seed the database
# npx tsx src/lib/db/seed.ts

# 5. Start development server
npm run dev
```

### Database Commands

```bash
# Generate migration files from schema changes
npx drizzle-kit generate

# Apply migrations to database
npx drizzle-kit push

# Open Drizzle Studio (DB GUI)
npx drizzle-kit studio

# Reset database (development only)
npx drizzle-kit drop && npx drizzle-kit push
```

### Stripe Local Testing

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login and forward webhooks
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Code Conventions

### TypeScript

- **Strict mode** is enabled — avoid `any` types
- Use `z.infer<typeof schema>` for form/action types
- Export type definitions from schema: `export type Client = typeof clients.$inferSelect`

### React / Next.js

- **Server Components by default** — only add `"use client"` when you need browser APIs, event handlers, or state
- **Server Actions** for all data mutations (in `src/lib/actions/*.actions.ts`)
- `revalidatePath()` after every mutation to invalidate cached pages
- Use `auth()` from `@/lib/auth` in Server Components for session access
- Use `useSession()` from `next-auth/react` in Client Components

### Data Fetching Pattern

```tsx
// ✅ Server Component (preferred)
export default async function Page() {
  const session = await auth()
  const data = await db.query.clients.findMany(...)
  return <ClientList data={data} />
}

// ✅ Server Action (mutations)
"use server"
export async function createClient(input: CreateClientInput) {
  const session = await auth()
  // validate, mutate, revalidate
}

// ❌ Avoid client-side fetch for initial data
"use client"
useEffect(() => { fetch('/api/clients') }, []) // Don't do this
```

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `user-nav.tsx` |
| Components | PascalCase | `UserNav` |
| Server Actions | camelCase + `actions.ts` | `client.actions.ts` |
| Validation schemas | camelCase + `Schema` | `createClientSchema` |
| DB tables | camelCase | `agencyUsers` |
| Environment vars | SCREAMING_SNAKE_CASE | `DATABASE_URL` |

### API Routes

Only create API routes for:
- External integrations (Stripe webhooks, third-party callbacks)
- NextAuth handlers
- Public-facing endpoints

Prefer **Server Actions** for internal mutations.

## Roles and Permissions

### Role Matrix

| Action | SUPER_ADMIN | AGENCY_ADMIN | AGENCY_MEMBER | CLIENT |
|--------|------------|--------------|---------------|--------|
| Manage agencies | ✅ | ❌ | ❌ | ❌ |
| Manage plans | ✅ | ❌ | ❌ | ❌ |
| Manage agency users | ❌ | ✅ | ❌ | ❌ |
| Manage clients | ❌ | ✅ | ✅ | ❌ |
| Manage deals/CRM | ❌ | ✅ | ✅ | ❌ |
| View/manage tickets | ❌ | ✅ | ✅ | own only |
| View own portal | ❌ | ❌ | ❌ | ✅ |

### Adding Role Checks

In Server Components:
```tsx
const session = await auth()
if (session?.user.role !== "AGENCY_ADMIN") redirect("/unauthorized")
```

In Server Actions:
```ts
const session = await auth()
if (!session || session.user.role !== "AGENCY_ADMIN") throw new Error("Unauthorized")
```

### Tenant Isolation

Always filter queries by `agencyId`:
```ts
const session = await auth()
const agencyId = session?.user.agencyId
// Always include agencyId in where clause:
await db.query.clients.findMany({ where: eq(clients.agencyId, agencyId) })
```

## Deployment

### Docker

```bash
# Build image locally
docker build -t agencyhub .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e NEXTAUTH_SECRET="..." \
  agencyhub
```

### GitHub Actions / EasyPanel

The workflow in `.github/workflows/deploy.yml` automatically:
1. Runs lint and type checking
2. Builds and pushes Docker image to `ghcr.io`
3. Triggers EasyPanel deployment via webhook

**Required GitHub Secrets:**
- `EASYPANEL_WEBHOOK_URL` — EasyPanel deploy webhook URL
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe public key (build-time)

**Required GitHub Variables:**
- `NEXT_PUBLIC_APP_URL` — Production app URL

## Adding New Features

### New Page (Agency Area)

1. Create `src/app/(agency)/agency/feature/page.tsx`
2. Export `metadata` for SEO
3. Add to `agency-sidebar.tsx` nav items
4. Add Server Action in `src/lib/actions/feature.actions.ts`
5. Add Zod schema in `src/lib/validations/feature.ts`

### New Database Table

1. Add table definition to `src/lib/db/schema.ts`
2. Export type: `export type Feature = typeof features.$inferSelect`
3. Run `npx drizzle-kit generate && npx drizzle-kit push`
4. Add relations to `drizzle.config.ts` if needed

### New API Route

Only for external integrations. Create:
`src/app/api/feature/route.ts`

Always validate the request body with Zod and authenticate with `auth()`.
