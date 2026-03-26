require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;

if (!token) {
    console.error("❌ BOT_TOKEN missing");
    process.exit(1);
}

if (!WEBAPP_URL) {
    console.error("❌ WEBAPP_URL missing");
    process.exit(1);
}

console.log("🤖 Starting Telegram Bot...");
console.log("🌐 WEBAPP_URL:", WEBAPP_URL);

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    const telegramUser = {
        id: msg.from.id,
        username: msg.from.username || "",
        first_name: msg.from.first_name || "Gracz"
    };

    const url = `${WEBAPP_URL}?tgId=${telegramUser.id}&username=${telegramUser.username}`;

    console.log("👤 User started bot:", telegramUser);

    bot.sendMessage(chatId, "🐾 Witaj w Crypto Zoo!", {
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
});

// 🔥 żeby Render nie ubijał procesu
process.on("SIGINT", () => {
    console.log("Bot stopped");
    bot.stopPolling();
    process.exit(0);
});

process.on("SIGTERM", () => {
    console.log("Bot terminated");
    bot.stopPolling();
    process.exit(0);
});