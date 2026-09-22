import { OpenAIEmbeddings } from "@langchain/openai";
export const embedder = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
});
