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
   CONFIG
========================= */

const LIMITS = {
    MAX_COINS: 1e15,
    MAX_GEMS: 1e6,
    MAX_LEVEL: 1000,
    MAX_XP: 1e9,

    MAX_REWARD_BALANCE: 100000,
    MAX_REWARD_WALLET: 100000,
    MAX_WITHDRAW_PENDING: 100000,

    MAX_COINS_GAIN_PER_SAVE: 5e9,
    MAX_GEMS_GAIN_PER_SAVE: 500,
    MAX_LEVEL_GAIN_PER_SAVE: 5,

    MAX_REWARD_BALANCE_GAIN_PER_SAVE: 10,
    MAX_REWARD_WALLET_GAIN_PER_SAVE: 10,
    MAX_REWARD_TOTAL_GAIN_PER_SAVE: 10,

    MIN_WITHDRAW: 3,
    MAX_WITHDRAW: 100000,
    WITHDRAW_COOLDOWN_MS: 5 * 60 * 1000
};

const ADMIN_SECRET = String(process.env.ADMIN_SECRET || "");

/* =========================
   DB
========================= */

function ensureDb() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(
            DB_PATH,
            JSON.stringify(
                {
                    players: {},
                    withdrawRequests: []
                },
                null,
                2
            ),
            "utf8"
        );
    }
}

