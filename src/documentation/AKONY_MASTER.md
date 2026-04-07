# AKONY — صانع الامتحانات الذكي
## Master Project Document — Single Source of Truth

> **READ THIS FILE FIRST.** Every AI developer or human contributor should read this entire file before touching any code.
> **Last updated:** 2026-04-07 | **Branch:** `feature/k12-database-pivot` | **DB:** Supabase `dkkzpaxuvemxumhmrdzp`

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| **Name** | AKONY (أكُوني) — "صانع الامتحانات الذكي" |
| **Tagline** | "امتحاناتك، طريقتك" — Your exams, your way |
| **Repo** | `C:\Users\MT\Projects\AKONY` |
| **Branch** | `feature/k12-database-pivot` (ALL work stays here) |
| **DO NOT merge to `main`** | Until MVP is fully functional |
| **Supabase Project** | `dkkzpaxuvemxumhmrdzp` (ap-northeast-2) |

---

## 2. What It Is & The Problem We Solve

Iraqi teachers and students spend **hours** manually creating exams:
- Retyping questions from textbooks by hand
- Fighting Word/Google Docs RTL formatting (Arabic + English math = chaos)
- No access to previous ministerial exam questions in structured format
- Recreating exam structures from scratch every semester

**AKONY** solves this with two paths:

| Path | Route | Description | Tier |
|------|-------|-------------|------|
| **Path A — امتحاناتي** | `/wizard` | Select Grade → Subject → Type → Difficulty → Generate instantly from question DB | Free |
| **Path B — ارفع ملفك** | `/` → upload | Upload any curriculum PDF → AI analyzes → build custom exam | Pro |

Both paths output to the **same** `/exam/[id]/edit` (editor) and `/exam/[id]/preview` (export) pages via shared Zustand state.

### Target Users
| Segment | Description |
|---------|-------------|
| **Primary** | Iraqi high school students (السادس العلمي) preparing for ministerial exams |
| **Secondary** | Iraqi teachers building class exams |
| **Tertiary** | Arab educators with similar Arabic curriculum formats |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  Next.js 16 App Router · TypeScript 5 strict · Tailwind CSS v4  │
│  shadcn/ui (13 primitives) · Framer Motion · Zustand 5          │
├─────────────────────────────────────────────────────────────────┤
│                          ROUTES                                  │
│  /                      Landing page (dual-path)                 │
│  /wizard                K-12 wizard (4 steps)                   │
│  /exam/[id]/scope       PDF page range (Path B only)            │
│  /exam/[id]/structure   Question builder (Path B only)          │
│  /exam/[id]/edit        Content editor (BOTH paths)             │
│  /exam/[id]/preview     Preview + PDF export (BOTH paths)       │
├─────────────────────────────────────────────────────────────────┤
│                          BACKEND                                 │
│  Supabase PostgreSQL — curriculum DB + AI cache                 │
│  Google Gemini 2.5 Flash — Vision AI for PDF analysis           │
│  @react-pdf/renderer — RTL Arabic PDF generation                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Tech Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Next.js | 16.1.6 | App Router, SSR, API routes |
| Language | TypeScript | 5.x | Strict mode — no `any` |
| Styling | Tailwind CSS | v4 | With logical RTL properties |
| UI Components | shadcn/ui | 4.0.6 | 13 accessible primitives |
| State | Zustand | 5.0.11 | Client-side exam state |
| Animation | Framer Motion | 12.36.0 | Page transitions |
| Database | Supabase | PostgreSQL 17 | Curriculum DB + auth |
| Vision AI | Google Gemini | 2.5 Flash | PDF analysis (Path B) |
| PDF Parsing | PDF.js | 5.5.207 | PDF → page images |
| PDF Export | @react-pdf/renderer | 4.3.2 | A4 RTL PDF |
| OCR | Tesseract.js | 7.0.0 | Arabic/English in-browser |
| Theme | next-themes | 0.4.6 | Dark/light/system |
| DnD | @dnd-kit | 6.3.1 | Question reordering (planned) |

