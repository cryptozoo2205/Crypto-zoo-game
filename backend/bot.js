require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;

if (!token) {
    console.error("BOT_TOKEN missing");
    process.exit(1);
}

if (!WEBAPP_URL) {
    console.error("WEBAPP_URL missing");
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

console.log("🤖 Bot started");
console.log("🌐 WEBAPP_URL:", WEBAPP_URL);

function buildTelegramUser(from) {
    return {
        id: String(from?.id || ""),
        username: String(from?.username || ""),
        first_name: String(from?.first_name || "Gracz")
    };
}

function buildWebAppUrl(telegramUser, refCode = "") {
    const url = new URL(WEBAPP_URL);

    url.searchParams.set("tgId", telegramUser.id);
    url.searchParams.set("username", telegramUser.username);
    url.searchParams.set("first_name", telegramUser.first_name);

    if (refCode) {
        url.searchParams.set("ref", refCode);
    }

    return url.toString();
}

function extractStartParam(text) {
    const safeText = String(text || "").trim();
    const match = safeText.match(/^\/start(?:@\w+)?(?:\s+(.+))?$/i);

    if (!match) return "";
    return String(match[1] || "").trim();
}

function normalizeRefCode(rawValue) {
    const safe = String(rawValue || "").trim();

    if (!safe) return "";
    if (!safe.startsWith("ref_")) return "";

    const code = safe.slice(4).trim();

    if (!/^[a-zA-Z0-9_]{3,64}$/.test(code)) {
        return "";
    }

    return code;
}

bot.onText(/\/start(?:@\w+)?(?:\s+(.+))?/, async (msg) => {
    try {
        const chatId = msg.chat.id;
        const telegramUser = buildTelegramUser(msg.from);
        const startParam = extractStartParam(msg.text);
        const refCode = normalizeRefCode(startParam);
        const url = buildWebAppUrl(telegramUser, refCode);

        await bot.sendMessage(
            chatId,
            `🐾 Witaj w Crypto Zoo!

Buduj swoje zoo, zbieraj monety i zdobywaj nagrody!

Kliknij poniżej aby rozpocząć 👇`
        );

        await bot.sendMessage(chatId, "🎮 Zagraj w Crypto Zoo", {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "🎮 Zagraj",
                            web_app: { url }
                        }
                    ]
                ]
            }
        });
    } catch (error) {
        console.error("START COMMAND ERROR:", error);
    }
});

bot.on("polling_error", (error) => {
    console.error("POLLING ERROR:", error?.response?.body || error.message || error);
});

module.exports = bot;