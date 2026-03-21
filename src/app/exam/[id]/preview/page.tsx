"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useExamStore } from "@/lib/stores/examStore";
import type { Exam, ExamVersion, Question, SubQuestion } from "@/lib/types/exam";
import { QUESTION_TYPE_LABELS } from "@/lib/types/exam";

export default function PreviewPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const { exam, activeVersionId } = useExamStore();

  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [selectedVersionIdx, setSelectedVersionIdx] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const previewVersion = exam?.versions[selectedVersionIdx];

  // Generate PDF using @react-pdf/renderer dynamically at download time
  const handleDownload = useCallback(async () => {
    if (!exam || !previewVersion) return;

    setIsGenerating(true);

    try {
      // Dynamic import — only loaded when user clicks download
      const { pdf } = await import("@react-pdf/renderer");
      const { ExamPdfDocument } = await import("@/components/ExamPdfDocument");
      const React = await import("react");

      const blob = await pdf(
        // @ts-ignore: React-pdf types don't perfectly match dynamic custom components
        React.createElement(ExamPdfDocument, { exam, version: previewVersion, showAnswerKey })
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exam.title}_نموذج_${previewVersion.label}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [exam, previewVersion, showAnswerKey]);

  if (!exam || !previewVersion) {
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
        <div className="absolute -top-40 start-1/4 h-[400px] w-[400px] rounded-full bg-[oklch(0.72_0.19_163/0.06)] blur-[100px]" />
        <div className="absolute -bottom-40 end-1/4 h-[300px] w-[300px] rounded-full bg-[oklch(0.65_0.20_250/0.05)] blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">معاينة وتصدير</h1>
            <p className="text-sm text-muted-foreground">
              {exam.title} — نموذج ({previewVersion.label})
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push(`/exam/${examId}/edit`)}>
            ← التحرير
          </Button>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card mb-6 flex flex-wrap items-center gap-3 rounded-2xl p-3"
        >
          {/* Version selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">النموذج:</span>
            {exam.versions.map((v, i) => (
              <button
                key={v.id}
                onClick={() => setSelectedVersionIdx(i)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  i === selectedVersionIdx
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          <div className="mx-1 h-6 w-px bg-border" />

          {/* Answer key toggle */}
          <button
            onClick={() => setShowAnswerKey(!showAnswerKey)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              showAnswerKey
                ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {showAnswerKey ? "✓ مفتاح الإجابة" : "مفتاح الإجابة"}
          </button>

          <div className="flex-1" />

          {/* Download PDF */}
          <Button
            size="sm"
            disabled={isGenerating}
            onClick={handleDownload}
            className="accent-gradient gap-1.5 border-0 text-white"
          >
            {isGenerating ? (
              <>
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                جاري التحضير...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" x2="12" y1="15" y2="3" />
                </svg>
                تحميل PDF
              </>
            )}
          </Button>
        </motion.div>

        {/* Live HTML Preview (A4 paper simulation) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ExamPreview
            exam={exam}
            version={previewVersion}
            showAnswerKey={showAnswerKey}
          />
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 flex justify-center gap-3"
        >
          <Button variant="outline" onClick={() => router.push(`/exam/${examId}/edit`)}>
            ← الرجوع للتحرير
          </Button>
          <Button variant="outline" onClick={() => router.push("/")}>
            العودة للرئيسية
          </Button>
        </motion.div>
      </div>
    </main>
  );
}

// ─── HTML Preview Component (A4 paper simulation) ────────────

function ExamPreview({
  exam,
  version,
  showAnswerKey,
}: {
  exam: Exam;
  version: ExamVersion;
  showAnswerKey: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Exam page */}
      <div
        className="mx-auto rounded-lg bg-white shadow-xl"
        style={{
          width: "100%",
          maxWidth: 720,
          minHeight: 900,
          padding: "30px 40px",
          fontFamily: "'IBM Plex Sans Arabic', sans-serif",
          direction: "rtl",
          color: "#111",
        }}
      >
        {/* Header */}
        <div style={{ borderBottom: "2px solid #222", paddingBottom: 12, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#333" }}>
            <span>{exam.metadata.schoolName || "اسم المدرسة"}</span>
            <span>{exam.metadata.date || "التاريخ"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#333", marginTop: 4 }}>
            <span>المادة: {exam.metadata.subject || "___"}</span>
            <span>المدة: {exam.metadata.duration || "___"}</span>
          </div>
          <h2 style={{ textAlign: "center", fontSize: 16, fontWeight: 700, marginTop: 12 }}>
            {exam.title}
          </h2>
          <p style={{ textAlign: "center", fontSize: 11, color: "#555", marginTop: 4 }}>
            نموذج ({version.label})
            {exam.metadata.totalMarks ? ` — الدرجة الكلية: ${exam.metadata.totalMarks}` : ""}
          </p>
        </div>

        {/* Questions */}
        {version.questions.map((q) => (
          <div key={q.id} style={{ marginBottom: 16 }}>
            <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
              السؤال {q.questionNumber}: ({QUESTION_TYPE_LABELS[q.type]})
            </p>
            {q.instructions && (
              <p style={{ fontSize: 10, color: "#888", fontStyle: "italic", marginBottom: 4 }}>
                {q.instructions}
              </p>
            )}

            {q.subQuestions.map((sub) => (
              <div key={sub.id} style={{ display: "flex", gap: 8, marginBottom: 8, paddingRight: 16 }}>
                <span style={{ fontWeight: 700, fontSize: 11, minWidth: 20 }}>{sub.label})</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, lineHeight: 1.7 }}>
                    {sub.contentText || "___________________________"}
                  </p>

                  {sub.type === "mcq" && sub.mcqOptions && (
                    <div style={{ marginTop: 4 }}>
                      {sub.mcqOptions.map((opt) => (
                        <div key={opt.id} style={{ display: "flex", gap: 6, paddingRight: 8, marginTop: 2 }}>
                          <span style={{ fontWeight: 700, fontSize: 10, color: "#555" }}>{opt.label})</span>
                          <span style={{ fontSize: 10 }}>{opt.text || "________________"}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {sub.type !== "mcq" && (
                    <div>
                      {Array.from({ length: q.answerSpaceLines ?? 0 }).map((_, li) => (
                        <div key={li} style={{ borderBottom: "1px dotted #ccc", height: 22, marginTop: 4 }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}

      </div>

      {/* Answer Key */}
      {showAnswerKey && (
        <div
          className="mx-auto rounded-lg bg-white shadow-xl"
          style={{
            width: "100%",
            maxWidth: 720,
            minHeight: 400,
            padding: "40px 48px",
            fontFamily: "'IBM Plex Sans Arabic', sans-serif",
            direction: "rtl",
            color: "#111",
          }}
        >
          <h2 style={{ textAlign: "center", fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
            مفتاح الإجابة — نموذج ({version.label})
          </h2>
          {version.questions.map((q) => (
            <div key={q.id} style={{ marginBottom: 12 }}>
              <p style={{ fontWeight: 700, fontSize: 11 }}>السؤال {q.questionNumber}:</p>
              {q.subQuestions.map((sub) => (
                <div key={sub.id} style={{ display: "flex", gap: 6, paddingRight: 16, marginTop: 2 }}>
                  <span style={{ fontWeight: 700, fontSize: 10 }}>{sub.label})</span>
                  <span style={{ fontSize: 10, color: "#333" }}>
                    {sub.type === "mcq" && sub.mcqOptions
                      ? sub.mcqOptions.find((o) => o.isCorrect)?.label ?? "—"
                      : sub.contentText?.slice(0, 60) || "—"}
                  </span>
                </div>
              ))}
            </div>
          ))}
          <p style={{ textAlign: "center", fontSize: 8, color: "#bbb", marginTop: 40 }}>
            AKONY — مفتاح الإجابة (سري)
          </p>
        </div>
      )}
    </div>
  );
}
