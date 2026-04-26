const express = require("express");
const nowPayments = require("../services/nowpayments-service");

const { readDb, writeDb } = require("../db/db");
const { safeString, clamp, normalizeRewardNumber } = require("../utils/helpers");
const { getPlayerOrCreate, normalizePlayer } = require("../services/player-service");
const {
    createDeposit,
    getPlayerDeposits,
    buildDepositPaymentData
} = require("../services/deposit-service");
const depositVerifier = require("../services/deposit-verifier-service");
const { requireAdmin } = require("../services/withdraw-service");


const router = express.Router();

const MAX_ACTIVE_PENDING_DEPOSITS_PER_PLAYER = 1;
const DEPOSIT_CREATE_COOLDOWN_MS = 2 * 60 * 1000;
const MAX_DEPOSIT_AMOUNT_USD = 100000;
const MIN_DEPOSIT_AMOUNT_USD = 1;
const DEFAULT_USD_TO_TON_RATE = Number(process.env.DEPOSIT_USD_TO_TON_RATE || 1) || 1;

function getUsdToTonRate() {
    return DEFAULT_USD_TO_TON_RATE > 0 ? DEFAULT_USD_TO_TON_RATE : 1;
}

function roundUsd(value) {
    return Number((Number(value) || 0).toFixed(2));
}

function roundTon(value) {
    return Number((Number(value) || 0).toFixed(6));
}

function convertUsdToTon(amountUsd) {
    return roundTon((Number(amountUsd) || 0) * getUsdToTonRate());
}

function buildUsdDepositBonusMeta(amountUsd) {
    const safeAmountUsd = Math.max(0, Number(amountUsd) || 0);

    return {
        gemsAmount: Math.floor(safeAmountUsd * 5),
        expeditionBoostAmount: Number(Math.min(1, safeAmountUsd * 0.06).toFixed(6)),
        expeditionBoostDurationMs: Math.max(0, Math.floor(safeAmountUsd * 7 * 60 * 60 * 1000))
    };
}

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

function normalizeDepositStatus(value) {
    const safe = safeString(value, "").toLowerCase();

    if (["approved", "rejected", "expired", "paid", "created", "pending"].includes(safe)) {
        return safe;
    }

    return "created";
}

function isDepositPendingLike(deposit) {
    const status = normalizeDepositStatus(deposit?.status);
    return status === "created" || status === "pending";
}

function isDepositExpired(deposit) {
    const createdAt = Math.max(0, Number(deposit?.createdAt) || 0);
    if (createdAt > 0) {
        return Date.now() > (createdAt + 2 * 60 * 1000);
    }

    const expiresAt = Math.max(0, Number(deposit?.expiresAt) || 0);
    if (expiresAt > 0) {
        return Date.now() > expiresAt;
    }

    return false;
}

function markExpiredDeposits(db) {
    db.deposits = Array.isArray(db?.deposits) ? db.deposits : [];

    let changed = false;

    db.deposits.forEach((deposit) => {
        if (isDepositPendingLike(deposit) && isDepositExpired(deposit)) {
            deposit.status = "expired";
            deposit.updatedAt = Date.now();
            changed = true;
        }
    });

    return changed;
}

function ensureFreshDeposits(db) {
    const changed = markExpiredDeposits(db);
    if (changed) {
        writeDb(db);
    }
}

function getActivePendingDepositsForPlayer(db, telegramId) {
    const deposits = Array.isArray(db?.deposits) ? db.deposits : [];

    return deposits.filter(
        (deposit) =>
            String(deposit?.telegramId || "") === String(telegramId || "") &&
            isDepositPendingLike(deposit) &&
            !isDepositExpired(deposit)
    );
}

function getLatestDepositCreateForPlayer(db, telegramId) {
    const deposits = Array.isArray(db?.deposits) ? db.deposits : [];

    const filtered = deposits
        .filter((deposit) => String(deposit?.telegramId || "") === String(telegramId || ""))
        .sort((a, b) => Number(b?.createdAt || 0) - Number(a?.createdAt || 0));

    return filtered[0] || null;
}

