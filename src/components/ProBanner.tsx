"use client";

/**
 * ProBanner — Editor Header Banner (Step 6 / Section 5e)
 *
 * Shown to free-tier users in the editor header.
 * Subtle, dismissible. Never shown to Pro users.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ProBannerProps {
  /** Hide the banner entirely for Pro users */
  isPro?: boolean;
}

export function ProBanner({ isPro = false }: ProBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (isPro || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
        className="flex items-center justify-between gap-2 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2"
      >
        <p className="text-xs text-amber-700 dark:text-amber-400">
          ✨ ترقّى إلى{" "}
          <span className="font-semibold">Pro</span>{" "}
          للحصول على تصديرات غير محدودة بدون علامة مائية
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {}}
            className="rounded-md bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-amber-600 transition-colors"
          >
            ترقية الآن
          </button>
          <button
            onClick={() => setDismissed(true)}
            aria-label="إغلاق"
            className="text-muted-foreground hover:text-foreground transition-colors text-xs px-1"
          >
            ✕
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