---

## 5. How to Run

This is a **single-process** Next.js app. There is NO separate backend to run.

```powershell
cd C:\Users\MT\Projects\AKONY
npm run dev          # Start frontend + API routes on localhost:3000
```

The backend is Supabase (cloud) — always live, no local server needed.

```powershell
npm run build        # Production build (verify no errors before deploying)
npx tsc --noEmit     # TypeScript type check
npm run lint         # ESLint
```

### Environment Variables (`.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `GEMINI_API_KEY` | ✅ (Path B) | Google Gemini API key |
| `GROQ_API_KEY` | Optional | Groq API (model testing) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ (seeding) | For seed script |

---

## 6. Critical Rules — NEVER Violate

### Rule 1: DO NOT Break the Zustand Store
`src/lib/stores/examStore.ts` is the single source of truth. Key actions:
- `initExam(materialId, title, examId?)` — Initialize a new exam
- `setScope(scope)` — Set PDF page range
- `setMetadata(metadata)` — Set school/subject/grade/date/etc.
- `addQuestion(versionId, type)` — Add question
- `updateQuestion(versionId, questionId, updates)` — Update question
- `addSubQuestion(versionId, questionId, type)` — Add sub-question
- `updateSubQuestion(versionId, questionId, subId, updates)` — Update sub-question

If you change the store shape → update ALL consumers: edit page, preview page, structure page, ExamPdfDocument, wizard page.

### Rule 2: DO NOT Break the Legacy PDF Flow (Path B)
Upload → Scope → Structure → Edit → Preview MUST continue to work. Path A was added **alongside** it.

### Rule 3: RTL-First CSS
Use logical properties only: `margin-inline-start` (NOT `margin-left`). Root layout has `dir="rtl"` and `lang="Arabic"`.

### Rule 4: Arabic-First UI
All user-facing text is Arabic. English is only for code, technical labels, math. Font: IBM Plex Sans Arabic + Inter (numbers).

### Rule 5: TypeScript Strict Mode
All types explicit. Main types in `src/lib/types/exam.ts`:
- `Exam`, `ExamVersion`, `Question`, `SubQuestion`, `McqOption`
- `QuestionType` = `"problem" | "definition" | "comparison" | "drawing" | "mcq" | "short_answer" | "explanation" | "activity"`

### Rule 6: SSR Safety
Browser-only libs (PDF.js, Fabric.js, Tesseract.js) MUST be dynamically imported inside `useEffect`. Never at module level.

---

## 7. File Structure

