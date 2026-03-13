"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { Question } from "@/lib/types/exam";
import { QUESTION_TYPE_LABELS } from "@/lib/types/exam";

interface AnnotationRegion {
  id: string;
  type: string;
  assignedTo?: string;
  pageNumber: number;
}

interface AssignmentSidebarProps {
  questions: Question[];
  regions: AnnotationRegion[];
  onAssign: (regionId: string, subQuestionId: string) => void;
  onRemoveRegion: (regionId: string) => void;
  selectedRegionId: string | null;
  onSelectRegion: (id: string | null) => void;
}

export function AssignmentSidebar({
  questions,
  regions,
  onAssign,
  onRemoveRegion,
  selectedRegionId,
  onSelectRegion,
}: AssignmentSidebarProps) {
  const unassignedRegions = regions.filter((r) => !r.assignedTo);
  const assignedCount = regions.filter((r) => r.assignedTo).length;

  return (
    <div className="glass-card flex h-full flex-col rounded-2xl">
      {/* Header */}
      <div className="border-b border-border/50 px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">ربط المحتوى</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {assignedCount} / {regions.length} منطقة مربوطة
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {/* Unassigned regions */}
        {unassignedRegions.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              مناطق غير مربوطة ({unassignedRegions.length})
            </p>
            <div className="space-y-1.5">
              <AnimatePresence>
                {unassignedRegions.map((region) => (
                  <motion.div
                    key={region.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-all cursor-pointer ${
                      selectedRegionId === region.id
                        ? "bg-primary/15 ring-1 ring-primary/30"
                        : "bg-muted/40 hover:bg-muted/60"
                    }`}
                    onClick={() =>
                      onSelectRegion(
                        selectedRegionId === region.id ? null : region.id
                      )
                    }
                  >
                    <div className="h-3 w-3 rounded-sm bg-emerald-500/60" />
                    <span className="text-muted-foreground">
                      {region.type === "rect" ? "مستطيل" : region.type === "circle" ? "دائرة" : "رسم حر"}{" "}
                      — ص{region.pageNumber}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveRegion(region.id);
                      }}
                      className="ms-auto text-muted-foreground/50 hover:text-destructive"
                    >
                      ✕
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Questions for assignment */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">أسئلة الامتحان</p>
          <div className="space-y-2">
            {questions.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground/60">
                لا توجد أسئلة. ارجع لبناء الهيكل أولاً.
              </p>
            ) : (
              questions.map((question) => (
                <div key={question.id} className="rounded-xl bg-muted/30 p-2.5">
                  <div className="mb-1.5 flex items-center gap-2 text-xs">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 font-inter text-[10px] font-bold text-primary">
                      س{question.questionNumber}
                    </span>
                    <span className="font-medium text-foreground">
                      {QUESTION_TYPE_LABELS[question.type]}
                    </span>
                  </div>

                  {question.subQuestions.length > 0 ? (
                    <div className="space-y-1 ps-3">
                      {question.subQuestions.map((sub) => {
                        const assignedRegion = regions.find(
                          (r) => r.assignedTo === sub.id
                        );
                        return (
                          <div
                            key={sub.id}
                            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-all ${
                              assignedRegion
                                ? "bg-blue-500/10 text-blue-400"
                                : "bg-background/50 text-muted-foreground"
                            }`}
                          >
                            <span className="font-inter font-semibold">
                              {sub.label}
                            </span>
                            <span className="flex-1 truncate">
                              {QUESTION_TYPE_LABELS[sub.type]}
                            </span>
                            {selectedRegionId && !assignedRegion && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 px-2 text-[10px] text-emerald-400 hover:bg-emerald-500/10"
                                onClick={() =>
                                  onAssign(selectedRegionId, sub.id)
                                }
                              >
                                ← ربط
                              </Button>
                            )}
                            {assignedRegion && (
                              <span className="text-[10px] text-blue-400/60">
                                ✓ مربوط
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="ps-3 text-[10px] text-muted-foreground/50">
                      لا توجد فروع — أضف فروعاً من صفحة الهيكل
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
