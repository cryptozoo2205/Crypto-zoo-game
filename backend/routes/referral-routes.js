const express = require("express");

const { readDb, writeDb } = require("../db/db");
const { REFERRAL_REWARDS } = require("../config/game-config");
const { safeString, normalizeNumber } = require("../utils/helpers");
const { getPlayerOrCreate, normalizePlayer, normalizeReferrals } = require("../services/player-service");
const { syncReferralLinkState } = require("../services/referral-service");

const router = express.Router();

router.get("/api/referrals/:telegramId", (req, res) => {
    const db = readDb();
    const telegramId = safeString(req.params.telegramId, "");

    if (!telegramId) {
        return res.status(400).json({ error: "Missing telegramId" });
    }

    const player = getPlayerOrCreate(db, telegramId, "Gracz");
    syncReferralLinkState(db, player);

    db.players[telegramId] = normalizePlayer(db.players[telegramId] || player);
    writeDb(db);

    const safePlayer = normalizePlayer(db.players[telegramId]);

    return res.json({
        ok: true,
        referralsCount: Math.max(0, normalizeNumber(safePlayer.referralsCount, 0)),
        referredBy: safeString(safePlayer.referredBy, ""),
        referralCode: safeString(safePlayer.referralCode, telegramId),
        referralLinkCode: `ref_${safeString(safePlayer.referralCode, telegramId)}`,
        referralRewards: {
            activateAtLevel: REFERRAL_REWARDS.ACTIVATE_AT_LEVEL,
            visitNewPlayerCoins: REFERRAL_REWARDS.VISIT_NEW_PLAYER_COINS,
            visitNewPlayerGems: REFERRAL_REWARDS.VISIT_NEW_PLAYER_GEMS,
            activatedNewPlayerCoins: REFERRAL_REWARDS.ACTIVATED_NEW_PLAYER_COINS,
            activatedNewPlayerGems: REFERRAL_REWARDS.ACTIVATED_NEW_PLAYER_GEMS,
            activatedReferrerCoins: REFERRAL_REWARDS.ACTIVATED_REFERRER_COINS,
            activatedReferrerGems: REFERRAL_REWARDS.ACTIVATED_REFERRER_GEMS
        },
        referrals: normalizeReferrals(safePlayer.referrals)
    });
});

module.exports = router;