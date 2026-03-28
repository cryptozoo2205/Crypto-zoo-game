const { LIMITS, ADMIN_SECRET } = require("../config/game-config");
const { normalizeRewardNumber, safeString } = require("../utils/helpers");

function createWithdrawRequest({ telegramId, username, amount }) {
    return {
        id: `wd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        telegramId: String(telegramId),
        username: String(username || "Gracz"),
        amount: normalizeRewardNumber(amount, 0),
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        note: ""
    };
}

function getPendingWithdrawsForPlayer(db, telegramId) {
    return db.withdrawRequests.filter(
        (item) =>
            String(item.telegramId) === String(telegramId) &&
            String(item.status || "pending").toLowerCase() === "pending"
    );
}

function getLatestWithdrawForPlayer(db, telegramId) {
    const requests = db.withdrawRequests
        .filter((item) => String(item.telegramId) === String(telegramId))
        .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

    return requests[0] || null;
}

function requireAdmin(req, res) {
    if (!ADMIN_SECRET) {
        res.status(403).json({ error: "Admin secret not configured" });
        return false;
    }

    const provided =
        req.headers["x-admin-secret"] ||
        req.body?.adminSecret ||
        "";

    if (String(provided) !== ADMIN_SECRET) {
        res.status(403).json({ error: "Forbidden" });
        return false;
    }

    return true;
}

module.exports = {
    createWithdrawRequest,
    getPendingWithdrawsForPlayer,
    getLatestWithdrawForPlayer,
    requireAdmin
};