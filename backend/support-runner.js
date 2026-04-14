require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const { registerSupportHandlers } = require("./bot-support");

const token = process.env.SUPPORT_BOT_TOKEN;

if (!token) {
  console.error("SUPPORT_BOT_TOKEN missing");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

registerSupportHandlers(bot);

console.log("Support bot started");
