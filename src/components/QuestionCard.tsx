"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import type { Question, SubQuestion, QuestionType, McqOption } from "@/lib/types/exam";
import { QUESTION_TYPE_LABELS } from "@/lib/types/exam";
import type { ExamQuestionSuggestion } from "@/hooks/useCategorization";

interface QuestionCardProps {
  question: Question;
  versionId: string;
  difficultyTarget?: number;
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

const DIFFICULTY_COLORS: Record<string, string> = {
  easy:   "bg-emerald-500/15 text-emerald-400",
  medium: "bg-amber-500/15 text-amber-400",
  hard:   "bg-rose-500/15 text-rose-400",
};

function difficultyMeta(d: number): { key: string; label: string } {
  if (d <= 3) return { key: "easy",   label: `${d} سهل` };
  if (d <= 6) return { key: "medium", label: `${d} متوسط` };
  return            { key: "hard",   label: `${d} صعب` };
}

const ARABIC_LABELS = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح", "ط", "ي"];

/** Map a suggestion's options[] → McqOption[], respecting the desired count. */
function buildMcqOptions(suggestion: ExamQuestionSuggestion, count: number): McqOption[] {
  const raw = suggestion.options && suggestion.options.length > 0
    ? suggestion.options.slice(0, count)
    : Array.from({ length: count }, () => "");

  // Pad up to count if fewer options were returned
  while (raw.length < count) raw.push("");

  return raw.map((text, i) => ({
    id: crypto.randomUUID(),
    label: ARABIC_LABELS[i] || String(i + 1),
    text,
    isCorrect: false,
    sortOrder: i,
  }));
}

/** Generate N empty McqOptions */
function emptyMcqOptions(count: number): McqOption[] {
  return Array.from({ length: count }, (_, i) => ({
    id: crypto.randomUUID(),
    label: ARABIC_LABELS[i] || String(i + 1),
    text: "",
    isCorrect: false,
    sortOrder: i,
  }));
}

// ─── Inline suggestion picker for a single sub-question slot ───────────────
function SubQuestionSuggestionPicker({
  suggestions,
  alreadyAddedTexts,
  difficultyTarget,
  onPick,
}: {
  suggestions: ExamQuestionSuggestion[];
  alreadyAddedTexts: Set<string>;
  difficultyTarget: number;
  onPick: (s: ExamQuestionSuggestion) => void;
}) {
  const available = suggestions
    .filter((s) => !alreadyAddedTexts.has(s.text))
    .sort((a, b) => Math.abs(a.difficulty - difficultyTarget) - Math.abs(b.difficulty - difficultyTarget));

  if (!available.length) return <p className="text-center text-xs text-muted-foreground py-2">لا توجد اقتراحات متبقية</p>;

  return (
    <div className="max-h-52 overflow-y-auto space-y-1 overscroll-contain rounded-lg border border-primary/15 bg-primary/5 p-2">
      {available.map((s, idx) => {
        const { key, label } = difficultyMeta(s.difficulty);
        return (
          <div key={idx} className="flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-background/60 transition-colors">
            <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${DIFFICULTY_COLORS[key]}`}>
              {label}
            </span>
            <p className="flex-1 text-xs leading-snug text-foreground line-clamp-2" dir="rtl">{s.text}</p>
            <button
              onClick={() => onPick(s)}
              className="shrink-0 rounded p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="اختر هذا السؤال"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m20 6-11 11-5-5" /></svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function QuestionCard({
  question,
  difficultyTarget = 5,
  onRemove,
  onUpdate,
  onAddSubQuestion,
  onRemoveSubQuestion,
  onUpdateSubQuestion,
}: QuestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showBulkPanel, setShowBulkPanel] = useState(false);
  const [bulkCount, setBulkCount] = useState(3);
  // Track which sub-question IDs have their sub-level picker open
  const [openSubPickers, setOpenSubPickers] = useState<Set<string>>(new Set());

  const { categorizedMaterial } = useExamStore();

  // mcqOptionsCount from question or default 4
  const mcqOptionsCount = question.mcqOptionsCount ?? 4;
  const answerSpaceDefault = question.answerSpaceLines ?? 0;

  // ─── Pool helpers ───────────────────────────────────────────────────────
  const getPool = (type: QuestionType): ExamQuestionSuggestion[] => {
    if (!categorizedMaterial) return [];
    switch (type) {
      case "problem":    return categorizedMaterial.problemSolving || [];
      case "definition": return categorizedMaterial.definitions || [];
      case "mcq":        return categorizedMaterial.multipleChoice || [];
      case "comparison": return categorizedMaterial.comparisons || [];
      case "drawing":    return categorizedMaterial.drawings || [];
      case "short_answer":
        return [
          ...(categorizedMaterial.shortAnswers || []),
          ...(categorizedMaterial.justifications || []),
          ...(categorizedMaterial.dependencies || []),
        ];
      default: return [];
    }
  };

  /** Set of texts already used as sub-question content (to prevent duplicates). */
  const usedTexts = new Set(question.subQuestions.map((s) => s.contentText).filter(Boolean));

  const sortedSuggestions = (type: QuestionType) =>
    [...getPool(type)]
      .filter((s) => !usedTexts.has(s.text))
      .sort((a, b) => Math.abs(a.difficulty - difficultyTarget) - Math.abs(b.difficulty - difficultyTarget));

  const totalAvailable = getPool(question.type).length;
  const remaining      = sortedSuggestions(question.type).length;

  // ─── Add a single suggestion ────────────────────────────────────────────
  const addSuggestion = (suggestion: ExamQuestionSuggestion) => {
    const currentCount = question.subQuestions.length;
    const newSub: SubQuestion = {
      id: crypto.randomUUID(),
      label: ARABIC_LABELS[currentCount % ARABIC_LABELS.length],
      type: question.type,
      contentText: suggestion.text,
      sortOrder: currentCount,
      ...(question.type === "mcq" ? { mcqOptions: buildMcqOptions(suggestion, mcqOptionsCount) } : {}),
    };
    onUpdate({ subQuestions: [...question.subQuestions, newSub] });
  };

  /** Fill a specific empty sub-question slot with suggested content */
  const fillSubQuestion = (subId: string, suggestion: ExamQuestionSuggestion) => {
    onUpdateSubQuestion(subId, {
      contentText: suggestion.text,
      ...(question.type === "mcq" ? { mcqOptions: buildMcqOptions(suggestion, mcqOptionsCount) } : {}),
    });
    setOpenSubPickers((prev) => {
      const next = new Set(prev); next.delete(subId); return next;
    });
  };

  // ─── Bulk fill: add N suggestions from the sorted pool ──────────────────
  const handleBulkFill = () => {
    const candidates = sortedSuggestions(question.type).slice(0, bulkCount);
    if (!candidates.length) return;
    const currentCount = question.subQuestions.length;
    const newSubs: SubQuestion[] = candidates.map((s, i) => ({
      id: crypto.randomUUID(),
      label: ARABIC_LABELS[(currentCount + i) % ARABIC_LABELS.length],
      type: question.type,
      contentText: s.text,
      sortOrder: currentCount + i,
      ...(question.type === "mcq" ? { mcqOptions: buildMcqOptions(s, mcqOptionsCount) } : {}),
    }));
    onUpdate({ subQuestions: [...question.subQuestions, ...newSubs] });
    setShowBulkPanel(false);
  };

  const toggleSubPicker = (subId: string) => {
    setOpenSubPickers((prev) => {
      const next = new Set(prev);
      next.has(subId) ? next.delete(subId) : next.add(subId);
      return next;
    });
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }} transition={{ duration: 0.3 }}>
      <Card className="glass-card overflow-hidden border-0">

        {/* Header */}
        <div className="flex cursor-pointer items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-inter text-sm font-bold text-primary">
            س{question.questionNumber}
          </div>
          <div className="flex flex-1 items-center gap-2">
            <span className="text-lg">{TYPE_ICONS[question.type]}</span>
            <span className="font-medium text-foreground">{QUESTION_TYPE_LABELS[question.type]}</span>
            {question.subQuestions.length > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 font-inter text-xs text-muted-foreground">
                {question.subQuestions.length} فرع
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <motion.svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground" animate={{ rotate: isExpanded ? 180 : 0 }}>
              <path d="m6 9 6 6 6-6" />
            </motion.svg>
            <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="ms-2 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>

        {isExpanded && (
          <CardContent className="space-y-4 border-t border-border/50 px-5 pb-5 pt-4">
            {/* Type + Instructions row */}
            <div className="flex gap-3">
              <div className="flex-1">
                <Select value={question.type} onValueChange={(val) => onUpdate({ type: val as QuestionType })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(QUESTION_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{TYPE_ICONS[key as QuestionType]} {label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Input value={question.instructions || ""} onChange={(e) => onUpdate({ instructions: e.target.value })} placeholder="تعليمات (مثال: أجب عن 5 من 6)" className="h-9 text-sm" dir="rtl" />
              </div>
            </div>

            {/* MCQ options count + answer space row */}
            <div className="flex flex-wrap gap-2">
              {question.type === "mcq" && (
                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-1.5">
                  <span className="text-xs text-muted-foreground">عدد الخيارات:</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => onUpdate({ mcqOptionsCount: Math.max(2, mcqOptionsCount - 1) })} className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm">−</button>
                    <span className="font-inter text-sm font-bold text-foreground w-4 text-center">{mcqOptionsCount}</span>
                    <button onClick={() => onUpdate({ mcqOptionsCount: Math.min(6, mcqOptionsCount + 1) })} className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm">+</button>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-1.5">
                <span className="text-xs text-muted-foreground">مساحة الإجابة:</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => onUpdate({ answerSpaceLines: Math.max(0, (question.answerSpaceLines ?? 0) - 1) })} className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm">−</button>
                  <span className="font-inter text-sm font-bold text-foreground w-4 text-center">{answerSpaceDefault}</span>
                    <button onClick={() => onUpdate({ answerSpaceLines: Math.min(15, (question.answerSpaceLines ?? 0) + 1) })} className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm">+</button>
                </div>
                <span className="text-xs text-muted-foreground">سطر</span>
              </div>
            </div>

            {/* ─── AI Section ─── */}
            {totalAvailable > 0 && (
              <div className="space-y-2">
                {/* Row: Scroll picker toggle + Bulk Fill */}
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setShowBulkPanel(!showBulkPanel)} className="flex-1 gap-1.5 bg-primary/10 text-primary hover:bg-primary/20">
                    <span>✨</span>
                    {showBulkPanel ? "إخفاء الاقتراحات" : `اقتراحات الذكاء الاصطناعي (${remaining} متاح)`}
                    <motion.svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" animate={{ rotate: showBulkPanel ? 180 : 0 }}>
                      <path d="m6 9 6 6 6-6" />
                    </motion.svg>
                  </Button>
                </div>

                {/* Panel: scrollable list + count-fill */}
                <AnimatePresence>
                  {showBulkPanel && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="rounded-xl border border-primary/15 bg-primary/5 p-2 space-y-2">
                        {/* Header */}
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[11px] text-muted-foreground">مرتبة حسب الصعوبة المطلوبة ({difficultyTarget}/10)</span>
                        </div>

                        {/* Scrollable list */}
                        <div className="max-h-64 overflow-y-auto space-y-1 overscroll-contain">
                          {sortedSuggestions(question.type).length === 0 ? (
                            <p className="text-center text-xs text-muted-foreground py-3">تمت إضافة جميع الاقتراحات المتاحة</p>
                          ) : (
                            sortedSuggestions(question.type).map((s, idx) => {
                              const { key, label } = difficultyMeta(s.difficulty);
                              return (
                                <div key={idx} className="flex items-start gap-2 rounded-lg px-2 py-2 hover:bg-background/60 transition-colors group">
                                  <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 font-inter text-[10px] font-bold ${DIFFICULTY_COLORS[key]}`}>{label}</span>
                                  <p className="flex-1 text-xs text-foreground leading-relaxed line-clamp-2" dir="rtl">{s.text}</p>
                                  {question.type === "mcq" && s.options && s.options.length > 0 && (
                                    <div className="hidden group-hover:flex flex-col gap-0.5 text-[10px] text-muted-foreground max-w-[100px] shrink-0">
                                      {s.options.slice(0, 3).map((opt, oi) => (
                                        <span key={oi} className="truncate">{ARABIC_LABELS[oi]}) {opt}</span>
                                      ))}
                                    </div>
                                  )}
                                  <button onClick={() => addSuggestion(s)} className="shrink-0 rounded p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/15 transition-colors" title="إضافة">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M12 5v14" /><path d="M5 12h14" />
                                    </svg>
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Count-based fill row */}
                        <div className="flex items-center gap-2 border-t border-primary/10 pt-2 px-1">
                          <span className="text-[11px] text-muted-foreground shrink-0">إضافة</span>
                          <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-background/60 px-2 py-0.5">
                            <button onClick={() => setBulkCount(Math.max(1, bulkCount - 1))} className="text-muted-foreground hover:text-foreground transition-colors text-sm px-1">−</button>
                            <span className="font-inter text-sm font-bold text-foreground w-5 text-center">{bulkCount}</span>
                            <button onClick={() => setBulkCount(Math.min(remaining, bulkCount + 1))} className="text-muted-foreground hover:text-foreground transition-colors text-sm px-1">+</button>
                          </div>
                          <span className="text-[11px] text-muted-foreground shrink-0">سؤال تلقائياً</span>
                          <Button size="sm" onClick={handleBulkFill} disabled={remaining === 0} className="ms-auto h-7 px-3 text-xs bg-primary/20 text-primary hover:bg-primary/30 border-0">
                            إضافة ✓
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ─── Sub-questions ─── */}
            {question.subQuestions.length > 0 && (
              <div className="space-y-3 rounded-xl bg-muted/30 p-3">
                {question.subQuestions.map((sub) => {
                  const subPickerOpen = openSubPickers.has(sub.id);
                  const subPool = sortedSuggestions(question.type);

                  return (
                    <div key={sub.id} className="flex flex-col gap-2 rounded-lg bg-background/50 px-3 py-2">
                      {/* Sub-question header */}
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">{sub.label}</span>
                        <Select value={sub.type} onValueChange={(val) => onUpdateSubQuestion(sub.id, { type: val as QuestionType })}>
                          <SelectTrigger className="h-7 max-w-[150px] text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(QUESTION_TYPE_LABELS).map(([key, label]) => (
                              <SelectItem key={key} value={key} className="text-xs">{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* AI suggest button for this specific sub-question */}
                        {subPool.length > 0 && (
                          <button
                            onClick={() => toggleSubPicker(sub.id)}
                            className={`ms-auto rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${subPickerOpen ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-primary hover:bg-primary/10"}`}
                            title="اقتراح AI لهذا الفرع"
                          >
                            ✨ AI
                          </button>
                        )}

                        <button onClick={() => onRemoveSubQuestion(sub.id)} className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive transition-colors" title="حذف">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Per-sub AI picker */}
                      <AnimatePresence>
                        {subPickerOpen && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                            <SubQuestionSuggestionPicker
                              suggestions={getPool(question.type)}
                              alreadyAddedTexts={usedTexts}
                              difficultyTarget={difficultyTarget}
                              onPick={(s) => fillSubQuestion(sub.id, s)}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Content text area */}
                      <textarea
                        value={sub.contentText}
                        onChange={(e) => onUpdateSubQuestion(sub.id, { contentText: e.target.value })}
                        placeholder="نص السؤال..."
                        dir="rtl"
                        className="flex min-h-[56px] w-full resize-y rounded-md border border-input bg-background/80 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />

                      {/* MCQ options editor */}
                      {sub.type === "mcq" && sub.mcqOptions && sub.mcqOptions.length > 0 && (
                        <div className="rounded-lg bg-muted/40 px-2 py-2 space-y-1">
                          {sub.mcqOptions.map((opt, oi) => (
                            <div key={opt.id} className="flex items-center gap-2">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold bg-primary/10 text-primary">{opt.label}</span>
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => {
                                  const updated = [...(sub.mcqOptions || [])];
                                  updated[oi] = { ...updated[oi], text: e.target.value };
                                  onUpdateSubQuestion(sub.id, { mcqOptions: updated });
                                }}
                                placeholder={`نص الخيار ${opt.label}`}
                                dir="rtl"
                                className="flex-1 rounded-md border border-input bg-background/60 px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              />
                              <button
                                onClick={() => {
                                  const updated = (sub.mcqOptions || []).map((o, i) => ({ ...o, isCorrect: i === oi }));
                                  onUpdateSubQuestion(sub.id, { mcqOptions: updated });
                                }}
                                className={`shrink-0 rounded-full w-4 h-4 border-2 transition-colors ${opt.isCorrect ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground hover:border-emerald-400"}`}
                                title="الإجابة الصحيحة"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add sub-question + add empty MCQ */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // If MCQ type, attach empty options immediately
                  const currentCount = question.subQuestions.length;
                  const newSub: SubQuestion = {
                    id: crypto.randomUUID(),
                    label: ARABIC_LABELS[currentCount % ARABIC_LABELS.length],
                    type: question.type,
                    contentText: "",
                    sortOrder: currentCount,
                    ...(question.type === "mcq" ? { mcqOptions: emptyMcqOptions(mcqOptionsCount) } : {}),
                  };
                  onUpdate({ subQuestions: [...question.subQuestions, newSub] });
                }}
                className="flex-1 gap-1.5 border border-dashed border-border text-xs text-muted-foreground hover:text-foreground"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14" /><path d="M5 12h14" />
                </svg>
                إضافة فرع يدوياً
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}
