const express = require("express");

const { readDb, writeDb } = require("../db/db");
const { EXPEDITIONS_CONFIG, LIMITS } = require("../config/game-config");
const { safeString, clamp, normalizeRewardNumber } = require("../utils/helpers");
const { getPlayerOrCreate, normalizePlayer } = require("../services/player-service");

const router = express.Router();

function getAllExpeditions() {
    return Object.values(EXPEDITIONS_CONFIG || {});
}

function getExpeditionById(id) {
    return getAllExpeditions().find((exp) => String(exp.id) === String(id)) || null;
}

function normalizeRewardRarity(rarity) {
    const safeRarity = String(rarity || "common").toLowerCase();
    if (safeRarity === "rare") return "rare";
    if (safeRarity === "epic") return "epic";
    return "common";
}

function getRareChanceBonus(player) {
    return Math.max(0, Number(player?.expeditionStats?.rareChanceBonus) || 0);
}

function getEpicChanceBonus(player) {
    return Math.max(0, Number(player?.expeditionStats?.epicChanceBonus) || 0);
}

function getTimeBoostCharges(player) {
    const list = Array.isArray(player?.expeditionStats?.timeBoostCharges)
        ? player.expeditionStats.timeBoostCharges
        : [];

    return list
        .map((value) => Math.max(0, Number(value) || 0))
        .filter((value) => value > 0)
        .sort((a, b) => a - b);
}

function setTimeBoostCharges(player, charges) {
    player.expeditionStats = player.expeditionStats || {
        rareChanceBonus: 0,
        epicChanceBonus: 0,
        timeReductionSeconds: 0,
        timeBoostCharges: []
    };

    player.expeditionStats.timeBoostCharges = Array.isArray(charges) ? charges : [];
}

function getEffectiveRareChance(player, expedition) {
    const baseRareChance = Math.max(0, Number(expedition?.rareChance) || 0);
    return Math.min(0.8, baseRareChance + getRareChanceBonus(player));
}

function getEffectiveEpicChance(player, expedition) {
    const baseEpicChance = Math.max(0, Number(expedition?.epicChance) || 0);
    return Math.min(0.35, baseEpicChance + getEpicChanceBonus(player));
}

function getEffectiveGemChance(expedition, rewardRarity = "common") {
    let chance = Math.max(0, Number(expedition?.gemChance) || 0);

    if (rewardRarity === "rare") chance += 0.02;
    if (rewardRarity === "epic") chance += 0.05;

    return Math.min(0.16, chance);
}

function getExpeditionBoostMultiplier(player) {
    const activeUntil = Math.max(0, Number(player?.expeditionBoostActiveUntil) || 0);
    const boost = Math.max(0, Number(player?.expeditionBoost) || 0);

    if (activeUntil <= Date.now()) {
        return 1;
    }

    return 1 + boost;
}

function getDailyExpeditionBoostMultiplier(player) {
    const activeUntil = Math.max(0, Number(player?.dailyExpeditionBoost?.activeUntil) || 0);
    const now = Date.now();

    if (activeUntil > now) {
        return 1.25;
    }

    return 1;
}

function getTotalExpeditionRewardMultiplier(player) {
    return getExpeditionBoostMultiplier(player) * getDailyExpeditionBoostMultiplier(player);
}

function rollRewardRarity(player, expedition) {
    const epicChance = getEffectiveEpicChance(player, expedition);
    const rareChance = getEffectiveRareChance(player, expedition);
    const roll = Math.random();

    if (roll < epicChance) return "epic";
    if (roll < epicChance + rareChance) return "rare";
    return "common";
}

function getCoinsReward(player, expedition, rewardRarity) {
    const baseCoins = Math.max(0, Number(expedition?.baseCoins) || 0);
    const boostMultiplier = getTotalExpeditionRewardMultiplier(player);

    let rarityMultiplier = 1;
    if (rewardRarity === "rare") rarityMultiplier = 1.35;
    if (rewardRarity === "epic") rarityMultiplier = 1.95;

    return Math.max(0, Math.floor(baseCoins * rarityMultiplier * boostMultiplier));
}

function getGemsReward(expedition, rewardRarity) {
    const chance = getEffectiveGemChance(expedition, rewardRarity);

    if (Math.random() >= chance) {
        return 0;
    }

    if (rewardRarity === "epic") {
        return Math.random() < 0.20 ? 2 : 1;
    }

    return 1;
}

