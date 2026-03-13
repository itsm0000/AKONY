// ─── Question Types ───────────────────────────────────
export type QuestionType =
  | "problem"
  | "definition"
  | "comparison"
  | "drawing"
  | "mcq"
  | "short_answer";

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  problem: "مسألة / حساب",
  definition: "تعريف",
  comparison: "مقارنة",
  drawing: "رسم / توضيح",
  mcq: "اختيار من متعدد",
  short_answer: "إجابة قصيرة",
};

// ─── MCQ Option ───────────────────────────────────────
export interface McqOption {
  id: string;
  label: string; // A, B, C, D
  text: string;
  isCorrect: boolean;
  sortOrder: number;
}

// ─── Sub-Question ─────────────────────────────────────
export interface SubQuestion {
  id: string;
  label: string; // a, b, c or 1, 2, 3
  type: QuestionType;
  contentText: string;
  sourcePage?: number;
  sourceRegion?: FabricRegion;
  mcqOptions?: McqOption[];
  sortOrder: number;
}

// ─── Question ─────────────────────────────────────────
export interface Question {
  id: string;
  questionNumber: number;
  type: QuestionType;
  instructions?: string; // "Answer 5 out of 6"
  subQuestions: SubQuestion[];
  sortOrder: number;
}

// ─── Exam Version ─────────────────────────────────────
export interface ExamVersion {
  id: string;
  label: string; // A, B, C
  questions: Question[];
  sortOrder: number;
}

// ─── Exam Scope ───────────────────────────────────────
export interface ExamScope {
  startPage: number;
  endPage: number;
  chapters?: string;
}

// ─── Exam Metadata ────────────────────────────────────
export interface ExamMetadata {
  schoolName: string;
  subject: string;
  grade: string;
  duration: string;
  date: string;
  totalMarks?: number;
}

// ─── Exam ─────────────────────────────────────────────
export interface Exam {
  id: string;
  materialId: string;
  title: string;
  scope: ExamScope;
  metadata: ExamMetadata;
  versions: ExamVersion[];
  createdAt: string;
  updatedAt: string;
}

// ─── Annotation (Fabric.js) ───────────────────────────
export interface FabricRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "rect" | "circle" | "freehand";
  fabricData?: Record<string, unknown>;
}

export interface Annotation {
  id: string;
  examId: string;
  pageNumber: number;
  region: FabricRegion;
  assignedTo?: string; // sub_question_id
  ocrText?: string;
  createdAt: string;
}

// ─── Material ─────────────────────────────────────────
export interface Material {
  id: string;
  userId: string;
  title: string;
  fileUrl: string;
  fileType: "pdf" | "image";
  pageCount?: number;
  createdAt: string;
}
