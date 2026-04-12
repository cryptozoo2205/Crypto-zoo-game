require("dotenv").config();

function registerSupportHandlers(bot) {
    const ADMIN_CHAT_ID = String(process.env.ADMIN_CHAT_ID || "").trim();

    if (!ADMIN_CHAT_ID) {
        console.warn("ADMIN_CHAT_ID not set in .env");
    }

    bot.onText(/\/start/, async (msg) => {
        try {
            await bot.sendMessage(
                msg.chat.id,
                "Witaj w Crypto Zoo Support!\n\nOpisz swój problem, a support odpowie najszybciej jak się da."
            );
        } catch (error) {
            console.error("support /start error:", error?.message || error);
        }
    });

    bot.on("message", async (msg) => {
        try {
            if (!msg || !msg.text) return;

            const text = String(msg.text || "").trim();
            if (!text) return;
            if (text.startsWith("/")) return;

            const userId = String(msg.from?.id || msg.chat?.id || "").trim();
            const username = msg.from?.username ? `@${msg.from.username}` : "brak";
            const firstName = String(msg.from?.first_name || "Użytkownik").trim();

            if (!userId) return;

            await bot.sendMessage(
                msg.chat.id,
                "✅ Twoja wiadomość została wysłana do supportu."
            );

            if (ADMIN_CHAT_ID) {
                await bot.sendMessage(
                    ADMIN_CHAT_ID,
                    `SUPPORT\n\nID: ${userId}\nUsername: ${username}\nImię: ${firstName}\n\nWiadomość:\n${text}`
                );
            }
        } catch (error) {
            console.error("support message error:", error?.message || error);

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
                    "Użycie:\n/reply USER_ID treść wiadomości"
                );
                return;
            }

            const targetUserId = raw.slice(0, firstSpaceIndex).trim();
            const replyText = raw.slice(firstSpaceIndex + 1).trim();

            if (!targetUserId || !replyText) {
                await bot.sendMessage(
                    msg.chat.id,
                    "Użycie:\n/reply USER_ID treść wiadomości"
                );
                return;
            }

            await bot.sendMessage(
                targetUserId,
                `📩 Odpowiedź supportu Crypto Zoo:\n\n${replyText}`
            );

            await bot.sendMessage(
                msg.chat.id,
                `✅ Odpowiedź wysłana do ${targetUserId}`
            );
        } catch (error) {
            console.error("support /reply error:", error?.message || error);

            try {
                await bot.sendMessage(
                    msg.chat.id,
                    "❌ Nie udało się wysłać odpowiedzi."
                );
            } catch (_) {}
        }
    });
}

module.exports = {
    registerSupportHandlers
};