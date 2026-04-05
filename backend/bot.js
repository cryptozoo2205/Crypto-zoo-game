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

    const caption = `🦁 *Crypto Zoo*

Build your own zoo, go on expeditions and earn rewards directly in Telegram.

🎯 Tap & upgrade animals  
🌍 Send expeditions  
💎 Collect rewards  

👇 Start your adventure`;

    await bot.sendPhoto(
        msg.chat.id,
        "https://i.imgur.com/5QZ7qQy.png", // ✅ Twój obraz (direct link)
        {
            caption,
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🎮 Play now", web_app: { url } }]
                ]
            }
        }
    );
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