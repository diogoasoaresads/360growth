# AgencyHub — Growth360

Multi-tenant SaaS platform for digital agencies. Built with Next.js 14, Drizzle ORM, PostgreSQL, Redis, and Stripe.

> Full developer guide: see [CLAUDE.md](./CLAUDE.md)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Git Workflow Strategy

### Branch Structure

| Branch | Purpose | Deploy |
|--------|---------|--------|
| `main` | Production — always stable and deployable | EasyPanel (auto) |
| `dev` | Staging / QA — integration testing before production | Manual or staging env |
| `feature/*` | New features and non-urgent improvements | — |
| `hotfix/*` | Urgent production fixes, branched from `main` | Merged directly to `main` + `dev` |

### Flow Diagram

```
main ◄────────────────── hotfix/fix-name
  │                            │
  │ (create dev from main)     │
  ▼                            │
 dev ◄──── feature/feature-name
```

### Rules

1. **Never push directly to `main`** — all changes go through Pull Requests
2. **`main` is protected** — require at least 1 PR review before merging
3. **`dev` is the integration branch** — merge `feature/*` here first, validate, then open PR to `main`
4. **`hotfix/*`** branches off `main`, merges back into both `main` AND `dev`
5. Branch names must be lowercase kebab-case: `feature/client-portal`, `hotfix/stripe-webhook`

### Day-to-Day Workflow

```bash
# Start a new feature
git checkout dev
git pull origin dev
git checkout -b feature/my-feature

# Work, commit, push
git push -u origin feature/my-feature
# → Open PR: feature/my-feature → dev

# After QA on dev, open PR: dev → main
# → EasyPanel auto-deploys on merge to main

# Urgent fix in production
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug
# Fix, commit
git push -u origin hotfix/critical-bug
# → Open PR to main AND cherry-pick / merge into dev
```

### Branch Protection (GitHub Settings)

Configure the following rules on `main` at:
`GitHub → Settings → Branches → Add branch protection rule`

- **Branch name pattern:** `main`
- [x] Require a pull request before merging
  - [x] Require approvals: **1**
  - [x] Dismiss stale pull request approvals when new commits are pushed
- [x] Require status checks to pass before merging
  - Required checks: `lint`, `type-check` (from CI workflow)
- [x] Require branches to be up to date before merging
- [x] Do not allow bypassing the above settings

Apply same rule to `dev` with 0 required approvals (self-merge allowed for staging).

### EasyPanel Deployment

EasyPanel should be configured to watch the **`main`** branch.

To verify / change:
1. EasyPanel Dashboard → Project → Service
2. Source → Branch: confirm it is `main`
3. Save and redeploy if needed

### Commit Message Convention

```
feat(scope): short description       ← new feature
fix(scope): short description        ← bug fix
chore(scope): short description      ← tooling / deps
docs(scope): short description       ← documentation only
refactor(scope): short description   ← no behaviour change
```
