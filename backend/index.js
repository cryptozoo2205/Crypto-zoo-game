require("dotenv").config();

const path = require("path");
const express = require("express");
const { readDb, writeDb, ensureDb } = require("./db/db");
const { normalizePlayer, getPlayerOrCreate } = require("./services/player-service");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const FRONTEND_DIR = path.join(__dirname, "../frontend");
const INDEX_PATH = path.join(FRONTEND_DIR, "index.html");

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(FRONTEND_DIR));

function getPlayerByTelegramId(db, telegramId) {
    const key = String(telegramId || "").trim();
    if (!key) {
        return null;
    }

    const rawPlayer = db.players?.[key];
    if (!rawPlayer) {
        return null;
    }

    return normalizePlayer(rawPlayer);
}

function savePlayerToDb(db, player) {
    const normalized = normalizePlayer(player);
    const key = String(normalized.telegramId || "").trim();

    if (!key) {
        throw new Error("MISSING_TELEGRAM_ID");
    }

    db.players[key] = normalized;
    writeDb(db);

    return db.players[key];
}

function sanitizePlayerPayload(body, existingPlayer = null) {
    const telegramId = String(body?.telegramId || existingPlayer?.telegramId || "").trim();
    const username = String(body?.username || existingPlayer?.username || "Gracz").trim() || "Gracz";

    return normalizePlayer({
        ...(existingPlayer || {}),
        ...(body || {}),
        telegramId,
        username
    });
}

app.get("/api/health", async (req, res) => {
    return res.json({ ok: true });
});

app.get("/api/player/:telegramId", async (req, res) => {
    try {
        const { telegramId } = req.params;

        if (!telegramId) {
            return res.status(400).json({ error: "MISSING_TELEGRAM_ID" });
        }

        const db = readDb();

        let player = getPlayerByTelegramId(db, telegramId);

        if (!player) {
            player = getPlayerOrCreate(db, telegramId, "Gracz");
            writeDb(db);
        }

        return res.json({
            ok: true,
            player: normalizePlayer(player)
        });
    } catch (error) {
        console.error("GET /api/player/:telegramId error:", error);
        return res.status(500).json({ error: "SERVER_ERROR" });
    }
});

app.post("/api/player/save", async (req, res) => {
    try {
        const telegramId = String(req.body?.telegramId || "").trim();

        if (!telegramId) {
            return res.status(400).json({ error: "MISSING_TELEGRAM_ID" });
        }

        const db = readDb();
        const existingPlayer = getPlayerByTelegramId(db, telegramId);
        const player = sanitizePlayerPayload(req.body, existingPlayer);
        const savedPlayer = savePlayerToDb(db, player);

        return res.json({
            ok: true,
            player: savedPlayer
        });
    } catch (error) {
        console.error("POST /api/player/save error:", error);
        return res.status(500).json({ error: "SERVER_ERROR" });
    }
});

/* zgodność ze starszym frontendem */
app.post("/api/player", async (req, res) => {
    try {
        const telegramId = String(req.body?.telegramId || "").trim();

        if (!telegramId) {
            return res.status(400).json({ error: "MISSING_TELEGRAM_ID" });
        }

        const db = readDb();
        const existingPlayer = getPlayerByTelegramId(db, telegramId);
        const player = sanitizePlayerPayload(req.body, existingPlayer);
        const savedPlayer = savePlayerToDb(db, player);

        return res.json(savedPlayer);
    } catch (error) {
        console.error("POST /api/player error:", error);
        return res.status(500).json({ error: "SERVER_ERROR" });
    }
});

app.get("/api/ranking", async (req, res) => {
    try {
        const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 50));
        const db = readDb();

        const ranking = Object.values(db.players || {})
            .map((player) => normalizePlayer(player))
            .sort((a, b) => {
                if (b.coins !== a.coins) return b.coins - a.coins;
                if (b.level !== a.level) return b.level - a.level;
                return a.lastLogin - b.lastLogin;
            })
            .slice(0, limit)
            .map((player, index) => ({
                rank: index + 1,
                telegramId: String(player.telegramId || ""),
                username: String(player.username || "Gracz"),
                coins: Math.max(0, Number(player.coins) || 0),
                level: Math.max(1, Number(player.level) || 1)
            }));

        return res.json({
            ok: true,
            ranking
        });
    } catch (error) {
        console.error("GET /api/ranking error:", error);
        return res.status(500).json({ error: "SERVER_ERROR" });
    }
});

app.use((req, res) => {
    return res.sendFile(INDEX_PATH);
});

app.listen(PORT, () => {
    ensureDb();
    console.log(`Server running on port ${PORT}`);
});