```
src/
├── app/
│   ├── page.tsx                       # Landing (dual-path, Why Pro, ad slot)
│   ├── layout.tsx                     # Root layout (RTL, fonts, ThemeProvider)
│   ├── globals.css                    # Tailwind v4 tokens, glassmorphism
│   ├── wizard/page.tsx                # K-12 wizard (4 steps, AnimatePresence)
│   ├── exam/[id]/
│   │   ├── scope/page.tsx             # PDF scope (Path B)
│   │   ├── structure/page.tsx         # Structure builder (Path B)
│   │   ├── edit/page.tsx              # Editor (BOTH paths)
│   │   └── preview/page.tsx           # Preview + export (BOTH paths)
│   └── api/
│       ├── categorize/route.ts        # Gemini Vision → question types
│       ├── evaluate/route.ts          # Gemini exam evaluation
│       ├── exam/extract-toc/route.ts  # Gemini TOC extraction
│       └── wizard/generate/route.ts   # Blueprint engine endpoint
│
├── components/
│   ├── ui/                            # shadcn/ui primitives
│   ├── wizard/
│   │   ├── GradeSelector.tsx          # Grade 1-12 grid (only 12 enabled)
│   │   ├── SubjectSelector.tsx        # Subject cards (only Physics enabled)
│   │   ├── ExamTypeSelector.tsx       # Type cards (only Ministerial enabled)
│   │   └── DifficultySlider.tsx       # Difficulty 1-10 + redirect toggle
│   ├── AppHeader.tsx                  # Sticky header + Login/Sign Up buttons
│   ├── ProBanner.tsx                  # Dismissible upgrade banner (free tier)
│   ├── AdSlot.tsx                     # Ad container (placeholder)
│   ├── UploadZone.tsx                 # Drag-and-drop PDF upload (Path B)
│   ├── QuestionCard.tsx               # Interactive question editor
│   ├── SubQuestionEditor.tsx          # Sub-question text + MCQ editing
│   ├── McqEditor.tsx                  # MCQ options editor
│   ├── VersionTabs.tsx                # Exam version tabs (أ، ب، ج)
│   ├── ExamPdfDocument.tsx            # @react-pdf A4 RTL document template
│   ├── HeroSection.tsx                # Landing hero component
│   ├── ThemeProvider.tsx              # next-themes wrapper
│   └── ThemeToggle.tsx                # Dark/light/system dropdown
│
├── hooks/
│   ├── useCategorization.ts           # AI categorization + Supabase cache
│   ├── useOcr.ts                      # Tesseract.js OCR wrapper
│   └── usePdfViewer.ts               # PDF.js viewer hook
│
├── lib/
│   ├── types/exam.ts                  # All TypeScript interfaces
│   ├── stores/examStore.ts            # THE Zustand store
│   ├── actions/generateExam.ts        # Server action: blueprint → Exam object
│   ├── services/
│   │   ├── exportLimiter.ts           # Daily export counter (localStorage, 3/day free)
│   │   └── watermark.ts              # Watermark constants for free-tier PDF
│   ├── supabase/
│   │   ├── client.ts                  # Browser Supabase client
│   │   ├── server.ts                  # Server Supabase client
│   │   ├── queries.ts                 # Typed DB query functions
│   │   └── schema.sql                 # K-12 schema (5 tables, applied to DB)
│   └── utils/
│       ├── bidi.ts                    # RTL/LTR detection
│       └── pdfTextExtractor.ts        # PDF outline extraction
│
└── documentation/
    ├── AKONY_MASTER.md                ← THIS FILE (single source of truth)
    └── HANDOFF.md                     ← Session handoff (updated each session)
│
scripts/
└── seed-questions.ts                  # TeleGrabber PDFs → Gemini → Supabase INSERT
```

---

## 8. Database Schema (Live on Supabase)

Applied via migration on 2026-04-07. All tables have RLS enabled.

### Tables

| Table | Rows | RLS | Description |
|-------|------|-----|-------------|
| `subjects` | 1 | ✅ | Physics Grade 12 |
| `chapters` | 6 | ✅ | الفيزياء والقياس → الحرارة |
| `questions` | 0 | ✅ | Master question repo (empty — awaiting seed) |
| `exam_blueprints` | 4 | ✅ | daily / monthly / midterm / ministerial |
| `user_preferences` | 0 | ✅ | Per-user UI defaults |
| `categorized_cache` | 6 | ❌ | Legacy Path B AI cache (TeleGrabber project) |

### Blueprints Seeded

| Type | Total Marks | Duration |
|------|-------------|----------|
| `daily` | 10 | 30 min |
| `monthly` | 25 | 60 min |
| `midterm` | 50 | 90 min |
| `ministerial` | 80 | 180 min |

### RLS Policies
- **Public read** on subjects, chapters, questions, exam_blueprints (no auth needed to read curriculum)
- **User-scoped** read/write on user_preferences
- **Service role** bypasses RLS (for seeding scripts)

### Grade 12 Physics Chapters Seeded

| # | Arabic Name |
|---|------------|
| 1 | الفيزياء والقياس |
| 2 | الحركة |
| 3 | القوى والحركة |
| 4 | الشغل والطاقة |
| 5 | الضغط |
| 6 | الحرارة |

---

## 9. How the Blueprint Engine Works

