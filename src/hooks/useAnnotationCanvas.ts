"use client";

import { useRef, useEffect, useCallback, useState } from "react";

export type DrawingTool = "select" | "rect" | "circle" | "freehand";

interface AnnotationRect {
  id: string;
  type: "rect" | "circle" | "freehand";
  left: number;
  top: number;
  width: number;
  height: number;
  assignedTo?: string; // sub_question_id
  pageNumber: number;
}

interface UseAnnotationCanvasOptions {
  width: number;
  height: number;
  pageNumber: number;
  onRegionCreated?: (region: AnnotationRect) => void;
}

interface UseAnnotationCanvasReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  activeTool: DrawingTool;
  setActiveTool: (tool: DrawingTool) => void;
  regions: AnnotationRect[];
  removeRegion: (id: string) => void;
  clearRegions: () => void;
  assignRegion: (regionId: string, subQuestionId: string) => void;
}

export function useAnnotationCanvas({
  width,
  height,
  pageNumber,
  onRegionCreated,
}: UseAnnotationCanvasOptions): UseAnnotationCanvasReturn {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fabricRef = useRef<any>(null);
  const [activeTool, setActiveTool] = useState<DrawingTool>("select");
  const [regions, setRegions] = useState<AnnotationRect[]>([]);

  const isDrawingRef = useRef(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeShapeRef = useRef<any>(null);

  // Initialize Fabric canvas (dynamic import to avoid SSR issues)
  useEffect(() => {
    if (!canvasRef.current) return;

    let disposed = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let canvas: any = null;

    async function init() {
      const fabric = await import("fabric");
      if (disposed) return;

      canvas = new fabric.Canvas(canvasRef.current!, {
        width,
        height,
        selection: true,
        backgroundColor: "transparent",
      });

      fabricRef.current = canvas;
    }

    init();

    return () => {
      disposed = true;
      if (canvas) {
        canvas.dispose();
      }
      fabricRef.current = null;
    };
  }, [width, height]);

  // Handle tool changes
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = false;

    async function applyTool() {
      if (activeTool === "freehand") {
        const fabric = await import("fabric");
        canvas.isDrawingMode = true;
        const brush = new fabric.PencilBrush(canvas);
        brush.color = "rgba(99, 226, 184, 0.6)";
        brush.width = 3;
        canvas.freeDrawingBrush = brush;
      } else if (activeTool === "select") {
        canvas.selection = true;
      } else {
        canvas.selection = false;
      }
    }

    applyTool();
  }, [activeTool]);

  // Handle rect/circle drawing via mouse events
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    if (activeTool !== "rect" && activeTool !== "circle") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let Rect: any, Circle: any;

    async function loadShapes() {
      const fabric = await import("fabric");
      Rect = fabric.Rect;
      Circle = fabric.Circle;
    }

    loadShapes();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMouseDown = (opt: any) => {
      if (!Rect || !Circle) return;
      if (activeTool !== "rect" && activeTool !== "circle") return;

      isDrawingRef.current = true;
      const pointer = canvas.getScenePoint(opt.e);
      startPointRef.current = { x: pointer.x, y: pointer.y };

      const shapeOpts = {
        left: pointer.x,
        top: pointer.y,
        width: 0,
        height: 0,
        fill: "rgba(99, 226, 184, 0.15)",
        stroke: "rgba(99, 226, 184, 0.8)",
        strokeWidth: 2,
        strokeDashArray: [6, 3],
        selectable: true,
        cornerColor: "rgba(99, 226, 184, 0.9)",
        cornerSize: 8,
        transparentCorners: false,
      };

      if (activeTool === "rect") {
        const rect = new Rect(shapeOpts);
        canvas.add(rect);
        activeShapeRef.current = rect;
      } else {
        const circle = new Circle({ ...shapeOpts, radius: 0 });
        canvas.add(circle);
        activeShapeRef.current = circle;
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMouseMove = (opt: any) => {
      if (!isDrawingRef.current || !startPointRef.current || !activeShapeRef.current) return;

      const pointer = canvas.getScenePoint(opt.e);
      const start = startPointRef.current;

      if (activeTool === "rect") {
        activeShapeRef.current.set({
          left: Math.min(start.x, pointer.x),
          top: Math.min(start.y, pointer.y),
          width: Math.abs(pointer.x - start.x),
          height: Math.abs(pointer.y - start.y),
        });
      } else if (activeTool === "circle") {
        const radius = Math.max(
          Math.abs(pointer.x - start.x),
          Math.abs(pointer.y - start.y)
        ) / 2;
        activeShapeRef.current.set({
          left: Math.min(start.x, pointer.x),
          top: Math.min(start.y, pointer.y),
          radius,
        });
      }
      canvas.renderAll();
    };

    const handleMouseUp = () => {
      if (!isDrawingRef.current || !activeShapeRef.current) return;

      isDrawingRef.current = false;
      const shape = activeShapeRef.current;

      const w = shape.width ?? 0;
      const h = shape.height ?? 0;
      if (w < 10 && h < 10) {
        canvas.remove(shape);
        activeShapeRef.current = null;
        return;
      }

      const newRegion: AnnotationRect = {
        id: crypto.randomUUID(),
        type: activeTool as "rect" | "circle",
        left: shape.left ?? 0,
        top: shape.top ?? 0,
        width: w,
        height: h,
        pageNumber,
      };

      shape._regionId = newRegion.id;
      setRegions((prev) => [...prev, newRegion]);
      onRegionCreated?.(newRegion);
      activeShapeRef.current = null;
    };

    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:up", handleMouseUp);

    return () => {
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:move", handleMouseMove);
      canvas.off("mouse:up", handleMouseUp);
    };
  }, [activeTool, pageNumber, onRegionCreated]);

  const removeRegion = useCallback((id: string) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const target = objects.find((obj: any) => obj._regionId === id);
    if (target) canvas.remove(target);
    setRegions((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const clearRegions = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.clear();
    setRegions([]);
  }, []);

  const assignRegion = useCallback((regionId: string, subQuestionId: string) => {
    setRegions((prev) =>
      prev.map((r) =>
        r.id === regionId ? { ...r, assignedTo: subQuestionId } : r
      )
    );

    const canvas = fabricRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const target = objects.find((obj: any) => obj._regionId === regionId);
    if (target) {
      target.set({
        stroke: "rgba(59, 130, 246, 0.9)",
        fill: "rgba(59, 130, 246, 0.15)",
      });
      canvas.renderAll();
    }
  }, []);

  return {
    canvasRef,
    activeTool,
    setActiveTool,
    regions,
    removeRegion,
    clearRegions,
    assignRegion,
  };
}
