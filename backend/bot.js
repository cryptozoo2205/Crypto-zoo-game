require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const { readDb } = require("./db/db");

const token = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;

// 🔒 TYLKO TY MASZ DOSTĘP
const ADMIN_CHAT_ID = "6845563406";

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
console.log("👮 ADMIN_CHAT_ID:", ADMIN_CHAT_ID);

// =======================
// HELPERS
// =======================

function isAdmin(chatId) {
    return String(chatId || "") === ADMIN_CHAT_ID;
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

function formatDateTime(value) {
    return new Date(Number(value) || Date.now()).toLocaleString("pl-PL");
}

function normalizeWithdrawAmount(item) {
    return Number((Number(item?.rewardAmount || item?.amount || 0)).toFixed(3));
}

function normalizeWithdrawUsd(item) {
    return Number((Number(item?.usdAmount || 0)).toFixed(3));
}

function getAllWithdraws() {
    const db = readDb();
    return Array.isArray(db?.withdrawRequests) ? db.withdrawRequests : [];
}

function getPendingWithdraws() {
    return getAllWithdraws().filter(
        (i) => String(i?.status || "pending") === "pending"
    );
}

function getPaidWithdraws() {
    return getAllWithdraws().filter(
        (i) => String(i?.status || "") === "paid"
    );
}

// =======================
// START
// =======================

bot.onText(/\/start(?:@\w+)?(?:\s+(.+))?/, async (msg) => {
    try {
        const chatId = msg.chat.id;
        const telegramUser = buildTelegramUser(msg.from);
        const refCode = normalizeRefCode(extractStartParam(msg.text));
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
                    [{ text: "🎮 Zagraj", web_app: { url } }]
                ]
            }
        });
    } catch (e) {
        console.error("START ERROR:", e);
    }
});

// =======================
// DEBUG
// =======================

bot.onText(/\/ping/, async (msg) => {
    await bot.sendMessage(
        msg.chat.id,
        `pong\nchat.id: ${msg.chat.id}`
    );
});

// =======================
// ADMIN COMMANDS
// =======================

bot.on("message", async (msg) => {
    const text = String(msg.text || "");

    if (!text.startsWith("/")) return;

    // 🔒 BLOCK ALL ADMIN COMMANDS
    if (
        text.startsWith("/admin") ||
        text.startsWith("/live_withdraws") ||
        text.startsWith("/paid_withdraws") ||
        text.startsWith("/withdraw_stats")
    ) {
        if (!isAdmin(msg.chat.id)) {
            return bot.sendMessage(msg.chat.id, "⛔ Brak dostępu.");
        }
    }

    // =======================
    // /admin
    // =======================
    if (text.startsWith("/admin")) {
        return bot.sendMessage(
            msg.chat.id,
            "🛠 Commands:\n/live_withdraws\n/paid_withdraws\n/withdraw_stats"
        );
    }

    // =======================
    // LIVE WITHDRAWS
    // =======================
    if (text.startsWith("/live_withdraws")) {
        const list = getPendingWithdraws();

        if (!list.length) {
            return bot.sendMessage(msg.chat.id, "Brak pendingów.");
        }

        const textOut = list.map((w, i) =>
            `${i + 1}. ${w.username}\nReward: ${normalizeWithdrawAmount(w)}\nUSD: $${normalizeWithdrawUsd(w)}`
        ).join("\n\n");

        return bot.sendMessage(msg.chat.id, textOut);
    }

    // =======================
    // PAID
    // =======================
    if (text.startsWith("/paid_withdraws")) {
        const list = getPaidWithdraws().slice(0, 20);

        if (!list.length) {
            return bot.sendMessage(msg.chat.id, "Brak paid.");
        }

        const textOut = list.map((w, i) =>
            `${i + 1}. ${w.username}\nReward: ${normalizeWithdrawAmount(w)}\nUSD: $${normalizeWithdrawUsd(w)}`
        ).join("\n\n");

        return bot.sendMessage(msg.chat.id, textOut);
    }

    // =======================
    // STATS
    // =======================
    if (text.startsWith("/withdraw_stats")) {
        const all = getAllWithdraws();

        const pending = all.filter(w => w.status === "pending");
        const paid = all.filter(w => w.status === "paid");
        const rejected = all.filter(w => w.status === "rejected");

        return bot.sendMessage(
            msg.chat.id,
            `📊 STATS

Pending: ${pending.length}
Paid: ${paid.length}
Rejected: ${rejected.length}`
        );
    }
});

// =======================
// NOTIFICATIONS
// =======================

async function sendAdminMessage(text) {
    if (!ADMIN_CHAT_ID) return;
    return bot.sendMessage(ADMIN_CHAT_ID, text);
}

async function notifyNewWithdraw(w) {
    return sendAdminMessage(`💸 NEW\n${w.username} → ${w.amount}`);
}

async function notifyWithdrawPaid(w) {
    return sendAdminMessage(`✅ PAID\n${w.username} → ${w.amount}`);
}

async function notifyWithdrawRejected(w) {
    return sendAdminMessage(`❌ REJECTED\n${w.username} → ${w.amount}`);
}

module.exports = {
    bot,
    notifyNewWithdraw,
    notifyWithdrawPaid,
    notifyWithdrawRejected
};