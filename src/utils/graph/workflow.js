// import { START, END, StateGraph } from "@langchain/langgraph";
// import { AgentState } from "./agentState.js";
// import { chitchatAgent } from "../nodes/chitchatAgent.js";
// import { companyAssistant } from "../nodes/companyAssistant.js";
// import { supervisor } from "../nodes/supervisor.js";

// const workflow = new StateGraph(AgentState)
//   .addNode("supervisor", supervisor)
//   .addNode("companyAssistant", companyAssistant)
//   .addNode("chitchatAgent", chitchatAgent);

// // 🧠 Supervisor decides the next node
// workflow.addConditionalEdges(
//   "supervisor",
//   (state) => {
//     const decision = state.next || "chitchatAgent";
//     if (decision !== "chitchatAgent" && decision !== "companyAssistant") {
//       console.warn(
//         `Invalid decision: ${decision}. Defaulting to chitchatAgent.`
//       );
//       return "chitchatAgent";
//     }
//     return decision;
//   },
//   {
//     chitchatAgent: "chitchatAgent",
//     companyAssistant: "companyAssistant",
//   }
// );

// workflow.addEdge("companyAssistant", "supervisor");
// workflow.addEdge("chitchatAgent", "supervisor");

// workflow.addEdge(START, "supervisor");

// export const graph = workflow.compile();

// import { START, END, StateGraph } from "@langchain/langgraph";
// import { AgentState } from "./agentState.js";
// import { chitchatAgent } from "../nodes/chitchatAgent.js";
// import { companyAssistant } from "../nodes/companyAssistant.js";
// import { supervisor } from "../nodes/supervisor.js";

// const workflow = new StateGraph(AgentState)
//   .addNode("supervisor", supervisor)
//   .addNode("companyAssistant", companyAssistant)
//   .addNode("chitchatAgent", chitchatAgent);

// // 🧠 Supervisor decides the next node
// workflow.addConditionalEdges(
//   "supervisor",
//   (state) => {
//     const decision = state.next;
//     console.log("decision -->",decision)

//     if (!decision) {
//       console.log("✅ Ending graph because decision is undefined.");
//       return END;
//     }

//     if (decision !== "chitchatAgent" && decision !== "companyAssistant") {
//       console.warn(
//         `⚠️ Invalid decision: ${decision}. Defaulting to chitchatAgent.`
//       );
//       return END;
//     }

//     return decision;
//   },
//   {
//     chitchatAgent: "chitchatAgent",
//     companyAssistant: "companyAssistant",
//     [END]: END, // ✅ Allow graph to stop
//   }
// );

// // Edge from agents back to supervisor
// workflow.addEdge("companyAssistant", "supervisor");
// workflow.addEdge("chitchatAgent", "supervisor");

// // Start the graph at supervisor
// workflow.addEdge(START, "supervisor");

// // ✅ Add edge to end the graph if needed
// workflow.addEdge("supervisor", END);

// export const graph = workflow.compile();

// graph.js - FIXED VERSION
// import { START, END, StateGraph } from "@langchain/langgraph";
// import { AgentState } from "./agentState.js";
// import { chitchatAgent } from "../nodes/chitchatAgent.js";
// import { companyAssistant } from "../nodes/companyAssistant.js";
// import { supervisor } from "../nodes/supervisor.js";
// import { scheduleMeetingInfoCollector } from "../nodes/scheduleMeetingInfoCollector.js";

// const workflow = new StateGraph(AgentState)
//   .addNode("supervisor", supervisor)
//   .addNode("companyAssistant", companyAssistant)
//   .addNode("chitchatAgent", chitchatAgent)
//   .addNode("scheduleMeetingInfoCollector", scheduleMeetingInfoCollector);

// // 🧠 Supervisor decides the next node
// workflow.addConditionalEdges(
//   "supervisor",
//   (state) => {
//     const decision = state.next;
//     console.log("THIS decision -->", decision);

//     // ✅ Handle termination cases
//     if (!decision || decision === "FINISH") {
//       console.log("✅ Ending graph because decision is FINISH or undefined.");
//       return END;
//     }

