const { LIMITS, REFERRAL_REWARDS } = require("../config/game-config");
const { safeString, normalizeNumber, clamp } = require("../utils/helpers");
const { normalizePlayer, normalizeReferrals } = require("./player-service");

function ensureReferralRecordOnReferrer(referrer, player) {
    referrer.referrals = normalizeReferrals(referrer.referrals);

    const playerId = safeString(player.telegramId, "");
    const existingIndex = referrer.referrals.findIndex(
        (entry) => String(entry.telegramId) === playerId
    );

    if (existingIndex === -1) {
        referrer.referrals.unshift({
            telegramId: playerId,
            username: safeString(player.username, "Gracz"),
            firstName: safeString(player.telegramUser?.first_name, ""),
            createdAt: Date.now(),
            activated: !!player.referralActivated,
            activatedAt: player.referralActivated ? Date.now() : 0
        });
    } else {
        referrer.referrals[existingIndex] = {
            ...referrer.referrals[existingIndex],
            telegramId: playerId,
            username: safeString(player.username, referrer.referrals[existingIndex].username || "Gracz"),
            firstName: safeString(player.telegramUser?.first_name, referrer.referrals[existingIndex].firstName || ""),
            activated: !!player.referralActivated,
            activatedAt: player.referralActivated
                ? Math.max(
                    0,
                    normalizeNumber(referrer.referrals[existingIndex].activatedAt, Date.now())
                )
                : 0
        };
    }

    referrer.referrals = referrer.referrals.slice(0, LIMITS.MAX_REFERRALS_STORED);
    referrer.referralsCount = referrer.referrals.length;
}

function applyReferralIfPossible(db, player, rawReferrerId, sanitizeReferrerId) {
    const referrerId = sanitizeReferrerId(rawReferrerId);
    if (!player || !referrerId) return false;

    const playerId = safeString(player.telegramId, "");
    if (!playerId) return false;
    if (referrerId === playerId) return false;
    if (safeString(player.referredBy, "")) return false;

    const referrer = db.players[referrerId]
        ? normalizePlayer(db.players[referrerId])
        : null;

    if (!referrer || !safeString(referrer.telegramId, "")) {
        return false;
    }

    player.referredBy = referrer.telegramId;
    ensureReferralRecordOnReferrer(referrer, player);

    db.players[referrer.telegramId] = normalizePlayer(referrer);
    db.players[player.telegramId] = normalizePlayer(player);

    return true;
}

function syncReferralLinkState(db, player) {
    const safePlayer = normalizePlayer(player);
    const referrerId = safeString(safePlayer.referredBy, "");

    if (!referrerId) {
        db.players[safePlayer.telegramId] = safePlayer;
        return;
    }

    const referrer = db.players[referrerId]
        ? normalizePlayer(db.players[referrerId])
        : null;

    if (!referrer) {
        db.players[safePlayer.telegramId] = safePlayer;
        return;
    }

    ensureReferralRecordOnReferrer(referrer, safePlayer);

    db.players[referrer.telegramId] = normalizePlayer(referrer);
    db.players[safePlayer.telegramId] = normalizePlayer(safePlayer);
}

function applyReferralWelcomeBonusIfPossible(db, player) {
    if (!player) return false;

    const safePlayer = normalizePlayer(player);

    if (!safeString(safePlayer.referredBy, "")) {
        db.players[safePlayer.telegramId] = normalizePlayer(safePlayer);
        return false;
    }

    if (safePlayer.referralWelcomeBonusClaimed) {
        db.players[safePlayer.telegramId] = normalizePlayer(safePlayer);
        return false;
    }

    safePlayer.coins = clamp(
        safePlayer.coins + REFERRAL_REWARDS.VISIT_NEW_PLAYER_COINS,
        0,
        LIMITS.MAX_COINS
    );
    safePlayer.gems = clamp(
        safePlayer.gems + REFERRAL_REWARDS.VISIT_NEW_PLAYER_GEMS,
        0,
        LIMITS.MAX_GEMS
    );
    safePlayer.referralWelcomeBonusClaimed = true;

    db.players[safePlayer.telegramId] = normalizePlayer(safePlayer);
    syncReferralLinkState(db, safePlayer);
    return true;
}

function applyReferralActivationRewardsIfPossible(db, player) {
    if (!player) return false;

    let changed = false;
    const safePlayer = normalizePlayer(player);
    const referrerId = safeString(safePlayer.referredBy, "");

    if (!referrerId) {
        db.players[safePlayer.telegramId] = normalizePlayer(safePlayer);
        return false;
    }

    const referrer = db.players[referrerId]
        ? normalizePlayer(db.players[referrerId])
        : null;

    if (!referrer || !safeString(referrer.telegramId, "")) {
        db.players[safePlayer.telegramId] = normalizePlayer(safePlayer);
        return false;
    }

    const meetsActivationLevel =
        Math.max(1, normalizeNumber(safePlayer.level, 1)) >= REFERRAL_REWARDS.ACTIVATE_AT_LEVEL;

    if (meetsActivationLevel && !safePlayer.referralActivated) {
        safePlayer.referralActivated = true;
        changed = true;
    }

    if (meetsActivationLevel && !safePlayer.referralActivationBonusClaimed) {
        safePlayer.coins = clamp(
            safePlayer.coins + REFERRAL_REWARDS.ACTIVATED_NEW_PLAYER_COINS,
            0,
            LIMITS.MAX_COINS
        );
        safePlayer.gems = clamp(
            safePlayer.gems + REFERRAL_REWARDS.ACTIVATED_NEW_PLAYER_GEMS,
            0,
            LIMITS.MAX_GEMS
        );

        referrer.coins = clamp(
            referrer.coins + REFERRAL_REWARDS.ACTIVATED_REFERRER_COINS,
            0,
            LIMITS.MAX_COINS
        );
        referrer.gems = clamp(
            referrer.gems + REFERRAL_REWARDS.ACTIVATED_REFERRER_GEMS,
            0,
            LIMITS.MAX_GEMS
        );

        safePlayer.referralActivated = true;
        safePlayer.referralActivationBonusClaimed = true;
        changed = true;
    }

    ensureReferralRecordOnReferrer(referrer, safePlayer);

    db.players[referrer.telegramId] = normalizePlayer(referrer);
    db.players[safePlayer.telegramId] = normalizePlayer(safePlayer);

    return changed;
}

module.exports = {
    ensureReferralRecordOnReferrer,
    applyReferralIfPossible,
    syncReferralLinkState,
    applyReferralWelcomeBonusIfPossible,
    applyReferralActivationRewardsIfPossible
};