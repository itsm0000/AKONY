import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function runTest() {
  console.log("Using API Key starting with:", process.env.GEMINI_API_KEY?.substring(0, 10));
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  
  try {
    const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const listData = await listResponse.json();
    console.log("Available models:");
    listData.models?.forEach((m: any) => console.log(m.name));

    const modelParams = { model: "gemini-1.5-flash" };
    console.log("\nTesting generateContent with:", modelParams.model);
    const model = genAI.getGenerativeModel(modelParams);
    const result = await model.generateContent("Say hello!");
    console.log("Success:", result.response.text());
  } catch (error) {
    console.error("Generate error:", error);
  }
}

runTest();
