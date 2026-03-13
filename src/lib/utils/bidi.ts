/**
 * BiDi text utilities for RTL/LTR mixed content in exams
 */

/** Detect if text is predominantly Arabic/RTL */
export function isRtlText(text: string): boolean {
  const rtlChars = text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g);
  const totalLetters = text.match(/\p{Letter}/gu);
  if (!totalLetters || totalLetters.length === 0) return true; // Default to RTL for Arabic app
  return (rtlChars?.length ?? 0) / totalLetters.length > 0.3;
}

/** Wrap text with appropriate Unicode BiDi markers */
export function wrapBidi(text: string): string {
  if (isRtlText(text)) {
    return `\u202B${text}\u202C`; // RLE ... PDF
  }
  return `\u202A${text}\u202C`; // LRE ... PDF
}

/** Clean OCR text: fix common Arabic OCR errors */
export function cleanOcrText(text: string): string {
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, " ")
    // Fix common Arabic OCR mis-reads
    .replace(/[ﻻ]/g, "لا")
    // Normalize Arabic punctuation
    .replace(/\?/g, "؟")
    .replace(/;/g, "؛")
    .replace(/,/g, "،")
    // Trim
    .trim();
}

/** Split text into lines suitable for exam display */
export function splitIntoLines(text: string, maxCharsPerLine: number = 80): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (currentLine.length + word.length + 1 > maxCharsPerLine && currentLine) {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine += (currentLine ? " " : "") + word;
    }
  }
  if (currentLine) lines.push(currentLine.trim());

  return lines;
}

/** Arabic label generators */
export const ARABIC_LABELS = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح", "ط", "ي"];
export const MCQ_LABELS = ["أ", "ب", "ج", "د"];

export function getArabicLabel(index: number): string {
  return ARABIC_LABELS[index] ?? `${index + 1}`;
}
