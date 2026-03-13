# AKONY — Exam Builder: Implementation Plan

> **Goal:** Build a cross-platform exam generation tool that lets teachers upload curriculum PDFs, declare exam structure, visually mark questions from the material, and auto-generate cleanly formatted, RTL-compatible exam documents in multiple versions.

> **Architecture:** Next.js 14 App Router monolith with Supabase (auth + storage + DB), PDF.js for viewer/annotation, Tesseract.js for OCR, and React-PDF for export. Arabic-first RTL design.

> **Tech Stack:** Next.js 14, React 18, TypeScript, Supabase, PDF.js, Fabric.js, Tesseract.js, react-pdf/renderer, Tailwind CSS, shadcn/ui, Framer Motion

---

## User Review Required

> [!IMPORTANT]
> **Naming:** The working title is **AKONY**. Please confirm or suggest a different product name.

> [!IMPORTANT]
> **Free AI APIs:** We will use Tesseract.js (fully free, runs in-browser) for OCR. For smarter text extraction, we can optionally integrate Google Cloud Vision (free tier: 1,000 units/month) or Gemini API (free tier). Please confirm which free AI tier you'd prefer.

> [!WARNING]
> **PDF Annotation:** Drawing on PDFs in-browser is complex. We have two approaches:
> 1. **PDF.js + Fabric.js** (fully free, more work) — We overlay a Fabric.js canvas on the PDF page for drawing/circling.
> 2. **PSPDFKit** (has a free tier, easier but proprietary) — Drop-in annotation SDK.
>
> I recommend **Option 1** (PDF.js + Fabric.js) since you want everything free. Please confirm.

---

## Phase Overview

| Phase | Name | Scope | Status |
|-------|------|-------|--------|
| **MVP** | Core Builder | Upload, structure, mark, generate | 🔄 In Progress (80%) |
| **Phase 2** | Smart Features | OCR auto-extract, question bank, templates | 🔲 Planned |
| **Phase 3** | Collaboration | Multi-teacher, sharing, school accounts | 🔲 Future |
| **Phase 4** | Mobile | React Native / Capacitor wrapper | 🔲 Future |
| **Phase 5** | Monetization | Pricing tiers, premium features | 🔲 Future |

---

## MVP — Proposed Changes

### Component 1: Project Scaffolding

#### [NEW] Project initialization

- Scaffold Next.js 14 with App Router, TypeScript, Tailwind, ESLint
- Install: `shadcn/ui`, `framer-motion`, `@supabase/supabase-js`
- Configure Tailwind for RTL (`dir="rtl"`) with CSS logical properties
- Set up Arabic-first typography (IBM Plex Arabic + Inter)
- Configure dark mode with `next-themes`

**Files to create:**
- `c:\Users\MT\Projects\AKONY\package.json`
- `c:\Users\MT\Projects\AKONY\tailwind.config.ts`
- `c:\Users\MT\Projects\AKONY\app\layout.tsx` (root layout with RTL, fonts, theme)
- `c:\Users\MT\Projects\AKONY\app\globals.css`
- `c:\Users\MT\Projects\AKONY\lib\supabase\client.ts`
- `c:\Users\MT\Projects\AKONY\lib\supabase\server.ts`

---

### Component 2: Landing & Upload Screen

#### [NEW] Landing page with PDF upload

The first screen teachers see. Premium dark-mode design with glassmorphism cards.

