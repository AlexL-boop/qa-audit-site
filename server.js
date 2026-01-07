import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_USERNAME = process.env.BOT_USERNAME; // без @

if (!BOT_TOKEN) {
  console.error("ERROR: BOT_TOKEN is not set");
  process.exit(1);
}

const keyToChat = new Map();

function apiUrl(method) {
  return `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
}

async function tgSendMessage(chat_id, text) {
  const r = await fetch(apiUrl("sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id, text }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.ok) {
    console.error("sendMessage failed:", j);
  }
}

app.get("/health", (_req, res) => res.json({ ok: true }));

// Telegram webhook receiver
app.post("/telegram/webhook", async (req, res) => {
  const msg = req.body?.message?.text || "";
  const chatId = req.body?.message?.chat?.id;

  if (chatId && typeof msg === "string" && msg.startsWith("/start")) {
    const parts = msg.trim().split(/\s+/);
    const clientKey = parts[1];

    if (clientKey) {
      keyToChat.set(clientKey, chatId);
      await tgSendMessage(chatId, "Ок! Теперь я могу присылать отчёты. Вернись на сайт и нажми «Заказать» ещё раз.");
    } else {
      await tgSendMessage(chatId, "Нужен ключ. Открой ссылку с сайта (кнопка «Открыть бота»).");
    }
  }

  res.json({ ok: true });
});

// Report sender
app.post("/api/send_report", async (req, res) => {
  const { clientKey, telegram, chunks } = req.body || {};

  if (!clientKey || !Array.isArray(chunks) || chunks.length === 0) {
    return res.status(400).json({ ok: false, error: "bad_request" });
  }

  const chatId = keyToChat.get(clientKey);
  if (!chatId) {
    return res.status(200).json({ ok: false, needStart: true, botUsername: BOT_USERNAME });
  }

  await tgSendMessage(chatId, `📄 Отчёт QA Audit для ${telegram || "клиента"}:`);

  for (const c of chunks) {
    await tgSendMessage(chatId, c);
  }

  return res.json({ ok: true });
});

app.listen(3000, () => console.log("Server on :3000"));
