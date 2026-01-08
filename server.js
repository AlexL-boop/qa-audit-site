import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Node 18+ (и у тебя Node 22/25) имеет global fetch — node-fetch не нужен
// Если хочешь оставить node-fetch — можно, но тогда убедись что он установлен и ESM-версия подходит.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Если server.js лежит в /server, то фронт обычно лежит уровнем выше.
// Если server.js лежит в корне — ROOT будет = корню.
const ROOT_CANDIDATE_1 = __dirname;
const ROOT_CANDIDATE_2 = path.resolve(__dirname, "..");
const ROOT = fs.existsSync(path.join(ROOT_CANDIDATE_1, "index.html"))
  ? ROOT_CANDIDATE_1
  : ROOT_CANDIDATE_2;

const app = express();
app.use(express.json());

// ===== Telegram bot config (НЕ хардкодим токен) =====
const BOT_TOKEN = process.env.BOT_TOKEN || ""; // задавай в Render Environment
const BOT_USERNAME = process.env.BOT_USERNAME || "QaAuditBot"; // без @

// in-memory map: перезапуск сервера сбросит связки
const keyToChat = new Map();

function apiUrl(method) {
  return `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
}

async function tgSendMessage(chat_id, text) {
  if (!BOT_TOKEN) {
    console.warn("BOT_TOKEN is not set — skip tgSendMessage");
    return;
  }

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

// ===== Static site =====
app.use(express.static(ROOT));

app.get("/", (_req, res) => {
  const indexPath = path.join(ROOT, "index.html");
  if (!fs.existsSync(indexPath)) {
    return res.status(404).send("index.html not found");
  }
  res.sendFile(indexPath);
});

// ===== Health =====
app.get("/health", (_req, res) => res.json({ ok: true }));

// ===== Telegram webhook receiver =====
app.post("/telegram/webhook", async (req, res) => {
  // Telegram присылает разные типы апдейтов; здесь берём message.text
  const msg = req.body?.message?.text || "";
  const chatId = req.body?.message?.chat?.id;

  try {
    if (!BOT_TOKEN) {
      // webhook можно принимать, но отвечать не сможем
      return res.json({ ok: true, bot: "disabled" });
    }

    if (chatId && typeof msg === "string" && msg.startsWith("/start")) {
      const parts = msg.trim().split(/\s+/);
      const clientKey = parts[1];

      if (clientKey) {
        keyToChat.set(clientKey, chatId);
        await tgSendMessage(
          chatId,
          "Ок! Теперь я могу присылать отчёты. Вернись на сайт и нажми «Заказать» ещё раз."
        );
      } else {
        await tgSendMessage(
          chatId,
          "Нужен ключ. Открой ссылку с сайта (кнопка «Открыть бота»)."
        );
      }
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("webhook error:", e);
    return res.json({ ok: true }); // Telegram не любит 500; лучше отвечать ok
  }
});

// ===== Report sender =====
app.post("/api/send_report", async (req, res) => {
  const { clientKey, telegram, chunks } = req.body || {};

  if (!clientKey || !Array.isArray(chunks) || chunks.length === 0) {
    return res.status(400).json({ ok: false, error: "bad_request" });
  }

  if (!BOT_TOKEN) {
    return res.status(200).json({ ok: false, botDisabled: true, botUsername: BOT_USERNAME });
  }

  const chatId = keyToChat.get(clientKey);
  if (!chatId) {
    return res.status(200).json({ ok: false, needStart: true, botUsername: BOT_USERNAME });
  }

  await tgSendMessage(chatId, `📄 Отчёт QA Audit для ${telegram || "клиента"}:`);

  for (const c of chunks) {
    // защита от нестроковых чанков
    await tgSendMessage(chatId, typeof c === "string" ? c : JSON.stringify(c));
  }

  return res.json({ ok: true });
});

// ===== Start server (ТОЛЬКО ОДИН listen) =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server listening on", PORT));
