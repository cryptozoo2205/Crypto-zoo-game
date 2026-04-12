const express = require("express");

const { readDb, writeDb } = require("../db/db");
const { REFERRAL_REWARDS } = require("../config/game-config");
const { safeString, normalizeNumber } = require("../utils/helpers");
const {
    getPlayerOrCreate,
    normalizePlayer,
    normalizeReferrals
} = require("../services/player-service");

const {
    syncReferralLinkState,
    applyReferralIfPossible
} = require("../services/referral-service");

const router = express.Router();

/**
 * 🔥 APPLY REFERRAL (NAJWAŻNIEJSZE)
 */
router.post("/apply", (req, res) => {
    const db = readDb();

    const telegramId = safeString(req.body?.telegramId, "");
    const username = safeString(req.body?.username, "Gracz");
    const referralCode = safeString(req.body?.referralCode, "");

    if (!telegramId || !referralCode) {
        return res.status(400).json({ error: "Missing data" });
    }

    const player = getPlayerOrCreate(db, telegramId, username);

    const applied = applyReferralIfPossible(db, player, referralCode);

    db.players[telegramId] = normalizePlayer(player);
    writeDb(db);

    return res.json({
        ok: true,
        applied,
        player: normalizePlayer(player)
    });
});

/**
 * 📊 GET REFERRALS
 */
router.get("/referrals/:telegramId", (req, res) => {
    const db = readDb();
    const telegramId = safeString(req.params.telegramId, "");

    if (!telegramId) {
        return res.status(400).json({ error: "Missing telegramId" });
    }

    const player = getPlayerOrCreate(db, telegramId, "Gracz");

    syncReferralLinkState(db, player);

    db.players[telegramId] = normalizePlayer(player);
    writeDb(db);

    const safePlayer = normalizePlayer(db.players[telegramId]);

    return res.json({
        ok: true,
        referralsCount: Math.max(0, normalizeNumber(safePlayer.referralsCount, 0)),
        referredBy: safeString(safePlayer.referredBy, ""),
        referralCode: safeString(safePlayer.referralCode, telegramId),
        referralLinkCode: `ref_${safeString(safePlayer.referralCode, telegramId)}`,
        referralRewards: {
            activateAtLevel: Math.max(1, Number(REFERRAL_REWARDS?.ACTIVATE_AT_LEVEL) || 3)
        },
        referrals: normalizeReferrals(safePlayer.referrals)
    });
});

module.exports = router;