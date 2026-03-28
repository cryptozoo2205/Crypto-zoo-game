const { normalizeRewardNumber, safeString } = require("../utils/helpers");

function createDeposit({ telegramId, username, amount }) {
    return {
        id: `dp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        telegramId: String(telegramId),
        username: String(username || "Gracz"),
        amount: normalizeRewardNumber(amount, 0),
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        source: "manual", // później: ton / usdt / telegram_ads
        note: ""
    };
}

function getPlayerDeposits(db, telegramId) {
    return (db.deposits || [])
        .filter((d) => String(d.telegramId) === String(telegramId))
        .sort((a, b) => b.createdAt - a.createdAt);
}

module.exports = {
    createDeposit,
    getPlayerDeposits
};