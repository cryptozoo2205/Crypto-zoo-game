const { readDb, writeDb } = require("../db/db");
const { normalizeRewardNumber, safeString } = require("../utils/helpers");
const { getPlayerOrCreate, normalizePlayer } = require("./player-service");
const { TON_RECEIVER_WALLET } = require("./deposit-service");

const TONCENTER_BASE_URL = "https://toncenter.com/api/v2";

function getReceiverWalletAddress() {
    return safeString(
        process.env.TON_DEPOSIT_WALLET ||
        process.env.TON_RECEIVER_WALLET ||
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

    const response = await fetch(`${TONCENTER_BASE_URL}/getTransactions?${params.toString()}`, {
        method: "GET"
    });

    if (!response.ok) {
        throw new Error(`TONCENTER HTTP ${response.status}`);
    }

    const json = await response.json();

    if (!json?.ok) {
        throw new Error(json?.error || "TONCENTER request failed");
    }

    return Array.isArray(json?.result) ? json.result : [];
}

function extractTransactionComment(tx) {
    const sources = [
        tx?.in_msg?.message,
        tx?.in_msg?.msg_data?.text,
        tx?.in_msg?.comment
    ];

    for (const value of sources) {
        const safe = safeString(value, "");
        if (safe) {
            return safe;
        }
    }

    return "";
}

function extractTransactionHash(tx) {
    return safeString(
        tx?.transaction_id?.hash ||
        tx?.hash ||
        "",
        ""
    );
}

function extractTransactionAmountTon(tx) {
    const rawValue =
        Number(tx?.in_msg?.value) ||
        Number(tx?.in_msg?.amount) ||
        0;

    if (!rawValue) return 0;

    return normalizeRewardNumber(rawValue / 1e9, 0);
}

function isTransactionSuccessful(tx) {
    if (tx?.aborted === true) return false;
    return true;
}

function normalizeComment(value) {
    return safeString(value, "");
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

function findApprovedDepositByComment(db, paymentComment, currentDepositId = "") {
    const safeComment = normalizeComment(paymentComment);
    if (!safeComment) return null;

    const deposits = Array.isArray(db?.deposits) ? db.deposits : [];

    return deposits.find((deposit) => {
        const depositId = safeString(deposit?.id, "");
        if (depositId === String(currentDepositId || "")) return false;

        return (
            normalizeDepositStatus(deposit?.status) === "approved" &&
            normalizeComment(deposit?.paymentComment) === safeComment
        );
    }) || null;
}

function matchDepositToTransaction(db, deposit, tx) {
    if (!deposit || !tx) return false;

    const depositComment = normalizeComment(deposit.paymentComment);
    const txComment = normalizeComment(extractTransactionComment(tx));
    const txHash = extractTransactionHash(tx);

    if (!depositComment || !txComment) {
        return false;
    }

    if (txComment !== depositComment) {
        return false;
    }

    const depositAmount = normalizeRewardNumber(deposit.amount, 0);
    const txAmount = extractTransactionAmountTon(tx);

    if (txAmount < depositAmount) {
        return false;
    }

    if (!isTransactionSuccessful(tx)) {
        return false;
    }

    if (isTxHashAlreadyUsed(db, txHash, deposit.id)) {
        return false;
    }

    const approvedWithSameComment = findApprovedDepositByComment(db, depositComment, deposit.id);
    if (approvedWithSameComment) {
        return false;
    }

    return true;
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

    if (normalizeDepositStatus(safeDeposit.status) === "approved") {
        const player = getPlayerOrCreate(db, safeDeposit.telegramId, safeDeposit.username);

        return {
            ok: true,
            alreadyApproved: true,
            deposit: safeDeposit,
            player: normalizePlayer(player)
        };
    }

    if (isTxHashAlreadyUsed(db, txHash, safeDeposit.id)) {
        return {
            ok: false,
            duplicateTxHash: true,
            error: "Transaction already used by another deposit"
        };
    }

    const player = getPlayerOrCreate(db, safeDeposit.telegramId, safeDeposit.username);

    safeDeposit.status = "approved";
    safeDeposit.txHash = txHash;
    safeDeposit.note = safeString(safeDeposit.note, "") || "TON verified";
    safeDeposit.updatedAt = Date.now();

    const gemsToAdd = Math.max(0, Number(safeDeposit.gemsAmount) || 0);
    player.gems = Math.max(0, Number(player.gems || 0) + gemsToAdd);

    db.players[player.telegramId] = normalizePlayer(player);

    return {
        ok: true,
        deposit: safeDeposit,
        player: normalizePlayer(player)
    };
}

async function verifySingleDepositById(depositId) {
    const db = readDb();
    db.deposits = Array.isArray(db.deposits) ? db.deposits : [];

    markExpiredDeposits(db);

    const deposit = db.deposits.find((item) => String(item.id) === String(depositId));
    if (!deposit) {
        return { ok: false, error: "Deposit not found", deposit: null };
    }

    if (!isDepositPendingLike(deposit)) {
        return {
            ok: true,
            matched: false,
            alreadyProcessed: true,
            deposit
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

    markExpiredDeposits(db);

    const playerId = safeString(telegramId, "");
    const deposits = db.deposits.filter(
        (item) => String(item.telegramId) === playerId && isDepositPendingLike(item)
    );

    if (!deposits.length) {
        return { ok: true, checked: 0, matched: 0 };
    }

    const txs = await fetchTonTransactions(getReceiverWalletAddress(), 50);

    let matched = 0;
    let skippedDuplicates = 0;
    let lastPlayer = null;

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
        lastPlayer = result.player;
    });

    writeDb(db);

    return {
        ok: true,
        checked: deposits.length,
        matched,
        skippedDuplicates,
        player: lastPlayer
    };
}

module.exports = {
    getReceiverWalletAddress,
    verifySingleDepositById,
    verifyPendingDepositsForPlayer
};