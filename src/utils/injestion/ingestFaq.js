import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { pineconeIndex } from "../pinecone/pineconeClient.js";
import { getFaqVector } from "./getFaqVector.js";



const CHUNK_SIZE = 100;
const NAMESPACE = "fabcode";

export const ingestFaqToPinecone = async () => {
  const filePath = path.join(process.cwd(), "src", "data", "faq.json");

  const rawData = fs.readFileSync(filePath, "utf-8");
  const faqList = JSON.parse(rawData);

  const vectors = await Promise.all(
    faqList.map(async (item) => await getFaqVector(item))
  );

  const validVectors = vectors.filter(Boolean);

  for (let i = 0; i < validVectors.length; i += CHUNK_SIZE) {
    const chunk = validVectors.slice(i, i + CHUNK_SIZE);
    await pineconeIndex.namespace(NAMESPACE).upsert(chunk);
    // console.log(`✅ Upserted ${chunk.length} FAQ vectors`);
  }
};

ingestFaqToPinecone();
