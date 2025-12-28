# Customer Support Chat Application

This project is a **lightweight, production-style customer support chat system** built with a modern frontend and a Node.js-Typescript backend integrated with an LLM.  
It is intentionally **scope-restricted**, **token-efficient**, and **robust against misuse**.

---

### Tech Stack

-   **Frontend:** React (Vite + TypeScript)
-   **Backend:** Node.js + Express (TypeScript)
-   **LLM Providers:** Gemini (primary) + Groq fallback
-   **Storage:** PostgreSQL (history) + Redis (context window)


## Architecture Summary

### Frontend

-   120‑character limit to prevent prompt abuse
-   prevents empty messages
-   session persists via `localStorage`
-   error messages shown without losing chat history

### Backend

-   validates input (empty + \>200 chars rejected)
-   logs every message to Postgres
-   Redis stores only recent turns for **token‑efficient context**
-   safe fallback behavior on LLM failure



## LLM Strategy

### Primary → Gemini

### Fallback → Groq (LLaMA‑3.1‑8B‑Instant)

If Gemini errors, times out, or returns invalid output, the request
automatically routes to Groq.
Users still receive a graceful message --- the backend never crashes.


## Prompt Design

-   written concisely (Chinese for token density)
-   bot always responds **only in English**
-   strictly support‑related responses
-   refuses irrelevant questions cleanly
-   replies stay short (1--3 sentences)

This balances safety, clarity, and token cost.


## Frontend Responsibilities

### 1. Character Limit Enforcement
- User input is **hard-limited to 120 characters**.
- Extra characters **cannot be typed**.
- A toast notification informs users when the limit is reached.
- Prevents token abuse and long prompts.

### 2. Empty Message Protection
- Messages with only whitespace are blocked.
- Send button is disabled when input is empty.

### 3. Session Persistence
- `sessionId` is stored in `localStorage`.
- On page reload:
  - The session ID is reused.
  - Previous messages are fetched from the backend.
- Ensures conversation continuity without authentication.

### 4. Error Handling UX
- Errors are shown as **chat messages or toast notifications**.
- Existing messages are **never cleared**.
- No blank screens or UI resets.

---

## Backend Responsibilities

### 1. Input Validation
The backend validates **before calling the LLM**:
- Rejects empty messages.
- Rejects messages exceeding 200 characters.
- Ensures `sessionId` is valid or generates a new UUID.

### 2. Conversation Management
- Each conversation has:
  - A unique UUID
  - Creation timestamp
- Messages are stored as:
  - `(conversation_id, sender, text, timestamp)`

### 3a. Redis Context Window
- Redis stores only **recent messages** (short context window).

### 3b. PostgreSQL Database
- Stores complete conversation history for retrieval


### 4. Safe LLM Invocation (Fail-Safe by Design)

The backend never depends on a single LLM provider.

    1. Every request first attempts Gemini.
    2. If Gemini fails (timeout, rate-limit, invalid response, etc.),
       it automatically falls back to Groq (LLaMA-3.1-8B-Instant).
    3. If Groq also fails, the user still receives a controlled response



---

## System Prompt Design

### Why the Prompt Is Written in Chinese
- Chinese tokens are **denser**, reducing prompt token cost.
- The model is explicitly instructed:
  - To always reply **only in English**.
  - To refuse non-store-related questions.
- Refusal responses are hard-coded in English to avoid language leakage.

### Prompt Guarantees
- Only store-related topics are answered.
- General knowledge questions (countries, capitals, history, etc.) are blocked.
- Responses are:
  - 1–3 short sentences
  - Professional and concise
  - Free of system disclaimers or self-explanations

---

## Security & Abuse Prevention

- No order numbers or PII are requested.
- No arbitrary tool usage.
- No prompt injection through user messages.
- Strong scope boundaries enforced via system prompt.

---

## Development & Running

### Environment Variables

- Create a `.env` file in the backend:


### Backend

#### Transpile TypeScript

```bash
npx tsc
```

#### Run the server

```bash
node dist/server.js
```

#### Development mode (watch)

```bash
npx tsx watch server.ts
```

#### Ensure dependencies are running

* Redis
* PostgreSQL

#### Start services using Docker

```bash
docker compose up
```

---

### Frontend

```bash
npm install
npm run dev
```


## API Endpoints

### POST /chat/message
Sends a message to the AI agent and receives a reply.

**Request body**
```json
{
  "rmessage": "What is your return policy?",
  "sessionId": "optional-uuid-string"
}
````

* `rmessage` — required, user message
* `sessionId` — optional; if missing, a new session is created

**Response**

```json
{
  "reply": "You can return unused electronics within 30 days...",
  "sessionId": "c5c0b7b2-5ce0-4a1d-b6b7-6b72d37a87af"
}
```

---

### GET /chat/:sessionId

Fetches previous messages for a conversation.

**Example**

```
GET /chat/c5c0b7b2-5ce0-4a1d-b6b7-6b72d37a87af
```

**Response**

```json
{
  "messages": [
    { "sender": "user", "text": "Hi" },
    { "sender": "ai", "text": "Hello! How may I assist you today?" }
  ]
}

```
### GET /health/?=sessionId=SESSIONID

Returns service status and connectivity info.

**Response**


```json
{
  "status": "ok",
  "postgres": "connected",
  "redis": "connected",
  "cachePreview": {
    "count": 2,
    "last": { "sender": "ai", "text": "Hello! How may I assist you today?" }
  },
  "timestamp": "2025-01-01T12:34:56.789Z"
}
```



## Reliability Features

-   backend rejects invalid input
-   LLM failures handled gracefully
-   automatic provider fallback
-   cached short context reduces cost
-   no secrets committed


## Active Explorations

-   **TOON format** for compressed context to further cut token usage\
-   conversation summarization for extremely long chats\
-   deeper provider routing metrics (latency + cost awareness)

These are forward‑looking improvements --- architecture is already
prepared for them.

## Key Design Philosophy

- **Support bot, not a chatbot**
- **Short answers > verbose explanations**
- **Graceful failure > silent failure**
- **Strict scope > hallucinated helpfulness**
- **Token efficiency by design**
- **predictable cost > uncontrolled context**

