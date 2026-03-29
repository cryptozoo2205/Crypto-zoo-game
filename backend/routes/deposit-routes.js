const express = require("express");

const { readDb, writeDb } = require("../db/db");
const { safeString, clamp, normalizeRewardNumber } = require("../utils/helpers");
const { getPlayerOrCreate, normalizePlayer } = require("../services/player-service");
const {
    createDeposit,
    getPlayerDeposits,
    buildDepositPaymentData
} = require("../services/deposit-service");
const {
    verifySingleDepositById,
    verifyPendingDepositsForPlayer
} = require("../services/deposit-verifier-service");
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
        source
    });

    db.deposits.push(deposit);
    writeDb(db);

    return res.json({
        ok: true,
        deposit,
        payment: buildDepositPaymentData(deposit)
    });
});

/* =========================
   GET PAYMENT DATA
========================= */

router.post("/api/deposit/payment-data", (req, res) => {
    const db = readDb();

    db.deposits = Array.isArray(db.deposits) ? db.deposits : [];

    const depositId = safeString(req.body?.depositId, "");

    if (!depositId) {
        return res.status(400).json({ error: "Missing depositId" });
    }

    const deposit = db.deposits.find((d) => String(d.id) === String(depositId));

    if (!deposit) {
        return res.status(404).json({ error: "Deposit not found" });
    }

    const paymentData = buildDepositPaymentData(deposit);

    return res.json({
        ok: true,
        payment: paymentData
    });
});

/* =========================
   VERIFY SINGLE DEPOSIT
========================= */

router.post("/api/deposit/verify", async (req, res) => {
    try {
        const depositId = safeString(req.body?.depositId, "");

        if (!depositId) {
            return res.status(400).json({ error: "Missing depositId" });
        }

        const result = await verifySingleDepositById(depositId);

        if (!result.ok) {
            return res.status(404).json({ error: result.error || "Verify failed" });
        }

        return res.json(result);
    } catch (error) {
        console.error("Deposit verify error:", error);
        return res.status(500).json({ error: error.message || "Deposit verify failed" });
    }
});

/* =========================
   VERIFY PLAYER PENDING DEPOSITS
========================= */

router.post("/api/deposit/verify-player", async (req, res) => {
    try {
        const telegramId = safeString(req.body?.telegramId, "");

        if (!telegramId) {
            return res.status(400).json({ error: "Missing telegramId" });
        }

        const result = await verifyPendingDepositsForPlayer(telegramId);
        return res.json(result);
    } catch (error) {
        console.error("Player deposit verify error:", error);
        return res.status(500).json({ error: error.message || "Player deposit verify failed" });
    }
});

/* =========================
   CONFIRM DEPOSIT (ADMIN / BOT)
========================= */

router.post("/api/deposit/confirm", (req, res) => {
    if (!requireAdmin(req, res)) return;

    const db = readDb();
    db.deposits = Array.isArray(db.deposits) ? db.deposits : [];

    const depositId = safeString(req.body?.depositId, "");
    const status = safeString(req.body?.status, "").toLowerCase();
    const note = safeString(req.body?.note, "");

    if (!depositId) {
        return res.status(400).json({ error: "Missing depositId" });
    }

    if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
    }

    const deposit = db.deposits.find((d) => String(d.id) === String(depositId));

    if (!deposit) {
        return res.status(404).json({ error: "Deposit not found" });
    }

    if (deposit.status !== "pending" && deposit.status !== "created") {
        return res.status(400).json({ error: "Already processed" });
    }

    deposit.status = status;
    deposit.note = note;
    deposit.updatedAt = Date.now();

    const player = getPlayerOrCreate(db, deposit.telegramId, deposit.username);

    if (status === "approved") {
        player.gems = Math.max(
            0,
            Number(player.gems || 0) + Math.max(0, Number(deposit.gemsAmount) || 0)
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