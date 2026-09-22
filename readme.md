# AI Sales & Support Chatbot

An intelligent, multi-agent AI chatbot backend built for real-time customer engagement — handling FAQs, product/company inquiries, casual conversation, and meeting scheduling, all from a single conversational interface.

Built by **[FabCode](https://thefabcode.com)** for seamless integration into websites, Shopify storefronts, and other customer-facing platforms.

---

## 🎯 What This Solves

Modern businesses lose leads and customer trust when support is slow or unavailable. This chatbot acts as an always-on, intelligent first point of contact that:

- Answers company, product, and service questions instantly using your own knowledge base
- Keeps casual conversations natural and on-brand
- Books meetings/calls directly with your team without human intervention
- Remembers conversation history per user session for a seamless experience
- Sends automated email confirmations and calendar invites

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🧠 **Multi-Agent Intelligence** | A supervisor agent automatically routes each message to the right specialist — chit-chat, company Q&A, or meeting scheduling — for accurate, focused responses. |
| 🔎 **Knowledge-Base Powered Answers** | Uses vector search (Pinecone) over your FAQs and company data so answers are grounded in real, up-to-date information — not generic AI guesses. |
| 📅 **Automated Meeting Booking** | Collects the user's email, purpose, and preferred time, then automatically schedules the meeting and sends a calendar invite via Google Calendar. |
| 📧 **Automated Email Notifications** | Sends confirmation and follow-up emails automatically once a meeting is booked. |
| 💬 **Real-Time Conversations** | Powered by Socket.IO for instant, live chat — no page refreshes, no delays. |
| 🗂️ **Persistent Chat History** | Every conversation is securely stored (MongoDB) and reloaded per session, so users never lose context. |
| 🛒 **Shopify-Ready** | Pre-configured to connect directly with Shopify storefronts as an embedded shopping assistant. |
| 🔌 **Easy Integration** | A lightweight Node.js/Express backend that can be embedded into any website or app via a simple socket connection. |

---

## 🛠️ Tech Stack

- **Runtime:** Node.js + Express
- **Real-Time Communication:** Socket.IO
- **AI Orchestration:** LangChain + LangGraph (multi-agent workflow)
- **Language Model:** OpenAI (via LangChain)
- **Vector Search:** Pinecone
- **Database:** MongoDB (Mongoose)
- **Scheduling & Calendar:** Google Calendar API
- **Email:** Nodemailer
- **Natural Language Date Parsing:** Chrono-node

---

## ⚙️ How It Works

1. A user sends a message through the chat widget.
2. A **Supervisor Agent** analyzes the message and routes it to the right specialist:
   - **Chitchat Agent** — handles greetings and casual small talk
   - **Company Assistant** — answers product, service, and company-related questions using the knowledge base
   - **Meeting Scheduler** — collects details and books a call automatically
3. The response streams back to the user in real time.
4. The full conversation is saved, so the user can pick up right where they left off.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB instance
- Pinecone account & index
- OpenAI API key
- Google Cloud service account (for calendar/meeting scheduling)
- SMTP credentials (for email notifications)

### Installation

```bash
# Install dependencies
npm install

# Configure environment variables
# Create a .env file with your API keys and credentials

# Ingest FAQ data into the vector database
npm run ingest:faq

# Start the development server
npm run dev
```

The server runs on `http://localhost:3000` by default, with a health check available at `/health`.

---

## 📦 Project Structure

```
src/
├── chat.js                  # Server entry point & Socket.IO event handling
├── data/                    # FAQ and knowledge base source data
├── model/                   # Database models
└── utils/
    ├── chats/               # Chat session history management
    ├── db/                  # Database configuration
    ├── graph/                # Multi-agent workflow (LangGraph)
    ├── nodes/                # Individual AI agents (chitchat, company, scheduler)
    ├── pinecone/             # Vector search & LLM configuration
    ├── injestion/            # FAQ ingestion pipeline
    ├── createMeeting.js      # Google Calendar meeting automation
    └── sendEmail.js          # Automated email notifications
```

---

## 🔒 Security & Reliability

- Environment-based configuration keeps all credentials out of source control
- Session-based conversation isolation ensures data privacy between users
- Built-in safeguards against runaway AI loops (execution limits on the agent workflow)

---

## 📄 License

See [LICENSE](./LICENSE) for details.

---

Built and maintained by **[FabCode](https://thefabcode.com)** — custom AI, web, and automation solutions.
