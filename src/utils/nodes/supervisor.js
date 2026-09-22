import { z } from "zod";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { llm } from "../pinecone/llm.js";
import { END } from "@langchain/langgraph";

// === Define Workers ===
export const members = [
  "chitchatAgent",
  "companyAssistant",
  "scheduleMeetingInfoCollector",
];

const systemPrompt = `You are Joe a supervisor managing a conversation between the following workers: {members}.

📌 Worker Capabilities:
- chitchatAgent: Handles greetings, casual conversation, and small talk.
- companyAssistant: Handles general company or service/product-related inquiries.
- scheduleMeetingInfoCollector: Handles scheduling a meeting Asks the user for meeting email, purpose, and preferred time.



📏 Routing Rules:
1. If message is a casual greeting or small talk → route to "chitchatAgent".
2. If message is about company info, services, or about → route to "companyAssistant".
2. If message is about scheduling meeting/call → route to "scheduleMeetingInfoCollector".

**CONVERSATION FLOW**:
1. 

**IMPORTANT NOTE**:
1.In chitchatAgent donot make any joke or go off topic just reply them politely please ask for the company related questions.
2.In companyAgent handle all the question to company
if its scheduleMeetingInfoController. NEVER return 'END' or '__end__' directly. Always route to an appropriate agent. Let the agents decide when to terminate 

`;

const options = [END, ...members];

const routingTool = {
  name: "route",
  description: "Choose which agent should handle the next step in the flow.",
  schema: z.object({
    next: z.enum(options),
    reasoning: z.string().describe("Explain the routing decision."),
  }),
};

// === Prompt Template ===
const prompt = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],
  new MessagesPlaceholder("messages"),
  [
    "human",
    "Given the conversation above and this current state: {state}, who should act next? Choose one: {options}",
  ],
]);

const formattedPrompt = await prompt.partial({
  options: options.join(", "),
  members: members.join(", "),
});

// === Supervisor Chain ===
export const supervisor = async (state) => {
  const messages = state.messages || [];

  // 🧠 Smart routing override for meeting scheduling
  // if (state.meeting_in_progress === true) {
  //   const info = state.meeting_info || {};
  //   const hasAllInfo = info.email && info.purpose && info.datetime;

  //   if (!hasAllInfo) {
  //     return {
  //       ...state,
  //       next: "scheduleMeetingInfoCollector",
  //       reasoning: "Meeting in progress and missing required details.",
  //     };
  //   }

  //   return {
  //     ...state,
  //     next: "scheduleGoogleMeeting",
  //     reasoning: "All meeting info collected. Proceed to schedule the meeting.",
  //   };
  // }

  // 💬 No messages yet — start with chitchatAgent
  if (messages.length === 0) {
    return {
      ...state,
      next: "chitchatAgent",
      reasoning: "No messages yet. Starting with chitchat.",
    };
  }

  if (state.meeting_step) {
    return {
      ...state,
      next: "scheduleMeetingInfoCollector",
      reasoning: `Meeting info collection is in progress — asking for "${state.meeting_step}".`,
    };
  }

  // 🔮 Let the model decide
  const result = await formattedPrompt
    .pipe(
      llm.bindTools([routingTool], {
        tool_choice: "route",
      })
    )
    .invoke({
      messages,
      state: JSON.stringify(state),
    });

  const decision = result.tool_calls[0].args;

  console.log(
    `🤖 Supervisor decision: ${decision.next} — ${decision.reasoning}`
  );

  const validDestinations = [...members, END];

  if (!validDestinations.includes(decision.next)) {
    console.warn(
      `⚠️ Invalid destination "${decision.next}". Defaulting to chitchatAgent.`
    );
    return {
      ...state,
      next: "chitchatAgent",
      reasoning: "Invalid destination, falling back to chitchatAgent.",
    };
  }

  return {
    ...state,
    next: decision.next,
    reasoning: decision.reasoning,
  };
};
