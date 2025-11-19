# Muppet MiniChat

A minimal multitenant chat system demonstrating:
- Two-service backend architecture (Gateway + Responder)
- Streaming responses via Server-Sent Events (SSE)
- Lightweight in-memory tenant isolation
- Accessible UI with EN/ES i18n and theme toggle
- Persistent chat history and theme preference

---

## 🧩 Architecture Overview

UI (React + TypeScript)
⬇ HTTP + SSE (X-Tenant-Id)
Service A – Gateway/API (Node.js + Express + TypeScript)
⬇ HTTP POST
Service B – Responder (Node.js + Express + TypeScript)


- **Gateway**: handles SSE streaming + tenant context + history  
- **Responder**: simple pluggable “AI” via an `AiProvider` interface  
- **No database by design** — history lives in memory

---

## 🚀 Running Locally

### Prerequisites
- Node.js 20+
- npm

---

### 1️⃣ Service B — Responder
```bash
cd service-b-responder
cp .env.example .env
npm install
npm run dev

→ http://localhost:4001
2️⃣ Service A — Gateway

cd service-a-gateway
cp .env.example .env
npm install
npm run dev

→ http://localhost:4000

Streaming validation:

curl -N \
  -H "Accept: text/event-stream" \
  -H "X-Tenant-Id: demo-tenant-A" \
  "http://localhost:4000/api/v1/chat/stream?msg=Hello"

3️⃣ UI

cd ui
cp .env.example .env
npm install
npm run dev

→ http://localhost:5173
🐳 Docker Support

This project includes production-ready containers and a docker-compose.yml for convenient orchestration.
Run everything via Docker Compose

From project root:

docker-compose build
docker-compose up

Services will be available at:

    UI → http://localhost:5173

Gateway → http://localhost:4000

Responder → http://localhost:4001

Compose networking ensures:

gateway → http://responder:4001/respond

(no need for localhost inside containers)
📌 Tenant Isolation / Debugging

Each outbound UI request includes:

X-Tenant-Id: demo-tenant-A

To verify independent memory storage:

curl http://localhost:4000/api/v1/debug/state
```
# 🎨 UI Features:

- Feature	Status
- Streaming chat messages	✅
- Light/Dark theme (persistent)	✅
- Persistent chat history	✅
- EN/ES UI translations	✅
- Tenant debug label visible	✅

# 🧱 Tech Stack:
- Layer	Technology
- UI	React, TypeScript, Vite
- Gateway & Responder	Node.js, Express, TypeScript
- Streaming	Server-Sent Events (SSE)
- Storage	In-memory per tenant
- Containers	Docker & Docker Compose
---
🔍 Notes / Trade-offs

    In-memory storage only (assignment explicitly avoids DB)

    SSE streaming handled at Gateway level (simpler, swappable)

    Basic error handling — surfaced via SSE error events

    Minimal design by intent; focus on correctness + streaming UX

🕒 Time & Roadmap

Time spent: Replace with your actual hours

If given +2 hours:

    End-to-end token streaming from responder

    Retry/backoff between Gateway ↔ Responder

    Auto-scroll history restoration on page load

    Enhanced message UX (avatars, timestamps, animations)

✔️ Definition of Done

    Two isolated backend services with correct boundaries

    Gateway streams responses incrementally via SSE

    Multitenant behavior enforced and observable

    Simple, accessible UI with streaming experience

    Docker containers for easy local run