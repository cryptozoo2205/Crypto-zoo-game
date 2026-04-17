const express = require("express");

const { readDb } = require("../db/db");
const { normalizeNumber } = require("../utils/helpers");
const { normalizePlayer } = require("../services/player-service");

const router = express.Router();

router.get("/ranking", (req, res) => {
    try {
        const db = readDb();
        db.players = db.players && typeof db.players === "object" ? db.players : {};

        const limit = Math.max(1, Math.min(100, normalizeNumber(req.query.limit, 50)));
        const currentTelegramId = String(
            req.query.telegramId ||
            req.query.playerId ||
            ""
        ).trim();

        const ranking = Object.values(db.players)
            .map((player) => normalizePlayer(player))
            .sort((a, b) => {
                if ((Number(b.coins) || 0) !== (Number(a.coins) || 0)) {
                    return (Number(b.coins) || 0) - (Number(a.coins) || 0);
                }

                if ((Number(b.level) || 0) !== (Number(a.level) || 0)) {
                    return (Number(b.level) || 0) - (Number(a.level) || 0);
                }

                return (Number(b.xp) || 0) - (Number(a.xp) || 0);
            })
            .slice(0, limit)
            .map((player, index) => ({
                rank: index + 1,
                telegramId: String(player.telegramId || ""),
                username: String(player.username || player.first_name || "Gracz"),
                coins: Number(player.coins) || 0,
                level: Number(player.level) || 1,
                isCurrentPlayer:
                    currentTelegramId &&
                    String(player.telegramId || "") === currentTelegramId
            }));

        return res.json({ ok: true, ranking });
    } catch (error) {
        console.error("ranking route error:", error);
        return res.status(500).json({
            ok: false,
            error: "Nie udało się załadować rankingu",
            ranking: []
        });
    }
});

module.exports = router;