import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { structure } = await req.json();

    if (!structure) {
      return NextResponse.json({ error: "No structure provided" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `أنت خبير في تصميم الامتحانات للمناهج العراقية. المهمة: قيّم هيكل الامتحان التالي وأعطِ ملاحظات فورية ومفيدة باللغة العربية.

هيكل الامتحان:
${JSON.stringify(structure, null, 2)}

قدّم تقييمك في 3-5 نقاط قصيرة وواضحة تغطي:
- التوازن بين أنواع الأسئلة (تعاريف، مسائل، اختيارات...)
- مستوى الصعوبة العام
- أي اقتراحات لتحسين الامتحان
- هل الوقت كافٍ بشكل عام؟

اجعل الملاحظات عملية ومباشرة. لا تزيد عن 200 كلمة.`;

    const result = await model.generateContent(prompt);
    const feedback = result.response.text();

    return NextResponse.json({ feedback });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to evaluate";
    console.error("API /evaluate error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
