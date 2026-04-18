const { readDb, writeDb } = require("../db/db");
const { normalizeRewardNumber, safeString, clamp } = require("../utils/helpers");
const { getPlayerOrCreate, normalizePlayer } = require("./player-service");
const {
    TON_RECEIVER_WALLET,
    UNIQUE_AMOUNT_DECIMALS,
    getDepositGemsAmount,
    getDepositExpeditionBoostAmount,
    getDepositExpeditionBoostDurationMs
} = require("./deposit-service");
const { LIMITS } = require("../config/game-config");

const TONCENTER_BASE_URL = "https://toncenter.com/api/v2";
const MAX_DEPOSIT_GEMS = 500000;
const MAX_DEPOSIT_AMOUNT_USD = 100000;
const AMOUNT_MATCH_TOLERANCE = Number(
    (1 / Math.pow(10, UNIQUE_AMOUNT_DECIMALS)).toFixed(UNIQUE_AMOUNT_DECIMALS)
);

function getReceiverWalletAddress() {
    return safeString(
        process.env.TON_DEPOSIT_WALLET ||
            process.env.TON_RECEIVER_WALLET ||
            process.env.TON_WALLET_ADDRESS ||
            TON_RECEIVER_WALLET,
        TON_RECEIVER_WALLET
    );
}

function getTonCenterApiKey() {
    return safeString(process.env.TONCENTER_API_KEY || "", "");
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
    const expiresAt = Math.max(0, Number(deposit?.expiresAt) || 0);
    if (!expiresAt) return false;
    return Date.now() > expiresAt;
}

function markExpiredDeposits(db) {
    db.deposits = Array.isArray(db.deposits) ? db.deposits : [];

    let changed = false;

    db.deposits.forEach((deposit) => {
        if (isDepositPendingLike(deposit) && isDepositExpired(deposit)) {
            deposit.status = "expired";
            deposit.updatedAt = Date.now();
            changed = true;
        }
    });

    if (changed) {
        writeDb(db);
    }

    return changed;
}

async function fetchTonTransactions(address, limit = 30) {
    const safeAddress = safeString(address, "");
    if (!safeAddress) {
        throw new Error("Missing TON receiver wallet");
    }

    const apiKey = getTonCenterApiKey();
    const params = new URLSearchParams({
        address: safeAddress,
        limit: String(Math.max(1, Math.min(100, Number(limit) || 30)))
    });

    if (apiKey) {
        params.set("api_key", apiKey);
    }

    const response = await fetch(
        `${TONCENTER_BASE_URL}/getTransactions?${params.toString()}`,
        {
            method: "GET"
        }
    );

    if (!response.ok) {
        throw new Error(`TONCENTER HTTP ${response.status}`);
    }

    const json = await response.json();

    if (!json?.ok) {
        throw new Error(json?.error || "TONCENTER request failed");
    }

    return Array.isArray(json?.result) ? json.result : [];
}

function extractTransactionHash(tx) {
    return safeString(tx?.transaction_id?.hash || tx?.hash || "", "");
}

function extractTransactionAmountTon(tx) {
    const rawValue = Number(tx?.in_msg?.value) || Number(tx?.in_msg?.amount) || 0;

    if (!rawValue) return 0;

    return normalizeRewardNumber(rawValue / 1e9, 0);
}

function isTransactionSuccessful(tx) {
    if (tx?.aborted === true) return false;
    return true;
}

function roundAmount(amount) {
    const safe = Number(amount) || 0;
    return Number(safe.toFixed(UNIQUE_AMOUNT_DECIMALS));
}

function amountsMatch(expectedAmount, txAmount) {
    const safeExpected = roundAmount(expectedAmount);
    const safeTx = roundAmount(txAmount);
    return Math.abs(safeExpected - safeTx) <= AMOUNT_MATCH_TOLERANCE;
}

function isTxHashAlreadyUsed(db, txHash, currentDepositId = "") {
    const safeTxHash = safeString(txHash, "");
    if (!safeTxHash) return false;

    const deposits = Array.isArray(db?.deposits) ? db.deposits : [];

    return deposits.some((deposit) => {
        const depositTxHash = safeString(deposit?.txHash, "");
        const depositId = safeString(deposit?.id, "");

        if (!depositTxHash) return false;
        if (depositId === String(currentDepositId || "")) return false;

        return depositTxHash === safeTxHash;
    });
}

