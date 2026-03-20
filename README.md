<div align="center">

# AKONY — صانع الامتحانات الذكي

**The Smart Exam Builder for Arabic Educators**

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

*Upload your curriculum → Define exam structure → Annotate PDF → Edit content → Export RTL-ready PDF*

</div>

---

## 🎯 What is AKONY?

AKONY is a **free, browser-based exam builder** designed specifically for Arabic-speaking educators. It solves the pain of manually creating exams from textbooks by providing an intelligent, AI-powered workflow:

1. **Upload** your curriculum PDF or textbook images
2. **Analyze** the content instantly with the Google Gemini 2.5 Flash Vision AI
3. **Structure** the exam using AI-suggested categories, Quick-Start templates, and difficulty ratings
4. **Edit** extracted text, add MCQ options, and evaluate the exam balance with AI
5. **Export** a print-ready, optimized RTL PDF with multiple exam versions

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🌙 **Dark-First UI** | Premium glassmorphism design with dark mode default |
| 🔤 **Full RTL/Arabic** | IBM Plex Arabic font, BiDi text engine, RTL layouts |
| 🧠 **Vision AI** | Google Gemini 2.5 Flash for instant PDF content extraction & smart categorization |
| ⚡ **Smart Builder** | Auto-fill questions from PDF, Quick-Start exam templates, and Difficulty sliders (1-10) |
| 📝 **MCQ Editor** | Add 2–6 options with correct answer marking |
| 📊 **Multi-Version** | Create exam versions (أ, ب, ج, د) from one structure |
| 📤 **PDF Export** | Compact A4 RTL PDF with @react-pdf/renderer + answer key generation |
| 🆓 **100% Free** | All UI/client processing runs in-browser, leveraging free-tier APIs |

---

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16 (App Router) | SSR, routing, file-based pages |
| **Language** | TypeScript 5 (strict) | Type safety across all modules |
| **Styling** | Tailwind CSS v4 + shadcn/ui | Design system with 10 UI components |
| **State** | Zustand | Client-side exam state management |
| **Animation** | Framer Motion | Page transitions, micro-interactions |
| **PDF Conversion** | PDF.js v5 | Render uploaded PDFs as images for Vision AI |
| **Vision AI** | Google Gemini SDK | Multimodal analysis, OCR, and smart categorization |
| **Caching** | Supabase | Server-side caching for AI categorization results |
| **PDF Export** | @react-pdf/renderer | Generate A4 RTL exam PDFs |
| **Theme** | next-themes | Dark/light mode with system detection |

---

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (RTL, Arabic fonts, dark mode)
│   ├── globals.css               # Design tokens, glassmorphism, custom utilities
│   ├── page.tsx                  # Landing page (hero + upload zone)
│   └── exam/[id]/
│       ├── scope/page.tsx        # Step 1: Exam scope (title, pages, chapters)
│       ├── structure/page.tsx    # Step 2: Build question structure
│       ├── mark/page.tsx         # Step 3: Annotate PDF with drawing tools
│       ├── edit/page.tsx         # Step 4: Edit content + MCQ options
│       └── preview/page.tsx      # Step 5: Preview + PDF export
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui primitives (10 components)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── tabs.tsx
│   │   └── tooltip.tsx
│   ├── HeroSection.tsx           # Landing page hero with AKONY branding
│   ├── UploadZone.tsx            # Drag-and-drop file upload (PDF/images)
│   ├── ThemeProvider.tsx         # next-themes client wrapper
│   ├── VersionTabs.tsx           # Exam version tabs (أ, ب, ج, د)
│   ├── QuestionCard.tsx          # Interactive question editor card
│   ├── DrawingToolbar.tsx        # Annotation tools (select/rect/circle/freehand)
│   ├── AssignmentSidebar.tsx     # Region-to-question linking sidebar
│   ├── PdfAnnotationViewer.tsx   # PDF canvas + Fabric.js overlay
│   ├── SubQuestionEditor.tsx     # Sub-question text + MCQ editing
│   ├── McqEditor.tsx             # MCQ options editor (2-6 options)
│   └── ExamPdfDocument.tsx       # @react-pdf A4 RTL document template
│
├── hooks/                        # Custom React hooks
│   ├── usePdfViewer.ts           # PDF.js integration (dynamic import)
│   ├── useAnnotationCanvas.ts    # Fabric.js canvas (dynamic import)
│   └── useOcr.ts                 # Tesseract.js OCR (dynamic import)
│
└── lib/                          # Utilities and configuration
    ├── types/exam.ts             # TypeScript interfaces (Exam, Question, etc.)
    ├── stores/examStore.ts       # Zustand state management
    ├── supabase/client.ts        # Supabase browser client
    ├── supabase/server.ts        # Supabase server client
    ├── utils.ts                  # shadcn/ui utilities (cn)
    └── utils/bidi.ts             # BiDi text engine (RTL/LTR detection)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **npm** 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/itsm0000/AKONY.git
cd AKONY

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials (optional for MVP)

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Optional* | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional* | Supabase anonymous key |

*\*Supabase is optional for MVP — all state is managed client-side with Zustand.*

---

## 📋 User Workflow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Upload     │───▶│ AI Analysis  │───▶│  Structure   │
│  PDF/Image   │    │ Google Gemini│    │ Smart Builder│
└──────────────┘    └──────────────┘    └──────────────┘
                                               │
                                               ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Export     │◀───│    Edit      │◀───│ Auto-Fill    │
