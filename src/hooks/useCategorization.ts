import { useState, useCallback } from "react";
import { get } from "idb-keyval";
import { createClient } from "@/lib/supabase/client";
import { useExamStore } from "@/lib/stores/examStore";
import { extractImagesFromPdfScope } from "@/lib/utils/pdfTextExtractor";

export interface ExamQuestionSuggestion {
  text: string;
  difficulty: number;
  requiresIllustration: boolean;
  context: string;
  options?: string[]; // MCQ choices only
}

export interface CategorizedData {
  definitions: ExamQuestionSuggestion[];
  multipleChoice: ExamQuestionSuggestion[];
  problemSolving: ExamQuestionSuggestion[];
  comparisons: ExamQuestionSuggestion[];
  justifications: ExamQuestionSuggestion[];
  dependencies: ExamQuestionSuggestion[];
  shortAnswers: ExamQuestionSuggestion[];
  drawings: ExamQuestionSuggestion[];
}

export function useCategorization() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setCategorizedMaterial } = useExamStore();
  const supabase = createClient();

  const runCategorization = useCallback(
    async (
      examId: string,
      materialId: string,
      startPage: number,
      endPage: number
    ) => {
      setIsProcessing(true);
      setError(null);

      try {
        // 1. Check Supabase Cache
        const { data: cached, error: dbError } = await supabase
          .from("categorized_cache")
          .select("categorized_data")
          .eq("material_id", materialId)
          .eq("start_page", startPage)
          .eq("end_page", endPage)
          .maybeSingle();

        if (dbError) {
          console.error("Supabase cache check error:", dbError);
        }

        if (cached && cached.categorized_data) {
          console.log("Found categorization in Supabase cache!");
          setCategorizedMaterial(cached.categorized_data as CategorizedData);
          return; // Exit successfully, UI updating automatically
        }

        console.log("No cache found. Processing material with AI...");

        // 2. Fetch PDF from IDB
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const storedFile: any = await get(`exam-file-${examId}`);
        if (!storedFile || !storedFile.dataUrl) {
          throw new Error("لم يتم العثور على ملف الامتحان");
        }

        let images: string[] = [];
        if (storedFile.type === "application/pdf") {
          // 3. Extract Images from scoped PDF pages
          images = await extractImagesFromPdfScope(
            storedFile.dataUrl,
            startPage,
            endPage
          );
        } else {
          // For images, we would ideally use OCR or vision APIs.
          // For now, prompt the user that only PDFs are fully supported for AI extraction.
          throw new Error(
            "تحليل الذكاء الاصطناعي مدعوم لملفات PDF فقط حالياً."
          );
        }

        if (!images || images.length === 0) {
          throw new Error(
            "لم يتم استخراج أي صور من صفحات الملف المحددة."
          );
        }

        // 4. Send to /api/categorize
        const res = await fetch("/api/categorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "فشل الاتصال بخدمة الذكاء الاصطناعي");
        }

        const categorizedData: CategorizedData = await res.json();

        // 5. Save to Supabase
        const { error: insertError } = await supabase
          .from("categorized_cache")
          .insert({
            material_id: materialId,
            start_page: startPage,
            end_page: endPage,
            categorized_data: categorizedData,
          });

        if (insertError) {
          // Only log insert errors since standard flow shouldn't drop
          console.error("Failed to save to Supabase cache", insertError);
        }

        // 6. Update Store
        setCategorizedMaterial(categorizedData);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "حدث خطأ غير معروف أثناء التحليل";
        setError(msg);
        console.error("Categorization process failed:", err);
      } finally {
        setIsProcessing(false);
      }
    },
    [setCategorizedMaterial, supabase]
  );

  return { runCategorization, isProcessing, error };
}
