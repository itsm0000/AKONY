/**
 * Blueprint Engine — Generate Exam from Database
 * 
 * Server action that takes a blueprint + difficulty and returns
 * a fully populated Exam object ready for the Zustand store.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  BlueprintQuestion,
  BlueprintBranch,
  DbQuestion,
} from "@/lib/supabase/queries";

// ─── Types ───────────────────────────────────────────

interface GenerateExamParams {
  subjectId: string;
  examType: string;
  difficulty: number;
}

interface GeneratedExamQuestion {
  id: string;
  questionNumber: number;
  instructions: string;
  type: string;
  subQuestions: {
    id: string;
    label: string;
    type: string;
    contentText: string;
    marks: number;
    sourceYears: string[];
  }[];
  points: number;
}

interface GenerateExamResult {
  success: boolean;
  exam?: {
    id: string;
    title: string;
    subjectName: string;
    questions: GeneratedExamQuestion[];
    totalMarks: number;
  };
  error?: string;
}

// ─── Main Server Action ─────────────────────────────

export async function generateExamFromBlueprint(
  params: GenerateExamParams
): Promise<GenerateExamResult> {
  try {
    const supabase = await createClient();
    const { subjectId, examType, difficulty } = params;

    // 1. Fetch subject info
    const { data: subject, error: subjectError } = await supabase
      .from("subjects")
      .select("*")
      .eq("id", subjectId)
      .single();

    if (subjectError || !subject) {
      return { success: false, error: "Subject not found" };
    }

    // 2. Fetch blueprint
    const { data: blueprint, error: blueprintError } = await supabase
      .from("exam_blueprints")
      .select("*")
      .eq("subject_id", subjectId)
      .eq("exam_type", examType)
      .single();

    if (blueprintError || !blueprint) {
      return { success: false, error: "Exam blueprint not found" };
    }

    const structureJson = blueprint.structure_json as BlueprintQuestion[];

    // 3. For each question block in the blueprint, fetch matching questions
    const generatedQuestions: GeneratedExamQuestion[] = [];
    let totalMarks = 0;

    for (const block of structureJson) {
      if (block.branches) {
        // Question with branches (أ، ب، ج)
        const subQuestions = [];
        let questionPoints = 0;

        for (const branch of block.branches) {
          const questions = await fetchQuestionsByQuery(
            supabase,
            subjectId,
            branch.query,
            difficulty
          );

          if (questions.length > 0) {
            const q = questions[0]; // Pick the best match
            subQuestions.push({
              id: crypto.randomUUID(),
              label: branch.branch,
              type: q.type,
              contentText: extractText(q.content),
              marks: branch.marks,
              sourceYears: q.years_appeared,
            });
            questionPoints += branch.marks;
          } else {
            // No matching question found — add placeholder
            subQuestions.push({
              id: crypto.randomUUID(),
              label: branch.branch,
              type: branch.query.type,
              contentText: `[لا يوجد سؤال مطابق — ${branch.query.type}]`,
              marks: branch.marks,
              sourceYears: [],
            });
            questionPoints += branch.marks;
          }
        }

        generatedQuestions.push({
          id: crypto.randomUUID(),
          questionNumber: block.questionNumber,
          instructions: block.instructions,
          type: "mixed",
          subQuestions,
          points: questionPoints,
        });
        totalMarks += questionPoints;
      } else if (block.query) {
        // Simple question (e.g., "choose 5 out of 6 definitions")
        const questions = await fetchQuestionsByQuery(
          supabase,
          subjectId,
          block.query,
          difficulty
        );

        const subQuestions = questions.map((q, i) => ({
          id: crypto.randomUUID(),
          label: `${i + 1}`,
          type: q.type,
          contentText: extractText(q.content),
          marks: Math.ceil((block.marks || 10) / (block.query?.limit || 1)),
          sourceYears: q.years_appeared,
        }));

        const points = block.marks || 10;

        generatedQuestions.push({
          id: crypto.randomUUID(),
          questionNumber: block.questionNumber,
          instructions: block.instructions,
          type: block.query.type,
          subQuestions,
          points,
        });
        totalMarks += points;
      }
    }

    // 4. Build result
    const examId = crypto.randomUUID();

    return {
      success: true,
      exam: {
        id: examId,
        title: `امتحان ${subject.name_ar} — ${examType === "ministerial" ? "وزاري" : examType}`,
        subjectName: subject.name_ar,
        questions: generatedQuestions,
        totalMarks,
      },
    };
  } catch (error) {
    console.error("generateExamFromBlueprint error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ─── Helpers ─────────────────────────────────────────

async function fetchQuestionsByQuery(
  supabase: Awaited<ReturnType<typeof createClient>> extends infer T ? T : never,
  subjectId: string,
  query: { type: string; limit: number; chapter_weights?: number[] },
  targetDifficulty: number
): Promise<DbQuestion[]> {
  // Build the query
  let dbQuery = supabase
    .from("questions")
    .select("*")
    .eq("subject_id", subjectId)
    .eq("type", query.type)
    .order("difficulty", { ascending: true })
    .limit(query.limit * 3); // Over-fetch for sorting

  const { data, error } = await dbQuery;
  if (error || !data) return [];

  let results = data as DbQuestion[];

  // Sort by closeness to target difficulty
  results.sort(
    (a, b) =>
      Math.abs(a.difficulty - targetDifficulty) -
      Math.abs(b.difficulty - targetDifficulty)
  );

  // If chapter_weights specified, prefer questions from those chapters
  if (query.chapter_weights && query.chapter_weights.length > 0) {
    // This is a simple preference — we still return results if no chapter match
    const chapterFiltered = results.filter((q) => q.chapter_id);
    // For MVP, we don't filter strictly — just pick from sorted results
  }

  return results.slice(0, query.limit);
}

function extractText(content: Record<string, unknown>): string {
  if (typeof content === "string") return content;
  if (content.text && typeof content.text === "string") return content.text;
  return JSON.stringify(content);
}
