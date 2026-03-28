const { normalizeRewardNumber, safeString } = require("../utils/helpers");

function createDeposit({ telegramId, username, amount, source = "manual" }) {
    return {
        id: `dp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        telegramId: String(telegramId),
        username: String(username || "Gracz"),
        amount: normalizeRewardNumber(amount, 0),
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        source: safeString(source, "manual") || "manual",
        note: ""
    };
}

function getPlayerDeposits(db, telegramId) {
    return (Array.isArray(db?.deposits) ? db.deposits : [])
        .filter((d) => String(d.telegramId) === String(telegramId))
        .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
}

module.exports = {
    createDeposit,
    getPlayerDeposits
};