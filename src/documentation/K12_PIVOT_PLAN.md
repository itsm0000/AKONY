# AKONY: K-12 Database Pivot & Dual-Tier Monetization System

> **Branch:** `feature/k12-database-pivot` — All work stays on this branch.
> **Target:** Iraqi K-12 Students and Teachers, starting with Grade 12 Physics (السادس العلمي).
> **Pivot:** From "bring-your-own-PDF" tool to database-driven exam generator with professional freemium model.

---

## Context

This plan supersedes `pivotimplementation_plan` and the Gemini-resolved draft. It incorporates three user decisions:

1. **Post-Generation Flow:** Wizard redirects to Editor by default; toggle to redirect to Preview/Export instead.
2. **Data Seeding:** TeleGrabber + Gemini 2.5 Pro pipeline for real ministerial exams. No mock data.
3. **Monetization UI:** Professional, premium-grade freemium experience modeled after Canva/Notion/Spotify. Ads on free tier, graceful Pro upselling.

---

## 1. Database Schema (`lib/supabase/schema.sql`)

### Tables

```sql
-- Core curriculum structure
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  grade INTEGER NOT CHECK (grade BETWEEN 1 AND 12),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  chapter_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Master question repository
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('definition', 'problem', 'explanation', 'activity', 'comparison', 'drawing', 'mcq', 'short_answer')),
  content JSONB NOT NULL,          -- { "text": "...", "options": [...], "correct_answer": "..." }
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 10),
  is_ministerial BOOLEAN DEFAULT false,
  years_appeared TEXT[],            -- e.g. ["2021 الدور الاول", "2019 الدور الثاني"]
  marks INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exam structure templates (Ministerial, Monthly, etc.)
CREATE TABLE exam_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('daily', 'monthly', 'midterm', 'ministerial')),
  structure_json JSONB NOT NULL,   -- Blueprint recipe (see Section 2)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Per-user UI preferences
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_post_generate_action TEXT DEFAULT 'editor' CHECK (default_post_generate_action IN ('editor', 'preview')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes

```sql
CREATE INDEX idx_questions_subject_difficulty ON questions(subject_id, difficulty);
CREATE INDEX idx_questions_type ON questions(type);
CREATE INDEX idx_questions_ministerial ON questions(is_ministerial) WHERE is_ministerial = true;
CREATE INDEX idx_chapters_subject ON chapters(subject_id);
```

---

## 2. Blueprint JSON Engine

### How It Works

The `exam_blueprints.structure_json` column stores a JSON array that defines the exact structure of an exam type. Each element describes one question block:

```json
[
  {
    "questionNumber": 1,
    "instructions": "أجب عن خمسة من التعاريف الآتية:",
    "query": { "type": "definition", "limit": 6 },
    "marks": 10
  },
  {
    "questionNumber": 2,
    "instructions": "أجب عن المسألة الآتية:",
    "branches": [
      { "branch": "أ", "query": { "type": "problem", "chapter_weights": [1, 2], "limit": 1 }, "marks": 10 },
      { "branch": "ب", "query": { "type": "problem", "chapter_weights": [3, 5], "limit": 1 }, "marks": 10 }
    ]
  }
]
```

### Generation Algorithm (Server Action)

```typescript
// lib/actions/generateExam.ts
async function generateExamFromBlueprint(
  subjectId: string,
  blueprintId: string,
  difficulty: number
): Promise<Exam> {
  // 1. Fetch blueprint structure_json
  // 2. For each question block:
  //    - Query: SELECT * FROM questions 
  //      WHERE subject_id = ? AND type = ? 
  //      ORDER BY ABS(difficulty - ?) LIMIT ?
  //    - Populate question block with matched questions
  // 3. Return fully populated Exam object
  // 4. Hydrate Zustand store with the result
}
```

### Difficulty Scoring

Questions are selected by closeness to the user's chosen difficulty:
```sql
SELECT * FROM questions
WHERE subject_id = :subject_id
  AND type = :question_type
