require('dotenv').config();
function registerSupportHandlers(bot) {
    const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

    if (!ADMIN_CHAT_ID) {
        console.warn("⚠️ ADMIN_CHAT_ID not set in .env");
    }

    // Start - wiadomość powitalna
    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(
            msg.chat.id,
            "👋 Witaj w Crypto Zoo Support!\n\n" +
            "Opisz swój problem, a odpowiemy jak najszybciej."
        );
    });

    // Każda wiadomość od gracza
    bot.on("message", async (msg) => {
        if (!msg.text) return;
        if (msg.text.startsWith("/")) return;

        const userId = msg.from.id;
        const username = msg.from.username || "brak";
        const text = msg.text;

        // Wyślij do admina
        if (ADMIN_CHAT_ID) {
            await bot.sendMessage(
                ADMIN_CHAT_ID,
                `📩 SUPPORT\n\n` +
                `👤 ID: ${userId}\n` +
                `📛 Username: @${username}\n\n` +
                `💬 Wiadomość:\n${text}\n\n` +
                `✏️ Odpowiedz:\n/reply ${userId} Twoja odpowiedź`
            );
        }

        // Info dla gracza
        bot.sendMessage(
            msg.chat.id,
            "✅ Twoja wiadomość została wysłana do supportu."
        );
    });

    // Komenda do odpisywania
    bot.onText(/\/reply (.+)/, async (msg, match) => {
        const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

        if (msg.chat.id.toString() !== ADMIN_CHAT_ID) {
            return bot.sendMessage(msg.chat.id, "❌ Brak dostępu.");
        }

        const args = match[1].split(" ");
        const userId = args.shift();
        const replyText = args.join(" ");

        if (!userId || !replyText) {
            return bot.sendMessage(
                msg.chat.id,
                "❌ Użycie: /reply userId wiadomość"
            );
        }

        try {
            await bot.sendMessage(
                userId,
                `💬 Odpowiedź supportu:\n\n${replyText}`
            );

            bot.sendMessage(msg.chat.id, "✅ Wysłano odpowiedź.");
        } catch (err) {
            bot.sendMessage(msg.chat.id, "❌ Nie udało się wysłać.");
        }
    });
}

module.exports = { registerSupportHandlers };