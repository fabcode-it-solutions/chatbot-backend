import { Annotation } from "@langchain/langgraph";

export const AgentState = Annotation.Root({
  messages: Annotation({
    reducer: (x, y) => {
      const existing = x || [];
      const incoming = y || [];
      if (incoming.length === 0) return existing;
      const combined = [...existing, ...incoming];

      const seen = new Set();
      return combined.filter((msg) => {
        const key = `${msg.content}-${
          msg._getType ? msg._getType() : msg.type
        }`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    default: () => [],
  }),
  existingMessages: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  next: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  sessionId: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  reasoning: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),

  meeting: Annotation({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
});

AgentState.empty = () => ({
  messages: [],
  next: "",
  reasoning: "",
  meeting: {
    email: undefined,
    purpose: undefined,
    datetime: undefined,
  },
});
