const { readDb, writeDb } = require("../db/db");

function safeString(value, fallback = "") {
    return typeof value === "string" ? value.trim() : String(value ?? fallback).trim();
}

function getReceiverWalletAddress() {
    return safeString(
        process.env.TON_DEPOSIT_WALLET ||
        process.env.TON_RECEIVER_WALLET ||
        process.env.TON_WALLET_ADDRESS ||
        process.env.TON_RECEIVER_WALLET ||
        ""
    );
}

function normalizePlayer(player) {
    if (!player || typeof player !== "object") return null;
    return player;
}

async function verifySingleDepositById(depositId) {
    const db = readDb();
    db.deposits = Array.isArray(db.deposits) ? db.deposits : [];
    db.players = db.players && typeof db.players === "object" ? db.players : {};

    const deposit = db.deposits.find(item => String(item?.id) === String(depositId));
    if (!deposit) {
        return {
            ok: false,
            matched: false,
            message: "Deposit not found",
            deposit: null,
            player: null,
            alreadyProcessed: false
        };
    }

    const playerId = safeString(deposit.telegramId || "");
    const player = playerId && db.players[playerId] ? normalizePlayer(db.players[playerId]) : null;

    return {
        ok: true,
        matched: false,
        message: "Verifier temporarily disabled",
        deposit,
        player,
        alreadyProcessed: false
    };
}

async function verifyPendingDepositsForPlayer(telegramId) {
    const db = readDb();
    db.players = db.players && typeof db.players === "object" ? db.players : {};

    const playerId = safeString(telegramId || "");
    const player = playerId && db.players[playerId] ? normalizePlayer(db.players[playerId]) : null;

    return {
        ok: true,
        checked: 0,
        matched: 0,
        skippedDuplicates: 0,
        player
    };
}

module.exports = {
    getReceiverWalletAddress,
    verifySingleDepositById,
    verifyPendingDepositsForPlayer
};
