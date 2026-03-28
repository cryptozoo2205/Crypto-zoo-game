const express = require("express");

const { readDb, writeDb } = require("../db/db");
const { safeString, clamp, normalizeRewardNumber } = require("../utils/helpers");
const { getPlayerOrCreate, normalizePlayer } = require("../services/player-service");
const {
    createDeposit,
    getPlayerDeposits,
    buildDepositPaymentData
} = require("../services/deposit-service");
const { requireAdmin } = require("../services/withdraw-service");

const router = express.Router();

/* =========================
   CREATE DEPOSIT
========================= */

router.post("/api/deposit/create", (req, res) => {
    const db = readDb();

    db.deposits = Array.isArray(db.deposits) ? db.deposits : [];

    const telegramId = safeString(req.body?.telegramId, "");
    const username = safeString(req.body?.username, "Gracz");
    const source = safeString(req.body?.source, "ton") || "ton";
    const asset = safeString(req.body?.asset, "TON") || "TON";
    const walletAddress = safeString(req.body?.walletAddress, "");

    const amount = clamp(
        normalizeRewardNumber(req.body?.amount, 0),
        0,
        100000
    );

    if (!telegramId) {
        return res.status(400).json({ error: "Missing telegramId" });
    }

    if (amount <= 0) {
        return res.status(400).json({ error: "Invalid deposit amount" });
    }

    const deposit = createDeposit({
        telegramId,
        username,
        amount,
        source,
        asset,
        walletAddress
    });

    const paymentData = buildDepositPaymentData(deposit);

    db.deposits.push(deposit);
    writeDb(db);

    return res.json({
        ok: true,
        deposit,
        paymentData
    });
});

/* =========================
   MARK DEPOSIT AS PENDING
   (optional after wallet send / watcher)
========================= */

router.post("/api/deposit/pending", (req, res) => {
    const db = readDb();
    db.deposits = Array.isArray(db.deposits) ? db.deposits : [];

    const depositId = safeString(req.body?.depositId, "");
    const txHash = safeString(req.body?.txHash, "");
    const note = safeString(req.body?.note, "");

    if (!depositId) {
        return res.status(400).json({ error: "Missing depositId" });
    }

    const deposit = db.deposits.find((d) => d.id === depositId);

    if (!deposit) {
        return res.status(404).json({ error: "Deposit not found" });
    }

    if (!["created", "pending"].includes(String(deposit.status || "").toLowerCase())) {
        return res.status(400).json({ error: "Deposit cannot be moved to pending" });
    }

    deposit.status = "pending";
    deposit.txHash = txHash || deposit.txHash || "";
    deposit.note = note || deposit.note || "";
    deposit.updatedAt = Date.now();

    writeDb(db);

    return res.json({
        ok: true,
        deposit
    });
});

/* =========================
   CONFIRM DEPOSIT (ADMIN / BOT / WATCHER)
========================= */

router.post("/api/deposit/confirm", (req, res) => {
    if (!requireAdmin(req, res)) return;

    const db = readDb();
    db.deposits = Array.isArray(db.deposits) ? db.deposits : [];

    const depositId = safeString(req.body?.depositId, "");
    const status = safeString(req.body?.status, "").toLowerCase();
    const note = safeString(req.body?.note, "");
    const txHash = safeString(req.body?.txHash, "");

    if (!depositId) {
        return res.status(400).json({ error: "Missing depositId" });
    }

    if (!["approved", "rejected", "expired"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
    }

    const deposit = db.deposits.find((d) => d.id === depositId);

    if (!deposit) {
        return res.status(404).json({ error: "Deposit not found" });
    }

    if (!["created", "pending"].includes(String(deposit.status || "").toLowerCase())) {
        return res.status(400).json({ error: "Already processed" });
    }

    deposit.status = status;
    deposit.note = note;
    deposit.txHash = txHash || deposit.txHash || "";
    deposit.updatedAt = Date.now();

    const player = getPlayerOrCreate(db, deposit.telegramId, deposit.username);

    if (status === "approved") {
        player.rewardWallet = normalizeRewardNumber(
            (Number(player.rewardWallet) || 0) + (Number(deposit.amount) || 0),
            0
        );
    }

    db.players[player.telegramId] = normalizePlayer(player);
    writeDb(db);

    return res.json({
        ok: true,
        deposit,
        player: normalizePlayer(player)
    });
});

/* =========================
   LIST
========================= */

router.get("/api/deposit/:telegramId", (req, res) => {
    const db = readDb();

    const telegramId = safeString(req.params.telegramId, "");

    if (!telegramId) {
        return res.status(400).json({ error: "Missing telegramId" });
    }

    const deposits = getPlayerDeposits(db, telegramId);

    return res.json({ deposits });
});

module.exports = router;