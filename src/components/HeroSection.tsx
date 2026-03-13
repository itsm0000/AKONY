"use client";

import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="text-center"
    >
      {/* Logo / Brand */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-6 inline-flex items-center gap-3"
      >
        <div className="accent-gradient flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold text-white shadow-lg">
          أ
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          AKONY
        </h1>
      </motion.div>

      {/* Tagline */}
      <p className="mx-auto max-w-lg text-lg text-muted-foreground sm:text-xl">
        صانع الامتحانات الذكي
        <br />
        <span className="text-sm text-muted-foreground/70">
          ارفع المنهج — حدد الأسئلة — أنشئ الامتحان
        </span>
      </p>
    </motion.div>
  );
}
