"use client";

import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useExamStore } from "@/lib/stores/examStore";
import { SubQuestionEditor } from "@/components/SubQuestionEditor";
import { useOcr } from "@/hooks/useOcr";
import { QUESTION_TYPE_LABELS } from "@/lib/types/exam";
import { useState, useEffect } from "react";
import { ProBanner } from "@/components/ProBanner";

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

  const [logoPreview, setLogoPreview] = useState<string>("");

  useEffect(() => {
    if (exam && exam.metadata.logoUrl) {
      setLogoPreview(exam.metadata.logoUrl);
    }
  }, [exam?.metadata?.logoUrl]);

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
      {/* Pro upsell banner — shown to free-tier users only */}
      <ProBanner isPro={false} />

      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 end-1/3 h-[400px] w-[400px] rounded-full bg-[oklch(0.65_0.20_250/0.06)] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-xl px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">تحرير المحتوى</h1>
            <p className="text-sm text-muted-foreground">
              عدّل نصوص الأسئلة وأضف خيارات الإجابة — {exam.title}
            </p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none h-10 sm:h-8" onClick={() => router.push(`/exam/${examId}/structure`)}>
              ← بناء الهيكل
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/exam/${examId}/preview`)}
              className="h-10 sm:h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              title="التبديل إلى المعاينة"
            >
              👁️
            </Button>
            <Button
              size="sm"
              onClick={() => router.push(`/exam/${examId}/preview`)}
              className="accent-gradient border-0 text-white h-10 sm:h-8"
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
          className="glass-card mb-4 sm:mb-6 rounded-2xl p-4"
        >
          <h3 className="mb-3 text-sm font-semibold text-foreground">بيانات الامتحان</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
            <div>
              <label className="mb-1 block text-[10px] text-muted-foreground">شعار المدرسة</label>
              <div className="flex items-center gap-2">
                {logoPreview ? (
                  <div className="relative h-8 w-12 shrink-0 overflow-hidden rounded border border-border/30">
                    <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
                  </div>
                ) : (
                  <div className="flex h-8 w-12 shrink-0 items-center justify-center rounded border border-dashed border-border/50 bg-muted/20 text-xs text-muted-foreground">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <label className="cursor-pointer rounded bg-muted px-2 py-1 text-xs text-muted-foreground hover:bg-muted/80">
                  رفع
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const dataUrl = event.target?.result as string;
                          setLogoPreview(dataUrl);
                          useExamStore.getState().setMetadata({ logoUrl: dataUrl });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Questions */}
        <div className="space-y-4 sm:space-y-6">
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
                <div className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4 border-b border-border/30">
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
                <div className="space-y-3 p-3 sm:p-4">
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