function getRewardTierMultiplier(expeditionId) {
    const tierMap = {
        forest: 1.00,
        river: 1.03,
        volcano: 1.06,
        canyon: 1.10,
        glacier: 1.14,
        jungle: 1.18,
        temple: 1.22,
        oasis: 1.26,
        kingdom: 1.30
    };

    return Number(tierMap[String(expeditionId || "").toLowerCase()]) || 1.0;
}

function getRewardBalanceAmount(player, expeditionState) {
    const durationSeconds = Math.max(
        60,
        Number(expeditionState?.baseDuration) ||
        Number(expeditionState?.duration) ||
        60
    );

    const hours = durationSeconds / 3600;
    const tierMultiplier = getRewardTierMultiplier(expeditionState?.id);
    const rewardRarity = normalizeRewardRarity(expeditionState?.rewardRarity);

    let rarityMultiplier = 1;
    if (rewardRarity === "rare") rarityMultiplier = 1.35;
    if (rewardRarity === "epic") rarityMultiplier = 1.90;

    const boostMultiplier = getTotalExpeditionRewardMultiplier(player);

    let reward = hours * 0.024 * tierMultiplier * rarityMultiplier * boostMultiplier;
    reward = Math.min(reward, 1.5);

    return Number(reward.toFixed(3));
}

function buildActiveExpedition(player, expedition) {
    const now = Date.now();
    const baseDuration = Math.max(
        60,
        Number(expedition?.baseDuration) ||
        Number(expedition?.duration) ||
        60
    );

    const rewardRarity = rollRewardRarity(player, expedition);
    const rewardCoins = getCoinsReward(player, expedition, rewardRarity);
    const rewardGems = getGemsReward(expedition, rewardRarity);
    const startCostCoins = Math.max(0, Math.floor(Number(expedition?.startCostCoins) || 0));

    return {
        id: String(expedition.id || ""),
        name: String(expedition.name || "Expedition"),
        startTime: now,
        endTime: now + baseDuration * 1000,
        duration: baseDuration,
        baseDuration,
        timeReductionUsed: 0,
        rewardRarity,
        rewardCoins,
        rewardGems,
        startCostCoins,
        selectedAnimals: [],
        claimed: false,
        collectedAt: 0
    };
}

function hasActiveExpedition(player) {
    return !!(player?.expedition && typeof player.expedition === "object");
}

function getActiveExpedition(player) {
    if (!hasActiveExpedition(player)) return null;
    return player.expedition;
}

function canCollect(player) {
    const expedition = getActiveExpedition(player);
    if (!expedition) return false;
    if (expedition.claimed) return false;

    return Date.now() >= Math.max(0, Number(expedition.endTime) || 0);
}

function consumeBestTimeBoostCharge(player, remainingSeconds) {
    const charges = getTimeBoostCharges(player);
    if (!charges.length) return 0;

    const safeRemaining = Math.max(0, Number(remainingSeconds) || 0);
    const maxAllowedReduction = Math.max(0, safeRemaining - 60);

    if (maxAllowedReduction <= 0) {
        return 0;
    }

    let bestApplied = 0;
    let bestIndex = -1;

    charges.forEach((charge, index) => {
        const safeCharge = Math.max(0, Number(charge) || 0);
        const applied = Math.min(safeCharge, maxAllowedReduction);

        if (applied > bestApplied) {
            bestApplied = applied;
            bestIndex = index;
        }
    });

    if (bestIndex === -1 || bestApplied <= 0) {
        return 0;
    }

    charges.splice(bestIndex, 1);
    setTimeBoostCharges(player, charges);

    return bestApplied;
}

router.post("/api/expedition/start", (req, res) => {
    const db = readDb();

    const telegramId = safeString(req.body?.telegramId, "");
    const username = safeString(req.body?.username, "Gracz");
    const expeditionId = safeString(req.body?.expeditionId, "");

    if (!telegramId) {
        return res.status(400).json({ error: "Missing telegramId" });
    }

    if (!expeditionId) {
        return res.status(400).json({ error: "Missing expeditionId" });
    }

    const expedition = getExpeditionById(expeditionId);
    if (!expedition) {
        return res.status(404).json({ error: "Expedition not found" });
    }

    const player = getPlayerOrCreate(db, telegramId, username);

    if (hasActiveExpedition(player)) {
        return res.status(400).json({ error: "Active expedition already exists" });
    }

    const requiredLevel = Math.max(1, Number(expedition.unlockLevel) || 1);
    const playerLevel = Math.max(1, Number(player.level) || 1);

    if (playerLevel < requiredLevel) {
        return res.status(400).json({ error: `Required level: ${requiredLevel}` });
    }

    const startCostCoins = Math.max(0, Math.floor(Number(expedition.startCostCoins) || 0));
    const currentCoins = Math.max(0, Number(player.coins) || 0);

    if (currentCoins < startCostCoins) {
        return res.status(400).json({ error: "Not enough coins" });
    }

    player.coins = clamp(currentCoins - startCostCoins, 0, LIMITS.MAX_COINS);
    player.expedition = buildActiveExpedition(player, expedition);
    player.updatedAt = Date.now();

    db.players[telegramId] = normalizePlayer(player);
    writeDb(db);

    return res.json({
        ok: true,
        expedition: db.players[telegramId].expedition,
        player: db.players[telegramId]
    });
});