**Flow:**
1. Hero section with app name, tagline, and CTA
2. Upload zone (drag-and-drop or file picker) accepting `.pdf` and image files ([.jpg](file:///c:/Users/MT/Projects/AKONY/material/photo_9_2026-03-08_22-29-37.jpg), `.png`)
3. After upload, redirect to Scope Declaration screen

**Files:**
- `c:\Users\MT\Projects\AKONY\app\page.tsx` — Landing/home page
- `c:\Users\MT\Projects\AKONY\app\components\UploadZone.tsx` — Drag-and-drop upload component
- `c:\Users\MT\Projects\AKONY\app\components\HeroSection.tsx`

---

### Component 3: Scope Declaration

#### [NEW] Chapter/page range selector

After uploading, the teacher declares which portion of the material the exam covers.

**Features:**
- PDF thumbnail preview strip (scrollable)
- Page range selector: "From page ___ to page ___"
- Chapter input fields (text-based, e.g., "Chapters 8–10")
- "Next" button to proceed to Exam Structure

**Files:**
- `c:\Users\MT\Projects\AKONY\app\exam\[id]\scope\page.tsx`
- `c:\Users\MT\Projects\AKONY\app\components\PageRangeSelector.tsx`
- `c:\Users\MT\Projects\AKONY\app\components\PdfThumbnailStrip.tsx`

---

### Component 4: Exam Structure Builder

#### [NEW] Question structure declaration UI

This is the "skeleton" builder — no content yet, just structure.

**Features:**
- Add Question button → creates Q1, Q2, Q3...
- For each question, declare:
  - **Type dropdown:** Problem/Calculation, Definitions, Comparison, Drawing/Illustration, Multiple Choice, Short Answer
  - **Sub-questions:** Add sub-question (a, b, c...) with individual type declarations
  - **Rules:** "Answer X out of Y" toggle
- Drag-and-drop reordering of questions
- Version tabs: Version A, Version B, etc. (add version button)
- Each version gets its own independent structure OR can clone from another version

**Files:**
- `c:\Users\MT\Projects\AKONY\app\exam\[id]\structure\page.tsx`
- `c:\Users\MT\Projects\AKONY\app\components\ExamStructureBuilder.tsx`
- `c:\Users\MT\Projects\AKONY\app\components\QuestionCard.tsx`
- `c:\Users\MT\Projects\AKONY\app\components\SubQuestionRow.tsx`
- `c:\Users\MT\Projects\AKONY\app\components\VersionTabs.tsx`
- `c:\Users\MT\Projects\AKONY\lib\types\exam.ts` — TypeScript types for exam structure

---

### Component 5: PDF Annotation / Content Marking

#### [NEW] Interactive PDF viewer with drawing tools

The core feature. Teacher opens the PDF, draws on it to mark content for each question slot.

**Architecture:**
- PDF.js renders each page to a `<canvas>`
- Fabric.js overlay canvas on top for annotations
- Toolbar: Circle, Rectangle, Freehand draw, Text label
- When teacher draws a region, a popup asks: "Assign to which question?" → dropdown of Q1(a), Q1(b), Q2, etc.
- Each marked region is tagged with a question ID and stored
- Side panel shows list of all assignments: "Q1(a) → Page 82, region [thumbnail]"

**Files:**
- `c:\Users\MT\Projects\AKONY\app\exam\[id]\mark\page.tsx`
- `c:\Users\MT\Projects\AKONY\app\components\PdfAnnotationViewer.tsx`
- `c:\Users\MT\Projects\AKONY\app\components\AnnotationToolbar.tsx`
- `c:\Users\MT\Projects\AKONY\app\components\RegionAssigner.tsx`
- `c:\Users\MT\Projects\AKONY\app\components\AssignmentSidebar.tsx`
- `c:\Users\MT\Projects\AKONY\lib\hooks\usePdfRenderer.ts`
- `c:\Users\MT\Projects\AKONY\lib\hooks\useFabricCanvas.ts`

---

### Component 6: Content Extraction & Editing

#### [NEW] OCR extraction and manual editing

After marking regions, the app extracts text from each marked region.

**Features:**
- Tesseract.js OCR runs on each marked region (supports Arabic + English)
- Extracted text shown in editable text fields per question
- Teacher can correct OCR errors or modify values (like changing 0.20m → 0.40m)
- For MCQ options: auto-detect A), B), C), D) patterns
- Preview pane shows how the question will look

**Files:**
- `c:\Users\MT\Projects\AKONY\app\exam\[id]\edit\page.tsx`
- `c:\Users\MT\Projects\AKONY\app\components\ExtractedContentEditor.tsx`
- `c:\Users\MT\Projects\AKONY\app\components\McqOptionsEditor.tsx`
- `c:\Users\MT\Projects\AKONY\app\components\QuestionPreview.tsx`
- `c:\Users\MT\Projects\AKONY\lib\services\ocrService.ts`

---

### Component 7: Exam Generation & Export

#### [NEW] RTL-aware exam document generator

Final step: generate the clean, formatted exam document.

**Features:**
- Live preview of the complete exam (both versions side by side)
- Built-in RTL/BiDi text engine that handles Arabic + English math correctly
- Export formats: PDF (primary), Google Docs compatible text, Word (.docx)
- Exam header customization (school name, date, class, student name field)
- Answer key generation (separate document)

