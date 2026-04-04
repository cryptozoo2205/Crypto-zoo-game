const express = require("express");

const { readDb, writeDb } = require("../db/db");
const { safeString } = require("../utils/helpers");
const { normalizePlayer, getDefaultPlayer } = require("../services/player-service");

const router = express.Router();

const OFFLINE_ADS_MAX_HOURS = 12;
const OFFLINE_ADS_HOURS_PER_AD = 2;
const OFFLINE_ADS_RESET_INTERVAL_MS = 24 * 60 * 60 * 1000;

function normalizeInt(value, fallback = 0) {
    return Math.max(0, Math.floor(Number(value) || fallback || 0));
}

function ensureOfflineAdsState(player) {
    const now = Date.now();

    player.offlineBaseHours = Math.max(
        1,
        normalizeInt(player.offlineBaseHours, 1)
    );

    player.offlineBoostHours = Math.max(
        0,
        normalizeInt(player.offlineBoostHours, 0)
    );

    player.offlineAdsHours = Math.max(
        0,
        Math.min(OFFLINE_ADS_MAX_HOURS, normalizeInt(player.offlineAdsHours, 0))
    );

    player.offlineAdsResetAt = Math.max(
        0,
        Number(player.offlineAdsResetAt) || 0
    );

    if (!player.offlineAdsResetAt) {
        player.offlineAdsResetAt = Math.max(
            0,
            Number(player.createdAt) || now
        );
    }

    if (now - player.offlineAdsResetAt >= OFFLINE_ADS_RESET_INTERVAL_MS) {
        player.offlineAdsHours = 0;
        player.offlineAdsResetAt = now;
    }

    player.offlineMaxSeconds =
        (player.offlineBaseHours + player.offlineBoostHours + player.offlineAdsHours) * 60 * 60;

    return player;
}

router.post("/reward-offline", async (req, res) => {
    try {
        const db = readDb();

        const telegramId = safeString(
            req.body?.playerId,
            req.body?.telegramId || "local-player"
        );

        const username = safeString(
            req.body?.username,
            "Gracz"
        );

        const oldPlayer = db.players[telegramId]
            ? normalizePlayer(db.players[telegramId])
            : getDefaultPlayer(telegramId, username);

        const player = ensureOfflineAdsState(oldPlayer);
        const now = Date.now();

        if (player.offlineAdsHours >= OFFLINE_ADS_MAX_HOURS) {
            db.players[telegramId] = normalizePlayer(player);
            writeDb(db);

            const secondsUntilReset = Math.max(
                0,
                Math.ceil((player.offlineAdsResetAt + OFFLINE_ADS_RESET_INTERVAL_MS - now) / 1000)
            );

            return res.status(200).json({
                ok: false,
                error: `Osiągnięto limit reklam offline • Reset za ${secondsUntilReset}s`,
                offlineAdsHours: player.offlineAdsHours,
                offlineAdsResetAt: player.offlineAdsResetAt
            });
        }

        const remaining = OFFLINE_ADS_MAX_HOURS - player.offlineAdsHours;
        const addedHours = Math.min(OFFLINE_ADS_HOURS_PER_AD, remaining);

        player.offlineAdsHours = Math.max(
            0,
            Math.min(OFFLINE_ADS_MAX_HOURS, player.offlineAdsHours + addedHours)
        );

        player.lastLogin = now;
        player.offlineMaxSeconds =
            (player.offlineBaseHours + player.offlineBoostHours + player.offlineAdsHours) * 60 * 60;

        db.players[telegramId] = normalizePlayer(player);
        writeDb(db);

        const secondsUntilReset = Math.max(
            0,
            Math.ceil((player.offlineAdsResetAt + OFFLINE_ADS_RESET_INTERVAL_MS - now) / 1000)
        );

        return res.status(200).json({
            ok: true,
            message: `+${addedHours}h offline • Reset za ${secondsUntilReset}s`,
            offlineAdsHours: player.offlineAdsHours,
            offlineAdsResetAt: player.offlineAdsResetAt
        });
    } catch (error) {
        console.error("ads reward-offline error:", error);
        return res.status(500).json({
            ok: false,
            error: "Nie udało się obsłużyć reward reklamy"
        });
    }
});

module.exports = router;