# Build GH Agent Image Hoster (Vercel + Convex + Clerk)

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This plan follows `PLANS.md` at the repository root and must be maintained in accordance with its requirements.

## Purpose / Big Picture

This project lets authenticated users upload images through a CLI or a web app and use those images in GitHub pull requests with Markdown links. Uploaded images are immutable and served from public, non-guessable URLs so they can render in GitHub without authentication. The URLs use one-year cache headers (`immutable`) to support long-lived caching. The web UI also exposes user settings for CLI authentication and gives a copyable command that configures the CLI.

## Progress

- [x] (2026-02-18 10:52Z) Confirmed requirements with user: public rendering, non-guessable URLs, immutable uploads, one-year caching.
- [x] (2026-02-18 10:52Z) Reviewed repository baseline and `PLANS.md` format.
- [ ] Create backend schema and Convex functions for image records and CLI tokens.
- [ ] Add public image serving route with 1-year immutable cache headers.
- [ ] Build Next.js API endpoint for CLI upload workflow.
- [ ] Build local CLI tool with `auth login` and `upload` commands.
- [ ] Build authenticated web dashboard and settings flow with copyable CLI setup command.
- [ ] Update project docs (`README.md`, `AGENTS.md`, `HUMAN_TASKS.md`) and verify with lint/build.

## Surprises & Discoveries

- Observation: The repository has no `.git` directory, so atomic commits cannot be made in this workspace yet.
  Evidence: `git status --short --branch` returned `fatal: not a git repository`.

## Decision Log

- Decision: Evolve the existing Convex + Next.js + Clerk starter instead of scaffolding from scratch.
  Rationale: The starter already provides required platform integration and generated Convex types, reducing risk and implementation time.
  Date/Author: 2026-02-18 / Codex

- Decision: Serve public image URLs through a stable Next.js route (`/i/[imageId]`) backed by Convex metadata and storage.
  Rationale: This keeps image URLs on the app domain, supports non-guessable IDs, and enables explicit one-year immutable cache headers.
  Date/Author: 2026-02-18 / Codex

## Outcomes & Retrospective

Pending. This section will be updated at milestone completion.

## Context and Orientation

The repository currently contains a generated starter app in `app`, `components`, and `convex`. Authentication UI is present but backend auth provider setup in `convex/auth.config.ts` is commented out. Existing Convex functions in `convex/myFunctions.ts` and schema in `convex/schema.ts` are demo code.

The final implementation will center on these areas:

- `convex/schema.ts`: data model for image metadata and CLI tokens.
- `convex/*.ts`: queries, mutations, and actions for image listing, token creation, upload finalization, and public image lookup.
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

- A web-authenticated Convex action generates CLI tokens and returns plaintext once.
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

2. Regenerate Convex types after schema/function changes:

   pnpm convex dev --once

3. Run local development servers:

   pnpm dev

4. Validate lint and production build:

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

## Interfaces and Dependencies

Key dependencies used:

- `convex`: database, queries/mutations/actions, and file storage.
- `@clerk/nextjs`: user authentication in the web app.
- Next.js App Router route handlers for CLI API and public image responses.

Required interfaces at completion:

- Convex mutation for issuing upload parameters by CLI token.
- Convex mutation for finalizing immutable image metadata.
- Convex query for user dashboard image listing.
- Convex action for creating/revoking/listing CLI tokens.
- Next route handler `app/api/cli/upload/route.ts` accepting `multipart/form-data` with `file` + `agentName`.
- Next route handler `app/i/[imageId]/route.ts` returning image bytes and one-year cache headers.
- CLI binary `gh-agent-images` supporting:
  - `auth login --api <url> --token <token>`
  - `upload <path> --agent <name> [--alt <text>]`

Plan update note (2026-02-18): Initial ExecPlan created from discovered starter app and clarified product constraints (public immutable URLs, one-year cache).
