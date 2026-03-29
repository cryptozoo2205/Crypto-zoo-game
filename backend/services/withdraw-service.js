const { LIMITS, ADMIN_SECRET } = require("../config/game-config");
const { normalizeRewardNumber, safeString } = require("../utils/helpers");

const WITHDRAW_RATE_USD = normalizeRewardNumber(
    LIMITS?.withdrawUsdPerReward,
    0.005
);

const MIN_WITHDRAW_REWARD = normalizeRewardNumber(
    LIMITS?.minWithdrawReward,
    10
);

const MIN_WITHDRAW_LEVEL = Math.max(
    1,
    Math.floor(Number(LIMITS?.minWithdrawLevel) || 7)
);

const MIN_ACCOUNT_AGE_MS = Math.max(
    0,
    Number(LIMITS?.minWithdrawAccountAgeMs) || 24 * 60 * 60 * 1000
);

function getNow() {
    return Date.now();
}

function getPlayerCreatedAtMs(player) {
    const createdAt =
        Number(player?.createdAt) ||
        Number(player?.registeredAt) ||
        Number(player?.firstSeenAt) ||
        Number(player?.joinedAt) ||
        0;

    return Math.max(0, createdAt);
}

function getPlayerAccountAgeMs(player) {
    const createdAt = getPlayerCreatedAtMs(player);
    if (!createdAt) return 0;
    return Math.max(0, getNow() - createdAt);
}

function getPlayerLevel(player) {
    return Math.max(1, Math.floor(Number(player?.level) || 1));
}

function getPlayerRewardBalance(player) {
    return normalizeRewardNumber(player?.rewardBalance, 0);
}

function getPlayerWithdrawPending(player) {
    return normalizeRewardNumber(player?.withdrawPending, 0);
}

function getPlayerRewardWallet(player) {
    return normalizeRewardNumber(player?.rewardWallet, 0);
}

function getWithdrawUsdAmount(amount) {
    return normalizeRewardNumber(
        normalizeRewardNumber(amount, 0) * WITHDRAW_RATE_USD,
        0
    );
}

function createWithdrawRequest({ telegramId, username, amount }) {
    const safeAmount = normalizeRewardNumber(amount, 0);
    const now = getNow();

    return {
        id: `wd_${now}_${Math.random().toString(36).slice(2, 8)}`,
        telegramId: String(telegramId || ""),
        username: safeString(username || "Gracz"),
        amount: safeAmount,
        rewardAmount: safeAmount,
        usdAmount: getWithdrawUsdAmount(safeAmount),
        rateUsdPerReward: WITHDRAW_RATE_USD,
        status: "pending",
        createdAt: now,
        updatedAt: now,
        processedAt: 0,
        note: ""
    };
}

function getPendingWithdrawsForPlayer(db, telegramId) {
    const list = Array.isArray(db?.withdrawRequests) ? db.withdrawRequests : [];

    return list.filter(
        (item) =>
            String(item?.telegramId || "") === String(telegramId || "") &&
            String(item?.status || "pending").toLowerCase() === "pending"
    );
}

function getLatestWithdrawForPlayer(db, telegramId) {
    const list = Array.isArray(db?.withdrawRequests) ? db.withdrawRequests : [];

    const requests = list
        .filter((item) => String(item?.telegramId || "") === String(telegramId || ""))
        .sort((a, b) => Number(b?.createdAt || 0) - Number(a?.createdAt || 0));

    return requests[0] || null;
}

function findWithdrawById(db, withdrawId) {
    const list = Array.isArray(db?.withdrawRequests) ? db.withdrawRequests : [];

    return list.find((item) => String(item?.id || "") === String(withdrawId || "")) || null;
}

