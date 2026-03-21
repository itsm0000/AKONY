const Groq = require("groq-sdk");
require("dotenv").config({ path: ".env.local" });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  const models = await groq.models.list();
  console.log("ALL Models:");
  models.data.forEach(m => console.log(m.id));
}

main();
