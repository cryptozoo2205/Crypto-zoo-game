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

function normalizeGems(value) {
    return Math.max(0, Math.floor(Number(value) || 0));
}

function findWithdraw(db, id) {
    return (db.withdrawRequests || []).find((w) => String(w.id) === String(id));
}

function getPlayer(db, telegramId) {
    if (!db || !db.players) return null;
    return db.players?.[telegramId] || null;
}

function getPlayersArray(db) {
    if (!db || !db.players) return [];

    if (Array.isArray(db.players)) {
        return db.players;
    }

    if (typeof db.players === "object") {
        return Object.values(db.players);
    }

    return [];
}

function getTotalUsers(db) {
    if (!db || !db.players) return 0;

    if (Array.isArray(db.players)) {
        return db.players.length;
    }

    if (typeof db.players === "object") {
        return Object.keys(db.players).length;
    }

    return 0;
}

function getDepositEntries(db) {
    if (!db || typeof db !== "object") return [];

    if (Array.isArray(db.deposits)) {
        return db.deposits.filter(Boolean);
    }

    if (Array.isArray(db.depositRequests)) {
        return db.depositRequests.filter(Boolean);
    }

    const players = getPlayersArray(db);
    const all = [];

    for (const player of players) {
        if (!player || typeof player !== "object") continue;

        if (Array.isArray(player.depositHistory)) {
            all.push(...player.depositHistory.filter(Boolean));
            continue;
        }

        if (Array.isArray(player.deposits)) {
            all.push(...player.deposits.filter(Boolean));
            continue;
        }
    }

    return all;
}

function getDepositorsCount(db) {
    const players = getPlayersArray(db);
    let total = 0;

    for (const player of players) {
        if (!player || typeof player !== "object") continue;

        const hasDeposits =
            (Array.isArray(player.depositHistory) && player.depositHistory.length > 0) ||
            (Array.isArray(player.deposits) && player.deposits.length > 0) ||
            Number(player.totalDeposits || 0) > 0 ||
            Number(player.depositAmount || 0) > 0;

        if (hasDeposits) {
            total += 1;
        }
    }

    return total;
}

function getDepositTonValue(item) {
    return toNumber(
        item?.tonAmount ??
            item?.amount ??
            item?.depositAmount ??
            item?.value ??
            0
    );
}

