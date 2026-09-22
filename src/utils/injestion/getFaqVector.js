import { embedder } from "../pinecone/embedder.js";

export const getFaqVector = async (faqItem) => {
  const text = `Q: ${faqItem.q}\nA: ${faqItem.a}`;

  const vector = await embedder.embedQuery(text);
  let id = faqItem.q.toLowerCase().replace(/\s+/g, "_").slice(0, 50);
  id = id.replace(/[^\x00-\x7F]/g, "");

  return {
    id,
    values: vector,
    metadata: {
      question: faqItem.q,
      answer: faqItem.a,
      source: faqItem.source || "faq",
      type: "faq",
    },
  };
};
