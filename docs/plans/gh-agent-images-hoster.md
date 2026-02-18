# Build GH Agent Image Hoster (Vercel + Convex + Clerk)

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This plan follows `PLANS.md` at the repository root and must be maintained in accordance with its requirements.

## Purpose / Big Picture

This project lets authenticated users upload images through a CLI or a web app and use those images in GitHub pull requests with Markdown links. Uploaded images are immutable and served from public, non-guessable URLs so they can render in GitHub without authentication. The URLs use one-year cache headers (`immutable`) to support long-lived caching. The web UI also exposes user settings for CLI authentication and gives a copyable command that configures the CLI.

## Progress

- [x] (2026-02-18 10:52Z) Confirmed requirements with user: public rendering, non-guessable URLs, immutable uploads, one-year caching.
- [x] (2026-02-18 10:52Z) Reviewed repository baseline and `PLANS.md` format.
- [x] (2026-02-18 10:56Z) Replaced demo Convex schema and functions with `images`, `cliTokens`, and `uploadIntents` model plus token/image queries + mutations.
- [x] (2026-02-18 10:58Z) Added public image route `app/i/[imageId]/route.ts` with immutable one-year cache headers.
- [x] (2026-02-18 10:59Z) Added CLI upload API route `app/api/cli/upload/route.ts` with bearer-token validation and Convex storage upload/finalize flow.
- [x] (2026-02-18 11:00Z) Added local CLI `bin/gh-agent-images.mjs` with `auth login` and `upload`.
- [x] (2026-02-18 11:00Z) Rebuilt home page into authenticated dashboard + settings for token management and copyable setup command.
- [x] (2026-02-18 11:00Z) Added `AGENTS.md`, `HUMAN_TASKS.md`, skill file, and updated `README.md`.
- [x] (2026-02-18 11:07Z) Ran `pnpm lint` and `pnpm build` successfully after implementation updates.
- [x] (2026-02-18 11:21Z) Deployed Convex production backend to `https://fast-impala-736.convex.cloud`.
- [x] (2026-02-18 11:22Z) Deployed Vercel production app and configured production env vars.
- [ ] Resolve Vercel deployment protection so public image URLs are reachable without authentication.

## Surprises & Discoveries

- Observation: The repository initially had no `.git` directory.
  Evidence: `git status --short --branch` returned `fatal: not a git repository`.

- Observation: Convex code generation is blocked until a deployment is linked interactively.
  Evidence: `pnpm exec convex codegen` failed with `No CONVEX_DEPLOYMENT set`, and `pnpm exec convex dev --once` failed because interactive prompts are unavailable in this terminal mode.

- Observation: Vercel production deployment is ready but currently protected by Vercel Authentication.
  Evidence: `curl -I https://gh-agent-images-hoster.vercel.app` returns HTTP `401 Authentication Required`.

## Decision Log

- Decision: Evolve the existing Convex + Next.js + Clerk starter instead of scaffolding from scratch.
  Rationale: The starter already provides required platform integration and generated Convex types, reducing risk and implementation time.
  Date/Author: 2026-02-18 / Codex

- Decision: Serve public image URLs through a stable Next.js route (`/i/[imageId]`) backed by Convex metadata and storage.
  Rationale: This keeps image URLs on the app domain, supports non-guessable IDs, and enables explicit one-year immutable cache headers.
  Date/Author: 2026-02-18 / Codex

- Decision: Use hashed user-generated CLI tokens with upload intents instead of direct unauthenticated upload URLs.
  Rationale: This ties each upload to a user and an agent name, enables revocation, and avoids exposing direct persistent storage write credentials.
  Date/Author: 2026-02-18 / Codex

- Decision: Patch `convex/_generated/api.d.ts` temporarily to unblock local TypeScript references before Convex codegen can run.
  Rationale: Convex CLI cannot generate types without deployment linkage; this keeps development moving while human setup is pending.
  Date/Author: 2026-02-18 / Codex

- Decision: Reuse existing Clerk credentials already present locally to finish automated production wiring.
  Rationale: This enabled immediate deployment without waiting for manual key provisioning, while preserving the option to rotate to a dedicated Clerk app later.
  Date/Author: 2026-02-18 / Codex

## Outcomes & Retrospective

Implemented core functionality end-to-end and deployed both Convex and Vercel production targets. The remaining gap is removing Vercel deployment protection so image URLs are publicly accessible for GitHub rendering, which is tracked in `HUMAN_TASKS.md`.

## Context and Orientation

The repository now contains a working implementation centered on immutable PR image hosting. The old demo files have been removed and replaced by production-oriented Convex functions and a CLI route.

The final implementation will center on these areas:

- `convex/schema.ts`: data model for image metadata and CLI tokens.
- `convex/*.ts`: queries and mutations for image listing, token creation/revocation, upload finalization, and public image lookup.
- `app/i/[imageId]/route.ts`: public image serving route with immutable caching.
- `app/api/cli/upload/route.ts`: CLI-facing upload endpoint.
- `app/page.tsx` and supporting components: authenticated dashboard/settings UX.
- `bin/gh-agent-images.mjs`: local CLI for auth setup and uploads.

