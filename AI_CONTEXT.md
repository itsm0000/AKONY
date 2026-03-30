# AI Development Context & Pivot Plan

**Current Branch:** `feature/k12-database-pivot`
**Target Audience:** Iraqi K-12 Students and Teachers.
**Current State:** The legacy "Upload PDF" feature is functional. The project is pivoting to a database-driven model where curriculums are pre-loaded via Supabase.

## The Next Task (Your Objective)
The human user wants to implement Phase 1 of the "K-12 Database Pivot". Your goal in this session is to:
1. **Define the Supabase Database Schema** (`schema.sql`) for: `subjects`, `chapters`, `questions`, and `exam_blueprints`.
2. **Build the UI Wizard** on the Landing Page (`/`) allowing users to select: Grade -> Subject -> Exam Type (Ministerial) -> Difficulty (1-10).
3. **Draft the Algorithm** that connects the UI Wizard to generate an `Exam` state object using a generic JSON blueprint algorithm (pulling questions from Supabase matching the selected difficulty).

**CRITICAL:** DO NOT BREAK the existing legacy PDF upload code. Keep it cordoned off as "Path B (Pro Tier)". Ensure imports and existing Zustand state (`examStore.ts`) aren't destroyed in the process.

### Specific Architecture Guidelines
- **Subject MVP:** Grade 12 Physics (السادس العلمي).
- **Blueprint Engine:** Create a system that reads `structure_json` from the `exam_blueprints` table to know exactly what question types and counts to pull (e.g., Q1 is composed of 5 Definitions, etc.).
- **Difficulty Sorting:** When pulling questions for a blueprint, order them by closeness to the user's difficulty slider selection: `ORDER BY ABS(difficulty - USER_SELECTED_DIFFICULTY) LIMIT X`.

### Git Workflow Rules
- You are explicitly instructed to work on the `feature/k12-database-pivot` branch.
- **DO NOT commit to `main`.** Keep all commits isolated to this feature branch until the MVP is fully functional and ready for a Pull Request.
