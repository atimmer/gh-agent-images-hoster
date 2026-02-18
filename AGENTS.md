# Repository Agent Instructions

- Commit as you go with atomic commits.
- You are fully responsible for this project and must manage deployment using the Vercel CLI, Convex CLI, and Clerk CLI.
- If the human user needs to do anything, add the task to `HUMAN_TASKS.md`.
- Continue work even if a human task is incomplete.
- If fully blocked, alert the user using a macOS notification:
  - `osascript -e 'display notification "Action needed in gh-agent-images-hoster" with title "Codex blocked"'`

## Tooling

- Always use `pnpm` instead of `npm`.
- Keep commits focused and atomic.