ORDER BY ABS(difficulty - :user_difficulty)
LIMIT :limit;
```

---

## 3. Application UI Flow

### 3a. Landing Page Redesign (`src/app/page.tsx`)

The landing page becomes a professional dual-path entry point.

**Layout (top to bottom):**
1. **Sticky Header:** AKONY logo, "Login" / "Sign Up" buttons (or user avatar if authenticated).
2. **Hero Section:** Clean, minimal. Headline: "امتحاناتك، طريقتك" (Your exams, your way). Subheadline explaining the value in 1-2 lines.
3. **Path Selector Cards (side by side on desktop, stacked on mobile):**
   - **Path A — امتحاناتي (My Exams) [FREE]:** "Generate exams from Iraq's official K-12 curriculum." Large CTA button: "ابدأ الآن" (Start Now). Opens the K-12 Wizard.
   - **Path B — ارفع ملفك (Upload Your File) [PRO]:** "Upload your own PDF and let AI build the exam." Shows a subtle lock icon. CTA: "ترقية إلى Pro" (Upgrade to Pro). If user is already Pro, CTA changes to "ابدأ" (Start).
4. **"Why Pro?" Comparison Section:** Clean table/cards comparing Free vs Pro features. Below the fold.
5. **Ad Slot:** Non-intrusive banner (728x90 leaderboard or responsive) below the hero. Collapses gracefully if no ad loads.

### 3b. K-12 Wizard (4-Step Flow)

Route: `/wizard` (new route, separate from the existing `/exam/[id]` flow)

| Step | UI Element | Description |
|------|-----------|-------------|
| **1. Grade** | Card selector | Grade 1-12 cards. MVP: only Grade 12 is enabled, others show "قريباً" (Coming Soon) |
| **2. Subject** | Card selector | Physics, Chemistry, Biology, etc. MVP: only Physics is enabled |
| **3. Exam Type** | Card selector | Ministerial, Monthly, Midterm. MVP: only Ministerial is enabled |
| **4. Difficulty** | Slider (1-10) + Toggle | Difficulty slider with preview of what each level means. **"Default to Preview" toggle switch** at bottom |

**Step 4 — The Toggle:**
```
┌─────────────────────────────────────────────┐
│  صعوبة الامتحان                              │
│  ◄─────────●──────────────────►              │
│           7/10                               │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │  بعد الإنشاء، انتقل إلى:               │ │
│  │                                         │ │
│  │  المحرر          ◯━━━━━━━━  المعاينة   │ │
│  │  (Editor)         (toggle)  (Preview)   │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  [ توليد الامتحان ]  (Generate Exam)         │
└─────────────────────────────────────────────┘
```

- Default state: toggle OFF → redirects to `/exam/[id]/edit` after generation
- Toggle ON → redirects to `/exam/[id]/preview` after generation
- Preference saved to `user_preferences.default_post_generate_action` (if authenticated) or `localStorage` (if not)

**Post-Generation Flow:**
```
[Generate Exam Button]
    │
    ▼
[Server Action: generateExamFromBlueprint()]
    │
    ▼
[Hydrate Zustand examStore with generated exam]
    │
    ├── toggle OFF ──► router.push('/exam/{new-id}/edit')
    │
    └── toggle ON ───► router.push('/exam/{new-id}/preview')
```

**Important:** The generated exam gets a new UUID and is stored in Zustand (same store as the existing PDF flow). This means the existing `/exam/[id]/edit` and `/exam/[id]/preview` pages work identically for both flows — no code duplication needed.

### 3c. Editor & Preview Routes (Existing — No Changes Needed)

The existing routes work for both flows:
- `/exam/[id]/edit` — Full editor with question cards, metadata, MCQ editor
- `/exam/[id]/preview` — A4 preview, version selector, PDF export

The only addition: a toggle/button in the editor header to quickly switch to preview, and vice versa.

---

## 4. Data Seeding Pipeline (TeleGrabber + Gemini)

> **No mock data. No placeholder seeding. The MVP seeds exclusively with real ministerial exam content.**

### Pipeline Steps

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌───────────┐
│ TeleGrabber   │────►│ Raw PDFs in      │────►│ Gemini 2.5 Pro  │────►│ Supabase  │
│ (Telegram)    │     │ local storage    │     │ Extraction      │     │ INSERT    │
└──────────────┘     └──────────────────┘     └──────────────────┘     └───────────┘
```

