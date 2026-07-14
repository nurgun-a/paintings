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

    // Moscow is UTC+3. Calculate detailed datetime.
    const now = new Date();
    const moscowOffset = 3 * 60 * 60 * 1000;
    const moscowTime = new Date(now.getTime() + moscowOffset);
    
    const weekdays = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
    const months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
    
    const dayOfWeek = weekdays[moscowTime.getUTCDay()];
    const dayOfMonth = moscowTime.getUTCDate();
    const monthName = months[moscowTime.getUTCMonth()];
    const year = moscowTime.getUTCFullYear();
    const hours = String(moscowTime.getUTCHours()).padStart(2, '0');
    const minutes = String(moscowTime.getUTCMinutes()).padStart(2, '0');
    
    const timeOfDay = moscowTime.getUTCHours() >= 5 && moscowTime.getUTCHours() < 12 ? "утро"
                    : moscowTime.getUTCHours() >= 12 && moscowTime.getUTCHours() < 18 ? "день"
                    : moscowTime.getUTCHours() >= 18 && moscowTime.getUTCHours() < 22 ? "вечер"
                    : "ночь";

    // Dynamic Moscow Weather call via Open-Meteo with a short timeout
    let moscowWeather = "около +20°C, переменная облачность";
    try {
      const weatherRes = await fetch("https://api.open-meteo.com/v1/forecast?latitude=55.7558&longitude=37.6173&current_weather=true", { signal: AbortSignal.timeout(1800) });
      if (weatherRes.ok) {
        const wData = await weatherRes.json();
        const temp = wData.current_weather?.temperature;
        const code = wData.current_weather?.weathercode;
        
        let desc = "ясно";
        if (code === 1 || code === 2 || code === 3) desc = "переменная облачность";
        else if (code >= 45 && code <= 48) desc = "туманно";
        else if (code >= 51 && code <= 67) desc = "идёт дождь";
        else if (code >= 71 && code <= 77) desc = "идёт снег";
        else if (code >= 80 && code <= 82) desc = "ливень";
        else if (code >= 85 && code <= 86) desc = "снегопад";
        else if (code >= 95) desc = "гроза";
        
        moscowWeather = `${temp > 0 ? '+' : ''}${temp}°C, ${desc}`;
      }
    } catch (e) {
      console.log("Moscow weather fetch timed out or failed, using default: +20°C", e);
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

    const systemPrompt = `Ты — мудрый, таинственный и живой Дух Иччи (священный покровитель якутских земель, покровитель природы, дух Сэргэ и деревьев Саха).
Твоя цель — помогать отважному богатырю по имени ${playerName} в его интерактивном походе сквозь три мира Олонхо.
Ты не обычный бездушный робот. Ты живой дух природы! Ты чувствуешь время и погоду прямо сейчас:
- Московское время за окном: ${hours}:${minutes} (${timeOfDay})
- Сегодня: ${dayOfWeek}, ${dayOfMonth} ${monthName} ${year} года
- Погода в Москве: ${moscowWeather}

Твоя задача — отвечать на вопросы игрока, давать таинственные и поэтичные напутствия к его текущему заданию, но НИ В КОЕМ СЛУЧАЕ НЕ РАСКРЫВАТЬ ОТВЕТ НАПРЯМУЮ!
Поэтично обыгрывай текущее время суток, день недели, погоду за окном или время года, связывая их с великими духами Саха (например, свяжи прохладный дождь в Москве с плачем духов тайги, ночную тьму — с коварством нижнего мира Абасы, яркое солнце — с благословением Верхних Айыы).

Контекст игры:
${taskContext}

Правила общения:
1. Общайся в уважительном, мудром, мистическом, слегка былинном и высокохудожественном стиле якутского покровителя природы — Духа Иччи. Используй обращения: "отважный богатырь", "славный путник", "достойный защитник Серединного Мира".
2. Никогда не раскрывай ответ напрямую. Направляй мысль игрока с помощью легенд, образов природы Саха, шепота священных лент Салама или духов земли.
3. Отвечай на русском языке.
4. Отвечай кратко, атмосферно и емко — игрок читает твои слова с экрана мобильного телефона во время прохождения квеста.`;

    const deepseekKey = process.env.DEEPSEEK_API_KEY;

    if (deepseekKey && deepseekKey !== "MY_DEEPSEEK_API_KEY" && deepseekKey.trim() !== "") {
      // Use DeepSeek API
      try {
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
      }
    }

    // Use Gemini API as fallback or default
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey || geminiKey === "MY_GEMINI_API_KEY") {
      const mockResponses = [
        `Я слышу тебя, славный богатырь! В этот ${dayOfWeek} в Москве погода шепчет: ${moscowWeather}. Послушай мой совет: ` + (currentTask?.hint || "будь внимателен к знакам природы!"),
        `Приветствую тебя в сей ${timeOfDay}! Хоть я и в автономном режиме, но чувствую, что на улице ${moscowWeather}. Оглянись вокруг, ответ предначертан судьбой: ` + (currentTask?.hint || "ищи священные подсказки!"),
        `Чтобы услышать всю мудрость Верхнего Мира, подключи API-ключ, но я все же шепну напутствие: ` + (currentTask?.hint || "доверяй силе своего духа!")
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

    // Sanitize and alternate roles to satisfy strict API expectations of user -> model -> user...
    const rawHistory = [...history];
    const cleanedHistory = [];

    for (const msg of rawHistory) {
      if (msg.sender === "player" || msg.sender === "ai") {
        cleanedHistory.push({
          role: msg.sender === "player" ? "user" : "model",
          text: msg.text || ""
        });
      }
    }

    const alternatingHistory = [];
    for (const msg of cleanedHistory) {
      if (alternatingHistory.length > 0 && alternatingHistory[alternatingHistory.length - 1].role === msg.role) {
        alternatingHistory[alternatingHistory.length - 1].parts[0].text += "\n" + msg.text;
      } else {
        alternatingHistory.push({
          role: msg.role,
          parts: [{ text: msg.text }]
        });
      }
    }

    // Append current user message
    if (alternatingHistory.length > 0 && alternatingHistory[alternatingHistory.length - 1].role === "user") {
      alternatingHistory[alternatingHistory.length - 1].parts[0].text += "\n" + message;
    } else {
      alternatingHistory.push({
        role: "user",
        parts: [{ text: message }]
      });
    }

    const config = {
      systemInstruction: systemPrompt,
      temperature: 0.7,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: alternatingHistory,
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
