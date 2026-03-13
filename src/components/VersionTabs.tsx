"use client";

import { motion } from "framer-motion";
import type { ExamVersion } from "@/lib/types/exam";

interface VersionTabsProps {
  versions: ExamVersion[];
  activeVersionId: string | null;
  onSelectVersion: (id: string) => void;
  onAddVersion: () => void;
}

export function VersionTabs({
  versions,
  activeVersionId,
  onSelectVersion,
  onAddVersion,
}: VersionTabsProps) {
  return (
    <div className="flex items-center gap-2">
      {versions.map((version) => {
        const isActive = version.id === activeVersionId;
        return (
          <motion.button
            key={version.id}
            onClick={() => onSelectVersion(version.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              relative rounded-xl px-5 py-2.5 text-sm font-semibold transition-all
              ${isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }
            `}
          >
            نموذج {version.label}
            {isActive && (
              <motion.div
                layoutId="active-version-indicator"
                className="absolute inset-x-0 -bottom-1 mx-auto h-0.5 w-6 rounded-full bg-primary"
              />
            )}
            <span className="ms-1.5 font-inter text-xs opacity-50">
              ({version.questions.length})
            </span>
          </motion.button>
        );
      })}

      <motion.button
        onClick={onAddVersion}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground transition-all hover:border-muted-foreground/40 hover:text-foreground"
        title="إضافة نموذج جديد"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
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
      </motion.button>
    </div>
  );
}