│  PDF + Key   │    │ Text + MCQ   │    │ Suggestion   │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Step-by-Step

1. **Landing Page** (`/`) — Upload curriculum PDF or textbook images (drag-and-drop)
2. **Analysis** — The app converts the PDF to images and calls the `gemini-2.5-flash` endpoint to extract and categorize questions from the syllabus.
3. **Structure** (`/exam/[id]/structure`) — Apply Quick-Start Templates, set a Global Difficulty, and automatically fill the exam with AI suggestions by clicking the "✨ (Magic Wand)".
4. **Edit** (`/exam/[id]/edit`) — Edit extracted text, add MCQ options, fill in metadata, and optionally click "Evaluate Exam" for an AI review of the test balance.
5. **Preview** (`/exam/[id]/preview`) — Live A4 paper preview, toggle answer key, download the compacted, watermark-free PDF.

---

## 📐 Question Types

| Type | Arabic | Description |
|------|--------|-------------|
| `problem` | مسألة / حساب | Mathematical problems and calculations |
| `definition` | تعريف | Define terms and concepts |
| `mcq` | اختيار من متعدد | Multiple choice (2–6 options) |
| `short_answer` | إجابة قصيرة | Brief written responses |
| `comparison` | مقارنة | Compare and contrast |
| `drawing` | رسم / توضيح | Diagrams and illustrations |

---

## 🎨 Design System

### Color Palette (Dark Mode)

- **Background**: `oklch(0.14 0.004 285)` — Deep zinc-black
- **Cards**: Glassmorphism with `backdrop-blur(12px)` + `rgba(255,255,255,0.04)` border
- **Accent Gradient**: `oklch(0.72 0.19 163)` → `oklch(0.65 0.20 250)` (teal → blue)
- **Typography**: IBM Plex Sans Arabic (body) + Inter (numbers/labels)

### Design Principles

- **RTL-First**: All layouts use CSS logical properties (`start`/`end` instead of `left`/`right`)
- **Dark-First**: Dark mode is the default; light mode is a secondary option
- **Arabic-Optimized**: Line height `1.8`, font size tuned for Arabic readability
- **Glassmorphism**: Cards use `glass-card` utility for frosted-glass effect

---

## 🔧 Technical Highlights

### SSR-Safe Dynamic Imports

All browser-only libraries use `import()` inside `useEffect` to prevent SSR crashes:

```typescript
// PDF.js, Fabric.js, Tesseract.js — all dynamically imported
useEffect(() => {
  async function init() {
    const pdfjsLib = await import("pdfjs-dist");
    // ... use in browser only
  }
  init();
}, []);
```

### BiDi Text Engine

Mixed Arabic/English content is handled with Unicode BiDi markers:

```typescript
import { isRtlText, wrapBidi, cleanOcrText } from "@/lib/utils/bidi";

// Detect RTL → wrap with RLE/LRE markers → clean OCR artifacts
const processed = wrapBidi(cleanOcrText(rawOcrText));
```

### Zustand State Architecture

```typescript
// Single store manages the full exam lifecycle
const useExamStore = create<ExamStore>((set) => ({
  exam: null,
  activeVersionId: null,
  initExam: (title, fileDataUrl) => { /* ... */ },
  addQuestion: (versionId, type) => { /* ... */ },
  addSubQuestion: (versionId, questionId, type) => { /* ... */ },
  // ... CRUD operations with Arabic label generation
}));
```

---

## 🗺️ Development Roadmap

### ✅ Completed

| Sprint | Focus | Status |
|--------|-------|--------|
| Sprint 1 | Foundation (Next.js, Tailwind, shadcn/ui, Supabase setup) | ✅ Done |
| Sprint 2 | Structure Builder (versions, questions, sub-questions) | ✅ Done |
| Sprint 3 | PDF Annotation (PDF.js, Fabric.js, drawing tools, assignment) | ✅ Done |
| Sprint 4 | Content Editing & Export (OCR, MCQ editor, PDF export) | ✅ Done |

### 🔜 Upcoming

| Sprint | Focus | Status |
|--------|-------|--------|
| Sprint 5 | Polish & Launch (responsive design, deploy to Vercel) | 📋 Planned |
| Sprint 6 | Cloud Features (Supabase auth, exam persistence) | 📋 Planned |
| Sprint 7 | Collaboration (sharing, templates marketplace) | 📋 Planned |

### Sprint 5 Tasks

- [ ] Dark/light mode toggle in header
- [ ] Responsive design for tablet/mobile
- [ ] Exam header customization (logo, school info)
- [ ] Answer key generation improvements
- [ ] Deploy to Vercel
- [ ] Performance optimization (lazy loading, code splitting)

---

## 🧪 Building & Testing

```bash
# Development server
npm run dev

# Production build
npm run build

# TypeScript type checking
npx tsc --noEmit

# Start production server
npm start
```

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **Next.js** by Vercel — The React framework
- **shadcn/ui** — Beautiful component primitives
- **PDF.js** by Mozilla — PDF rendering engine
- **Fabric.js** — Canvas manipulation library
- **Tesseract.js** — OCR engine for the browser
- **IBM Plex Arabic** — Beautiful Arabic typeface

---

<div align="center">

**Built with ❤️ for Arabic educators everywhere**

*AKONY — صانع الامتحانات الذكي*

</div>
