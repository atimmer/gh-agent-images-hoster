# HUMAN_TASKS

This file tracks tasks that require human credentials or approvals.

## Open Tasks

- [ ] Create/confirm a Clerk application and enable the `convex` JWT template.
  - Needed values:
    - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
    - `CLERK_SECRET_KEY`
    - `CLERK_JWT_ISSUER_DOMAIN`

- [x] Configure Convex project linkage for this repository.
  - Run: `pnpm exec convex dev` and complete interactive setup once.
  - This writes deployment configuration so Convex codegen and backend sync can run.

- [ ] Add environment variables in local `.env.local` and in Vercel project settings.
  - Required:
    - `NEXT_PUBLIC_CONVEX_URL`
    - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
    - `CLERK_SECRET_KEY`
    - `CLERK_JWT_ISSUER_DOMAIN`

- [ ] Deploy production stack.
  - Clerk: create production instance / keys.
  - Convex: deploy backend (`pnpm exec convex deploy`).
  - Vercel: deploy frontend/API (`vercel --prod`) with env vars above.

## Completed Tasks

- [x] Core app scaffolded locally with Convex + Clerk + Next.js integration points.
- [x] CLI upload flow implemented and wired to `/api/cli/upload`.
