# AKONY — Universal Agent Rules
# This file is read by: Claude Code, Cursor, Windsurf, GitHub Copilot (via AGENTS.md standard),
# and any tool that follows the emerging AGENTS.md convention.
# For Kilo Code / Cline-based tools: see .clinerules in this same directory.
# For Gemini/Antigravity: see ~/.gemini/AGENTS.md

---

## Project Basics

- **Repo:** `C:\Users\MT\Projects\AKONY`
- **Branch:** `feature/k12-database-pivot` — ALL work stays here. DO NOT commit to `main`.
- **Dev Server:** `npm run dev` → localhost:3000 (this is the ONLY command needed — no separate backend)
- **Backend:** Supabase cloud (`dkkzpaxuvemxumhmrdzp`) — always live, no local server needed
- **Docs:** Read `src/documentation/HANDOFF.md` first (recent work + next steps), then `src/documentation/AKONY_MASTER.md` (full project bible)

---

## Non-Negotiable Rules

1. **DO NOT break the Zustand store** (`src/lib/stores/examStore.ts`) — it's the single source of truth for all exam data
2. **DO NOT break the legacy PDF flow** (Path B: Upload → Scope → Structure → Edit → Preview) — it must always work alongside Path A
3. **RTL-first CSS** — use logical properties (`margin-inline-start`, NOT `margin-left`). Root has `dir="rtl"`.
4. **Arabic-first UI** — all user-facing text is Arabic. English only for code/labels.
5. **TypeScript strict mode** — no `any`, all types explicit. Types live in `src/lib/types/exam.ts`.
6. **SSR safety** — browser-only libs (PDF.js, Tesseract.js) only via dynamic import inside `useEffect`.

---

## Session Wrap-Up Protocol

When asked to "wrap up", "end the session", "commit everything", or "save progress":

1. Run `git status` — show the user what changed
2. **Ask for explicit commit approval** before pushing
3. Commit with conventional prefix (`feat:`, `fix:`, `docs:`, etc.) and push to `feature/k12-database-pivot`
4. Update `src/documentation/AKONY_MASTER.md` (mark completed ✅, update Git Log, update date)
5. Overwrite `src/documentation/HANDOFF.md` with: current snapshot + what was done + what's next + gotchas
6. Confirm to user: what was committed, what docs were updated, what the next session should tackle

---

## Documentation Rules

Two files only. Do NOT create additional .md files:
- `src/documentation/AKONY_MASTER.md` — full project bible (update each session)
- `src/documentation/HANDOFF.md` — session handoff (overwrite each session)