1. **TeleGrabber** fetches Ministerial Physics PDFs (2013–2025) from Iraqi Telegram channels (e.g., "ملازم السادس", "امتحانات وزارة الفيزياء").

2. **Processing script** (`scripts/seed-questions.ts`):
   - Reads each PDF from local storage
   - Sends pages to Gemini 2.5 Pro with structured prompt:
     ```
     Extract all questions from this ministerial exam PDF.
     For each question, return:
     - type: definition | problem | explanation | activity
     - content: { text, options?, correct_answer? }
     - chapter: which chapter it belongs to
     - difficulty: estimated 1-10 based on complexity
     - year: which exam year/دور this is from
     ```
   - Gemini returns structured JSON for each question

3. **Supabase INSERT:**
   - Create subject record: "الفيزياء — الصف السادس العلمي"
   - Create chapter records for chapters 1–6
   - INSERT each extracted question into `questions` table with `is_ministerial: true` and `years_appeared` populated

### What This Means for Development

- **No need to write a mock seeding script.** The database starts empty until TeleGrabber pipeline runs.
- **Development can proceed with an empty `questions` table** — the blueprint engine handles empty results gracefully (shows "No questions available for this configuration" message).
- **The seed script is a one-time batch operation** — run it after TeleGrabber has collected the PDFs.

---

## 5. Freemium Monetization System

### Design Philosophy

> Model after Canva, Notion, Spotify — graceful, value-driven, never aggressive.
> Free users should feel empowered, not punished. Pro should feel aspirational, not gatekept.

### 5a. Tier Definitions

| Feature | Free | Pro ($9/mo) |
|---------|------|-------------|
| K-12 Database Exam Generation | ✅ Full access | ✅ Full access |
| Custom PDF Upload (Path B) | ❌ Locked | ✅ Unlimited |
| Exports per day | 3/day | Unlimited |
| Watermark on PDF | ✅ "أكُوني" watermark | ❌ No watermark |
| Ads | ✅ Banner ads | ❌ Ad-free |
| Question Bank | ❌ | ✅ Save & reuse |
| Templates | ❌ | ✅ Save custom |
| AI Auto-Grading (future) | ❌ | ✅ |

### 5b. Ad Integration Architecture

**Ad Slots (defined as reserved containers):**
```tsx
// components/AdSlot.tsx
interface AdSlotProps {
  slot: 'leaderboard' | 'sidebar' | 'inline';
  className?: string;
}

// Renders a fixed-size container that:
// 1. Shows Google AdSense ad if loaded
// 2. Collapses to display:none if ad fails to load
// 3. Never appears inside exam content area
// 4. Is hidden entirely for Pro users
```

**Placement:**
- **Landing page:** Leaderboard (728x90) below hero section
- **Editor sidebar:** Sidebar ad (300x250) in the right panel, below question list
- **Preview page:** No ads (exam content area is sacred)

**Technical:**
- Use Google AdSense with responsive ad units
- Container has `min-height` to prevent layout shift
- `onError` handler collapses the container
- Pro users: AdSlot returns `null` (no container rendered)

### 5c. Watermark System

```tsx
// lib/services/pdfExporter.ts
function addWatermark(pdfDoc: Doc, userTier: 'free' | 'pro') {
  if (userTier === 'free') {
    // Add subtle diagonal watermark text:
    // "تم إنشاؤه بواسطة أكُوني — ترقّى إلى Pro لإزالة العلامة"
    // Semi-transparent, does not obscure content
    // Positioned center-page, rotated 45°
  }
}
```

### 5d. Export Limit System

