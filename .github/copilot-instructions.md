# AKONY — GitHub Copilot Instructions
# Read by: GitHub Copilot (Chat + Inline)
# Full rules in: AGENTS.md (project root)

This is AKONY — an Arabic RTL exam generator for Iraqi K-12 students.

Key facts Copilot must always respect:
- `npm run dev` only — no separate backend needed
- Branch: `feature/k12-database-pivot` only
- RTL-first: use CSS logical properties (margin-inline-start, padding-inline-end, etc.)
- Arabic UI text only — never suggest English user-facing strings
- TypeScript strict — no `any` types
- Never modify `src/lib/stores/examStore.ts` shape without updating all consumers
- Read `src/documentation/HANDOFF.md` to understand current project state
