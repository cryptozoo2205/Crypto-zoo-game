const { readDb, writeDb } = require("../db/db");
const { normalizeRewardNumber, safeString } = require("../utils/helpers");
const { getPlayerOrCreate, normalizePlayer } = require("./player-service");

const TONCENTER_BASE_URL = "https://toncenter.com/api/v2";
const TON_RECEIVER_WALLET = "UQBTjBORP2cXRNE_hakpG-2DZlBn0uUWME8tKhi7HCcynER5";

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

function matchDepositToTransaction(deposit, tx) {
    if (!deposit || !tx) return false;

    const depositComment = safeString(deposit.paymentComment, "");
    const txComment = extractTransactionComment(tx);

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

    return true;
}

function approveDepositInDb(db, deposit, tx) {
    const player = getPlayerOrCreate(db, deposit.telegramId, deposit.username);

    deposit.status = "approved";
    deposit.txHash = extractTransactionHash(tx);
    deposit.note = safeString(deposit.note, "") || "TON verified";
    deposit.updatedAt = Date.now();

    player.rewardWallet = normalizeRewardNumber(
        (Number(player.rewardWallet) || 0) + (Number(deposit.amount) || 0),
        0
    );

    db.players[player.telegramId] = normalizePlayer(player);
    return {
        deposit,
        player: normalizePlayer(player)
    };
}

async function verifySingleDepositById(depositId) {
    const db = readDb();
    db.deposits = Array.isArray(db.deposits) ? db.deposits : [];

    markExpiredDeposits(db);

    const deposit = db.deposits.find((item) => item.id === depositId);
    if (!deposit) {
        return { ok: false, error: "Deposit not found", deposit: null };
    }

    if (!isDepositPendingLike(deposit)) {
        return { ok: true, matched: false, alreadyProcessed: true, deposit };
    }

    if (isDepositExpired(deposit)) {
        deposit.status = "expired";
        deposit.updatedAt = Date.now();
        writeDb(db);
        return { ok: true, matched: false, expired: true, deposit };
    }

    const txs = await fetchTonTransactions(getReceiverWalletAddress(), 40);
    const match = txs.find((tx) => matchDepositToTransaction(deposit, tx));

    if (!match) {
        return { ok: true, matched: false, deposit };
    }

    const result = approveDepositInDb(db, deposit, match);
    writeDb(db);

    return {
        ok: true,
        matched: true,
        deposit: result.deposit,
        player: result.player
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
    let lastPlayer = null;

    deposits.forEach((deposit) => {
        if (isDepositExpired(deposit)) {
            deposit.status = "expired";
            deposit.updatedAt = Date.now();
            return;
        }

        const match = txs.find((tx) => matchDepositToTransaction(deposit, tx));
        if (!match) return;

        const result = approveDepositInDb(db, deposit, match);
        matched += 1;
        lastPlayer = result.player;
    });

    writeDb(db);

    return {
        ok: true,
        checked: deposits.length,
        matched,
        player: lastPlayer
    };
}

module.exports = {
    getReceiverWalletAddress,
    verifySingleDepositById,
    verifyPendingDepositsForPlayer
};