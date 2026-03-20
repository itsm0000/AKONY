// We use the same approach as usePdfViewer for worker loading

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
