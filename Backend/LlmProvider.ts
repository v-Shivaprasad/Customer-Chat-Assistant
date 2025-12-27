import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import "dotenv/config";

type Msg = { sender: "user" | "ai"; text: string };

export class LLMProvider {
  private gemini?: GoogleGenAI;
  private groq?: Groq;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      this.gemini = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });
    }
    if (process.env.GROQ_API_KEY) {
      this.groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      });
    }
  }

  async generate(
    systemPrompt: string,
    context: Msg[],
    userMessage: string
  ): Promise<string> {
    // ---- Try Gemini first ----
    if (this.gemini) {
      try {
        const history = context
          .map(m => `${m.sender.toUpperCase()}: ${m.text}`)
          .join("\n");

        const contents = `${history}\nUSER: ${userMessage}`;

        const res = await this.gemini.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
          config: { systemInstruction: systemPrompt },
        });

        const text = res.text?.trim();
        if (text) return text;
      } catch {
        console.log("forwarding to llama");
      }
    }

    // ---- Fallback to Groq ----
    if (!this.groq) {
      throw new Error("No LLM provider available");
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...context.map(m => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      })),
      { role: "user", content: userMessage },
    ];
    console.log(messages);
    const completion = await this.groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages,
      temperature: 0.3,
    });

    return completion.choices[0]?.message?.content ?? "";
  }
}
