# Customer Support Chat Application

This project is a **lightweight, production-style customer support chat system** built with a modern frontend and a Node.js-Typescript backend integrated with an LLM.  
It is intentionally **scope-restricted**, **token-efficient**, and **robust against misuse**.

---

## High-Level Architecture

- **Frontend**: React (Vite + TypeScript)
- **Backend**: Node.js + Express (TypeScript)
- **LLM Providers**: Gemini / Groq (pluggable)
- **Persistence**:
  - PostgreSQL → permanent chat storage
  - Redis → short-term conversation context
- **Containerization**: Docker + Docker Compose

---

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
- Prevents token explosion.

### 3b. PostgreSQL Database (Source of Truth)
- Stores complete conversation history for retrieval


### 4. Safe LLM Invocation
- LLM failures are caught gracefully.
- If the model returns empty or invalid output:
  - A safe fallback message is returned.
- The backend never crashes due to LLM issues.

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

## Key Design Philosophy

- **Support bot, not a chatbot**
- **Short answers > verbose explanations**
- **Graceful failure > silent failure**
- **Strict scope > hallucinated helpfulness**
- **Token efficiency by design**

---
