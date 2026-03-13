"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { usePdfViewer } from "@/hooks/usePdfViewer";
import { useAnnotationCanvas } from "@/hooks/useAnnotationCanvas";
import { DrawingToolbar } from "@/components/DrawingToolbar";

interface PdfAnnotationViewerProps {
  fileDataUrl: string | null;
  onRegionCreated?: (region: {
    id: string;
    type: string;
    left: number;
    top: number;
    width: number;
    height: number;
    pageNumber: number;
  }) => void;
  annotationState: ReturnType<typeof useAnnotationCanvas> | null;
}

export function PdfAnnotationViewer({
  fileDataUrl,
  onRegionCreated,
  annotationState,
}: PdfAnnotationViewerProps) {
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 1000 });

  const {
    totalPages,
    currentPage,
    setCurrentPage,
    isLoading,
    error,
    renderPage,
    scale,
    setScale,
  } = usePdfViewer({ fileDataUrl, scale: 1.5 });

  // Render PDF page when it changes
  useEffect(() => {
    if (!pdfCanvasRef.current || !fileDataUrl || totalPages === 0) return;

    renderPage(pdfCanvasRef.current, currentPage).then(() => {
      if (pdfCanvasRef.current) {
        setCanvasDimensions({
          width: pdfCanvasRef.current.width,
          height: pdfCanvasRef.current.height,
        });
      }
    });
  }, [currentPage, renderPage, fileDataUrl, totalPages, scale]);

  const handleRegionCreated = useCallback(
    (region: Parameters<NonNullable<PdfAnnotationViewerProps["onRegionCreated"]>>[0]) => {
      onRegionCreated?.(region);
    },
    [onRegionCreated]
  );

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5">
        <div className="text-center">
          <p className="text-destructive">{error}</p>
          <p className="mt-2 text-sm text-muted-foreground">تأكد من أن الملف هو PDF صالح</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">جاري تحميل الملف...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      {annotationState && (
        <DrawingToolbar
          activeTool={annotationState.activeTool}
          onToolChange={annotationState.setActiveTool}
          onClear={annotationState.clearRegions}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          scale={scale}
          onScaleChange={setScale}
        />
      )}

      {/* PDF + Annotation Canvas Container */}
      <div
        ref={containerRef}
        className="relative mx-auto overflow-auto rounded-xl border border-border/50 bg-muted/20"
        style={{ maxHeight: "calc(100vh - 200px)" }}
      >
        {/* PDF Canvas (background layer) */}
        <canvas
          ref={pdfCanvasRef}
          className="block"
          style={{ width: canvasDimensions.width, height: canvasDimensions.height }}
        />

        {/* Fabric.js Annotation Canvas (overlay layer) */}
        {annotationState && (
          <canvas
            ref={annotationState.canvasRef}
            className="absolute inset-0"
            style={{
              width: canvasDimensions.width,
              height: canvasDimensions.height,
            }}
          />
        )}

        {/* Empty state */}
        {!fileDataUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground">لم يتم تحميل ملف بعد</p>
          </div>
        )}
      </div>
    </div>
  );
}
