"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface SubjectSelectorProps {
  grade: number;
  selectedSubjectId: string | null;
  onSelect: (id: string, name: string) => void;
}

interface Subject {
  id: string;
  name_ar: string;
  name_en: string | null;
  grade: number;
}

// Fallback subjects for MVP when DB is empty
const FALLBACK_SUBJECTS: Subject[] = [
  { id: "physics-12", name_ar: "الفيزياء", name_en: "Physics", grade: 12 },
  { id: "chemistry-12", name_ar: "الكيمياء", name_en: "Chemistry", grade: 12 },
  { id: "biology-12", name_ar: "الأحياء", name_en: "Biology", grade: 12 },
  { id: "math-12", name_ar: "الرياضيات", name_en: "Mathematics", grade: 12 },
];

// MVP: only physics is enabled
const ENABLED_SUBJECTS = ["الفيزياء", "Physics"];

const SUBJECT_ICONS: Record<string, string> = {
  الفيزياء: "⚛️",
  Physics: "⚛️",
  الكيمياء: "🧪",
  Chemistry: "🧪",
  الأحياء: "🧬",
  Biology: "🧬",
  الرياضيات: "📐",
  Mathematics: "📐",
};

export function SubjectSelector({ grade, selectedSubjectId, onSelect }: SubjectSelectorProps) {
  const [subjects, setSubjects] = useState<Subject[]>(FALLBACK_SUBJECTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubjects() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("subjects")
          .select("*")
          .eq("grade", grade)
          .order("name_ar");

        if (!error && data && data.length > 0) {
          setSubjects(data);
        }
        // If no data, keep fallback
      } catch {
        // DB not set up yet — use fallback
      } finally {
        setLoading(false);
      }
    }

    fetchSubjects();
  }, [grade]);

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-foreground">اختر المادة</h2>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {subjects.map((subject, i) => {
            const isEnabled = ENABLED_SUBJECTS.some((s) => subject.name_ar.includes(s) || subject.name_en?.includes(s));
            const isSelected = selectedSubjectId === subject.id;

            return (
              <motion.button
                key={subject.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => isEnabled && onSelect(subject.id, subject.name_ar)}
                disabled={!isEnabled}
                className={`relative rounded-xl border-2 p-6 text-center transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-md"
                    : isEnabled
                      ? "border-border hover:border-primary/50 hover:bg-muted/50"
                      : "cursor-not-allowed border-border/50 opacity-40"
                }`}
              >
                <div className="mb-2 text-4xl">
                  {SUBJECT_ICONS[subject.name_ar] || SUBJECT_ICONS[subject.name_en || ""] || "📚"}
                </div>
                <div className="text-lg font-semibold">{subject.name_ar}</div>
                {subject.name_en && (
                  <div className="text-xs text-muted-foreground">{subject.name_en}</div>
                )}
                {!isEnabled && (
                  <div className="absolute -top-2 -end-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    قريباً
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
