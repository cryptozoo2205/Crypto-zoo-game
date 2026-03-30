require("dotenv").config();

const { readDb, writeDb } = require("./db/db");

const ADMIN_CHAT_ID = safeEnvString(process.env.ADMIN_CHAT_ID, "6845563406");

function safeEnvString(value, fallback = "") {
    const safe = String(value || "").trim();
    return safe || String(fallback || "");
}

function isAdmin(chatId) {
    return String(chatId) === String(ADMIN_CHAT_ID);
}

function normalizeGems(value) {
    return Math.max(0, Math.floor(Number(value) || 0));
}

function toNumber(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
}

// 🔥 SZUKANIE PO ID LUB USERNAME
function findPlayer(db, query) {
    if (!db.players) return null;

    // 1. po telegramId
    if (db.players[query]) {
        return db.players[query];
    }

    // 2. po username
    const players = Object.values(db.players);

    return players.find(
        (p) =>
            String(p.username || "").toLowerCase() ===
            String(query || "").toLowerCase()
    );
}

function formatPlayerInfo(player) {
    if (!player) {
        return "Nie znaleziono gracza";
    }

    return `👤 PLAYER

ID: ${String(player.telegramId || "")}
Username: ${String(player.username || "Gracz")}
Gems: ${normalizeGems(player.gems)}
Coins: ${toNumber(player.coins)}
Level: ${Math.max(1, Math.floor(Number(player.level) || 1))}
Reward balance: ${toNumber(player.rewardBalance || 0).toFixed(3)}
Reward wallet: ${toNumber(player.rewardWallet || 0).toFixed(3)}
Pending: ${toNumber(player.withdrawPending || 0).toFixed(3)}`;
}

function applyAddGems(db, player, gemsAmount) {
    const safeGems = normalizeGems(gemsAmount);

    if (safeGems <= 0) {
        return { ok: false, error: "Nieprawidłowa ilość gemów" };
    }

    player.gems = normalizeGems(player.gems) + safeGems;
    player.updatedAt = Date.now();

    writeDb(db);

    return {
        ok: true,
        player,
        added: safeGems
    };
}

function registerAdminHandlers(bot) {
    bot.on("message", async (msg) => {
        const text = String(msg.text || "");
        if (!text.startsWith("/")) return;

        if (!isAdmin(msg.chat.id)) {
            return bot.sendMessage(msg.chat.id, "⛔ Brak dostępu.");
        }

        // 🔍 PLAYER
        if (text.startsWith("/player")) {
            const db = readDb();
            const parts = text.trim().split(/\s+/);
            const query = parts[1];

            if (!query) {
                return bot.sendMessage(msg.chat.id, "Użyj: /player <telegramId | username>");
            }

            const player = findPlayer(db, query);
            return bot.sendMessage(msg.chat.id, formatPlayerInfo(player));
        }

        // 💎 ADD GEMS
        if (text.startsWith("/addgems")) {
            const db = readDb();
            const parts = text.trim().split(/\s+/);

            const query = parts[1];
            const amount = parts[2];

            if (!query || !amount) {
                return bot.sendMessage(msg.chat.id, "Użyj: /addgems <telegramId | username> <amount>");
            }

            const player = findPlayer(db, query);

            if (!player) {
                return bot.sendMessage(msg.chat.id, "Nie znaleziono gracza");
            }

            const result = applyAddGems(db, player, amount);

            if (!result.ok) {
                return bot.sendMessage(msg.chat.id, result.error);
            }

            return bot.sendMessage(
                msg.chat.id,
                `💎 Dodano ${result.added} gemów\nUser: ${player.username}\nNowe gemy: ${player.gems}`
            );
        }
    });
}

module.exports = {
    registerAdminHandlers,
    isAdmin
};