import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { END } from "@langchain/langgraph";
import * as chrono from "chrono-node";
import { llm } from "../pinecone/llm.js";
import { createMeeting } from "../createMeeting.js";
import { io } from "../../chat.js";

export const scheduleMeetingInfoCollector = async (state) => {
  const messages = state.existingMessages;
  const sessionId = state.sessionId;
  const currentMeeting = state.meeting || {};
  let prompt = "";
  let updatedMeeting = { ...currentMeeting };
  io.emit("schedule_meeting", { open: true, sessionId });
  return {
    ...state,
    messages: [
      new AIMessage(
        `<p>Initiating meeting setup... Please choose a time slot to connect with The Fabcode team.</p>`
      ),
    ],
    meeting: updatedMeeting,
    next: END,
  };
  // Get last human message
  const humanMessages = state.messages.filter((msg) => {
    const type = msg._getType ? msg._getType() : msg.type;
    return type === "human";
  });
  const userInput = humanMessages.at(-1)?.content || "";
  if (messages.length < 2) {
    const systemPrompt = `
You are Joe, a helpful and friendly assistant. You job is to greet users and tell them to give following details:
**I will add the details message, you don't need to add that**
    `;

    const response = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userInput),
    ]);
    return {
      ...state,
      messages: [
        new AIMessage(
          response.content +
            `<h4>Please provide the following information:</h4> <ol>
  <li><p>Please provide the participant's email address.</p></li>
  <li><p>What is the purpose or agenda of the meeting?</p></li>
  <li><p>On which date would you like to schedule the meeting?</p></li>
  <li><p>At what time should the meeting begin?</p></li>
</ol>`
        ),
      ],
      meeting: updatedMeeting,
      next: END,
    };
  }

  // Step 1: Need email?
  if (!currentMeeting.email) {
    const emailMatch = userInput.match(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/i
    );
    if (emailMatch) {
      updatedMeeting.email = emailMatch[0];
      const systemPrompt = `You are Joe, a helpful and friendly assistant. Your job is to extract structured information from the user's message.

Extract the following fields from the message:
- **email**: the user's email address  
- **purpose**: the purpose or reason for the message (e.g., "schedule a demo", "book a meeting", "ask about pricing")  
- **date**: the date of the meeting or inquiry, formatted as **'YYYY-MM-DD'** (e.g., **'2025-07-15'**).  
  - If the user says something like **"14th of this month"**, **"14th"**, or **"next month on the 14th"**, infer the full date using the **current real-time year and month**.  
  - Adjust for month rollover if “next month” is specified.  

- **time**: the time in 24-hour format, **'HH:mm'** (e.g., **'16:00'**).  
  - If the user mentions **parts of the day** like:
    - "morning" → use **"09:00"**
    - "afternoon" → use **"13:00"**
    - "evening" → use **"17:00"**
    - "night" → use **"20:00"**
  - If a specific time is given (e.g., "4 PM", "10:30 AM"), convert it to 24-hour format.

**Response Format: Return a JSON object in this format:**
{ "email": "", "purpose": "", "date": "", "time": "" }

    `;

      const response = await llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userInput),
      ]);

      const meetingData = JSON.parse(response.content);
      if (meetingData) {
        const meetLink = await createMeeting({
          date: meetingData?.date,
          startTime: meetingData?.time,
          email: meetingData?.email,
        });

        if (meetLink == "Not Created") {
          prompt = `<p>
  <strong>Oops!</strong> Something went wrong while scheduling your meeting.
  Please try again later, or manually book an appointment by visiting 
  <a href="https://thefabcode.com/book-a-appointment/" target="_blank">this link</a>.
</p>
`;
        }
        prompt = `<p>
  ✅ <strong>Your meeting has been scheduled successfully!</strong><br />
  A confirmation email has been sent to your inbox with the meeting details.<br />
We’ll see you there!
</p>
`;
        updatedMeeting.email = meetingData?.time;
      }
    } else {
      prompt = `<h4>Please provide the following information:</h4> <ol>
  <li><p>Please provide the participant's email address.</p></li>
  <li><p>What is the purpose or agenda of the meeting?</p></li>
  <li><p>On which date would you like to schedule the meeting?</p></li>
  <li><p>At what time should the meeting begin?</p></li>
</ol>
      `;
    }

    return {
      ...state,
      messages: [new AIMessage(prompt)],
      meeting: updatedMeeting,
      next: END,
    };
  } else {
    return {
      ...state,
      messages: [
        new AIMessage(`<p>
  ℹ️ <strong>Your meeting is already scheduled.</strong><br />
  A confirmation email has been sent to your inbox with the meeting details.<br />
  Please check your email for the join link and scheduled time.<br />
  We’re looking forward to seeing you there!
</p>
`),
      ],
      meeting: updatedMeeting,
      next: END,
    };
  }
};
