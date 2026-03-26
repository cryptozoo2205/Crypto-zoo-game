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

const bot = new TelegramBot(token, { polling: false });

async function startBot() {
    try {
        await bot.deleteWebHook();
        await bot.startPolling();

        console.log("🤖 Bot started");
        console.log("🌐 WEBAPP_URL:", WEBAPP_URL);
    } catch (error) {
        console.error("BOT START ERROR:", error);
    }
}

bot.onText(/\/start/, async (msg) => {
    try {
        const chatId = msg.chat.id;

        const telegramUser = {
            id: msg.from.id,
            username: msg.from.username || "",
            first_name: msg.from.first_name || "Gracz"
        };

        const url = `${WEBAPP_URL}?tgId=${telegramUser.id}&username=${encodeURIComponent(telegramUser.username)}`;

        await bot.sendMessage(chatId, `TEST LINK:\n${url}`);

        await bot.sendMessage(chatId, "🐾 Witaj w Crypto Zoo!", {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "🎮 Zagraj w Crypto Zoo",
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

process.on("SIGINT", async () => {
    try {
        await bot.stopPolling();
    } catch (error) {
        console.error("SIGINT stopPolling error:", error);
    }
    process.exit(0);
});

process.on("SIGTERM", async () => {
    try {
        await bot.stopPolling();
    } catch (error) {
        console.error("SIGTERM stopPolling error:", error);
    }
    process.exit(0);
});

startBot();

module.exports = bot;