1. `exam_blueprints.structure_json` stores a JSON recipe for each exam type
2. Blueprint defines sections: `{type, count, marks_each}`
3. Server action `generateExamFromBlueprint()` reads the blueprint
4. For each section, queries `questions` table: `ORDER BY ABS(difficulty - user_difficulty) LIMIT n`
5. Returns a populated `Exam` object → loaded into Zustand → routed to `/edit` or `/preview`

### Blueprint JSON Format

```json
{
  "total_marks": 80,
  "duration_minutes": 180,
  "sections": [
    { "type": "definition",   "count": 6, "marks_each": 3 },
    { "type": "problem",      "count": 5, "marks_each": 6 },
    { "type": "explanation",  "count": 4, "marks_each": 4 },
    { "type": "comparison",   "count": 3, "marks_each": 4 },
    { "type": "activity",     "count": 2, "marks_each": 4 },
    { "type": "mcq",          "count": 4, "marks_each": 1 }
  ]
}
```

---

## 10. Freemium Monetization Model

| Feature | Free | Pro ($9/mo) |
|---------|------|-------------|
| K-12 Database Generation | ✅ Full | ✅ Full |
| Custom PDF Upload (Path B) | ❌ | ✅ Unlimited |
| Exports per day | 3/day | Unlimited |
| Watermark on PDF | ✅ Yes | ❌ None |
| Ads | ✅ Banner | ❌ Ad-free |
| Question Bank | ❌ | ✅ |
| AI Auto-Grading (future) | ❌ | ✅ |

### Upsell Touchpoints (Implemented)
1. **ProBanner** — dismissible amber bar in editor for free users
2. **Export block modal** — appears after 3rd daily export, shows upgrade CTA
3. **Export count toast** — "X تصدير متبقٍ اليوم" notification
4. **Landing page** — "Why Pro?" comparison table + locked Path B with gate modal
5. **AppHeader** — Login / إنشاء حساب buttons visible to all

### Design Philosophy
Model after Canva, Notion, Spotify — graceful, value-driven, never aggressive. No dark patterns.

---

## 11. API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/wizard/generate` | Blueprint + difficulty → populated Exam object |
| POST | `/api/categorize` | Gemini Vision: PDF page images → question types |
| POST | `/api/evaluate` | Gemini: exam structure → Arabic feedback |
| POST | `/api/exam/extract-toc` | Gemini: PDF → table of contents |

---

## 12. Question Types

| Type | Arabic | Used In |
|------|--------|---------|
| `definition` | تعريف | K-12 (ministerial Q1 always definitions) |
| `problem` | مسألة / حساب | K-12 + Path B |
| `explanation` | شرح / تعليل | K-12 + Path B |
| `activity` | نشاط | K-12 ministerial |
| `comparison` | مقارنة | K-12 + Path B |
| `drawing` | رسم / توضيح | Path B |
| `mcq` | اختيار من متعدد | Both |
| `short_answer` | إجابة قصيرة | Both |

---

## 13. Post-Generation Redirect Behavior

After the wizard generates an exam:
- **Default (toggle OFF):** Redirect to `/exam/[id]/edit` (Editor)
- **Toggle ON:** Redirect to `/exam/[id]/preview` (Preview/Export)
- Preference stored in `localStorage` key `akony_redirect_to_preview`
- When auth is added → also sync to `user_preferences.default_post_generate_action`

---

## 14. Data Seeding Pipeline

> **No mock data.** Real ministerial questions only.

```
TeleGrabber (Iraqi Telegram channels: "ملازم السادس")
    ↓
Ministerial Physics PDFs (2013-2025)
    ↓
scripts/seed-questions.ts --dir ./telegrabber-output
    ↓
Gemini 2.5 Pro (structured extraction)
    ↓
Supabase INSERT into questions table
```

The wizard handles empty `questions` table gracefully — it generates an empty exam structure if no questions match.

---

## 15. Design System

### Typography
- **Primary:** IBM Plex Sans Arabic (300-700 weights)
- **Numbers/Labels:** Inter
- **PDF Export:** Amiri (local TTF at `/fonts/amiri-*.ttf`)

