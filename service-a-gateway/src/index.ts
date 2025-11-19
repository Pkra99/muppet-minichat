import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { addMessage, getAllState } from "./state";

dotenv.config();

const app = express();
const port = process.env.GATEWAY_PORT || 4000;
const responderUrl = process.env.RESPONDER_URL || "http://localhost:4001/respond";

app.use(cors({ origin: "http://localhost:5173", credentials: false }));
app.use(express.json());

// middleware to get tenant
app.use((req, _res, next) => {
  const tenantId = req.header("X-Tenant-Id") || "demo-tenant-A";
  (req as any).tenantId = tenantId;
  console.log(`[${new Date().toISOString()}] tenant=${tenantId} ${req.method} ${req.url}`);
  next();
});

// Optional: POST /api/v1/chat just to acknowledge
app.post("/api/v1/chat", (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId as string;
  const { message } = req.body as { message?: string };

  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  addMessage(tenantId, { role: "user", content: message });
  return res.status(202).json({ accepted: true });
});

// SSE streaming endpoint
app.get("/api/v1/chat/stream", async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId as string;
  const message = (req.query.msg as string) || "";

  if (!message) {
    res.status(400).json({ error: "msg query param is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.flushHeaders?.();

  // record user message
  addMessage(tenantId, { role: "user", content: message });

  try {
    const url = new URL(responderUrl);
    // use slow mode to get longer text
    url.searchParams.set("mode", "slow");

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message, tenantId })
    });

    if (!response.ok) {
      res.write(`event: error\n`);
      res.write(`data: "responder_error"\n\n`);
      res.end();
      return;
    }

    const data = (await response.json()) as { reply: string };
    const fullReply = data.reply;

    addMessage(tenantId, { role: "assistant", content: fullReply });

    const words = fullReply.split(" ");
    let index = 0;

    const interval = setInterval(() => {
      if (index >= words.length) {
        res.write(`event: done\n`);
        res.write(`data: {}\n\n`);
        clearInterval(interval);
        res.end();
        return;
      }

      const chunk = words.slice(index, index + 5).join(" ");
      index += 5;

      res.write(`event: chunk\n`);
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }, 100);

    req.on("close", () => {
      clearInterval(interval);
      res.end();
    });
  } catch (err) {
    console.error("Gateway error:", err);
    res.write(`event: error\n`);
    res.write(`data: "gateway_error"\n\n`);
    res.end();
  }
});

// optional debug endpoint
app.get("/api/v1/debug/state", (_req: Request, res: Response) => {
  res.json(getAllState());
});

app.listen(port, () => {
  console.log(`Gateway service listening on port ${port}`);
});
