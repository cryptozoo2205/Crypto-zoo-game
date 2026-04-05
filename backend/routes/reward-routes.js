const express = require("express");

const { readDb, writeDb } = require("../db/db");
const { safeString, normalizeRewardNumber } = require("../utils/helpers");
const { getPlayerOrCreate, normalizePlayer } = require("../services/player-service");

const router = express.Router();

/* =========================
   TRANSFER REWARD → WALLET
========================= */

router.post("/transfer-to-wallet", (req, res) => {
    const db = readDb();

    const telegramId = safeString(req.body?.telegramId, "");
    const username = safeString(req.body?.username, "Gracz");

    if (!telegramId) {
        return res.status(400).json({ error: "Missing telegramId" });
    }

    const player = getPlayerOrCreate(db, telegramId, username);

    const rewardBalance = normalizeRewardNumber(player.rewardBalance, 0);

    if (rewardBalance <= 0) {
        return res.status(400).json({
            error: "No reward to transfer"
        });
    }

    // 🔥 TRANSFER
    player.rewardWallet = normalizeRewardNumber(player.rewardWallet, 0) + rewardBalance;
    player.rewardBalance = 0;
    player.updatedAt = Date.now();

    db.players[telegramId] = normalizePlayer(player);
    writeDb(db);

    return res.json({
        ok: true,
        transferredAmount: rewardBalance,
        player: normalizePlayer(player)
    });
});

module.exports = router;