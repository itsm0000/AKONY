# AI_CONTEXT.md — READ THIS FIRST

> **This file is the single source of truth for any AI developer working on AKONY.**
> **Read this entire file before touching any code.**

---

## Project Identity

- **Name:** AKONY (أكُوني) — "صانع الامتحانات الذكي" (The Smart Exam Builder)
- **Repo:** `C:\Users\MT\Projects\AKONY`
- **Current Branch:** `feature/k12-database-pivot`
- **Git Rule:** ALL work stays on this branch. DO NOT commit to `main`.

---

## What AKONY Is

AKONY is a **database-driven exam generator** for Iraqi K-12 curriculums, starting with Grade 12 Physics (السادس العلمي). It has two paths:

| Path | Route | Description | Tier |
|------|-------|-------------|-----|
| **Path A (K-12 DB)** | `/wizard` | Select Grade → Subject → Type → Difficulty → Generate from DB | Free |
| **Path B (Custom PDF)** | `/` → Upload | Upload PDF → AI analyzes → Build exam manually | Pro |

Both paths feed into the same `/exam/[id]/edit` and `/exam/[id]/preview` pages via the shared Zustand store.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  Next.js 16 App Router + TypeScript 5 + Tailwind CSS v4     │
│  shadcn/ui components + Framer Motion animations            │
│  Zustand 5 for state management (single examStore)          │
├─────────────────────────────────────────────────────────────┤
│                        ROUTES                                │
│  /                    → Landing page (dual-path)             │
│  /wizard              → K-12 wizard (4 steps)               │
│  /exam/[id]/scope     → PDF page range (Path B)             │
│  /exam/[id]/structure → Question builder (Path B)           │
│  /exam/[id]/edit      → Content editor (BOTH paths)         │
│  /exam/[id]/preview   → Preview + PDF export (BOTH paths)   │
├─────────────────────────────────────────────────────────────┤
│                        BACKEND                               │
│  Supabase (PostgreSQL) — curriculum DB + AI cache            │
│  Google Gemini 2.5 Flash — Vision AI for PDF analysis       │
│  @react-pdf/renderer — RTL PDF generation                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Critical Rules — DO NOT VIOLATE

### 1. DO NOT BREAK THE ZUSTAND STORE
The `examStore.ts` is the single source of truth for exam data. Both Path A and Path B use it. The store has these key actions:
- `initExam(materialId, title, examId?)` — Initialize a new exam
- `setScope(scope)` — Set page range
- `setMetadata(metadata)` — Set exam metadata
- `addQuestion(versionId, type)` — Add a question to a version
- `updateQuestion(versionId, questionId, updates)` — Update question
- `addSubQuestion(versionId, questionId, type)` — Add sub-question
- `updateSubQuestion(versionId, questionId, subId, updates)` — Update sub-question

If you change the store shape, you MUST update ALL consumers (edit page, preview page, structure page, ExamPdfDocument, wizard page).

### 2. DO NOT BREAK THE LEGACY PDF FLOW (Path B)
The existing flow: Upload → Scope → Structure → Edit → Preview MUST continue to work. The wizard (Path A) was added alongside it, not instead of it.

### 3. MAINTAIN RTL-FIRST
All CSS uses logical properties (`margin-inline-start`, NOT `margin-left`). The root layout has `dir="rtl"` and `lang="Arabic"`. All new components must respect RTL.

### 4. ARABIC-FIRST UI
All user-facing text is in Arabic. English is only used for code, technical labels, and mixed math content. The font stack is IBM Plex Sans Arabic + Inter (for numbers).

### 5. TYPESCRIPT STRICT MODE
The project uses strict TypeScript. All types must be explicit. The main types are in `src/lib/types/exam.ts`:
- `Exam`, `ExamVersion`, `Question`, `SubQuestion`, `McqOption`
- `ExamMetadata`, `ExamScope`, `QuestionType`
- `QuestionType` = `"problem" | "definition" | "comparison" | "drawing" | "mcq" | "short_answer" | "explanation" | "activity"`

### 6. SSR SAFETY
Browser-only libraries (PDF.js, Fabric.js, Tesseract.js) MUST be dynamically imported inside `useEffect`. Never import them at module level.

---

## Current Implementation Status

### ✅ COMPLETED (What Exists)

