import express from "express";
import { v4 as uuidv4 } from "uuid";
import { CHATDB } from "./ChatDb";
import { ChatCache } from "./ChatCache";
import { LLMProvider } from "./LlmProvider";
import { createSystemPrompt } from "./createSystemPrompt";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const db = new CHATDB();
const cache = new ChatCache();
const llm = new LLMProvider();

(async () => {
    await db.init();
    }
        )();


app.get("/",async (req ,res)=>{
  try {
    return "Hello world";
  } catch (error) {
    console.log(error);
  }
})
app.post("/chat/message", async (req, res) => {
  try {
    const { rmessage, sessionId } = req.body;
    const message = `Reply only in English ${rmessage}`;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Empty message" });
    }

    const conversationId = sessionId && sessionId !== "undefined" ? sessionId:uuidv4();
    await db.createConversation(conversationId);

    const context = await cache.getContext(conversationId);
    const systemPrompt = createSystemPrompt();

    let reply:string|undefined;
    try{
        reply = await llm.generate(systemPrompt, context, message);

        if (!reply || !reply.trim()) {
        reply =
          "I’m unable to answer that right now. Please contact support.";
      }
    } 
    catch(error) {
        console.error(error);
      return res.status(500).json({
        reply: "Support agent unavailable. Please try again later.",sessionId: conversationId });
    }

    await db.saveMessage(uuidv4(), conversationId, "user", rmessage);
    await db.saveMessage(uuidv4(), conversationId, "ai", reply);

    await cache.addMessage(conversationId, "user", rmessage);
    await cache.addMessage(conversationId, "ai", reply);

    res.json({ reply, sessionId: conversationId });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      reply: "Support agent unavailable. Please try again later.",
    });
  }
});

app.get("/chat/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const messages = await db.getMessages(sessionId);
    res.json({ messages });
  } catch (er){
    console.error(er);
    res.status(500).json({ error: "Failed to load chat" });
  }
});


app.listen(3000, () => {
  console.log("Server running on port 3000");
});
