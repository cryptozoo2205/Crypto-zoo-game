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


// =======================
// TEST REF (MUSI BYĆ PRZED /:telegramId)
// =======================
router.get("/test", (req, res) => {
    const db = readDb();

    const referrerId = "TEST_REF_1";
    const newUserId = "TEST_REF_2";

    db.players = db.players || {};

    const referrer = getPlayerOrCreate(db, referrerId, "Referrer");
    const newUser = getPlayerOrCreate(db, newUserId, "NewUser");

    newUser.referredBy = null;

    console.log("TEST REF:", referrerId, "->", newUserId);

    const applied = applyReferralIfPossible(db, newUser, referrerId);

    db.players[referrerId] = normalizePlayer(referrer);
    db.players[newUserId] = normalizePlayer(newUser);

    writeDb(db);

    return res.json({
        ok: true,
        applied,
        referrer: db.players[referrerId],
        newUser: db.players[newUserId]
    });
});


// =======================
// APPLY REFERRAL
// =======================
router.post("/apply", (req, res) => {
    const db = readDb();

    const telegramId = safeString(req.body?.telegramId, "");
    const username = safeString(req.body?.username, "Gracz");
    const referralCode = safeString(req.body?.referralCode, "");

    if (!telegramId) {
        return res.status(400).json({ ok: false, error: "Missing telegramId" });
    }

    if (!referralCode) {
        return res.status(400).json({ ok: false, error: "Missing referralCode" });
    }

    const player = getPlayerOrCreate(db, telegramId, username);

    console.log("REF APPLY:", referralCode, "->", telegramId);

    const applied = applyReferralIfPossible(db, player, referralCode);

    db.players[telegramId] = normalizePlayer(db.players[telegramId] || player);
    writeDb(db);

    return res.json({
        ok: true,
        applied,
        player: normalizePlayer(db.players[telegramId] || player)
    });
});


// =======================
// GET REFERRALS DATA
// =======================
router.get("/referrals/:telegramId", (req, res) => {
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
            activateAtLevel: Math.max(1, Number(REFERRAL_REWARDS?.ACTIVATE_AT_LEVEL) || 3),

            visitNewPlayerCoins: Math.max(0, Number(REFERRAL_REWARDS?.VISIT_NEW_PLAYER_COINS) || 0),
            visitNewPlayerGems: Math.max(0, Number(REFERRAL_REWARDS?.VISIT_NEW_PLAYER_GEMS) || 0),
            visitNewPlayerReward: Math.max(0, Number(REFERRAL_REWARDS?.VISIT_NEW_PLAYER_REWARD) || 0),

            activatedNewPlayerCoins: Math.max(0, Number(REFERRAL_REWARDS?.ACTIVATED_NEW_PLAYER_COINS) || 0),
            activatedNewPlayerGems: Math.max(0, Number(REFERRAL_REWARDS?.ACTIVATED_NEW_PLAYER_GEMS) || 0),
            activatedNewPlayerReward: Math.max(0, Number(REFERRAL_REWARDS?.ACTIVATED_NEW_PLAYER_REWARD) || 0),

            activatedReferrerCoins: Math.max(0, Number(REFERRAL_REWARDS?.ACTIVATED_REFERRER_COINS) || 0),
            activatedReferrerGems: Math.max(0, Number(REFERRAL_REWARDS?.ACTIVATED_REFERRER_GEMS) || 0),
            activatedReferrerReward: Math.max(0, Number(REFERRAL_REWARDS?.ACTIVATED_REFERRER_REWARD) || 0)
        },
        referrals: normalizeReferrals(safePlayer.referrals)
    });
});

module.exports = router;