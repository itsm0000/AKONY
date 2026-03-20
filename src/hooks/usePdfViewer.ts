"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UsePdfViewerOptions {
  fileDataUrl: string | null;
  scale?: number;
}

interface PdfPage {
  pageNumber: number;
  width: number;
  height: number;
}

interface UsePdfViewerReturn {
  pages: PdfPage[];
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  isLoading: boolean;
  error: string | null;
  renderPage: (canvas: HTMLCanvasElement, pageNum: number) => Promise<void>;
  scale: number;
  setScale: (scale: number) => void;
}

export function usePdfViewer({
  fileDataUrl,
  scale: initialScale = 1.5,
}: UsePdfViewerOptions): UsePdfViewerReturn {
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(initialScale);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfDocRef = useRef<any>(null);

  // Load the PDF document (dynamic import to avoid SSR DOMMatrix error)
  useEffect(() => {
    if (!fileDataUrl) return;

    let cancelled = false;

    async function loadPdf() {
      setIsLoading(true);
      setError(null);

      try {
        // Dynamic import — PDF.js requires browser APIs (DOMMatrix, canvas)
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

        // Convert data URL to Uint8Array
        const base64 = fileDataUrl!.split(",")[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        const loadingTask = pdfjsLib.getDocument({ data: bytes });
        const pdfDoc = await loadingTask.promise;

        if (cancelled) return;

        pdfDocRef.current = pdfDoc;
        setTotalPages(pdfDoc.numPages);

        // Get page dimensions
        const pageInfos: PdfPage[] = [];
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: 1 });
          pageInfos.push({
            pageNumber: i,
            width: viewport.width,
            height: viewport.height,
          });
        }

        if (!cancelled) {
          setPages(pageInfos);
          setCurrentPage(1);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "فشل في تحميل ملف PDF"
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadPdf();
    return () => {
      cancelled = true;
    };
  }, [fileDataUrl]);

  // Render a specific page to a canvas
  const renderPage = useCallback(
    async (canvas: HTMLCanvasElement, pageNum: number) => {
      const pdfDoc = pdfDocRef.current;
      if (!pdfDoc || pageNum < 1 || pageNum > pdfDoc.numPages) return;

      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // PDF.js v5 render — using type assertion for compatibility
      await page.render({
        canvasContext: ctx,
        canvas,
        viewport,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any).promise;
    },
    [scale]
  );

  return {
    pages,
    totalPages,
    currentPage,
    setCurrentPage,
    isLoading,
    error,
    renderPage,
    scale,
    setScale,
  };
}