```tsx
// lib/services/exportLimiter.ts
interface ExportStatus {
  remaining: number;  // 3 for free, Infinity for pro
  resetsAt: Date;     // Daily reset at midnight Baghdad time
}

// Check before export:
// - If remaining > 0: allow, decrement, show toast "X exports remaining today"
// - If remaining === 0: show modal with upgrade CTA
// - If remaining === 1: show subtle toast "1 export remaining. Pro = unlimited."
```

**Storage:** `localStorage` for free users (daily counter with date key), `user_preferences` table for authenticated users.

### 5e. Upsell Touchpoints (Graceful, Not Aggressive)

| Touchpoint | Trigger | UI |
|-----------|---------|-----|
| **Export Modal** | User clicks "Download PDF" (free tier) | Show watermark preview + "Remove with Pro" CTA button |
| **Export Limit Toast** | User has 1 export remaining | Subtle toast: "1 تصدير متبقي اليوم. Pro = غير محدود" |
| **Locked Feature Cards** | User views sidebar/settings | Pro features visible with lock icon + "Upgrade to unlock" label |
| **Landing Page Section** | Scroll below hero | "لماذا Pro؟" comparison table (Free vs Pro columns) |
| **Editor Header Banner** | Free tier user in editor | Subtle, dismissible banner: "Upgrade to Pro for watermark-free exports" |
| **PDF Upload Path** | User clicks Path B card | Modal: "Upload custom PDFs with Pro" + one-click upgrade |

**What We Do NOT Do:**
- ❌ No fake urgency timers ("Offer expires in 24h!")
- ❌ No nagging modals that block the core flow
- ❌ No hidden cancellation or dark patterns
- ❌ No feature removal after trial ends — free tier always works for K-12

### 5f. UI Design Direction

**Typography:** Cairo or Tajawal (Arabic-first Google Fonts), proper RTL throughout.

