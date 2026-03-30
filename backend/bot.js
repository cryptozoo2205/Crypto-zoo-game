require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const { registerAdminHandlers } = require("./bot-admin");

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

// =======================
// START
// =======================

bot.onText(/\/start/, async (msg) => {
    const url = `${WEBAPP_URL}`;

    await bot.sendMessage(msg.chat.id, "🎮 Crypto Zoo", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "Zagraj", web_app: { url } }]
            ]
        }
    });
});

// =======================
// DEBUG
// =======================

bot.onText(/\/ping/, (msg) => {
    bot.sendMessage(msg.chat.id, `pong\nchat.id: ${msg.chat.id}`);
});

// =======================
// ADMIN
// =======================

registerAdminHandlers(bot);

module.exports = {
    bot
};