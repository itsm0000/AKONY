import { NextResponse } from "next/server";
import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { images } = await req.json();
    console.log("API RECEIVED IMAGES COUNT:", images?.length);

    if (!images || images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Define the expected JSON Schema for Structured Outputs
    const responseSchema: Schema = {
      type: SchemaType.OBJECT,
      properties: {
        definitions: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              text: { type: SchemaType.STRING },
              difficulty: { type: SchemaType.NUMBER },
              requiresIllustration: { type: SchemaType.BOOLEAN },
              context: { type: SchemaType.STRING },
            },
            required: ["text", "difficulty", "requiresIllustration", "context"]
          }
        },
        multipleChoice: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              text: { type: SchemaType.STRING },
              difficulty: { type: SchemaType.NUMBER },
              requiresIllustration: { type: SchemaType.BOOLEAN },
              context: { type: SchemaType.STRING },
              options: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
              },
            },
            required: ["text", "difficulty", "requiresIllustration", "context", "options"]
          }
        },
        problemSolving: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              text: { type: SchemaType.STRING },
              difficulty: { type: SchemaType.NUMBER },
              requiresIllustration: { type: SchemaType.BOOLEAN },
              context: { type: SchemaType.STRING },
            },
            required: ["text", "difficulty", "requiresIllustration", "context"]
          }
        },
        comparisons: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              text: { type: SchemaType.STRING },
              difficulty: { type: SchemaType.NUMBER },
              requiresIllustration: { type: SchemaType.BOOLEAN },
              context: { type: SchemaType.STRING },
            },
            required: ["text", "difficulty", "requiresIllustration", "context"]
          }
        },
        justifications: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              text: { type: SchemaType.STRING },
              difficulty: { type: SchemaType.NUMBER },
              requiresIllustration: { type: SchemaType.BOOLEAN },
              context: { type: SchemaType.STRING },
            },
            required: ["text", "difficulty", "requiresIllustration", "context"]
          }
        },
        dependencies: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              text: { type: SchemaType.STRING },
              difficulty: { type: SchemaType.NUMBER },
              requiresIllustration: { type: SchemaType.BOOLEAN },
              context: { type: SchemaType.STRING },
            },
            required: ["text", "difficulty", "requiresIllustration", "context"]
          }
        },
        shortAnswers: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              text: { type: SchemaType.STRING },
              difficulty: { type: SchemaType.NUMBER },
              requiresIllustration: { type: SchemaType.BOOLEAN },
              context: { type: SchemaType.STRING },
            },
            required: ["text", "difficulty", "requiresIllustration", "context"]
          }
        },
        drawings: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              text: { type: SchemaType.STRING },
              difficulty: { type: SchemaType.NUMBER },
              requiresIllustration: { type: SchemaType.BOOLEAN },
              context: { type: SchemaType.STRING },
            },
            required: ["text", "difficulty", "requiresIllustration", "context"]
          }
        }
      }
    };

    const prompt = `You are a veteran Iraqi Baccalaureate physics & electronics teacher with 20 years of experience setting final exams.
You are analyzing educational textbook pages (images provided). Your job is NOT just to copy questions that appear word-for-word. Think like an experienced teacher and GENERATE every possible exam-worthy question this content can support.

GENERATION STRATEGY:

1. DEFINITIONS (definitions array)
   - For EVERY bold term, highlighted concept, law, or principle: generate "عرّف [المصطلح] واذكر خصائصه / معادلته / وحدته".
   - For each device or component described: generate "ما هو [X]؟ وما مكوناته؟".
   - Do NOT limit yourself to terms with explicit definitions — if a concept is explained, derive a definition question from that explanation.

2. MULTIPLE CHOICE (multipleChoice array)
   - Generate MCQ questions for every fact, formula result, or conceptual claim.
   - "text" = the question stem ONLY (no choices embedded in text).
   - "options" = exactly 4 unique, distinct strings. MANDATORY: Before finalising, check that no two choices are the same word-for-word or near-identical. Each distractor must reflect a real misconception.
   - For numerical formulas: create "what is the value of X?" with the correct answer and 3 wrong numerical distractors.

3. PROBLEM SOLVING (problemSolving array)
   - For every formula on the page: generate one numerical calculation problem.
   - CHANGE the numbers from the textbook example (do not copy verbatim).
   - Include multi-step problems that chain two formulas together (difficulty 7-8).

4. COMPARISONS (comparisons array)
   - Identify ALL pairs of related concepts visible in the content (e.g., NPN/PNP, n-type/p-type, Ic/Ib/Ie, common-base/common-emitter).
   - For each pair: "قارن بين [X] و[Y] من حيث [الخاصية / السلوك / المعادلة]".
   - ALSO derive comparisons from any two definitions on the same page even if not explicitly compared in the textbook.

5. JUSTIFICATIONS (justifications array)
   - For every cause-effect relationship, property, or physical behavior described: "علل: [الظاهرة أو الخاصية]".
   - Examples: "علل: تيار الباعث Ie دائماً أكبر من تيار الجامع Ic", "لماذا يكون ربح التيار β أكبر من 1؟".

6. DEPENDENCIES (dependencies array)
   - For every quantity that depends on another: "علام يعتمد [X]؟ وكيف؟".

7. SHORT ANSWERS (shortAnswers array)
   - "اذكر" or "اشرح" questions for every list, property set, or multi-step process.
   - Include "ما الذي يحدث عند تغيير [X]؟" questions for each variable in a formula.

8. DRAWINGS (drawings array)
   - For EVERY circuit diagram, graph, energy band diagram, characteristic curve, or device illustration visible in the pages: "ارسم [X] مع تسمية أجزائه".
   - Also generate drawing questions for circuits described textually (e.g., "ارسم دائرة المضخم ذو الباعث المشترك").

DIFFICULTY RUBRIC (use the FULL range — do NOT cluster at 5):
  1-2 = single-term recall
  3-4 = one-step formula or simple concept
  5-6 = multi-concept or 2-3 step chain
  7-8 = multi-step derivation under pressure
  9-10 = cross-chapter synthesis or open-ended analysis

MATH FORMATTING:
Preserve LTR number order always. Correct: "0.85 × 10^15 Hz". Wrong: "Hz 15^10 × 0.85". Use × not *.`;

    // Map base64 images to Gemini's inlineData format
    const imageParts = images.map((dataUrl: string) => {
      // Split "data:image/jpeg;base64,..."
      const [header, base64] = dataUrl.split(",");
      const mimeType = header.split(":")[1].split(";")[0];
      return {
        inlineData: {
          data: base64,
          mimeType: mimeType
        }
      };
    });

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: prompt }, ...imageParts] }
      ],
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
    console.log("----- AI CATEGORIZATION RAW OUTPUT -----");
    console.log("Success! Categorized data generated.");

    return NextResponse.json(parsedData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to categorize";
    console.error("API /categorize error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
