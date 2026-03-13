"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UploadZone } from "@/components/UploadZone";
import { HeroSection } from "@/components/HeroSection";

export default function HomePage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelected = useCallback(
    async (file: File) => {
      setIsUploading(true);

      // For MVP: Store file in memory/local state and navigate
      // Future: Upload to Supabase Storage
      const examId = crypto.randomUUID();

      // Store file reference in sessionStorage for downstream use
      const reader = new FileReader();
      reader.onload = () => {
        try {
          sessionStorage.setItem(
            `exam-file-${examId}`,
            JSON.stringify({
              name: file.name,
              type: file.type,
              size: file.size,
              dataUrl: reader.result,
            })
          );
        } catch {
          // File too large for sessionStorage — will use alternative
        }

        router.push(`/exam/${examId}/scope`);
      };
      reader.readAsDataURL(file);
    },
    [router]
  );

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background gradient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 start-1/4 h-[500px] w-[500px] rounded-full bg-[oklch(0.72_0.19_163/0.08)] blur-[120px]" />
        <div className="absolute -bottom-40 end-1/4 h-[400px] w-[400px] rounded-full bg-[oklch(0.65_0.20_250/0.06)] blur-[100px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-12 px-6 py-20">
        <HeroSection />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="w-full max-w-2xl"
        >
          <UploadZone
            onFileSelected={handleFileSelected}
            isUploading={isUploading}
          />
        </motion.div>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
          className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {[
            {
              icon: "📐",
              title: "بناء الهيكل",
              desc: "حدد أنواع الأسئلة وصمم هيكل الامتحان بسهولة",
            },
            {
              icon: "✏️",
              title: "تحديد المحتوى",
              desc: "ارسم على ملف PDF لتحديد الأسئلة من المنهج",
            },
            {
              icon: "📄",
              title: "تصدير فوري",
              desc: "أنشئ نُسخ امتحانية متعددة بتنسيق RTL مثالي",
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.8 + i * 0.1,
                ease: "easeOut",
              }}
              className="glass-card rounded-xl p-5 text-center"
            >
              <div className="mb-2 text-3xl">{feature.icon}</div>
              <h3 className="mb-1 text-sm font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}
