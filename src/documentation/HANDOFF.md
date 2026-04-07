# AKONY — Session Handoff
> **Read `AKONY_MASTER.md` first for full context. This file summarizes recent work and what to do next.**

---

## Current Status Snapshot
| Field | Value |
|-------|-------|
| **Date** | 2026-04-07 |
| **Branch** | `feature/k12-database-pivot` |
| **Last commit** | `7e01029` — feat(k12-pivot): complete Phase 1 |
| **Dev server** | `npm run dev` → localhost:3000 (single command, no separate backend) |
| **Supabase** | `dkkzpaxuvemxumhmrdzp` — live, schema applied, subjects/chapters/blueprints seeded |

---

## What Was Done This Session (2026-04-07)

### Bug Fixes
- `DifficultySlider.tsx` — Removed mixed Chinese/Kanji chars from Arabic difficulty labels
- `seed-questions.ts` — Fixed Russian characters in chapter 3 name → correct Arabic "القوى والحركة"
- `QuestionCard.tsx` — Added missing `explanation` and `activity` entries to `TYPE_ICONS` (was TS error)

### New Features Built
- `AppHeader.tsx` — Added Login + "إنشاء حساب" buttons to header
- `components/ProBanner.tsx` — New dismissible "Upgrade to Pro" amber banner in editor (free users only)
- `exam/[id]/preview/page.tsx` — Wired `exportLimiter.ts`: blocks download after 3/day, shows gate modal, shows toast with remaining count
- `app/page.tsx` — Replaced inline Path B upload reveal with a proper Pro gate modal (lock icon, feature list, upgrade CTA)

### Database (via Supabase MCP — done directly, no SQL Editor needed)
- Applied schema migration: 5 tables + indexes + RLS policies
- Seeded: 1 subject (Physics Grade 12), 6 chapters, 4 exam blueprints

### Documentation Consolidation (this session)
- Deleted redundant files: `AI_CONTEXT.md`, `K12_PIVOT_PLAN.md`, `pivot_implementation_plan.md`, `product_documentation.md`, `implementation_plan.md`, `README.md`, `AI_SESSION_LOG.md`
- Created `AKONY_MASTER.md` — one comprehensive source of truth
- Created `HANDOFF.md` — this file, for session continuity

### Global Workflow Created
- `/wrap-up-session` workflow created in global workflows
- Updated `GEMINI.md` global rule to include session wrap-up behavior

---

## What To Do Next (Phase 5)

### 1. Seed the Questions Table 🔴 (Highest Priority — blocks the whole product)
The `questions` table is empty. The wizard works but returns no questions.
```powershell
# Run TeleGrabber first to download ministerial Physics PDFs
# Then:
npx tsx scripts/seed-questions.ts --dir ./your-pdfs-folder
```

### 2. Implement Supabase Auth 🟡
```
Files to create:
- src/middleware.ts              (session refresh + route protection)
- src/app/auth/login/page.tsx   (email + Google OAuth)
- src/app/auth/signup/page.tsx  
- src/lib/contexts/AuthContext.tsx
Modify:
- src/components/AppHeader.tsx  (replace Login/SignUp buttons with avatar dropdown when logged in)
```

### 3. Exam Persistence 🟡 (Needs auth first)
Zustand state is currently lost on page refresh.
```
Create:
- src/lib/actions/saveExam.ts
- src/lib/actions/loadExam.ts
- src/app/my-exams/page.tsx
```

### 4. Wire Watermark into PDF Export 🟡
`src/lib/services/watermark.ts` is defined but NOT integrated into `src/components/ExamPdfDocument.tsx`.
Add a diagonal text watermark to PDF output for free-tier users.

### 5. Wire Real isPro to All Gates 🟡
Currently `isPro` is hardcoded to `false` in:
- `src/components/ProBanner.tsx`
- `src/app/exam/[id]/preview/page.tsx`
Once auth is done → create `src/lib/services/tierService.ts` and connect.

---

## Reminders & Gotchas

- **No separate backend** — `npm run dev` is the only command needed. Supabase is the backend.
- **Questions table is empty** — wizard will generate empty exam structure until seeded.
- **isPro is always false** — export limiter will always block after 3 downloads.
- **TeleGrabber tables** (`messages`, `telegram_sessions`, etc.) are in the same Supabase project but are NOT AKONY's — ignore their missing RLS warnings.
- **Git rule:** Stay on `feature/k12-database-pivot`. Do NOT commit to `main`.
- **RTL-first everything** — logical CSS properties only, Arabic text first.

---

*Updated by AI agent on 2026-04-07. Next instance: read `AKONY_MASTER.md` for full context, then continue from the "What To Do Next" section above.*
