"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useExamStore } from "@/lib/stores/examStore";
import type { Exam, ExamVersion, Question, SubQuestion } from "@/lib/types/exam";
import { QUESTION_TYPE_LABELS } from "@/lib/types/exam";
import { canExport, recordExport, getRemainingExports, getDailyLimit } from "@/lib/services/exportLimiter";

export default function PreviewPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const { exam, activeVersionId } = useExamStore();

  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [selectedVersionIdx, setSelectedVersionIdx] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportToast, setExportToast] = useState<string | null>(null);
  const [exportBlocked, setExportBlocked] = useState(false);

  const previewVersion = exam?.versions[selectedVersionIdx];

  // Generate PDF using @react-pdf/renderer dynamically at download time
  const handleDownload = useCallback(async () => {
    if (!exam || !previewVersion) return;

    // ── Export limit check (free tier) ──
    if (!canExport()) {
      setExportBlocked(true);
      return;
    }

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

      // Record the export and show remaining count toast
      const updated = recordExport();
      const remaining = getDailyLimit() - updated.count;
      if (remaining === 1) {
        setExportToast(`تصدير واحد متبقٍ اليوم — Pro = غير محدود`);
        setTimeout(() => setExportToast(null), 4000);
      } else if (remaining > 1) {
        setExportToast(`${remaining} تصديرات متبقية اليوم`);
        setTimeout(() => setExportToast(null), 3000);
      }
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
      {/* Export blocked modal */}
      {exportBlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl"
          >
            <div className="mb-2 text-3xl text-center">🔒</div>
            <h3 className="mb-2 text-center text-lg font-bold text-foreground">
              انتهى حد التصدير اليومي
            </h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              المستخدم المجاني يحصل على 3 تصديرات يومياً. ترقّ إلى Pro للحصول على تصديرات غير محدودة بدون علامة مائية.
            </p>
            <Button
              className="w-full bg-amber-500 text-white hover:bg-amber-600 font-semibold mb-2"
              onClick={() => setExportBlocked(false)}
            >
              ترقّى إلى Pro — $9/شهر
            </Button>
            <Button
              variant="ghost"
              className="w-full text-xs text-muted-foreground"
              onClick={() => setExportBlocked(false)}
            >
              إغلاق
            </Button>
          </motion.div>
        </div>
      )}

      {/* Export toast */}
      {exportToast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-4 start-1/2 z-50 -translate-x-1/2 rounded-xl bg-foreground px-4 py-2.5 text-xs font-medium text-background shadow-lg"
        >
          {exportToast}
        </motion.div>
      )}
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 start-1/4 h-[400px] w-[400px] rounded-full bg-[oklch(0.72_0.19_163/0.06)] blur-[100px]" />
        <div className="absolute -bottom-40 end-1/4 h-[300px] w-[300px] rounded-full bg-[oklch(0.65_0.20_250/0.05)] blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-xl px-4 py-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">معاينة وتصدير</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {exam.title} — نموذج ({previewVersion.label})
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/exam/${examId}/edit`)}
            className="self-start sm:self-auto px-2 text-xs text-muted-foreground hover:text-foreground"
            title="التبديل إلى التحرير"
          >
            ✏️
          </Button>
          <Button variant="outline" size="sm" className="self-start sm:self-auto" onClick={() => router.push(`/exam/${examId}/edit`)}>
            ← التحرير
          </Button>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card mb-4 flex flex-wrap items-center gap-2 rounded-2xl p-2 sm:gap-3 sm:p-3"
        >
          {/* Version selector */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">النموذج:</span>
            {exam.versions.map((v, i) => (
              <button
                key={v.id}
                onClick={() => setSelectedVersionIdx(i)}
                className={`rounded-lg px-2 py-1 text-xs font-semibold transition-all sm:px-3 sm:py-1.5 ${
                  i === selectedVersionIdx
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          <div className="mx-1 h-6 w-px bg-border max-sm:hidden" />

          {/* Answer key toggle */}
          <button
            onClick={() => setShowAnswerKey(!showAnswerKey)}
            className={`rounded-lg px-2 py-1 text-xs font-medium transition-all sm:px-3 sm:py-1.5 ${
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
            className="accent-gradient gap-1 border-0 text-white text-xs px-2 py-1 sm:gap-1.5 sm:text-sm sm:px-3 sm:py-2"
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
          className="overflow-x-auto"
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
          className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3"
        >
          <Button variant="outline" className="text-xs sm:text-sm" onClick={() => router.push(`/exam/${examId}/edit`)}>
            ← الرجوع للتحرير
          </Button>
          <Button variant="outline" className="text-xs sm:text-sm" onClick={() => router.push("/")}>
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
    <div className="space-y-4 sm:space-y-6">
      {/* Exam page */}
      <div
        className="mx-auto rounded-lg bg-white shadow-xl"
        style={{
          width: "100%",
          maxWidth: 720,
          minHeight: 900,
          padding: "20px 24px",
          fontFamily: "'IBM Plex Sans Arabic', sans-serif",
          direction: "rtl",
          color: "#111",
          fontSize: 12,
        }}
      >
        {/* Header */}
        <div style={{ borderBottom: "2px solid #222", paddingBottom: 8, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#333" }}>
            <span>{exam.metadata.schoolName || "اسم المدرسة"}</span>
            <span>{exam.metadata.date || "التاريخ"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#333", marginTop: 4 }}>
            <span>المادة: {exam.metadata.subject || "___"}</span>
            <span>المدة: {exam.metadata.duration || "___"}</span>
          </div>
          <h2 style={{ textAlign: "center", fontSize: 14, fontWeight: 700, marginTop: 8 }}>
            {exam.title}
          </h2>
          <p style={{ textAlign: "center", fontSize: 10, color: "#555", marginTop: 4 }}>
            نموذج ({version.label})
            {exam.metadata.totalMarks ? ` — الدرجة الكلية: ${exam.metadata.totalMarks}` : ""}
          </p>
        </div>

        {/* Questions */}
        {version.questions.map((q) => (
          <div key={q.id} style={{ marginBottom: 12 }}>
            <p style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>
              السؤال {q.questionNumber}: ({QUESTION_TYPE_LABELS[q.type]})
            </p>
            {q.instructions && (
              <p style={{ fontSize: 9, color: "#888", fontStyle: "italic", marginBottom: 4 }}>
                {q.instructions}
              </p>
            )}

            {q.subQuestions.map((sub) => (
              <div key={sub.id} style={{ display: "flex", gap: 6, marginBottom: 6, paddingRight: 12 }}>
                <span style={{ fontWeight: 700, fontSize: 10, minWidth: 16 }}>{sub.label})</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 10, lineHeight: 1.6 }}>
                    {sub.contentText || "___________________________"}
                  </p>

                  {sub.type === "mcq" && sub.mcqOptions && (
                    <div style={{ marginTop: 3 }}>
                      {sub.mcqOptions.map((opt) => (
                        <div key={opt.id} style={{ display: "flex", gap: 4, paddingRight: 6, marginTop: 2 }}>
                          <span style={{ fontWeight: 700, fontSize: 9, color: "#555" }}>{opt.label})</span>
                          <span style={{ fontSize: 9 }}>{opt.text || "________________"}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {sub.type !== "mcq" && (
                    <div>
                      {Array.from({ length: q.answerSpaceLines ?? 0 }).map((_, li) => (
                        <div key={li} style={{ borderBottom: "1px dotted #ccc", height: 20, marginTop: 3 }} />
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
            padding: "24px 32px",
            fontFamily: "'IBM Plex Sans Arabic', sans-serif",
            direction: "rtl",
            color: "#111",
          }}
        >
          <div style={{ borderBottom: "2px solid #222", paddingBottom: 12, marginBottom: 16 }}>
            <h2 style={{ textAlign: "center", fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
              مفتاح الإجابة
            </h2>
            <p style={{ textAlign: "center", fontSize: 10, color: "#555" }}>
              {exam.title} — نموذج ({version.label})
            </p>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {version.questions.map((q, qIndex) => (
              <div 
                key={q.id} 
                style={{ 
                  background: "#f9f9f9", 
                  borderRadius: 8, 
                  padding: 12,
                  border: "1px solid #eee"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 11, color: "#111" }}>
                    السؤال {q.questionNumber}
                  </span>
                  <span style={{ fontSize: 9, color: "#666", background: "#eee", padding: "2px 6px", borderRadius: 4 }}>
                    {QUESTION_TYPE_LABELS[q.type]}
                  </span>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingRight: 8 }}>
                  {q.subQuestions.map((sub) => (
                    <div key={sub.id} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                      <span style={{ fontWeight: 700, fontSize: 10, color: "#333", minWidth: 18 }}>
                        {sub.label})
                      </span>
                      <span style={{ fontSize: 10, color: "#222", flex: 1, lineHeight: 1.5 }}>
                        {sub.type === "mcq" && sub.mcqOptions
                          ? (() => {
                              const correct = sub.mcqOptions.find((o) => o.isCorrect);
                              return correct ? `${correct.label} — ${correct.text}` : "لم يتم تحديد إجابة صحيحة";
                            })()
                          : sub.contentText || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <p style={{ textAlign: "center", fontSize: 7, color: "#bbb", marginTop: 24, paddingTop: 12, borderTop: "1px solid #eee" }}>
            AKONY — مفتاح الإجابة (سري)
          </p>
        </div>
      )}
    </div>
  );
}
