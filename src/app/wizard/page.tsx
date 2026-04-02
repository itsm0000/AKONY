"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GradeSelector } from "@/components/wizard/GradeSelector";
import { SubjectSelector } from "@/components/wizard/SubjectSelector";
import { ExamTypeSelector } from "@/components/wizard/ExamTypeSelector";
import { DifficultySlider } from "@/components/wizard/DifficultySlider";
import { useExamStore } from "@/lib/stores/examStore";

type WizardStep = 1 | 2 | 3 | 4;

interface WizardState {
  grade: number | null;
  subjectId: string | null;
  subjectName: string | null;
  examType: string | null;
  difficulty: number;
  redirectToPreview: boolean;
}

const STEPS = [
  { number: 1, label: "الصف الدراسي" },
  { number: 2, label: "المادة" },
  { number: 3, label: "نوع الامتحان" },
  { number: 4, label: "الصعوبة" },
];

export default function WizardPage() {
  const router = useRouter();
  const initExam = useExamStore((s) => s.initExam);
  const setMetadata = useExamStore((s) => s.setMetadata);

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [state, setState] = useState<WizardState>({
    grade: null,
    subjectId: null,
    subjectName: null,
    examType: null,
    difficulty: 5,
    redirectToPreview: false,
  });

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1: return state.grade !== null;
      case 2: return state.subjectId !== null;
      case 3: return state.examType !== null;
      case 4: return true;
      default: return false;
    }
  }, [currentStep, state]);

  const handleNext = useCallback(() => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as WizardStep);
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  }, [currentStep]);

  const handleGenerate = useCallback(async () => {
    if (!state.subjectId || !state.examType) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/wizard/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: state.subjectId,
          examType: state.examType,
          difficulty: state.difficulty,
        }),
      });

      const result = await response.json();

      if (!result.success || !result.exam) {
        setError(result.error || "فشل في توليد الامتحان");
        setIsGenerating(false);
        return;
      }

      // Initialize exam in Zustand store
      const examId = result.exam.id;
      initExam("database", result.exam.title, examId);
      
      // Set metadata
      setMetadata({
        subject: result.exam.subjectName,
        grade: `الصف ${state.grade}`,
        totalMarks: result.exam.totalMarks,
      });

      // Populate questions from generated exam
      const store = useExamStore.getState();
      const versionId = store.exam?.versions[0]?.id;
      
      if (versionId && result.exam.questions) {
        for (const q of result.exam.questions) {
          store.addQuestion(versionId, q.type as any);
          
          // Get the question that was just added
          const updatedStore = useExamStore.getState();
          const version = updatedStore.exam?.versions.find((v) => v.id === versionId);
          const addedQuestion = version?.questions[version.questions.length - 1];
          
          if (addedQuestion) {
            // Update question with generated data
            store.updateQuestion(versionId, addedQuestion.id, {
              instructions: q.instructions,
              points: q.points,
            });

            // Add sub-questions
            for (const sub of q.subQuestions) {
              store.addSubQuestion(versionId, addedQuestion.id, sub.type as any);
              const latestStore = useExamStore.getState();
              const latestVersion = latestStore.exam?.versions.find((v) => v.id === versionId);
              const latestQuestion = latestVersion?.questions.find((qq) => qq.id === addedQuestion.id);
              const addedSub = latestQuestion?.subQuestions[latestQuestion.subQuestions.length - 1];
              
              if (addedSub) {
                store.updateSubQuestion(versionId, addedQuestion.id, addedSub.id, {
                  contentText: sub.contentText,
                });
              }
            }
          }
        }
      }

      // Persist toggle preference
      localStorage.setItem("akony_redirect_to_preview", String(state.redirectToPreview));

      // Redirect based on toggle
      const targetPath = state.redirectToPreview
        ? `/exam/${examId}/preview`
        : `/exam/${examId}/edit`;
      
      router.push(targetPath);
    } catch (err) {
      console.error("Generation error:", err);
      setError("حدث خطأ أثناء توليد الامتحان");
      setIsGenerating(false);
    }
  }, [state, initExam, setMetadata, router]);

  const slideVariants = {
    enter: { x: 50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 },
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      {/* Progress Steps */}
      <div className="mb-10 flex items-center justify-center gap-2">
        {STEPS.map((step, i) => (
          <div key={step.number} className="flex items-center gap-2">
            <button
              onClick={() => {
                if (step.number < currentStep) setCurrentStep(step.number as WizardStep);
              }}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all ${
                step.number === currentStep
                  ? "bg-primary text-primary-foreground shadow-md"
                  : step.number < currentStep
                    ? "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {step.number}
            </button>
            <span
              className={`hidden text-sm sm:inline-block ${
                step.number === currentStep
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-1 h-px w-8 sm:w-12 ${
                  step.number < currentStep ? "bg-primary/40" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {currentStep === 1 && (
            <GradeSelector
              selectedGrade={state.grade}
              onSelect={(grade) => setState((s) => ({ ...s, grade }))}
            />
          )}
          {currentStep === 2 && (
            <SubjectSelector
              grade={state.grade!}
              selectedSubjectId={state.subjectId}
              onSelect={(id, name) => setState((s) => ({ ...s, subjectId: id, subjectName: name }))}
            />
          )}
          {currentStep === 3 && (
            <ExamTypeSelector
              subjectId={state.subjectId!}
              selectedType={state.examType}
              onSelect={(type) => setState((s) => ({ ...s, examType: type }))}
            />
          )}
          {currentStep === 4 && (
            <DifficultySlider
              difficulty={state.difficulty}
              redirectToPreview={state.redirectToPreview}
              onDifficultyChange={(difficulty) => setState((s) => ({ ...s, difficulty }))}
              onTogglePreview={(redirectToPreview) => setState((s) => ({ ...s, redirectToPreview }))}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Error */}
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-center text-sm text-destructive"
        >
          {error}
        </motion.p>
      )}

      {/* Navigation Buttons */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className="rounded-lg px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
        >
          رجوع
        </button>

        {currentStep < 4 ? (
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:shadow-lg disabled:pointer-events-none disabled:opacity-40"
          >
            التالي
          </button>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:shadow-lg disabled:pointer-events-none disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                جاري التوليد...
              </>
            ) : (
              "توليد الامتحان"
            )}
          </button>
        )}
      </div>
    </main>
  );
}
