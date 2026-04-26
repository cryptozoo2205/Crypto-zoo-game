const express = require("express");

const { readDb, writeDb } = require("../db/db");
const { safeString } = require("../utils/helpers");
const { normalizePlayer, getDefaultPlayer } = require("../services/player-service");

const router = express.Router();

const OFFLINE_ADS_MAX_HOURS = 3;
const OFFLINE_ADS_HOURS_PER_AD = 0.5;
const MIN_SECONDS_BETWEEN_AD_REWARDS = 0;
const MIN_REQUIRED_AD_WATCH_MS = 15000;

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
        0,
        Math.floor(normalizeNumber(player.offlineBaseHours, 0))
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

    player.offlineAdsEnabled = Boolean(player.offlineAdsEnabled);

    player.lastOfflineAdRewardAt = Math.max(
        0,
        normalizeNumber(player.lastOfflineAdRewardAt, 0)
    );

    if (player.offlineAdsResetAt > 0 && player.offlineAdsResetAt <= now) {
        player.offlineAdsHours = 0;
        player.offlineAdsResetAt = 0;
        player.offlineAdsEnabled = false;
    }

    if (player.offlineAdsResetAt > now) {
        const remainingHours = Math.max(
            0,
            (player.offlineAdsResetAt - now) / (60 * 60 * 1000)
        );

        player.offlineAdsHours = clamp(
            Number(remainingHours.toFixed(6)),
            0,
            OFFLINE_ADS_MAX_HOURS
        );
        player.offlineAdsEnabled = player.offlineAdsHours > 0;
    } else if (player.offlineAdsHours > 0) {
        player.offlineAdsResetAt =
            now + (player.offlineAdsHours * 60 * 60 * 1000);
        player.offlineAdsEnabled = true;
    } else {
        player.offlineAdsResetAt = 0;
        player.offlineAdsHours = 0;
        player.offlineAdsEnabled = false;
    }

    player.offlineMaxSeconds =
        (player.offlineBaseHours +
            player.offlineBoostHours +
            player.offlineAdsHours) * 3600;

    delete player.offlineAdsLastUpdateAt;

    return player;
}

function buildSuccessPayload(player, addedHours) {
    const addedMinutes = Math.round(addedHours * 60);

    return {
        ok: true,
        message: `Dodano +${addedMinutes}min zarobków offline`,
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

function getWatchedMs(req) {
    const body = req.body || {};

    const directWatchMs = Math.max(0, normalizeNumber(body.watchedMs, 0));
    if (directWatchMs > 0) {
        return directWatchMs;
    }

    const adStartedAt = Math.max(0, normalizeNumber(body.adStartedAt, 0));
    const adEndedAt = Math.max(0, normalizeNumber(body.adEndedAt, 0));

    if (adStartedAt > 0 && adEndedAt >= adStartedAt) {
        return adEndedAt - adStartedAt;
    }

    return 0;
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

        const watchedMs = getWatchedMs(req);

        if (watchedMs < MIN_REQUIRED_AD_WATCH_MS) {
            db.players[telegramId] = normalizePlayer(player);
            writeDb(db);

            return res.status(200).json(
                buildErrorPayload(
                    db.players[telegramId],
                    "Reklama została zamknięta przed końcem",
                    {
                        requiredWatchMs: MIN_REQUIRED_AD_WATCH_MS,
                        watchedMs
                    }
                )
            );
        }

        const secondsSinceLastReward =
            player.lastOfflineAdRewardAt > 0
                ? Math.floor((now - player.lastOfflineAdRewardAt) / 1000)
                : 999999;

        if (
            MIN_SECONDS_BETWEEN_AD_REWARDS > 0 &&
            secondsSinceLastReward < MIN_SECONDS_BETWEEN_AD_REWARDS
        ) {
            db.players[telegramId] = normalizePlayer(player);
            writeDb(db);

            return res.status(200).json(
                buildErrorPayload(
                    db.players[telegramId],
                    "Za wcześnie na kolejny reward reklamy",
                    {
                        waitSeconds: Math.max(
                            0,
                            MIN_SECONDS_BETWEEN_AD_REWARDS -
                                secondsSinceLastReward
                        )
                    }
                )
            );
        }

        if (player.offlineAdsHours >= OFFLINE_ADS_MAX_HOURS) {
            db.players[telegramId] = normalizePlayer(player);
            writeDb(db);

            return res.status(200).json(
                buildErrorPayload(
                    db.players[telegramId],
                    "Osiągnięto limit reklam offline"
                )
            );
        }

        const previousAdsHours = Math.max(
            0,
            Number(player.offlineAdsHours) || 0
        );

        const remaining = Math.max(
            0,
            OFFLINE_ADS_MAX_HOURS - previousAdsHours
        );

        const addedHours = Math.min(
            OFFLINE_ADS_HOURS_PER_AD,
            remaining
        );

        player.offlineAdsHours = clamp(
            Number((previousAdsHours + addedHours).toFixed(6)),
            0,
            OFFLINE_ADS_MAX_HOURS
        );

        if (player.offlineAdsResetAt > now && previousAdsHours > 0) {
            player.offlineAdsResetAt += addedHours * 3600 * 1000;
        } else if (player.offlineAdsHours > 0) {
            player.offlineAdsResetAt =
                now + (player.offlineAdsHours * 3600 * 1000);
        } else {
            player.offlineAdsResetAt = 0;
        }

        player.lastOfflineAdRewardAt = now;
        player.updatedAt = now;
        player.offlineAdsEnabled = player.offlineAdsHours > 0;

        player.offlineMaxSeconds =
            (player.offlineBaseHours +
                player.offlineBoostHours +
                player.offlineAdsHours) * 3600;

        db.players[telegramId] = normalizePlayer(player);
        writeDb(db);

        return res.status(200).json(
            buildSuccessPayload(
                db.players[telegramId],
                addedHours
            )
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