router.post("/api/expedition/time-boost", (req, res) => {
    const db = readDb();

    const telegramId = safeString(req.body?.telegramId, "");
    const username = safeString(req.body?.username, "Gracz");

    if (!telegramId) {
        return res.status(400).json({ error: "Missing telegramId" });
    }

    const player = getPlayerOrCreate(db, telegramId, username);
    const expedition = getActiveExpedition(player);

    if (!expedition) {
        return res.status(400).json({ error: "No active expedition" });
    }

    if (expedition.claimed) {
        return res.status(400).json({ error: "Expedition already claimed" });
    }

    const remainingSeconds = Math.max(
        0,
        Math.floor((Number(expedition.endTime) - Date.now()) / 1000)
    );

    if (remainingSeconds <= 0) {
        return res.status(400).json({ error: "Expedition already ready" });
    }

    const reductionSeconds = consumeBestTimeBoostCharge(player, remainingSeconds);

    if (reductionSeconds <= 0) {
        return res.status(400).json({ error: "No valid time boost available" });
    }

    expedition.endTime = Math.max(
        Date.now(),
        Number(expedition.endTime) - reductionSeconds * 1000
    );

    expedition.duration = Math.max(
        60,
        Math.floor((Number(expedition.endTime) - Number(expedition.startTime)) / 1000)
    );

    expedition.timeReductionUsed = Math.max(
        0,
        Number(expedition.timeReductionUsed) || 0
    ) + reductionSeconds;

    player.updatedAt = Date.now();

    db.players[telegramId] = normalizePlayer(player);
    writeDb(db);

    return res.json({
        ok: true,
        reductionSeconds,
        expedition: db.players[telegramId].expedition,
        player: db.players[telegramId]
    });
});

router.post("/api/expedition/collect", (req, res) => {
    const db = readDb();

    const telegramId = safeString(req.body?.telegramId, "");
    const username = safeString(req.body?.username, "Gracz");

    if (!telegramId) {
        return res.status(400).json({ error: "Missing telegramId" });
    }

    const player = getPlayerOrCreate(db, telegramId, username);
    const expedition = getActiveExpedition(player);

    if (!expedition) {
        return res.status(400).json({ error: "No active expedition" });
    }

    if (expedition.claimed || Number(expedition.collectedAt) > 0) {
        return res.status(400).json({ error: "Expedition already collected" });
    }

    if (!canCollect(player)) {
        return res.status(400).json({ error: "Expedition still in progress" });
    }

    expedition.claimed = true;
    expedition.collectedAt = Date.now();

    const coins = Math.max(0, Number(expedition.rewardCoins) || 0);
    const gems = Math.max(0, Number(expedition.rewardGems) || 0);
    const rewardBalance = Math.max(0, getRewardBalanceAmount(player, expedition));

    player.coins = clamp((Number(player.coins) || 0) + coins, 0, LIMITS.MAX_COINS);
    player.gems = clamp((Number(player.gems) || 0) + gems, 0, LIMITS.MAX_GEMS);
    player.rewardBalance = clamp(
        normalizeRewardNumber((Number(player.rewardBalance) || 0) + rewardBalance, 0),
        0,
        LIMITS.MAX_REWARD_BALANCE
    );

    player.expedition = null;
    player.updatedAt = Date.now();

    db.players[telegramId] = normalizePlayer(player);
    writeDb(db);

    return res.json({
        ok: true,
        rewards: {
            coins,
            gems,
            rewardBalance
        },
        player: db.players[telegramId]
    });
});

router.get("/api/expedition/:telegramId", (req, res) => {
    const db = readDb();
    const telegramId = safeString(req.params.telegramId, "");

    if (!telegramId) {
        return res.status(400).json({ error: "Missing telegramId" });
    }

    const player = getPlayerOrCreate(db, telegramId, "Gracz");

    return res.json({
        ok: true,
        expedition: player.expedition || null,
        player: normalizePlayer(player)
    });
});

module.exports = router;