### Colors (Dark Mode — Default)
- Background: `oklch(0.145 0 0)` — Near-black
- Cards: Glassmorphism with `backdrop-blur(12px)` + subtle borders
- Accent: Teal → Blue gradient (`oklch(0.72 0.19 163)` → `oklch(0.65 0.20 250)`)
- Pro/Premium: Gold/amber tones

### Layout Principles
- **RTL-First:** CSS logical properties (`start`/`end`, `inline-start`/`inline-end`)
- **Dark-First:** Dark mode is default
- **Mobile-First:** Breakpoints at 375px, 768px, 1024px+
- **Glassmorphism:** Cards use `.glass-card` utility class

---

## 16. Implementation Status

### ✅ Complete

| Component | Files |
|-----------|-------|
| Project scaffolding | Next.js 16, Tailwind v4, shadcn/ui, Supabase clients |
| Landing page (dual-path) | `app/page.tsx` — Path A/B cards, Why Pro table, ad slot |
| K-12 Wizard (4 steps) | `app/wizard/page.tsx` + `components/wizard/*.tsx` |
| Wizard API endpoint | `app/api/wizard/generate/route.ts` |
| Blueprint Engine | `lib/actions/generateExam.ts` + `lib/supabase/queries.ts` |
| Database Schema | Applied to Supabase (5 tables + indexes + RLS policies) |
| Subjects seeded | 1 subject: Physics Grade 12 |
| Chapters seeded | 6 chapters (chapters 1-6) |
| Blueprints seeded | 4 blueprints (daily/monthly/midterm/ministerial) |
| Seeding Pipeline Script | `scripts/seed-questions.ts` (ready, questions table empty) |
| AdSlot Component | `components/AdSlot.tsx` (placeholder) |
| Export Limiter | `lib/services/exportLimiter.ts` + wired in `preview/page.tsx` |
| Watermark Service | `lib/services/watermark.ts` (defined, not in PDF yet) |
| ProBanner | `components/ProBanner.tsx` — in editor for free users |
| AppHeader auth buttons | Login + Sign Up in header |
| Post-gen redirect toggle | In `DifficultySlider.tsx` |
| Quick-switch buttons | Editor ↔ Preview in both page headers |
| PDF Upload flow (Path B) | Upload → Scope → Structure → Edit → Preview |
| AI Categorization | Gemini 2.5 Flash + Supabase cache |
| AI Evaluation | `/api/evaluate` endpoint |
| AI TOC Extraction | `/api/exam/extract-toc` endpoint |
| MCQ Editor | Inline editing with correct-answer toggle |
| PDF Export | @react-pdf/renderer with Amiri font |
| Answer Key | Toggle in preview + PDF |
| Dark/Light Mode | next-themes with system detection |
| Responsive Design | Mobile/tablet/desktop |
| DifficultySlider fixes | Arabic-only labels (no mixed chars) |
| Encoding fixes | Seed script chapter names correct Arabic |
| QuestionCard TypeScript fix | All 8 QuestionTypes in TYPE_ICONS |

### ❌ Not Yet Implemented

| Feature | Priority | Notes |
|---------|----------|-------|
| **Database seeding (questions)** | 🔴 High | Run TeleGrabber → `seed-questions.ts` |
| **Watermark in PDF export** | 🟡 Medium | Wire `watermark.ts` into `ExamPdfDocument.tsx` |
| **Supabase Auth** | 🟡 Medium | Login/signup pages + middleware |
| **Exam persistence** | 🟡 Medium | Save/load Zustand to Supabase (needs auth first) |
| **Real AdSense** | 🟡 Medium | Replace `AdSlot.tsx` placeholder |
| **User tier enforcement** | 🟡 Medium | `tierService.ts` + connect `isPro` to auth |
| **Drag-and-drop reordering** | 🔵 Low | @dnd-kit installed, not wired |
| **More subjects/grades** | 🔵 Post-MVP | Chemistry, Biology, Math for Grade 12 |
| **Question bank (Pro)** | 🔵 Post-MVP | Save/reuse questions |
| **AI Auto-Grading (Pro)** | 🔵 Future | Photograph answers → AI grades |

