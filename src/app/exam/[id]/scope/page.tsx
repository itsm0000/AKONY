"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, FileSearch, BrainCircuit, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useExamStore } from "@/lib/stores/examStore";
import { get, set } from "idb-keyval";
import { extractPdfOutline, extractImagesFromPdfScope, type PdfOutlineItem } from "@/lib/utils/pdfTextExtractor";

/** SHA-256 a string and return the first 16 hex chars as a stable ID. */
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  // Hash only the first ~80KB to keep it fast for large PDFs
  const sample = str.slice(0, 80_000);
  const data = encoder.encode(sample);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

export default function ScopePage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const { initExam, setScope } = useExamStore();

  const [title, setTitle] = useState("");
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(10);
  const [chaptersInput, setChaptersInput] = useState("");
  
  // Chapter State
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [isManualMode, setIsManualMode] = useState(false);
  const [availableChapters, setAvailableChapters] = useState<PdfOutlineItem[]>([]);
  const [chapterRange, setChapterRange] = useState<number[]>([0, 1]);
  const [isLoadingOutline, setIsLoadingOutline] = useState(true);
  const [pdfDataUrl, setPdfDataUrl] = useState<string>("");
  const [isExtractingAiToc, setIsExtractingAiToc] = useState(false);
  const [numPages, setNumPages] = useState<number>(0);

  const getPageFromFractionalChapter = useCallback((v: number, chapters: PdfOutlineItem[]) => {
    if (chapters.length === 0) return 0;
    if (v <= 0) return chapters[0].startPage;
    if (v >= chapters.length) return chapters[chapters.length - 1].endPage;
    
    const chapterIndex = Math.floor(v);
    const fraction = v - chapterIndex;
    
    if (chapterIndex >= chapters.length || (chapterIndex === chapters.length - 1 && fraction === 1)) {
      return chapters[chapters.length - 1].endPage;
    }
    
    const chapter = chapters[chapterIndex];
    const chapterLength = chapter.endPage - chapter.startPage;
    return Math.round(chapter.startPage + fraction * chapterLength);
  }, []);

  const toggleChapter = useCallback((id: string) => {
    setSelectedChapterIds(prev => {
      const isSelected = prev.includes(id);
      const newSelected = isSelected ? prev.filter(c => c !== id) : [...prev, id];
      
      // Keep manual fractional slider synced natively under the hood
      if (newSelected.length > 0 && availableChapters.length > 0) {
        const selectedIndices = availableChapters
          .map((c, idx) => newSelected.includes(c.id) ? idx : -1)
          .filter(idx => idx !== -1);
        const minIdx = Math.min(...selectedIndices);
        const maxIdx = Math.max(...selectedIndices);
        setChapterRange([minIdx, maxIdx + 1]);
      }
      return newSelected;
    });
  }, [availableChapters]);

  useEffect(() => {
    const fetchScopeData = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let storedExamData: any = await get(`exam-file-${params.id}`);
        if (!storedExamData) {
           storedExamData = await get(params.id as string); // Legacy fallback
        }

        const dataUrl = storedExamData?.dataUrl || storedExamData?.sourcePdfDataUrl;

        if (dataUrl) {
          setPdfDataUrl(dataUrl);
          
          const pdfjsLib = await import("pdfjs-dist");
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
          const base64 = dataUrl.split(",")[1];
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) { bytes[i] = binary.charCodeAt(i); }
          const loadingTask = pdfjsLib.getDocument({ data: bytes });
          const doc = await loadingTask.promise;
          setNumPages(doc.numPages);

          const cachedAiToc = await get(`${params.id}-ai-toc`);
          
          if (cachedAiToc && Array.isArray(cachedAiToc) && cachedAiToc.length > 0) {
            setAvailableChapters(cachedAiToc);
            setSelectedChapterIds(cachedAiToc.map((c: any) => c.id));
            setChapterRange([0, cachedAiToc.length]);
          } else {
            const outline = await extractPdfOutline(dataUrl);
            if (outline && outline.length > 0) {
              setAvailableChapters(outline);
              setSelectedChapterIds(outline.map((c: any) => c.id));
              setChapterRange([0, outline.length]);
            }
          }
        }
      } catch (error) {
        console.error("Failed to extract PDF outline:", error);
      } finally {
        setIsLoadingOutline(false);
      }
    };
    fetchScopeData();
  }, [params.id]);

  const handleExtractAiToc = async () => {
    console.log("handleExtractAiToc CLICKED!");
    if (!pdfDataUrl) {
      alert("خطأ: لم يتم العثور على ملف PDF في الذاكرة. يرجى إعادة تحميل الصفحة.");
      return;
    }
    
    // Check cache natively BEFORE attempting any extraction (avoids 1-minute artificial waits if data exists)
    const cachedAiToc = await get(`${params.id}-ai-toc`);
    if (cachedAiToc && Array.isArray(cachedAiToc) && cachedAiToc.length > 0) {
      console.log("Instantly loading AI Chapters from IndexedDB cache!");
      setAvailableChapters(cachedAiToc);
      setSelectedChapterIds(cachedAiToc.map((c: any) => c.id));
      setChapterRange([0, cachedAiToc.length]);
      setIsManualMode(false);
      return;
    }
    
    try {
      console.log("Setting loading state to true...");
      setIsExtractingAiToc(true);
      
      // Yield to the browser's event loop so React can actually paint the "Loading..." state
      // before we block the thread with heavy PDF.js calculations
      await new Promise(resolve => setTimeout(resolve, 50));
      
      console.log("Importing pdfjs-dist...");
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      const base64 = pdfDataUrl.split(",")[1];
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) { bytes[i] = binary.charCodeAt(i); }
      
      const loadingTask = pdfjsLib.getDocument({ data: bytes });
      const localPdfDoc = await loadingTask.promise;
      const localNumPages = localPdfDoc.numPages;

      // Sample first 5 pages to detect if it's a Scanned Document (handwritten/images) or Text-rich Digital PDF
      let sampleTextCount = 0;
      for (let i = 1; i <= Math.min(5, localNumPages); i++) {
        const page = await localPdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sampleTextCount += textContent.items.map((it: any) => it.str).join("").length;
      }
      
      const isScanned = (sampleTextCount / Math.min(5, localNumPages)) < 50;
      
      // --- FAST PATH (HEAD & TAIL SEARCH) ---
      const HEAD_TAIL_SIZE = 15; // Increased scan window to catch longer introductions/prefaces natively
      let fastPathSuccess = false;
      
      if (localNumPages > HEAD_TAIL_SIZE * 2) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const payload: any = { isFastPath: true, startPage: 1, endPage: localNumPages };
          if (isScanned) {
            const headImgs = await extractImagesFromPdfScope(pdfDataUrl, 1, HEAD_TAIL_SIZE);
            const tailImgs = await extractImagesFromPdfScope(pdfDataUrl, localNumPages - HEAD_TAIL_SIZE + 1, localNumPages);
            payload.imagesChunk = [
              ...headImgs.map((data, i) => ({ pageNum: i + 1, data })),
              ...tailImgs.map((data, i) => ({ pageNum: localNumPages - HEAD_TAIL_SIZE + 1 + i, data }))
            ];
          } else {
            let textStr = "";
            for (let i = 1; i <= HEAD_TAIL_SIZE; i++) {
              const tc = await (await localPdfDoc.getPage(i)).getTextContent();
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              textStr += `--- PAGE ${i} ---\n${tc.items.map((it:any)=>it.str).join(" ")}\n\n`;
            }
            textStr += `\n... [MIDDLE PAGES OMITTED] ...\n\n`;
            for (let i = localNumPages - HEAD_TAIL_SIZE + 1; i <= localNumPages; i++) {
              const tc = await (await localPdfDoc.getPage(i)).getTextContent();
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              textStr += `--- PAGE ${i} ---\n${tc.items.map((it:any)=>it.str).join(" ")}\n\n`;
            }
            payload.textChunk = textStr;
          }

          let res: Response | null = null;
          let fastChapters: any[] = [];
          for (let attempt = 1; attempt <= 3; attempt++) {
            res = await fetch("/api/exam/extract-toc", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });

            if (res.ok) {
              fastChapters = await res.json();
              break;
            }
            if (res.status === 429) {
              const errData = await res.json().catch(() => ({}));
              const errMsg = errData?.error || "";
              let sleepDuration = 60000; // default 60s
              const match = errMsg.match(/retry in ([\d\.]+)s/i);
              if (match && match[1]) sleepDuration = (parseFloat(match[1]) + 3) * 1000;
              console.warn(`[FastPath Attempt ${attempt}] Rate limit hit. Waiting ${Math.round(sleepDuration/1000)}s`);
              await new Promise(r => setTimeout(r, sleepDuration));
            } else {
              break; // Other error, exit loop
            }
          }

          if (res?.ok && fastChapters && fastChapters.length > 0) {
             fastPathSuccess = true;
             await set(`${params.id}-ai-toc`, fastChapters);
             setAvailableChapters(fastChapters);
             setChapterRange([0, fastChapters.length]);
             setIsManualMode(false);
          }
        } catch (e) {
          console.warn("Fast path TOC extraction failed, falling back to full map-reduce chunking...", e);
        }
      }
      
      if (fastPathSuccess) {
         setIsExtractingAiToc(false);
         return;
      }

      // If fast-path failed to find an index, we abandon ship immediately rather than locking the user's browser 
      // for 5 minutes attempting to map-reduce a 300-page book against the 15 RPM free-tier Gemini API limitations.
      throw new Error("لم يتم العثور على فهرس واضح في الكتاب. يرجى استخدام (الإدخال اليدوي).");
    } catch (error: any) {
      console.error("FATAL ERROR IN AI TOCK:", error);
      alert(`حدث خطأ أثناء محاولة استخراج الفصول: ${error?.message || "خطأ غير معروف"}`);
    } finally {
      console.log("Setting loading state to false and finishing.");
      setIsExtractingAiToc(false);
    }
  };

  // Process dynamic range mapped to slider
  const selectedChapters = [];
  let exactStartPage = 1;
  let exactEndPage = numPages || 1;
  let startChapterTitle = "بداية المحتوى";
  let endChapterTitle = "نهاية المحتوى";

  if (availableChapters.length > 0) {
    const startIdx = Math.floor(chapterRange[0]);
    const endIdx = Math.min(Math.ceil(chapterRange[1]) - 1, availableChapters.length - 1);
    
    startChapterTitle = availableChapters[startIdx]?.title || "بداية المحتوى";
    endChapterTitle = availableChapters[endIdx]?.title || "نهاية المحتوى";

    for (let i = startIdx; i <= endIdx; i++) {
      selectedChapters.push({ ...availableChapters[i] });
    }
    if (selectedChapters.length > 0) {
      const first = selectedChapters[0];
      const last = selectedChapters[selectedChapters.length - 1];
      const firstTotalPages = first.endPage - first.startPage + 1;
      const firstFraction = chapterRange[0] - Math.floor(chapterRange[0]);
      exactStartPage = first.startPage + Math.floor(firstTotalPages * firstFraction);

      const lastTotalPages = last.endPage - last.startPage + 1;
      const lastFraction = Math.ceil(chapterRange[1]) - chapterRange[1];
      exactEndPage = last.endPage - Math.floor(lastTotalPages * lastFraction);
      if (exactEndPage < exactStartPage) exactEndPage = exactStartPage;
    }
  }

  const sliderStartPage = selectedChapters.length > 0 ? exactStartPage : 1;
  const sliderEndPage = selectedChapters.length > 0 ? exactEndPage : numPages || 1;

  // Derived effective scope based on manual mode vs chapter mode
  let effectiveStartPage = startPage;
  let effectiveEndPage = endPage;
  let selectedChaptersMetadata: PdfOutlineItem[] | undefined = undefined;

  if (!isManualMode && availableChapters.length > 0) {
    // Semantic Cards mode
    const selected = availableChapters.filter(c => selectedChapterIds.includes(c.id));
    if (selected.length > 0) {
      effectiveStartPage = Math.min(...selected.map(c => c.startPage));
      effectiveEndPage = Math.max(...selected.map(c => c.endPage));
      selectedChaptersMetadata = selected;
    } else {
      effectiveStartPage = 1;
      effectiveEndPage = numPages || 1;
    }
  } else if (isManualMode && availableChapters.length > 0) {
    // Fractional Slider mode
    effectiveStartPage = sliderStartPage;
    effectiveEndPage = sliderEndPage;
    selectedChaptersMetadata = selectedChapters;
  } else if (!isManualMode && availableChapters.length === 0) {
    effectiveStartPage = 0;
    effectiveEndPage = 0;
  }

  const handleProceed = useCallback(async () => {
    // block if nothing selected
    if (!isManualMode && effectiveEndPage - effectiveStartPage < 0) {
      alert("الرجاء اختيار نطاق صفحات صحيح.");
      return;
    }

    // Derive a stable content-based materialId from the stored PDF bytes
    // so the Supabase categorization cache works across sessions.
    let materialId = examId; // fallback
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stored: any = await get(`exam-file-${examId}`);
      if (stored?.dataUrl) {
        materialId = await hashString(stored.dataUrl);
      }
    } catch {
      console.warn("Could not hash PDF for materialId, using examId as fallback.");
    }

    initExam(materialId, title || "امتحان جديد", examId);
    setScope({
      startPage: effectiveStartPage,
      endPage: effectiveEndPage,
      selectedChapters: selectedChaptersMetadata,
      chapters: isManualMode ? chaptersInput : (selectedChaptersMetadata?.map(c => c.title).join(", ") || chaptersInput),
    });

    router.push(`/exam/${examId}/structure`);
  }, [
    examId, title, isManualMode, effectiveStartPage, effectiveEndPage, 
    chapterRange, availableChapters, selectedChaptersMetadata, 
    initExam, setScope, router, getPageFromFractionalChapter
  ]);

  return (
    <main className="relative min-h-screen">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 start-1/4 h-[400px] w-[400px] rounded-full bg-[oklch(0.72_0.19_163/0.06)] blur-[120px]" />
      </div>

      <div className="relative mx-auto w-full max-w-xl px-4 py-12 md:py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">تحديد نطاق الامتحان</h1>
          <p className="mt-2 text-sm md:text-base text-muted-foreground">
            حدد الفصول والصفحات التي يغطيها الامتحان المأخوذ من الكتاب المصدر
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
                placeholder="مثال: امتحان الفيزياء النصفي — فصل الرابع"
                className="text-base min-h-[48px]"
                dir="rtl"
              />
            </CardContent>
          </Card>

          {/* Scope Selection Box */}
          <Card className="glass-card border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/30">
              <div className="space-y-1">
                <CardTitle className="text-lg">تحديد الفصول</CardTitle>
                <CardDescription className="text-xs">
                  اختر الفصول لتحديد الصفحات تلقائياً
                </CardDescription>
              </div>
              
              {!isLoadingOutline && (
                <div className="flex items-center gap-2" dir="ltr">
                  <Switch 
                    id="manual-mode" 
                    checked={isManualMode}
                    onCheckedChange={setIsManualMode} 
                  />
                  <Label htmlFor="manual-mode" className="text-xs text-muted-foreground whitespace-nowrap cursor-pointer">
                    الإدخال اليدوي
                  </Label>
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              
              <AnimatePresence mode="popLayout">
                {!isManualMode ? (
                  <motion.div
                    key="cards-mode"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    {availableChapters.length > 0 ? (
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground mb-2">
                          انقر على الفصول التي تريد تضمينها في الامتحان:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" dir="rtl">
                          {availableChapters.map(chapter => {
                            const isSelected = selectedChapterIds.includes(chapter.id);
                            return (
                              <div 
                                key={chapter.id}
                                onClick={() => toggleChapter(chapter.id)}
                                className={cn(
                                  "p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col gap-3 relative overflow-hidden group",
                                  isSelected 
                                    ? "border-primary/60 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-[0_8px_20px_-6px_rgba(var(--primary-rgb),0.3)] scale-[1.02]" 
                                    : "border-border/40 bg-card/40 hover:bg-card/80 hover:border-primary/40 hover:shadow-md"
                                )}
                              >
                                {/* Selection Indicator */}
                                <div className="absolute top-5 left-4 transition-all duration-300">
                                  {isSelected ? (
                                    <div className="bg-primary text-primary-foreground rounded-full p-0.5 shadow-lg scale-100 animate-in zoom-in duration-200">
                                      <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                  ) : (
                                    <div className="text-muted-foreground/30 group-hover:text-primary/50 transition-colors">
                                      <Circle className="w-6 h-6" />
                                    </div>
                                  )}
                                </div>

                                {/* Content */}
                                <h3 className={cn(
                                  "font-bold text-sm leading-relaxed pl-10 pr-1 transition-colors duration-300",
                                  isSelected ? "text-primary" : "text-foreground group-hover:text-foreground/90"
                                )}>
                                  {chapter.title}
                                </h3>
                                
                                <div className="flex items-center text-xs font-bold mt-auto pr-1">
                                  <div className={cn(
                                    "rounded-md px-2.5 py-1.5 transition-colors duration-300",
                                    isSelected 
                                      ? "bg-primary/20 text-primary border border-primary/20" 
                                      : "bg-muted/50 text-muted-foreground border border-border/50 group-hover:bg-muted"
                                  )}>
                                    ص {chapter.startPage} - {chapter.endPage}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 space-y-4">
                        {isLoadingOutline ? (
                          <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">
                            جاري فحص فهارس الكتاب لاستخراج الفصول...
                          </div>
                        ) : (
                          <div className="rounded-md bg-muted/50 p-6 border border-border/50 mb-4 flex flex-col items-center justify-center gap-4 text-center w-full transition-all overflow-hidden relative">
                            {isExtractingAiToc && (
                              <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6"
                              >
                                <div className="space-y-4 mb-4 flex flex-col items-center">
                                  <div className="relative w-16 h-16 flex items-center justify-center">
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                                      className="absolute inset-0 rounded-full border-t-2 border-primary border-r-2 border-primary/30"
                                    />
                                    <BrainCircuit className="w-8 h-8 text-primary animate-pulse" />
                                  </div>
                                </div>
                                <h3 className="font-bold text-lg text-foreground">جاري تحليل الكتاب...</h3>
                                <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                                  يقوم محرك الذكاء الاصطناعي <b>Gemini ✨</b> بقراءة وفحص صفحات الكتاب وبناء هيكل الفصول. قد يستغرق هذا دقيقة للكتب الضخمة.
                                </p>
                              </motion.div>
                            )}

                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1 text-primary">
                              <FileSearch className="w-6 h-6" />
                            </div>
                            
                            <h3 className="text-base font-bold text-foreground m-0">
                              لم يتم العثور على فهرس في هذا الـ PDF
                            </h3>
                            
                            <p className="text-sm text-muted-foreground max-w-sm mx-auto m-0">
                              ولكن يمكن لمحرك الذكاء الاصطناعي قراءة الكتاب، وبناء فهارس منطقية دقيقة لتسهيل التحديد.
                            </p>
                            
                            <Button 
                              onClick={handleExtractAiToc} 
                              disabled={isExtractingAiToc}
                              className="w-full flex flex-row items-center gap-2 mt-2 h-11 px-8 rounded-full shadow-[0_0_15px_-3px_hsl(var(--primary))]"
                            >
                              <Sparkles className="w-4 h-4" />
                              <span>استخراج الفصول بالذكاء الاصطناعي ✨</span>
                            </Button>
                            
                            <div className="mt-4 pt-4 border-t border-border/50 w-full flex justify-center">
                              <Button variant="ghost" size="sm" onClick={() => setIsManualMode(true)} className="text-xs text-muted-foreground hover:text-foreground">
                                أو قم بالتبديل للاختيار اليدوي
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="manual-view"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {availableChapters.length > 0 ? (
                      <div className="space-y-6">
                        <div className="flex justify-between text-sm mt-4 text-right" dir="ltr">
                          <div className="text-left">
                            <div className="text-muted-foreground mb-1 text-xs text-right">نقطة البداية</div>
                            <div className="font-bold text-lg text-primary truncate max-w-[150px] text-right" dir="rtl">{startChapterTitle}</div>
                            <div className="text-sm font-medium text-right">ص {sliderStartPage}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-muted-foreground mb-1 text-xs text-left">نقطة النهاية</div>
                            <div className="font-bold text-lg text-primary truncate max-w-[150px] text-left" dir="rtl">{endChapterTitle}</div>
                            <div className="text-sm font-medium text-left">ص {sliderEndPage}</div>
                          </div>
                        </div>

                        <Slider
                          dir="ltr"
                          defaultValue={[0, availableChapters.length]}
                          max={availableChapters.length}
                          step={0.1}
                          value={chapterRange}
                          onValueChange={(val) => setChapterRange(val as number[])}
                          className="py-4 cursor-pointer"
                        />

                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>0%</span>
                          <span>الفهارس كاملة</span>
                        </div>
                        
                        <div className="bg-card/50 border border-border/50 rounded-lg p-3 text-center text-sm">
                          النطاق المختار: <span className="font-bold text-primary">{(chapterRange[1] - chapterRange[0]).toFixed(1)} فصول</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {!isLoadingOutline && (
                          <div className="rounded-md bg-muted/30 p-4 border border-border/50 mb-4 flex flex-col items-center justify-center gap-2 text-center transition-all">
                            <p className="text-sm font-medium text-foreground">
                              لم يتم العثور على فهرس مُبرمج.
                            </p>
                            
                            <Button 
                              onClick={handleExtractAiToc} 
                              disabled={isExtractingAiToc}
                              variant="ghost"
                              size="sm"
                              className="w-full flex flex-row items-center gap-2 text-primary"
                            >
                              {isExtractingAiToc ? "جاري الاستخراج..." : "التبديل لاستخراج الفصول بالذكاء الاصطناعي ✨"}
                            </Button>
                          </div>
                        )}
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
                              className="font-inter text-center text-lg min-h-[48px]"
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
                              className="font-inter text-center text-lg min-h-[48px]"
                              dir="ltr"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="chapters-input" className="mb-2 block text-sm text-muted-foreground">
                            الفصول (اختياري)
                          </Label>
                          <Input
                            id="chapters-input"
                            value={chaptersInput}
                            onChange={(e) => setChaptersInput(e.target.value)}
                            placeholder="مثال: الفصل الرابع، أو الفصل الثالث كامل"
                            className="text-base min-h-[48px]"
                            dir="rtl"
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* إجمالي نطاق الامتحان */}
              {((!isManualMode && availableChapters.length > 0 && selectedChapterIds.length > 0) || (isManualMode && availableChapters.length > 0)) && (
                <div className="mt-8 pt-4 border-t border-border flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">إجمالي نطاق الامتحان المختار:</span>
                  <span className="font-bold bg-muted px-3 py-1 rounded-md">
                    {!isManualMode 
                      ? Math.max(...availableChapters.filter(c => selectedChapterIds.includes(c.id)).map(c => c.endPage)) - Math.min(...availableChapters.filter(c => selectedChapterIds.includes(c.id)).map(c => c.startPage)) + 1
                      : sliderEndPage - sliderStartPage + 1
                    } صفحة
                  </span>
                </div>
              )}
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
              disabled={effectiveEndPage === 0}
              className="accent-gradient w-full border-0 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
            >
              التالي — تحليل محتوى المنهج ←
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
