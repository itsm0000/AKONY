"use client";

import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useExamStore } from "@/lib/stores/examStore";
import { SubQuestionEditor } from "@/components/SubQuestionEditor";
import { useOcr } from "@/hooks/useOcr";
import { QUESTION_TYPE_LABELS } from "@/lib/types/exam";

export default function EditPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const {
    exam,
    activeVersionId,
    updateQuestion,
    updateSubQuestion,
  } = useExamStore();

  const activeVersion = exam?.versions.find((v) => v.id === activeVersionId);
  const { extractText, isProcessing, progress } = useOcr();

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

  return (
    <main className="relative min-h-screen">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 end-1/3 h-[400px] w-[400px] rounded-full bg-[oklch(0.65_0.20_250/0.06)] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">تحرير المحتوى</h1>
            <p className="text-sm text-muted-foreground">
              عدّل نصوص الأسئلة وأضف خيارات الإجابة — {exam.title}
            </p>
          </div>
          <div className="flex w-full sm:w-auto gap-2">
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => router.push(`/exam/${examId}/structure`)}>
              ← بناء الهيكل
            </Button>
            <Button
              size="sm"
              onClick={() => router.push(`/exam/${examId}/preview`)}
              className="accent-gradient border-0 text-white"
            >
              التالي — المعاينة →
            </Button>
          </div>
        </motion.div>

        {/* Exam metadata quick-edit */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card mb-6 rounded-2xl p-4"
        >
          <h3 className="mb-3 text-sm font-semibold text-foreground">بيانات الامتحان</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[10px] text-muted-foreground">اسم المدرسة</label>
              <Input
                value={exam.metadata.schoolName}
                onChange={(e) => useExamStore.getState().setMetadata({ schoolName: e.target.value })}
                placeholder="مدرسة ..."
                className="h-8 text-xs"
                dir="rtl"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-muted-foreground">المادة</label>
              <Input
                value={exam.metadata.subject}
                onChange={(e) => useExamStore.getState().setMetadata({ subject: e.target.value })}
                placeholder="الرياضيات"
                className="h-8 text-xs"
                dir="rtl"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-muted-foreground">الصف</label>
              <Input
                value={exam.metadata.grade}
                onChange={(e) => useExamStore.getState().setMetadata({ grade: e.target.value })}
                placeholder="الثالث ثانوي"
                className="h-8 text-xs"
                dir="rtl"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-muted-foreground">المدة</label>
              <Input
                value={exam.metadata.duration}
                onChange={(e) => useExamStore.getState().setMetadata({ duration: e.target.value })}
                placeholder="ساعتان"
                className="h-8 text-xs"
                dir="rtl"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-muted-foreground">التاريخ</label>
              <Input
                value={exam.metadata.date}
                onChange={(e) => useExamStore.getState().setMetadata({ date: e.target.value })}
                placeholder="2025/01/15"
                className="h-8 text-xs font-inter"
                dir="ltr"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-muted-foreground">الدرجة الكلية</label>
              <Input
                value={exam.metadata.totalMarks?.toString() ?? ""}
                onChange={(e) => useExamStore.getState().setMetadata({ totalMarks: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="100"
                type="number"
                className="h-8 text-xs font-inter"
                dir="ltr"
              />
            </div>
          </div>
        </motion.div>

        {/* Questions */}
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {activeVersion?.questions.map((question) => (
              <motion.div
                key={question.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass-card rounded-2xl overflow-hidden"
              >
                {/* Question header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border/30">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-inter text-sm font-bold text-primary">
                    س{question.questionNumber}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-foreground">
                      {QUESTION_TYPE_LABELS[question.type]}
                    </span>
                    {question.instructions && (
                      <p className="text-xs text-muted-foreground/70">{question.instructions}</p>
                    )}
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 font-inter text-xs text-muted-foreground">
                    {question.subQuestions.length} فرع
                  </span>
                </div>

                {/* Sub-questions */}
                <div className="space-y-3 p-4">
                  {question.subQuestions.length > 0 ? (
                    question.subQuestions.map((sub) => (
                      <SubQuestionEditor
                        key={sub.id}
                        sub={sub}
                        onUpdate={(updates) =>
                          updateSubQuestion(activeVersionId!, question.id, sub.id, updates)
                        }
                        onExtractOcr={() => {
                          // OCR extraction placeholder — would extract from region
                        }}
                        isOcrProcessing={isProcessing}
                        ocrProgress={progress}
                      />
                    ))
                  ) : (
                    <div className="py-6 text-center text-sm text-muted-foreground/50">
                      لا توجد فروع — ارجع لصفحة الهيكل لإضافة فروع
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty state */}
          {(!activeVersion || activeVersion.questions.length === 0) && (
            <div className="flex flex-col items-center py-20 text-center">
              <div className="mb-4 text-5xl">✏️</div>
              <p className="text-lg text-muted-foreground">لا توجد أسئلة</p>
              <p className="mt-1 text-sm text-muted-foreground/60">
                ارجع لصفحة بناء الهيكل لإضافة الأسئلة أولاً
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push(`/exam/${examId}/structure`)}
              >
                الرجوع للهيكل
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
