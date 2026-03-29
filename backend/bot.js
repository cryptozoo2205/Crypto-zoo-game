require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const { readDb } = require("./db/db");

const token = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;
const ADMIN_CHAT_ID = String(process.env.ADMIN_CHAT_ID || "").trim();

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
console.log("🌐 WEBAPP_URL:", WEBAPP_URL);
console.log("👮 ADMIN_CHAT_ID:", ADMIN_CHAT_ID || "not set");

function buildTelegramUser(from) {
    return {
        id: String(from?.id || ""),
        username: String(from?.username || ""),
        first_name: String(from?.first_name || "Gracz")
    };
}

function buildWebAppUrl(telegramUser, refCode = "") {
    const url = new URL(WEBAPP_URL);

    url.searchParams.set("tgId", telegramUser.id);
    url.searchParams.set("username", telegramUser.username);
    url.searchParams.set("first_name", telegramUser.first_name);

    if (refCode) {
        url.searchParams.set("ref", refCode);
    }

    return url.toString();
}

function extractStartParam(text) {
    const safeText = String(text || "").trim();
    const match = safeText.match(/^\/start(?:@\w+)?(?:\s+(.+))?$/i);

    if (!match) return "";
    return String(match[1] || "").trim();
}

function normalizeRefCode(rawValue) {
    const safe = String(rawValue || "").trim();

    if (!safe) return "";
    if (!safe.startsWith("ref_")) return "";

    const code = safe.slice(4).trim();

    if (!/^[a-zA-Z0-9_]{3,64}$/.test(code)) {
        return "";
    }

    return code;
}

function isAdminChat(msgOrChatId) {
    if (!ADMIN_CHAT_ID) return false;

    const rawChatId =
        typeof msgOrChatId === "object"
            ? msgOrChatId?.chat?.id
            : msgOrChatId;

    return String(rawChatId || "") === ADMIN_CHAT_ID;
}

function formatDateTime(value) {
    const timestamp = Number(value) || Date.now();
    return new Date(timestamp).toLocaleString("pl-PL");
}

function normalizeWithdrawAmount(item) {
    const rewardAmount =
        Number(item?.rewardAmount) ||
        Number(item?.amount) ||
        0;

    return Number(rewardAmount.toFixed(3));
}

function normalizeWithdrawUsd(item) {
    const usdAmount = Number(item?.usdAmount) || 0;
    return Number(usdAmount.toFixed(3));
}

function getAllWithdraws() {
    const db = readDb();
    return Array.isArray(db?.withdrawRequests) ? db.withdrawRequests : [];
}

function getPendingWithdraws() {
    return getAllWithdraws()
        .filter((item) => String(item?.status || "pending").toLowerCase() === "pending")
        .sort((a, b) => Number(b?.createdAt || 0) - Number(a?.createdAt || 0));
}

function getPaidWithdraws() {
    return getAllWithdraws()
        .filter((item) => String(item?.status || "").toLowerCase() === "paid")
        .sort((a, b) => Number(b?.updatedAt || b?.createdAt || 0) - Number(a?.updatedAt || a?.createdAt || 0));
}

function buildWithdrawLine(item, index) {
    const username = String(item?.username || "Gracz");
    const telegramId = String(item?.telegramId || "");
    const rewardAmount = normalizeWithdrawAmount(item);
    const usdAmount = normalizeWithdrawUsd(item);
    const status = String(item?.status || "pending");
    const createdAt = formatDateTime(item?.createdAt);

    return [
        `${index + 1}. ${username ? `@${username}` : "Gracz"}`,
        `ID: ${telegramId}`,
        `Reward: ${rewardAmount}`,
        `USD: $${usdAmount}`,
        `Status: ${status}`,
        `Date: ${createdAt}`
    ].join("\n");
}

