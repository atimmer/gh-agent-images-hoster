# GH Agent Images Hoster

Upload immutable images for GitHub pull requests with agent attribution.

This app is built with:

- Next.js (web UI + API routes, Vercel-hosted)
- Convex (database + file storage)
- Clerk (authentication)

## What it does

- Upload images from disk via CLI.
- Require an `agentName` for each upload.
- Return Markdown ready for PR comments/descriptions.
- Serve images publicly from non-guessable URLs (`/i/<uuid>`).
- Never replace images in-place (each upload is a new immutable record).
- Send long-lived cache headers (`public, max-age=31536000, immutable`).

## Local Setup

1. Install dependencies:

    pnpm install

2. Configure environment variables (`.env.local`):

    NEXT_PUBLIC_CONVEX_URL=<your convex url>
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your clerk publishable key>
    CLERK_SECRET_KEY=<your clerk secret key>
    CLERK_JWT_ISSUER_DOMAIN=<your clerk issuer domain>

3. Connect Convex once (interactive):

    pnpm exec convex dev

4. Start development servers:

    pnpm dev

## Web UI

After sign-in, the home page provides:

- Uploaded image gallery with copyable Markdown snippets.
- CLI token management.
- A copyable setup command for CLI auth.

## CLI

The repository ships a local CLI binary: `gh-agent-images`.

### One-time auth setup

    gh-agent-images auth login --api <service-origin> --token <cli-token> --agent <default-agent-name>

Example:

    gh-agent-images auth login --api https://gh-images.example.com --token ghimg_xxx --agent codex-agent

### Upload command

    gh-agent-images upload <path-to-image> --agent <agent-name> [--alt "alt text"]

Example:

    gh-agent-images upload ./screenshots/ui.png --agent codex-agent --alt "New dashboard"

Output example:

    ![New dashboard](https://gh-images.example.com/i/6f0f2f3e-b9cc-4d8f-97d3-0c254e7fba4e)

## Deployment

### Clerk

- Create development and production Clerk applications.
- Enable a JWT template with application ID `convex`.

### Convex

- Configure `CLERK_JWT_ISSUER_DOMAIN` in Convex deployment settings.
- Deploy backend:

    pnpm exec convex deploy

### Vercel

- Create/import Vercel project.
- Add env vars from local setup section.
- Deploy:

    vercel --prod

## Agent Skill

A reusable skill for other agents exists at:

- `skills/gh-agent-images-upload/SKILL.md`