"Non-guessable URL" means the route segment is a randomly generated UUID per upload. "Immutable upload" means existing images are never modified in-place; every new version is a new upload and new UUID.

## Plan of Work

First, replace demo Convex schema/functions with production-focused tables and APIs:

- `images` table stores immutable image records (`imageId`, `storageId`, `contentType`, `byteSize`, original filename, agent name, uploader user id).
- `cliTokens` table stores hashed personal access tokens tied to users.

Then add upload flow:

- Web UI creates CLI tokens by generating token secrets in-browser and storing only hashed values in Convex.
- A Next API route receives multipart file uploads from the CLI, validates bearer token via Convex mutation, uploads binary bytes to Convex storage using generated upload URLs, and finalizes metadata in `images`.

Then add delivery layer:

- Public route `/i/[imageId]` resolves image metadata, fetches bytes from Convex storage, and returns with `Cache-Control: public, max-age=31536000, immutable`.

Then add product interfaces:

- Dashboard page lists uploaded images and copyable Markdown snippets.
- Settings section creates/revokes CLI tokens and shows a copyable setup command.
- CLI supports `auth login` and `upload`; `upload` prints Markdown embed syntax.

Finally, add operational docs and instructions:

- `AGENTS.md` repository instructions requested by user.
- `HUMAN_TASKS.md` for required human-operated tasks.
- Updated `README.md` with setup/deploy instructions for Clerk/Convex/Vercel and CLI usage.

## Concrete Steps

Run from repository root (`/Users/anton/Code/gh-agent-images-hoster`):

1. Install dependencies after package updates:

   pnpm install

2. Link Convex project interactively (human step, once per clone):

   pnpm exec convex dev

3. Regenerate Convex types after linking:

   pnpm exec convex codegen

4. Run local development servers:

   pnpm dev

5. Validate lint and production build:

   pnpm lint
   pnpm build

Expected results:

- Dev server starts with Next and Convex.
- Lint passes with no errors.
- Build succeeds and includes API routes + public image route.

## Validation and Acceptance

Acceptance criteria are behavioral:

- Authenticated user opens dashboard, creates CLI token, copies setup command, and sees token metadata in settings.
- Running CLI `upload` with a valid token uploads file from disk and prints `![...](https://.../i/<uuid>)` markdown.
- Opening the printed image URL in a browser returns image bytes without authentication and includes one-year immutable cache headers.
- Dashboard list shows uploaded image with uploader + agent name metadata and markdown snippet.
- Uploading the same source file again creates a new image UUID (no replacement).

## Idempotence and Recovery

All code changes are additive and safe to re-run:

- Token creation is additive; revocation marks token inactive without deleting image records.
- Image uploads always create new records and do not mutate existing records.
- If upload fails after upload URL issuance but before finalize, rerunning CLI upload creates a new image safely.

If environment variables are missing, the app should fail with explicit setup guidance and the required human tasks will be tracked in `HUMAN_TASKS.md`.

## Artifacts and Notes

- Initial discovery artifact:

  git status --short --branch
  fatal: not a git repository (or any of the parent directories): .git

- Convex linkage/codegen artifact:

  pnpm exec convex codegen
  ✖ No CONVEX_DEPLOYMENT set, run `npx convex dev` to configure a Convex project

  pnpm exec convex dev --once
  ✖ Cannot prompt for input in non-interactive terminals. (What would you like to configure?)

- Deployment artifact:

  pnpm exec convex deploy -y
  ✔ Deployed Convex functions to https://fast-impala-736.convex.cloud

  vercel --prod --yes
  Production: https://gh-agent-images-hoster-c9d43snld-atimmers-projects.vercel.app

  curl -I https://gh-agent-images-hoster.vercel.app
  HTTP/2 401

## Interfaces and Dependencies

Key dependencies used:

- `convex`: database, queries/mutations, and file storage.
- `@clerk/nextjs`: user authentication in the web app.
- Next.js App Router route handlers for CLI API and public image responses.

Required interfaces at completion:

- Convex mutation for issuing upload parameters by CLI token.
- Convex mutation for finalizing immutable image metadata.
- Convex query for user dashboard image listing.
- Convex queries/mutations for creating/revoking/listing CLI tokens.
- Next route handler `app/api/cli/upload/route.ts` accepting `multipart/form-data` with `file` + `agentName`.
- Next route handler `app/i/[imageId]/route.ts` returning image bytes and one-year cache headers.
- CLI binary `gh-agent-images` supporting:
  - `auth login --api <url> --token <token>`
  - `upload <path> --agent <name> [--alt <text>]`

Plan update note (2026-02-18): Added production deployment results and updated the remaining blocker to Vercel deployment protection for public image reachability.
