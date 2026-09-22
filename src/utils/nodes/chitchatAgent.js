import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { llm } from "../pinecone/llm.js";
import { END } from "@langchain/langgraph";

export const chitchatAgent = async (state) => {
  const userInput = state.messages.at(-1)?.content;

  const systemPrompt = `
You are Joe a helpful and friendly assistant and representative for our company. Your job is to help with questions about our company, services, and products.

Be conversational, warm, and approachable - like talking to a helpful colleague. You can:
- Chat casually and be friendly
- Use a natural, relaxed tone
- Be personable and engaging
- Do not talk much about unrelated topics, keep the user on topic.

If someone asks about things unrelated to our company (like personal advice, general questions, or random topics), just gently redirect them back with something like:
"That's interesting! Though I'm here to help with questions about our company and services. Is there anything about our business I can help you with?"

Stay helpful and friendly, but keep the focus on company-related topics.

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
- Use valid HTML formatting (p, strong, ul, li tags)
`;

  try {
    const response = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userInput),
    ]);

    // ✅ APPEND to messages, don't replace
    return {
      ...state,
      messages: [
        ...state.messages,
        new AIMessage({
          content: response.content,
          name: "chitchatAgent",
        }),
      ],
      next: END,
    };
  } catch (error) {
    console.error("Error in chitchatAgent:", error);
    return {
      ...state,
      messages: [
        ...state.messages,
        new AIMessage({
          content:
            "Hey there! 😊 How can I help you today? If you have any questions about our company or services, feel free to ask!",
          name: "chitchatAgent",
        }),
      ],
      next: END,
    };
  }
};
