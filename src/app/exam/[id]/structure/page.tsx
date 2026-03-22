"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useExamStore } from "@/lib/stores/examStore";
import { QuestionCard } from "@/components/QuestionCard";
import { VersionTabs } from "@/components/VersionTabs";
import type { QuestionType } from "@/lib/types/exam";
import { useCategorization } from "@/hooks/useCategorization";

const VERSION_LABELS = ["أ", "ب", "ج", "د", "هـ", "و"];

// ─── Quick-Start Templates ────────────────────────────────────────────────────
interface ExamTemplate {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  questions: QuestionType[];
}

const TEMPLATES: ExamTemplate[] = [
  {
    id: "monthly",
    emoji: "📝",
    title: "امتحان شهري",
    subtitle: "3 أسئلة — سريع وسهل",
    questions: ["problem", "definition", "short_answer"],
  },
  {
    id: "midterm",
    emoji: "📚",
    title: "نصف السنة",
    subtitle: "5 أسئلة — متوازن",
    questions: ["problem", "problem", "definition", "mcq", "comparison"],
  },
  {
    id: "ministerial",
    emoji: "🏛️",
    title: "امتحان وزاري",
    subtitle: "6 أسئلة — شامل",
    questions: ["problem", "problem", "definition", "definition", "mcq", "drawing"],
  },
];
// ─────────────────────────────────────────────────────────────────────────────

