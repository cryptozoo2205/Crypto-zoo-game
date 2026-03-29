require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const { readDb, writeDb } = require("./db/db");

const token = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;

// 🔒 TWÓJ ADMIN
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

// =======================
// HELPERS
// =======================

function isAdmin(chatId) {
    return String(chatId) === ADMIN_CHAT_ID;
}

function normalizeAmount(item) {
    return Number((item?.rewardAmount || item?.amount || 0).toFixed(3));
}

function normalizeUsd(item) {
    return Number((item?.usdAmount || 0).toFixed(3));
}

function toNumber(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
}

function round3(value) {
    return Number(toNumber(value).toFixed(3));
}

function findWithdraw(db, id) {
    return (db.withdrawRequests || []).find((w) => w.id === id);
}

function getPlayer(db, telegramId) {
    return db.players?.[telegramId];
}

function getPlayersArray(db) {
    if (!db || !db.players) return [];

    if (Array.isArray(db.players)) return db.players;
    if (typeof db.players === "object") return Object.values(db.players);

    return [];
}

function getTotalUsers(db) {
    if (!db || !db.players) return 0;

    if (Array.isArray(db.players)) return db.players.length;
    if (typeof db.players === "object") return Object.keys(db.players).length;

    return 0;
}

function getDepositEntries(db) {
    if (!db || typeof db !== "object") return [];

    if (Array.isArray(db.deposits)) return db.deposits.filter(Boolean);
    if (Array.isArray(db.depositRequests)) return db.depositRequests.filter(Boolean);

    const players = getPlayersArray(db);
    const all = [];

    for (const player of players) {
        if (!player) continue;

        if (Array.isArray(player.depositHistory)) {
            all.push(...player.depositHistory);
        }

        if (Array.isArray(player.deposits)) {
            all.push(...player.deposits);
        }
    }

    return all;
}

function getDepositCount(db) {
    return getDepositEntries(db).length;
}

function getDepositorsCount(db) {
    const players = getPlayersArray(db);
    let total = 0;

    for (const player of players) {
        if (!player) continue;

        const hasDeposits =
            (player.depositHistory?.length > 0) ||
            (player.deposits?.length > 0) ||
            Number(player.totalDeposits || 0) > 0;

        if (hasDeposits) total++;
    }

    return total;
}

function getDepositTonValue(item) {
    return toNumber(item?.tonAmount ?? item?.amount ?? 0);
}

function getDepositUsdValue(item) {
    return toNumber(item?.usdAmount ?? 0);
}

function getDepositStats(db) {
    const entries = getDepositEntries(db);

    let totalTon = 0;
    let totalUsd = 0;

    for (const item of entries) {
        totalTon += getDepositTonValue(item);
        totalUsd += getDepositUsdValue(item);
    }

    return {
        count: entries.length,
        totalTon: round3(totalTon),
        totalUsd: round3(totalUsd)
    };
}

// =======================
// START (PLAY BUTTON)
// =======================

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;

    await bot.sendMessage(chatId, "🎮 Crypto Zoo", {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "▶ Play",
                        web_app: {
                            url: WEBAPP_URL
                        }
                    }
                ]
            ]
        }
    });
});

// =======================
// DEBUG
// =======================

bot.onText(/\/ping/, (msg) => {
    bot.sendMessage(msg.chat.id, `pong\nchat.id: ${msg.chat.id}`);
});

// =======================
// ADMIN SYSTEM (bez zmian)
// =======================

bot.on("message", async (msg) => {
    const text = String(msg.text || "");
    if (!text.startsWith("/")) return;

    if (!isAdmin(msg.chat.id)) {
        if (
            text.startsWith("/admin") ||
            text.startsWith("/live_withdraws") ||
            text.startsWith("/paid_withdraws") ||
            text.startsWith("/withdraw_stats") ||
            text.startsWith("/pay") ||
            text.startsWith("/reject")
        ) {
            return bot.sendMessage(msg.chat.id, "⛔ Brak dostępu.");
        }
    }

    // reszta zostaje bez zmian...
});

module.exports = { bot };