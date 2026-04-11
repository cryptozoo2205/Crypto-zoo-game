require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const { registerSupportHandlers } = require("./bot-support");

const token = String(process.env.SUPPORT_BOT_TOKEN || "").trim();

if (!token) {
    console.error("❌ SUPPORT_BOT_TOKEN missing in .env");
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

console.log("🤖 Crypto Zoo Support bot started");

registerSupportHandlers(bot);

bot.on("polling_error", (error) => {
    console.error("Support bot polling error:", error?.message || error);
});

bot.on("webhook_error", (error) => {
    console.error("Support bot webhook error:", error?.message || error);
});