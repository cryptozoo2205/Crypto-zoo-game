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

function escapeText(text) {
    return String(text || "").replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

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

function formatDateTime(value) {
    const timestamp = Number(value) || Date.now();
    return new Date(timestamp).toLocaleString("pl-PL");
}

function normalizeWithdrawAmount(item) {
    return Number((Number(item?.rewardAmount) || Number(item?.amount) || 0).toFixed(3));
}

function normalizeWithdrawUsd(item) {
    return Number((Number(item?.usdAmount) || 0).toFixed(3));
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
    const username = escapeText(item?.username || "Gracz");
    const telegramId = item?.telegramId || "";
    const rewardAmount = normalizeWithdrawAmount(item);
    const usdAmount = normalizeWithdrawUsd(item);

    return [
        `${index + 1}. @${username}`,
        `ID: ${telegramId}`,
        `Reward: ${rewardAmount}`,
        `USD: $${usdAmount.toFixed(3)}`,
        `Date: ${formatDateTime(item?.createdAt)}`
    ].join("\n");
}

function chunkText(text, maxLength = 3500) {
    const chunks = [];
    let current = "";

    text.split("\n\n").forEach((block) => {
        const next = current ? `${current}\n\n${block}` : block;

        if (next.length > maxLength) {
            if (current) chunks.push(current);

            if (block.length > maxLength) {
                for (let i = 0; i < block.length; i += maxLength) {
                    chunks.push(block.slice(i, i + maxLength));
                }
                current = "";
            } else {
                current = block;
            }
        } else {
            current = next;
        }
    });

    if (current) chunks.push(current);
    return chunks;
}

async function sendAdminMessage(text) {
    if (!ADMIN_CHAT_ID) return;

    try {
        return await bot.sendMessage(ADMIN_CHAT_ID, text, {
            disable_web_page_preview: true
        });
    } catch (error) {
        console.error("ADMIN MESSAGE ERROR:", error?.message || error);
    }
}

function formatWithdrawNotification(title, item) {
    const username = escapeText(item?.username || "Gracz");
    const telegramId = item?.telegramId || "";
    const rewardAmount = normalizeWithdrawAmount(item);
    const usdAmount = normalizeWithdrawUsd(item);
    const note = escapeText(item?.note || "");

    return [
        title,
        "",
        `👤 @${username}`,
        `🆔 ${telegramId}`,
        `🎯 Reward: ${rewardAmount}`,
        `💵 USD: $${usdAmount.toFixed(3)}`,
        `🕒 ${formatDateTime(item?.createdAt)}`,
        note ? `📝 ${note}` : ""
    ].filter(Boolean).join("\n");
}

async function notifyNewWithdraw(item) {
    return sendAdminMessage(
        formatWithdrawNotification("💸 NEW WITHDRAW", item)
    );
}

async function notifyWithdrawPaid(item) {
    return sendAdminMessage(
        formatWithdrawNotification("✅ WITHDRAW PAID", item)
    );
}

async function notifyWithdrawRejected(item) {
    return sendAdminMessage(
        formatWithdrawNotification("❌ WITHDRAW REJECTED", item)
    );
}

/* ================= ADMIN COMMANDS ================= */

function isAdminChat(msg) {
    return String(msg?.chat?.id || "") === ADMIN_CHAT_ID;
}

bot.onText(/\/admin/, async (msg) => {
    if (!isAdminChat(msg)) return;

    await bot.sendMessage(msg.chat.id,
        "🛠 Commands:\n" +
        "/live_withdraws\n" +
        "/paid_withdraws\n" +
        "/withdraw_stats"
    );
});

bot.onText(/\/live_withdraws/, async (msg) => {
    if (!isAdminChat(msg)) return;

    const list = getPendingWithdraws();

    if (!list.length) {
        return bot.sendMessage(msg.chat.id, "Brak pending.");
    }

    const text = list
        .map((item, i) => buildWithdrawLine(item, i))
        .join("\n\n--------\n\n");

    for (const part of chunkText(text)) {
        await bot.sendMessage(msg.chat.id, part);
    }
});

bot.onText(/\/paid_withdraws/, async (msg) => {
    if (!isAdminChat(msg)) return;

    const list = getPaidWithdraws().slice(0, 20);

    if (!list.length) {
        return bot.sendMessage(msg.chat.id, "Brak paid.");
    }

    const text = list
        .map((item, i) => buildWithdrawLine(item, i))
        .join("\n\n--------\n\n");

    for (const part of chunkText(text)) {
        await bot.sendMessage(msg.chat.id, part);
    }
});

bot.onText(/\/withdraw_stats/, async (msg) => {
    if (!isAdminChat(msg)) return;

    const all = getAllWithdraws();

    const sum = (arr, fn) => arr.reduce((s, x) => s + fn(x), 0);

    const pending = all.filter(x => x.status === "pending");
    const paid = all.filter(x => x.status === "paid");
    const rejected = all.filter(x => x.status === "rejected");

    await bot.sendMessage(msg.chat.id,
        `📊 STATS\n\n` +
        `Pending: ${pending.length}\n` +
        `Paid: ${paid.length}\n` +
        `Rejected: ${rejected.length}\n\n` +
        `Paid USD: $${sum(paid, normalizeWithdrawUsd).toFixed(3)}`
    );
});

bot.on("polling_error", (error) => {
    console.error("POLLING ERROR:", error?.message || error);
});

module.exports = {
    bot,
    notifyNewWithdraw,
    notifyWithdrawPaid,
    notifyWithdrawRejected
};