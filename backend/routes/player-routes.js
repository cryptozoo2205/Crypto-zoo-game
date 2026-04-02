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

const OFFLINE_ADS_MAX_HOURS = 12;
const OFFLINE_ADS_HOURS_PER_AD = 2;
const OFFLINE_ADS_RESET_INTERVAL_MS = 24 * 60 * 60 * 1000;
const MAX_EXPEDITION_BOOST = 1.0;

function normalizeInt(value, fallback = 0) {
    return Math.max(0, Math.floor(Number(value) || fallback || 0));
}

function normalizeBoost(value, fallback = 0) {
    return Math.max(0, Math.min(MAX_EXPEDITION_BOOST, Number(value) || fallback || 0));
}

function applyOfflineAdsServerGuard(oldPlayer, safePlayer) {
    const now = Date.now();

    const oldOfflineBaseHours = Math.max(
        1,
        normalizeInt(oldPlayer?.offlineBaseHours, 1)
    );

    const oldOfflineBoostHours = Math.max(
        0,
        normalizeInt(oldPlayer?.offlineBoostHours, 0)
    );

    let serverResetAt = Math.max(
        0,
        Number(oldPlayer?.offlineAdsResetAt) || 0
    );

    if (!serverResetAt) {
        serverResetAt = Math.max(
            0,
            Number(oldPlayer?.createdAt) || now
        );
    }

    let serverHours = Math.max(
        0,
        Math.min(OFFLINE_ADS_MAX_HOURS, normalizeInt(oldPlayer?.offlineAdsHours, 0))
    );

    if (now - serverResetAt >= OFFLINE_ADS_RESET_INTERVAL_MS) {
        serverHours = 0;
        serverResetAt = now;
    }

    const requestedHours = Math.max(
        0,
        Math.min(OFFLINE_ADS_MAX_HOURS, normalizeInt(safePlayer?.offlineAdsHours, 0))
    );

    const maxAllowedThisSave = Math.min(
        OFFLINE_ADS_MAX_HOURS,
        serverHours + OFFLINE_ADS_HOURS_PER_AD
    );

    const finalOfflineAdsHours = Math.max(
        0,
        Math.min(requestedHours, maxAllowedThisSave)
    );

    const finalOfflineBaseHours = Math.max(
        1,
        normalizeInt(safePlayer?.offlineBaseHours, oldOfflineBaseHours)
    );

    const finalOfflineBoostHours = Math.max(
        0,
        normalizeInt(safePlayer?.offlineBoostHours, oldOfflineBoostHours)
    );

    safePlayer.offlineAdsHours = finalOfflineAdsHours;
    safePlayer.offlineAdsResetAt = serverResetAt;
    safePlayer.offlineMaxSeconds =
        (finalOfflineBaseHours + finalOfflineBoostHours + finalOfflineAdsHours) * 60 * 60;

    return safePlayer;
}

function applyExpeditionBoostServerGuard(oldPlayer, safePlayer) {
    const trustedServerBoost = normalizeBoost(oldPlayer?.expeditionBoost, 0);

    // expeditionBoost ma pochodzić tylko z backendu (np. confirm deposit),
    // więc save z frontu nigdy go nie zwiększa ani nie zmniejsza
    safePlayer.expeditionBoost = trustedServerBoost;

    return safePlayer;
}

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

    let safePlayer = buildSafePlayerState(
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

    safePlayer = applyOfflineAdsServerGuard(oldPlayer, safePlayer);
    safePlayer = applyExpeditionBoostServerGuard(oldPlayer, safePlayer);

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