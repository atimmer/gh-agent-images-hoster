# HUMAN_TASKS

This file tracks tasks that require human credentials or approvals.

## Open Tasks

- [ ] Disable Vercel deployment protection for this project so image URLs are publicly reachable by GitHub.
  - Current symptom: `curl https://gh-agent-images-hoster.vercel.app` returns HTTP `401 Authentication Required`.
  - This blocks the requirement that PR images render publicly without authentication.

- [x] Configure Convex project linkage for this repository.
  - Run: `pnpm exec convex dev` and complete interactive setup once.
  - This writes deployment configuration so Convex codegen and backend sync can run.

- [ ] Decide whether to keep using the existing Clerk instance (`awake-wolf-1`) or replace with a dedicated Clerk app for this project.
  - If replacing: provide new keys and issuer, then I will rotate Convex + Vercel env vars and redeploy.

## Completed Tasks

- [x] Core app scaffolded locally with Convex + Clerk + Next.js integration points.
- [x] CLI upload flow implemented and wired to `/api/cli/upload`.
- [x] Production stack deployed:
  - Convex prod: `https://fast-impala-736.convex.cloud`
  - Vercel prod alias: `https://gh-agent-images-hoster.vercel.app`
- [x] Production environment variables configured in Vercel:
  - `NEXT_PUBLIC_CONVEX_URL`
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `CLERK_JWT_ISSUER_DOMAIN`
- [x] Convex production auth issuer configured:
  - `CLERK_JWT_ISSUER_DOMAIN=https://awake-wolf-1.clerk.accounts.dev`
