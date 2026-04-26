const { LIMITS, ADMIN_SECRET } = require("../config/game-config");
const { normalizeRewardNumber, safeString, clamp } = require("../utils/helpers");

const WITHDRAW_RATE_USD = normalizeRewardNumber(
    LIMITS?.withdrawUsdPerReward,
    0.05
);

const MIN_WITHDRAW_REWARD = normalizeRewardNumber(
    LIMITS?.minWithdrawReward,
    20
);

const MIN_WITHDRAW_LEVEL = Math.max(
    1,
    Math.floor(Number(LIMITS?.minWithdrawLevel) || 7)
);

const MIN_ACCOUNT_AGE_MS = Math.max(
    0,
    Number(LIMITS?.minWithdrawAccountAgeMs) || 0
);

const WITHDRAW_FEE_PERCENT = Math.max(
    0,
    Math.min(1, Number(LIMITS?.withdrawFeePercent) || 0.10)
);

const MAX_TON_ADDRESS_LENGTH = 128;
const MAX_NOTE_LENGTH = 500;
const MAX_TX_HASH_LENGTH = 256;
const PROCESSING_LOCK_MS = 2 * 60 * 1000;

function getNow() {
    return Date.now();
}

function getMaxRewardWallet() {
    return Number.isFinite(Number(LIMITS?.MAX_REWARD_WALLET))
        ? Number(LIMITS.MAX_REWARD_WALLET)
        : 1_000_000_000;
}

function getMaxWithdrawPending() {
    return Number.isFinite(Number(LIMITS?.MAX_WITHDRAW_PENDING))
        ? Number(LIMITS.MAX_WITHDRAW_PENDING)
        : 1_000_000_000;
}

function getMaxWithdrawAmount() {
    return Number.isFinite(Number(LIMITS?.MAX_WITHDRAW))
        ? Number(LIMITS.MAX_WITHDRAW)
        : 100_000;
}

function logSuspiciousWithdraw(message, payload = {}) {
    try {
        console.warn("[withdraw-guard]", message, payload);
    } catch (_) {}
}

function sanitizeTonAddress(value) {
    return safeString(value, "").trim().slice(0, MAX_TON_ADDRESS_LENGTH);
}

function sanitizeNote(value) {
    return safeString(value, "").trim().slice(0, MAX_NOTE_LENGTH);
}

