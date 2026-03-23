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

/* =========================
   CONFIG (ANTI-CHEAT)
========================= */

const LIMITS = {
    MAX_COINS: 1e15,
    MAX_GEMS: 1e6,
    MAX_LEVEL: 1000,
    MAX_XP: 1e9,
    MAX_COINS_GAIN_PER_SAVE: 5e9,
    MAX_GEMS_GAIN_PER_SAVE: 500,
    MAX_LEVEL_GAIN_PER_SAVE: 5
};

const SHOP_CONFIG = {
    click: {
        click1: 1,
        click2: 2,
        click3: 3,
        click4: 5,
        click5: 8
    },
    expedition: {
        expedition1: 1,
        expedition2: 1,
        expedition3: 1
    }
};

/* =========================
   DB
========================= */

function ensureDb() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify({
            players: {},
            withdrawRequests: []
        }, null, 2));
    }
}

function readDb() {
    ensureDb();
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function writeDb(db) {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

/* =========================
   HELPERS
========================= */

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

function normalizeNumber(v, d = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
}

/* =========================
   DERIVED SYSTEMS
========================= */

function recalcZooIncome(animals) {
    const base = {
        monkey: 1, panda: 3, lion: 8, tiger: 18, elephant: 42,
        giraffe: 95, zebra: 210, hippo: 470, penguin: 1050,
        bear: 2300, crocodile: 5000, kangaroo: 10800, wolf: 23000
    };

    let total = 0;

    Object.keys(base).forEach(type => {
        const a = animals[type] || { count: 0, level: 1 };
        total += a.count * a.level * base[type];
    });

    return total;
}

function recalcClick(shopPurchases) {
    let base = 1;

    Object.entries(SHOP_CONFIG.click).forEach(([id, val]) => {
        const owned = shopPurchases[id] || 0;
        base += owned * val;
    });

    return base;
}

function recalcExpedition(shopPurchases) {
    let total = 0;

    Object.entries(SHOP_CONFIG.expedition).forEach(([id, val]) => {
        const owned = shopPurchases[id] || 0;
        total += owned * val;
    });

    return total;
}

/* =========================
   ANTI CHEAT CORE
========================= */

function validateProgress(oldPlayer, newPlayer) {
    if (!oldPlayer) return newPlayer;

    const coinsDiff = newPlayer.coins - oldPlayer.coins;
    const gemsDiff = newPlayer.gems - oldPlayer.gems;
    const levelDiff = newPlayer.level - oldPlayer.level;

    if (coinsDiff > LIMITS.MAX_COINS_GAIN_PER_SAVE) {
        newPlayer.coins = oldPlayer.coins;
    }

    if (gemsDiff > LIMITS.MAX_GEMS_GAIN_PER_SAVE) {
        newPlayer.gems = oldPlayer.gems;
    }

    if (levelDiff > LIMITS.MAX_LEVEL_GAIN_PER_SAVE) {
        newPlayer.level = oldPlayer.level;
    }

    return newPlayer;
}

/* =========================
   PLAYER SAVE (SECURE)
========================= */

app.post("/api/player/save", (req, res) => {
    const db = readDb();
    const incoming = req.body || {};
    const id = String(incoming.telegramId || "local-player");

    const oldPlayer = db.players[id] || null;

    let player = {
        ...incoming
    };

    // REBUILD TRUSTED VALUES
    player.coins = clamp(normalizeNumber(player.coins), 0, LIMITS.MAX_COINS);
    player.gems = clamp(normalizeNumber(player.gems), 0, LIMITS.MAX_GEMS);
    player.level = clamp(normalizeNumber(player.level), 1, LIMITS.MAX_LEVEL);
    player.xp = clamp(normalizeNumber(player.xp), 0, LIMITS.MAX_XP);

    player.animals = player.animals || {};
    player.shopPurchases = player.shopPurchases || {};

    // SERVER CALCULATED
    player.zooIncome = recalcZooIncome(player.animals);
    player.coinsPerClick = recalcClick(player.shopPurchases);
    player.expeditionBoost = recalcExpedition(player.shopPurchases);

    // VALIDATE PROGRESS
    player = validateProgress(oldPlayer, player);

    db.players[id] = player;
    writeDb(db);

    res.json({ ok: true, player });
});

/* =========================
   LOAD
========================= */

app.get("/api/player/:id", (req, res) => {
    const db = readDb();
    const id = req.params.id;

    if (!db.players[id]) {
        db.players[id] = {
            telegramId: id,
            coins: 0,
            gems: 0,
            level: 1,
            xp: 0,
            animals: {},
            shopPurchases: {}
        };
        writeDb(db);
    }

    res.json({ player: db.players[id] });
});

/* ========================= */

app.listen(PORT, () => {
    console.log("SERVER RUNNING " + PORT);
});