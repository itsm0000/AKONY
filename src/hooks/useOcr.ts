"use client";

import { useState, useCallback } from "react";

interface OcrResult {
  text: string;
  confidence: number;
  language: string;
}

interface UseOcrReturn {
  extractText: (imageDataUrl: string, lang?: string) => Promise<OcrResult>;
  isProcessing: boolean;
  progress: number;
  error: string | null;
}

export function useOcr(): UseOcrReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const extractText = useCallback(
    async (imageDataUrl: string, lang: string = "ara+eng"): Promise<OcrResult> => {
      setIsProcessing(true);
      setProgress(0);
      setError(null);

      try {
        const Tesseract = await import("tesseract.js");

        const result = await Tesseract.recognize(imageDataUrl, lang, {
          logger: (m) => {
            if (m.status === "recognizing text") {
              setProgress(Math.round((m.progress ?? 0) * 100));
            }
          },
        });

        return {
          text: result.data.text.trim(),
          confidence: result.data.confidence,
          language: lang,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "فشل استخراج النص";
        setError(message);
        return { text: "", confidence: 0, language: lang };
      } finally {
        setIsProcessing(false);
        setProgress(100);
      }
    },
    []
  );

  return { extractText, isProcessing, progress, error };
}
