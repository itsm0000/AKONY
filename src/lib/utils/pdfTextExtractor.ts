// We use the same approach as usePdfViewer for worker loading

export interface PdfOutlineItem {
  id: string; // crypto.randomUUID() equivalent but we'll assign it
  title: string;
  startPage: number;
  endPage: number;
}

export async function extractPdfOutline(fileDataUrl: string): Promise<PdfOutlineItem[]> {
  const pdfjsLib = await import("pdfjs-dist");
  if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }
  
  const base64 = fileDataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) { bytes[i] = binary.charCodeAt(i); }
  
  const loadingTask = pdfjsLib.getDocument({ data: bytes });
  const pdfDoc = await loadingTask.promise;
  
  const outline = await pdfDoc.getOutline();
  if (!outline) return [];
  
  const rawResults: { title: string, pageNumber: number }[] = [];
  const addedTitles = new Set<string>();
  
  // Recursively process outline
  const processItems = async (items: any[]) => {
    for (const item of items) {
      if (item.dest && !addedTitles.has(item.title)) {
        try {
          // getDestination usually returns an array where the first element is a reference object to the page
          const dest = typeof item.dest === 'string' ? await pdfDoc.getDestination(item.dest) : item.dest;
          if (dest && dest[0]) {
            const pageIndex = await pdfDoc.getPageIndex(dest[0]);
            rawResults.push({
              title: item.title,
              pageNumber: pageIndex + 1 // 1-based indexing for users
            });
            addedTitles.add(item.title);
          }
        } catch (e) {
          console.warn("Could not resolve page index for outline item", item.title);
        }
      }
      
      // We process top-level items, and maybe 1 level deep if they are subchapters
      if (item.items && item.items.length > 0) {
         await processItems(item.items);
      }
    }
  };
  
  await processItems(outline);
  
  // Sort by page number
  rawResults.sort((a,b) => a.pageNumber - b.pageNumber);
  
  // Map to final format with endPage attached
  const result: PdfOutlineItem[] = rawResults.map((item, index) => {
    const isLast = index === rawResults.length - 1;
    const nextItem = rawResults[index + 1];
    
    // If the next title is on the same page, endPage = startPage.
    // Otherwise it's nextItem.pageNumber - 1
    const endPage = isLast ? pdfDoc.numPages : Math.max(item.pageNumber, nextItem.pageNumber - 1);
    
    return {
      id: crypto.randomUUID(),
      title: item.title,
      startPage: item.pageNumber,
      endPage
    };
  });
  
  return result;
}

export async function extractImagesFromPdfScope(
  fileDataUrl: string,
  startPage: number,
  endPage: number
): Promise<string[]> {
  // Dynamically import pdfjs-dist to prevent Next.js SSR errors (DOMMatrix is not defined)
  const pdfjsLib = await import("pdfjs-dist");

  if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }

  const base64 = fileDataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const loadingTask = pdfjsLib.getDocument({ data: bytes });
  const pdfDoc = await loadingTask.promise;

  const actualEndPage = Math.min(endPage, pdfDoc.numPages);
  const actualStartPage = Math.max(1, startPage);

  const images: string[] = [];

  for (let i = actualStartPage; i <= actualEndPage; i++) {
    const page = await pdfDoc.getPage(i);
    // Use a reasonable scale so the base64 string isn't too massive, 
    // but sharp enough for OCR/Vision to read text.
    const viewport = page.getViewport({ scale: 1.5 });
    
    // Create an offscreen canvas
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not create canvas context");
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    // @ts-expect-error - RenderParameters type mismatches in some pdfjs-dist versions
    await page.render(renderContext).promise;

    // Convert to JPEG base64 (quality 0.8 is a good balance between size and quality)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    images.push(dataUrl);
  }

  return images;
}

export async function extractAllPdfText(fileDataUrl: string): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }
  
  const base64 = fileDataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) { bytes[i] = binary.charCodeAt(i); }
  
  const loadingTask = pdfjsLib.getDocument({ data: bytes });
  const pdfDoc = await loadingTask.promise;
  
  let fullText = "";
  
  // Extract first 30 pages
  const startPages = Math.min(30, pdfDoc.numPages);
  for (let i = 1; i <= startPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageText = textContent.items.map((item: any) => item.str).join(" ");
    fullText += `--- PAGE ${i} ---\n${pageText}\n\n`;
  }
  
  // Extract last 30 pages (if book is larger than 30 pages)
  const lastPagesStart = Math.max(startPages + 1, pdfDoc.numPages - 29);
  if (lastPagesStart <= pdfDoc.numPages) {
    fullText += `\n... [MIDDLE PAGES OMITTED FOR BREVITY] ...\n\n`;
    for (let i = lastPagesStart; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += `--- PAGE ${i} ---\n${pageText}\n\n`;
    }
  }
  
  return fullText;
}

