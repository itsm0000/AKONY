"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useExamStore } from "@/lib/stores/examStore";
import type { Question, SubQuestion, QuestionType } from "@/lib/types/exam";
import { QUESTION_TYPE_LABELS } from "@/lib/types/exam";
import type { ExamQuestionSuggestion } from "@/hooks/useCategorization";

interface QuestionCardProps {
  question: Question;
  versionId: string;
  onRemove: () => void;
  onUpdate: (updates: Partial<Question>) => void;
  onAddSubQuestion: (type: QuestionType) => void;
  onRemoveSubQuestion: (subId: string) => void;
  onUpdateSubQuestion: (subId: string, updates: Partial<SubQuestion>) => void;
}

const TYPE_ICONS: Record<QuestionType, string> = {
  problem: "📐",
  definition: "📝",
  comparison: "⚖️",
  drawing: "🎨",
  mcq: "✓",
  short_answer: "✏️",
};

export function QuestionCard({
  question,
  onRemove,
  onUpdate,
  onAddSubQuestion,
  onRemoveSubQuestion,
  onUpdateSubQuestion,
}: QuestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isPromptingCount, setIsPromptingCount] = useState(false);
  const [requestedCount, setRequestedCount] = useState(5);
  const { categorizedMaterial } = useExamStore();

  const getSuggestions = (type: QuestionType) => {
    console.log("Categorized Material in Store:", categorizedMaterial);
    
    if (!categorizedMaterial) return [];
    switch (type) {
      case "problem": return categorizedMaterial.problemSolving || [];
      case "definition": return categorizedMaterial.definitions || [];
      case "mcq": return categorizedMaterial.multipleChoice || [];
      case "comparison": return categorizedMaterial.comparisons || [];
      case "drawing": return categorizedMaterial.drawings || [];
      case "short_answer": 
        return [
          ...(categorizedMaterial.shortAnswers || []),
          ...(categorizedMaterial.justifications || []),
          ...(categorizedMaterial.dependencies || [])
        ];
      default: return [];
    }
  };

  const handleAutoFill = (count: number) => {
    const suggestions = getSuggestions(question.type);
    if (!suggestions || suggestions.length === 0) return;

    const toAdd = suggestions.slice(0, count);
    const LABELS = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح"];
    
    const currentCount = question.subQuestions.length;
    
    const newSubQuestions: SubQuestion[] = toAdd.map((suggestion: ExamQuestionSuggestion, idx: number) => ({
      id: crypto.randomUUID(),
      label: LABELS[(currentCount + idx) % LABELS.length] || `${currentCount + idx + 1}`,
      type: question.type,
      contentText: suggestion.text,
      sortOrder: currentCount + idx,
    }));

    onUpdate({ subQuestions: [...question.subQuestions, ...newSubQuestions] });
  };

  const suggestionsAvailable = getSuggestions(question.type).length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-card overflow-hidden border-0">
        {/* Question header */}
        <div
          className="flex cursor-pointer items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/30"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Question number badge */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-inter text-sm font-bold text-primary">
            س{question.questionNumber}
          </div>

          {/* Question type */}
          <div className="flex flex-1 items-center gap-2">
            <span className="text-lg">{TYPE_ICONS[question.type]}</span>
            <span className="font-medium text-foreground">
              {QUESTION_TYPE_LABELS[question.type]}
            </span>
            {question.subQuestions.length > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 font-inter text-xs text-muted-foreground">
                {question.subQuestions.length} فرع
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Expand/collapse */}
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
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

            {/* Delete */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="ms-2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              title="حذف السؤال"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <CardContent className="space-y-4 border-t border-border/50 px-5 pb-5 pt-4">
            {/* Type selector + instructions */}
            <div className="flex gap-3">
              <div className="flex-1">
                <Select
                  value={question.type}
                  onValueChange={(val) => onUpdate({ type: val as QuestionType })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(QUESTION_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {TYPE_ICONS[key as QuestionType]} {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Input
                  value={question.instructions || ""}
                  onChange={(e) => onUpdate({ instructions: e.target.value })}
                  placeholder="تعليمات (مثال: أجب عن 5 من 6)"
                  className="h-9 text-sm"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Auto Fill Button */}
            {suggestionsAvailable > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-2">
                {!isPromptingCount ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                        setRequestedCount(Math.min(5, suggestionsAvailable));
                        setIsPromptingCount(true);
                    }}
                    className="w-full gap-2 bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    <span className="text-base">✨</span>
                    تعبئة تلقائية باستخدام الذكاء الاصطناعي ({suggestionsAvailable} مقترح متاح)
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-2">
                    <span className="text-sm font-medium text-primary flex-1">كم عدد الفروع المطلوبة؟</span>
                    <Input 
                      type="number" 
                      min={1} 
                      max={suggestionsAvailable} 
                      value={requestedCount} 
                      onChange={(e) => setRequestedCount(parseInt(e.target.value) || 1)}
                      className="h-8 w-20 text-center"
                    />
                    <Button 
                      size="sm" 
                      onClick={() => {
                          setIsPromptingCount(false);
                          handleAutoFill(requestedCount);
                      }}
                      className="h-8 px-4"
                    >
                      تأكيد
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setIsPromptingCount(false)}
                      className="h-8 px-2 text-muted-foreground"
                    >
                      إلغاء
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Sub-questions */}
            {question.subQuestions.length > 0 && (
              <div className="space-y-2 rounded-xl bg-muted/30 p-3">
                {question.subQuestions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex flex-col gap-2 rounded-lg bg-background/50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                        {sub.label}
                      </span>

                      <Select
                        value={sub.type}
                        onValueChange={(val) =>
                          onUpdateSubQuestion(sub.id, { type: val as QuestionType })
                        }
                      >
                        <SelectTrigger className="h-7 max-w-[160px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(QUESTION_TYPE_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key} className="text-xs">
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <button
                        onClick={() => onRemoveSubQuestion(sub.id)}
                        className="ms-auto rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
                        title="حذف الفرع"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                           <path d="M18 6 6 18" />
                           <path d="m6 6 12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Content Textarea */}
                    <div className="flex w-full">
                      <textarea
                        value={sub.contentText}
                        onChange={(e) => onUpdateSubQuestion(sub.id, { contentText: e.target.value })}
                        placeholder="نص السؤال..."
                        dir="rtl"
                        className="flex min-h-[60px] w-full resize-y rounded-md border border-input bg-background/80 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add sub-question button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddSubQuestion(question.type)}
              className="w-full gap-1.5 border border-dashed border-border text-xs text-muted-foreground hover:text-foreground"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              إضافة فرع
            </Button>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}