---

## 17. Phase Roadmap

| Phase | Name | Status |
|-------|------|--------|
| **Phase 1** | Core Foundation (Next.js, Tailwind, shadcn, Supabase) | ✅ Complete |
| **Phase 2** | Legacy PDF Flow (Upload, AI categorize, builder) | ✅ Complete |
| **Phase 3** | Polish & Export (PDF export, answer key, responsive) | ✅ Complete |
| **Phase 4** | K-12 Database Pivot (Schema, Wizard, Engine, Monetization) | ✅ Complete* |
| **Phase 5** | Auth & Persistence (Supabase Auth, save/load, tier) | 🔲 Next |
| **Phase 6** | Integration Polish (Watermark in PDF, real ads) | 🔲 Next |
| **Phase 7** | Expansion (More subjects/grades, question bank) | 🔲 Future |

*Phase 4 is code-complete. Questions table still empty (needs seeding).

---

## 18. Phase 5 Plan (Next Priority)

### 5a. Supabase Authentication
| Task | File | Description |
|------|------|-------------|
| Auth middleware | `middleware.ts` | Protect routes, refresh sessions |
| Login page | `app/auth/login/page.tsx` | Email/password + Google OAuth |
| Signup page | `app/auth/signup/page.tsx` | Registration flow |
| Auth context | `lib/contexts/AuthContext.tsx` | React context for session |
| User menu | Update `components/AppHeader.tsx` | Replace buttons with avatar/dropdown |

### 5b. Exam Persistence
| Task | File | Description |
|------|------|-------------|
| Save exam | `lib/actions/saveExam.ts` | Zustand → Supabase |
| Load exam | `lib/actions/loadExam.ts` | Supabase → Zustand |
| Auto-save | `lib/stores/examStore.ts` | Debounced on state changes |
| My exams page | `app/my-exams/page.tsx` | List user's saved exams |

### 5c. Tier Enforcement
| Task | File | Description |
|------|------|-------------|
| Tier check service | `lib/services/tierService.ts` | Check isPro from auth/Supabase |
| Feature gating | `AdSlot.tsx`, `exportLimiter.ts`, `ProBanner.tsx` | Use real isPro not hardcoded false |
| Upgrade page | `app/upgrade/page.tsx` | Subscription/payment page |

---

## 19. Git Log

| Commit | Description |
|--------|-------------|
| `7e01029` | feat(k12-pivot): complete Phase 1 — bug fixes, monetization, UI |
| `451115e` | feat: Phase 3 UI polish, PDF stability, AI prompt constraints |
| `d621a41` | feat: smart builder v2 + phase 3 polish + K-12 Pivot architecture context |
| `3a1dede` | feat: complete rewrite to AI-driven exam builder with Gemini 2.5 Flash |
| `cb55bee` | Sprint 5: Launch & Polish |
| `ba1a83b` | feat: complete Sprints 1-4, add documentation |

---

## 20. Known Issues

| Area | Issue | Priority |
|------|-------|----------|
| Empty questions table | Wizard returns empty results | 🔴 Waiting on seeding |
| No auth | Cannot enforce tier limits | 🟡 Phase 5 |
| State lost on refresh | Zustand not persisted | 🟡 Phase 5 |
| Watermark not in PDF | `watermark.ts` exists but unused in export | 🟡 Phase 6 |
| TOC hallucination | Gemini sometimes returns empty for scanned PDFs | 🟡 Known |
| Rate limiting (Path B) | Free Gemini tier hits 429 on large PDFs | 🟡 Known |
| Legacy TeleGrabber tables | `messages`, `telegram_sessions`, etc. have no RLS | ⚠️ Not AKONY's concern |

---

*AKONY — امتحاناتك، طريقتك — Built for Iraqi educators*
