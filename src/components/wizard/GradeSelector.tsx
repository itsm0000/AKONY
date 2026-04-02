"use client";

import { motion } from "framer-motion";

interface GradeSelectorProps {
  selectedGrade: number | null;
  onSelect: (grade: number) => void;
}

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);

// For MVP, only Grade 12 is enabled
const ENABLED_GRADES = [12];

const GRADE_LABELS: Record<number, string> = {
  1: "الأول", 2: "الثاني", 3: "الثالث", 4: "الرابع", 5: "الخامس",
  6: "السادس", 7: "السابع", 8: "الثامن", 9: "التاسع", 10: "العاشر",
  11: "الحادي عشر", 12: "الثاني عشر (السادس العلمي)",
};

export function GradeSelector({ selectedGrade, onSelect }: GradeSelectorProps) {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-foreground">اختر الصف الدراسي</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {GRADES.map((grade, i) => {
          const isEnabled = ENABLED_GRADES.includes(grade);
          const isSelected = selectedGrade === grade;

          return (
            <motion.button
              key={grade}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => isEnabled && onSelect(grade)}
              disabled={!isEnabled}
              className={`relative rounded-xl border-2 p-4 text-center transition-all ${
                isSelected
                  ? "border-primary bg-primary/10 shadow-md"
                  : isEnabled
                    ? "border-border hover:border-primary/50 hover:bg-muted/50"
                    : "cursor-not-allowed border-border/50 opacity-40"
              }`}
            >
              <div className="mb-1 text-2xl font-bold">{grade}</div>
              <div className="text-xs text-muted-foreground">{GRADE_LABELS[grade]}</div>
              {!isEnabled && (
                <div className="absolute -top-2 -end-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  قريباً
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
