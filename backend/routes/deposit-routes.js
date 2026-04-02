const express = require("express");

const { readDb, writeDb } = require("../db/db");
const { safeString, clamp, normalizeRewardNumber } = require("../utils/helpers");
const { getPlayerOrCreate, normalizePlayer } = require("../services/player-service");
const {
    createDeposit,
    getPlayerDeposits,
    buildDepositPaymentData,
    applyDepositExpeditionBoost
} = require("../services/deposit-service");
const {
    verifySingleDepositById,
    verifyPendingDepositsForPlayer
} = require("../services/deposit-verifier-service");
const { requireAdmin } = require("../services/withdraw-service");

const router = express.Router();

function ensurePlayerCollections(player) {
    player.depositHistory = Array.isArray(player.depositHistory)
        ? player.depositHistory
        : [];
    player.deposits = Array.isArray(player.deposits) ? player.deposits : [];
    player.transactions = Array.isArray(player.transactions) ? player.transactions : [];
    player.withdrawHistory = Array.isArray(player.withdrawHistory)
        ? player.withdrawHistory
        : [];
    player.payoutHistory = Array.isArray(player.payoutHistory)
        ? player.payoutHistory
        : [];
    player.referrals = Array.isArray(player.referrals) ? player.referrals : [];
    player.referralHistory = Array.isArray(player.referralHistory)
        ? player.referralHistory
        : [];

    return player;
}

function hasItemByKey(list, key, value) {
    const safeList = Array.isArray(list) ? list : [];
    const safeValue = String(value || "");

    if (!safeValue) return false;

    return safeList.some((item) => String(item?.[key] || "") === safeValue);
}

function buildPlayerDepositHistoryEntry(deposit, txHash = "") {
    return {
        id: safeString(deposit?.id, ""),
        depositId: safeString(deposit?.id, ""),
        txHash: safeString(txHash || deposit?.txHash, ""),
        amount: normalizeRewardNumber(deposit?.amount, 0),
        currency: safeString(deposit?.currency, "TON") || "TON",
        gemsAmount: Math.max(0, Number(deposit?.gemsAmount) || 0),
        expeditionBoostAmount: Math.max(
            0,
            Number(deposit?.expeditionBoostAmount) || 0
        ),
        paymentComment: safeString(deposit?.paymentComment, ""),
        status: safeString(deposit?.status, "approved") || "approved",
        walletAddress: safeString(deposit?.walletAddress, ""),
        network: safeString(deposit?.network, "TON") || "TON",
        source: safeString(deposit?.source, "deposit-routes") || "deposit-routes",
        note: safeString(deposit?.note, ""),
        createdAt: Math.max(0, Number(deposit?.createdAt) || Date.now()),
        approvedAt: Math.max(0, Number(deposit?.approvedAt) || Date.now()),
        updatedAt: Math.max(0, Number(deposit?.updatedAt) || Date.now())
    };
}

function buildPlayerTransactionEntry(deposit, txHash = "") {
    return {
        id: safeString(txHash || deposit?.txHash, "") || safeString(deposit?.id, ""),
        txHash: safeString(txHash || deposit?.txHash, ""),
        type: "deposit",
        status: safeString(deposit?.status, "approved") || "approved",
        amount: normalizeRewardNumber(deposit?.amount, 0),
        currency: safeString(deposit?.currency, "TON") || "TON",
        gemsAmount: Math.max(0, Number(deposit?.gemsAmount) || 0),
        expeditionBoostAmount: Math.max(
            0,
            Number(deposit?.expeditionBoostAmount) || 0
        ),
        depositId: safeString(deposit?.id, ""),
        paymentComment: safeString(deposit?.paymentComment, ""),
        note: safeString(deposit?.note, ""),
        createdAt: Math.max(0, Number(deposit?.updatedAt) || Date.now()),
        updatedAt: Math.max(0, Number(deposit?.updatedAt) || Date.now())
    };
}

function attachDepositToPlayer(player, deposit) {
    ensurePlayerCollections(player);

    const historyEntry = buildPlayerDepositHistoryEntry(deposit, deposit?.txHash || "");
    const transactionEntry = buildPlayerTransactionEntry(deposit, deposit?.txHash || "");

    if (!hasItemByKey(player.depositHistory, "depositId", historyEntry.depositId)) {
        player.depositHistory.unshift(historyEntry);
    }

    if (!hasItemByKey(player.deposits, "depositId", historyEntry.depositId)) {
        player.deposits.unshift(historyEntry);
    }

    if (transactionEntry.txHash) {
        if (!hasItemByKey(player.transactions, "txHash", transactionEntry.txHash)) {
            player.transactions.unshift(transactionEntry);
        }
    } else if (!hasItemByKey(player.transactions, "depositId", transactionEntry.depositId)) {
        player.transactions.unshift(transactionEntry);
    }

    return player;
}

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
            return res.json({
                ok: true,
                matched: false,
                message: result.error || "Deposit not matched yet",
                duplicateTxHash: !!result.duplicateTxHash,
                deposit: result.deposit || null,
                player: result.player || null
            });
        }

        return res.json(result);
    } catch (error) {
        console.error("Deposit verify error:", error);
        return res.status(500).json({
            error: error.message || "Deposit verify failed"
        });
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

        return res.json({
            ok: true,
            checked: result.checked || 0,
            matched: result.matched || 0,
            skippedDuplicates: result.skippedDuplicates || 0,
            player: result.player || null
        });
    } catch (error) {
        console.error("Player deposit verify error:", error);
        return res.status(500).json({
            error: error.message || "Player deposit verify failed"
        });
    }
});

/* =========================
   CONFIRM DEPOSIT (ADMIN / BOT)
========================= */

router.post("/api/deposit/confirm", (req, res) => {
    if (!requireAdmin(req, res)) return;

    const db = readDb();
    db.deposits = Array.isArray(db.deposits) ? db.deposits : [];
    db.players = db.players && typeof db.players === "object" ? db.players : {};

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
    ensurePlayerCollections(player);

    if (status === "approved") {
        const gemsToAdd = Math.max(0, Number(deposit.gemsAmount) || 0);

        player.gems = Math.max(
            0,
            Number(player.gems || 0) + gemsToAdd
        );

        player.expeditionBoost = applyDepositExpeditionBoost(
            player.expeditionBoost,
            deposit.amount
        );

        deposit.approvedAt = Date.now();

        attachDepositToPlayer(player, deposit);
    }

    db.players[player.telegramId] = normalizePlayer(player);
    writeDb(db);

    return res.json({
        ok: true,
        deposit,
        player: normalizePlayer(db.players[player.telegramId])
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

    return res.json({
        ok: true,
        deposits: Array.isArray(deposits) ? deposits : []
    });
});

module.exports = router;