function buildPlayerDepositHistoryEntry(deposit, txHash = "") {
    return {
        id: safeString(deposit?.id, ""),
        depositId: safeString(deposit?.id, ""),
        txHash: safeString(txHash || deposit?.txHash, ""),
        amount: roundTon(deposit?.amount),
        tonAmount: roundTon(deposit?.tonAmount ?? deposit?.amount),
        baseAmount: roundUsd(deposit?.baseAmountUsd ?? deposit?.baseAmount),
        baseAmountUsd: roundUsd(deposit?.baseAmountUsd ?? deposit?.baseAmount),
        baseAmountTon: roundTon(deposit?.baseAmountTon),
        expectedAmount: roundTon(deposit?.expectedAmount ?? deposit?.amount),
        uniqueFraction: roundTon(deposit?.uniqueFraction),
        currency: safeString(deposit?.currency, "TON") || "TON",
        gemsAmount: Math.max(0, Number(deposit?.gemsAmount) || 0),
        expeditionBoostAmount: Math.max(
            0,
            Number(deposit?.expeditionBoostAmount) || 0
        ),
        expeditionBoostDurationMs: Math.max(
            0,
            Number(deposit?.expeditionBoostDurationMs) || 0
        ),
        paymentComment: "",
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
        amount: roundTon(deposit?.amount),
        tonAmount: roundTon(deposit?.tonAmount ?? deposit?.amount),
        baseAmount: roundUsd(deposit?.baseAmountUsd ?? deposit?.baseAmount),
        baseAmountUsd: roundUsd(deposit?.baseAmountUsd ?? deposit?.baseAmount),
        baseAmountTon: roundTon(deposit?.baseAmountTon),
        expectedAmount: roundTon(deposit?.expectedAmount ?? deposit?.amount),
        uniqueFraction: roundTon(deposit?.uniqueFraction),
        currency: safeString(deposit?.currency, "TON") || "TON",
        gemsAmount: Math.max(0, Number(deposit?.gemsAmount) || 0),
        expeditionBoostAmount: Math.max(
            0,
            Number(deposit?.expeditionBoostAmount) || 0
        ),
        expeditionBoostDurationMs: Math.max(
            0,
            Number(deposit?.expeditionBoostDurationMs) || 0
        ),
        depositId: safeString(deposit?.id, ""),
        paymentComment: "",
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

function sanitizeDepositForCreate(deposit) {
    const baseAmountUsd = clamp(
        roundUsd(
            deposit?.baseAmountUsd ??
            deposit?.amountUsd ??
            deposit?.baseAmount ??
            deposit?.amount
        ),
        0,
        MAX_DEPOSIT_AMOUNT_USD
    );

    const baseAmountTon = roundTon(
        deposit?.baseAmountTon ??
        convertUsdToTon(baseAmountUsd)
    );

    const expectedAmount = roundTon(
        deposit?.expectedAmount ??
        deposit?.tonAmount ??
        deposit?.amount ??
        baseAmountTon
    );

    const bonusMeta = buildUsdDepositBonusMeta(baseAmountUsd);

    return {
        ...deposit,
        telegramId: safeString(deposit?.telegramId, ""),
        username: safeString(deposit?.username, "Gracz"),
        amount: expectedAmount,
        tonAmount: expectedAmount,
        amountUsd: baseAmountUsd,
        baseAmount: baseAmountUsd,
        baseAmountUsd,
        baseAmountTon,
        expectedAmount,
        uniqueFraction: Math.max(0, roundTon(deposit?.uniqueFraction, 6)),
        gemsAmount: Math.max(0, Math.floor(Number(deposit?.gemsAmount ?? bonusMeta.gemsAmount) || 0)),
        expeditionBoostAmount: Math.max(
            0,
            Number(deposit?.expeditionBoostAmount ?? bonusMeta.expeditionBoostAmount) || 0
        ),
        expeditionBoostDurationMs: Math.max(
            0,
            Number(deposit?.expeditionBoostDurationMs ?? bonusMeta.expeditionBoostDurationMs) || 0
        ),
        paymentComment: "",
        status: normalizeDepositStatus(deposit?.status),
        createdAt: Math.max(0, Number(deposit?.createdAt) || Date.now()),
        updatedAt: Math.max(0, Number(deposit?.updatedAt) || Date.now()),
        expiresAt: Math.max(
            Date.now(),
            Number(deposit?.expiresAt) || (Date.now() + 2 * 60 * 1000)
        )
    };
}

function sanitizeApprovedDepositRewards(deposit) {
    const baseAmountUsd = clamp(
        roundUsd(deposit?.baseAmountUsd ?? deposit?.baseAmount),
        0,
        MAX_DEPOSIT_AMOUNT_USD
    );

    const bonusMeta = buildUsdDepositBonusMeta(baseAmountUsd);

    return {
        gemsAmount: Math.max(
            0,
            Math.floor(Number(deposit?.gemsAmount ?? bonusMeta.gemsAmount) || 0)
        ),
        expeditionBoostAmount: Math.max(
            0,
            Number(deposit?.expeditionBoostAmount ?? bonusMeta.expeditionBoostAmount) || 0
        ),
        expeditionBoostDurationMs: Math.max(
            0,
            Number(deposit?.expeditionBoostDurationMs ?? bonusMeta.expeditionBoostDurationMs) || 0
        )
    };
}

function applyApprovedDepositToPlayer(player, deposit) {
    const sanitized = sanitizeApprovedDepositRewards(deposit);
    const now = Date.now();

    player.gems = Math.max(
        0,
        Number(player.gems || 0) + sanitized.gemsAmount
    );

    player.expeditionBoost = Number(
        (
            Math.max(0, Number(player.expeditionBoost || 0)) +
            sanitized.expeditionBoostAmount
        ).toFixed(6)
    );

    const currentActiveUntil = Math.max(0, Number(player.expeditionBoostActiveUntil || 0));
    const durationBaseTime = currentActiveUntil > now ? currentActiveUntil : now;

    player.expeditionBoostActiveUntil = durationBaseTime + sanitized.expeditionBoostDurationMs;

    return player;
}

/* =========================
   CREATE DEPOSIT
========================= */

router.post("/create", async (req, res) => {
    const db = readDb();
    db.deposits = Array.isArray(db.deposits) ? db.deposits : [];

    ensureFreshDeposits(db);

    const telegramId = safeString(req.body?.telegramId, "");
    const username = safeString(req.body?.username, "Gracz");
    const source = safeString(req.body?.source, "ton") || "ton";

    const amountUsd = clamp(
        roundUsd(
            req.body?.amountUsd ??
            req.body?.baseAmountUsd ??
            req.body?.amount ??
            req.body?.baseAmount
        ),
        0,
        MAX_DEPOSIT_AMOUNT_USD
    );

    if (!telegramId) {
        return res.status(400).json({ error: "Missing telegramId" });
    }

    if (amountUsd < MIN_DEPOSIT_AMOUNT_USD) {
        return res.status(400).json({ error: "Minimal deposit is 1$" });
    }

    const activePendingDeposits = getActivePendingDepositsForPlayer(db, telegramId);
    if (activePendingDeposits.length >= MAX_ACTIVE_PENDING_DEPOSITS_PER_PLAYER) {
        return res.status(400).json({
            error: "You already have an active pending deposit",
            activeDeposit: activePendingDeposits[0] || null
        });
    }

    const latestDeposit = getLatestDepositCreateForPlayer(db, telegramId);
    if (
        latestDeposit &&
        Date.now() - Number(latestDeposit.createdAt || 0) < DEPOSIT_CREATE_COOLDOWN_MS
    ) {
        const waitMs = Math.max(
            0,
            DEPOSIT_CREATE_COOLDOWN_MS - (Date.now() - Number(latestDeposit.createdAt || 0))
        );

        return res.status(400).json({
            error: "Deposit create cooldown active",
            waitMs
        });
    }

    const deposit = sanitizeDepositForCreate(
        createDeposit({
            telegramId,
            username,
            amountUsd,
            baseAmountUsd: amountUsd,
            source
        })
    );

    db.deposits.push(deposit);
    writeDb(db);

    let payment = buildDepositPaymentData(deposit);

    if (String(process.env.NOWPAYMENTS_ENABLED || "").toLowerCase() === "true") {
        try {
            const nowPayment = await nowPayments.createPayment({
                amountUsd: amountUsd,
                orderId: String(deposit.id),
                orderDescription: `CryptoZoo deposit ${amountUsd} USD`
            });

            payment = {
                ...payment,
                provider: "NOWPAYMENTS",
                paymentId: nowPayment.payment_id || nowPayment.id || null,
                paymentUrl: nowPayment.invoice_url || ("https://nowpayments.io/payment/?iid=" + (nowPayment.id || nowPayment.payment_id || "")),
                payAddress: nowPayment.pay_address || "",
                payAmount: Number(nowPayment.pay_amount || 0),
                payCurrency: String(nowPayment.pay_currency || "ton").toUpperCase(),
                network: String(nowPayment.network || "TON").toUpperCase(),
                expiresAt: nowPayment.expiration_estimate_date
                    ? new Date(nowPayment.expiration_estimate_date).getTime()
                    : payment.expiresAt
            };

            deposit.provider = "NOWPAYMENTS";
            deposit.paymentId = nowPayment.payment_id || nowPayment.id || null;
            deposit.paymentUrl = nowPayment.invoice_url || "";
            deposit.walletAddress = nowPayment.pay_address || "";
            deposit.amount = Number(nowPayment.pay_amount || deposit.amount || 0);
            deposit.currency = String(nowPayment.pay_currency || "TON").toUpperCase();
            deposit.network = String(nowPayment.network || "TON").toUpperCase();
            deposit.updatedAt = Date.now();

            writeDb(db);
        } catch (error) {
            console.error("NOWPayments create error:", error);
        }
    }

    return res.json({
        ok: true,
        deposit,
        payment
    });
});

/* =========================
   GET PAYMENT DATA
========================= */

router.post("/payment-data", (req, res) => {
    const db = readDb();
    db.deposits = Array.isArray(db.deposits) ? db.deposits : [];

    ensureFreshDeposits(db);

    const depositId = safeString(req.body?.depositId, "");

    if (!depositId) {
        return res.status(400).json({ error: "Missing depositId" });
    }

    const deposit = db.deposits.find((d) => String(d.id) === String(depositId));

    if (!deposit) {
        return res.status(404).json({ error: "Deposit not found" });
    }

    return res.json({
        ok: true,
        payment: buildDepositPaymentData(deposit)
    });
});

/* =========================
   VERIFY SINGLE DEPOSIT
========================= */

router.post("/verify", async (req, res) => {
    try {
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

        if (
            String(deposit.status || "").toLowerCase() === "paid" ||
            deposit.rewardAppliedAt
        ) {
            deposit.rewardConfirmed = true;
            writeDb(db);
            return res.json({
                ok: true,
                matched: true,
                alreadyProcessed: true,
                deposit
            });
        }

        if (!deposit.paymentId) {
            return res.json({
                ok: true,
                matched: false,
                message: "Missing NOWPayments paymentId",
                deposit
            });
        }

        const remote = await nowPayments.getPaymentStatus(deposit.paymentId);
        const remoteStatus = safeString(remote?.payment_status || remote?.paymentStatus, "").toLowerCase();

        deposit.remoteStatus = remoteStatus || deposit.remoteStatus || "";
        deposit.updatedAt = Date.now();

        const paidStatuses = ["finished", "confirmed", "sending", "partially_paid"];

        if (!paidStatuses.includes(remoteStatus)) {
            writeDb(db);
            return res.json({
                ok: true,
                matched: false,
                message: `Payment status: ${remoteStatus || "unknown"}`,
                remote,
                deposit
            });
        }

        const telegramId = safeString(deposit.telegramId, "");
        const players = db.players && typeof db.players === "object" ? db.players : {};
        const player = players[telegramId];

        if (!player) {
            writeDb(db);
            return res.status(404).json({
                error: "Player not found",
                deposit
            });
        }

        const gemsAmount = Math.max(0, Number(deposit.gemsAmount || 0));
        const boostAmount = Math.max(0, Number(deposit.expeditionBoostAmount || 0));
        const boostDurationMs = Math.max(0, Number(deposit.expeditionBoostDurationMs || 0));

        player.gems = Math.max(0, Number(player.gems || 0)) + gemsAmount;

        if (boostAmount > 0 && boostDurationMs > 0) {
            player.expeditionBoostAmount = Math.max(
                Number(player.expeditionBoostAmount || 0),
                boostAmount
            );
            const nowMs = Date.now();
            const currentBoostUntil = Math.max(0, Number(player.expeditionBoostActiveUntil || 0));
            const boostBaseTime = currentBoostUntil > nowMs ? currentBoostUntil : nowMs;

            player.expeditionBoostActiveUntil = boostBaseTime + boostDurationMs;
        }

        deposit.status = "paid";
        deposit.rewardAppliedAt = Date.now();
        deposit.rewardConfirmed = true;
        deposit.txHash = safeString(remote?.payin_hash || remote?.payout_hash || deposit.txHash || "");
        deposit.actualPaid = Number(remote?.actually_paid || remote?.pay_amount || deposit.amount || 0);

        player.depositHistory = Array.isArray(player.depositHistory) ? player.depositHistory : [];
        player.depositHistory.unshift({
            id: deposit.id,
            paymentId: deposit.paymentId,
            provider: "NOWPAYMENTS",
            status: "paid",
            amountUsd: deposit.amountUsd,
            amount: deposit.amount,
            tonAmount: deposit.tonAmount,
            gemsAmount,
            expeditionBoostAmount: boostAmount,
            expeditionBoostDurationMs: boostDurationMs,
            createdAt: deposit.createdAt,
            paidAt: deposit.rewardAppliedAt
        });

        db.players = players;
        writeDb(db);

        return res.json({
            ok: true,
            matched: true,
            remoteStatus,
            deposit,
            player
        });
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

router.post("/verify-player", async (req, res) => {
    try {
        const telegramId = safeString(req.body?.telegramId, "");

        if (!telegramId) {
            return res.status(400).json({ error: "Missing telegramId" });
        }

        const result = await depositVerifier.verifyPendingDepositsForPlayer(telegramId);

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

router.post("/confirm", (req, res) => {
    if (!requireAdmin(req, res)) return;

    const db = readDb();
    db.deposits = Array.isArray(db.deposits) ? db.deposits : [];
    db.players = db.players && typeof db.players === "object" ? db.players : {};

    ensureFreshDeposits(db);

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

    deposit.status = normalizeDepositStatus(deposit.status);

    if (deposit.status !== "pending" && deposit.status !== "created") {
        return res.status(400).json({ error: "Already processed" });
    }

    const player = getPlayerOrCreate(db, deposit.telegramId, deposit.username);
    ensurePlayerCollections(player);

    deposit.status = status;
    deposit.note = note;
    deposit.paymentComment = "";
    deposit.updatedAt = Date.now();

    if (status === "approved") {
        deposit.approvedAt = Date.now();

        applyApprovedDepositToPlayer(player, deposit);
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

router.get("/:telegramId", (req, res) => {
    const db = readDb();
    db.deposits = Array.isArray(db.deposits) ? db.deposits : [];

    ensureFreshDeposits(db);

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