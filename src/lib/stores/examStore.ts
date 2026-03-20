import { create } from "zustand";
import type {
  Exam,
  ExamVersion,
  Question,
  SubQuestion,
  ExamScope,
  ExamMetadata,
  QuestionType,
} from "@/lib/types/exam";
import type { CategorizedData } from "@/hooks/useCategorization";

interface ExamState {
  exam: Exam | null;
  activeVersionId: string | null;
  categorizedMaterial: CategorizedData | null;

  // Actions
  initExam: (materialId: string, title: string) => void;
  setScope: (scope: ExamScope) => void;
  setMetadata: (metadata: Partial<ExamMetadata>) => void;
  setCategorizedMaterial: (data: CategorizedData) => void;

  // Version management
  addVersion: (label: string) => void;
  setActiveVersion: (versionId: string) => void;

  // Question management
  addQuestion: (versionId: string, type: QuestionType) => void;
  updateQuestion: (versionId: string, questionId: string, updates: Partial<Question>) => void;
  removeQuestion: (versionId: string, questionId: string) => void;
  reorderQuestions: (versionId: string, questionIds: string[]) => void;

  // Sub-question management
  addSubQuestion: (versionId: string, questionId: string, type: QuestionType) => void;
  updateSubQuestion: (
    versionId: string,
    questionId: string,
    subId: string,
    updates: Partial<SubQuestion>
  ) => void;
  removeSubQuestion: (versionId: string, questionId: string, subId: string) => void;
}

const createDefaultMetadata = (): ExamMetadata => ({
  schoolName: "",
  subject: "",
  grade: "",
  duration: "",
  date: new Date().toISOString().split("T")[0],
});

export const useExamStore = create<ExamState>((set) => ({
  exam: null,
  activeVersionId: null,
  categorizedMaterial: null,

  initExam: (materialId, title) => {
    const versionId = crypto.randomUUID();
    const exam: Exam = {
      id: crypto.randomUUID(),
      materialId,
      title,
      scope: { startPage: 1, endPage: 1 },
      metadata: createDefaultMetadata(),
      versions: [
        {
          id: versionId,
          label: "أ",
          questions: [],
          sortOrder: 0,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set({ exam, activeVersionId: versionId });
  },

  setScope: (scope) =>
    set((state) => ({
      exam: state.exam ? { ...state.exam, scope } : null,
    })),

  setMetadata: (metadata) =>
    set((state) => ({
      exam: state.exam
        ? { ...state.exam, metadata: { ...state.exam.metadata, ...metadata } }
        : null,
    })),

  setCategorizedMaterial: (data) => set({ categorizedMaterial: data }),

  addVersion: (label) =>
    set((state) => {
      if (!state.exam) return state;
      const newVersion: ExamVersion = {
        id: crypto.randomUUID(),
        label,
        questions: [],
        sortOrder: state.exam.versions.length,
      };
      return {
        exam: {
          ...state.exam,
          versions: [...state.exam.versions, newVersion],
        },
      };
    }),

  setActiveVersion: (versionId) => set({ activeVersionId: versionId }),

  addQuestion: (versionId, type) =>
    set((state) => {
      if (!state.exam) return state;
      return {
        exam: {
          ...state.exam,
          versions: state.exam.versions.map((v) => {
            if (v.id !== versionId) return v;
            const newQuestion: Question = {
              id: crypto.randomUUID(),
              questionNumber: v.questions.length + 1,
              type,
              subQuestions: [],
              sortOrder: v.questions.length,
            };
            return { ...v, questions: [...v.questions, newQuestion] };
          }),
        },
      };
    }),

  updateQuestion: (versionId, questionId, updates) =>
    set((state) => {
      if (!state.exam) return state;
      return {
        exam: {
          ...state.exam,
          versions: state.exam.versions.map((v) => {
            if (v.id !== versionId) return v;
            return {
              ...v,
              questions: v.questions.map((q) =>
                q.id === questionId ? { ...q, ...updates } : q
              ),
            };
          }),
        },
      };
    }),

  removeQuestion: (versionId, questionId) =>
    set((state) => {
      if (!state.exam) return state;
      return {
        exam: {
          ...state.exam,
          versions: state.exam.versions.map((v) => {
            if (v.id !== versionId) return v;
            const filtered = v.questions
              .filter((q) => q.id !== questionId)
              .map((q, i) => ({ ...q, questionNumber: i + 1, sortOrder: i }));
            return { ...v, questions: filtered };
          }),
        },
      };
    }),

  reorderQuestions: (versionId, questionIds) =>
    set((state) => {
      if (!state.exam) return state;
      return {
        exam: {
          ...state.exam,
          versions: state.exam.versions.map((v) => {
            if (v.id !== versionId) return v;
            const reordered = questionIds
              .map((id) => v.questions.find((q) => q.id === id))
              .filter(Boolean)
              .map((q, i) => ({
                ...q!,
                questionNumber: i + 1,
                sortOrder: i,
              }));
            return { ...v, questions: reordered };
          }),
        },
      };
    }),

  addSubQuestion: (versionId, questionId, type) =>
    set((state) => {
      if (!state.exam) return state;
      const LABELS = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح"];
      return {
        exam: {
          ...state.exam,
          versions: state.exam.versions.map((v) => {
            if (v.id !== versionId) return v;
            return {
              ...v,
              questions: v.questions.map((q) => {
                if (q.id !== questionId) return q;
                const newSub: SubQuestion = {
                  id: crypto.randomUUID(),
                  label: LABELS[q.subQuestions.length] || `${q.subQuestions.length + 1}`,
                  type,
                  contentText: "",
                  sortOrder: q.subQuestions.length,
                };
                return { ...q, subQuestions: [...q.subQuestions, newSub] };
              }),
            };
          }),
        },
      };
    }),

  updateSubQuestion: (versionId, questionId, subId, updates) =>
    set((state) => {
      if (!state.exam) return state;
      return {
        exam: {
          ...state.exam,
          versions: state.exam.versions.map((v) => {
            if (v.id !== versionId) return v;
            return {
              ...v,
              questions: v.questions.map((q) => {
                if (q.id !== questionId) return q;
                return {
                  ...q,
                  subQuestions: q.subQuestions.map((s) =>
                    s.id === subId ? { ...s, ...updates } : s
                  ),
                };
              }),
            };
          }),
        },
      };
    }),

  removeSubQuestion: (versionId, questionId, subId) =>
    set((state) => {
      if (!state.exam) return state;
      const LABELS = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح"];
      return {
        exam: {
          ...state.exam,
          versions: state.exam.versions.map((v) => {
            if (v.id !== versionId) return v;
            return {
              ...v,
              questions: v.questions.map((q) => {
                if (q.id !== questionId) return q;
                const filtered = q.subQuestions
                  .filter((s) => s.id !== subId)
                  .map((s, i) => ({
                    ...s,
                    label: LABELS[i] || `${i + 1}`,
                    sortOrder: i,
                  }));
                return { ...q, subQuestions: filtered };
              }),
            };
          }),
        },
      };
    }),
}));