function validateWithdrawRequest(db, player, amount) {
    const safeAmount = normalizeRewardNumber(amount, 0);

    if (!player || typeof player !== "object") {
        return {
            ok: false,
            error: "Player not found"
        };
    }

    if (safeAmount <= 0) {
        return {
            ok: false,
            error: "Invalid withdraw amount"
        };
    }

    if (safeAmount < MIN_WITHDRAW_REWARD) {
        return {
            ok: false,
            error: `Minimum withdraw is ${MIN_WITHDRAW_REWARD} reward`
        };
    }

    const level = getPlayerLevel(player);
    if (level < MIN_WITHDRAW_LEVEL) {
        return {
            ok: false,
            error: `Minimum level is ${MIN_WITHDRAW_LEVEL}`
        };
    }

    const accountAgeMs = getPlayerAccountAgeMs(player);
    if (accountAgeMs < MIN_ACCOUNT_AGE_MS) {
        return {
            ok: false,
            error: "Account must be at least 24h old"
        };
    }

    const rewardBalance = getPlayerRewardBalance(player);
    if (rewardBalance < safeAmount) {
        return {
            ok: false,
            error: "Insufficient reward balance"
        };
    }

    const withdrawPending = getPlayerWithdrawPending(player);
    if (withdrawPending > 0) {
        return {
            ok: false,
            error: "You already have a pending withdraw"
        };
    }

    const pendingRequests = getPendingWithdrawsForPlayer(db, player.telegramId);
    if (pendingRequests.length > 0) {
        return {
            ok: false,
            error: "Pending withdraw request already exists"
        };
    }

    return {
        ok: true,
        amount: safeAmount,
        usdAmount: getWithdrawUsdAmount(safeAmount),
        level,
        rewardBalance,
        withdrawPending,
        accountAgeMs
    };
}

function applyCreateWithdrawToPlayer(player, amount) {
    const safeAmount = normalizeRewardNumber(amount, 0);
    const currentRewardBalance = getPlayerRewardBalance(player);
    const currentWithdrawPending = getPlayerWithdrawPending(player);

    player.rewardBalance = normalizeRewardNumber(
        currentRewardBalance - safeAmount,
        0
    );

    player.withdrawPending = normalizeRewardNumber(
        currentWithdrawPending + safeAmount,
        0
    );

    player.updatedAt = getNow();

    return player;
}

function applyPaidWithdrawToPlayer(player, withdrawRequest) {
    const amount = normalizeRewardNumber(
        withdrawRequest?.rewardAmount ?? withdrawRequest?.amount,
        0
    );

    const currentWithdrawPending = getPlayerWithdrawPending(player);
    const currentRewardWallet = getPlayerRewardWallet(player);

    player.withdrawPending = normalizeRewardNumber(
        Math.max(0, currentWithdrawPending - amount),
        0
    );

    player.rewardWallet = normalizeRewardNumber(
        currentRewardWallet + amount,
        0
    );

    player.updatedAt = getNow();

    return player;
}

function applyRejectedWithdrawToPlayer(player, withdrawRequest) {
    const amount = normalizeRewardNumber(
        withdrawRequest?.rewardAmount ?? withdrawRequest?.amount,
        0
    );

    const currentWithdrawPending = getPlayerWithdrawPending(player);
    const currentRewardBalance = getPlayerRewardBalance(player);

    player.withdrawPending = normalizeRewardNumber(
        Math.max(0, currentWithdrawPending - amount),
        0
    );

    player.rewardBalance = normalizeRewardNumber(
        currentRewardBalance + amount,
        0
    );

    player.updatedAt = getNow();

    return player;
}

function markWithdrawAsPaid(withdrawRequest, note = "") {
    if (!withdrawRequest || typeof withdrawRequest !== "object") {
        return null;
    }

    withdrawRequest.status = "paid";
    withdrawRequest.note = safeString(note || "");
    withdrawRequest.updatedAt = getNow();
    withdrawRequest.processedAt = getNow();

    return withdrawRequest;
}

function markWithdrawAsRejected(withdrawRequest, note = "") {
    if (!withdrawRequest || typeof withdrawRequest !== "object") {
        return null;
    }

    withdrawRequest.status = "rejected";
    withdrawRequest.note = safeString(note || "");
    withdrawRequest.updatedAt = getNow();
    withdrawRequest.processedAt = getNow();

    return withdrawRequest;
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

    if (String(provided) !== String(ADMIN_SECRET)) {
        res.status(403).json({ error: "Forbidden" });
        return false;
    }

    return true;
}

module.exports = {
    WITHDRAW_RATE_USD,
    MIN_WITHDRAW_REWARD,
    MIN_WITHDRAW_LEVEL,
    MIN_ACCOUNT_AGE_MS,

    createWithdrawRequest,
    getPendingWithdrawsForPlayer,
    getLatestWithdrawForPlayer,
    findWithdrawById,

    getPlayerCreatedAtMs,
    getPlayerAccountAgeMs,
    getPlayerLevel,
    getPlayerRewardBalance,
    getPlayerWithdrawPending,
    getPlayerRewardWallet,
    getWithdrawUsdAmount,

    validateWithdrawRequest,
    applyCreateWithdrawToPlayer,
    applyPaidWithdrawToPlayer,
    applyRejectedWithdrawToPlayer,
    markWithdrawAsPaid,
    markWithdrawAsRejected,

    requireAdmin
};