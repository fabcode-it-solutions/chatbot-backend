import mongoose from "mongoose";
import { ChatSession } from "../../model/chats.js";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
export async function getSessionHistory(sessionId) {
  try {
    if (mongoose.connection.readyState === 1) {
      const session = await ChatSession.findOne({ sessionId });
      if (session && session.messages) {
        return session.messages.map((msg) => {
          if (msg.type === "human") {
            return new HumanMessage({ content: msg.content });
          } else {
            return new AIMessage({ content: msg.content, name: msg.name });
          }
        });
      }
      return [];
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error getting session history:", error);
    return [];
  }
}