| Component | Files | Status |
|-----------|-------|--------|
| **Project scaffolding** | Next.js 16, Tailwind v4, shadcn/ui, Supabase clients | ✅ Done |
| **Landing page (dual-path)** | `app/page.tsx` — Path A (wizard) + Path B (upload) + Why Pro section | ✅ Done |
| **K-12 Wizard (4 steps)** | `app/wizard/page.tsx` + `components/wizard/*.tsx` | ✅ Done |
| **Wizard API endpoint** | `app/api/wizard/generate/route.ts` | ✅ Done |
| **Blueprint Engine** | `lib/actions/generateExam.ts` + `lib/supabase/queries.ts` | ✅ Done |
| **Database Schema** | `lib/supabase/schema.sql` (5 tables + indexes + RLS) | ✅ Done |
| **Seeding Pipeline** | `scripts/seed-questions.ts` (TeleGrabber + Gemini) | ✅ Done |
| **AdSlot Component** | `components/AdSlot.tsx` (leaderboard/sidebar/inline) | ✅ Done |
| **Export Limiter** | `lib/services/exportLimiter.ts` (3/day free, localStorage) | ✅ Done |
| **Watermark Service** | `lib/services/watermark.ts` (diagonal watermark for free tier) | ✅ Done |
| **Post-gen redirect toggle** | In `DifficultySlider.tsx` — toggle between Editor/Preview | ✅ Done |
| **Quick-switch buttons** | Editor ↔ Preview toggle buttons in headers | ✅ Done |
| **PDF Upload flow (legacy)** | Upload → Scope → Structure → Edit → Preview | ✅ Done |
| **AI Categorization** | Gemini 2.5 Flash + Supabase cache | ✅ Done |
| **AI Evaluation** | `/api/evaluate` endpoint | ✅ Done |
| **AI TOC Extraction** | `/api/exam/extract-toc` endpoint | ✅ Done |
| **Structure Builder** | Templates, difficulty slider, AI bulk fill | ✅ Done |
| **MCQ Editor** | Inline editing with correct-answer toggle | ✅ Done |
| **PDF Export** | @react-pdf/renderer with Amiri Arabic font | ✅ Done |
| **Answer Key** | Toggle to show answer key in preview + PDF | ✅ Done |
| **Dark/Light Mode** | next-themes with system detection | ✅ Done |
| **Responsive Design** | Mobile/tablet/desktop layouts | ✅ Done |

### ❌ NOT YET IMPLEMENTED

| Component | Description | Priority |
|-----------|-------------|----------|
| **Database seeding** | TeleGrabber hasn't run yet — `questions` table is empty | 🔴 Waiting on user |
| **Supabase Auth** | No login/signup UI — auth middleware not set up | 🟡 Medium |
| **Exam persistence** | Zustand state lost on refresh — no save/load to DB | 🟡 Medium |
| **Real AdSense integration** | AdSlot shows placeholder — needs real ad network config | 🟡 Medium |
| **User tier enforcement** | No auth = no way to check Pro vs Free tier | 🟡 Medium |
| **Watermark in PDF export** | `watermark.ts` defined but not integrated into `ExamPdfDocument.tsx` | 🟡 Medium |
| **Export limiter in preview** | `exportLimiter.ts` defined but not wired to download button | 🟡 Medium |
| **Drag-and-drop reordering** | `@dnd-kit` installed but not used yet | 🔵 Low |
| **Additional subjects/grades** | Only Grade 12 Physics for MVP | 🔵 Post-MVP |
| **Question bank (Pro)** | Save/reuse questions across exams | 🔵 Post-MVP |
| **AI Auto-Grading** | Photograph answers → AI grades | 🔵 Future |

---

## Key Files Reference

### State Management
- `src/lib/stores/examStore.ts` — THE single Zustand store for all exam data
- `src/lib/types/exam.ts` — All TypeScript interfaces

### K-12 Database Layer
- `src/lib/supabase/schema.sql` — Database schema (run in Supabase SQL Editor)
- `src/lib/supabase/queries.ts` — Typed query functions (getSubjects, getChapters, getQuestionsByDifficulty, etc.)
- `src/lib/actions/generateExam.ts` — Server action: blueprint + difficulty → populated Exam object