function chunkText(text, maxLength = 3500) {
    const safeText = String(text || "");
    if (safeText.length <= maxLength) {
        return [safeText];
    }

    const chunks = [];
    let current = "";

    safeText.split("\n\n").forEach((block) => {
        const nextBlock = current ? `${current}\n\n${block}` : block;

        if (nextBlock.length > maxLength) {
            if (current) {
                chunks.push(current);
            }

            if (block.length > maxLength) {
                let offset = 0;
                while (offset < block.length) {
                    chunks.push(block.slice(offset, offset + maxLength));
                    offset += maxLength;
                }
                current = "";
            } else {
                current = block;
            }
        } else {
            current = nextBlock;
        }
    });

    if (current) {
        chunks.push(current);
    }

    return chunks;
}

async function sendAdminMessage(text, extra = {}) {
    if (!ADMIN_CHAT_ID) {
        console.warn("ADMIN_CHAT_ID missing, cannot send admin message");
        return null;
    }

    try {
        return await bot.sendMessage(ADMIN_CHAT_ID, text, {
            disable_web_page_preview: true,
            ...extra
        });
    } catch (error) {
        console.error("ADMIN MESSAGE ERROR:", error?.response?.body || error.message || error);
        return null;
    }
}

function formatWithdrawNotification(title, item) {
    const username = String(item?.username || "Gracz");
    const telegramId = String(item?.telegramId || "");
    const rewardAmount = normalizeWithdrawAmount(item);
    const usdAmount = normalizeWithdrawUsd(item);
    const status = String(item?.status || "pending");
    const createdAt = formatDateTime(item?.createdAt);
    const updatedAt = formatDateTime(item?.updatedAt || item?.createdAt);
    const note = String(item?.note || "").trim();

    return [
        title,
        "",
        `👤 User: ${username ? `@${username}` : "Gracz"}`,
        `🆔 Telegram ID: ${telegramId}`,
        `🎯 Reward: ${rewardAmount}`,
        `💵 USD: $${usdAmount}`,
        `📌 Status: ${status}`,
        `🕒 Created: ${createdAt}`,
        `🛠 Updated: ${updatedAt}`,
        note ? `📝 Note: ${note}` : ""
    ].filter(Boolean).join("\n");
}

async function notifyNewWithdraw(item) {
    return sendAdminMessage(
        formatWithdrawNotification("💸 New withdraw request", item)
    );
}

async function notifyWithdrawPaid(item) {
    return sendAdminMessage(
        formatWithdrawNotification("✅ Withdraw paid", item)
    );
}

async function notifyWithdrawRejected(item) {
    return sendAdminMessage(
        formatWithdrawNotification("❌ Withdraw rejected", item)
    );
}

bot.onText(/\/start(?:@\w+)?(?:\s+(.+))?/, async (msg) => {
    try {
        const chatId = msg.chat.id;
        const telegramUser = buildTelegramUser(msg.from);
        const startParam = extractStartParam(msg.text);
        const refCode = normalizeRefCode(startParam);
        const url = buildWebAppUrl(telegramUser, refCode);

        await bot.sendMessage(
            chatId,
            `🐾 Witaj w Crypto Zoo!

Buduj swoje zoo, zbieraj monety i zdobywaj nagrody!

Kliknij poniżej aby rozpocząć 👇`
        );

        await bot.sendMessage(chatId, "🎮 Zagraj w Crypto Zoo", {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "🎮 Zagraj",
                            web_app: { url }
                        }
                    ]
                ]
            }
        });
    } catch (error) {
        console.error("START COMMAND ERROR:", error);
    }
});

bot.onText(/\/admin(?:@\w+)?$/, async (msg) => {
    try {
        if (!isAdminChat(msg)) return;

        await bot.sendMessage(
            msg.chat.id,
            [
                "🛠 Admin commands:",
                "/live_withdraws - pending withdraws",
                "/paid_withdraws - last paid withdraws",
                "/withdraw_stats - payout stats"
            ].join("\n")
        );
    } catch (error) {
        console.error("ADMIN COMMAND ERROR:", error);
    }
});