function sanitizeTxHash(value) {
    return safeString(value, "").trim().slice(0, MAX_TX_HASH_LENGTH);
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

function getPlayerTonAddress(player) {
    return sanitizeTonAddress(player?.tonAddress);
}

function getWithdrawFeeAmount(amount) {
    const safeAmount = normalizeRewardNumber(amount, 0);
    return normalizeRewardNumber(safeAmount * WITHDRAW_FEE_PERCENT, 0);
}

function getWithdrawNetAmount(amount) {
    const safeAmount = normalizeRewardNumber(amount, 0);
    const feeAmount = getWithdrawFeeAmount(safeAmount);

    return normalizeRewardNumber(
        Math.max(0, safeAmount - feeAmount),
        0
    );
}

function getWithdrawUsdAmount(amount) {
    return normalizeRewardNumber(
        normalizeRewardNumber(amount, 0) * WITHDRAW_RATE_USD,
        0
    );
}

function normalizeWithdrawStatus(value) {
    const safe = safeString(value, "pending").toLowerCase();

    if (["pending", "processing", "paid", "rejected", "failed"].includes(safe)) {
        return safe;
    }

    return "pending";
}

function createWithdrawRequest({ telegramId, username, amount, tonAddress }) {
    const safeAmount = normalizeRewardNumber(amount, 0);
    const feeAmount = getWithdrawFeeAmount(safeAmount);
    const netAmount = getWithdrawNetAmount(safeAmount);
    const now = getNow();

    return {
        id: `wd_${now}_${Math.random().toString(36).slice(2, 8)}`,
        telegramId: String(telegramId || ""),
        username: safeString(username || "Gracz"),
        tonAddress: sanitizeTonAddress(tonAddress),

        amount: safeAmount,
        rewardAmount: safeAmount,
        grossRewardAmount: safeAmount,
        feePercent: WITHDRAW_FEE_PERCENT,
        feeRewardAmount: feeAmount,
        netRewardAmount: netAmount,

        usdAmount: getWithdrawUsdAmount(netAmount),
        grossUsdAmount: getWithdrawUsdAmount(safeAmount),
        feeUsdAmount: getWithdrawUsdAmount(feeAmount),

        rateUsdPerReward: WITHDRAW_RATE_USD,
        status: "pending",
        createdAt: now,
        updatedAt: now,
        processedAt: 0,
        processingStartedAt: 0,
        note: "",
        payoutTxHash: "",
        payoutError: ""
    };
}

function getPendingWithdrawsForPlayer(db, telegramId) {
    const list = Array.isArray(db?.withdrawRequests) ? db.withdrawRequests : [];

    return list.filter(
        (item) =>
            String(item?.telegramId || "") === String(telegramId || "") &&
            ["pending", "processing"].includes(
                normalizeWithdrawStatus(item?.status)
            )
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

function syncPlayerWithdrawPendingFromRequests(db, player) {
    if (!player || typeof player !== "object") {
        return player;
    }

    const pendingRequests = getPendingWithdrawsForPlayer(db, player.telegramId);
    const pendingTotal = normalizeRewardNumber(
        pendingRequests.reduce((sum, item) => {
            return sum + normalizeRewardNumber(
                item?.grossRewardAmount ?? item?.rewardAmount ?? item?.amount,
                0
            );
        }, 0),
        0
    );

    player.withdrawPending = clamp(
        pendingTotal,
        0,
        getMaxWithdrawPending()
    );

    return player;
}

function validateWithdrawRequest(db, player, amount) {
    const safeAmount = normalizeRewardNumber(amount, 0);

    if (!player || typeof player !== "object") {
        return {
            ok: false,
            error: "Player not found"
        };
    }

    syncPlayerWithdrawPendingFromRequests(db, player);

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

    if (safeAmount > getMaxWithdrawAmount()) {
        return {
            ok: false,
            error: "Withdraw amount too high"
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
            error: `Account too new: ${accountAgeMs}/${MIN_ACCOUNT_AGE_MS}`
        };
    }

    const tonAddress = getPlayerTonAddress(player);
    if (!tonAddress) {
        return {
            ok: false,
            error: "No TON wallet address set"
        };
    }

    const rewardWallet = getPlayerRewardWallet(player);
    if (rewardWallet < safeAmount) {
        return {
            ok: false,
            error: "Insufficient reward wallet"
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
        tonAddress,
        grossRewardAmount: safeAmount,
        feeRewardAmount: getWithdrawFeeAmount(safeAmount),
        netRewardAmount: getWithdrawNetAmount(safeAmount),
        grossUsdAmount: getWithdrawUsdAmount(safeAmount),
        feeUsdAmount: getWithdrawUsdAmount(getWithdrawFeeAmount(safeAmount)),
        usdAmount: getWithdrawUsdAmount(getWithdrawNetAmount(safeAmount)),
        level,
        rewardWallet,
        withdrawPending: getPlayerWithdrawPending(player),
        accountAgeMs
    };
}

function applyCreateWithdrawToPlayer(player, amount) {
    const safeAmount = normalizeRewardNumber(amount, 0);
    const currentRewardWallet = getPlayerRewardWallet(player);
    const currentWithdrawPending = getPlayerWithdrawPending(player);

    player.rewardWallet = clamp(
        normalizeRewardNumber(
            Math.max(0, currentRewardWallet - safeAmount),
            0
        ),
        0,
        getMaxRewardWallet()
    );

    player.withdrawPending = clamp(
        normalizeRewardNumber(
            currentWithdrawPending + safeAmount,
            0
        ),
        0,
        getMaxWithdrawPending()
    );

    player.updatedAt = getNow();

    return player;
}

function getWithdrawGrossAmount(withdrawRequest) {
    return normalizeRewardNumber(
        withdrawRequest?.grossRewardAmount ??
            withdrawRequest?.rewardAmount ??
            withdrawRequest?.amount,
        0
    );
}

function validateWithdrawProcessing(player, withdrawRequest) {
    if (!player || !withdrawRequest) {
        return {
            ok: false,
            error: "Missing player or withdraw request"
        };
    }

    const status = normalizeWithdrawStatus(withdrawRequest?.status);
    if (!["pending", "processing"].includes(status)) {
        return {
            ok: false,
            error: "Withdraw request already processed"
        };
    }

    const grossAmount = getWithdrawGrossAmount(withdrawRequest);
    const pendingAmount = getPlayerWithdrawPending(player);

    if (grossAmount <= 0) {
        logSuspiciousWithdraw("invalid_gross_amount", {
            withdrawId: withdrawRequest?.id,
            grossAmount
        });

        return {
            ok: false,
            error: "Invalid withdraw gross amount"
        };
    }

    if (pendingAmount < grossAmount) {
        logSuspiciousWithdraw("pending_less_than_gross", {
            withdrawId: withdrawRequest?.id,
            telegramId: player?.telegramId,
            pendingAmount,
            grossAmount
        });

        return {
            ok: false,
            error: "Player pending balance mismatch"
        };
    }

    return {
        ok: true,
        grossAmount,
        pendingAmount
    };
}

function applyPaidWithdrawToPlayer(player, withdrawRequest) {
    const validation = validateWithdrawProcessing(player, withdrawRequest);
    if (!validation.ok) {
        return null;
    }

    player.withdrawPending = clamp(
        normalizeRewardNumber(
            Math.max(0, validation.pendingAmount - validation.grossAmount),
            0
        ),
        0,
        getMaxWithdrawPending()
    );

    player.updatedAt = getNow();
    return player;
}

function applyRejectedWithdrawToPlayer(player, withdrawRequest) {
    const validation = validateWithdrawProcessing(player, withdrawRequest);
    if (!validation.ok) {
        return null;
    }

    const currentRewardWallet = getPlayerRewardWallet(player);

    player.withdrawPending = clamp(
        normalizeRewardNumber(
            Math.max(0, validation.pendingAmount - validation.grossAmount),
            0
        ),
        0,
        getMaxWithdrawPending()
    );

    player.rewardWallet = clamp(
        normalizeRewardNumber(
            currentRewardWallet + validation.grossAmount,
            0
        ),
        0,
        getMaxRewardWallet()
    );

    player.updatedAt = getNow();
    return player;
}

function markWithdrawAsProcessing(withdrawRequest, note = "") {
    if (!withdrawRequest || typeof withdrawRequest !== "object") {
        return null;
    }

    const currentStatus = normalizeWithdrawStatus(withdrawRequest.status);
    if (currentStatus !== "pending") {
        return null;
    }

    withdrawRequest.status = "processing";
    withdrawRequest.note = sanitizeNote(note);
    withdrawRequest.updatedAt = getNow();
    withdrawRequest.processingStartedAt = getNow();
    withdrawRequest.payoutError = "";

    return withdrawRequest;
}

function markWithdrawAsPaid(withdrawRequest, note = "", payoutTxHash = "") {
    if (!withdrawRequest || typeof withdrawRequest !== "object") {
        return null;
    }

    const currentStatus = normalizeWithdrawStatus(withdrawRequest.status);
    if (!["pending", "processing"].includes(currentStatus)) {
        logSuspiciousWithdraw("mark_paid_non_pending", {
            withdrawId: withdrawRequest?.id,
            status: currentStatus
        });
        return null;
    }

    withdrawRequest.status = "paid";
    withdrawRequest.note = sanitizeNote(note);
    withdrawRequest.payoutTxHash = sanitizeTxHash(
        payoutTxHash || withdrawRequest.payoutTxHash || ""
    );
    withdrawRequest.payoutError = "";
    withdrawRequest.updatedAt = getNow();
    withdrawRequest.processedAt = getNow();
    withdrawRequest.processingStartedAt = 0;

    return withdrawRequest;
}

function markWithdrawAsRejected(withdrawRequest, note = "") {
    if (!withdrawRequest || typeof withdrawRequest !== "object") {
        return null;
    }

    const currentStatus = normalizeWithdrawStatus(withdrawRequest.status);
    if (!["pending", "processing"].includes(currentStatus)) {
        logSuspiciousWithdraw("mark_rejected_non_pending", {
            withdrawId: withdrawRequest?.id,
            status: currentStatus
        });
        return null;
    }

    withdrawRequest.status = "rejected";
    withdrawRequest.note = sanitizeNote(note);
    withdrawRequest.updatedAt = getNow();
    withdrawRequest.processedAt = getNow();
    withdrawRequest.processingStartedAt = 0;

    return withdrawRequest;
}

function markWithdrawAsFailed(withdrawRequest, errorMessage = "") {
    if (!withdrawRequest || typeof withdrawRequest !== "object") {
        return null;
    }

    withdrawRequest.status = "failed";
    withdrawRequest.payoutError = safeString(errorMessage, "").slice(0, 500);
    withdrawRequest.updatedAt = getNow();
    withdrawRequest.processingStartedAt = 0;

    return withdrawRequest;
}

function releaseWithdrawToPending(withdrawRequest, errorMessage = "") {
    if (!withdrawRequest || typeof withdrawRequest !== "object") {
        return null;
    }

    withdrawRequest.status = "pending";
    withdrawRequest.payoutError = safeString(errorMessage, "").slice(0, 500);
    withdrawRequest.updatedAt = getNow();
    withdrawRequest.processingStartedAt = 0;

    return withdrawRequest;
}

function isWithdrawLocked(withdrawRequest) {
    if (!withdrawRequest || typeof withdrawRequest !== "object") {
        return false;
    }

    if (normalizeWithdrawStatus(withdrawRequest.status) !== "processing") {
        return false;
    }

    const startedAt = Math.max(0, Number(withdrawRequest.processingStartedAt) || 0);
    if (!startedAt) {
        return false;
    }

    return getNow() - startedAt < PROCESSING_LOCK_MS;
}

function getNextPendingWithdraw(db) {
    const list = Array.isArray(db?.withdrawRequests) ? db.withdrawRequests : [];

    const candidates = list
        .filter((item) => {
            const status = normalizeWithdrawStatus(item?.status);

            if (status === "pending") return true;
            if (status === "processing" && !isWithdrawLocked(item)) return true;

            return false;
        })
        .sort((a, b) => Number(a?.createdAt || 0) - Number(b?.createdAt || 0));

    return candidates[0] || null;
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
    WITHDRAW_FEE_PERCENT,
    PROCESSING_LOCK_MS,

    createWithdrawRequest,
    getPendingWithdrawsForPlayer,
    getLatestWithdrawForPlayer,
    getNextPendingWithdraw,
    findWithdrawById,
    syncPlayerWithdrawPendingFromRequests,

    getPlayerCreatedAtMs,
    getPlayerAccountAgeMs,
    getPlayerLevel,
    getPlayerRewardBalance,
    getPlayerWithdrawPending,
    getPlayerRewardWallet,
    getPlayerTonAddress,
    getWithdrawUsdAmount,
    getWithdrawFeeAmount,
    getWithdrawNetAmount,
    getWithdrawGrossAmount,
    normalizeWithdrawStatus,
    isWithdrawLocked,

    validateWithdrawRequest,
    validateWithdrawProcessing,
    applyCreateWithdrawToPlayer,
    applyPaidWithdrawToPlayer,
    applyRejectedWithdrawToPlayer,
    markWithdrawAsProcessing,
    markWithdrawAsPaid,
    markWithdrawAsRejected,
    markWithdrawAsFailed,
    releaseWithdrawToPending,

    requireAdmin
};