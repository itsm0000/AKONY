import { useState, useCallback } from "react";
import { get } from "idb-keyval";
import { createClient } from "@/lib/supabase/client";
import { useExamStore } from "@/lib/stores/examStore";
import type { SelectedChapter } from "@/lib/types/exam";
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
      endPage: number,
      selectedChapters?: SelectedChapter[]
    ) => {
      setIsProcessing(true);
      setError(null);

      try {
        const CHUNK_SIZE = 25; // Increased from 10 to vastly reduce total requests (helps avoid 15 RPM free-tier limit)
        const chunks: { start: number; end: number; title?: string }[] = [];
        
        if (selectedChapters && selectedChapters.length > 0) {
          // Chapter-based Hybrid Chunking
          for (const chapter of selectedChapters) {
            let currentStart = chapter.startPage;
            if (currentStart > chapter.endPage) continue;
            
            while (currentStart <= chapter.endPage) {
               const currentEnd = Math.min(currentStart + CHUNK_SIZE - 1, chapter.endPage);
               chunks.push({ 
                 start: currentStart, 
                 end: currentEnd, 
                 title: chapter.title 
               });
               currentStart = currentEnd + 1;
            }
          }
        } else {
          // Fallback manual page chunking
          for (let p = startPage; p <= endPage; p += CHUNK_SIZE) {
            chunks.push({ start: p, end: Math.min(p + CHUNK_SIZE - 1, endPage) });
          }
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
        const missingChunks: { start: number; end: number; title?: string }[] = [];

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
            const chunkLabel = chunk.title ? `Chapter ${chunk.title} [ps. ${chunk.start}-${chunk.end}]` : `pages ${chunk.start} to ${chunk.end}`;
            console.log(`Processing chunk: ${chunkLabel}`);
            
            // Extract images for this chunk ONLY
            const images = await extractImagesFromPdfScope(
              storedFile.dataUrl,
              chunk.start,
              chunk.end
            );

            if (!images || images.length === 0) {
              throw new Error(`لم يتم استخراج صور من الصفحات ${chunk.start}-${chunk.end}`);
            }

            // 4. Send to /api/categorize (with Rate Limit Retry Logic)
            let res: Response | null = null;
            let categorizedData: CategorizedData | null = null;
            let success = false;
            
            for (let attempt = 1; attempt <= 3; attempt++) {
              res = await fetch("/api/categorize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ images }),
              });

              if (res.ok) {
                categorizedData = await res.json();
                success = true;
                break;
              }

              if (res.status === 429) {
                // Try to extract dynamic delay from backend error message (e.g. "retry in 52.031s")
                const errData = await res.json().catch(() => ({}));
                const errMsg = errData?.error || "";
                
                let sleepDuration = 60000; // Default 60s
                const match = errMsg.match(/retry in ([\d\.]+)s/i);
                if (match && match[1]) {
                  // Wait the required amount + 3s buffer
                  sleepDuration = (parseFloat(match[1]) + 3) * 1000;
                }

                console.warn(`[Attempt ${attempt}] Rate limit hit. Waiting ${Math.round(sleepDuration/1000)}s before retry...`);
                await new Promise((resolve) => setTimeout(resolve, sleepDuration));
              } else {
                const errData = await res.json();
                throw new Error(errData.error || "فشل الاتصال بخدمة الذكاء الاصطناعي");
              }
            }

            if (!success || !categorizedData) {
              throw new Error("فشل الذكاء الاصطناعي في الاستجابة بعد عدة محاولات (يرجى المحاولة لاحقاً)");
            }

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