function getDepositUsdValue(item) {
    return toNumber(
        item?.usdAmount ??
            item?.usd ??
            item?.usdValue ??
            0
    );
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

function getWithdrawLists(db) {
    const allWithdraws = Array.isArray(db.withdrawRequests) ? db.withdrawRequests : [];

    return {
        all: allWithdraws,
        pending: allWithdraws.filter((w) => w.status === "pending"),
        paid: allWithdraws.filter((w) => w.status === "paid"),
        rejected: allWithdraws.filter((w) => w.status === "rejected")
    };
}

function formatAdminPanel(db) {
    const totalUsers = getTotalUsers(db);
    const depositStats = getDepositStats(db);
    const depositUsersCount = getDepositorsCount(db);
    const withdraws = getWithdrawLists(db);

    return `🛠 ADMIN PANEL

👥 Users total: ${totalUsers}
💸 Deposits: ${depositStats.count}
💰 TON total: ${depositStats.totalTon}
💵 USD total: ${depositStats.totalUsd}
🧑‍💳 Users with deposit: ${depositUsersCount}

📤 Pending withdraws: ${withdraws.pending.length}
✅ Paid withdraws: ${withdraws.paid.length}
❌ Rejected withdraws: ${withdraws.rejected.length}

/live_withdraws
/paid_withdraws
/withdraw_stats

/pay <id>
/reject <id> <note>

/addgems <telegramId> <amount>
/player <telegramId>`;
}

function formatLiveWithdraws(list) {
    if (!list.length) {
        return "Brak pending.";
    }

    return list
        .map(
            (w, i) => `${i + 1}.
ID: ${w.id}
User: ${w.username}
Reward: ${normalizeAmount(w)}
USD: $${normalizeUsd(w)}`
        )
        .join("\n\n");
}

function formatPaidWithdraws(list) {
    if (!list.length) {
        return "Brak paid.";
    }

    return list
        .map(
            (w, i) => `${i + 1}.
${w.username}
${normalizeAmount(w)} ($${normalizeUsd(w)})`
        )
        .join("\n\n");
}

function formatWithdrawStats(db) {
    const totalUsers = getTotalUsers(db);
    const depositStats = getDepositStats(db);
    const depositUsersCount = getDepositorsCount(db);
    const withdraws = getWithdrawLists(db);

    return `📊 STATS

👥 Users total: ${totalUsers}
💸 Deposits: ${depositStats.count}
💰 TON total: ${depositStats.totalTon}
💵 USD total: ${depositStats.totalUsd}
🧑‍💳 Users with deposit: ${depositUsersCount}

Pending: ${withdraws.pending.length}
Paid: ${withdraws.paid.length}
Rejected: ${withdraws.rejected.length}`;
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

function applyPaidWithdraw(db, withdraw) {
    const player = getPlayer(db, withdraw.telegramId);

    if (!player) {
        return { ok: false, error: "Nie znaleziono gracza" };
    }

    const amount = normalizeAmount(withdraw);

    player.withdrawPending = Number(player.withdrawPending || 0) - amount;
    player.rewardWallet = Number(player.rewardWallet || 0) + amount;

    withdraw.status = "paid";
    withdraw.updatedAt = Date.now();

    writeDb(db);

    return { ok: true };
}

function applyRejectedWithdraw(db, withdraw, note = "") {
    const player = getPlayer(db, withdraw.telegramId);

    if (!player) {
        return { ok: false, error: "Nie znaleziono gracza" };
    }

    const amount = normalizeAmount(withdraw);

    player.withdrawPending = Number(player.withdrawPending || 0) - amount;
    player.rewardBalance = Number(player.rewardBalance || 0) + amount;

    withdraw.status = "rejected";
    withdraw.note = note;
    withdraw.updatedAt = Date.now();

    writeDb(db);

    return { ok: true };
}

function applyAddGems(db, telegramId, gemsAmount) {
    if (!db.players || typeof db.players !== "object") {
        db.players = {};
    }

    const player = getPlayer(db, telegramId);

    if (!player) {
        return { ok: false, error: "Nie znaleziono gracza" };
    }

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

function isAdminCommand(text) {
    return (
        text.startsWith("/admin") ||
        text.startsWith("/live_withdraws") ||
        text.startsWith("/paid_withdraws") ||
        text.startsWith("/withdraw_stats") ||
        text.startsWith("/pay") ||
        text.startsWith("/reject") ||
        text.startsWith("/addgems") ||
        text.startsWith("/player")
    );
}

function registerAdminHandlers(bot) {
    bot.on("message", async (msg) => {
        const text = String(msg.text || "");
        if (!text.startsWith("/")) return;

        if (!isAdmin(msg.chat.id) && isAdminCommand(text)) {
            return bot.sendMessage(msg.chat.id, "⛔ Brak dostępu.");
        }

        if (text.startsWith("/admin")) {
            const db = readDb();
            return bot.sendMessage(msg.chat.id, formatAdminPanel(db));
        }

        if (text.startsWith("/live_withdraws")) {
            const db = readDb();
            const { pending } = getWithdrawLists(db);
            return bot.sendMessage(msg.chat.id, formatLiveWithdraws(pending));
        }

        if (text.startsWith("/paid_withdraws")) {
            const db = readDb();
            const { paid } = getWithdrawLists(db);
            return bot.sendMessage(msg.chat.id, formatPaidWithdraws(paid.slice(0, 20)));
        }

        if (text.startsWith("/withdraw_stats")) {
            const db = readDb();
            return bot.sendMessage(msg.chat.id, formatWithdrawStats(db));
        }

        if (text.startsWith("/player")) {
            const db = readDb();
            const parts = text.trim().split(/\s+/);
            const telegramId = String(parts[1] || "").trim();

            if (!telegramId) {
                return bot.sendMessage(msg.chat.id, "Użyj: /player <telegramId>");
            }

            const player = getPlayer(db, telegramId);
            return bot.sendMessage(msg.chat.id, formatPlayerInfo(player));
        }

        if (text.startsWith("/addgems")) {
            const db = readDb();
            const parts = text.trim().split(/\s+/);
            const telegramId = String(parts[1] || "").trim();
            const gemsAmount = normalizeGems(parts[2]);

            if (!telegramId || !parts[2]) {
                return bot.sendMessage(msg.chat.id, "Użyj: /addgems <telegramId> <amount>");
            }

            const result = applyAddGems(db, telegramId, gemsAmount);

            if (!result.ok) {
                return bot.sendMessage(msg.chat.id, result.error || "Błąd");
            }

            return bot.sendMessage(
                msg.chat.id,
                `💎 Dodano ${result.added} gemów\nID: ${telegramId}\nNowe gemy: ${normalizeGems(result.player.gems)}`
            );
        }

        if (text.startsWith("/pay")) {
            const db = readDb();
            const parts = text.split(" ");
            const id = parts[1];

            if (!id) {
                return bot.sendMessage(msg.chat.id, "Podaj ID");
            }

            const withdraw = findWithdraw(db, id);

            if (!withdraw) {
                return bot.sendMessage(msg.chat.id, "Nie znaleziono");
            }

            if (withdraw.status !== "pending") {
                return bot.sendMessage(msg.chat.id, "Już przetworzone");
            }

            const result = applyPaidWithdraw(db, withdraw);

            if (!result.ok) {
                return bot.sendMessage(msg.chat.id, result.error || "Błąd");
            }

            return bot.sendMessage(msg.chat.id, `✅ PAID ${id}`);
        }

        if (text.startsWith("/reject")) {
            const db = readDb();
            const parts = text.split(" ");

            const id = parts[1];
            const note = parts.slice(2).join(" ") || "";

            if (!id) {
                return bot.sendMessage(msg.chat.id, "Podaj ID");
            }

            const withdraw = findWithdraw(db, id);

            if (!withdraw) {
                return bot.sendMessage(msg.chat.id, "Nie znaleziono");
            }

            if (withdraw.status !== "pending") {
                return bot.sendMessage(msg.chat.id, "Już przetworzone");
            }

            const result = applyRejectedWithdraw(db, withdraw, note);

            if (!result.ok) {
                return bot.sendMessage(msg.chat.id, result.error || "Błąd");
            }

            return bot.sendMessage(msg.chat.id, `❌ REJECTED ${id}`);
        }
    });
}

module.exports = {
    registerAdminHandlers,
    isAdmin
};