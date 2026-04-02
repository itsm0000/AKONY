/**
 * Supabase Query Functions
 * Typed data access layer for the K-12 database tables.
 */

import { createClient } from "./client";

export interface DbSubject {
  id: string;
  name_ar: string;
  name_en: string | null;
  grade: number;
  created_at: string;
}

export interface DbChapter {
  id: string;
  subject_id: string;
  name_ar: string;
  chapter_number: number;
  created_at: string;
}

export interface DbQuestion {
  id: string;
  subject_id: string;
  chapter_id: string | null;
  type: string;
  content: Record<string, unknown>;
  difficulty: number;
  is_ministerial: boolean;
  years_appeared: string[];
  marks: number;
  created_at: string;
}

export interface DbExamBlueprint {
  id: string;
  subject_id: string;
  exam_type: string;
  structure_json: BlueprintQuestion[];
  created_at: string;
}

export interface BlueprintQuery {
  type: string;
  limit: number;
  chapter_weights?: number[];
}

export interface BlueprintBranch {
  branch: string;
  query: BlueprintQuery;
  marks: number;
}

export interface BlueprintQuestion {
  questionNumber: number;
  instructions: string;
  query?: BlueprintQuery;
  branches?: BlueprintBranch[];
  marks?: number;
}

// ─── Subjects ────────────────────────────────────────

export async function getSubjects(grade?: number) {
  const supabase = createClient();
  let query = supabase.from("subjects").select("*").order("grade");
  if (grade) query = query.eq("grade", grade);
  const { data, error } = await query;
  if (error) throw error;
  return data as DbSubject[];
}

// ─── Chapters ────────────────────────────────────────

export async function getChapters(subjectId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("subject_id", subjectId)
    .order("chapter_number");
  if (error) throw error;
  return data as DbChapter[];
}

// ─── Blueprints ──────────────────────────────────────

export async function getBlueprints(subjectId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("exam_blueprints")
    .select("*")
    .eq("subject_id", subjectId);
  if (error) throw error;
  return data as DbExamBlueprint[];
}

export async function getBlueprint(subjectId: string, examType: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("exam_blueprints")
    .select("*")
    .eq("subject_id", subjectId)
    .eq("exam_type", examType)
    .single();
  if (error) throw error;
  return data as DbExamBlueprint;
}

// ─── Questions ───────────────────────────────────────

export async function getQuestionsByDifficulty(
  subjectId: string,
  type: string,
  targetDifficulty: number,
  limit: number,
  chapterIds?: string[]
) {
  const supabase = createClient();
  let query = supabase
    .from("questions")
    .select("*")
    .eq("subject_id", subjectId)
    .eq("type", type)
    .order("difficulty", { ascending: true })
    .limit(limit * 3); // Fetch more than needed for client-side sorting

  const { data, error } = await query;
  if (error) throw error;

  let filtered = (data as DbQuestion[]);
  
  // Filter by chapters if specified
  if (chapterIds && chapterIds.length > 0) {
    filtered = filtered.filter((q) => q.chapter_id && chapterIds.includes(q.chapter_id));
  }

  // Sort by closeness to target difficulty
  filtered.sort((a, b) => Math.abs(a.difficulty - targetDifficulty) - Math.abs(b.difficulty - targetDifficulty));

  return filtered.slice(0, limit);
}

export async function countQuestions(subjectId: string) {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("subject_id", subjectId);
  if (error) throw error;
  return count || 0;
}
