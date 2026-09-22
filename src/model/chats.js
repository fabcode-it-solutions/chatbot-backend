import mongoose from "mongoose";

const chatSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: false, index: true },
    socketId: { type: String, index: true },
    messages: [
      {
        type: { type: String, enum: ["human", "ai", "admin"], required: true },
        content: { type: String, required: true },
        name: { type: String, default: null },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    metadata: {
      userAgent: String,
      ipAddress: String,
      platform: String,
    },
    isActive: { type: Boolean, default: true },
    lastActivity: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

chatSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 2592000 });
export const ChatSession = mongoose.model("chats", chatSessionSchema);