bot.onText(/\/live_withdraws(?:@\w+)?$/, async (msg) => {
    try {
        if (!isAdminChat(msg)) return;

        const pending = getPendingWithdraws();

        if (!pending.length) {
            await bot.sendMessage(msg.chat.id, "Brak aktywnych wypłat pending.");
            return;
        }

        const text = [
            "💸 LIVE WITHDRAWS (PENDING)",
            "",
            pending.map((item, index) => buildWithdrawLine(item, index)).join("\n\n-----------------\n\n")
        ].join("\n");

        const parts = chunkText(text);
        for (const part of parts) {
            await bot.sendMessage(msg.chat.id, part);
        }
    } catch (error) {
        console.error("LIVE WITHDRAWS ERROR:", error);
    }
});

bot.onText(/\/paid_withdraws(?:@\w+)?$/, async (msg) => {
    try {
        if (!isAdminChat(msg)) return;

        const paid = getPaidWithdraws().slice(0, 20);

        if (!paid.length) {
            await bot.sendMessage(msg.chat.id, "Brak wypłat oznaczonych jako paid.");
            return;
        }

        const text = [
            "✅ LAST PAID WITHDRAWS",
            "",
            paid.map((item, index) => buildWithdrawLine(item, index)).join("\n\n-----------------\n\n")
        ].join("\n");

        const parts = chunkText(text);
        for (const part of parts) {
            await bot.sendMessage(msg.chat.id, part);
        }
    } catch (error) {
        console.error("PAID WITHDRAWS ERROR:", error);
    }
});

bot.onText(/\/withdraw_stats(?:@\w+)?$/, async (msg) => {
    try {
        if (!isAdminChat(msg)) return;

        const all = getAllWithdraws();
        const pending = all.filter((item) => String(item?.status || "pending").toLowerCase() === "pending");
        const paid = all.filter((item) => String(item?.status || "").toLowerCase() === "paid");
        const rejected = all.filter((item) => String(item?.status || "").toLowerCase() === "rejected");

        const pendingReward = pending.reduce((sum, item) => sum + normalizeWithdrawAmount(item), 0);
        const paidReward = paid.reduce((sum, item) => sum + normalizeWithdrawAmount(item), 0);
        const rejectedReward = rejected.reduce((sum, item) => sum + normalizeWithdrawAmount(item), 0);

        const pendingUsd = pending.reduce((sum, item) => sum + normalizeWithdrawUsd(item), 0);
        const paidUsd = paid.reduce((sum, item) => sum + normalizeWithdrawUsd(item), 0);
        const rejectedUsd = rejected.reduce((sum, item) => sum + normalizeWithdrawUsd(item), 0);

        await bot.sendMessage(
            msg.chat.id,
            [
                "📊 WITHDRAW STATS",
                "",
                `Pending: ${pending.length}`,
                `Pending reward: ${Number(pendingReward.toFixed(3))}`,
                `Pending USD: $${Number(pendingUsd.toFixed(3))}`,
                "",
                `Paid: ${paid.length}`,
                `Paid reward: ${Number(paidReward.toFixed(3))}`,
                `Paid USD: $${Number(paidUsd.toFixed(3))}`,
                "",
                `Rejected: ${rejected.length}`,
                `Rejected reward: ${Number(rejectedReward.toFixed(3))}`,
                `Rejected USD: $${Number(rejectedUsd.toFixed(3))}`
            ].join("\n")
        );
    } catch (error) {
        console.error("WITHDRAW STATS ERROR:", error);
    }
});

bot.on("polling_error", (error) => {
    console.error("POLLING ERROR:", error?.response?.body || error.message || error);
});

module.exports = {
    bot,
    sendAdminMessage,
    notifyNewWithdraw,
    notifyWithdrawPaid,
    notifyWithdrawRejected
};