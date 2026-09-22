import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";
dotenv.config();
export const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  openAIApiKey: process.env.OPENAI_API_KEY,
  temperature: 0.3,
});
