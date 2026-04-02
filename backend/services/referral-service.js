const { LIMITS, REFERRAL_REWARDS } = require("../config/game-config");
const { safeString, normalizeNumber, clamp } = require("../utils/helpers");
const { normalizePlayer, normalizeReferrals } = require("./player-service");

function getPlayerId(player) {
    return safeString(player?.telegramId, "");
}

function getPlayerUsername(player) {
    return safeString(player?.username, "Gracz");
}

function getPlayerFirstName(player) {
    return safeString(player?.telegramUser?.first_name, "");
}

function getReferrerId(player) {
    return safeString(player?.referredBy, "");
}

function ensureReferralCode(player) {
    const playerId = getPlayerId(player);
    const safeCode = safeString(player?.referralCode, "");

    player.referralCode = safeCode || playerId;
    return player.referralCode;
}

function ensureReferralFlags(player) {
    player.referralWelcomeBonusClaimed = !!player.referralWelcomeBonusClaimed;
    player.referralActivated = !!player.referralActivated;
    player.referralActivationBonusClaimed = !!player.referralActivationBonusClaimed;
    return player;
}

function ensureReferralRecordOnReferrer(referrer, player) {
    referrer = normalizePlayer(referrer);
    player = normalizePlayer(player);

    referrer.referrals = normalizeReferrals(referrer.referrals);

    const playerId = getPlayerId(player);
    if (!playerId) {
        referrer.referralsCount = referrer.referrals.length;
        return referrer;
    }

    const existingIndex = referrer.referrals.findIndex(
        (entry) => safeString(entry?.telegramId, "") === playerId
    );

    const existing = existingIndex >= 0 ? referrer.referrals[existingIndex] : null;

    const nextEntry = {
        telegramId: playerId,
        username: getPlayerUsername(player),
        firstName: getPlayerFirstName(player),
        createdAt: Math.max(
            0,
            normalizeNumber(existing?.createdAt, 0) || normalizeNumber(player?.createdAt, 0) || Date.now()
        ),
        activated: !!player.referralActivated,
        activatedAt: player.referralActivated
            ? Math.max(
                  0,
                  normalizeNumber(existing?.activatedAt, 0) || normalizeNumber(player?.updatedAt, 0) || Date.now()
              )
            : 0
    };

    if (existingIndex === -1) {
        referrer.referrals.unshift(nextEntry);
    } else {
        referrer.referrals[existingIndex] = nextEntry;
    }

    referrer.referrals = referrer.referrals
        .filter((entry, index, arr) => {
            const id = safeString(entry?.telegramId, "");
            if (!id) return false;
            return arr.findIndex((item) => safeString(item?.telegramId, "") === id) === index;
        })
        .slice(0, LIMITS.MAX_REFERRALS_STORED);

    referrer.referralsCount = referrer.referrals.length;
    return referrer;
}

function canAssignReferrer(db, player, rawReferrerId, sanitizeReferrerId) {
    const playerId = getPlayerId(player);
    const currentReferrerId = getReferrerId(player);
    const referrerId = sanitizeReferrerId ? sanitizeReferrerId(rawReferrerId) : safeString(rawReferrerId, "");

    if (!playerId || !referrerId) {
        return { ok: false, reason: "missing_data" };
    }

    if (currentReferrerId) {
        return { ok: false, reason: "already_referred" };
    }

    if (referrerId === playerId) {
        return { ok: false, reason: "self_ref" };
    }

    const referrer = db.players?.[referrerId]
        ? normalizePlayer(db.players[referrerId])
        : null;

    if (!referrer || !getPlayerId(referrer)) {
        return { ok: false, reason: "referrer_not_found" };
    }

    if (getReferrerId(referrer) === playerId) {
        return { ok: false, reason: "circular_ref" };
    }

    return {
        ok: true,
        referrerId,
        referrer
    };
}

function applyReferralIfPossible(db, player, rawReferrerId, sanitizeReferrerId) {
    if (!player) return false;

    const safePlayer = normalizePlayer(player);
    ensureReferralCode(safePlayer);
    ensureReferralFlags(safePlayer);

    const check = canAssignReferrer(db, safePlayer, rawReferrerId, sanitizeReferrerId);
    if (!check.ok) {
        db.players[safePlayer.telegramId] = normalizePlayer(safePlayer);
        return false;
    }

    const referrer = normalizePlayer(check.referrer);

    safePlayer.referredBy = referrer.telegramId;

    ensureReferralRecordOnReferrer(referrer, safePlayer);

    db.players[referrer.telegramId] = normalizePlayer(referrer);
    db.players[safePlayer.telegramId] = normalizePlayer(safePlayer);

    return true;
}

