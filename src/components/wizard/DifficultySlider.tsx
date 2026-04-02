"use client";

import { motion } from "framer-motion";

interface DifficultySliderProps {
  difficulty: number;
  redirectToPreview: boolean;
  onDifficultyChange: (difficulty: number) => void;
  onTogglePreview: (redirectToPreview: boolean) => void;
}

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "سهل جداً",
  2: "سهل",
  3: "أسهل من المتوسط",
  4: "دون المتوسط",
  5: "متوسط",
  6: "فوق المتوسط",
  7: "أعلى من المتوسط",
  8: "صعب",
  9: "صعب جداً",
  10: "متقدم",
};

export function DifficultySlider({
  difficulty,
  redirectToPreview,
  onDifficultyChange,
  onTogglePreview,
}: DifficultySliderProps) {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-foreground">مستوى الصعوبة</h2>

      {/* Difficulty Display */}
      <div className="mb-8 text-center">
        <motion.div
          key={difficulty}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-2 text-5xl font-bold text-primary"
        >
          {difficulty}
        </motion.div>
        <div className="text-sm text-muted-foreground">
          {DIFFICULTY_LABELS[difficulty]}
        </div>
      </div>

      {/* Slider */}
      <div className="mb-8 px-4">
        <input
          type="range"
          min={1}
          max={10}
          value={difficulty}
          onChange={(e) => onDifficultyChange(parseInt(e.target.value))}
          className="slider-input h-2 w-full cursor-pointer appearance-none rounded-full bg-muted"
        />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>1 — سهل</span>
          <span>10 — متقدم</span>
        </div>
      </div>

      {/* Toggle: Default to Preview */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-foreground">بعد الإنشاء، انتقل إلى:</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              يمكنك تغيير هذا لاحقاً من الإعدادات
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-sm font-medium transition-colors ${
                !redirectToPreview ? "text-primary" : "text-muted-foreground"
              }`}
            >
              المحرر
            </span>
            <button
              onClick={() => onTogglePreview(!redirectToPreview)}
              aria-label="تبديل الوجهة بعد الإنشاء"
              className={`relative h-6 w-11 rounded-full transition-colors ${
                redirectToPreview ? "bg-primary" : "bg-muted"
              }`}
            >
              <motion.div
                layout
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md"
                style={{
                  left: redirectToPreview ? "auto" : "0.125rem",
                  right: redirectToPreview ? "0.125rem" : "auto",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span
              className={`text-sm font-medium transition-colors ${
                redirectToPreview ? "text-primary" : "text-muted-foreground"
              }`}
            >
              المعاينة
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
