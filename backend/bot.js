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

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    const telegramUser = {
        id: msg.from.id,
        username: msg.from.username || "",
        first_name: msg.from.first_name || "Gracz"
    };

    const url = `${WEBAPP_URL}?tgId=${telegramUser.id}&username=${encodeURIComponent(telegramUser.username)}`;

    bot.sendMessage(chatId, `TEST LINK:\n${url}`);

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