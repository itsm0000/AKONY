"use client";

import { useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExamStore } from "@/lib/stores/examStore";

export default function ScopePage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const { initExam, setScope } = useExamStore();

  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(10);
  const [chapters, setChapters] = useState("");
  const [title, setTitle] = useState("");

  const handleProceed = useCallback(() => {
    // Initialize the exam in the store
    initExam(examId, title || "امتحان جديد");
    setScope({
      startPage,
      endPage,
      chapters: chapters || undefined,
    });

    router.push(`/exam/${examId}/structure`);
  }, [examId, title, startPage, endPage, chapters, initExam, setScope, router]);

  return (
    <main className="relative min-h-screen">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 start-1/4 h-[400px] w-[400px] rounded-full bg-[oklch(0.72_0.19_163/0.06)] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-2xl px-6 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl font-bold text-foreground">تحديد نطاق الامتحان</h1>
          <p className="mt-2 text-muted-foreground">
            حدد الفصول والصفحات التي يغطيها الامتحان
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-6"
        >
          {/* Exam Title */}
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="text-lg">عنوان الامتحان</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                id="exam-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: امتحان الفيزياء النصفي — الفصل الرابع"
                className="text-base"
                dir="rtl"
              />
            </CardContent>
          </Card>

          {/* Page Range */}
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="text-lg">نطاق الصفحات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:flex-1">
                  <Label htmlFor="start-page" className="mb-2 block text-sm text-muted-foreground">
                    من صفحة
                  </Label>
                  <Input
                    id="start-page"
                    type="number"
                    min={1}
                    value={startPage}
                    onChange={(e) => setStartPage(Number(e.target.value))}
                    className="font-inter text-center text-lg"
                    dir="ltr"
                  />
                </div>

                <span className="my-2 sm:my-0 sm:mt-6 text-xl text-muted-foreground rotate-90 sm:rotate-0">←</span>

                <div className="w-full sm:flex-1">
                  <Label htmlFor="end-page" className="mb-2 block text-sm text-muted-foreground">
                    إلى صفحة
                  </Label>
                  <Input
                    id="end-page"
                    type="number"
                    min={startPage}
                    value={endPage}
                    onChange={(e) => setEndPage(Number(e.target.value))}
                    className="font-inter text-center text-lg"
                    dir="ltr"
                  />
                </div>
              </div>

              <p className="mt-3 text-center text-sm text-muted-foreground">
                المنهج يشمل{" "}
                <span className="font-inter font-semibold text-foreground">
                  {Math.max(0, endPage - startPage + 1)}
                </span>{" "}
                صفحة
              </p>
            </CardContent>
          </Card>

          {/* Chapter Range */}
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="text-lg">الفصول (اختياري)</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                id="chapters"
                value={chapters}
                onChange={(e) => setChapters(e.target.value)}
                placeholder="مثال: الفصل الرابع — الاتزان والعزوم"
                className="text-base"
                dir="rtl"
              />
            </CardContent>
          </Card>

          {/* Proceed button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={handleProceed}
              size="lg"
              className="accent-gradient w-full border-0 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl"
            >
              التالي — بناء هيكل الامتحان ←
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
