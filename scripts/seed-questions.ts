/**
 * AKONY Seeding Pipeline
 * 
 * Uses TeleGrabber-collected PDFs + Gemini 2.5 Pro to extract
 * ministerial physics questions and seed the Supabase database.
 * 
 * Usage:
 *   npx tsx scripts/seed-questions.ts --dir ./telegrabber-output
 * 
 * Prerequisites:
 *   1. TeleGrabber has downloaded Ministerial Physics PDFs to the specified directory
 *   2. .env.local has GEMINI_API_KEY and Supabase credentials set
 *   3. schema.sql has been run in Supabase
 */

import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import * as path from "path";

// ─── Configuration ───────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !GEMINI_API_KEY) {
  console.error("Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ─── Types ───────────────────────────────────────────

interface ExtractedQuestion {
  type: "definition" | "problem" | "explanation" | "activity";
  content: {
    text: string;
    options?: string[];
    correct_answer?: string;
  };
  chapter_number: number;
  difficulty: number;
  marks: number;
}

interface ExtractionResult {
  year: string;
  دور: string;
  questions: ExtractedQuestion[];
}

// ─── Gemini Extraction ──────────────────────────────

async function extractQuestionsFromPDF(pdfPath: string): Promise<ExtractionResult> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const pdfBuffer = fs.readFileSync(pdfPath);
  const base64Pdf = pdfBuffer.toString("base64");
  
  const fileName = path.basename(pdfPath, ".pdf");
  
  const prompt = `You are an expert Iraqi physics curriculum analyzer. Extract ALL questions from this ministerial physics exam PDF.

For each question, determine:
1. type: one of "definition", "problem", "explanation", "activity"
2. content: { "text": "full question text in Arabic", "options": ["..."] (if MCQ), "correct_answer": "..." (if known) }
3. chapter_number: which chapter (1-6) this question belongs to
4. difficulty: 1-10 scale (1=easiest, 10=hardest)
5. marks: how many marks this question is worth

Also determine from the PDF:
- year: the exam year (e.g., "2021")
- دور: which exam round (e.g., "الدور الاول", "الدور الثاني")

Return ONLY valid JSON (no markdown fences):
{
  "year": "2021",
  "دور": "الدور الاول",
  "questions": [
    {
      "type": "definition",
      "content": { "text": "عرّف ..." },
      "chapter_number": 1,
      "difficulty": 3,
      "marks": 2
    }
  ]
}

PDF filename for reference: ${fileName}`;

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: "application/pdf",
        data: base64Pdf,
      },
    },
    { text: prompt },
  ]);

  const responseText = result.response.text();
  
  // Strip markdown fences if present
  const jsonStr = responseText.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  
  try {
    return JSON.parse(jsonStr) as ExtractionResult;
  } catch (e) {
    console.error(`Failed to parse Gemini response for ${fileName}:`, jsonStr.slice(0, 500));
    throw e;
  }
}

// ─── Database Operations ────────────────────────────

async function ensureSubject(grade: number, nameAr: string, nameEn: string): Promise<string> {
  const { data: existing } = await supabase
    .from("subjects")
    .select("id")
    .eq("grade", grade)
    .eq("name_ar", nameAr)
    .single();

  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("subjects")
    .insert({ name_ar: nameAr, name_en: nameEn, grade })
    .select("id")
    .single();

  if (error) throw error;
  console.log(`Created subject: ${nameAr} (Grade ${grade})`);
  return data.id;
}

async function ensureChapters(subjectId: string, chapterNames: Record<number, string>): Promise<Record<number, string>> {
  const chapterIds: Record<number, string> = {};

  for (const [num, name] of Object.entries(chapterNames)) {
    const chapterNum = parseInt(num);
    
    const { data: existing } = await supabase
      .from("chapters")
      .select("id")
      .eq("subject_id", subjectId)
      .eq("chapter_number", chapterNum)
      .single();

    if (existing) {
      chapterIds[chapterNum] = existing.id;
      continue;
    }

    const { data, error } = await supabase
      .from("chapters")
      .insert({ subject_id: subjectId, name_ar: name, chapter_number: chapterNum })
      .select("id")
      .single();

    if (error) throw error;
    chapterIds[chapterNum] = data.id;
    console.log(`Created chapter ${chapterNum}: ${name}`);
  }

  return chapterIds;
}

async function insertQuestions(
  subjectId: string,
  chapterIds: Record<number, string>,
  extraction: ExtractionResult
): Promise<number> {
  const yearTag = `${extraction.year} ${extraction.دور}`;
  
  const rows = extraction.questions.map((q) => ({
    subject_id: subjectId,
    chapter_id: chapterIds[q.chapter_number] || null,
    type: q.type,
    content: q.content,
    difficulty: q.difficulty,
    is_ministerial: true,
    years_appeared: [yearTag],
    marks: q.marks,
  }));

  const { error, count } = await supabase
    .from("questions")
    .insert(rows, { count: "exact" });

  if (error) throw error;
  return count || 0;
}

// ─── Main Pipeline ──────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dirIndex = args.indexOf("--dir");
  
  if (dirIndex === -1 || !args[dirIndex + 1]) {
    console.error("Usage: npx tsx scripts/seed-questions.ts --dir <pdf-directory>");
    process.exit(1);
  }

  const pdfDir = path.resolve(args[dirIndex + 1]);
  
  if (!fs.existsSync(pdfDir)) {
    console.error(`Directory not found: ${pdfDir}`);
    process.exit(1);
  }

  const pdfFiles = fs.readdirSync(pdfDir)
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .map((f) => path.join(pdfDir, f));

  if (pdfFiles.length === 0) {
    console.error(`No PDF files found in ${pdfDir}`);
    process.exit(1);
  }

  console.log(`Found ${pdfFiles.length} PDF files to process`);

  // Grade 12 Physics chapters (Iraqi ministerial curriculum)
  const CHAPTER_NAMES: Record<number, string> = {
    1: "الفيزياء والقياس",
    2: "الحركة",
    3: "القوى والحركة",
    4: "الشغل والطاقة",
    5: "الضغط",
    6: "الحرارة",
  };

  // Ensure subject and chapters exist
  const subjectId = await ensureSubject(12, "الفيزياء", "Physics");
  const chapterIds = await ensureChapters(subjectId, CHAPTER_NAMES);

  let totalQuestions = 0;

  for (const pdfPath of pdfFiles) {
    const fileName = path.basename(pdfPath);
    console.log(`\nProcessing: ${fileName}`);

    try {
      const extraction = await extractQuestionsFromPDF(pdfPath);
      console.log(`  Extracted ${extraction.questions.length} questions (${extraction.year} ${extraction.دور})`);

      const inserted = await insertQuestions(subjectId, chapterIds, extraction);
      console.log(`  Inserted ${inserted} questions`);
      totalQuestions += inserted;

      // Rate limiting: wait 2s between PDFs to avoid Gemini rate limits
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`  Failed to process ${fileName}:`, error);
      // Continue with next PDF
    }
  }

  console.log(`\n✅ Seeding complete! Total questions inserted: ${totalQuestions}`);
}

main().catch(console.error);
