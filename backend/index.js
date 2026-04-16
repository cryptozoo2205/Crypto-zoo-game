require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const FRONTEND_DIR = path.join(__dirname, "../frontend");
const INDEX_PATH = path.join(FRONTEND_DIR, "index.html");
const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(FRONTEND_DIR));

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function ensureDbFile() {
    ensureDataDir();

    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(
            DB_PATH,
            JSON.stringify({ players: {} }, null, 2),
            "utf8"
        );
    }
}

function readDb() {
    ensureDbFile();

    try {
        const raw = fs.readFileSync(DB_PATH, "utf8");
        const parsed = JSON.parse(raw || "{}");

        return {
            players:
                parsed && parsed.players && typeof parsed.players === "object"
                    ? parsed.players
                    : {}
        };
    } catch (error) {
        console.error("DB read error:", error);

        return {
            players: {}
        };
    }
}

function writeDb(db) {
    ensureDbFile();

    const safeDb = {
        players:
            db && db.players && typeof db.players === "object"
                ? db.players
                : {}
    };

    const tempPath = `${DB_PATH}.tmp`;

    fs.writeFileSync(tempPath, JSON.stringify(safeDb, null, 2), "utf8");
    fs.renameSync(tempPath, DB_PATH);
}

function getDefaultAnimals() {
    return {
        monkey: { count: 0, level: 1 },
        panda: { count: 0, level: 1 },
        lion: { count: 0, level: 1 },
        tiger: { count: 0, level: 1 },
        elephant: { count: 0, level: 1 },
        giraffe: { count: 0, level: 1 },
        zebra: { count: 0, level: 1 },
        hippo: { count: 0, level: 1 },
        penguin: { count: 0, level: 1 },
        bear: { count: 0, level: 1 },
        crocodile: { count: 0, level: 1 },
        kangaroo: { count: 0, level: 1 },
        wolf: { count: 0, level: 1 }
    };
}

function getDefaultBoxes() {
    return {
        common: 0,
        rare: 0,
        epic: 0,
        legendary: 0
    };
}

function getDefaultState(telegramId, username = "Gracz") {
    return {
        telegramId: String(telegramId || ""),
        username: String(username || "Gracz"),

        coins: 0,
        gems: 0,
        rewardBalance: 0,
        rewardWallet: 0,
        withdrawPending: 0,

        level: 1,
        xp: 0,
        coinsPerClick: 1,
        upgradeCost: 50,
        zooIncome: 0,

        expeditionBoost: 0,
        offlineBoost: 1,
        lastLogin: Date.now(),
        boost2xActiveUntil: 0,

        expedition: null,

        boxes: getDefaultBoxes(),
        animals: getDefaultAnimals(),

        shopPurchases: {},
        shopItemCharges: {},

        dailyExpeditionBoost: {
            activeUntil: 0,
            lastPurchaseAt: 0
        },

        expeditionStats: {
            timeBoostCharges: []
        },

        minigames: {},
        depositsHistory: [],
        withdrawHistory: []
    };
}

function normalizeAnimalMap(rawAnimals) {
    const defaults = getDefaultAnimals();
    const result = {};

    Object.keys(defaults).forEach((type) => {
        const raw =
            rawAnimals && rawAnimals[type] ? rawAnimals[type] : defaults[type];

        result[type] = {
            count: Math.max(0, Number(raw?.count) || 0),
            level: Math.max(1, Number(raw?.level) || 1)
        };
    });

    return result;
}

function normalizeBoxes(rawBoxes) {
    const defaults = getDefaultBoxes();

    return {
        common: Math.max(0, Number(rawBoxes?.common) || defaults.common),
        rare: Math.max(0, Number(rawBoxes?.rare) || defaults.rare),
        epic: Math.max(0, Number(rawBoxes?.epic) || defaults.epic),
        legendary: Math.max(0, Number(rawBoxes?.legendary) || defaults.legendary)
    };
}

function normalizeBoostTimestamp(value) {
    let safeValue = Number(value) || 0;

    if (safeValue <= 0) {
        return 0;
    }

    if (safeValue < 1000000000000) {
        safeValue *= 1000;
    }

    if (safeValue <= Date.now()) {
        return 0;
    }

    return safeValue;
}

function normalizeExpedition(rawExpedition) {
    if (!rawExpedition || typeof rawExpedition !== "object") {
        return null;
    }

    return {
        id: String(rawExpedition.id || ""),
        name: String(rawExpedition.name || "Expedition"),
        startTime: Number(rawExpedition.startTime) || Date.now(),
        endTime: Number(rawExpedition.endTime) || 0,
        rewardRarity: String(rawExpedition.rewardRarity || "common"),
        rewardCoins: Math.max(0, Number(rawExpedition.rewardCoins) || 0),
        rewardGems: Math.max(0, Number(rawExpedition.rewardGems) || 0),

        duration: Math.max(0, Number(rawExpedition.duration) || 0),
        lastTimeBoostUsedAt: Number(rawExpedition.lastTimeBoostUsedAt) || 0
    };
}

function normalizePlainObject(value) {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value
        : {};
}

function normalizeTimeBoostCharges(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((entry) => Math.max(0, Math.floor(Number(entry) || 0)))
        .filter((entry) => entry > 0);
}

