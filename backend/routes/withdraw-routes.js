const express = require("express");

const { readDb, writeDb } = require("../db/db");
const { LIMITS } = require("../config/game-config");
const { safeString, clamp, normalizeRewardNumber } = require("../utils/helpers");
const { getPlayerOrCreate, normalizePlayer } = require("../services/player-service");
const {
    createWithdrawRequest,
    getPendingWithdrawsForPlayer,
    getLatestWithdrawForPlayer,
    requireAdmin
} = require("../services/withdraw-service");

const router = express.Router();

router.post("/api/withdraw/request", (req, res) => {
    const db = readDb();

    const telegramId = safeString(req.body?.telegramId, "");
    const username = safeString(req.body?.username, "Gracz");
    const amount = clamp(
        normalizeRewardNumber(req.body?.amount, 0),
        0,
        LIMITS.MAX_WITHDRAW
    );

    if (!telegramId) {
        return res.status(400).json({ error: "Missing telegramId" });
    }

    if (amount < LIMITS.MIN_WITHDRAW) {
        return res.status(400).json({
            error: `Minimum withdraw is ${LIMITS.MIN_WITHDRAW.toFixed(3)} reward`
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

    if (normalizeRewardNumber(player.rewardWallet, 0) < amount) {
        return res.status(400).json({
            error: "Not enough rewardWallet balance"
        });
    }

    player.rewardWallet = clamp(
        normalizeRewardNumber(player.rewardWallet - amount, 0),
        0,
        LIMITS.MAX_REWARD_WALLET
    );

    player.withdrawPending = clamp(
        normalizeRewardNumber(player.withdrawPending + amount, 0),
        0,
        LIMITS.MAX_WITHDRAW_PENDING
    );

    const request = createWithdrawRequest({
        telegramId,
        username: player.username || username,
        amount
    });

    db.withdrawRequests.push(request);
    db.players[telegramId] = normalizePlayer(player);
    writeDb(db);

    return res.json({
        ok: true,
        request,
        player: normalizePlayer(player)
    });
});

router.get("/api/withdraw/:telegramId", (req, res) => {
    const db = readDb();
    const telegramId = String(req.params.telegramId || "");

    const requests = db.withdrawRequests
        .filter((item) => String(item.telegramId) === telegramId)
        .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

    res.json({ requests });
});

router.post("/api/withdraw/update", (req, res) => {
    if (!requireAdmin(req, res)) return;

    const db = readDb();

    const requestId = safeString(req.body?.requestId, "");
    const nextStatus = safeString(req.body?.status, "").toLowerCase();
    const note = safeString(req.body?.note, "");

    if (!requestId) {
        return res.status(400).json({ error: "Missing requestId" });
    }

    if (!["approved", "rejected"].includes(nextStatus)) {
        return res.status(400).json({ error: "Invalid status" });
    }

    const request = db.withdrawRequests.find((item) => item.id === requestId);

    if (!request) {
        return res.status(404).json({ error: "Withdraw request not found" });
    }

    if (request.status !== "pending") {
        return res.status(400).json({ error: "Request already processed" });
    }

    const player = getPlayerOrCreate(db, request.telegramId, request.username);
    const amount = normalizeRewardNumber(request.amount, 0);

    request.status = nextStatus;
    request.note = note;
    request.updatedAt = Date.now();

    if (nextStatus === "approved") {
        player.withdrawPending = clamp(
            normalizeRewardNumber(player.withdrawPending - amount, 0),
            0,
            LIMITS.MAX_WITHDRAW_PENDING
        );
    }

    if (nextStatus === "rejected") {
        player.withdrawPending = clamp(
            normalizeRewardNumber(player.withdrawPending - amount, 0),
            0,
            LIMITS.MAX_WITHDRAW_PENDING
        );
        player.rewardWallet = clamp(
            normalizeRewardNumber(player.rewardWallet + amount, 0),
            0,
            LIMITS.MAX_REWARD_WALLET
        );
    }

    db.players[player.telegramId] = normalizePlayer(player);
    writeDb(db);

    res.json({
        ok: true,
        request,
        player: normalizePlayer(player)
    });
});

module.exports = router;