require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;
const WEBAPP_URL = String(process.env.WEBAPP_URL || "").replace(/\/+$/, "");

if (!token) {
    console.error("BOT_TOKEN missing");
    process.exit(1);
}

if (!WEBAPP_URL) {
    console.error("WEBAPP_URL missing");
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

console.log("🤖 Bot uruchomiony");
console.log("🌐 WEBAPP_URL:", WEBAPP_URL);

bot.onText(/\/start(?:\s+.*)?/, async (msg) => {
    try {
        const chatId = msg.chat.id;

        const telegramUser = {
            id: String(msg.from?.id || ""),
            username: String(msg.from?.username || ""),
            first_name: String(msg.from?.first_name || "Gracz")
        };

        const url =
            `${WEBAPP_URL}?tgId=${encodeURIComponent(telegramUser.id)}` +
            `&username=${encodeURIComponent(telegramUser.username)}` +
            `&first_name=${encodeURIComponent(telegramUser.first_name)}`;

        const welcomeText =
            `🐾 *Witaj w Crypto Zoo!*\n\n` +
            `Buduj swoje zoo, zbieraj monety, rozwijaj zwierzęta i zdobywaj reward.\n\n` +
            `Kliknij przycisk poniżej i otwórz grę w Telegram WebApp.`;

        await bot.sendMessage(chatId, welcomeText, {
            parse_mode: "Markdown",
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
    const body = error?.response?.body || {};
    console.error("POLLING ERROR:", {
        ok: body.ok,
        error_code: body.error_code,
        description: body.description || error.message || error
    });
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

module.exports = bot;