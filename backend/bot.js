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
        "https://i.imgur.com/5QZ7qQy.png",
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
// STARS TEST PAYMENT
// =======================

bot.onText(/\/stars/, async (msg) => {
    try {
        await bot.sendInvoice(
            msg.chat.id,
            "CryptoZoo Stars Pack",
            "Test purchase for Telegram Stars",
            "stars_test_pack_1",
            "", // providerToken - pusty dla Stars w tej bibliotece
            "XTR",
            [
                { label: "Stars Pack", amount: 50 }
            ]
        );
    } catch (error) {
        console.error("sendInvoice error:", error);
        await bot.sendMessage(
            msg.chat.id,
            `❌ Could not create Telegram Stars payment.\n${error.message || "Unknown error"}`
        );
    }
});

// =======================
// PRE CHECKOUT
// =======================

bot.on("pre_checkout_query", async (query) => {
    try {
        if (query.invoice_payload !== "stars_test_pack_1") {
            await bot.answerPreCheckoutQuery(query.id, false, {
                error_message: "Invalid payment payload."
            });
            return;
        }

        await bot.answerPreCheckoutQuery(query.id, true);
    } catch (error) {
        console.error("pre_checkout_query error:", error);

        try {
            await bot.answerPreCheckoutQuery(query.id, false, {
                error_message: "Payment validation failed."
            });
        } catch (innerError) {
            console.error("answerPreCheckoutQuery fallback error:", innerError);
        }
    }
});

// =======================
// SUCCESSFUL PAYMENT
// =======================

bot.on("message", async (msg) => {
    try {
        if (!msg.successful_payment) return;

        const payment = msg.successful_payment;

        console.log("✅ Successful payment received:", {
            telegramId: msg.from?.id,
            payload: payment.invoice_payload,
            currency: payment.currency,
            totalAmount: payment.total_amount,
            telegramPaymentChargeId: payment.telegram_payment_charge_id
        });

        if (
            payment.invoice_payload === "stars_test_pack_1" &&
            payment.currency === "XTR" &&
            payment.total_amount === 50
        ) {
            await bot.sendMessage(
                msg.chat.id,
                "✅ Payment received! Test Stars pack was purchased successfully."
            );
        } else {
            await bot.sendMessage(
                msg.chat.id,
                "⚠️ Payment received, but payload or amount did not match the test pack."
            );
        }
    } catch (error) {
        console.error("successful_payment handler error:", error);
    }
});

// =======================
// ADMIN
// =======================

registerAdminHandlers(bot);

module.exports = {
    bot
};