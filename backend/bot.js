require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const { registerAdminHandlers } = require("./bot-admin");

const token = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;
const WITHDRAW_NOTIFY_CHAT_ID = String(
    process.env.WITHDRAW_NOTIFY_CHAT_ID ||
    process.env.WITHDRAW_CHANNEL_ID ||
    ""
).trim();

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

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function formatReward(value) {
    return Number(Number(value || 0).toFixed(3)).toFixed(3);
}

function formatUsd(value) {
    return Number(Number(value || 0).toFixed(3)).toFixed(3);
}

function getNotifyChatId() {
    return WITHDRAW_NOTIFY_CHAT_ID;
}

async function sendWithdrawNotifyMessage(message) {
    const chatId = getNotifyChatId();

    if (!chatId) {
        console.warn("WITHDRAW_NOTIFY_CHAT_ID missing, skipping withdraw notification");
        return false;
    }

    await bot.sendMessage(chatId, message, {
        parse_mode: "HTML",
        disable_web_page_preview: true
    });

    return true;
}

function buildWithdrawCreatedMessage(withdrawRequest) {
    const id = escapeHtml(withdrawRequest?.id || "-");
    const username = escapeHtml(withdrawRequest?.username || "Gracz");
    const telegramId = escapeHtml(withdrawRequest?.telegramId || "-");
    const tonAddress = escapeHtml(withdrawRequest?.tonAddress || "-");

    const grossRewardAmount = formatReward(
        withdrawRequest?.grossRewardAmount ??
            withdrawRequest?.rewardAmount ??
            withdrawRequest?.amount
    );

    const feeRewardAmount = formatReward(withdrawRequest?.feeRewardAmount || 0);
    const netRewardAmount = formatReward(withdrawRequest?.netRewardAmount || 0);
    const grossUsdAmount = formatUsd(withdrawRequest?.grossUsdAmount || 0);
    const feeUsdAmount = formatUsd(withdrawRequest?.feeUsdAmount || 0);
    const usdAmount = formatUsd(withdrawRequest?.usdAmount || 0);

    return [
        "📤 <b>NOWY WITHDRAW</b>",
        "",
        `<b>ID:</b> <code>${id}</code>`,
        `<b>User:</b> ${username}`,
        `<b>Telegram ID:</b> <code>${telegramId}</code>`,
        `<b>Wallet:</b> <code>${tonAddress}</code>`,
        "",
        `<b>Brutto:</b> ${grossRewardAmount} reward ($${grossUsdAmount})`,
        `<b>Fee:</b> ${feeRewardAmount} reward ($${feeUsdAmount})`,
        `<b>Netto:</b> ${netRewardAmount} reward ($${usdAmount})`,
        "",
        `<b>Status:</b> pending`
    ].join("\n");
}

function buildWithdrawPaidMessage(withdrawRequest) {
    const id = escapeHtml(withdrawRequest?.id || "-");
    const username = escapeHtml(withdrawRequest?.username || "Gracz");
    const telegramId = escapeHtml(withdrawRequest?.telegramId || "-");
    const tonAddress = escapeHtml(withdrawRequest?.tonAddress || "-");
    const payoutTxHash = escapeHtml(withdrawRequest?.payoutTxHash || "-");
    const note = escapeHtml(withdrawRequest?.note || "");

    const grossRewardAmount = formatReward(
        withdrawRequest?.grossRewardAmount ??
            withdrawRequest?.rewardAmount ??
            withdrawRequest?.amount
    );

    const feeRewardAmount = formatReward(withdrawRequest?.feeRewardAmount || 0);
    const netRewardAmount = formatReward(withdrawRequest?.netRewardAmount || 0);
    const grossUsdAmount = formatUsd(withdrawRequest?.grossUsdAmount || 0);
    const feeUsdAmount = formatUsd(withdrawRequest?.feeUsdAmount || 0);
    const usdAmount = formatUsd(withdrawRequest?.usdAmount || 0);

    return [
        "✅ <b>WITHDRAW PAID</b>",
        "",
        `<b>ID:</b> <code>${id}</code>`,
        `<b>User:</b> ${username}`,
        `<b>Telegram ID:</b> <code>${telegramId}</code>`,
        `<b>Wallet:</b> <code>${tonAddress}</code>`,
        "",
        `<b>Brutto:</b> ${grossRewardAmount} reward ($${grossUsdAmount})`,
        `<b>Fee:</b> ${feeRewardAmount} reward ($${feeUsdAmount})`,
        `<b>Netto:</b> ${netRewardAmount} reward ($${usdAmount})`,
        `<b>TX Hash:</b> <code>${payoutTxHash}</code>`,
        note ? `<b>Note:</b> ${note}` : "",
        "",
        `<b>Status:</b> paid`
    ].filter(Boolean).join("\n");
}

