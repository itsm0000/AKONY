const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function runTest() {
  console.log("Using API Key starting with:", process.env.GEMINI_API_KEY?.substring(0, 10));
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  try {
    const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const listData = await listResponse.json();
    console.log("Available models:", listData.models ? listData.models.map(m => m.name).join(', ') : listData);

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
