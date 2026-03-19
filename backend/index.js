const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/user");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../frontend")));

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((error) => {
        console.error("MongoDB error:", error);
    });

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
        telegramId: String(telegramId),
        username: username || "Gracz",
        coins: 0,
        gems: 0,
        rewardBalance: 0,
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
        animals: getDefaultAnimals()
    };
}

function normalizeAnimalMap(rawAnimals) {
    const defaults = getDefaultAnimals();
    const result = {};

    Object.keys(defaults).forEach((type) => {
        const raw = rawAnimals && rawAnimals[type] ? rawAnimals[type] : defaults[type];

        result[type] = {
            count: Math.max(0, Number(raw.count) || 0),
            level: Math.max(1, Number(raw.level) || 1)
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
        id: rawExpedition.id || "",
        name: rawExpedition.name || "Expedition",
        startTime: Number(rawExpedition.startTime) || Date.now(),
        endTime: Number(rawExpedition.endTime) || 0,
        rewardRarity: rawExpedition.rewardRarity || "common",
        rewardCoins: Math.max(0, Number(rawExpedition.rewardCoins) || 0),
        rewardGems: Math.max(0, Number(rawExpedition.rewardGems) || 0)
    };
}

function sanitizePlayerPayload(body) {
    return {
        telegramId: String(body.telegramId || ""),
        username: String(body.username || "Gracz"),
        coins: Math.max(0, Number(body.coins) || 0),
        gems: Math.max(0, Number(body.gems) || 0),
        rewardBalance: Math.max(0, Number(body.rewardBalance) || 0),
        level: Math.max(1, Number(body.level) || 1),
        xp: Math.max(0, Number(body.xp) || 0),
        coinsPerClick: Math.max(1, Number(body.coinsPerClick) || 1),
        upgradeCost: Math.max(0, Number(body.upgradeCost) || 50),
        zooIncome: Math.max(0, Number(body.zooIncome) || 0),
        expeditionBoost: Math.max(0, Number(body.expeditionBoost) || 0),
        offlineBoost: Math.max(1, Number(body.offlineBoost) || 1),
        lastLogin: Number(body.lastLogin) || Date.now(),
        boost2xActiveUntil: normalizeBoostTimestamp(body.boost2xActiveUntil),
        expedition: normalizeExpedition(body.expedition),
        boxes: normalizeBoxes(body.boxes),
        animals: normalizeAnimalMap(body.animals)
    };
}

function formatUserResponse(userDoc) {
    return {
        telegramId: String(userDoc.telegramId || ""),
        username: userDoc.username || "Gracz",
        coins: Math.max(0, Number(userDoc.coins) || 0),
        gems: Math.max(0, Number(userDoc.gems) || 0),
        rewardBalance: Math.max(0, Number(userDoc.rewardBalance) || 0),
        level: Math.max(1, Number(userDoc.level) || 1),
        xp: Math.max(0, Number(userDoc.xp) || 0),
        coinsPerClick: Math.max(1, Number(userDoc.coinsPerClick) || 1),
        upgradeCost: Math.max(0, Number(userDoc.upgradeCost) || 50),
        zooIncome: Math.max(0, Number(userDoc.zooIncome) || 0),
        expeditionBoost: Math.max(0, Number(userDoc.expeditionBoost) || 0),
        offlineBoost: Math.max(1, Number(userDoc.offlineBoost) || 1),
        lastLogin: Number(userDoc.lastLogin) || Date.now(),
        boost2xActiveUntil: normalizeBoostTimestamp(userDoc.boost2xActiveUntil),
        expedition: normalizeExpedition(userDoc.expedition),
        boxes: normalizeBoxes(userDoc.boxes),
        animals: normalizeAnimalMap(userDoc.animals)
    };
}

app.get("/api/health", async (req, res) => {
    res.json({ ok: true });
});

app.get("/api/player/:telegramId", async (req, res) => {
    try {
        const { telegramId } = req.params;

        if (!telegramId) {
            return res.status(400).json({ error: "MISSING_TELEGRAM_ID" });
        }

        let user = await User.findOne({ telegramId: String(telegramId) });

        if (!user) {
            user = await User.create(getDefaultState(telegramId, "Gracz"));
        }

        return res.json({
            ok: true,
            player: formatUserResponse(user)
        });
    } catch (error) {
        console.error("GET /api/player/:telegramId error:", error);
        return res.status(500).json({ error: "SERVER_ERROR" });
    }
});

app.post("/api/player/save", async (req, res) => {
    try {
        const payload = sanitizePlayerPayload(req.body);

        if (!payload.telegramId) {
            return res.status(400).json({ error: "MISSING_TELEGRAM_ID" });
        }

        const user = await User.findOneAndUpdate(
            { telegramId: payload.telegramId },
            payload,
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true
            }
        );

        return res.json({
            ok: true,
            player: formatUserResponse(user)
        });
    } catch (error) {
        console.error("POST /api/player/save error:", error);
        return res.status(500).json({ error: "SERVER_ERROR" });
    }
});

/* zgodność ze starszym frontendem */
app.post("/api/player", async (req, res) => {
    try {
        const payload = sanitizePlayerPayload(req.body);

        if (!payload.telegramId) {
            return res.status(400).json({ error: "MISSING_TELEGRAM_ID" });
        }

        const user = await User.findOneAndUpdate(
            { telegramId: payload.telegramId },
            payload,
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true
            }
        );

        return res.json(formatUserResponse(user));
    } catch (error) {
        console.error("POST /api/player error:", error);
        return res.status(500).json({ error: "SERVER_ERROR" });
    }
});

app.get("/api/ranking", async (req, res) => {
    try {
        const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 50));

        const rankingUsers = await User.find({})
            .sort({ coins: -1, level: -1, lastLogin: 1 })
            .limit(limit)
            .select("telegramId username coins level");

        const ranking = rankingUsers.map((user, index) => ({
            rank: index + 1,
            telegramId: String(user.telegramId || ""),
            username: user.username || "Gracz",
            coins: Math.max(0, Number(user.coins) || 0),
            level: Math.max(1, Number(user.level) || 1)
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
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});