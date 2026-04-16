const express = require("express");

const { readDb, writeDb } = require("../db/db");
const { LIMITS } = require("../config/game-config");
const {
    EXPEDITIONS_CONFIG,
    getAllExpeditions,
    getExpeditionById
} = require("../config/expeditions-config");
const { safeString, clamp, normalizeRewardNumber } = require("../utils/helpers");
const { getPlayerOrCreate, normalizePlayer } = require("../services/player-service");

const router = express.Router();

function normalizeRewardRarity(rarity) {
    const safeRarity = String(rarity || "common").toLowerCase();
    if (safeRarity === "rare") return "rare";
    if (safeRarity === "epic") return "epic";
    return "common";
}

function ensureExpeditionStats(player) {
    player.expeditionStats = player.expeditionStats || {
        rareChanceBonus: 0,
        epicChanceBonus: 0,
        timeReductionSeconds: 0,
        timeBoostCharges: []
    };

    player.expeditionStats.rareChanceBonus = Math.max(
        0,
        Number(player.expeditionStats.rareChanceBonus) || 0
    );

    player.expeditionStats.epicChanceBonus = Math.max(
        0,
        Number(player.expeditionStats.epicChanceBonus) || 0
    );

    if (!Array.isArray(player.expeditionStats.timeBoostCharges)) {
        player.expeditionStats.timeBoostCharges = [];
    }

    player.expeditionStats.timeBoostCharges = player.expeditionStats.timeBoostCharges
        .map((value) => Math.max(0, Number(value) || 0))
        .filter((value) => value > 0)
        .sort((a, b) => a - b);

    player.expeditionBoost = Math.max(0, Number(player.expeditionBoost) || 0);
    player.expeditionBoostActiveUntil = Math.max(
        0,
        Number(player.expeditionBoostActiveUntil) || 0
    );

    if (
        player.expeditionBoostActiveUntil > 0 &&
        player.expeditionBoostActiveUntil <= Date.now()
    ) {
        player.expeditionBoost = 0;
        player.expeditionBoostActiveUntil = 0;
    }
}

function getRareChanceBonus(player) {
    ensureExpeditionStats(player);
    return Math.max(0, Number(player?.expeditionStats?.rareChanceBonus) || 0);
}

function getEpicChanceBonus(player) {
    ensureExpeditionStats(player);
    return Math.max(0, Number(player?.expeditionStats?.epicChanceBonus) || 0);
}

function getTimeBoostCharges(player) {
    ensureExpeditionStats(player);

    return Array.isArray(player?.expeditionStats?.timeBoostCharges)
        ? player.expeditionStats.timeBoostCharges
        : [];
}

