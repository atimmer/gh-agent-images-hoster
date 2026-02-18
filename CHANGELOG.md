# Changelog

## Unreleased

### Added
- Added repository changelog/release tooling: `CHANGELOG.md`, `RELEASING.md`, GitHub Release notes extraction workflow, and npm publish workflow.

### Changed
- Updated CLI publish command to use workspace filtering (`pnpm publish --filter @24letters/agent-images ...`) so publishing works reliably from the repo root.

### Fixed

## 0.1.0 - 2026-02-18

### Added
- Next.js + Convex + Clerk application for immutable image hosting with agent attribution.
- Public image rendering via non-guessable UUID URLs at `/i/<uuid>` with long-lived immutable caching headers.
- Authenticated dashboard for viewing uploads, copying markdown, and managing CLI tokens/settings.
- Publishable CLI package `@24letters/agent-images` with `auth login` and `upload` commands.
- Agent skill documentation at `skills/gh-agent-images-upload/SKILL.md`.
