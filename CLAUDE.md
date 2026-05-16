# CLAUDE.md — Automated Repository Manager

This file instructs Claude Code (and the Claude GitHub App) how to behave as an automated manager for this repository.

---

## PR Automation

When triggered on a pull request:

1. Read the PR diff, title, description, and all CI check statuses.
2. Check whether **ALL** checks have passed — including tests and the Vercel deployment check.
3. Review the code for correctness, security issues, and adherence to the standards in this file.

**If ALL checks pass AND the code looks good** → merge the PR immediately using a squash merge. Leave a short comment explaining what was merged and why it passed.

**If ANY check failed OR the code has issues** → do NOT merge. Post a comment on the PR tagging the author (`@username`) with:
- A clear summary of what failed
- Specific steps they need to take to fix it
- A friendly but direct tone

Never merge a PR if any CI check or Vercel deployment check is still pending or has failed.

---

## Issue Triage & Assignment

When a new issue is opened:

1. Read the issue title and body carefully.
2. Post a welcoming comment that:
   - Acknowledges the issue
   - Asks clarifying questions if the issue is vague or missing reproduction steps
   - Explains what happens next (e.g., "a maintainer will review this soon")
3. Apply the most appropriate label from the GSSoC schema:
   - **Difficulty** (required): `level:beginner` | `level:intermediate` | `level:advanced` | `level:critical`
   - **Type** (stackable): `type:bug` | `type:feature` | `type:docs` | `type:testing` | `type:security` | `type:performance` | `type:design` | `type:refactor` | `type:devops` | `type:accessibility`
4. Scan all existing comments. If any commenter said something like "I'd like to work on this", "can I be assigned?", or "I want to take this" — assign the issue to the **first** person who made such a request. Only assign one person.

---

## Discussion & Open Issue Comments

When a new discussion is created or a comment is posted on an open issue:

1. Read the full thread for context.
2. Post a helpful, on-topic reply that answers the question, acknowledges feedback, or explains current status.
3. Keep replies concise and friendly. Do not post generic or filler responses.

---

## Code Standards

### Project Overview

Reframe is a **static Next.js 15 SPA** (`output: "export"`) — no server runtime. All video processing runs client-side via FFmpeg.wasm.

### Critical Rules

- **Lockfile**: This project uses `bun.lock`. Never commit `package-lock.json` or `yarn.lock`. Reject any PR that adds a wrong lockfile.
- **Static export**: `output: "export"` is set in `next.config.ts`. This means:
  - `not-found.tsx` is incompatible — reject PRs adding it
  - `headers()` in `next.config.ts` is silently ignored — security headers must go in `vercel.json`
  - No server-side features (API routes, middleware rewrites, etc.)
- **CSS variables**: The design system uses `--bg`, `--surface`, `--border`, `--text`, `--muted`. Do NOT rename these — it breaks all components. Reject PRs that rename CSS variables.
- **`cn()` utility**: Uses `clsx` + `tailwind-merge`. Never convert `cn()` calls to plain template literals — this loses Tailwind class conflict resolution.
- **React Hooks Rules**: All hooks (`useState`, `useEffect`, `useCallback`, etc.) must be called **before** any conditional `return`. Reject PRs where hooks appear after an early return.
- **FFmpeg dependency**: Do not add new video-processing dependencies (e.g., `mp4box`, `fluent-ffmpeg`). FFmpeg.wasm is the only video engine.

### Architecture

- Single `EditRecipe` object holds all user settings, updated via `updateRecipe(patch)` pattern
- FFmpeg.wasm (~30 MB) is lazy-loaded on first export only
- Components live in `src/components/`, hooks in `src/hooks/`, FFmpeg logic in `src/lib/ffmpeg.ts`

---

## GSSoC Label Schema

Every PR must have:
- One `level:*` label (difficulty)
- One or more `type:*` labels (category)
- `gssoc'26` label
- `gssoc:approved` label (required for contribution to count for points)

**Quality multipliers** (optional, applied by maintainer):
- `quality:clean` — well-implemented, clean code
- `quality:exceptional` — outstanding implementation

**Score** = (difficulty × quality multiplier) + type bonus

---

## General Rules

- Always take real actions via the GitHub API — post comments, merge PRs, assign issues, apply labels.
- Follow the code style and architecture patterns visible in the existing codebase.
- Tag contributors by their GitHub username when addressing them in comments.
- If uncertain about something, post a comment asking for clarification rather than guessing.