function buildWithdrawRejectedMessage(withdrawRequest) {
    const id = escapeHtml(withdrawRequest?.id || "-");
    const username = escapeHtml(withdrawRequest?.username || "Gracz");
    const telegramId = escapeHtml(withdrawRequest?.telegramId || "-");
    const tonAddress = escapeHtml(withdrawRequest?.tonAddress || "-");
    const note = escapeHtml(withdrawRequest?.note || "");

    const grossRewardAmount = formatReward(
        withdrawRequest?.grossRewardAmount ??
            withdrawRequest?.rewardAmount ??
            withdrawRequest?.amount
    );

    const feeRewardAmount = formatReward(withdrawRequest?.feeRewardAmount || 0);
    const netRewardAmount = formatReward(withdrawRequest?.netRewardAmount || 0);
    const grossUsdAmount = formatUsd(withdrawRequest?.grossUsdAmount || 0);
    const feeUsdAmount = formatUsd(withdrawRequest?.feeUsdAmount || 0);
    const usdAmount = formatUsd(withdrawRequest?.usdAmount || 0);

    return [
        "❌ <b>WITHDRAW REJECTED</b>",
        "",
        `<b>ID:</b> <code>${id}</code>`,
        `<b>User:</b> ${username}`,
        `<b>Telegram ID:</b> <code>${telegramId}</code>`,
        `<b>Wallet:</b> <code>${tonAddress}</code>`,
        "",
        `<b>Brutto:</b> ${grossRewardAmount} reward ($${grossUsdAmount})`,
        `<b>Fee:</b> ${feeRewardAmount} reward ($${feeUsdAmount})`,
        `<b>Netto:</b> ${netRewardAmount} reward ($${usdAmount})`,
        note ? `<b>Note:</b> ${note}` : "",
        "",
        `<b>Status:</b> rejected`
    ].filter(Boolean).join("\n");
}

async function notifyNewWithdraw(withdrawRequest) {
    return sendWithdrawNotifyMessage(
        buildWithdrawCreatedMessage(withdrawRequest)
    );
}

async function notifyWithdrawPaid(withdrawRequest) {
    return sendWithdrawNotifyMessage(
        buildWithdrawPaidMessage(withdrawRequest)
    );
}

async function notifyWithdrawRejected(withdrawRequest) {
    return sendWithdrawNotifyMessage(
        buildWithdrawRejectedMessage(withdrawRequest)
    );
}

function buildWebAppUrlFromStartMessage(msg) {
    const rawText = String(msg?.text || "").trim();
    const startParam = rawText.split(/\s+/)[1] || "";
    const safeStartParam = encodeURIComponent(String(startParam || "").trim());

    if (!safeStartParam) {
        return String(WEBAPP_URL);
    }

    const separator = String(WEBAPP_URL).includes("?") ? "&" : "?";
    return `${WEBAPP_URL}${separator}start=${safeStartParam}`;
}

// =======================
// START
// =======================

bot.onText(/\/start(?:\s+(.+))?/, async (msg) => {
    const url = buildWebAppUrlFromStartMessage(msg);

    const caption = `🦁 *Welcome to Crypto Zoo*

Create your own zoo, discover new expeditions, and earn rewards directly in Telegram.

🎯 Upgrade your animals
🌍 Send expeditions
💎 Collect rewards
🏆 Progress, unlock, and grow

👇 Tap below and begin your journey`;

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

bot.onText(/\/withdrawnotify/, async (msg) => {
    try {
        await bot.sendMessage(
            msg.chat.id,
            `WITHDRAW_NOTIFY_CHAT_ID = ${getNotifyChatId() || "(missing)"}`
        );
    } catch (error) {
        console.error("/withdrawnotify error:", error);
    }
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
            "",
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
                "✅ Payment received! +500 gems (TEST)"
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
    bot,
    notifyNewWithdraw,
    notifyWithdrawPaid,
    notifyWithdrawRejected
};