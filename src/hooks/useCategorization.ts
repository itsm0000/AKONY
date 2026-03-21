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
        const CHUNK_SIZE = 8;
        const chunks: { start: number; end: number }[] = [];
        for (let p = startPage; p <= endPage; p += CHUNK_SIZE) {
          chunks.push({ start: p, end: Math.min(p + CHUNK_SIZE - 1, endPage) });
        }

        // 1. Check Supabase Cache for all chunks concurrently
        const cachePromises = chunks.map((chunk) =>
          supabase
            .from("categorized_cache")
            .select("categorized_data")
            .eq("material_id", materialId)
            .eq("start_page", chunk.start)
            .eq("end_page", chunk.end)
            .maybeSingle()
        );

        const cacheResults = await Promise.all(cachePromises);

        const cachedData: CategorizedData[] = [];
        const missingChunks: { start: number; end: number }[] = [];

        cacheResults.forEach((res, index) => {
          if (res.error) {
            console.error(`Cache check error for chunk ${index}:`, res.error);
          }
          if (res.data && res.data.categorized_data) {
            cachedData.push(res.data.categorized_data as CategorizedData);
          } else {
            missingChunks.push(chunks[index]);
          }
        });

        const newChunksData: CategorizedData[] = [];

        if (missingChunks.length > 0) {
          console.log(`Found ${missingChunks.length} uncached chunks. Processing with AI...`);

          // 2. Fetch PDF from IDB once for missing chunks
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const storedFile: any = await get(`exam-file-${examId}`);
          if (!storedFile || !storedFile.dataUrl) {
            throw new Error("لم يتم العثور على ملف الامتحان");
          }

          if (storedFile.type !== "application/pdf") {
            throw new Error("تحليل الذكاء الاصطناعي مدعوم لملفات PDF فقط حالياً.");
          }

          // 3. Process missing chunks sequentially to avoid API HTTP 429 errors
          for (const chunk of missingChunks) {
            console.log(`Processing chunk: pages ${chunk.start} to ${chunk.end}`);
            
            // Extract images for this chunk ONLY
            const images = await extractImagesFromPdfScope(
              storedFile.dataUrl,
              chunk.start,
              chunk.end
            );

            if (!images || images.length === 0) {
              throw new Error(`لم يتم استخراج صور من الصفحات ${chunk.start}-${chunk.end}`);
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
            newChunksData.push(categorizedData);

            // 5. Save chunk to Supabase cache
            const { error: insertError } = await supabase
              .from("categorized_cache")
              .insert({
                material_id: materialId,
                start_page: chunk.start,
                end_page: chunk.end,
                categorized_data: categorizedData,
              });

            if (insertError) {
              console.error(`Failed to save chunk ${chunk.start}-${chunk.end} to cache`, insertError);
            }
          }
        } else {
          console.log("All chunks found in Supabase cache!");
        }

        // 6. Merge all categorized data
        const allData = [...cachedData, ...newChunksData];
        
        const mergedData: CategorizedData = {
          definitions: [],
          multipleChoice: [],
          problemSolving: [],
          comparisons: [],
          justifications: [],
          dependencies: [],
          shortAnswers: [],
          drawings: [],
        };

        for (const data of allData) {
          mergedData.definitions.push(...(data.definitions || []));
          mergedData.multipleChoice.push(...(data.multipleChoice || []));
          mergedData.problemSolving.push(...(data.problemSolving || []));
          mergedData.comparisons.push(...(data.comparisons || []));
          mergedData.justifications.push(...(data.justifications || []));
          mergedData.dependencies.push(...(data.dependencies || []));
          mergedData.shortAnswers.push(...(data.shortAnswers || []));
          mergedData.drawings.push(...(data.drawings || []));
        }

        // 7. Update Store
        setCategorizedMaterial(mergedData);
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
