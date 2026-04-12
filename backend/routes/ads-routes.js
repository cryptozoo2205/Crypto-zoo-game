const express = require("express");

const { readDb, writeDb } = require("../db/db");
const { safeString } = require("../utils/helpers");
const { normalizePlayer, getDefaultPlayer } = require("../services/player-service");

const router = express.Router();

const OFFLINE_ADS_MAX_HOURS = 6;
const OFFLINE_ADS_HOURS_PER_AD = 1;
const MIN_SECONDS_BETWEEN_AD_REWARDS = 0;

function normalizeNumber(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function ensurePlayersObject(db) {
    db.players = db.players && typeof db.players === "object" ? db.players : {};
    return db.players;
}

function getTelegramIdFromRequest(req) {
    return safeString(
        req.body?.telegramId,
        req.body?.playerId || "local-player"
    );
}

function ensureOfflineAdsState(player) {
    const now = Date.now();

    player.offlineBaseHours = Math.max(
        1,
        Math.floor(normalizeNumber(player.offlineBaseHours, 1))
    );

    player.offlineBoostHours = Math.max(
        0,
        Math.floor(normalizeNumber(player.offlineBoostHours, 0))
    );

    player.offlineAdsHours = clamp(
        normalizeNumber(player.offlineAdsHours, 0),
        0,
        OFFLINE_ADS_MAX_HOURS
    );

    player.offlineAdsResetAt = Math.max(
        0,
        normalizeNumber(player.offlineAdsResetAt, 0)
    );

    player.lastOfflineAdRewardAt = Math.max(
        0,
        normalizeNumber(player.lastOfflineAdRewardAt, 0)
    );

    if (player.offlineAdsResetAt > 0 && player.offlineAdsResetAt <= now) {
        player.offlineAdsHours = 0;
        player.offlineAdsResetAt = 0;
    }

    if (player.offlineAdsResetAt > now) {
        const remainingHours = Math.max(0, (player.offlineAdsResetAt - now) / (60 * 60 * 1000));
        player.offlineAdsHours = clamp(
            Number(remainingHours.toFixed(6)),
            0,
            OFFLINE_ADS_MAX_HOURS
        );
    } else if (player.offlineAdsHours > 0) {
        player.offlineAdsResetAt = now + player.offlineAdsHours * 60 * 60 * 1000;
    } else {
        player.offlineAdsResetAt = 0;
        player.offlineAdsHours = 0;
    }

    player.offlineMaxSeconds =
        (player.offlineBaseHours + player.offlineBoostHours + player.offlineAdsHours) * 60 * 60;

    delete player.offlineAdsLastUpdateAt;

    return player;
}

function buildSuccessPayload(player, addedHours, now) {
    return {
        ok: true,
        message: `Dodano +${addedHours}h zarobków offline`,
        offlineAdsHours: player.offlineAdsHours,
        offlineAdsResetAt: player.offlineAdsResetAt,
        offlineMaxSeconds: player.offlineMaxSeconds,
        waitSeconds: 0,
        player
    };
}

function buildErrorPayload(player, error, extra = {}) {
    return {
        ok: false,
        error,
        offlineAdsHours: player.offlineAdsHours,
        offlineAdsResetAt: player.offlineAdsResetAt,
        offlineMaxSeconds: player.offlineMaxSeconds,
        player,
        ...extra
    };
}

router.post("/reward-offline", async (req, res) => {
    try {
        const db = readDb();
        ensurePlayersObject(db);

        const telegramId = getTelegramIdFromRequest(req);
        const username = safeString(req.body?.username, "Gracz");

        if (!telegramId) {
            return res.status(400).json({
                ok: false,
                error: "Missing telegramId"
            });
        }

        const existingPlayer = db.players[telegramId]
            ? normalizePlayer(db.players[telegramId])
            : getDefaultPlayer(telegramId, username);

        const player = ensureOfflineAdsState(existingPlayer);
        const now = Date.now();

        if (player.offlineAdsHours >= OFFLINE_ADS_MAX_HOURS) {
            db.players[telegramId] = normalizePlayer(player);
            writeDb(db);

            return res.status(200).json(
                buildErrorPayload(
                    db.players[telegramId],
                    `Osiągnięto limit reklam offline`
                )
            );
        }

        const previousAdsHours = Math.max(0, Number(player.offlineAdsHours) || 0);
        const remaining = Math.max(0, OFFLINE_ADS_MAX_HOURS - previousAdsHours);
        const addedHours = Math.min(OFFLINE_ADS_HOURS_PER_AD, remaining);

        player.offlineAdsHours = clamp(
            Number((previousAdsHours + addedHours).toFixed(6)),
            0,
            OFFLINE_ADS_MAX_HOURS
        );

        if (player.offlineAdsResetAt > now && previousAdsHours > 0) {
            player.offlineAdsResetAt += addedHours * 60 * 60 * 1000;
        } else if (player.offlineAdsHours > 0) {
            player.offlineAdsResetAt = now + player.offlineAdsHours * 60 * 60 * 1000;
        } else {
            player.offlineAdsResetAt = 0;
        }

        player.lastOfflineAdRewardAt = now;
        player.lastLogin = now;
        player.updatedAt = now;
        player.offlineMaxSeconds =
            (player.offlineBaseHours + player.offlineBoostHours + player.offlineAdsHours) * 60 * 60;

        db.players[telegramId] = normalizePlayer(player);
        writeDb(db);

        return res.status(200).json(
            buildSuccessPayload(db.players[telegramId], addedHours, now)
        );
    } catch (error) {
        console.error("ads reward-offline error:", error);
        return res.status(500).json({
            ok: false,
            error: "Nie udało się obsłużyć reward reklamy"
        });
    }
});

module.exports = router;