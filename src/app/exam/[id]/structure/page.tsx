"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useExamStore } from "@/lib/stores/examStore";
import { QuestionCard } from "@/components/QuestionCard";
import { VersionTabs } from "@/components/VersionTabs";
import type { QuestionType } from "@/lib/types/exam";
import { useCategorization } from "@/hooks/useCategorization";

const VERSION_LABELS = ["أ", "ب", "ج", "د", "هـ", "و"];

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

  useEffect(() => {
    if (exam && !categorizedMaterial && !initRef.current) {
      initRef.current = true;
      runCategorization(examId, exam.materialId, exam.scope.startPage, exam.scope.endPage);
    }
  }, [exam, categorizedMaterial, runCategorization, examId]);

  const activeVersion = exam?.versions.find((v) => v.id === activeVersionId);

  const handleAddQuestion = (type: QuestionType) => {
    if (!activeVersionId) return;
    addQuestion(activeVersionId, type);
  };

  const handleAddVersion = () => {
    if (!exam) return;
    const nextLabel = VERSION_LABELS[exam.versions.length] || `${exam.versions.length + 1}`;
    addVersion(nextLabel);
  };

  const handleProceed = () => {
    router.push(`/exam/${examId}/edit`);
  };

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
            <p className="text-muted-foreground mt-2 font-inter"> الذكاء الاصطناعي يقوم باستخراج الأسئلة والتعاريف</p>
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

  return (
    <main className="relative min-h-screen">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 end-1/4 h-[400px] w-[400px] rounded-full bg-[oklch(0.65_0.20_250/0.06)] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground">بناء هيكل الامتحان</h1>
          <p className="mt-2 text-muted-foreground">
            {exam.title} — صفحات {exam.scope.startPage} إلى {exam.scope.endPage}
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
                onRemove={() => removeQuestion(activeVersionId!, question.id)}
                onUpdate={(updates) =>
                  updateQuestion(activeVersionId!, question.id, updates)
                }
                onAddSubQuestion={(type) =>
                  addSubQuestion(activeVersionId!, question.id, type)
                }
                onRemoveSubQuestion={(subId) =>
                  removeSubQuestion(activeVersionId!, question.id, subId)
                }
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
              <p className="text-sm text-muted-foreground/70">اضغط &quot;إضافة سؤال&quot; للبدء</p>
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
              onClick={() => handleAddQuestion(type)}
              className="gap-1.5 transition-all hover:scale-[1.02]"
            >
              <span>{emoji}</span>
              {label}
            </Button>
          ))}
        </motion.div>

        {/* Proceed */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-10"
        >
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
    </main>
  );
}
