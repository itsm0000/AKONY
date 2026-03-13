"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useExamStore } from "@/lib/stores/examStore";
import { useAnnotationCanvas } from "@/hooks/useAnnotationCanvas";
import { PdfAnnotationViewer } from "@/components/PdfAnnotationViewer";
import { AssignmentSidebar } from "@/components/AssignmentSidebar";

export default function MarkPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const { exam, activeVersionId } = useExamStore();
  const activeVersion = exam?.versions.find((v) => v.id === activeVersionId);

  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);

  // Load file from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`exam-file-${examId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setFileDataUrl(parsed.dataUrl);
      }
    } catch {
      // File not found in sessionStorage
    }
  }, [examId]);

  // Initialize the annotation canvas
  const annotationState = useAnnotationCanvas({
    width: 800,
    height: 1000,
    pageNumber: 1,
    onRegionCreated: (region) => {
      setSelectedRegionId(region.id);
    },
  });

  const handleAssign = useCallback(
    (regionId: string, subQuestionId: string) => {
      annotationState.assignRegion(regionId, subQuestionId);
      setSelectedRegionId(null);
    },
    [annotationState]
  );

  if (!exam) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">لم يتم العثور على الامتحان</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/")}>
            العودة للرئيسية
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 start-1/3 h-[400px] w-[400px] rounded-full bg-[oklch(0.72_0.19_163/0.06)] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">تحديد المحتوى</h1>
            <p className="text-sm text-muted-foreground">
              ارسم على ملف PDF لتحديد الأسئلة — ثم اربطها بهيكل الامتحان
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/exam/${examId}/structure`)}>
              ← الهيكل
            </Button>
            <Button
              size="sm"
              onClick={() => router.push(`/exam/${examId}/edit`)}
              className="accent-gradient border-0 text-white"
            >
              التالي — التحرير →
            </Button>
          </div>
        </motion.div>

        {/* Main layout: PDF viewer + sidebar */}
        <div className="flex gap-4" style={{ height: "calc(100vh - 120px)" }}>
          {/* PDF Viewer */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 min-w-0"
          >
            {fileDataUrl ? (
              <PdfAnnotationViewer
                fileDataUrl={fileDataUrl}
                annotationState={annotationState}
                onRegionCreated={(region) => setSelectedRegionId(region.id)}
              />
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-border">
                <div className="text-center">
                  <div className="mb-4 text-5xl">📄</div>
                  <p className="text-lg text-muted-foreground">لم يتم تحميل ملف</p>
                  <p className="mt-1 text-sm text-muted-foreground/60">
                    ارجع للصفحة الرئيسية وارفع ملف PDF
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push("/")}
                  >
                    العودة للرئيسية
                  </Button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Assignment Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="w-72 shrink-0"
          >
            <AssignmentSidebar
              questions={activeVersion?.questions ?? []}
              regions={annotationState.regions}
              onAssign={handleAssign}
              onRemoveRegion={annotationState.removeRegion}
              selectedRegionId={selectedRegionId}
              onSelectRegion={setSelectedRegionId}
            />
          </motion.div>
        </div>
      </div>
    </main>
  );
}
