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
const MAX_EXPEDITION_BOOST = 1.0;

function normalizeInt(value, fallback = 0) {
    return Math.max(0, Math.floor(Number(value) || fallback || 0));
}

function normalizeBoost(value, fallback = 0) {
    return Math.max(0, Math.min(MAX_EXPEDITION_BOOST, Number(value) || fallback || 0));
}

function resolveTelegramId(rawTelegramId, bodyTelegramUser) {
    const directId = safeString(rawTelegramId, "");
    const userId = safeString(bodyTelegramUser?.id, "");
    const finalId = directId || userId;

    if (!finalId) {
        return "";
    }

    return finalId;
}

function resolveUsername(rawUsername, bodyTelegramUser) {
    return safeString(
        rawUsername,
        bodyTelegramUser?.username || bodyTelegramUser?.first_name || "Gracz"
    );
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

    const serverHours = Math.max(
        0,
        Math.min(OFFLINE_ADS_MAX_HOURS, Number(oldPlayer?.offlineAdsHours) || 0)
    );

    const requestedHours = Math.max(
        0,
        Math.min(OFFLINE_ADS_MAX_HOURS, Number(safePlayer?.offlineAdsHours) || 0)
    );

    const maxAllowedThisSave = Math.min(
        OFFLINE_ADS_MAX_HOURS,
        serverHours + OFFLINE_ADS_HOURS_PER_AD
    );

    const finalOfflineAdsHours = Math.max(
        serverHours,
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

    const oldResetAt = Math.max(
        0,
        Number(oldPlayer?.offlineAdsResetAt) || 0
    );

    const requestedResetAt = Math.max(
        0,
        Number(safePlayer?.offlineAdsResetAt) || 0
    );

    let finalOfflineAdsResetAt = oldResetAt;

    if (finalOfflineAdsHours <= 0) {
        finalOfflineAdsResetAt = 0;
    } else if (requestedResetAt > now && requestedResetAt >= oldResetAt) {
        finalOfflineAdsResetAt = requestedResetAt;
    } else if (oldResetAt > now) {
        finalOfflineAdsResetAt = oldResetAt;
    } else {
        finalOfflineAdsResetAt = now + finalOfflineAdsHours * 60 * 60 * 1000;
    }

    safePlayer.offlineAdsHours = finalOfflineAdsHours;
    safePlayer.offlineAdsResetAt = finalOfflineAdsResetAt;
    safePlayer.offlineBaseHours = finalOfflineBaseHours;
    safePlayer.offlineBoostHours = finalOfflineBoostHours;
    safePlayer.offlineMaxSeconds =
        (finalOfflineBaseHours + finalOfflineBoostHours + finalOfflineAdsHours) * 60 * 60;

    delete safePlayer.offlineAdsLastUpdateAt;

    return safePlayer;
}

function applyExpeditionBoostServerGuard(oldPlayer, safePlayer) {
    const trustedServerBoost = normalizeBoost(oldPlayer?.expeditionBoost, 0);

    safePlayer.expeditionBoost = trustedServerBoost;

    const oldCharges =
        oldPlayer && typeof oldPlayer.shopItemCharges === "object" && !Array.isArray(oldPlayer.shopItemCharges)
            ? oldPlayer.shopItemCharges
            : {};

    const nextCharges =
        safePlayer && typeof safePlayer.shopItemCharges === "object" && !Array.isArray(safePlayer.shopItemCharges)
            ? safePlayer.shopItemCharges
            : {};

    safePlayer.shopItemCharges = {
        ...oldCharges,
        ...nextCharges
    };

    return safePlayer;
}

function applyMinigamesServerGuard(oldPlayer, safePlayer) {
    const oldMinigames =
        oldPlayer && typeof oldPlayer.minigames === "object" && !Array.isArray(oldPlayer.minigames)
            ? oldPlayer.minigames
            : {};

    const nextMinigames =
        safePlayer && typeof safePlayer.minigames === "object" && !Array.isArray(safePlayer.minigames)
            ? safePlayer.minigames
            : {};

    const oldMemoryCooldownUntil = Math.max(0, Number(oldMinigames.memoryCooldownUntil) || 0);
    const oldTapChallengeCooldownUntil = Math.max(0, Number(oldMinigames.tapChallengeCooldownUntil) || 0);
    const oldAnimalHuntCooldownUntil = Math.max(0, Number(oldMinigames.animalHuntCooldownUntil) || 0);
    const oldWheelCooldownUntil = Math.max(0, Number(oldMinigames.wheelCooldownUntil) || 0);
    const oldExtraWheelSpins = Math.max(0, Number(oldMinigames.extraWheelSpins) || 0);

    const requestedMemoryCooldownUntil = Math.max(0, Number(nextMinigames.memoryCooldownUntil) || 0);
    const requestedTapChallengeCooldownUntil = Math.max(0, Number(nextMinigames.tapChallengeCooldownUntil) || 0);
    const requestedAnimalHuntCooldownUntil = Math.max(0, Number(nextMinigames.animalHuntCooldownUntil) || 0);
    const requestedWheelCooldownUntil = Math.max(0, Number(nextMinigames.wheelCooldownUntil) || 0);
    const requestedExtraWheelSpins = Math.max(0, Number(nextMinigames.extraWheelSpins) || 0);

    safePlayer.minigames = {
        ...nextMinigames,
        memoryCooldownUntil: Math.max(oldMemoryCooldownUntil, requestedMemoryCooldownUntil),
        tapChallengeCooldownUntil: Math.max(oldTapChallengeCooldownUntil, requestedTapChallengeCooldownUntil),
        animalHuntCooldownUntil: Math.max(oldAnimalHuntCooldownUntil, requestedAnimalHuntCooldownUntil),
        wheelCooldownUntil: Math.max(oldWheelCooldownUntil, requestedWheelCooldownUntil),
        extraWheelSpins: Math.min(oldExtraWheelSpins, requestedExtraWheelSpins)
    };

    return safePlayer;
}

router.get("/:telegramId", (req, res) => {
    const db = readDb();

    const telegramId = safeString(req.params.telegramId, "");
    const username = safeString(req.query.username, "Gracz");
    const referrerId = extractReferrerId(req);

    if (!telegramId) {
        return res.status(400).json({
            ok: false,
            error: "Missing telegramId"
        });
    }

    const player = getPlayerOrCreate(db, telegramId, username);

    applyReferralIfPossible(db, player, referrerId, sanitizeReferrerId);
    syncReferralLinkState(db, db.players[telegramId] || player);
    applyReferralWelcomeBonusIfPossible(db, db.players[telegramId] || player);
    applyReferralActivationRewardsIfPossible(db, db.players[telegramId] || player);

    db.players[telegramId] = normalizePlayer(db.players[telegramId] || player);
    writeDb(db);

    return res.json({
        ok: true,
        player: normalizePlayer(db.players[telegramId])
    });
});

router.post("/save", (req, res) => {
    const db = readDb();

    const bodyTelegramUser = normalizeTelegramUser(
        req.body?.telegramUser,
        req.body?.telegramId,
        req.body?.username
    );

    const telegramId = resolveTelegramId(req.body?.telegramId, bodyTelegramUser);
    const username = resolveUsername(req.body?.username, bodyTelegramUser);
    const referrerId = extractReferrerId(req);

    if (!telegramId) {
        return res.status(400).json({
            ok: false,
            error: "Missing telegramId"
        });
    }

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
    safePlayer = applyMinigamesServerGuard(oldPlayer, safePlayer);

    db.players[telegramId] = safePlayer;

    applyReferralIfPossible(db, db.players[telegramId], referrerId, sanitizeReferrerId);
    syncReferralLinkState(db, db.players[telegramId]);
    applyReferralWelcomeBonusIfPossible(db, db.players[telegramId]);
    applyReferralActivationRewardsIfPossible(db, db.players[telegramId]);

    db.players[telegramId] = normalizePlayer(db.players[telegramId]);
    writeDb(db);

    return res.json({
        ok: true,
        player: db.players[telegramId]
    });
});

module.exports = router;