function readDb() {
    ensureDb();

    try {
        const raw = fs.readFileSync(DB_PATH, "utf8");
        const parsed = JSON.parse(raw);

        return {
            players: parsed.players || {},
            withdrawRequests: Array.isArray(parsed.withdrawRequests)
                ? parsed.withdrawRequests
                : []
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

/* =========================
   HELPERS
========================= */

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

function normalizeNumber(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
}

function normalizeRewardNumber(value, fallback = 0) {
    return Number(normalizeNumber(value, fallback).toFixed(3));
}

function safeString(value, fallback = "") {
    return String(value || fallback).trim();
}

function normalizeTelegramUser(rawTelegramUser, fallbackTelegramId = "local-player", fallbackUsername = "Gracz") {
    const safe = rawTelegramUser && typeof rawTelegramUser === "object"
        ? rawTelegramUser
        : {};

    const id = safeString(
        safe.id,
        safeString(fallbackTelegramId, "local-player")
    );

    const username = safeString(
        safe.username,
        safeString(fallbackUsername, "")
    );

    const firstName = safeString(
        safe.first_name,
        username || "Gracz"
    );

    return {
        id,
        username,
        first_name: firstName,
        isMock: !!safe.isMock,
        isTelegramWebApp: !!safe.isTelegramWebApp
    };
}

function getDefaultPlayer(telegramId = "local-player", username = "Gracz") {
    return {
        telegramId: String(telegramId),
        username: String(username || "Gracz"),

        telegramUser: {
            id: String(telegramId),
            username: String(username || ""),
            first_name: String(username || "Gracz"),
            isMock: String(telegramId) === "local-player",
            isTelegramWebApp: false
        },

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

        offlineMaxSeconds: 1 * 60 * 60,
        offlineBoostMultiplier: 1,
        offlineBoostActiveUntil: 0,
        offlineBoost: 1,

        lastLogin: Date.now(),
        lastDailyRewardAt: 0,
        dailyRewardStreak: 0,
        dailyRewardClaimDayKey: "",
        boost2xActiveUntil: 0,
        playTimeSeconds: 0,
        lastAwardedLevel: 1,

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
            memoryCooldownUntil: 0,
            extraWheelSpins: 0
        },

        shopPurchases: {},

        expeditionStats: {
            rareChanceBonus: 0,
            epicChanceBonus: 0,
            timeReductionSeconds: 0,
            timeBoostCharges: []
        },

        dailyMissions: {
            dayKey: "",
            missions: [],
            claimedCount: 0
        }
    };
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
        duration: Math.max(0, normalizeNumber(rawExpedition.duration, 0)),
        baseDuration: Math.max(0, normalizeNumber(rawExpedition.baseDuration, 0)),
        timeReductionUsed: Math.max(0, normalizeNumber(rawExpedition.timeReductionUsed, 0)),
        rewardRarity: String(rawExpedition.rewardRarity || "common"),
        rewardCoins: Math.max(0, normalizeNumber(rawExpedition.rewardCoins, 0)),
        rewardGems: Math.max(0, normalizeNumber(rawExpedition.rewardGems, 0))
    };
}

function normalizeExpeditionStats(rawExpeditionStats) {
    const timeBoostCharges = Array.isArray(rawExpeditionStats?.timeBoostCharges)
        ? rawExpeditionStats.timeBoostCharges
            .map((value) => Math.max(0, normalizeNumber(value, 0)))
            .filter((value) => value > 0)
        : [];

    return {
        rareChanceBonus: Math.max(0, normalizeNumber(rawExpeditionStats?.rareChanceBonus, 0)),
        epicChanceBonus: Math.max(0, normalizeNumber(rawExpeditionStats?.epicChanceBonus, 0)),
        timeReductionSeconds: Math.max(0, normalizeNumber(rawExpeditionStats?.timeReductionSeconds, 0)),
        timeBoostCharges
    };
}

function normalizeDailyMissions(rawDailyMissions) {
    const safe = rawDailyMissions && typeof rawDailyMissions === "object"
        ? rawDailyMissions
        : {};

    return {
        dayKey: String(safe.dayKey || ""),
        claimedCount: Math.max(0, normalizeNumber(safe.claimedCount, 0)),
        missions: Array.isArray(safe.missions)
            ? safe.missions.map((mission) => ({
                id: String(mission?.id || ""),
                type: String(mission?.type || ""),
                target: Math.max(1, normalizeNumber(mission?.target, 1)),
                progress: Math.max(0, normalizeNumber(mission?.progress, 0)),
                title: String(mission?.title || "Misja"),
                rewardCoins: Math.max(0, normalizeNumber(mission?.rewardCoins, 0)),
                rewardGems: Math.max(0, normalizeNumber(mission?.rewardGems, 0)),
                claimed: !!mission?.claimed
            }))
            : []
    };
}

function normalizePlayer(input) {
    const base = getDefaultPlayer(input?.telegramId, input?.username);
    const safeTelegramId = safeString(input?.telegramId, base.telegramId);
    const safeUsername = safeString(input?.username, base.username);
    const telegramUser = normalizeTelegramUser(
        input?.telegramUser,
        safeTelegramId,
        safeUsername
    );

    return {
        ...base,

        telegramId: safeTelegramId,
        username: safeUsername || telegramUser.first_name || "Gracz",
        telegramUser,

        coins: clamp(Math.max(0, normalizeNumber(input?.coins, base.coins)), 0, LIMITS.MAX_COINS),
        gems: clamp(Math.max(0, normalizeNumber(input?.gems, base.gems)), 0, LIMITS.MAX_GEMS),

        rewardBalance: clamp(
            normalizeRewardNumber(input?.rewardBalance, base.rewardBalance),
            0,
            LIMITS.MAX_REWARD_BALANCE
        ),
        rewardWallet: clamp(
            normalizeRewardNumber(input?.rewardWallet, base.rewardWallet),
            0,
            LIMITS.MAX_REWARD_WALLET
        ),
        withdrawPending: clamp(
            normalizeRewardNumber(input?.withdrawPending, base.withdrawPending),
            0,
            LIMITS.MAX_WITHDRAW_PENDING
        ),

        level: clamp(Math.max(1, normalizeNumber(input?.level, base.level)), 1, LIMITS.MAX_LEVEL),
        xp: clamp(Math.max(0, normalizeNumber(input?.xp, base.xp)), 0, LIMITS.MAX_XP),
        coinsPerClick: Math.max(1, normalizeNumber(input?.coinsPerClick, base.coinsPerClick)),
        upgradeCost: Math.max(0, normalizeNumber(input?.upgradeCost, base.upgradeCost)),
        zooIncome: Math.max(0, normalizeNumber(input?.zooIncome, base.zooIncome)),
        expeditionBoost: Math.max(0, normalizeNumber(input?.expeditionBoost, base.expeditionBoost)),

        offlineMaxSeconds: Math.max(0, normalizeNumber(input?.offlineMaxSeconds, base.offlineMaxSeconds)),
        offlineBoostMultiplier: Math.max(1, normalizeNumber(input?.offlineBoostMultiplier, base.offlineBoostMultiplier)),
        offlineBoostActiveUntil: Math.max(0, normalizeNumber(input?.offlineBoostActiveUntil, base.offlineBoostActiveUntil)),
        offlineBoost: Math.max(1, normalizeNumber(input?.offlineBoost, base.offlineBoost)),

        lastLogin: normalizeNumber(input?.lastLogin, Date.now()),
        lastDailyRewardAt: Math.max(0, normalizeNumber(input?.lastDailyRewardAt, 0)),
        dailyRewardStreak: Math.max(0, normalizeNumber(input?.dailyRewardStreak, 0)),
        dailyRewardClaimDayKey: String(input?.dailyRewardClaimDayKey || ""),
        boost2xActiveUntil: Math.max(0, normalizeNumber(input?.boost2xActiveUntil, 0)),
        playTimeSeconds: Math.max(0, normalizeNumber(input?.playTimeSeconds, 0)),
        lastAwardedLevel: Math.max(1, normalizeNumber(input?.lastAwardedLevel, base.lastAwardedLevel)),

        animals: normalizeAnimalState(input?.animals, base.animals),
        boxes: normalizeBoxes(input?.boxes),
        expedition: normalizeExpedition(input?.expedition),
        minigames: normalizeMinigames(input?.minigames),
        shopPurchases: normalizeShopPurchases(input?.shopPurchases),
        expeditionStats: normalizeExpeditionStats(input?.expeditionStats),
        dailyMissions: normalizeDailyMissions(input?.dailyMissions)
    };
}

function getPlayerOrCreate(db, telegramId, username = "Gracz", telegramUser = null) {
    const id = String(telegramId || "local-player");

    if (!db.players[id]) {
        db.players[id] = getDefaultPlayer(id, username);
    }

    db.players[id] = normalizePlayer({
        ...db.players[id],
        telegramId: id,
        username: safeString(username, db.players[id].username || "Gracz"),
        telegramUser: telegramUser || db.players[id].telegramUser
    });

    return db.players[id];
}

function sanitizeRewardState(oldPlayer, newPlayer) {
    const safePlayer = normalizePlayer(newPlayer);

    if (!oldPlayer) {
        return safePlayer;
    }

    const oldSafe = normalizePlayer(oldPlayer);

    safePlayer.withdrawPending = oldSafe.withdrawPending;

    const rewardBalanceDiff = safePlayer.rewardBalance - oldSafe.rewardBalance;
    const rewardWalletDiff = safePlayer.rewardWallet - oldSafe.rewardWallet;

    const oldTotalReward =
        oldSafe.rewardBalance +
        oldSafe.rewardWallet +
        oldSafe.withdrawPending;

    const newTotalReward =
        safePlayer.rewardBalance +
        safePlayer.rewardWallet +
        safePlayer.withdrawPending;

    const totalRewardDiff = newTotalReward - oldTotalReward;

    if (rewardBalanceDiff > LIMITS.MAX_REWARD_BALANCE_GAIN_PER_SAVE) {
        safePlayer.rewardBalance = oldSafe.rewardBalance;
    }

    if (rewardWalletDiff > LIMITS.MAX_REWARD_WALLET_GAIN_PER_SAVE) {
        safePlayer.rewardWallet = oldSafe.rewardWallet;
    }

    if (totalRewardDiff > LIMITS.MAX_REWARD_TOTAL_GAIN_PER_SAVE) {
        safePlayer.rewardBalance = oldSafe.rewardBalance;
        safePlayer.rewardWallet = oldSafe.rewardWallet;
        safePlayer.withdrawPending = oldSafe.withdrawPending;
    }

    safePlayer.rewardBalance = clamp(
        normalizeRewardNumber(safePlayer.rewardBalance, oldSafe.rewardBalance),
        0,
        LIMITS.MAX_REWARD_BALANCE
    );

    safePlayer.rewardWallet = clamp(
        normalizeRewardNumber(safePlayer.rewardWallet, oldSafe.rewardWallet),
        0,
        LIMITS.MAX_REWARD_WALLET
    );

    safePlayer.withdrawPending = clamp(
        normalizeRewardNumber(oldSafe.withdrawPending, oldSafe.withdrawPending),
        0,
        LIMITS.MAX_WITHDRAW_PENDING
    );

    return safePlayer;
}

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

    if (newPlayer.xp < oldPlayer.xp && oldPlayer.xp - newPlayer.xp > 5000) {
        newPlayer.xp = oldPlayer.xp;
    }

    return newPlayer;
}

