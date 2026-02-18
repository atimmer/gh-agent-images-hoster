# Changelog

## Unreleased

### Added

### Changed
- Updated the `gh-agent-images-upload` skill instructions to require cropping images to relevant areas before upload.

### Fixed

## 0.1.2 - 2026-02-18

### Added

### Changed
- Renamed the CLI command from `gh-agent-images` to `agent-images` across package bins, CLI help output, dashboard setup command, and documentation.

### Fixed
- Updated npm publish GitHub Actions workflow to use npm trusted publishing runtime requirements (Node 22.14.0 + npm 11.5.1) instead of the previous token-based publish path.

## 0.1.1 - 2026-02-18

### Added
- Added repository changelog/release tooling: `CHANGELOG.md`, `RELEASING.md`, GitHub Release notes extraction workflow, and npm publish workflow.
- Added `gh-agent-images install-skill` command that delegates to `skills.sh` (`npx skills add`) and installs the `gh-agent-images-upload` skill from this repository.

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
