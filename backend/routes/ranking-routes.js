const express = require("express");

const { readDb } = require("../db/db");
const { normalizeNumber } = require("../utils/helpers");
const { normalizePlayer } = require("../services/player-service");

const router = express.Router();

function getSafePlayers(db) {
    db.players = db.players && typeof db.players === "object" ? db.players : {};
    return Object.values(db.players).map((player) => normalizePlayer(player));
}

function getPlayerRefCount(player) {
    const directCount = Number(player.referralsCount);
    if (Number.isFinite(directCount) && directCount >= 0) {
        return directCount;
    }

    if (Array.isArray(player.referrals)) {
        return player.referrals.length;
    }

    return 0;
}

function getDailyValue(player) {
    const candidates = [
        player.dailyCoins,
        player.dailyRankingCoins,
        player.stats?.dailyCoins,
        player.stats?.dailyRankingCoins,
        player.profile?.dailyCoins,
        player.profile?.dailyRankingCoins
    ];

    for (const value of candidates) {
        const num = Number(value);
        if (Number.isFinite(num) && num >= 0) {
            return num;
        }
    }

    return 0;
}

function getWeeklyValue(player) {
    const candidates = [
        player.weeklyCoins,
        player.weeklyRankingCoins,
        player.stats?.weeklyCoins,
        player.stats?.weeklyRankingCoins,
        player.profile?.weeklyCoins,
        player.profile?.weeklyRankingCoins
    ];

    for (const value of candidates) {
        const num = Number(value);
        if (Number.isFinite(num) && num >= 0) {
            return num;
        }
    }

    return 0;
}

function getRankingMetric(player, type) {
    switch (type) {
        case "ref":
            return getPlayerRefCount(player);
        case "daily":
            return getDailyValue(player);
        case "weekly":
            return getWeeklyValue(player);
        case "overall":
        default:
            return Number(player.coins) || 0;
    }
}

function getUsername(player) {
    return String(
        player.username ||
        player.first_name ||
        player.telegramUser?.username ||
        player.telegramUser?.first_name ||
        "Gracz"
    );
}

function sortPlayers(players, type) {
    return [...players].sort((a, b) => {
        const metricA = getRankingMetric(a, type);
        const metricB = getRankingMetric(b, type);

        if (metricB !== metricA) {
            return metricB - metricA;
        }

        const levelA = Number(a.level) || 1;
        const levelB = Number(b.level) || 1;
        if (levelB !== levelA) {
            return levelB - levelA;
        }

        const xpA = Number(a.xp) || 0;
        const xpB = Number(b.xp) || 0;
        if (xpB !== xpA) {
            return xpB - xpA;
        }

        const coinsA = Number(a.coins) || 0;
        const coinsB = Number(b.coins) || 0;
        return coinsB - coinsA;
    });
}

router.get("/ranking", (req, res) => {
    try {
        const db = readDb();
        const players = getSafePlayers(db);

        const limit = Math.max(1, Math.min(100, normalizeNumber(req.query.limit, 50)));
        const currentTelegramId = String(
            req.query.telegramId ||
            req.query.playerId ||
            ""
        ).trim();

        const requestedType = String(req.query.type || "overall").trim().toLowerCase();
        const type = ["overall", "ref", "daily", "weekly"].includes(requestedType)
            ? requestedType
            : "overall";

        const ranking = sortPlayers(players, type)
            .slice(0, limit)
            .map((player, index) => {
                const metricValue = getRankingMetric(player, type);

                return {
                    rank: index + 1,
                    telegramId: String(player.telegramId || ""),
                    username: getUsername(player),
                    coins: Number(player.coins) || 0,
                    level: Number(player.level) || 1,
                    referralsCount: getPlayerRefCount(player),
                    dailyValue: getDailyValue(player),
                    weeklyValue: getWeeklyValue(player),
                    metricType: type,
                    metricValue,
                    isCurrentPlayer:
                        !!currentTelegramId &&
                        String(player.telegramId || "") === currentTelegramId
                };
            });

        return res.json({
            ok: true,
            type,
            ranking
        });
    } catch (error) {
        console.error("ranking route error:", error);
        return res.status(500).json({
            ok: false,
            error: "Nie udało się załadować rankingu",
            type: "overall",
            ranking: []
        });
    }
});

module.exports = router;