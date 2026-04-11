require('dotenv').config();
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.SUPPORT_BOT_TOKEN;

if (!token) {
    console.error("❌ SUPPORT_BOT_TOKEN missing in .env");
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

console.log("🤖 Support bot started");

// START
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(
        msg.chat.id,
        "👋 Witaj w Crypto Zoo Support!\n\nOpisz swój problem."
    );
});

// 👇 WAŻNE — używamy "text" zamiast "message"
bot.on("text", async (msg) => {
    if (msg.text.startsWith("/")) return;

    const userId = msg.from.id;
    const username = msg.from.username || "brak";
    const text = msg.text;

    try {
        // do admina
        if (ADMIN_CHAT_ID) {
            await bot.sendMessage(
                ADMIN_CHAT_ID,
                `📩 SUPPORT\n\n` +
                `👤 ID: ${userId}\n` +
                `📛 Username: @${username}\n\n` +
                `💬 ${text}\n\n` +
                `/reply ${userId} ...`
            );
        }

        // do gracza
        await bot.sendMessage(
            msg.chat.id,
            "✅ Wysłano do supportu"
        );

    } catch (err) {
        console.error(err);
    }
});

// REPLY
bot.onText(/\/reply (.+)/, async (msg, match) => {
    if (msg.chat.id.toString() !== ADMIN_CHAT_ID) {
        return bot.sendMessage(msg.chat.id, "❌ Brak dostępu.");
    }

    const args = match[1].split(" ");
    const userId = args.shift();
    const replyText = args.join(" ");

    if (!userId || !replyText) {
        return bot.sendMessage(msg.chat.id, "❌ /reply userId tekst");
    }

    try {
        await bot.sendMessage(
            userId,
            `💬 Support:\n\n${replyText}`
        );

        bot.sendMessage(msg.chat.id, "✅ Wysłano");
    } catch (err) {
        bot.sendMessage(msg.chat.id, "❌ Błąd");
    }
});