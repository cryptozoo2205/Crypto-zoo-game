const { readDb, writeDb } = require("../db/db");
const { normalizePlayer } = require("./player-service");
const {
    applyPaidWithdrawToPlayer,
    markWithdrawAsPaid,
    syncPlayerWithdrawPendingFromRequests
} = require("./withdraw-service");
const {
    isAutoPayoutEnabled,
    isAutoPayoutConfigured,
    sendTonPayout
} = require("./ton-payout-service");
const { notifyWithdrawPaid } = require("../bot");

const DEFAULT_INTERVAL_MS = 15000;

let workerTimer = null;
let workerRunning = false;
let isTickInProgress = false;

function getIntervalMs() {
    const raw = Number(process.env.TON_AUTO_PAYOUT_INTERVAL_MS);
    if (Number.isFinite(raw) && raw >= 5000) {
        return Math.floor(raw);
    }

    return DEFAULT_INTERVAL_MS;
}

function ensureWithdrawCollections(db) {
    db.withdrawRequests = Array.isArray(db.withdrawRequests) ? db.withdrawRequests : [];
    db.players = db.players && typeof db.players === "object" ? db.players : {};
    return db;
}

function getPendingWithdrawRequests(db) {
    return db.withdrawRequests
        .filter((item) => String(item?.status || "pending").toLowerCase() === "pending")
        .sort((a, b) => Number(a?.createdAt || 0) - Number(b?.createdAt || 0));
}

function markWithdrawPayoutError(withdrawRequest, errorMessage) {
    if (!withdrawRequest || typeof withdrawRequest !== "object") return null;

    withdrawRequest.payoutError = String(errorMessage || "Unknown payout error").slice(0, 500);
    withdrawRequest.updatedAt = Date.now();

    return withdrawRequest;
}

async function processSingleWithdraw(db, withdrawRequest) {
    if (!withdrawRequest || typeof withdrawRequest !== "object") {
        return { ok: false, error: "Missing withdraw request" };
    }

    const telegramId = String(withdrawRequest.telegramId || "");
    if (!telegramId) {
        markWithdrawPayoutError(withdrawRequest, "Missing telegramId in withdraw request");
        return { ok: false, error: "Missing telegramId" };
    }

    const player = db.players[telegramId]
        ? normalizePlayer(db.players[telegramId])
        : null;

    if (!player) {
        markWithdrawPayoutError(withdrawRequest, "Player not found for withdraw request");
        return { ok: false, error: "Player not found" };
    }

    syncPlayerWithdrawPendingFromRequests(db, player);

    const payoutResult = await sendTonPayout(withdrawRequest);

    const appliedPlayer = applyPaidWithdrawToPlayer(player, withdrawRequest);
    if (!appliedPlayer) {
        markWithdrawPayoutError(withdrawRequest, "applyPaidWithdrawToPlayer failed");
        return { ok: false, error: "applyPaidWithdrawToPlayer failed" };
    }

    const updatedRequest = markWithdrawAsPaid(
        withdrawRequest,
        payoutResult?.note || "TON auto payout sent",
        payoutResult?.payoutTxHash || ""
    );

    if (!updatedRequest) {
        markWithdrawPayoutError(withdrawRequest, "markWithdrawAsPaid failed");
        return { ok: false, error: "markWithdrawAsPaid failed" };
    }

    updatedRequest.autoPayout = true;
    updatedRequest.autoPayoutProcessedAt = Date.now();
    updatedRequest.payoutTonAmount = Number(payoutResult?.payoutTonAmount || 0);
    updatedRequest.walletAddress = String(payoutResult?.walletAddress || "");
    updatedRequest.destinationAddress = String(payoutResult?.destinationAddress || "");
    updatedRequest.seqnoBefore = Number(payoutResult?.seqnoBefore || 0);
    updatedRequest.seqnoAfter = Number(payoutResult?.seqnoAfter || 0);
    updatedRequest.payoutError = "";

    db.players[telegramId] = normalizePlayer(appliedPlayer);

    try {
        await notifyWithdrawPaid(updatedRequest);
    } catch (notifyError) {
        console.error("notifyWithdrawPaid failed:", notifyError?.message || notifyError);
    }

    return {
        ok: true,
        request: updatedRequest,
        player: db.players[telegramId]
    };
}

async function tickWithdrawPayoutWorker() {
    if (!isAutoPayoutEnabled()) {
        return;
    }

    if (!isAutoPayoutConfigured()) {
        console.warn("TON auto payout enabled but not fully configured");
        return;
    }

    if (isTickInProgress) {
        return;
    }

    isTickInProgress = true;

    try {
        const db = ensureWithdrawCollections(readDb());

        Object.keys(db.players || {}).forEach((telegramId) => {
            if (!db.players[telegramId]) return;
            const player = normalizePlayer(db.players[telegramId]);
            syncPlayerWithdrawPendingFromRequests(db, player);
            db.players[telegramId] = normalizePlayer(player);
        });

        const pendingRequests = getPendingWithdrawRequests(db);

        if (!pendingRequests.length) {
            writeDb(db);
            return;
        }

        let changed = false;

        for (const request of pendingRequests) {
            try {
                const result = await processSingleWithdraw(db, request);

                if (result.ok) {
                    changed = true;
                    writeDb(db);
                } else if (request?.payoutError) {
                    changed = true;
                    writeDb(db);
                }
            } catch (error) {
                console.error("Auto payout processing failed:", error?.message || error);
                markWithdrawPayoutError(request, error?.message || "Auto payout failed");
                changed = true;
                writeDb(db);
            }
        }

        if (changed) {
            writeDb(db);
        } else {
            writeDb(db);
        }
    } finally {
        isTickInProgress = false;
    }
}

function startWithdrawPayoutWorker() {
    if (workerRunning) {
        return false;
    }

    workerRunning = true;

    tickWithdrawPayoutWorker().catch((error) => {
        console.error("Initial withdraw payout worker tick failed:", error?.message || error);
    });

    workerTimer = setInterval(() => {
        tickWithdrawPayoutWorker().catch((error) => {
            console.error("Withdraw payout worker tick failed:", error?.message || error);
        });
    }, getIntervalMs());

    console.log(`💸 Withdraw payout worker started (${getIntervalMs()}ms interval)`);

    return true;
}

function stopWithdrawPayoutWorker() {
    if (workerTimer) {
        clearInterval(workerTimer);
        workerTimer = null;
    }

    workerRunning = false;
}

module.exports = {
    startWithdrawPayoutWorker,
    stopWithdrawPayoutWorker,
    tickWithdrawPayoutWorker
};