**Files:**
- `c:\Users\MT\Projects\AKONY\app\exam\[id]\preview\page.tsx`
- `c:\Users\MT\Projects\AKONY\app\components\ExamPreview.tsx`
- `c:\Users\MT\Projects\AKONY\app\components\ExamHeader.tsx`
- `c:\Users\MT\Projects\AKONY\lib\services\examGenerator.ts`
- `c:\Users\MT\Projects\AKONY\lib\services\pdfExporter.ts`
- `c:\Users\MT\Projects\AKONY\lib\services\bidiTextEngine.ts`

---

### Component 8: State Management & Data Layer

#### [NEW] Zustand store + Supabase persistence

**Local state (Zustand):**
- Current exam structure, annotations, extracted content
- Supports undo/redo for annotations

**Persistence (Supabase):**
- User authentication (email/password, Google OAuth)
- PDF file storage (Supabase Storage)
- Exam data in PostgreSQL (exam → versions → questions → sub-questions → content)

**Files:**
- `c:\Users\MT\Projects\AKONY\lib\stores\examStore.ts`
- `c:\Users\MT\Projects\AKONY\lib\stores\annotationStore.ts`
- `c:\Users\MT\Projects\AKONY\lib\supabase\schema.sql`
- `c:\Users\MT\Projects\AKONY\lib\supabase\queries.ts`

---

## Phase 2 — Smart Features (Post-MVP)

| Feature | Description |
|---------|-------------|
| **Question Bank** | Save marked questions with tags (chapter, topic, difficulty). Reuse across exams. |
| **Exam Templates** | Save exam structures as templates. "Standard Physics Midterm" = 1 click. |
| **Auto-Versioning** | Mark a pool of questions → app auto-distributes across versions. |
| **AI Question Suggestions** | Given a chapter scope, AI suggests similar questions or generates new ones. |
| **Difficulty Balancing** | Tag questions Easy/Medium/Hard → auto-balance across versions. |
| **Batch Image Upload** | Upload photos of textbook pages (not just PDF). |

## Phase 3 — Collaboration (Future)

| Feature | Description |
|---------|-------------|
| **School Accounts** | Admin creates school, invites teachers. |
| **Shared Question Bank** | Teachers in same school share marked questions. |
| **Exam Review Flow** | Head of department reviews/approves exam before printing. |

## Phase 4 — Mobile (Future)

| Feature | Description |
|---------|-------------|
| **React Native App** | Camera-first workflow: snap textbook pages → mark → generate. |
| **Offline Mode** | Generate exams without internet. |

## Phase 5 — Monetization (Future)

| Tier | Features |
|------|----------|
| **Free** | 3 exams/month, 1 version per exam, PDF export only |
| **Pro ($9/mo)** | Unlimited exams, unlimited versions, question bank, templates |
| **School ($29/mo)** | Everything + collaboration, shared bank, review flow |

---

## Verification Plan

### Automated Tests

Since this is a **new project**, we'll set up testing infrastructure from the start:

1. **Unit Tests (Vitest)**
   - `bidiTextEngine.ts` — Verify Arabic + English text renders correctly
   - `examGenerator.ts` — Verify exam structure → document conversion
   - `ocrService.ts` — Mock OCR results and verify extraction
   - Command: `npx vitest run`

2. **Component Tests (Vitest + React Testing Library)**
   - `ExamStructureBuilder` — Adding/removing questions and sub-questions
   - `VersionTabs` — Switching versions, cloning structures
   - `McqOptionsEditor` — Adding/editing MCQ choices
   - Command: `npx vitest run --config vitest.config.ts`

### Manual Verification

1. **Upload Flow:** Upload a PDF → verify it appears in the scope selector → set page range → proceed
2. **Structure Builder:** Add 4 questions with various types → add sub-questions → reorder → verify the structure matches
3. **PDF Annotation:** Open PDF → draw circle on a region → assign to Q1(a) → verify it appears in sidebar
4. **Content Editing:** After OCR extraction → edit a value → verify the preview updates
5. **Export:** Generate PDF → open in Adobe Reader → verify RTL text is correct, math symbols render properly
6. **RTL Stress Test:** Create an exam mixing Arabic definitions with English math equations → export → verify no BiDi glitching

### Browser Testing

- Test in Chrome, Firefox, and Safari
- Test responsive layouts at 375px (mobile), 768px (tablet), 1440px (desktop)
- Verify dark/light mode toggle works correctly