//     const validDecisions = [
//       "chitchatAgent",
//       "companyAssistant",
//       "scheduleMeetingInfoCollector",
//     ];

//     // ✅ Validate decision
//     // if (decision !== "chitchatAgent" && decision !== "companyAssistant") {
//     //   console.warn(`⚠️ Invalid decision: ${decision}. Ending graph.`);
//     //   return END;
//     // }

//     if (!validDecisions.includes(decision)) {
//       console.warn(`⚠️ Invalid decision: ${decision}. Ending graph.`);
//       return END;
//     }

//     return decision;
//   },
//   {
//     chitchatAgent: "chitchatAgent",
//     companyAssistant: "companyAssistant",
//     scheduleMeetingInfoCollector: "scheduleMeetingInfoCollector",
//     [END]: END,
//   }
// );

// // Edge from agents back to supervisor (they can continue the conversation)
// workflow.addEdge("companyAssistant", "supervisor");
// workflow.addEdge("chitchatAgent", "supervisor");
// workflow.addEdge("scheduleMeetingInfoCollector", "supervisor");
// workflow.addEdge(START, "supervisor");

// export const graph = workflow.compile();

// graph.js - FIXED VERSION
import { START, END, StateGraph } from "@langchain/langgraph";
import { AgentState } from "./agentState.js";
import { chitchatAgent } from "../nodes/chitchatAgent.js";
import { companyAssistant } from "../nodes/companyAssistant.js";
import { scheduleMeetingInfoCollector } from "../nodes/scheduleMeetingInfoCollector.js";
import { supervisor } from "../nodes/supervisor.js";

const workflow = new StateGraph(AgentState)
  .addNode("supervisor", supervisor)
  .addNode("companyAssistant", companyAssistant)
  .addNode("chitchatAgent", chitchatAgent)
  .addNode("scheduleMeetingInfoCollector", scheduleMeetingInfoCollector);

// 🧠 Supervisor decides the next node
workflow.addConditionalEdges(
  "supervisor",
  (state) => {
    const decision = state.next;
    // console.log("🎯 Graph routing decision:", decision);

    // ✅ CRITICAL: Handle END properly
    if (!decision || decision === END || decision === "END") {
      // console.log("✅ Terminating graph because decision is END");
      return END;
    }

    // ✅ Validate decision
    if (
      decision !== "chitchatAgent" &&
      decision !== "companyAssistant" &&
      decision !== "scheduleMeetingInfoCollector"
    ) {
      // console.warn(`⚠️ Invalid decision: ${decision}. Ending graph.`);
      return END;
    }

    return decision;
  },
  {
    chitchatAgent: "chitchatAgent",
    companyAssistant: "companyAssistant",
    scheduleMeetingInfoCollector: "scheduleMeetingInfoCollector",
    [END]: END, // ✅ Allow graph to stop
  }
);

// ✅ CRITICAL: Agents should NOT go back to supervisor automatically
// Only add edges back to supervisor if agents explicitly return "supervisor"
workflow.addConditionalEdges(
  "companyAssistant",
  (state) => {
    // console.log("🔄 CompanyAssistant finished, next:", state.next);
    return state.next === END ? END : "supervisor";
  },
  {
    supervisor: "supervisor",
    [END]: END,
  }
);

workflow.addConditionalEdges(
  "chitchatAgent",
  (state) => {
    // console.log("🔄 ChitchatAgent finished, next:", state.next);
    return state.next === END ? END : "supervisor";
  },
  {
    supervisor: "supervisor",
    [END]: END,
  }
);

// ✅ MOST IMPORTANT: Meeting collector should terminate properly
workflow.addConditionalEdges(
  "scheduleMeetingInfoCollector",
  (state) => {
    // console.log("🔄 MeetingCollector finished, next:", state.next);
    return state.next === END ? END : "supervisor";
  },
  {
    supervisor: "supervisor",
    [END]: END,
  }
);

// Start the graph at supervisor
workflow.addEdge(START, "supervisor");

// ❌ REMOVE THIS LINE if it exists - it conflicts with conditional edges
// workflow.addEdge("supervisor", END);

export const graph = workflow.compile({
  recursionLimit: 10, // Lower limit for safety
});
