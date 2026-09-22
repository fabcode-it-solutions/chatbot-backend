import { HumanMessage } from "@langchain/core/messages";
import { AgentState } from "./utils/graph/agentState.js";
import { graph } from "./utils/graph/workflow.js";
import express from "express";
import { createServer } from "http";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { createMeeting } from "./utils/createMeeting.js";
import { connectDB } from "./utils/db/config.js";
import { getSessionHistory } from "./utils/chats/getSessionHistory.js";
import { saveSessionHistory } from "./utils/chats/saveSessionHistory.js";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

dotenv.config();
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;
const origin = process.env.ORIGIN || "http://localhost:3001";

export const io = new Server(server, {
  cors: {
    origin: [origin, "https://ai-agent-chatbot.myshopify.com"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  // console.log(`🔌 User connected: ${socket.id}`);
  const chatHistory = new Map();
  const conversationStates = new Map();
  socket.on("join_session", async (data) => {
    const { sessionId, userId } = data;

    if (!sessionId) {
      socket.emit("error", { message: "Session ID is required" });
      return;
    }
    socket.join(sessionId);

    try {
      const messages = await getSessionHistory(sessionId);
      const messageHistory = messages.map((msg) => ({
        type: msg._getType ? msg._getType() : "human",
        content: msg.content,
        name: msg.name,
        timestamp: new Date(),
      }));

      socket.emit("session_history", { sessionId, messages: messageHistory });
    } catch (error) {
      console.error("Error loading session history:", error);
      socket.emit("error", { message: "Failed to load chat history" });
    }
  });

  socket.on("popup_closed", async (data) => {

  });
  socket.on("send_message", async (data) => {
    const { message, sessionId, userId } = data;
    if(message == 'closePopup'){
    socket.emit("ai_response", {
      type: "ai",
      content: "Is there anything else I can help you with today?",
      id: "",
      name: "ai",
      timestamp: new Date(),
    });
    return null;
    }
    socket.emit("typing", { isTyping: true });
    const previousMessage = chatHistory.get(sessionId);
    const previousState = conversationStates.get(sessionId) || {};
    const userMessage = new HumanMessage({ content: message });
    socket.emit("message_received", {
      type: "human",
      content: message,
      timestamp: new Date(),
    });

    const initialWorkflowState = {
      messages: [userMessage],
      meeting: previousState?.meeting,
      existingMessages: previousState?.existingMessages,
      sessionId:sessionId
    };
    const streamResults = await graph.stream(initialWorkflowState, {
      recursionLimit: 10,
      configurable: { sessionId, userId },
    });
    let assistantResponse = null;
    let finalWorkflowState = null;
    let executionCount = 0;
    const maxExecutions = 15;

    for await (const output of streamResults) {
      executionCount++;
      // console.log(
      //   `🔄 Stream iteration ${executionCount}:`,
      //   Object.keys(output)
      // );

      if (executionCount > maxExecutions) {
        console.error("🚨 Max executions reached, force breaking");
        break;
      }

      if (output.__end__) {
        // console.log("✅ Graph execution completed");
        finalWorkflowState = output.__end__;
        break;
      }

      for (const [nodeName, nodeOutput] of Object.entries(output)) {
        if (nodeName === "supervisor") {
          continue;
        }

        if (nodeOutput) {
          finalWorkflowState = nodeOutput;
        }

        if (
          nodeOutput &&
          nodeOutput.messages &&
          nodeOutput.messages.length > 0
        ) {
          const nodeMessages = nodeOutput.messages;
          const lastAIMessage = nodeMessages.find(
            (msg) =>
              msg.name === "productAssistant" ||
              msg.name === "generalAssistant" ||
              msg._getType() === "ai"
          );

          if (lastAIMessage) {
            assistantResponse = lastAIMessage;
            // console.log(
            //   `✅ Got response from ${nodeName}: ${lastAIMessage.content?.substring(
            //     0,
            //     100
            //   )}...`
            // );
            break;
          }
        }
      }

      if (assistantResponse) {
        // console.log("✅ Assistant response found, breaking stream");
        break;
      }
    }

    if (finalWorkflowState) {
      const finalMessages = [
        ...finalWorkflowState?.existingMessages,
        userMessage,
        assistantResponse,
      ];
      const updatedState = {
        meeting: finalWorkflowState?.meeting,
        existingMessages: finalMessages,
      };
      const message = [userMessage, assistantResponse];
      conversationStates.set(sessionId, updatedState);
      await saveSessionHistory(sessionId, message, userId, socket.id, {
        userAgent: socket.handshake.headers["user-agent"],
        ipAddress: socket.handshake.address,
        socketId: socket.id,
      });
    } else {
      console.warn("⚠️ No final state captured, keeping previous state");
    }
    socket.emit("typing", { isTyping: false });
    if (assistantResponse) {
      socket.emit("ai_response", {
        type: "ai",
        content: assistantResponse.content,
        id: assistantResponse?.id,
        name: assistantResponse.name,
        timestamp: new Date(),
      });
    }
    // console.log(previousMessage);
    const ai = assistantResponse.content;

    chatHistory.set(sessionId, {
      messages: { ...previousMessage?.messages, ai, human: message },
    });
  });
});

// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
//   prompt: "You: ",
// });

// // ✅ Start with clean AgentState
// let state = AgentState.empty();

// async function main() {
//   rl.prompt();

//   for await (const line of rl) {
//     const trimmed = line.trim();
//     if (trimmed.toLowerCase() === "exit") {
//       console.log("👋 Exiting. Goodbye!");
//       rl.close();
//       process.exit(0);
//     }

//     // ✅ Add user message to state
//     state = {
//       ...state,
//       messages: [...state.messages, new HumanMessage({ content: trimmed })],
//     };

//     // ✅ Run the graph
//     const result = await graph.invoke(state);

//     // ✅ Print AI response(s)
//     const newMessages = result.messages.slice(state.messages.length);
//     newMessages.forEach((msg) => {
//       const type = msg._getType?.();
//       if (type === "ai" || msg.name === "chitchatAgent") {
//         console.log(`🤖 ${msg.content}`);
//       }
//     });

//     // ✅ Update full state
//     state = result;

//     rl.prompt();
//   }
// }

// main().catch((err) => {
//   console.error("❌ Error in chatbot:", err);
//   process.exit(1);
// });

server.listen(PORT, () => {
  connectDB();
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 Socket.IO server ready for connections`);
});
app.get("/", (req, res) => {
  res.send("Server is working ✅");
});

app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is running!' });
});
