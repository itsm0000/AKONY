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
            },
            required: ["text", "difficulty", "requiresIllustration", "context"]
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

    const prompt = `You are an expert Iraqi Baccalaureate exam analyzer. 
Analyze the provided educational pages (which may contain text, scientific diagrams, and graphs) and extract all potential exam questions into these specific categories:
1. "definitions" (تعاريف)
2. "multipleChoice" (اختيارات - extract the question and options if available)
3. "problemSolving" (مسائل حسابية / رياضية)
4. "comparisons" (مقارنات / ما الفرق بين)
5. "justifications" (علل / اذكر السبب)
6. "dependencies" (علام يعتمد)
7. "shortAnswers" (أجب باختصار / تعاليل / شرح)
8. "drawings" (رسومات / مخططات - identify any illustrations or diagrams that could be asked to be drawn)

For each extracted question, return an object with the following schema:
- "text": The extracted question text in Arabic
- "difficulty": A number from 1 to 10 evaluating how hard this question is for a high school student
- "requiresIllustration": true if answering this question requires drawing or if it's based on a visual diagram present in the page, false otherwise
- "context": A very brief 1-5 word context on what this topic is about (e.g. 'الفصل الرابع - الفيزياء')

VERY IMPORTANT FORMATTING RULE FOR NUMBERS AND MATH:
When extracting mathematical formulas, numbers, equations, or scientific units (like Hz, m/s, 10^15), ensure they are perfectly written and logically ordered. Because Arabic is Right-to-Left (RTL) and English/Math is Left-to-Right (LTR), mixed text can easily break. To prevent this: ALWAYS wrap formulas or mixed LTR math inside standard English LTR formatting if necessary, or ensure numbers and units are correctly sequenced so they render legibly (e.g., instead of "Hz 15^10 * 0.85" it should clearly state "0.85 * 10^15 Hz"). Do not randomly shuffle math symbols!`;

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
  } catch (error: any) {
    console.error("API /categorize error:", error);
    return NextResponse.json({ error: error.message || "Failed to categorize" }, { status: 500 });
  }
}
