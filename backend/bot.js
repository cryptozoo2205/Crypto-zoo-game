require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const { readDb } = require("./db/db");

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
console.log("🌐 WEBAPP_URL:", WEBAPP_URL);

/* ================= HELPERS ================= */

function escapeText(text) {
    return String(text || "").replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
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
        .filter(x => String(x?.status || "pending").toLowerCase() === "pending")
        .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
}

function getPaidWithdraws() {
    return getAllWithdraws()
        .filter(x => String(x?.status || "").toLowerCase() === "paid")
        .sort((a, b) => Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0));
}

function buildWithdrawLine(item, index) {
    const username = escapeText(item?.username || "Gracz");

    return [
        `${index + 1}. @${username}`,
        `ID: ${item?.telegramId || ""}`,
        `Reward: ${normalizeWithdrawAmount(item)}`,
        `USD: $${normalizeWithdrawUsd(item).toFixed(3)}`,
        `Status: ${item?.status || "pending"}`,
        `Date: ${formatDateTime(item?.createdAt)}`
    ].join("\n");
}

function chunkText(text, max = 3500) {
    const chunks = [];
    let current = "";

    text.split("\n\n").forEach(block => {
        const next = current ? `${current}\n\n${block}` : block;

        if (next.length > max) {
            if (current) chunks.push(current);

            if (block.length > max) {
                for (let i = 0; i < block.length; i += max) {
                    chunks.push(block.slice(i, i + max));
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

/* ================= NOTIFICATIONS ================= */

async function notifyNewWithdraw(item) {
    return bot.sendMessage(
        process.env.ADMIN_CHAT_ID,
        `💸 NEW WITHDRAW\n\n@${item.username}\n${item.amount}`
    );
}

async function notifyWithdrawPaid(item) {
    return bot.sendMessage(
        process.env.ADMIN_CHAT_ID,
        `✅ PAID\n\n@${item.username}\n${item.amount}`
    );
}

async function notifyWithdrawRejected(item) {
    return bot.sendMessage(
        process.env.ADMIN_CHAT_ID,
        `❌ REJECTED\n\n@${item.username}\n${item.amount}`
    );
}

/* ================= START ================= */

bot.onText(/^\/start/, async (msg) => {
    try {
        const url = new URL(WEBAPP_URL);

        url.searchParams.set("tgId", msg.from.id);
        url.searchParams.set("username", msg.from.username || "");
        url.searchParams.set("first_name", msg.from.first_name || "Gracz");

        await bot.sendMessage(
            msg.chat.id,
            `🐾 Witaj w Crypto Zoo!

Kliknij poniżej 👇`
        );

        await bot.sendMessage(msg.chat.id, "🎮 Zagraj", {
            reply_markup: {
                inline_keyboard: [[{ text: "🎮 Zagraj", web_app: { url: url.toString() } }]]
            }
        });

    } catch (e) {
        console.error(e);
    }
});

/* ================= 🔥 MAIN FIX ================= */

bot.on("message", async (msg) => {
    if (!msg.text) return;

    const text = msg.text.trim().toLowerCase();

    console.log("MSG:", text, "CHAT:", msg.chat.id);

    // ✅ ping
    if (text.startsWith("/ping")) {
        return bot.sendMessage(
            msg.chat.id,
            `pong\nchat.id: ${msg.chat.id}`
        );
    }

    // ✅ admin menu
    if (text.startsWith("/admin")) {
        return bot.sendMessage(
            msg.chat.id,
            "🛠 Commands:\n/live_withdraws\n/paid_withdraws\n/withdraw_stats"
        );
    }

    // ✅ live withdraws
    if (text.startsWith("/live_withdraws")) {
        const list = getPendingWithdraws();

        if (!list.length) {
            return bot.sendMessage(msg.chat.id, "Brak pending.");
        }

        const textOut = list
            .map((item, i) => buildWithdrawLine(item, i))
            .join("\n\n--------\n\n");

        for (const part of chunkText(textOut)) {
            await bot.sendMessage(msg.chat.id, part);
        }

        return;
    }

    // ✅ paid withdraws
    if (text.startsWith("/paid_withdraws")) {
        const list = getPaidWithdraws().slice(0, 20);

        if (!list.length) {
            return bot.sendMessage(msg.chat.id, "Brak paid.");
        }

        const textOut = list
            .map((item, i) => buildWithdrawLine(item, i))
            .join("\n\n--------\n\n");

        for (const part of chunkText(textOut)) {
            await bot.sendMessage(msg.chat.id, part);
        }

        return;
    }

    // ✅ stats
    if (text.startsWith("/withdraw_stats")) {
        const all = getAllWithdraws();

        const sum = (arr, fn) => arr.reduce((s, x) => s + fn(x), 0);

        const pending = all.filter(x => x.status === "pending");
        const paid = all.filter(x => x.status === "paid");
        const rejected = all.filter(x => x.status === "rejected");

        return bot.sendMessage(
            msg.chat.id,
            `📊 STATS

Pending: ${pending.length}
Paid: ${paid.length}
Rejected: ${rejected.length}

Paid USD: $${sum(paid, normalizeWithdrawUsd).toFixed(3)}`
        );
    }
});

/* ================= ERRORS ================= */

bot.on("polling_error", (error) => {
    console.error("POLLING ERROR:", error?.message || error);
});

/* ================= EXPORT ================= */

module.exports = {
    bot,
    notifyNewWithdraw,
    notifyWithdrawPaid,
    notifyWithdrawRejected
};