# AKONY: K-12 Database Pivot & Dual-Tier System

This plan details the architectural pivot from a solely "bring-your-own-PDF" tool to a database-driven exam generator targeting Iraqi K-12 curriculums, starting with a Grade 12 Physics MVP.

## User Review Required

> [!WARNING]
> **This is a massive pivot.** It shifts the project from a purely frontend local-state app to a backend-reliant web application. We need your explicit sign-off on the proposed Database Architecture and the Exam Generation Algorithm before writing code.

> [!IMPORTANT]
> The legacy "Upload PDF & Analyze" tool will be preserved but cordoned off as a "Pro/College" tier. We will address fixing its bugs in a separate sprint, keeping our immediate focus on the K-12 Physics MVP.

## Proposed Changes

### 1. Database Architecture (Supabase / PostgreSQL)

We will introduce a highly structured database schema to hold the extracted curriculums and the strict Ministerial Blueprints. 

#### [NEW] Database Schema Definition
We will create the following tables in Supabase:
- **`subjects`**: (e.g., Physics, Grade 12)
- **`chapters`**: Linked to subjects.
- **`questions`**: The master repository.
  - Fields: `id`, `subject_id`, `chapter_id`, `type` (definition, problem, etc.), `content`, `difficulty` (1-10), `is_ministerial` (boolean), `years_appeared` (array of strings, e.g., ["2021 الدور الاول"]).
- **`exam_blueprints`**: Stores the exact structure of how a Ministerial or Monthly exam should look.
  - Fields: `id`, `subject_id`, `exam_type` (daily, monthly, ministerial), `structure_json`.

### 2. The Blueprint JSON Engine
To mimic the EXACT format of a Ministerial Exam (e.g. Q1 is definitions, Q2-A is a problem), the `exam_blueprints.structure_json` will act as a template recipe.

Example Recipe for Q1 of a Ministerial Exam:
```json
{
  "questionNumber": 1,
  "instructions": "أجب عن خمسة من التعاريف الآتية:",
  "query": { "type": "definition", "limit": 6 }
}
```
When the user picks **Grade 12 Physics -> Ministerial -> Difficulty 8**, the backend pulls the Ministerial JSON blueprint for Physics. For every question block, it queries the `questions` table and scores questions based on how close their difficulty is to `8` (`ORDER BY ABS(difficulty - 8) LIMIT 6`).

### 3. Application UI Flow (Dual Tier)
#### [MODIFY] `src/app/page.tsx`
We will redesign the landing page into a split path, prioritizing the database flow:
- **Path A (K-12 Iraqi Pre-made)**: "Select Grade" -> "Select Subject" -> "Exam Type" -> "Difficulty" -> Instantly Generates Exam in the Editor.
- **Path B (Pro Tier / University)**: "Upload Custom PDF" (The existing Gemini Vision feature). *Future scope: Photograph your answers to the generated test, and the AI will auto-grade it and provide analytics on weaknesses/strengths.*

### 4. Data Ingestion Strategy (Seeding the Database)
An autonomous magical AI that wanders the web will fail because Iraqi curriculums are locked inside watermarked PDFs and Telegram channels. However, **you recently built TeleGrabber**. 
We will use a custom data-pipeline:
1. Point `TeleGrabber` to popular Iraqi Telegram channels (e.g., "ملازم السادس").
2. Download the Ministerial Physics PDFs (2013-2023).
3. Run a backend script that feeds these PDFs into Gemini 2.5 Pro to extract the text, categorize the questions, and INSERT them directly into our Supabase `questions` table.

### 5. Grade 12 Physics Ministerial Blueprint
Based on analysis, the "Ministerial Blueprint" (هيكلية الاسئلة الوزارية) for Physics is highly structured. We will encode this into `exam_blueprints`:
- **Total Marks:** 130-150 (to allow for "ترك" / skipping).
- **Structure:** 5-6 Questions, each with branches (أ، ب، ج).
- **Distribution:**
  - *Math Problems (مسائل):* ~50-55 marks.
  - *Conceptual (شرحيات / تعاريف، تعاليل):* ~40-45 marks.
  - *Activities (نشاطات):* ~10-15 marks.
- **Chapter Weighting:** Chapters 1, 2, 3, and 5 carry the heaviest weight (20-25 marks each).

## Verification Plan

### Automated/Dev Testing
- Write a Supabase Edge Function / Next.js Action that translates a JSON Blueprint + Difficulty into a fully populated `Exam` object in Zustand.

### Manual Verification
- Go through the new UI Flow.
- Generate a "Ministerial" 12th Grade Physics exam.
- Ensure the slider accurately pulls questions of the correct difficulty from the Postgres database.
- Ensure the legacy "Upload PDF" still routes to the old pipeline perfectly.