function buildSafePlayerState(oldPlayer, incomingRaw) {
    const incomingTelegramId = safeString(
        incomingRaw?.telegramId,
        oldPlayer?.telegramId || "local-player"
    );
    const incomingUsername = safeString(
        incomingRaw?.username,
        oldPlayer?.username || "Gracz"
    );

    const incoming = normalizePlayer({
        ...incomingRaw,
        telegramId: incomingTelegramId,
        username: incomingUsername,
        telegramUser: normalizeTelegramUser(
            incomingRaw?.telegramUser,
            incomingTelegramId,
            incomingUsername
        )
    });

    let safe = normalizePlayer({
        ...(oldPlayer || getDefaultPlayer(incoming.telegramId, incoming.username)),
        ...incoming,
        telegramId: incoming.telegramId,
        username: incoming.username,
        telegramUser: incoming.telegramUser
    });

    safe = sanitizeRewardState(oldPlayer, safe);
    safe = validateProgress(oldPlayer, safe);

    return normalizePlayer(safe);
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

function getPendingWithdrawsForPlayer(db, telegramId) {
    return db.withdrawRequests.filter(
        (item) =>
            String(item.telegramId) === String(telegramId) &&
            String(item.status || "pending").toLowerCase() === "pending"
    );
}

function getLatestWithdrawForPlayer(db, telegramId) {
    const requests = db.withdrawRequests
        .filter((item) => String(item.telegramId) === String(telegramId))
        .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

    return requests[0] || null;
}

function requireAdmin(req, res) {
    if (!ADMIN_SECRET) {
        res.status(403).json({ error: "Admin secret not configured" });
        return false;
    }

    const provided =
        req.headers["x-admin-secret"] ||
        req.body?.adminSecret ||
        "";

    if (String(provided) !== ADMIN_SECRET) {
        res.status(403).json({ error: "Forbidden" });
        return false;
    }

    return true;
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
    const telegramId = safeString(req.params.telegramId, "local-player");
    const username = safeString(req.query.username, "Gracz");

    const player = getPlayerOrCreate(db, telegramId, username);
    db.players[telegramId] = normalizePlayer(player);
    writeDb(db);

    res.json({ player: normalizePlayer(db.players[telegramId]) });
});

