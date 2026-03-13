"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { McqEditor } from "@/components/McqEditor";
import type { SubQuestion, McqOption, QuestionType } from "@/lib/types/exam";
import { QUESTION_TYPE_LABELS } from "@/lib/types/exam";
import { MCQ_LABELS } from "@/lib/utils/bidi";

interface SubQuestionEditorProps {
  sub: SubQuestion;
  onUpdate: (updates: Partial<SubQuestion>) => void;
  onExtractOcr?: () => void;
  isOcrProcessing?: boolean;
  ocrProgress?: number;
}

export function SubQuestionEditor({
  sub,
  onUpdate,
  onExtractOcr,
  isOcrProcessing,
  ocrProgress,
}: SubQuestionEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const initMcqOptions = (): McqOption[] =>
    MCQ_LABELS.map((label, i) => ({
      id: crypto.randomUUID(),
      label,
      text: "",
      isCorrect: false,
      sortOrder: i,
    }));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/40 bg-muted/20 overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex cursor-pointer items-center gap-2 px-4 py-3 transition-colors hover:bg-muted/30"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/15 text-xs font-bold text-primary">
          {sub.label}
        </span>
        <span className="text-sm font-medium text-foreground">
          {QUESTION_TYPE_LABELS[sub.type]}
        </span>
        {sub.contentText && (
          <span className="flex-1 truncate text-xs text-muted-foreground/60 pe-4">
            {sub.contentText.slice(0, 50)}…
          </span>
        )}
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground"
          animate={{ rotate: isExpanded ? 180 : 0 }}
        >
          <path d="m6 9 6 6 6-6" />
        </motion.svg>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="space-y-3 border-t border-border/30 px-4 py-3">
          {/* Content text */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              نص السؤال
            </label>
            <div className="relative">
              <textarea
                value={sub.contentText}
                onChange={(e) => onUpdate({ contentText: e.target.value })}
                placeholder="أدخل نص السؤال هنا أو استخرجه من المنهج..."
                className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                rows={3}
                dir="rtl"
              />
              {/* OCR button */}
              {onExtractOcr && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onExtractOcr}
                  disabled={isOcrProcessing}
                  className="absolute bottom-2 start-2 h-7 gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  {isOcrProcessing ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-muted border-t-primary" />
                      {ocrProgress ?? 0}%
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6" />
                        <path d="M16 13H8" />
                        <path d="M16 17H8" />
                        <path d="M10 9H8" />
                      </svg>
                      استخراج OCR
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* MCQ options (only for mcq type) */}
          {sub.type === "mcq" && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                خيارات الإجابة
              </label>
              <McqEditor
                options={sub.mcqOptions ?? initMcqOptions()}
                onChange={(options) => onUpdate({ mcqOptions: options })}
              />
            </div>
          )}

          {/* Source page info */}
          {sub.sourcePage && (
            <p className="text-[10px] text-muted-foreground/50">
              المصدر: صفحة {sub.sourcePage}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
