require("dotenv").config();

const path = require("path");
const express = require("express");
const { readDb, writeDb, ensureDb } = require("./db/db");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const FRONTEND_DIR = path.join(__dirname, "../frontend");
const INDEX_PATH = path.join(FRONTEND_DIR, "index.html");

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(FRONTEND_DIR));

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

function getDefaultPlayerState(telegramId, username = "Gracz") {
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
        expeditionBoostActiveUntil: 0,

        offlineBoost: 1,
        offlineBaseHours: 0.25,
        offlineBoostHours: 0,
        offlineAdsHours: 0,
        offlineMaxSeconds: 15 * 60,
        offlineBoostMultiplier: 1,
        offlineBoostActiveUntil: 0,

        lastLogin: Date.now(),
        lastAwardedLevel: 1,

        boost2xActiveUntil: 0,

        expedition: null,
        activeExpedition: null,
        selectedAnimals: [],

        boxes: getDefaultBoxes(),
        animals: getDefaultAnimals(),

        shopPurchases: {},
        shopItemCharges: {},

        expeditionStats: {
            rareChanceBonus: 0,
            epicChanceBonus: 0,
            timeReductionSeconds: 0,
            timeBoostCharges: []
        },

        minigames: {
            memoryCooldownUntil: 0
        },

        lastDailyRewardAt: 0,
        dailyRewardStreak: 0,
        dailyRewardClaimDayKey: "",

        playTimeSeconds: 0,
        updatedAt: Date.now()
    };
}

function normalizeNumber(value, fallback = 0, min = 0) {
    const num = Number(value);
    if (!Number.isFinite(num)) {
        return fallback;
    }
    return Math.max(min, num);
}

function normalizeInteger(value, fallback = 0, min = 0) {
    return Math.floor(normalizeNumber(value, fallback, min));
}

function normalizeObject(value, fallback = {}) {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value
        : fallback;
}

