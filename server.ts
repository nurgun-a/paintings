import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Endpoint for AI chat assistant supporting both DeepSeek (if key is set) and Gemini (as fallback)
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [], currentTask, playerName = "Игрок" } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Build the system prompt with quest context
    let taskContext = "Игрок еще не начал квест.";
    if (currentTask) {
      taskContext = `Текущее задание игрока:
- Название: "${currentTask.title}"
- Тип: "${currentTask.type}"
- Описание: "${currentTask.description}"
- Подсказка в игре: "${currentTask.hint}"`;
    }

    const systemPrompt = `Ты — мудрый и почтенный Сказитель Олонхо (Олонхосут), хранитель древних преданий якутского героического эпоса "Ньургун Стремительный".
Твоя цель — помогать отважному богатырю по имени ${playerName} в его интерактивном походе сквозь три мира Олонхо.
Твоя задача — отвечать на его вопросы, воодушевлять его, давать таинственные и наводящие подсказки к его текущему заданию, но НИ В КОЕМ СЛУЧАЕ НЕ РАСКРЫВАТЬ ОТВЕТ НАПРЯМУЮ!
Игрок должен сам разгадать все загадки и пройти испытания. Если игрок просит ответ напрямую, мягко и поэтично откажи ему, призвав проявить богатырскую смекалку.

Контекст игры:
${taskContext}

Правила общения:
1. Общайся в уважительном, мудром, слегка былинном и поэтичном стиле якутского сказителя Олонхосут. Используй такие обращения, как "отважный богатырь", "славный путник", "защитник Среднего Мира".
2. Никогда не раскрывай ответ напрямую. Направляй мысль игрока с помощью легенд, образов природы Саха, духов земли или намеков на детали задания.
3. Отвечай на русском языке.
4. Отвечай кратко, емко и атмосферно — игрок читает твои слова с экрана смартфона во время прохождения квеста.`;

    const deepseekKey = process.env.DEEPSEEK_API_KEY;

    if (deepseekKey && deepseekKey !== "MY_DEEPSEEK_API_KEY" && deepseekKey.trim() !== "") {
      // Use DeepSeek API
      try {
        // Map history to standard chat completion format
        const messages = [
          { role: "system", content: systemPrompt },
          ...history.map((msg: any) => ({
            role: msg.sender === "player" ? "user" : "assistant",
            content: msg.text,
          })),
          { role: "user", content: message },
        ];

        const response = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${deepseekKey}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages,
            temperature: 0.7,
            max_tokens: 500,
          }),
        });

        if (!response.ok) {
          throw new Error(`DeepSeek API returned status ${response.status}`);
        }

        const data = await response.json();
        const aiMessage = data.choices?.[0]?.message?.content || "Извините, не удалось получить ответ.";
        return res.json({ text: aiMessage, provider: "deepseek" });
      } catch (dsError: any) {
        console.error("DeepSeek API failed, attempting Gemini fallback...", dsError.message);
        // Fallback to Gemini if DeepSeek fails but Gemini key is present
      }
    }

    // Use Gemini API as fallback or default
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey || geminiKey === "MY_GEMINI_API_KEY") {
      // If no valid key is present, return a helpful automated mock guide response
      const mockResponses = [
        "Я слышу тебя, славный богатырь! Мой голос доносится из глубин веков в автономном режиме. Послушай мой совет: " + (currentTask?.hint || "будь внимателен к знакам природы!"),
        "Сказитель Олонхо приветствует тебя! Путь богатыря труден, но благороден. Оглянись вокруг, ответ предначертан судьбой: " + (currentTask?.hint || "Ищи священные подсказки!"),
        "Для того чтобы услышать всю мудрость Верхнего Мира, подключи API-ключ в настройках, но я все же шепну тебе напутствие: " + (currentTask?.hint || "доверяй силе своего духа!")
      ];
      const randomMock = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      return res.json({ text: randomMock, provider: "mock" });
    }

    const ai = new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    // We can use a direct call to ai.models.generateContent
    // Build chat contents by concatenating custom history to maintain state
    const formattedContents = [];
    
    // Add system instruction in config
    const config = {
      systemInstruction: systemPrompt,
      temperature: 0.7,
    };

    // Construct dialog history
    for (const msg of history) {
      formattedContents.push({
        role: msg.sender === "player" ? "user" : "model",
        parts: [{ text: msg.text }]
      });
    }
    // Add final message
    formattedContents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config,
    });

    return res.json({ text: response.text || "Извините, не удалось обработать запрос.", provider: "gemini" });

  } catch (error: any) {
    console.error("AI Chat route error:", error);
    res.status(500).json({ error: error.message || "Внутренняя ошибка сервера" });
  }
});

// Setup Vite Dev Server / Static Assets Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
