# HUMAN_TASKS

This file tracks tasks that require human credentials or approvals.

## Open Tasks

- [ ] End-to-end smoke test from web UI token creation + CLI upload against production.
  - Verify generated markdown renders image publicly in a GitHub comment/PR.

## Completed Tasks

- [x] Core app scaffolded locally with Convex + Clerk + Next.js integration points.
- [x] CLI upload flow implemented and wired to `/api/cli/upload`.
- [x] Configure Convex project linkage for this repository.
- [x] Disabled Vercel deployment protection via API (`ssoProtection=null`) so public image URLs are reachable.
- [x] Production stack deployed:
  - Convex prod: `https://fast-impala-736.convex.cloud`
  - Vercel prod alias: `https://gh-agent-images-hoster.vercel.app`
- [x] Production environment variables configured in Vercel:
  - `NEXT_PUBLIC_CONVEX_URL`
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `CLERK_JWT_ISSUER_DOMAIN`
- [x] Convex production auth issuer configured:
  - `CLERK_JWT_ISSUER_DOMAIN=https://clerk.agent-images.24letters.com`
- [x] Rotated production Clerk credentials to dedicated issuer `https://clerk.agent-images.24letters.com` and redeployed Convex + Vercel.
