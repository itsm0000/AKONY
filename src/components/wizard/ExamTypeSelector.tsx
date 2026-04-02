"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface ExamTypeSelectorProps {
  subjectId: string;
  selectedType: string | null;
  onSelect: (type: string) => void;
}

interface ExamType {
  id: string;
  type: string;
  label: string;
  description: string;
  enabled: boolean;
}

// Fallback types for MVP when DB is empty
const FALLBACK_TYPES: ExamType[] = [
  { id: "ministerial", type: "ministerial", label: "وزاري", description: "امتحان وزارة التربية — النموذج الرسمي", enabled: true },
  { id: "monthly", type: "monthly", label: "شهري", description: "امتحان شهري حسب خطة المنهج", enabled: false },
  { id: "midterm", type: "midterm", label: "نصف سنوي", description: "امتحان نصف سنوي شامل", enabled: false },
];

export function ExamTypeSelector({ subjectId, selectedType, onSelect }: ExamTypeSelectorProps) {
  const [types, setTypes] = useState<ExamType[]>(FALLBACK_TYPES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTypes() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("exam_blueprints")
          .select("id, exam_type")
          .eq("subject_id", subjectId);

        if (!error && data && data.length > 0) {
          const fetched = data.map((b) => {
            const fallback = FALLBACK_TYPES.find((f) => f.type === b.exam_type);
            return {
              id: b.id,
              type: b.exam_type,
              label: fallback?.label || b.exam_type,
              description: fallback?.description || "",
              enabled: true,
            };
          });
          setTypes(fetched);
        }
      } catch {
        // DB not set up — use fallback
      } finally {
        setLoading(false);
      }
    }

    fetchTypes();
  }, [subjectId]);

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-foreground">اختر نوع الامتحان</h2>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      ) : (
        <div className="grid gap-4">
          {types.map((type, i) => {
            const isSelected = selectedType === type.type;

            return (
              <motion.button
                key={type.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => type.enabled && onSelect(type.type)}
                disabled={!type.enabled}
                className={`relative rounded-xl border-2 p-5 text-start transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-md"
                    : type.enabled
                      ? "border-border hover:border-primary/50 hover:bg-muted/50"
                      : "cursor-not-allowed border-border/50 opacity-40"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-semibold">{type.label}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{type.description}</div>
                  </div>
                  {!type.enabled && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      قريباً
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
