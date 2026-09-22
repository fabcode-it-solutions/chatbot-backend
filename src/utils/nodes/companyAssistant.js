import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { llm } from "../pinecone/llm.js";
import { embedder } from "../pinecone/embedder.js";
import { pineconeIndex } from "../pinecone/pineconeClient.js";
import { END } from "@langchain/langgraph";

export const companyAssistant = async (state) => {
  const userInput = state.messages.at(-1)?.content;
  

  try {
  
    const queryVector = await embedder.embedQuery(userInput);
  

  
    const result = await pineconeIndex.namespace("fabcode").query({
      vector: queryVector,
      topK: 10,
      includeMetadata: true,
    });

  

    const matches = result.matches || [];
    let relevantMatches = [];
    let sources = [];

    // 🔧 FIXED: Look for question/answer fields instead of text field
    matches.forEach((match, index) => {
      const score = match.score || 0;
      const metadata = match.metadata || {};

      // ✅ Use your actual data structure: question + answer
      const question = metadata.question || "";
      const answer = metadata.answer || "";
      const combinedText =
        question && answer
          ? `Q: ${question}\nA: ${answer}`
          : question
          ? `Q: ${question}`
          : answer
          ? `A: ${answer}`
          : "";

      const source =
        metadata.source || metadata.title || `Document ${index + 1}`;
      const type = metadata.type || "unknown";


      // Filter by relevance score - using your data now!
      if ((question || answer)) {
        // Lowered threshold since we have data
        relevantMatches.push({
          question: question,
          answer: answer,
          combinedText: combinedText,
          source: source,
          type: type,
          score: score,
          metadata: metadata,
          id: match.id,
        });
        sources.push(source);
      }
    });


    // Build context from FAQ data
    let context = "";
    let contextLength = 0;
    const maxContextLength = 4000;

    if (relevantMatches.length > 0) {
      // Sort by relevance score (highest first)
      relevantMatches.sort((a, b) => b.score - a.score);

      for (const match of relevantMatches) {
        let contextPart = "";

        if (match.type === "faq" && match.question && match.answer) {
          // Format FAQ entries nicely
          contextPart = `--- FAQ: ${
            match.question
          } (Score: ${match.score.toFixed(2)}) ---\n`;
          contextPart += `Question: ${match.question}\n`;
          contextPart += `Answer: ${match.answer}\n\n`;
        } else if (match.question && match.answer) {
          // Format other Q&A entries
          contextPart = `--- ${match.source} (Score: ${match.score.toFixed(
            2
          )}) ---\n`;
          contextPart += `${match.combinedText}\n\n`;
        } else if (match.question) {
          // Just question available
          contextPart = `--- Question from ${match.source} ---\n`;
          contextPart += `${match.question}\n\n`;
        } else if (match.answer) {
          // Just answer available
          contextPart = `--- Information from ${match.source} ---\n`;
          contextPart += `${match.answer}\n\n`;
        }

        if (
          contextPart &&
          contextLength + contextPart.length <= maxContextLength
        ) {
          context += contextPart;
          contextLength += contextPart.length;
        } else {
   
          break;
        }
      }
    }


    // Enhanced prompt for FAQ-based data
    const systemPrompt = `
You are a knowledgeable FabCode company assistant. Help users with questions about:
- Company information, policies, services
- Product details and specifications  
- Team members and organizational structure
- Business processes and procedures

${
  context
    ? `
I found relevant information in our company FAQ and knowledge base:

COMPANY INFORMATION:
${context}

Instructions:
- Use the above information to answer the user's question accurately
- Reference the specific questions and answers when relevant
- If multiple related Q&As are provided, synthesize them into a comprehensive response
- Be specific and cite the information you're using
- Maintain a professional but friendly tone
- If user ask about eccomerce platform focus on "SHOPIFY"
`
    : `
I searched our company knowledge base but couldn't find specific information for this query.
I can still provide general assistance based on typical company operations.
`
}

Guidelines:
- Answer based on the provided company information when available
- If information is limited, acknowledge this and suggest alternatives
- Be helpful, professional, and informative
- Don't make up information that isn't in the provided context
- If the user is asking about a person or specific topic, use the relevant Q&A pairs to construct your response
- Don't go off topic if its not related to the company info
- **Keep the CONVERSATION limited, means only give summary not more that 20-30 words**
Follow-Up Questions:
- Generate **2-3 concise, helpful questions** the user might ask next.
- At least **1-2 questions must be directly related** to the pricing discussed.
- Do **NOT** repeat previously asked or answered questions.
- Format exactly like this, with no heading or explanation:
<!-- <array>["question 1", "question 2", "question 3"] </array> -->

Always include:
- The follow-up questions array

**🗣️ CONVERSATION GUIDELINES:**
- Keep responses concise but helpful
**- Use valid HTML formatting (p, strong, ul, li tags)**
`;


    const response = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userInput),
    ]);



    return {
      ...state,
      messages: [
        ...state.messages,
        new AIMessage({
          content: response.content,
          name: "companyAssistant",
        }),
      ],
      next: END,
    };
  } catch (error) {
    console.error("❌ Error in companyAssistant:", error);
    return {
      ...state,
      messages: [
        ...state.messages,
        new AIMessage({
          content:
            "I apologize, but I'm having trouble accessing our knowledge base right now. Please try again in a moment, or contact our support team for immediate assistance.",
          name: "companyAssistant",
        }),
      ],
      next: END,
    };
  }
};
