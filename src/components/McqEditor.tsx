"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { McqOption } from "@/lib/types/exam";
import { MCQ_LABELS } from "@/lib/utils/bidi";

interface McqEditorProps {
  options: McqOption[];
  onChange: (options: McqOption[]) => void;
}

export function McqEditor({ options, onChange }: McqEditorProps) {
  const handleOptionChange = (id: string, field: keyof McqOption, value: string | boolean) => {
    onChange(
      options.map((opt) =>
        opt.id === id ? { ...opt, [field]: value } : opt
      )
    );
  };

  const handleAddOption = () => {
    const nextIndex = options.length;
    if (nextIndex >= 6) return; // Max 6 options

    onChange([
      ...options,
      {
        id: crypto.randomUUID(),
        label: MCQ_LABELS[nextIndex] ?? `${nextIndex + 1}`,
        text: "",
        isCorrect: false,
        sortOrder: nextIndex,
      },
    ]);
  };

  const handleRemoveOption = (id: string) => {
    if (options.length <= 2) return; // Min 2 options
    const updated = options
      .filter((opt) => opt.id !== id)
      .map((opt, i) => ({
        ...opt,
        label: MCQ_LABELS[i] ?? `${i + 1}`,
        sortOrder: i,
      }));
    onChange(updated);
  };

  const handleSetCorrect = (id: string) => {
    onChange(
      options.map((opt) => ({
        ...opt,
        isCorrect: opt.id === id,
      }))
    );
  };

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {options.map((option) => (
          <motion.div
            key={option.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 transition-all ${
              option.isCorrect
                ? "bg-emerald-500/10 ring-1 ring-emerald-500/30"
                : "bg-muted/30"
            }`}
          >
            {/* Correct answer toggle */}
            <button
              onClick={() => handleSetCorrect(option.id)}
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                option.isCorrect
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-muted-foreground/30 text-transparent hover:border-muted-foreground/50"
              }`}
              title={option.isCorrect ? "الإجابة الصحيحة" : "تعيين كإجابة صحيحة"}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </button>

            {/* Label badge */}
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
              {option.label}
            </span>

            {/* Text input */}
            <Input
              value={option.text}
              onChange={(e) => handleOptionChange(option.id, "text", e.target.value)}
              placeholder={`نص الخيار ${option.label}`}
              className="h-8 flex-1 text-sm"
              dir="rtl"
            />

            {/* Remove button */}
            {options.length > 2 && (
              <button
                onClick={() => handleRemoveOption(option.id)}
                className="rounded p-1 text-muted-foreground/50 transition-colors hover:text-destructive"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add option */}
      {options.length < 6 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddOption}
          className="w-full gap-1.5 border border-dashed border-border text-xs text-muted-foreground hover:text-foreground"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          إضافة خيار
        </Button>
      )}

      {/* Hint */}
      {!options.some((o) => o.isCorrect) && options.length > 0 && (
        <p className="text-center text-[10px] text-amber-400/70">
          ⚠ لم يتم تحديد الإجابة الصحيحة
        </p>
      )}
    </div>
  );
}
