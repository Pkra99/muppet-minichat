import express, { Request, Response } from "express";
import { EchoAiProvider } from "./aiProvider";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const port = process.env.RESPONDER_PORT || 4001;

app.use(express.json());

const aiProvider = new EchoAiProvider();

app.post("/respond", async (req: Request, res: Response) => {
  const { message, tenantId } = req.body as {
    message?: string;
    tenantId?: string;
  };
  const mode = req.query.mode as string | undefined;

  if (!message || !tenantId) {
    return res.status(400).json({ error: "message and tenantId are required" });
  }

  try {
    const reply = await aiProvider.generateReply({ message, tenantId, mode });
    return res.json({ reply });
  } catch (err) {
    console.error("Responder error:", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

app.listen(port, () => {
  console.log(`Responder service listening on port ${port}`);
});
