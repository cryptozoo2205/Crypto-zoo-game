const express = require("express");

const { readDb, writeDb } = require("../db/db");
const { LIMITS } = require("../config/game-config");
const { safeString, clamp, normalizeRewardNumber } = require("../utils/helpers");
const { getPlayerOrCreate, normalizePlayer } = require("../services/player-service");
const {
    WITHDRAW_RATE_USD,
    MIN_WITHDRAW_REWARD,
    MIN_WITHDRAW_LEVEL,
    MIN_ACCOUNT_AGE_MS,
    createWithdrawRequest,
    getPendingWithdrawsForPlayer,
    getLatestWithdrawForPlayer,
    findWithdrawById,
    validateWithdrawRequest,
    applyCreateWithdrawToPlayer,
    applyPaidWithdrawToPlayer,
    applyRejectedWithdrawToPlayer,
    markWithdrawAsPaid,
    markWithdrawAsRejected,
    requireAdmin
} = require("../services/withdraw-service");
const {
    notifyNewWithdraw,
    notifyWithdrawPaid,
    notifyWithdrawRejected
} = require("../bot");

const router = express.Router();

router.post("/api/withdraw/set-wallet", (req, res) => {
    const db = readDb();

    const telegramId = safeString(req.body?.telegramId, "");
    const username = safeString(req.body?.username, "Gracz");
    const tonAddress = safeString(req.body?.tonAddress || req.body?.address, "");

    if (!telegramId) {
        return res.status(400).json({ error: "Missing telegramId" });
    }

    if (!tonAddress) {
        return res.status(400).json({ error: "Missing tonAddress" });
    }

    const player = getPlayerOrCreate(db, telegramId, username);
    player.tonAddress = tonAddress;
    player.updatedAt = Date.now();

    db.players[telegramId] = normalizePlayer(player);
    writeDb(db);

    return res.json({
        ok: true,
        tonAddress: db.players[telegramId].tonAddress,
        player: db.players[telegramId]
    });
});

router.get("/api/withdraw/wallet/:telegramId", (req, res) => {
    const db = readDb();
    const telegramId = safeString(req.params.telegramId, "");

    if (!telegramId) {
        return res.status(400).json({ error: "Missing telegramId" });
    }

    const player = getPlayerOrCreate(db, telegramId, "Gracz");

    return res.json({
        ok: true,
        tonAddress: safeString(player.tonAddress, ""),
        player: normalizePlayer(player)
    });
});

router.post("/api/withdraw/request", async (req, res) => {
    const db = readDb();

    const telegramId = safeString(req.body?.telegramId, "");
    const username = safeString(req.body?.username, "Gracz");
    const rawAmount = normalizeRewardNumber(req.body?.amount, 0);

    if (!telegramId) {
        return res.status(400).json({ error: "Missing telegramId" });
    }

    const amount = clamp(rawAmount, 0, LIMITS.MAX_WITHDRAW);

    if (amount <= 0) {
        return res.status(400).json({ error: "Invalid withdraw amount" });
    }

    if (amount < MIN_WITHDRAW_REWARD) {
        return res.status(400).json({
            error: `Minimum withdraw is ${MIN_WITHDRAW_REWARD.toFixed(3)} reward`
        });
    }

    if (amount > LIMITS.MAX_WITHDRAW) {
        return res.status(400).json({
            error: `Maximum withdraw is ${LIMITS.MAX_WITHDRAW.toFixed(3)} reward`
        });
    }

    const player = getPlayerOrCreate(db, telegramId, username);

    const pendingRequests = getPendingWithdrawsForPlayer(db, telegramId);
    if (pendingRequests.length > 0) {
        return res.status(400).json({
            error: "You already have a pending withdraw request"
        });
    }

    const latestRequest = getLatestWithdrawForPlayer(db, telegramId);
    if (
        latestRequest &&
        Date.now() - Number(latestRequest.createdAt || 0) < LIMITS.WITHDRAW_COOLDOWN_MS
    ) {
        return res.status(400).json({
            error: "Withdraw cooldown active, try again later"
        });
    }

    const validation = validateWithdrawRequest(db, player, amount);
    if (!validation.ok) {
        return res.status(400).json({
            error: validation.error
        });
    }

    applyCreateWithdrawToPlayer(player, amount);

    const request = createWithdrawRequest({
        telegramId,
        username: player.username || username,
        amount,
        tonAddress: player.tonAddress
    });

    db.withdrawRequests.push(request);
    db.players[telegramId] = normalizePlayer(player);
    writeDb(db);

    try {
        await notifyNewWithdraw(request);
    } catch (error) {
        console.error("notifyNewWithdraw failed:", error?.message || error);
    }

    return res.json({
        ok: true,
        request,
        player: normalizePlayer(player),
        payoutConfig: {
            rewardToUsdRate: WITHDRAW_RATE_USD,
            minWithdrawReward: MIN_WITHDRAW_REWARD,
            minWithdrawLevel: MIN_WITHDRAW_LEVEL,
            minAccountAgeMs: MIN_ACCOUNT_AGE_MS
        }
    });
});

router.get("/api/withdraw/:telegramId", (req, res) => {
    const db = readDb();
    const telegramId = String(req.params.telegramId || "");

    const requests = (Array.isArray(db.withdrawRequests) ? db.withdrawRequests : [])
        .filter((item) => String(item.telegramId || "") === telegramId)
        .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

    res.json({
        ok: true,
        requests
    });
});

router.post("/api/withdraw/update", async (req, res) => {
    if (!requireAdmin(req, res)) return;

    const db = readDb();

    const requestId = safeString(req.body?.requestId, "");
    const nextStatus = safeString(req.body?.status, "").toLowerCase();
    const note = safeString(req.body?.note, "");
    const payoutTxHash = safeString(req.body?.payoutTxHash, "");

    if (!requestId) {
        return res.status(400).json({ error: "Missing requestId" });
    }

    if (!["paid", "rejected"].includes(nextStatus)) {
        return res.status(400).json({ error: "Invalid status" });
    }

    const request = findWithdrawById(db, requestId);

    if (!request) {
        return res.status(404).json({ error: "Withdraw request not found" });
    }

    if (String(request.status || "pending").toLowerCase() !== "pending") {
        return res.status(400).json({ error: "Request already processed" });
    }

    const player = getPlayerOrCreate(db, request.telegramId, request.username);

    if (nextStatus === "paid") {
        applyPaidWithdrawToPlayer(player, request);
        markWithdrawAsPaid(request, note, payoutTxHash);
    }

    if (nextStatus === "rejected") {
        applyRejectedWithdrawToPlayer(player, request);
        markWithdrawAsRejected(request, note);
    }

    db.players[player.telegramId] = normalizePlayer(player);
    writeDb(db);

    try {
        if (nextStatus === "paid") {
            await notifyWithdrawPaid(request);
        }

        if (nextStatus === "rejected") {
            await notifyWithdrawRejected(request);
        }
    } catch (error) {
        console.error("withdraw notification failed:", error?.message || error);
    }

    return res.json({
        ok: true,
        request,
        player: normalizePlayer(player)
    });
});

module.exports = router;