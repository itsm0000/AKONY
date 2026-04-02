"use client";

import { useCallback, useState } from "react";
import { set } from "idb-keyval";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UploadZone } from "@/components/UploadZone";
import { Button } from "@/components/ui/button";
import { AdSlot } from "@/components/AdSlot";

const FEATURES = [
  {
    icon: "⚡",
    title: "توليد فوري",
    desc: "أنشئ امتحاناً كاملاً من بنك الأسئلة في ثوانٍ",
  },
  {
    icon: "🎯",
    title: "محاكاة الوزاري",
    desc: "بنية الامتحان تطابق الهيكلية الوزارية بدقة",
  },
  {
    icon: "📄",
    title: "تصدير احترافي",
    desc: "PDF جاهز للطباعة بتنسيق RTL مثالي",
  },
];

const WHY_PRO = [
  { feature: "توليد امتحانات من بنك الأسئلة", free: true, pro: true },
  { feature: "تصدير PDF بدون علامة مائية", free: false, pro: true },
  { feature: "رفع ملفات PDF مخصصة", free: false, pro: true },
  { feature: "تصدير غير محدود", free: "3 يومياً", pro: true },
  { feature: "بدون إعلانات", free: false, pro: true },
  { feature: "بنك أسئلة شخصي", free: false, pro: true },
];

export default function HomePage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  // State for the Pro gate modal
  const [showProGate, setShowProGate] = useState(false);
  // State for showing upload zone after Pro gate is acknowledged (for demo)
  const [showUpload, setShowUpload] = useState(false);

  // Legacy PDF upload flow (Path B — Pro only)
  const handleFileSelected = useCallback(
    async (file: File) => {
      setIsUploading(true);
      const examId = crypto.randomUUID();

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          await set(`exam-file-${examId}`, {
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl: reader.result,
          });
        } catch (error) {
          console.error("Failed to store file in IndexedDB:", error);
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

      {/* Pro Gate Modal */}
      <AnimatePresence>
        {showProGate && !showUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-2xl">
                  📎
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">ارفع ملفك — Pro فقط</h3>
                  <p className="text-xs text-muted-foreground">ميزة حصرية للمشتركين</p>
                </div>
              </div>
              <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
                ارفع أي ملف PDF — كتاب مدرسي، ملازم، أو مطبوعة — وسيقوم الذكاء الاصطناعي بتحليله وبناء الامتحان تلقائياً.
              </p>
              <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="mb-2 text-xs font-semibold text-amber-600 dark:text-amber-400">يشمل اشتراك Pro:</div>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><span className="text-amber-500">✓</span> رفع ملفات PDF مخصصة (غير محدود)</li>
                  <li className="flex items-center gap-2"><span className="text-amber-500">✓</span> تصدير بدون علامة مائية</li>
                  <li className="flex items-center gap-2"><span className="text-amber-500">✓</span> تصديرات يومية غير محدودة</li>
                  <li className="flex items-center gap-2"><span className="text-amber-500">✓</span> بدون إعلانات</li>
                </ul>
              </div>
              <Button className="w-full bg-amber-500 text-white hover:bg-amber-600 font-semibold mb-2">
                ترقّى إلى Pro — $9/شهر
              </Button>
              {/* Demo-only: allow testing the upload flow */}
              <button
                onClick={() => { setShowUpload(true); setShowProGate(false); }}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                تجربة بدون اشتراك (للتطوير فقط)
              </button>
              <button
                onClick={() => setShowProGate(false)}
                className="mt-1 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                إغلاق
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-10 text-center"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-6 inline-flex items-center gap-3"
          >
            <div className="accent-gradient flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-lg">
              أ
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              AKONY
            </h1>
          </motion.div>

          <p className="mx-auto max-w-lg text-lg text-muted-foreground sm:text-xl">
            امتحاناتك، طريقتك
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground/70">
            أنشئ امتحانات احترافية من بنك الأسئلة الوزارية أو ارفع ملفك الخاص
          </p>
        </motion.div>

        {/* Ad Slot — Leaderboard */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-10 flex justify-center"
        >
          <AdSlot slot="leaderboard" />
        </motion.div>

        {/* Dual Path Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mb-12 grid gap-6 sm:grid-cols-2"
        >
          {/* Path A — K-12 Database (Free) */}
          <div className="group glass-card rounded-2xl border border-border/50 p-6 transition-all hover:border-primary/30 hover:shadow-lg">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                🎓
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                مجاني
              </span>
            </div>
            <h3 className="mb-2 text-xl font-bold text-foreground">امتحاناتي</h3>
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              ولّد امتحانات من بنك الأسئلة الوزاري العراقي. اختر المادة والصعوبة واحصل على امتحان جاهز فوراً.
            </p>
            <Button
              onClick={() => router.push("/wizard")}
              className="w-full accent-gradient border-0 text-white font-semibold"
              size="lg"
            >
              ابدأ الآن — مجاني
            </Button>
          </div>

          {/* Path B — Custom PDF Upload (Pro) */}
          <div className="group glass-card rounded-2xl border border-border/50 p-6 transition-all hover:border-amber-500/30 hover:shadow-lg">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-2xl">
                📎
              </div>
              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                Pro
              </span>
            </div>
            <h3 className="mb-2 text-xl font-bold text-foreground">ارفع ملفك</h3>
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              ارفع ملف PDF مخصص وسيقوم الذكاء الاصطناعي بتحليله وبناء الامتحان من محتواه.
            </p>
            {showUpload ? (
              <UploadZone onFileSelected={handleFileSelected} isUploading={isUploading} />
            ) : (
              <Button
                onClick={() => setShowProGate(true)}
                variant="outline"
                className="w-full border-amber-500/30 font-semibold hover:bg-amber-500/5"
                size="lg"
              >
                🔒 ارفع ملفك — ترقّى إلى Pro
              </Button>
            )}
          </div>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
          className="mb-16 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.5 + i * 0.1,
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

        {/* Why Pro Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mb-16"
        >
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            لماذا ترقّى إلى Pro؟
          </h2>

          <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
            {/* Table Header */}
            <div className="grid grid-cols-3 border-b border-border/50 bg-muted/30 px-6 py-3">
              <div className="text-sm font-semibold text-foreground">الميزة</div>
              <div className="text-center text-sm font-semibold text-muted-foreground">مجاني</div>
              <div className="text-center text-sm font-semibold text-amber-600 dark:text-amber-400">Pro</div>
            </div>

            {/* Table Rows */}
            {WHY_PRO.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-3 items-center px-6 py-3 ${
                  i < WHY_PRO.length - 1 ? "border-b border-border/30" : ""
                }`}
              >
                <div className="text-sm text-foreground">{row.feature}</div>
                <div className="text-center">
                  {row.free === true ? (
                    <span className="text-emerald-500">✓</span>
                  ) : row.free === false ? (
                    <span className="text-muted-foreground/40">—</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">{row.free}</span>
                  )}
                </div>
                <div className="text-center">
                  {row.pro === true ? (
                    <span className="text-emerald-500">✓</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">{String(row.pro)}</span>
                  )}
                </div>
              </div>
            ))}

            {/* CTA */}
            <div className="border-t border-border/50 bg-muted/20 px-6 py-4 text-center">
              <Button className="bg-amber-500 text-white hover:bg-amber-600 font-semibold">
                ترقّى إلى Pro — $9/شهر
              </Button>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