function normalizeArray(value) {
    return Array.isArray(value) ? value : [];
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

function normalizeBoxes(rawBoxes) {
    const boxes = normalizeObject(rawBoxes, {});
    const defaults = getDefaultBoxes();

    return {
        common: normalizeInteger(boxes.common, defaults.common, 0),
        rare: normalizeInteger(boxes.rare, defaults.rare, 0),
        epic: normalizeInteger(boxes.epic, defaults.epic, 0),
        legendary: normalizeInteger(boxes.legendary, defaults.legendary, 0)
    };
}

function normalizeAnimals(rawAnimals) {
    const animals = normalizeObject(rawAnimals, {});
    const defaults = getDefaultAnimals();
    const normalized = {};

    Object.keys(defaults).forEach((key) => {
        const source = normalizeObject(animals[key], defaults[key]);

        normalized[key] = {
            count: normalizeInteger(source.count, 0, 0),
            level: normalizeInteger(source.level, 1, 1)
        };
    });

    return normalized;
}

function normalizeExpedition(rawExpedition) {
    if (!rawExpedition || typeof rawExpedition !== "object") {
        return null;
    }

    return {
        id: String(rawExpedition.id || ""),
        name: String(rawExpedition.name || "Expedition"),
        startTime: normalizeNumber(rawExpedition.startTime, Date.now(), 0),
        endTime: normalizeNumber(rawExpedition.endTime, 0, 0),
        rewardRarity: String(rawExpedition.rewardRarity || "common"),
        rewardCoins: normalizeNumber(rawExpedition.rewardCoins, 0, 0),
        rewardGems: normalizeNumber(rawExpedition.rewardGems, 0, 0),
        duration: normalizeInteger(rawExpedition.duration, 0, 0),
        lastTimeBoostUsedAt: normalizeNumber(rawExpedition.lastTimeBoostUsedAt, 0, 0)
    };
}

function normalizeTimeBoostCharges(value) {
    return normalizeArray(value)
        .map((entry) => normalizeInteger(entry, 0, 0))
        .filter((entry) => entry > 0);
}

function normalizePlayer(playerLike, telegramId = "", username = "Gracz") {
    const base = getDefaultPlayerState(telegramId, username);
    const player = normalizeObject(playerLike, {});

    return {
        ...base,

        telegramId: String(player.telegramId || base.telegramId),
        username: String(player.username || base.username),

        coins: normalizeNumber(player.coins, 0, 0),
        gems: normalizeInteger(player.gems, 0, 0),

        rewardBalance: normalizeNumber(player.rewardBalance, 0, 0),
        rewardWallet: normalizeNumber(player.rewardWallet, 0, 0),
        withdrawPending: normalizeNumber(player.withdrawPending, 0, 0),

        level: normalizeInteger(player.level, 1, 1),
        xp: normalizeNumber(player.xp, 0, 0),

        coinsPerClick: normalizeNumber(player.coinsPerClick, 1, 1),
        upgradeCost: normalizeNumber(player.upgradeCost, 50, 0),
        zooIncome: normalizeNumber(player.zooIncome, 0, 0),

        expeditionBoost: normalizeNumber(player.expeditionBoost, 0, 0),
        expeditionBoostActiveUntil: normalizeBoostTimestamp(player.expeditionBoostActiveUntil),

        offlineBoost: normalizeNumber(player.offlineBoost, 1, 1),
        offlineBaseHours: normalizeNumber(player.offlineBaseHours, 0.25, 0),
        offlineBoostHours: normalizeNumber(player.offlineBoostHours, 0, 0),
        offlineAdsHours: normalizeNumber(player.offlineAdsHours, 0, 0),
        offlineMaxSeconds: normalizeInteger(player.offlineMaxSeconds, 15 * 60, 0),
        offlineBoostMultiplier: normalizeNumber(player.offlineBoostMultiplier, 1, 1),
        offlineBoostActiveUntil: normalizeBoostTimestamp(player.offlineBoostActiveUntil),

        lastLogin: normalizeNumber(player.lastLogin, Date.now(), 0),
        lastAwardedLevel: normalizeInteger(player.lastAwardedLevel, 1, 1),

        boost2xActiveUntil: normalizeBoostTimestamp(player.boost2xActiveUntil),

        expedition: normalizeExpedition(player.expedition),
        activeExpedition: normalizeExpedition(player.activeExpedition),
        selectedAnimals: normalizeArray(player.selectedAnimals),

        boxes: normalizeBoxes(player.boxes),
        animals: normalizeAnimals(player.animals),

        shopPurchases: normalizeObject(player.shopPurchases, {}),
        shopItemCharges: normalizeObject(player.shopItemCharges, {}),

        expeditionStats: {
            rareChanceBonus: normalizeNumber(player.expeditionStats?.rareChanceBonus, 0, 0),
            epicChanceBonus: normalizeNumber(player.expeditionStats?.epicChanceBonus, 0, 0),
            timeReductionSeconds: normalizeInteger(player.expeditionStats?.timeReductionSeconds, 0, 0),
            timeBoostCharges: normalizeTimeBoostCharges(player.expeditionStats?.timeBoostCharges)
        },

        minigames: {
            memoryCooldownUntil: normalizeNumber(player.minigames?.memoryCooldownUntil, 0, 0)
        },

        lastDailyRewardAt: normalizeNumber(player.lastDailyRewardAt, 0, 0),
        dailyRewardStreak: normalizeInteger(player.dailyRewardStreak, 0, 0),
        dailyRewardClaimDayKey: String(player.dailyRewardClaimDayKey || ""),

        playTimeSeconds: normalizeInteger(player.playTimeSeconds, 0, 0),
        updatedAt: Date.now()
    };
}

function getPlayerByTelegramId(db, telegramId) {
    const key = String(telegramId || "");
    if (!key) {
        return null;
    }

    const rawPlayer = db.players?.[key];
    if (!rawPlayer) {
        return null;
    }

    return normalizePlayer(rawPlayer, key, rawPlayer.username || "Gracz");
}

function savePlayerToDb(db, player) {
    const key = String(player.telegramId || "");
    if (!key) {
        throw new Error("MISSING_TELEGRAM_ID");
    }

    db.players[key] = normalizePlayer(player, key, player.username || "Gracz");
    writeDb(db);

    return db.players[key];
}

function sanitizePlayerPayload(body, existingPlayer = null) {
    const telegramId = String(body?.telegramId || existingPlayer?.telegramId || "");
    const username = String(body?.username || existingPlayer?.username || "Gracz");

    const merged = {
        ...(existingPlayer || getDefaultPlayerState(telegramId, username)),
        ...normalizeObject(body, {}),
        telegramId,
        username
    };

    return normalizePlayer(merged, telegramId, username);
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
            player = getDefaultPlayerState(telegramId, "Gracz");
            player = savePlayerToDb(db, player);
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
        const telegramId = String(req.body?.telegramId || "");

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
            .map((player) =>
                normalizePlayer(
                    player,
                    player?.telegramId || "",
                    player?.username || "Gracz"
                )
            )
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
                coins: normalizeNumber(player.coins, 0, 0),
                level: normalizeInteger(player.level, 1, 1)
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