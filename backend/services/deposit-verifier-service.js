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

    return (
        deposits.find((deposit) => {
            const depositId = safeString(deposit?.id, "");
            if (depositId === String(currentDepositId || "")) return false;

            return (
                normalizeDepositStatus(deposit?.status) === "approved" &&
                normalizeComment(deposit?.paymentComment) === safeComment
            );
        }) || null
    );
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

    const approvedWithSameComment = findApprovedDepositByComment(
        db,
        depositComment,
        deposit.id
    );
    if (approvedWithSameComment) {
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
        currency: safeString(deposit?.currency, "TON") || "TON",
        gemsAmount: Math.max(0, Number(deposit?.gemsAmount) || 0),
        expeditionBoostAmount: Math.max(
            0,
            Number(deposit?.expeditionBoostAmount) || 0
        ),
        paymentComment: safeString(deposit?.paymentComment, ""),
        status: "approved",
        walletAddress: safeString(deposit?.walletAddress, ""),
        network: safeString(deposit?.network, "TON") || "TON",
        source: "deposit-verifier",
        createdAt: Math.max(0, Number(deposit?.createdAt) || Date.now()),
        approvedAt: Date.now(),
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
        currency: safeString(deposit?.currency, "TON") || "TON",
        gemsAmount: Math.max(0, Number(deposit?.gemsAmount) || 0),
        expeditionBoostAmount: Math.max(
            0,
            Number(deposit?.expeditionBoostAmount) || 0
        ),
        depositId: safeString(deposit?.id, ""),
        paymentComment: safeString(deposit?.paymentComment, ""),
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

    if (!hasItemByKey(player.transactions, "txHash", transactionEntry.txHash)) {
        player.transactions.unshift(transactionEntry);
    }

    return player;
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
        attachApprovedDepositToPlayer(player, safeDeposit, txHash);
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

    safeDeposit.status = "approved";
    safeDeposit.txHash = txHash;
    safeDeposit.note = safeString(safeDeposit.note, "") || "TON verified";
    safeDeposit.updatedAt = Date.now();
    safeDeposit.approvedAt = Date.now();

    const gemsToAdd = Math.max(0, Number(safeDeposit.gemsAmount) || 0);
    const expeditionBoostToAdd = Math.max(
        0,
        Number(safeDeposit.expeditionBoostAmount) || 0
    );

    player.gems = Math.max(0, Number(player.gems || 0) + gemsToAdd);
    player.expeditionBoost = Number(
        (
            Math.max(0, Number(player.expeditionBoost) || 0) +
            expeditionBoostToAdd
        ).toFixed(4)
    );

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