**Color Palette:**
- Primary: Deep blue (#1E3A5F) — academic, trustworthy
- Accent: Gold (#D4A843) — premium, aspirational
- Background: White (#FFFFFF) with subtle gray (#F8F9FA) sections
- Text: Near-black (#1A1A2E) for readability
- Dark mode: Deep navy (#0F172A) background, light text

**Component Style:**
- shadcn/ui with consistent 12px border-radius
- Soft box shadows (0 2px 8px rgba(0,0,0,0.08))
- Card-based layouts for everything
- Generous whitespace — let content breathe
- Smooth Framer Motion transitions between wizard steps

**Branding:**
- AKONY logo: Clean, modern wordmark in Arabic + English
- Tagline: "امتحاناتك، طريقتك"
- Favicon: Minimal "أ" lettermark

**Responsive:**
- Mobile-first (most Iraqi students use phones)
- Breakpoints: 375px (mobile), 768px (tablet), 1024px+ (desktop)
- Wizard cards stack vertically on mobile, grid on desktop

---

## 6. Implementation Order

| Step | Task | Files | Dependencies |
|------|------|-------|-------------|
| **1** | Database Schema | `lib/supabase/schema.sql` | None |
| **2** | Blueprint Engine (server action) | `lib/actions/generateExam.ts`, `lib/supabase/queries.ts` | Step 1 |
| **3** | Wizard UI (4 steps + redirect logic) | `app/wizard/page.tsx`, `components/wizard/*.tsx` | Step 2 |
| **4** | Editor/Preview routing (ensure toggle works) | `app/exam/[id]/edit/page.tsx`, `app/exam/[id]/preview/page.tsx` | Step 3 |
| **5** | Seeding Pipeline | `scripts/seed-questions.ts` | Step 1 |
| **6** | Monetization UI (watermark, ads, limits, CTAs) | `components/AdSlot.tsx`, `lib/services/pdfExporter.ts`, `lib/services/exportLimiter.ts` | Step 3 |
| **7** | Landing Page Polish (dual-path, "Why Pro?", responsive) | `app/page.tsx`, `components/HeroSection.tsx` | Steps 3, 6 |

### Step Details

**Step 1 — Database Schema:**
- Write `schema.sql` with all 5 tables + indexes
- Run migration in Supabase dashboard
- Verify tables exist and relationships work

**Step 2 — Blueprint Engine:**
- Create `lib/supabase/queries.ts` with typed query functions
- Create `lib/actions/generateExam.ts` server action
- Action takes `(subjectId, blueprintId, difficulty)` → returns `Exam` object
- Hydrates Zustand `examStore` with generated exam

**Step 3 — Wizard UI:**
- Create `/wizard` route with 4-step flow
- Step components: `GradeSelector`, `SubjectSelector`, `ExamTypeSelector`, `DifficultySlider`
- Difficulty step includes the post-generation redirect toggle
- On "Generate" click: call server action → read toggle state → redirect to `/exam/[id]/edit` or `/exam/[id]/preview`
- Save toggle preference to `localStorage` (and `user_preferences` if authenticated)

**Step 4 — Editor/Preview Routing:**
- Verify existing `/exam/[id]/edit` and `/exam/[id]/preview` pages work with database-generated exams
- Add quick-switch button in editor header (Editor ↔ Preview)
- No major changes needed — the Zustand store is already the single source of truth

**Step 5 — Seeding Pipeline:**
- Create `scripts/seed-questions.ts` (Node.js script, not Next.js route)
- Reads PDFs from a local directory (output of TeleGrabber)
- Sends each PDF to Gemini 2.5 Pro for structured extraction
- INSERTs results into Supabase
- Run once after TeleGrabber has collected the data

**Step 6 — Monetization UI:**
- Create `AdSlot` component with graceful collapse
- Add watermark logic to PDF export service
- Create export limiter with daily counter
- Add upgrade CTAs at export modal, editor banner, and landing page

**Step 7 — Landing Page Polish:**
- Redesign hero section with Arabic-first messaging
- Add Path A (K-12) and Path B (Pro Upload) cards
- Add "Why Pro?" comparison section below fold
- Integrate ad slot
- Responsive testing at 375px, 768px, 1024px+

---

## 7. Verification Plan

### Automated Testing

1. **Blueprint Engine Test:**
   - Mock Supabase with test data (insert known questions)
   - Call `generateExamFromBlueprint()` with known blueprint
   - Assert returned exam matches expected structure
   - Assert difficulty ordering is correct

2. **Wizard Redirect Test:**
   - Mock exam generation
   - Toggle OFF → assert redirect to `/exam/[id]/edit`
   - Toggle ON → assert redirect to `/exam/[id]/preview`
   - Assert preference persists in localStorage

3. **Export Limiter Test:**
   - Set counter to 0 → assert export blocked
   - Set counter to 1 → assert toast shown
   - Set counter to 3 → assert export allowed, counter decremented

### Manual Verification

1. **Full Wizard Flow:**
   - Navigate to `/wizard`
   - Select Grade 12 → Physics → Ministerial → Difficulty 7
   - Toggle OFF → click Generate → verify redirect to Editor
   - Go back, toggle ON → click Generate → verify redirect to Preview

2. **Dual-Path Landing:**
   - Path A card → opens wizard
   - Path B card → shows Pro gate (or opens upload if Pro)

3. **Free Tier Experience:**
   - Generate exam → export PDF → verify watermark present
   - Export 3 times → verify counter decrements
   - Export 4th time → verify blocked with upgrade CTA

4. **Ad Slots:**
   - Verify ad containers render on landing page and editor sidebar
   - Verify ads collapse gracefully when no ad loads
   - Verify ads are hidden for Pro users

5. **Legacy Flow:**
   - Upload PDF via Path B → verify existing flow still works
   - Navigate through scope → structure → edit → preview
   - Verify no regressions in the original PDF-based pipeline

### Browser Testing
- Chrome, Firefox, Safari
- Responsive: 375px, 768px, 1440px
- Dark mode and light mode
- RTL text rendering (Arabic + English mixed content)
