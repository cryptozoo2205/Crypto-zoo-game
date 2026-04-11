require("dotenv").config();

function registerSupportHandlers(bot) {
    const ADMIN_CHAT_ID = String(process.env.ADMIN_CHAT_ID || "").trim();

    if (!ADMIN_CHAT_ID) {
        console.warn("⚠️ ADMIN_CHAT_ID not set in .env");
    }

    bot.onText(/\/start/, async (msg) => {
        try {
            await bot.sendMessage(
                msg.chat.id,
                "👋 Witaj w Crypto Zoo Support!\n\nOpisz swój problem, a odpowiemy jak najszybciej."
            );
        } catch (error) {
            console.error("support /start error:", error);
        }
    });

    bot.on("message", async (msg) => {
        try {
            if (!msg || !msg.text) return;
            if (msg.text.startsWith("/")) return;

            const userId = String(msg.from?.id || msg.chat?.id || "");
            const username = msg.from?.username ? `@${msg.from.username}` : "brak";
            const firstName = msg.from?.first_name || "Użytkownik";
            const text = String(msg.text || "").trim();

            if (!userId || !text) return;

            if (ADMIN_CHAT_ID) {
                await bot.sendMessage(
                    ADMIN_CHAT_ID,
                    `📩 SUPPORT\n\n👤 ID: ${userId}\n📛 Username: ${username}\n🧾 Imię: ${firstName}\n\n💬 Wiadomość:\n${text}\n\n✏️ Odpowiedz:\n/reply ${userId} Twoja odpowiedź`
                );
            }

            await bot.sendMessage(
                msg.chat.id,
                "✅ Twoja wiadomość została wysłana do supportu."
            );
        } catch (error) {
            console.error("support message error:", error);

            try {
                await bot.sendMessage(
                    msg.chat.id,
                    "❌ Nie udało się wysłać wiadomości do supportu."
                );
            } catch (_) {}
        }
    });

    bot.onText(/\/reply (.+)/, async (msg, match) => {
        try {
            if (String(msg.chat.id) !== ADMIN_CHAT_ID) {
                await bot.sendMessage(msg.chat.id, "❌ Brak dostępu.");
                return;
            }

            const raw = String(match?.[1] || "").trim();
            const firstSpaceIndex = raw.indexOf(" ");

            if (firstSpaceIndex === -1) {
                await bot.sendMessage(
                    msg.chat.id,
                    "❌ Użycie: /reply userId wiadomość"
                );
                return;
            }

            const userId = raw.slice(0, firstSpaceIndex).trim();
            const replyText = raw.slice(firstSpaceIndex + 1).trim();

            if (!userId || !replyText) {
                await bot.sendMessage(
                    msg.chat.id,
                    "❌ Użycie: /reply userId wiadomość"
                );
                return;
            }

            await bot.sendMessage(
                userId,
                `💬 Odpowiedź supportu:\n\n${replyText}`
            );

            await bot.sendMessage(msg.chat.id, "✅ Wysłano odpowiedź.");
        } catch (error) {
            console.error("support reply error:", error);
            await bot.sendMessage(msg.chat.id, "❌ Nie udało się wysłać.");
        }
    });
}

module.exports = { registerSupportHandlers };