### Wizard (Path A)
- `src/app/wizard/page.tsx` — 4-step wizard with AnimatePresence transitions
- `src/components/wizard/GradeSelector.tsx` — Grade 1-12 grid (only 12 enabled)
- `src/components/wizard/SubjectSelector.tsx` — Subject cards (only Physics enabled)
- `src/components/wizard/ExamTypeSelector.tsx` — Exam type cards (only Ministerial enabled)
- `src/components/wizard/DifficultySlider.tsx` — Difficulty 1-10 slider + redirect toggle
- `src/app/api/wizard/generate/route.ts` — POST endpoint proxying generateExamFromBlueprint

### Landing Page
- `src/app/page.tsx` — Dual-path landing with hero, path cards, Why Pro section, ad slot

### Monetization
- `src/components/AdSlot.tsx` — Ad container with graceful collapse
- `src/lib/services/exportLimiter.ts` — Daily export counter (localStorage)
- `src/lib/services/watermark.ts` — Watermark constants/styles

### Legacy Path B
- `src/app/exam/[id]/scope/page.tsx` — PDF scope/page range
- `src/app/exam/[id]/structure/page.tsx` — Question structure builder
- `src/hooks/useCategorization.ts` — AI categorization + Supabase cache
- `src/app/api/categorize/route.ts` — Gemini Vision categorization endpoint

### Shared (Both Paths)
- `src/app/exam/[id]/edit/page.tsx` — Content editor (metadata, sub-questions, MCQ)
- `src/app/exam/[id]/preview/page.tsx` — A4 preview + PDF export + answer key
- `src/components/ExamPdfDocument.tsx` — @react-pdf RTL document template

### Scripts
- `scripts/seed-questions.ts` — TeleGrabber PDFs → Gemini extraction → Supabase INSERT

---

## How the Blueprint Engine Works

1. `exam_blueprints.structure_json` stores a JSON array defining question blocks
2. Each block has either a `query` (simple) or `branches` (multi-part)
3. The server action `generateExamFromBlueprint()` queries the `questions` table for each block
4. Questions are selected by `ORDER BY ABS(difficulty - user_selected_difficulty) LIMIT N`
5. Result is a populated `Exam` object hydrated into Zustand

Example blueprint for Q1:
```json
{
  "questionNumber": 1,
  "instructions": "أجب عن خمسة من التعاريف الآتية:",
  "query": { "type": "definition", "limit": 6 },
  "marks": 10
}
```

---

## Post-Generation Redirect Behavior

After the wizard generates an exam:
- **Default (toggle OFF):** Redirect to `/exam/[id]/edit` (Editor)
- **Toggle ON:** Redirect to `/exam/[id]/preview` (Preview/Export)
- Preference stored in `localStorage` key `akony_redirect_to_preview`
- When auth is implemented, also store in `user_preferences.default_post_generate_action`

---

## Data Seeding Pipeline

> **No mock data. Real ministerial exams only.**

1. User runs TeleGrabber to download Ministerial Physics PDFs from Iraqi Telegram channels
2. User runs `npx tsx scripts/seed-questions.ts --dir ./telegrabber-output`
3. Script sends each PDF to Gemini 2.5 Pro for structured extraction
4. Extracted questions are INSERTed into Supabase `questions` table
5. Development can proceed with an empty `questions` table — the engine handles empty results gracefully

---

## What to Work on Next

Based on the implementation plan, the next priorities are:

1. **Integrate watermark into PDF export** — Wire `watermark.ts` into `ExamPdfDocument.tsx` so free-tier exports get the watermark
2. **Integrate export limiter into preview** — Wire `exportLimiter.ts` into the download button in `preview/page.tsx`
3. **Supabase Auth** — Add login/signup UI so user tiers can be enforced
4. **Exam persistence** — Save/load exams to Supabase so they survive page refresh
5. **Real AdSense integration** — Replace AdSlot placeholder with real ad units

---

## Environment

- **Node.js** 18+
- **npm** 9+
- **Platform:** Windows (win32)
- **Shell:** PowerShell
- **IDE:** Kilo Code (AI-assisted development)

---

## Common Commands

```powershell
cd C:\Users\MT\Projects\AKONY
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build (check for errors)
npx tsc --noEmit     # TypeScript type check
npm run lint         # ESLint
```

---

> **Last Updated:** 2026-03-30
> **Maintainer:** MT
> **AI Context Version:** 2.0 (K-12 Pivot)