function findApprovedDepositByExactAmount(db, expectedAmount, currentDepositId = "") {
    const safeExpected = roundAmount(expectedAmount);
    const deposits = Array.isArray(db?.deposits) ? db.deposits : [];

    return (
        deposits.find((deposit) => {
            const depositId = safeString(deposit?.id, "");
            if (depositId === String(currentDepositId || "")) return false;

            return (
                normalizeDepositStatus(deposit?.status) === "approved" &&
                amountsMatch(
                    Number(deposit?.expectedAmount ?? deposit?.amount ?? 0),
                    safeExpected
                )
            );
        }) || null
    );
}

function matchDepositToTransaction(db, deposit, tx) {
    if (!deposit || !tx) return false;

    const txHash = extractTransactionHash(tx);
    const txAmount = extractTransactionAmountTon(tx);
    const expectedAmount = Number(deposit?.expectedAmount ?? deposit?.amount ?? 0);

    if (expectedAmount <= 0 || txAmount <= 0) {
        return false;
    }

    if (!amountsMatch(expectedAmount, txAmount)) {
        return false;
    }

    if (!isTransactionSuccessful(tx)) {
        return false;
    }

    if (isTxHashAlreadyUsed(db, txHash, deposit.id)) {
        return false;
    }

    const approvedWithSameAmount = findApprovedDepositByExactAmount(
        db,
        expectedAmount,
        deposit.id
    );

    if (approvedWithSameAmount) {
        return false;
    }

    return true;
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

function buildPlayerDepositHistoryEntry(deposit, txHash) {
    return {
        id: safeString(deposit?.id, ""),
        depositId: safeString(deposit?.id, ""),
        txHash: safeString(txHash, ""),
        amount: normalizeRewardNumber(deposit?.amount, 0),
        tonAmount: normalizeRewardNumber(deposit?.tonAmount ?? deposit?.amount, 0),
        baseAmount: normalizeRewardNumber(deposit?.baseAmountUsd ?? deposit?.baseAmount, 0),
        baseAmountUsd: normalizeRewardNumber(deposit?.baseAmountUsd ?? deposit?.baseAmount, 0),
        baseAmountTon: normalizeRewardNumber(deposit?.baseAmountTon, 0),
        expectedAmount: normalizeRewardNumber(deposit?.expectedAmount ?? deposit?.amount, 0),
        uniqueFraction: normalizeRewardNumber(deposit?.uniqueFraction, 0),
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
        status: "approved",
        walletAddress: safeString(deposit?.walletAddress, ""),
        network: safeString(deposit?.network, "TON") || "TON",
        source: "deposit-verifier",
        createdAt: Math.max(0, Number(deposit?.createdAt) || Date.now()),
        approvedAt: Math.max(0, Number(deposit?.approvedAt) || Date.now()),
        updatedAt: Date.now()
    };
}

function buildPlayerTransactionEntry(deposit, txHash) {
    return {
        id: safeString(txHash, "") || safeString(deposit?.id, ""),
        txHash: safeString(txHash, ""),
        type: "deposit",
        status: "approved",
        amount: normalizeRewardNumber(deposit?.amount, 0),
        tonAmount: normalizeRewardNumber(deposit?.tonAmount ?? deposit?.amount, 0),
        baseAmount: normalizeRewardNumber(deposit?.baseAmountUsd ?? deposit?.baseAmount, 0),
        baseAmountUsd: normalizeRewardNumber(deposit?.baseAmountUsd ?? deposit?.baseAmount, 0),
        baseAmountTon: normalizeRewardNumber(deposit?.baseAmountTon, 0),
        expectedAmount: normalizeRewardNumber(deposit?.expectedAmount ?? deposit?.amount, 0),
        uniqueFraction: normalizeRewardNumber(deposit?.uniqueFraction, 0),
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
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
}

function attachApprovedDepositToPlayer(player, deposit, txHash) {
    ensurePlayerCollections(player);

    const historyEntry = buildPlayerDepositHistoryEntry(deposit, txHash);
    const transactionEntry = buildPlayerTransactionEntry(deposit, txHash);

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

function sanitizeApprovedDeposit(deposit) {
    const baseAmountUsd = clamp(
        normalizeRewardNumber(deposit?.baseAmountUsd ?? deposit?.baseAmount, 0),
        0,
        MAX_DEPOSIT_AMOUNT_USD
    );

    const amountTon = clamp(
        normalizeRewardNumber(deposit?.amount ?? deposit?.tonAmount, 0),
        0,
        MAX_DEPOSIT_AMOUNT_USD * 100000
    );

    const expectedAmount = clamp(
        normalizeRewardNumber(deposit?.expectedAmount ?? deposit?.amount ?? deposit?.tonAmount, 0),
        0,
        MAX_DEPOSIT_AMOUNT_USD * 100000
    );

    const gemsAmount = clamp(
        Math.floor(
            Number(
                deposit?.gemsAmount ??
                getDepositGemsAmount(baseAmountUsd)
            ) || 0
        ),
        0,
        MAX_DEPOSIT_GEMS
    );

    const expeditionBoostAmount = Math.max(
        0,
        Number(
            deposit?.expeditionBoostAmount ??
            getDepositExpeditionBoostAmount(baseAmountUsd)
        ) || 0
    );

    const expeditionBoostDurationMs = Math.max(
        0,
        Number(
            deposit?.expeditionBoostDurationMs ??
            getDepositExpeditionBoostDurationMs(baseAmountUsd)
        ) || 0
    );

    return {
        amount: amountTon,
        tonAmount: amountTon,
        baseAmount: baseAmountUsd,
        baseAmountUsd,
        baseAmountTon: normalizeRewardNumber(deposit?.baseAmountTon, 0),
        expectedAmount,
        gemsAmount,
        expeditionBoostAmount,
        expeditionBoostDurationMs
    };
}

function approveDepositInDb(db, deposit, tx) {
    db.players = db.players && typeof db.players === "object" ? db.players : {};
    db.deposits = Array.isArray(db.deposits) ? db.deposits : [];

    const safeDeposit = deposit || {};
    const txHash = extractTransactionHash(tx);

    if (!txHash) {
        return {
            ok: false,
            error: "Missing transaction hash"
        };
    }

    const player = getPlayerOrCreate(
        db,
        safeDeposit.telegramId,
        safeDeposit.username
    );

    ensurePlayerCollections(player);

    if (normalizeDepositStatus(safeDeposit.status) === "approved") {
        attachApprovedDepositToPlayer(player, safeDeposit, txHash || safeDeposit.txHash || "");
        db.players[player.telegramId] = normalizePlayer(player);

        return {
            ok: true,
            alreadyApproved: true,
            deposit: safeDeposit,
            player: normalizePlayer(db.players[player.telegramId])
        };
    }

    if (isTxHashAlreadyUsed(db, txHash, safeDeposit.id)) {
        return {
            ok: false,
            duplicateTxHash: true,
            error: "Transaction already used by another deposit"
        };
    }

    const approvedDeposit = sanitizeApprovedDeposit(safeDeposit);

    safeDeposit.status = "approved";
    safeDeposit.txHash = txHash;
    safeDeposit.note = safeString(safeDeposit.note, "") || "TON verified";
    safeDeposit.paymentComment = "";
    safeDeposit.amount = approvedDeposit.amount;
    safeDeposit.tonAmount = approvedDeposit.tonAmount;
    safeDeposit.baseAmount = approvedDeposit.baseAmount;
    safeDeposit.baseAmountUsd = approvedDeposit.baseAmountUsd;
    safeDeposit.baseAmountTon = approvedDeposit.baseAmountTon;
    safeDeposit.expectedAmount = approvedDeposit.expectedAmount;
    safeDeposit.gemsAmount = approvedDeposit.gemsAmount;
    safeDeposit.expeditionBoostAmount = approvedDeposit.expeditionBoostAmount;
    safeDeposit.expeditionBoostDurationMs = approvedDeposit.expeditionBoostDurationMs;
    safeDeposit.updatedAt = Date.now();
    safeDeposit.approvedAt = Date.now();

    player.gems = clamp(
        Math.max(0, Number(player.gems || 0) + approvedDeposit.gemsAmount),
        0,
        Number(LIMITS?.MAX_GEMS) || 1e6
    );

    player.expeditionBoost = Number(
        (
            Math.max(0, Number(player.expeditionBoost || 0)) +
            approvedDeposit.expeditionBoostAmount
        ).toFixed(6)
    );

    const now = Date.now();
    const currentActiveUntil = Math.max(0, Number(player.expeditionBoostActiveUntil || 0));
    const durationBaseTime = currentActiveUntil > now ? currentActiveUntil : now;

    player.expeditionBoostActiveUntil =
        durationBaseTime + approvedDeposit.expeditionBoostDurationMs;

    player.updatedAt = Date.now();

    attachApprovedDepositToPlayer(player, safeDeposit, txHash);

    db.players[player.telegramId] = normalizePlayer(player);

    return {
        ok: true,
        deposit: safeDeposit,
        player: normalizePlayer(db.players[player.telegramId])
    };
}

async function verifySingleDepositById(depositId) {
    const db = readDb();
    db.deposits = Array.isArray(db.deposits) ? db.deposits : [];
    db.players = db.players && typeof db.players === "object" ? db.players : {};

    markExpiredDeposits(db);

    const deposit = db.deposits.find((item) => String(item.id) === String(depositId));
    if (!deposit) {
        return { ok: false, error: "Deposit not found", deposit: null };
    }

    if (!isDepositPendingLike(deposit)) {
        const existingPlayer = deposit.telegramId
            ? getPlayerOrCreate(db, deposit.telegramId, deposit.username)
            : null;

        if (existingPlayer && normalizeDepositStatus(deposit.status) === "approved") {
            attachApprovedDepositToPlayer(existingPlayer, deposit, deposit.txHash || "");
            db.players[existingPlayer.telegramId] = normalizePlayer(existingPlayer);
            writeDb(db);
        }

        return {
            ok: true,
            matched: false,
            alreadyProcessed: true,
            deposit,
            player: existingPlayer ? normalizePlayer(existingPlayer) : null
        };
    }

    if (isDepositExpired(deposit)) {
        deposit.status = "expired";
        deposit.updatedAt = Date.now();
        writeDb(db);

        return {
            ok: true,
            matched: false,
            expired: true,
            deposit
        };
    }

    const txs = await fetchTonTransactions(getReceiverWalletAddress(), 40);
    const match = txs.find((tx) => matchDepositToTransaction(db, deposit, tx));

    if (!match) {
        return { ok: true, matched: false, deposit };
    }

    const result = approveDepositInDb(db, deposit, match);

    if (!result.ok) {
        return {
            ok: false,
            error: result.error || "Deposit approval failed",
            duplicateTxHash: !!result.duplicateTxHash,
            deposit
        };
    }

    writeDb(db);

    return {
        ok: true,
        matched: true,
        deposit: result.deposit,
        player: result.player,
        alreadyApproved: !!result.alreadyApproved
    };
}

async function verifyPendingDepositsForPlayer(telegramId) {
    const db = readDb();
    db.deposits = Array.isArray(db.deposits) ? db.deposits : [];
    db.players = db.players && typeof db.players === "object" ? db.players : {};

    markExpiredDeposits(db);

    const playerId = safeString(telegramId, "");
    const deposits = db.deposits.filter(
        (item) => String(item.telegramId) === playerId && isDepositPendingLike(item)
    );

    if (!deposits.length) {
        const existingPlayer = playerId
            ? db.players?.[playerId]
                ? normalizePlayer(db.players[playerId])
                : null
            : null;

        return {
            ok: true,
            checked: 0,
            matched: 0,
            skippedDuplicates: 0,
            player: existingPlayer
        };
    }

    const txs = await fetchTonTransactions(getReceiverWalletAddress(), 50);

    let matched = 0;
    let skippedDuplicates = 0;

    deposits.forEach((deposit) => {
        if (isDepositExpired(deposit)) {
            deposit.status = "expired";
            deposit.updatedAt = Date.now();
            return;
        }

        const match = txs.find((tx) => matchDepositToTransaction(db, deposit, tx));
        if (!match) return;

        const result = approveDepositInDb(db, deposit, match);

        if (!result.ok) {
            if (result.duplicateTxHash) {
                skippedDuplicates += 1;
            }
            return;
        }

        matched += 1;
    });

    writeDb(db);

    const finalPlayer = db.players?.[playerId]
        ? normalizePlayer(db.players[playerId])
        : null;

    return {
        ok: true,
        checked: deposits.length,
        matched,
        skippedDuplicates,
        player: finalPlayer
    };
}

module.exports = {
    getReceiverWalletAddress,
    verifySingleDepositById,
    verifyPendingDepositsForPlayer
};