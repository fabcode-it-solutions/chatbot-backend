import mongoose from "mongoose";
import { ChatSession } from "../../model/chats.js";
export async function saveSessionHistory(
  sessionId,
  messages,
  userId = null,
  socketId = null,
  metadata = {}
) {
  try {
    if (mongoose.connection.readyState === 1) {
      // console.log(messages)
      const messagesToStore = messages.map((msg) => ({
        type: msg._getType ? msg._getType() : msg.type || "human",
        content: msg.content,
        name: msg.name || null,
        timestamp: new Date(),
      }));

      const updateData = {
        $set: {
          lastActivity: new Date(),
          isActive: true,
        },
        $push: {
          messages: { $each: messagesToStore },
        },
      };

      if (userId) updateData.$set.userId = userId;
      if (socketId) updateData.$set.socketId = socketId;
      if (Object.keys(metadata).length > 0) updateData.$set.metadata = metadata;

      await ChatSession.findOneAndUpdate({ sessionId }, updateData, {
        upsert: true,
        new: true,
      });
    }
  } catch (error) {
    console.error("Error saving session history:", error);
  }
}
