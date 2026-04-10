const express = require("express");

const { readDb, writeDb } = require("../db/db");
const { safeString } = require("../utils/helpers");
const { normalizePlayer, getDefaultPlayer } = require("../services/player-service");

const router = express.Router();

const OFFLINE_ADS_MAX_HOURS = 12;
const OFFLINE_ADS_HOURS_PER_AD = 2;
const MIN_SECONDS_BETWEEN_AD_REWARDS = 45;

function normalizeNumber(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
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

    player.offlineAdsHours = Math.max(
        0,
        Math.min(OFFLINE_ADS_MAX_HOURS, normalizeNumber(player.offlineAdsHours, 0))
    );

    player.offlineAdsResetAt = Math.max(
        0,
        normalizeNumber(player.offlineAdsResetAt, 0)
    );

    player.lastOfflineAdRewardAt = Math.max(
        0,
        normalizeNumber(player.lastOfflineAdRewardAt, 0)
    );

    if (player.offlineAdsHours <= 0) {
        player.offlineAdsHours = 0;
        player.offlineAdsResetAt = 0;
    } else if (player.offlineAdsResetAt <= 0) {
        player.offlineAdsResetAt = now + player.offlineAdsHours * 60 * 60 * 1000;
    } else if (player.offlineAdsResetAt <= now) {
        player.offlineAdsHours = 0;
        player.offlineAdsResetAt = 0;
    }

    player.offlineMaxSeconds =
        (player.offlineBaseHours + player.offlineBoostHours + player.offlineAdsHours) * 60 * 60;

    delete player.offlineAdsLastUpdateAt;

    return player;
}

router.post("/reward-offline", async (req, res) => {
    try {
        const db = readDb();
        db.players = db.players && typeof db.players === "object" ? db.players : {};

        const telegramId = safeString(
            req.body?.playerId,
            req.body?.telegramId || "local-player"
        );

        const username = safeString(req.body?.username, "Gracz");

        const oldPlayer = db.players[telegramId]
            ? normalizePlayer(db.players[telegramId])
            : getDefaultPlayer(telegramId, username);

        const player = ensureOfflineAdsState(oldPlayer);
        const now = Date.now();

        const secondsSinceLastReward = Math.floor(
            (now - Math.max(0, Number(player.lastOfflineAdRewardAt) || 0)) / 1000
        );

        if (
            Number(player.lastOfflineAdRewardAt) > 0 &&
            secondsSinceLastReward < MIN_SECONDS_BETWEEN_AD_REWARDS
        ) {
            const waitSeconds = Math.max(
                0,
                MIN_SECONDS_BETWEEN_AD_REWARDS - secondsSinceLastReward
            );

            db.players[telegramId] = normalizePlayer(player);
            writeDb(db);

            return res.status(429).json({
                ok: false,
                error: `Odczekaj ${waitSeconds}s przed kolejną nagrodą z reklamy`,
                waitSeconds,
                offlineAdsHours: player.offlineAdsHours,
                offlineAdsResetAt: player.offlineAdsResetAt,
                offlineMaxSeconds: player.offlineMaxSeconds,
                player: db.players[telegramId]
            });
        }

        if (player.offlineAdsHours >= OFFLINE_ADS_MAX_HOURS) {
            db.players[telegramId] = normalizePlayer(player);
            writeDb(db);

            return res.status(200).json({
                ok: false,
                error: `Osiągnięto limit reklam offline • Reset za ${Math.max(0, Math.ceil((player.offlineAdsResetAt - now) / 1000))}s`,
                offlineAdsHours: player.offlineAdsHours,
                offlineAdsResetAt: player.offlineAdsResetAt,
                offlineMaxSeconds: player.offlineMaxSeconds,
                player: db.players[telegramId]
            });
        }

        const remaining = OFFLINE_ADS_MAX_HOURS - player.offlineAdsHours;
        const addedHours = Math.min(OFFLINE_ADS_HOURS_PER_AD, remaining);

        player.offlineAdsHours = Math.max(
            0,
            Math.min(OFFLINE_ADS_MAX_HOURS, player.offlineAdsHours + addedHours)
        );

        if (player.offlineAdsResetAt > now) {
            player.offlineAdsResetAt += addedHours * 60 * 60 * 1000;
        } else {
            player.offlineAdsResetAt = now + player.offlineAdsHours * 60 * 60 * 1000;
        }

        player.lastOfflineAdRewardAt = now;
        player.lastLogin = now;
        player.updatedAt = now;
        player.offlineMaxSeconds =
            (player.offlineBaseHours + player.offlineBoostHours + player.offlineAdsHours) * 60 * 60;

        db.players[telegramId] = normalizePlayer(player);
        writeDb(db);

        return res.status(200).json({
            ok: true,
            message: `+${addedHours}h offline • Reset za ${Math.max(0, Math.ceil((player.offlineAdsResetAt - now) / 1000))}s`,
            offlineAdsHours: player.offlineAdsHours,
            offlineAdsResetAt: player.offlineAdsResetAt,
            offlineMaxSeconds: player.offlineMaxSeconds,
            waitSeconds: MIN_SECONDS_BETWEEN_AD_REWARDS,
            player: db.players[telegramId]
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