function normalizePlayer(playerLike) {
    const base = getDefaultState(
        playerLike?.telegramId || "",
        playerLike?.username || "Gracz"
    );

    return {
        ...base,

        telegramId: String(playerLike?.telegramId || base.telegramId),
        username: String(playerLike?.username || base.username),

        coins: Math.max(0, Number(playerLike?.coins) || 0),
        gems: Math.max(0, Number(playerLike?.gems) || 0),
        rewardBalance: Math.max(0, Number(playerLike?.rewardBalance) || 0),
        rewardWallet: Math.max(0, Number(playerLike?.rewardWallet) || 0),
        withdrawPending: Math.max(0, Number(playerLike?.withdrawPending) || 0),

        level: Math.max(1, Number(playerLike?.level) || 1),
        xp: Math.max(0, Number(playerLike?.xp) || 0),
        coinsPerClick: Math.max(1, Number(playerLike?.coinsPerClick) || 1),
        upgradeCost: Math.max(0, Number(playerLike?.upgradeCost) || 50),
        zooIncome: Math.max(0, Number(playerLike?.zooIncome) || 0),

        expeditionBoost: Math.max(0, Number(playerLike?.expeditionBoost) || 0),
        offlineBoost: Math.max(1, Number(playerLike?.offlineBoost) || 1),
        lastLogin: Number(playerLike?.lastLogin) || Date.now(),
        boost2xActiveUntil: normalizeBoostTimestamp(
            playerLike?.boost2xActiveUntil
        ),

        expedition: normalizeExpedition(playerLike?.expedition),

        boxes: normalizeBoxes(playerLike?.boxes),
        animals: normalizeAnimalMap(playerLike?.animals),

        shopPurchases: normalizePlainObject(playerLike?.shopPurchases),
        shopItemCharges: normalizePlainObject(playerLike?.shopItemCharges),

        dailyExpeditionBoost: {
            activeUntil: normalizeBoostTimestamp(
                playerLike?.dailyExpeditionBoost?.activeUntil
            ),
            lastPurchaseAt: Math.max(
                0,
                Number(playerLike?.dailyExpeditionBoost?.lastPurchaseAt) || 0
            )
        },

        expeditionStats: {
            ...(normalizePlainObject(base.expeditionStats)),
            ...(normalizePlainObject(playerLike?.expeditionStats)),
            timeBoostCharges: normalizeTimeBoostCharges(
                playerLike?.expeditionStats?.timeBoostCharges
            )
        },

        minigames: normalizePlainObject(playerLike?.minigames),

        depositsHistory: Array.isArray(playerLike?.depositsHistory)
            ? playerLike.depositsHistory
            : [],
        withdrawHistory: Array.isArray(playerLike?.withdrawHistory)
            ? playerLike.withdrawHistory
            : []
    };
}

function sanitizePlayerPayload(body, existingPlayer = null) {
    const telegramId = String(body?.telegramId || existingPlayer?.telegramId || "");
    const username = String(body?.username || existingPlayer?.username || "Gracz");

    const merged = {
        ...(existingPlayer || getDefaultState(telegramId, username)),
        ...(body || {}),
        telegramId,
        username
    };

    return normalizePlayer(merged);
}

function getPlayerByTelegramId(telegramId) {
    const db = readDb();
    const key = String(telegramId || "");
    const rawPlayer = db.players[key];

    if (!rawPlayer) {
        return null;
    }

    return normalizePlayer(rawPlayer);
}

function savePlayer(player) {
    const db = readDb();
    const normalized = normalizePlayer(player);
    const key = String(normalized.telegramId || "");

    db.players[key] = normalized;
    writeDb(db);

    return normalized;
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

        let player = getPlayerByTelegramId(telegramId);

        if (!player) {
            player = savePlayer(getDefaultState(telegramId, "Gracz"));
        }

        return res.json({
            ok: true,
            player
        });
    } catch (error) {
        console.error("GET /api/player/:telegramId error:", error);
        return res.status(500).json({ error: "SERVER_ERROR" });
    }
});

app.post("/api/player/save", async (req, res) => {
    try {
        const telegramId = String(req.body?.telegramId || "");

        if (!telegramId) {
            return res.status(400).json({ error: "MISSING_TELEGRAM_ID" });
        }

        const existing = getPlayerByTelegramId(telegramId);
        const payload = sanitizePlayerPayload(req.body, existing);
        const saved = savePlayer(payload);

        return res.json({
            ok: true,
            player: saved
        });
    } catch (error) {
        console.error("POST /api/player/save error:", error);
        return res.status(500).json({ error: "SERVER_ERROR" });
    }
});

/* zgodność ze starszym frontendem */
app.post("/api/player", async (req, res) => {
    try {
        const telegramId = String(req.body?.telegramId || "");

        if (!telegramId) {
            return res.status(400).json({ error: "MISSING_TELEGRAM_ID" });
        }

        const existing = getPlayerByTelegramId(telegramId);
        const payload = sanitizePlayerPayload(req.body, existing);
        const saved = savePlayer(payload);

        return res.json(saved);
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
                username: player.username || "Gracz",
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
    ensureDbFile();
    console.log(`Server running on port ${PORT}`);
});