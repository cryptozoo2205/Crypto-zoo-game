const express = require("express");

const { readDb } = require("../db/db");
const { normalizeNumber } = require("../utils/helpers");
const { normalizePlayer } = require("../services/player-service");

const router = express.Router();

router.get("/api/ranking", (req, res) => {
    const db = readDb();
    const limit = Math.max(1, Math.min(100, normalizeNumber(req.query.limit, 50)));

    const ranking = Object.values(db.players)
        .map((player) => normalizePlayer(player))
        .sort((a, b) => {
            if (b.coins !== a.coins) return b.coins - a.coins;
            if (b.level !== a.level) return b.level - a.level;
            return b.xp - a.xp;
        })
        .slice(0, limit)
        .map((player, index) => ({
            rank: index + 1,
            telegramId: player.telegramId,
            username: player.username,
            coins: player.coins,
            level: player.level
        }));

    res.json({ ranking });
});

module.exports = router;