function syncReferralLinkState(db, player) {
    if (!player) return false;

    const safePlayer = normalizePlayer(player);
    ensureReferralCode(safePlayer);
    ensureReferralFlags(safePlayer);

    const referrerId = getReferrerId(safePlayer);

    if (!referrerId) {
        db.players[safePlayer.telegramId] = normalizePlayer(safePlayer);
        return false;
    }

    const referrer = db.players?.[referrerId]
        ? normalizePlayer(db.players[referrerId])
        : null;

    if (!referrer || !getPlayerId(referrer)) {
        db.players[safePlayer.telegramId] = normalizePlayer({
            ...safePlayer,
            referredBy: ""
        });
        return false;
    }

    const syncedReferrer = ensureReferralRecordOnReferrer(referrer, safePlayer);

    db.players[syncedReferrer.telegramId] = normalizePlayer(syncedReferrer);
    db.players[safePlayer.telegramId] = normalizePlayer(safePlayer);

    return true;
}

function applyReferralWelcomeBonusIfPossible(db, player) {
    if (!player) return false;

    const safePlayer = normalizePlayer(player);
    ensureReferralCode(safePlayer);
    ensureReferralFlags(safePlayer);

    if (!getReferrerId(safePlayer)) {
        db.players[safePlayer.telegramId] = normalizePlayer(safePlayer);
        return false;
    }

    if (safePlayer.referralWelcomeBonusClaimed) {
        db.players[safePlayer.telegramId] = normalizePlayer(safePlayer);
        return false;
    }

    safePlayer.coins = clamp(
        Number(safePlayer.coins || 0) + Number(REFERRAL_REWARDS.VISIT_NEW_PLAYER_COINS || 0),
        0,
        LIMITS.MAX_COINS
    );

    safePlayer.gems = clamp(
        Number(safePlayer.gems || 0) + Number(REFERRAL_REWARDS.VISIT_NEW_PLAYER_GEMS || 0),
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
    ensureReferralCode(safePlayer);
    ensureReferralFlags(safePlayer);

    const referrerId = getReferrerId(safePlayer);

    if (!referrerId) {
        db.players[safePlayer.telegramId] = normalizePlayer(safePlayer);
        return false;
    }

    const referrer = db.players?.[referrerId]
        ? normalizePlayer(db.players[referrerId])
        : null;

    if (!referrer || !getPlayerId(referrer)) {
        db.players[safePlayer.telegramId] = normalizePlayer(safePlayer);
        return false;
    }

    const meetsActivationLevel =
        Math.max(1, normalizeNumber(safePlayer.level, 1)) >=
        Math.max(1, normalizeNumber(REFERRAL_REWARDS.ACTIVATE_AT_LEVEL, 3));

    if (meetsActivationLevel && !safePlayer.referralActivated) {
        safePlayer.referralActivated = true;
        changed = true;
    }

    if (meetsActivationLevel && !safePlayer.referralActivationBonusClaimed) {
        safePlayer.coins = clamp(
            Number(safePlayer.coins || 0) + Number(REFERRAL_REWARDS.ACTIVATED_NEW_PLAYER_COINS || 0),
            0,
            LIMITS.MAX_COINS
        );

        safePlayer.gems = clamp(
            Number(safePlayer.gems || 0) + Number(REFERRAL_REWARDS.ACTIVATED_NEW_PLAYER_GEMS || 0),
            0,
            LIMITS.MAX_GEMS
        );

        referrer.coins = clamp(
            Number(referrer.coins || 0) + Number(REFERRAL_REWARDS.ACTIVATED_REFERRER_COINS || 0),
            0,
            LIMITS.MAX_COINS
        );

        referrer.gems = clamp(
            Number(referrer.gems || 0) + Number(REFERRAL_REWARDS.ACTIVATED_REFERRER_GEMS || 0),
            0,
            LIMITS.MAX_GEMS
        );

        safePlayer.referralActivated = true;
        safePlayer.referralActivationBonusClaimed = true;
        changed = true;
    }

    const syncedReferrer = ensureReferralRecordOnReferrer(referrer, safePlayer);

    db.players[syncedReferrer.telegramId] = normalizePlayer(syncedReferrer);
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