function setTimeBoostCharges(player, charges) {
    ensureExpeditionStats(player);
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

function getDepositExpeditionBoostMultiplier(player) {
    ensureExpeditionStats(player);

    if ((Number(player?.expeditionBoostActiveUntil) || 0) <= Date.now()) {
        return 1;
    }

    const boost = Math.max(0, Number(player?.expeditionBoost) || 0);
    return 1 + boost;
}

function getDailyExpeditionBoostMultiplier(player) {
    const activeUntil = Math.max(0, Number(player?.dailyExpeditionBoost?.activeUntil) || 0);
    return activeUntil > Date.now() ? 1.25 : 1;
}

function getTotalExpeditionRewardMultiplier(player) {
    return getDepositExpeditionBoostMultiplier(player) * getDailyExpeditionBoostMultiplier(player);
}

function rollRewardRarity(player, expedition) {
    const epicChance = getEffectiveEpicChance(player, expedition);
    const rareChance = getEffectiveRareChance(player, expedition);
    const roll = Math.random();

    if (roll < epicChance) return "epic";
    if (roll < epicChance + rareChance) return "rare";
    return "common";
}

function getRarityCoinsMultiplier(rewardRarity) {
    if (rewardRarity === "rare") return 1.35;
    if (rewardRarity === "epic") return 1.95;
    return 1;
}

function getRarityRewardBalanceMultiplier(rewardRarity) {
    if (rewardRarity === "rare") return 1.35;
    if (rewardRarity === "epic") return 1.9;
    return 1;
}

function getCoinsReward(player, expedition, rewardRarity) {
    const baseCoins = Math.max(0, Number(expedition?.baseCoins) || 0);
    const boostMultiplier = getTotalExpeditionRewardMultiplier(player);
    const rarityMultiplier = getRarityCoinsMultiplier(rewardRarity);

    return Math.max(0, Math.floor(baseCoins * rarityMultiplier * boostMultiplier));
}

function getMaxCoinsRewardForExpedition(expedition, rewardRarity) {
    const baseCoins = Math.max(0, Number(expedition?.baseCoins) || 0);
    const rarityMultiplier = getRarityCoinsMultiplier(normalizeRewardRarity(rewardRarity));
    const theoreticalMaxBoostMultiplier = 2.0 * 1.25;

    return Math.max(0, Math.floor(baseCoins * rarityMultiplier * theoreticalMaxBoostMultiplier));
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
        jungle_scout: 1.00,
        jungle_river: 1.03,
        jungle_ruins: 1.06,
        jungle_canopy: 1.10,
        jungle_depths: 1.14,
        jungle_temple: 1.18,
        jungle_king: 1.22,
        desert_outpost: 1.26,
        desert_dunes: 1.30
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
    const rarityMultiplier = getRarityRewardBalanceMultiplier(rewardRarity);
    const boostMultiplier = getTotalExpeditionRewardMultiplier(player);

    const reward = hours * 0.024 * tierMultiplier * rarityMultiplier * boostMultiplier;

    return Number(reward.toFixed(3));
}

function getMaxRewardBalanceAmount(expeditionState) {
    const durationSeconds = Math.max(
        60,
        Number(expeditionState?.baseDuration) ||
        Number(expeditionState?.duration) ||
        60
    );

    const hours = durationSeconds / 3600;
    const tierMultiplier = getRewardTierMultiplier(expeditionState?.id);
    const rewardRarity = normalizeRewardRarity(expeditionState?.rewardRarity);
    const rarityMultiplier = getRarityRewardBalanceMultiplier(rewardRarity);
    const theoreticalMaxBoostMultiplier = 2.0 * 1.25;

    const reward = hours * 0.024 * tierMultiplier * rarityMultiplier * theoreticalMaxBoostMultiplier;

    return Number(reward.toFixed(3));
}

function normalizeSelectedAnimals(selectedAnimals) {
    if (!Array.isArray(selectedAnimals)) {
        return [];
    }

    return selectedAnimals
        .map((entry) => {
            if (typeof entry === "string") {
                return {
                    type: String(entry),
                    count: 1
                };
            }

            return {
                type: String(entry?.type || ""),
                count: Math.max(1, Math.floor(Number(entry?.count) || 1))
            };
        })
        .filter((entry) => entry.type);
}

function buildActiveExpedition(player, expedition, selectedAnimals = []) {
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
    const rewardBalance = getRewardBalanceAmount(player, {
        id: expedition.id,
        duration: baseDuration,
        baseDuration,
        rewardRarity
    });
    const startCostCoins = Math.max(0, Math.floor(Number(expedition?.startCostCoins) || 0));

    return {
        id: String(expedition.id || ""),
        regionId: String(expedition.regionId || ""),
        name: String(expedition.name || "Expedition"),
        startTime: now,
        endTime: now + baseDuration * 1000,
        duration: baseDuration,
        baseDuration,
        timeReductionUsed: 0,
        rewardRarity,
        rewardCoins,
        rewardGems,
        rewardBalance,
        startCostCoins,
        selectedAnimals: normalizeSelectedAnimals(selectedAnimals),
        claimed: false,
        collectedAt: 0
    };
}

function hasActiveExpedition(player) {
    return !!(player?.expedition && typeof player.expedition === "object");
}

function getActiveExpedition(player) {
    return hasActiveExpedition(player) ? player.expedition : null;
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

function sanitizeStoredCoinsReward(expeditionConfig, expeditionState) {
    const maxAllowed = getMaxCoinsRewardForExpedition(
        expeditionConfig,
        expeditionState?.rewardRarity
    );

    return clamp(
        Math.floor(Number(expeditionState?.rewardCoins) || 0),
        0,
        Math.max(0, maxAllowed)
    );
}

function sanitizeStoredGemsReward(expeditionState) {
    return clamp(
        Math.floor(Number(expeditionState?.rewardGems) || 0),
        0,
        2
    );
}

function sanitizeStoredRewardBalance(expeditionState) {
    const maxAllowed = getMaxRewardBalanceAmount(expeditionState);

    return clamp(
        normalizeRewardNumber(expeditionState?.rewardBalance, 0),
        0,
        Math.max(0, maxAllowed)
    );
}

router.get("/list", (req, res) => {
    try {
        return res.json({
            ok: true,
            expeditions: getAllExpeditions().filter((expedition) => expedition.enabled !== false)
        });
    } catch (error) {
        console.error("GET /api/expedition/list failed:", error);
        return res.status(500).json({
            error: "Expedition list load failed",
            details: error?.message || "Unknown server error"
        });
    }
});

router.post("/start", (req, res) => {
    try {
        const db = readDb();

        const telegramId = safeString(req.body?.telegramId, "");
        const username = safeString(req.body?.username, "Gracz");
        const expeditionId = safeString(req.body?.expeditionId, "");
        const selectedAnimals = req.body?.selectedAnimals;

        if (!telegramId) {
            return res.status(400).json({ error: "Missing telegramId" });
        }

        if (!expeditionId) {
            return res.status(400).json({ error: "Missing expeditionId" });
        }

        const expedition = getExpeditionById(expeditionId);
        if (!expedition || expedition.enabled === false) {
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
        player.expedition = buildActiveExpedition(player, expedition, selectedAnimals);
        player.updatedAt = Date.now();

        db.players[telegramId] = normalizePlayer(player);
        writeDb(db);

        return res.json({
            ok: true,
            expedition: db.players[telegramId].expedition,
            player: db.players[telegramId]
        });
    } catch (error) {
        console.error("POST /api/expedition/start failed:", error);
        return res.status(500).json({
            error: "Expedition start failed",
            details: error?.message || "Unknown server error"
        });
    }
});

router.post("/time-boost", (req, res) => {
    try {
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
    } catch (error) {
        console.error("POST /api/expedition/time-boost failed:", error);
        return res.status(500).json({
            error: "Expedition time boost failed",
            details: error?.message || "Unknown server error"
        });
    }
});

router.post("/collect", (req, res) => {
    try {
        const db = readDb();

        const telegramId = safeString(req.body?.telegramId, "");
        const username = safeString(req.body?.username, "Gracz");

        console.log("POST /api/expedition/collect", {
            telegramId,
            username,
            body: req.body
        });

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

        const expeditionConfig = getExpeditionById(expedition.id);
        if (!expeditionConfig) {
            return res.status(400).json({ error: "Expedition config not found" });
        }

        expedition.claimed = true;
        expedition.collectedAt = Date.now();

        const coins = sanitizeStoredCoinsReward(expeditionConfig, expedition);
        const gems = sanitizeStoredGemsReward(expedition);
        const rewardBalance = sanitizeStoredRewardBalance(expedition);

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
    } catch (error) {
        console.error("POST /api/expedition/collect failed:", error);
        return res.status(500).json({
            error: "Expedition collect failed",
            details: error?.message || "Unknown server error"
        });
    }
});

router.get("/:telegramId", (req, res) => {
    try {
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
    } catch (error) {
        console.error("GET /api/expedition/:telegramId failed:", error);
        return res.status(500).json({
            error: "Expedition state load failed",
            details: error?.message || "Unknown server error"
        });
    }
});

module.exports = router;