export default function StructurePage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const {
    exam,
    activeVersionId,
    categorizedMaterial,
    setActiveVersion,
    addVersion,
    addQuestion,
    removeQuestion,
    updateQuestion,
    addSubQuestion,
    removeSubQuestion,
    updateSubQuestion,
  } = useExamStore();

  const { runCategorization, isProcessing, error } = useCategorization();
  const initRef = useRef(false);

  // ─── Difficulty Slider state ───────────────────────────────────────────────
  const [examDifficulty, setExamDifficulty] = useState(5);

  // ─── Evaluate modal state ──────────────────────────────────────────────────
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationFeedback, setEvaluationFeedback] = useState<string | null>(null);
  const [showEvalModal, setShowEvalModal] = useState(false);

  useEffect(() => {
    if (exam && !categorizedMaterial && !initRef.current) {
      initRef.current = true;
      runCategorization(examId, exam.materialId, exam.scope.startPage, exam.scope.endPage, exam.scope.selectedChapters);
    }
  }, [exam, categorizedMaterial, runCategorization, examId]);

  const activeVersion = exam?.versions.find((v) => v.id === activeVersionId);

  const handleAddVersion = () => {
    if (!exam) return;
    const nextLabel = VERSION_LABELS[exam.versions.length] || `${exam.versions.length + 1}`;
    addVersion(nextLabel);
  };

  const handleApplyTemplate = (template: ExamTemplate) => {
    if (!activeVersionId) return;
    template.questions.forEach((type) => addQuestion(activeVersionId, type));
  };

  const handleEvaluate = async () => {
    if (!exam || !activeVersion) return;
    setIsEvaluating(true);
    setEvaluationFeedback(null);
    setShowEvalModal(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structure: activeVersion }),
      });
      const data = await res.json();
      setEvaluationFeedback(data.feedback || data.error || "لم يتم استلام أي ملاحظات.");
    } catch {
      setEvaluationFeedback("حدث خطأ أثناء الاتصال بخدمة التقييم.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleProceed = () => {
    router.push(`/exam/${examId}/edit`);
  };

  // ─── Loading / Error states ────────────────────────────────────────────────
  if (!exam) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">لم يتم العثور على الامتحان</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/")}>
            العودة للرئيسية
          </Button>
        </div>
      </main>
    );
  }

  if (isProcessing) {
    return (
      <main className="flex min-h-screen items-center justify-center relative">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 end-1/4 h-[400px] w-[400px] rounded-full bg-[oklch(0.65_0.20_250/0.06)] blur-[120px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 z-10 glass-card p-12 rounded-3xl"
        >
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-muted border-t-primary mx-auto" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">جاري تحليل المنهج...</h2>
            <p className="text-muted-foreground mt-2 font-inter">الذكاء الاصطناعي يستخرج الأسئلة ويصنّفها</p>
          </div>
        </motion.div>
      </main>
    );
  }

  if (error && !categorizedMaterial) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center glass-card p-8 rounded-2xl max-w-md">
          <p className="text-lg font-bold text-destructive mb-2">فشل التحليل</p>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            حاول مرة أخرى
          </Button>
        </div>
      </main>
    );
  }

  // ─── Difficulty label helper ───────────────────────────────────────────────
  const difficultyText =
    examDifficulty <= 3 ? "سهل 🟢" :
    examDifficulty <= 6 ? "متوسط 🟡" :
    "صعب 🔴";

  return (
    <main className="relative min-h-screen">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 end-1/4 h-[400px] w-[400px] rounded-full bg-[oklch(0.65_0.20_250/0.06)] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">بناء هيكل الامتحان</h1>
          <p className="mt-2 text-muted-foreground">
            {exam.title} — صفحات {exam.scope.startPage} إلى {exam.scope.endPage}
          </p>
        </motion.div>

        {/* ─── Quick-Start Templates ─────────────────────────────────────── */}
        {categorizedMaterial && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6 rounded-2xl border border-border/60 bg-muted/20 p-4"
          >
            <p className="mb-3 text-sm font-semibold text-foreground">⚡ ابدأ بقالب جاهز</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleApplyTemplate(t)}
                  className="flex flex-col gap-0.5 rounded-xl border border-border/60 bg-background/50 px-4 py-3 text-start transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm"
                >
                  <span className="text-xl">{t.emoji}</span>
                  <span className="text-sm font-semibold text-foreground">{t.title}</span>
                  <span className="text-xs text-muted-foreground">{t.subtitle}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ─── Global Difficulty Slider ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 rounded-2xl border border-border/60 bg-muted/20 p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">🎯 مستوى صعوبة الامتحان</p>
            <span className="rounded-lg bg-muted px-3 py-1 font-inter text-sm font-bold text-foreground">
              {examDifficulty}/10 — {difficultyText}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-inter">1</span>
            <input
              type="range"
              min={1}
              max={10}
              value={examDifficulty}
              onChange={(e) => setExamDifficulty(Number(e.target.value))}
              className="flex-1 accent-primary cursor-pointer"
            />
            <span className="text-xs text-muted-foreground font-inter">10</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            تستخدم هذه القيمة لترتيب اقتراحات الذكاء الاصطناعي حسب الصعوبة المطلوبة
          </p>
        </motion.div>

        {/* Version Tabs */}
        <VersionTabs
          versions={exam.versions}
          activeVersionId={activeVersionId}
          onSelectVersion={setActiveVersion}
          onAddVersion={handleAddVersion}
        />

        {/* Questions List */}
        <div className="mt-6 space-y-4">
          <AnimatePresence mode="popLayout">
            {activeVersion?.questions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                versionId={activeVersionId!}
                difficultyTarget={examDifficulty}
                onRemove={() => removeQuestion(activeVersionId!, question.id)}
                onUpdate={(updates) => updateQuestion(activeVersionId!, question.id, updates)}
                onAddSubQuestion={(type) => addSubQuestion(activeVersionId!, question.id, type)}
                onRemoveSubQuestion={(subId) => removeSubQuestion(activeVersionId!, question.id, subId)}
                onUpdateSubQuestion={(subId, updates) =>
                  updateSubQuestion(activeVersionId!, question.id, subId, updates)
                }
              />
            ))}
          </AnimatePresence>

          {activeVersion?.questions.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-16"
            >
              <p className="text-muted-foreground">لا توجد أسئلة بعد</p>
              <p className="text-sm text-muted-foreground/70">اضغط &quot;إضافة سؤال&quot; أو اختر قالباً أعلاه</p>
            </motion.div>
          )}
        </div>

        {/* Add Question Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 flex flex-wrap gap-2"
        >
          {(
            [
              { type: "problem" as QuestionType, label: "مسألة / حساب", emoji: "📐" },
              { type: "definition" as QuestionType, label: "تعريف", emoji: "📝" },
              { type: "mcq" as QuestionType, label: "اختيار من متعدد", emoji: "✓" },
              { type: "short_answer" as QuestionType, label: "إجابة قصيرة", emoji: "✏️" },
              { type: "comparison" as QuestionType, label: "مقارنة", emoji: "⚖️" },
              { type: "drawing" as QuestionType, label: "رسم", emoji: "🎨" },
            ] as const
          ).map(({ type, label, emoji }) => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              onClick={() => activeVersionId && addQuestion(activeVersionId, type)}
              className="gap-1.5 transition-all hover:scale-[1.02]"
            >
              <span>{emoji}</span>
              {label}
            </Button>
          ))}
        </motion.div>

        {/* ─── Evaluate + Proceed buttons ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-10 space-y-3"
        >
          {/* Evaluate button — only show if there are questions */}
          {(activeVersion?.questions.length ?? 0) > 0 && (
            <Button
              onClick={handleEvaluate}
              variant="outline"
              size="lg"
              disabled={isEvaluating}
              className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
            >
              {isEvaluating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  جاري تقييم الهيكل...
                </>
              ) : (
                <>🔍 تقييم هيكل الامتحان</>
              )}
            </Button>
          )}

          <Button
            onClick={handleProceed}
            size="lg"
            disabled={!activeVersion || activeVersion.questions.length === 0}
            className="accent-gradient w-full border-0 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
          >
            التالي — مراجعة وتحرير الأسئلة ←
          </Button>
        </motion.div>
      </div>

      {/* ─── Evaluation Feedback Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {showEvalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setShowEvalModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              className="glass-card max-w-lg w-full rounded-3xl p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">🔍 تقييم هيكل الامتحان</h2>
                <button
                  onClick={() => setShowEvalModal(false)}
                  className="rounded-full p-2 text-muted-foreground hover:bg-muted"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>

              {isEvaluating ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
                  <p className="text-muted-foreground">الذكاء الاصطناعي يراجع هيكل الامتحان...</p>
                </div>
              ) : (
                <div className="rounded-xl bg-muted/30 p-4">
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap" dir="rtl">
                    {evaluationFeedback}
                  </p>
                </div>
              )}

              <Button
                className="mt-6 w-full"
                variant="outline"
                onClick={() => setShowEvalModal(false)}
              >
                إغلاق
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
