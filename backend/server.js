const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

app.use(cors());
app.use(express.json({ limit: "1mb" }));

function ensureDb() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_PATH)) {
        const initialDb = {
            players: {},
            withdrawRequests: []
        };

        fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2), "utf8");
    }
}

function readDb() {
    ensureDb();

    try {
        const raw = fs.readFileSync(DB_PATH, "utf8");
        const parsed = JSON.parse(raw);

        return {
            players: parsed.players || {},
            withdrawRequests: Array.isArray(parsed.withdrawRequests) ? parsed.withdrawRequests : []
        };
    } catch (error) {
        console.error("DB read error:", error);
        return {
            players: {},
            withdrawRequests: []
        };
    }
}

function writeDb(db) {
    ensureDb();
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function getDefaultPlayer(telegramId = "local-player", username = "Gracz") {
    return {
        telegramId: String(telegramId),
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
        lastDailyRewardAt: 0,
        dailyRewardStreak: 0,
        dailyRewardClaimDayKey: "",
        boost2xActiveUntil: 0,
        animals: {
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
        },
        boxes: {
            common: 0,
            rare: 0,
            epic: 0,
            legendary: 0
        },
        expedition: null,
        minigames: {
            wheelCooldownUntil: 0,
            memoryCooldownUntil: 0
        },
        shopPurchases: {}
    };
}

function normalizeNumber(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
}

function normalizeRewardNumber(value, fallback = 0) {
    return Number(normalizeNumber(value, fallback).toFixed(3));
}

function normalizeAnimalState(rawAnimals, baseAnimals) {
    const result = {};
    const template = baseAnimals || getDefaultPlayer().animals;

    Object.keys(template).forEach((type) => {
        const raw = rawAnimals && rawAnimals[type] ? rawAnimals[type] : template[type];
        result[type] = {
            count: Math.max(0, normalizeNumber(raw?.count, 0)),
            level: Math.max(1, normalizeNumber(raw?.level, 1))
        };
    });

    return result;
}

function normalizeBoxes(rawBoxes) {
    return {
        common: Math.max(0, normalizeNumber(rawBoxes?.common, 0)),
        rare: Math.max(0, normalizeNumber(rawBoxes?.rare, 0)),
        epic: Math.max(0, normalizeNumber(rawBoxes?.epic, 0)),
        legendary: Math.max(0, normalizeNumber(rawBoxes?.legendary, 0))
    };
}

function normalizeMinigames(rawMinigames) {
    return {
        wheelCooldownUntil: Math.max(0, normalizeNumber(rawMinigames?.wheelCooldownUntil, 0)),
        memoryCooldownUntil: Math.max(0, normalizeNumber(rawMinigames?.memoryCooldownUntil, 0)),
        extraWheelSpins: Math.max(0, normalizeNumber(rawMinigames?.extraWheelSpins, 0))
    };
}

function normalizeShopPurchases(raw) {
    const result = {};
    const source = raw && typeof raw === "object" ? raw : {};

    Object.keys(source).forEach((key) => {
        result[key] = Math.max(0, normalizeNumber(source[key], 0));
    });

    return result;
}

function normalizeExpedition(rawExpedition) {
    if (!rawExpedition || typeof rawExpedition !== "object") {
        return null;
    }

    return {
        id: String(rawExpedition.id || ""),
        name: String(rawExpedition.name || "Expedition"),
        startTime: normalizeNumber(rawExpedition.startTime, Date.now()),
        endTime: normalizeNumber(rawExpedition.endTime, 0),
        rewardRarity: String(rawExpedition.rewardRarity || "common"),
        rewardCoins: Math.max(0, normalizeNumber(rawExpedition.rewardCoins, 0)),
        rewardGems: Math.max(0, normalizeNumber(rawExpedition.rewardGems, 0))
    };
}

function normalizePlayer(input) {
    const base = getDefaultPlayer(input?.telegramId, input?.username);

    return {
        ...base,
        telegramId: String(input?.telegramId || base.telegramId),
        username: String(input?.username || base.username),
        coins: Math.max(0, normalizeNumber(input?.coins, base.coins)),
        gems: Math.max(0, normalizeNumber(input?.gems, base.gems)),
        rewardBalance: normalizeRewardNumber(input?.rewardBalance, base.rewardBalance),
        rewardWallet: normalizeRewardNumber(input?.rewardWallet, base.rewardWallet),
        withdrawPending: normalizeRewardNumber(input?.withdrawPending, base.withdrawPending),
        level: Math.max(1, normalizeNumber(input?.level, base.level)),
        xp: Math.max(0, normalizeNumber(input?.xp, base.xp)),
        coinsPerClick: Math.max(1, normalizeNumber(input?.coinsPerClick, base.coinsPerClick)),
        upgradeCost: Math.max(0, normalizeNumber(input?.upgradeCost, base.upgradeCost)),
        zooIncome: Math.max(0, normalizeNumber(input?.zooIncome, base.zooIncome)),
        expeditionBoost: Math.max(0, normalizeNumber(input?.expeditionBoost, base.expeditionBoost)),
        offlineBoost: Math.max(1, normalizeNumber(input?.offlineBoost, base.offlineBoost)),
        lastLogin: normalizeNumber(input?.lastLogin, Date.now()),
        lastDailyRewardAt: Math.max(0, normalizeNumber(input?.lastDailyRewardAt, 0)),
        dailyRewardStreak: Math.max(0, normalizeNumber(input?.dailyRewardStreak, 0)),
        dailyRewardClaimDayKey: String(input?.dailyRewardClaimDayKey || ""),
        boost2xActiveUntil: Math.max(0, normalizeNumber(input?.boost2xActiveUntil, 0)),
        animals: normalizeAnimalState(input?.animals, base.animals),
        boxes: normalizeBoxes(input?.boxes),
        expedition: normalizeExpedition(input?.expedition),
        minigames: normalizeMinigames(input?.minigames),
        shopPurchases: normalizeShopPurchases(input?.shopPurchases)
    };
}

function getPlayerOrCreate(db, telegramId, username = "Gracz") {
    const id = String(telegramId || "local-player");

    if (!db.players[id]) {
        db.players[id] = getDefaultPlayer(id, username);
    }

    return db.players[id];
}

function createWithdrawRequest({ telegramId, username, amount }) {
    return {
        id: `wd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        telegramId: String(telegramId),
        username: String(username || "Gracz"),
        amount: normalizeRewardNumber(amount, 0),
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        note: ""
    };
}

/* =========================
   HEALTH
========================= */

app.get("/api/health", (req, res) => {
    res.json({ ok: true });
});

/* =========================
   PLAYER LOAD
========================= */

app.get("/api/player/:telegramId", (req, res) => {
    const db = readDb();
    const telegramId = String(req.params.telegramId || "local-player");

    const player = getPlayerOrCreate(db, telegramId);
    writeDb(db);

    res.json({ player });
});

/* =========================
   PLAYER SAVE
========================= */

app.post("/api/player/save", (req, res) => {
    const db = readDb();
    const incoming = normalizePlayer(req.body || {});
    const telegramId = String(incoming.telegramId || "local-player");

    db.players[telegramId] = {
        ...getPlayerOrCreate(db, telegramId, incoming.username),
        ...incoming
    };

    writeDb(db);

    res.json({
        ok: true,
        player: db.players[telegramId]
    });
});

/* =========================
   RANKING
========================= */

app.get("/api/ranking", (req, res) => {
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

/* =========================
   WITHDRAW REQUEST CREATE
========================= */

app.post("/api/withdraw/request", (req, res) => {
    const db = readDb();

    const telegramId = String(req.body?.telegramId || "");
    const username = String(req.body?.username || "Gracz");
    const amount = normalizeRewardNumber(req.body?.amount, 0);
    const minWithdraw = 10;

    if (!telegramId) {
        return res.status(400).json({ error: "Missing telegramId" });
    }

    if (amount < minWithdraw) {
        return res.status(400).json({
            error: `Minimum withdraw is ${minWithdraw.toFixed(3)} reward`
        });
    }

    const player = getPlayerOrCreate(db, telegramId, username);

    if (normalizeRewardNumber(player.rewardWallet, 0) < amount) {
        return res.status(400).json({
            error: "Not enough rewardWallet balance"
        });
    }

    player.rewardWallet = normalizeRewardNumber(player.rewardWallet - amount, 0);
    player.withdrawPending = normalizeRewardNumber(player.withdrawPending + amount, 0);

    const request = createWithdrawRequest({
        telegramId,
        username: player.username || username,
        amount
    });

    db.withdrawRequests.push(request);
    writeDb(db);

    return res.json({
        ok: true,
        request,
        player: normalizePlayer(player)
    });
});

/* =========================
   WITHDRAW LIST FOR PLAYER
========================= */

app.get("/api/withdraw/:telegramId", (req, res) => {
    const db = readDb();
    const telegramId = String(req.params.telegramId || "");

    const requests = db.withdrawRequests
        .filter((item) => String(item.telegramId) === telegramId)
        .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

    res.json({ requests });
});

/* =========================
   WITHDRAW STATUS UPDATE
   pending -> approved / rejected
========================= */

app.post("/api/withdraw/update", (req, res) => {
    const db = readDb();

    const requestId = String(req.body?.requestId || "");
    const nextStatus = String(req.body?.status || "").toLowerCase();
    const note = String(req.body?.note || "");

    if (!requestId) {
        return res.status(400).json({ error: "Missing requestId" });
    }

    if (!["approved", "rejected"].includes(nextStatus)) {
        return res.status(400).json({ error: "Invalid status" });
    }

    const request = db.withdrawRequests.find((item) => item.id === requestId);

    if (!request) {
        return res.status(404).json({ error: "Withdraw request not found" });
    }

    if (request.status !== "pending") {
        return res.status(400).json({ error: "Request already processed" });
    }

    const player = getPlayerOrCreate(db, request.telegramId, request.username);
    const amount = normalizeRewardNumber(request.amount, 0);

    request.status = nextStatus;
    request.note = note;
    request.updatedAt = Date.now();

    if (nextStatus === "approved") {
        player.withdrawPending = normalizeRewardNumber(player.withdrawPending - amount, 0);
    }

    if (nextStatus === "rejected") {
        player.withdrawPending = normalizeRewardNumber(player.withdrawPending - amount, 0);
        player.rewardWallet = normalizeRewardNumber(player.rewardWallet + amount, 0);
    }

    writeDb(db);

    return res.json({
        ok: true,
        request,
        player: normalizePlayer(player)
    });
});

ensureDb();

app.listen(PORT, () => {
    console.log(`Crypto Zoo backend running on port ${PORT}`);
});