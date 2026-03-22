import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";

export const maxDuration = 60; // 60s for Vercel, scanning a whole book might take 10-20s

export async function POST(req: NextRequest) {
  try {
    const { textChunk, imagesChunk, startPage, endPage, isFastPath } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const responseSchema: Schema = {
      type: SchemaType.OBJECT,
      properties: {
        chapters: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING, description: "A concise, academic title for this specific topic/chapter" },
              startPage: { type: SchemaType.NUMBER, description: `The exact physical page this topic begins on (MUST BE >= ${startPage})` },
              endPage: { type: SchemaType.NUMBER, description: `The exact physical page this topic ends on (MUST BE <= ${endPage})` }
            },
            required: ["title", "startPage", "endPage"]
          }
        }
      },
      required: isFastPath ? [] : ["chapters"] // In fast path, it's allowed to return empty chapters safely
    };

    let prompt = "";
    if (isFastPath) {
      prompt = `You are an expert universal curriculum parser. I am providing you with the FRONT pages and BACK pages of an educational textbook (a total of ${endPage} physical PDF pages).
Your ONLY goal is to find the Table of Contents, Index, or Syllabus that lists the Chapters and Topics.

CRITICAL INSTRUCTIONS:
1. Scan the provided images carefully. Identify standard structural indicators of an index or table of contents in ANY language.
2. You MUST forcefully extract EVERY single top-level chapter or topic name you find in that index.
3. If page numbers are printed next to the chapter titles, map them exactly to startPage and endPage. Use the [--- PDF Physical Page X ---] labels to correctly align index numbers to physical PDFs if needed.
4. If the last chapter only lists a start page, confidently assume it ends at page ${endPage}.
5. Do NOT attempt to summarize or translate the text. Transcribe the chapters exactly as written in their native original language.
6. Return an empty array [] ONLY if there is absolutely zero mention of chapters across all images.

Return ONLY structured JSON. Never return conversational text.`;
    } else {
      prompt = `You are an expert curriculum analyzer. I am providing you with a section of an educational textbook covering physical PDF Pages ${startPage} to ${endPage}.
Break this content down into ONLY the major Top-Level Chapters.
DO NOT list sub-topics or micro-sections. Maintain a macroscopic view.
If the entire chunk covers the middle of a single chapter, return just ONE chapter covering the full range.
Name each chapter explicitly based on the main subject. Translate nothing; keep the original native language verbatim.
Identify exactly the physical page it starts and ends on within this chunk.
Ensure your chapters cover the entire range from ${startPage} to ${endPage} contiguously without gaps.`;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let contents: any[] = [];

    if (imagesChunk && imagesChunk.length > 0) {
      // It's a scanned/handwritten PDF, use OCR + Vision
      const parts: any[] = [{ text: prompt }];
      
      imagesChunk.forEach((imgItem: any) => {
        let base64 = "";
        let mimeType = "image/jpeg";
        let pageNumLabel = "";

        if (typeof imgItem === "string") {
           // legacy fallback just in case
           const [header, b64] = imgItem.split(",");
           mimeType = header.split(":")[1].split(";")[0];
           base64 = b64;
        } else {
           const [header, b64] = imgItem.data.split(",");
           mimeType = header.split(":")[1].split(";")[0];
           base64 = b64;
           pageNumLabel = `\n[--- PDF Physical Page ${imgItem.pageNum} ---]\n`;
        }

        if (pageNumLabel) parts.push({ text: pageNumLabel });
        parts.push({ inlineData: { data: base64, mimeType } });
      });
      contents = [{ role: "user", parts }];
    } else if (textChunk) {
      // Text-based PDF
      contents = [{ role: "user", parts: [{ text: prompt + `\n\nText Payload:\n${textChunk}` }] }];
    } else {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    const result = await model.generateContent({
      contents,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const content = result.response.text();
    if (!content) {
      throw new Error("No content received from AI");
    }

    const parsedData = JSON.parse(content);

    // Formatter maps and mathematically enforces bounds to prevent AI hallucination out-of-bounds
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedChapters = parsedData.chapters.map((c: any) => ({
      id: crypto.randomUUID(),
      title: c.title,
      startPage: Math.max(startPage, c.startPage),
      endPage: Math.min(endPage, c.endPage)
    }));

    return NextResponse.json(formattedChapters);
  } catch (error: any) {
    console.error("AI TOC Extraction error:", error);
    const message = error.message || "Failed to extract TOC";
    if (message.includes("429") || message.includes("quota") || message.includes("Too Many Requests")) {
      return NextResponse.json({ error: message }, { status: 429 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