/* =========================
   PLAYER SAVE
========================= */

app.post("/api/player/save", (req, res) => {
    const db = readDb();

    const bodyTelegramUser = normalizeTelegramUser(
        req.body?.telegramUser,
        req.body?.telegramId,
        req.body?.username
    );

    const telegramId = safeString(
        req.body?.telegramId,
        bodyTelegramUser.id || "local-player"
    );

    const username = safeString(
        req.body?.username,
        bodyTelegramUser.username || bodyTelegramUser.first_name || "Gracz"
    );

    const oldPlayer = db.players[telegramId]
        ? normalizePlayer(db.players[telegramId])
        : getDefaultPlayer(telegramId, username);

    const safePlayer = buildSafePlayerState(oldPlayer, {
        ...req.body,
        telegramId,
        username,
        telegramUser: {
            ...bodyTelegramUser,
            id: telegramId,
            username: bodyTelegramUser.username || username,
            first_name: bodyTelegramUser.first_name || username || "Gracz"
        }
    });

    db.players[telegramId] = safePlayer;
    writeDb(db);

    res.json({
        ok: true,
        player: safePlayer
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

    const telegramId = safeString(req.body?.telegramId, "");
    const username = safeString(req.body?.username, "Gracz");
    const amount = clamp(
        normalizeRewardNumber(req.body?.amount, 0),
        0,
        LIMITS.MAX_WITHDRAW
    );

    if (!telegramId) {
        return res.status(400).json({ error: "Missing telegramId" });
    }

    if (amount < LIMITS.MIN_WITHDRAW) {
        return res.status(400).json({
            error: `Minimum withdraw is ${LIMITS.MIN_WITHDRAW.toFixed(3)} reward`
        });
    }

    if (amount > LIMITS.MAX_WITHDRAW) {
        return res.status(400).json({
            error: `Maximum withdraw is ${LIMITS.MAX_WITHDRAW.toFixed(3)} reward`
        });
    }

    const player = getPlayerOrCreate(db, telegramId, username);

    const pendingRequests = getPendingWithdrawsForPlayer(db, telegramId);
    if (pendingRequests.length > 0) {
        return res.status(400).json({
            error: "You already have a pending withdraw request"
        });
    }

    const latestRequest = getLatestWithdrawForPlayer(db, telegramId);
    if (
        latestRequest &&
        Date.now() - Number(latestRequest.createdAt || 0) < LIMITS.WITHDRAW_COOLDOWN_MS
    ) {
        return res.status(400).json({
            error: "Withdraw cooldown active, try again later"
        });
    }

    if (normalizeRewardNumber(player.rewardWallet, 0) < amount) {
        return res.status(400).json({
            error: "Not enough rewardWallet balance"
        });
    }

    player.rewardWallet = clamp(
        normalizeRewardNumber(player.rewardWallet - amount, 0),
        0,
        LIMITS.MAX_REWARD_WALLET
    );

    player.withdrawPending = clamp(
        normalizeRewardNumber(player.withdrawPending + amount, 0),
        0,
        LIMITS.MAX_WITHDRAW_PENDING
    );

    const request = createWithdrawRequest({
        telegramId,
        username: player.username || username,
        amount
    });

    db.withdrawRequests.push(request);
    db.players[telegramId] = normalizePlayer(player);
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
========================= */

app.post("/api/withdraw/update", (req, res) => {
    if (!requireAdmin(req, res)) return;

    const db = readDb();

    const requestId = safeString(req.body?.requestId, "");
    const nextStatus = safeString(req.body?.status, "").toLowerCase();
    const note = safeString(req.body?.note, "");

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
        player.withdrawPending = clamp(
            normalizeRewardNumber(player.withdrawPending - amount, 0),
            0,
            LIMITS.MAX_WITHDRAW_PENDING
        );
    }

    if (nextStatus === "rejected") {
        player.withdrawPending = clamp(
            normalizeRewardNumber(player.withdrawPending - amount, 0),
            0,
            LIMITS.MAX_WITHDRAW_PENDING
        );
        player.rewardWallet = clamp(
            normalizeRewardNumber(player.rewardWallet + amount, 0),
            0,
            LIMITS.MAX_REWARD_WALLET
        );
    }

    db.players[player.telegramId] = normalizePlayer(player);
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