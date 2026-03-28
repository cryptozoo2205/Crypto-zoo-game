const express = require("express");

const { readDb, writeDb } = require("../db/db");
const {
    safeString,
    extractReferrerId,
    normalizeTelegramUser,
    sanitizeReferrerId
} = require("../utils/helpers");
const {
    getDefaultPlayer,
    normalizePlayer,
    getPlayerOrCreate
} = require("../services/player-service");
const { buildSafePlayerState } = require("../services/validation-service");
const {
    applyReferralIfPossible,
    syncReferralLinkState,
    applyReferralWelcomeBonusIfPossible,
    applyReferralActivationRewardsIfPossible
} = require("../services/referral-service");

const router = express.Router();

router.get("/api/player/:telegramId", (req, res) => {
    const db = readDb();
    const telegramId = safeString(req.params.telegramId, "local-player");
    const username = safeString(req.query.username, "Gracz");
    const referrerId = extractReferrerId(req);

    const player = getPlayerOrCreate(db, telegramId, username);

    applyReferralIfPossible(db, player, referrerId, sanitizeReferrerId);
    syncReferralLinkState(db, db.players[telegramId] || player);
    applyReferralWelcomeBonusIfPossible(db, db.players[telegramId] || player);
    applyReferralActivationRewardsIfPossible(db, db.players[telegramId] || player);

    db.players[telegramId] = normalizePlayer(db.players[telegramId] || player);
    writeDb(db);

    res.json({ player: normalizePlayer(db.players[telegramId]) });
});

router.post("/api/player/save", (req, res) => {
    const db = readDb();

    const bodyTelegramUser = normalizeTelegramUser(
        req.body?.telegramUser,
        req.body?.telegramId,
        req.body?.username
    );

    const telegramId = safeString(
        req.body?.telegramId,
        bodyTelegramUser.id || "local-player"
    );

    const username = safeString(
        req.body?.username,
        bodyTelegramUser.username || bodyTelegramUser.first_name || "Gracz"
    );

    const referrerId = extractReferrerId(req);

    const oldPlayer = db.players[telegramId]
        ? normalizePlayer(db.players[telegramId])
        : getDefaultPlayer(telegramId, username);

    const safePlayer = buildSafePlayerState(
        oldPlayer,
        {
            ...req.body,
            telegramId,
            username,
            telegramUser: {
                ...bodyTelegramUser,
                id: telegramId,
                username: bodyTelegramUser.username || username,
                first_name: bodyTelegramUser.first_name || username || "Gracz"
            }
        },
        normalizeTelegramUser
    );

    db.players[telegramId] = safePlayer;

    applyReferralIfPossible(db, db.players[telegramId], referrerId, sanitizeReferrerId);
    syncReferralLinkState(db, db.players[telegramId]);
    applyReferralWelcomeBonusIfPossible(db, db.players[telegramId]);
    applyReferralActivationRewardsIfPossible(db, db.players[telegramId]);

    db.players[telegramId] = normalizePlayer(db.players[telegramId]);
    writeDb(db);

    res.json({
        ok: true,
        player: db.players[telegramId]
    });
});

module.exports = router;